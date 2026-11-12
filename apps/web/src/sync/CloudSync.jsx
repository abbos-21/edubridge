import React from 'react';
import { api, ApiError } from '../lib/api';
import { useStore } from '../store/store';
import { useDerivedData } from '../lib/derived';
import { as as defaultState } from '../lib/plan-tasks';
import { useSession } from './session';

/**
 * Keeps the student's app state in their account. The state object is stored as documents (the same field lists as
 * the server's STATE_DOCS). Rules: nothing is sent for guests; the fictional demo student is never uploaded; a
 * rejected write (409) means another device changed the document, and the server copy wins.
 */
export const DOCS = {
  core: ['lang', 'displayCurrency', 'rates', 'reminders', 'readNotices', 'compare', 'saved', 'finder', 'mascot', 'liveAI', 'aiOff'],
  profile: ['profile', 'onboardingDraft'],
  plans: ['applications', 'customEvents', 'budgets', 'comparisons'],
  writing: ['drafts', 'cvText', 'consistency', 'growth'],
  ai: ['chat', 'chatThreads', 'interviews', 'advisorDocs'],
};
const DEBOUNCE_MS = 800;
const slice = (state, fields) => Object.fromEntries(fields.filter((f) => state[f] !== undefined).map((f) => [f, state[f]]));

export function CloudSync() {
  const { state, replaceState } = useStore();
  const session = useSession();
  const { events } = useDerivedData();
  const userId = session.me?.id ?? null;
  const [ready, setReady] = React.useState(false);
  const versions = React.useRef({});
  const lastSent = React.useRef({});
  const defaults = React.useMemo(() => defaultState(), []);

  // ---- pull once after sign-in -----------------------------------------------------------------
  React.useEffect(() => {
    setReady(false);
    versions.current = {};
    lastSent.current = {};
    if (!userId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { docs } = await api('/me/state');
        if (cancelled) return;
        const patch = {};
        for (const [key, doc] of Object.entries(docs)) {
          versions.current[key] = doc.version;
          if (DOCS[key]) {
            Object.assign(patch, doc.data);
            lastSent.current[key] = JSON.stringify(slice({ ...defaults, ...doc.data }, DOCS[key]));
          }
        }
        if (Object.keys(patch).length) replaceState((s) => ({ ...s, ...patch, demo: null }));
      } catch {
        /* the account could not be read: keep working locally and try again on the next change */
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ---- push changes ---------------------------------------------------------------------------
  const push = React.useCallback(
    async (key, data) => {
      const json = JSON.stringify(data);
      try {
        const body = { data, ...(versions.current[key] != null ? { version: versions.current[key] } : {}) };
        const res = await api(`/me/state/${key}`, { method: 'PUT', body });
        versions.current[key] = res.version;
        lastSent.current[key] = json;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409 && e.details?.server) {
          const server = e.details.server;
          versions.current[key] = server.version;
          lastSent.current[key] = JSON.stringify(slice({ ...defaults, ...server.data }, DOCS[key] ?? []));
          if (DOCS[key]) replaceState((s) => ({ ...s, ...server.data }));
        }
      }
    },
    [replaceState, defaults],
  );

  const docJson = {};
  for (const [key, fields] of Object.entries(DOCS)) {
    // a demo student's profile and everything derived from it is never sent
    docJson[key] = state.demo && (key === 'profile' || key === 'plans') ? null : JSON.stringify(slice(state, fields));
  }
  const calendar = React.useMemo(
    () => (state.demo ? null : { events: events.map((e) => ({ id: e.id, date: e.date, title: e.title, kind: e.kind, trust: e.trust, done: !!e.done })), reminderDays: state.reminders }),
    [events, state.reminders, state.demo],
  );
  docJson.calendar = calendar ? JSON.stringify(calendar) : null;
  const signature = Object.values(docJson).join('|');

  React.useEffect(() => {
    if (!ready || !userId || state.demo) return undefined;
    const timer = setTimeout(() => {
      for (const [key, json] of Object.entries(docJson)) {
        if (json === null || json === lastSent.current[key]) continue;
        const data = JSON.parse(json);
        // do not create empty documents for fields still at their defaults
        const isDefault = key !== 'calendar' && json === JSON.stringify(slice(defaults, DOCS[key]));
        if (isDefault && versions.current[key] == null) continue;
        void push(key, data);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [signature, ready, userId, state.demo]);

  return null;
}
