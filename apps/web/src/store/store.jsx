import React from 'react';
import { Overrides } from '../data/raw';
import { api } from '../lib/api';
import { getSession } from '../sync/session';
import * as jsxRuntime from 'react/jsx-runtime';
import { He, useToday } from '../lib/core';
import { Kd, he } from '../lib/catalog';
import { $j, Eh, Hg, Kg, as, eS } from '../lib/plan-tasks';

function createStore() {
  const [e, a] = React.useState(() => ({ ...$j(), dataOverrides: { ...Overrides } })),
    t = React.useRef(e);
  t.current = e;
  const [n, s] = React.useState(Eh),
    [r, o] = React.useState(null),
    u = React.useRef(void 0);
  (React.useEffect(() => {
    try {
      localStorage.setItem(Kg, JSON.stringify(e));
    } catch {}
  }, [e]),
    React.useEffect(() => {
      document.documentElement.lang = e.lang;
    }, [e.lang]),
    React.useEffect(() => {
      const h = () => {
        window.location.hash.replace(/^#/, '') &&
          s((y) => {
            const E = Eh();
            return E.page === y.page && E.id === y.id ? y : E;
          });
      };
      return (window.addEventListener('hashchange', h), () => window.removeEventListener('hashchange', h));
    }, []));
  const l = React.useCallback((h, m) => {
      const y = m ? `${h}--${m}` : h;
      try {
        window.location.hash.replace(/^#/, '') !== y && window.history.replaceState(null, '', `#${y}`);
      } catch {}
      s({
        page: h,
        id: m,
      });
      try {
        window.scrollTo({
          top: 0,
        });
      } catch {}
    }, []),
    c = React.useCallback((h) => {
      (window.clearTimeout(u.current),
        o({
          id: Date.now(),
          text: h,
        }),
        (u.current = window.setTimeout(() => o(null), 3200)));
    }, []),
    p = React.useCallback((h) => a(h), []),
    d = React.useMemo(
      () => ({
        setLang: (h) =>
          p((m) => ({
            ...m,
            lang: h,
          })),
        saveOnboardingDraft: (h) =>
          p((m) => ({
            ...m,
            onboardingDraft: h,
          })),
        setProfile: (h) =>
          p((m) => ({
            ...m,
            profile: {
              ...h,
              completedAt: useToday(),
            },
            onboardingDraft: null,
          })),
        updateProfile: (h) =>
          p((m) =>
            m.profile
              ? {
                  ...m,
                  profile: {
                    ...m.profile,
                    ...h,
                  },
                }
              : m,
          ),
        startDemo: (h) => p((m) => eS(h, m)),
        resetAll: () =>
          p((h) => ({
            ...as(),
            lang: h.lang,
            mascot: h.mascot,
          })),
        toggleSave: (h) =>
          p((m) => ({
            ...m,
            saved: m.saved.includes(h) ? m.saved.filter((y) => y !== h) : [...m.saved, h],
          })),
        toggleCompare: (h) =>
          p((m) => ({
            ...m,
            compare: m.compare.includes(h) ? m.compare.filter((y) => y !== h) : [...m.compare, h].slice(-4),
          })),
        clearCompare: () =>
          p((h) => ({
            ...h,
            compare: [],
          })),
        addToPlan: (h) => {
          const m = t.current,
            y = m.applications.find((v) => v.oppId === h);
          if (y) return y.id;
          const E = he(h);
          if (!E) return '';
          const C = Hg(E, m.profile, useToday());
          return (
            a((v) =>
              v.applications.some((g) => g.oppId === h)
                ? v
                : {
                    ...v,
                    applications: [...v.applications, C],
                    saved: v.saved.includes(h) ? v.saved : [...v.saved, h],
                  },
            ),
            C.id
          );
        },
        removePlan: (h) =>
          p((m) => ({
            ...m,
            applications: m.applications.filter((y) => y.id !== h),
          })),
        setStage: (h, m) =>
          p((y) => ({
            ...y,
            applications: y.applications.map((E) =>
              E.id === h
                ? {
                    ...E,
                    stage: m,
                  }
                : E,
            ),
          })),
        setPriority: (h, m) =>
          p((y) => ({
            ...y,
            applications: y.applications.map((E) =>
              E.id === h
                ? {
                    ...E,
                    priority: m,
                  }
                : E,
            ),
          })),
        updateTask: (h, m, y) =>
          p((E) => ({
            ...E,
            applications: E.applications.map((C) =>
              C.id === h
                ? {
                    ...C,
                    tasks: C.tasks.map((v) =>
                      v.id === m
                        ? {
                            ...v,
                            ...y,
                          }
                        : v,
                    ),
                  }
                : C,
            ),
          })),
        addTask: (h, m, y) =>
          p((E) => ({
            ...E,
            applications: E.applications.map((C) =>
              C.id === h
                ? {
                    ...C,
                    tasks: [
                      ...C.tasks,
                      {
                        id: He(),
                        title: m,
                        category: 'custom',
                        mandatory: !1,
                        done: !1,
                        notes: '',
                        due: y,
                        dueSource: y ? 'student' : void 0,
                      },
                    ],
                  }
                : C,
            ),
          })),
        removeTask: (h, m) =>
          p((y) => ({
            ...y,
            applications: y.applications.map((E) =>
              E.id === h
                ? {
                    ...E,
                    tasks: E.tasks.filter((C) => C.id !== m),
                  }
                : E,
            ),
          })),
        addEvent: (h) =>
          p((m) => ({
            ...m,
            customEvents: [
              ...m.customEvents,
              {
                ...h,
                id: He(),
              },
            ],
          })),
        updateEvent: (h, m) =>
          p((y) => ({
            ...y,
            customEvents: y.customEvents.map((E) =>
              E.id === h
                ? {
                    ...E,
                    ...m,
                  }
                : E,
            ),
          })),
        removeEvent: (h) =>
          p((m) => ({
            ...m,
            customEvents: m.customEvents.filter((y) => y.id !== h),
          })),
        setReminders: (h) =>
          p((m) => ({
            ...m,
            reminders: h,
          })),
        markRead: (h) =>
          p((m) => ({
            ...m,
            readNotices: [...new Set([...m.readNotices, ...h])],
          })),
        upsertDraft: (h) =>
          p((m) => ({
            ...m,
            drafts: m.drafts.some((y) => y.id === h.id)
              ? m.drafts.map((y) => (y.id === h.id ? h : y))
              : [...m.drafts, h],
          })),
        upsertBudget: (h) =>
          p((m) => ({
            ...m,
            budgets: m.budgets.some((y) => y.id === h.id)
              ? m.budgets.map((y) => (y.id === h.id ? h : y))
              : [...m.budgets, h],
          })),
        removeBudget: (h) =>
          p((m) => ({
            ...m,
            budgets: m.budgets.filter((y) => y.id !== h),
          })),
        saveComparison: (h, m) =>
          p((y) => ({
            ...y,
            comparisons: [
              ...y.comparisons,
              {
                id: He(),
                name: h,
                ids: m,
                at: useToday(),
              },
            ],
          })),
        removeComparison: (h) =>
          p((m) => ({
            ...m,
            comparisons: m.comparisons.filter((y) => y.id !== h),
          })),
        loadComparison: (h) =>
          p((m) => ({
            ...m,
            compare: h,
          })),
        setRate: (h, m) =>
          p((y) => ({
            ...y,
            rates: {
              ...y.rates,
              [h]: m,
            },
          })),
        resetRates: () =>
          p((h) => ({
            ...h,
            rates: {
              ...Kd,
            },
          })),
        pushChat: (h) =>
          p((m) => ({
            ...m,
            chat: [...m.chat, h].slice(-40),
          })),
        replaceLastChat: (h) =>
          p((m) => ({
            ...m,
            chat: [...m.chat.slice(0, -1), h],
          })),
        clearChat: () =>
          p((h) => ({
            ...h,
            chat: [],
          })),
        setLiveAI: (h) =>
          p((m) => ({
            ...m,
            liveAI: h,
            aiOff: !h,
          })),
        newChat: () =>
          p((h) => {
            var m;
            return h.chat.length
              ? {
                  ...h,
                  chat: [],
                  chatThreads: [
                    {
                      id: He(),
                      title: (((m = h.chat.find((y) => y.role === 'user')) == null ? void 0 : m.text) ?? '').slice(
                        0,
                        70,
                      ),
                      at: new Date().toISOString(),
                      msgs: h.chat,
                    },
                    ...h.chatThreads,
                  ].slice(0, 15),
                }
              : h;
          }),
        openThread: (h) =>
          p((m) => {
            var v;
            const y = m.chatThreads.find((g) => g.id === h);
            if (!y) return m;
            const E = m.chatThreads.filter((g) => g.id !== h),
              C = m.chat.length
                ? [
                    {
                      id: He(),
                      title: (((v = m.chat.find((g) => g.role === 'user')) == null ? void 0 : v.text) ?? '').slice(
                        0,
                        70,
                      ),
                      at: new Date().toISOString(),
                      msgs: m.chat,
                    },
                    ...E,
                  ]
                : E;
            return {
              ...m,
              chat: y.msgs,
              chatThreads: C.slice(0, 15),
            };
          }),
        deleteThread: (h) =>
          p((m) => ({
            ...m,
            chatThreads: m.chatThreads.filter((y) => y.id !== h),
          })),
        upsertAdvisorDoc: (h) =>
          p((m) => ({
            ...m,
            advisorDocs: m.advisorDocs.some((y) => y.id === h.id)
              ? m.advisorDocs.map((y) => (y.id === h.id ? h : y))
              : [h, ...m.advisorDocs],
          })),
        removeAdvisorDoc: (h) =>
          p((m) => ({
            ...m,
            advisorDocs: m.advisorDocs.filter((y) => y.id !== h),
          })),
        upsertInterview: (h) =>
          p((m) => ({
            ...m,
            interviews: m.interviews.some((y) => y.id === h.id)
              ? m.interviews.map((y) => (y.id === h.id ? h : y))
              : [h, ...m.interviews].slice(0, 10),
          })),
        removeInterview: (h) =>
          p((m) => ({
            ...m,
            interviews: m.interviews.filter((y) => y.id !== h),
          })),
        upsertGrowth: (h) =>
          p((m) => ({
            ...m,
            growth: (m.growth ?? []).some((y) => y.id === h.id)
              ? m.growth.map((y) => (y.id === h.id ? h : y))
              : [...(m.growth ?? []), h],
          })),
        removeGrowth: (h) =>
          p((m) => ({
            ...m,
            growth: (m.growth ?? []).filter((y) => y.id !== h),
          })),
        setConsistency: (h, m) =>
          p((y) => ({
            ...y,
            consistency: {
              ...y.consistency,
              [h]: {
                at: new Date().toISOString(),
                result: m,
              },
            },
          })),
        setDisplayCurrency: (h) =>
          p((m) => ({
            ...m,
            displayCurrency: h,
          })),
        setCvText: (h) =>
          p((m) => ({
            ...m,
            cvText: h,
          })),
        setFinder: (h) =>
          p((m) => ({
            ...m,
            finder: h,
          })),
        setMascot: (h) =>
          p((m) => ({
            ...m,
            mascot: h,
          })),
        setOverride: (h, m) =>
          p((y) => {
            const E = {
              ...y.dataOverrides,
            };
            return (
              m === null
                ? delete E[h]
                : (E[h] = {
                    ...E[h],
                    ...m,
                  }),
              {
                ...y,
                dataOverrides: E,
              }
            );
          }),
        /** Staff decisions are shared: after the local change, send the whole overrides object to the server. */
        publishOverrides: (h) => {
          const me = getSession().me;
          if (me?.role !== 'editor' && me?.role !== 'admin') return Promise.resolve(false);
          return api('/admin/catalog/overrides', { method: 'PUT', body: { value: h } }).then(() => true, () => false);
        },
      }),
      [p],
    );
  return {
    state: e,
    route: n,
    navigate: l,
    toast: r,
    notify: c,
    replaceState: p,
    ...d,
  };
}
const Yg = React.createContext(null);
export function StoreProvider({ children: e }) {
  const a = createStore();
  return <Yg.Provider value={a}>{e}</Yg.Provider>;
}
export function useStore() {
  const e = React.useContext(Yg);
  if (!e) throw new Error('StoreProvider missing');
  return e;
}
