import React from 'react';
import { $e, Bi, ai, useToday } from './core';
import { useStore } from '../store/store';
import { nS } from '../i18n/labels';
import { he, ii } from './catalog';
import { taskTitle } from './plan-tasks';
import { mo } from './eligibility';

export function useI18n() {
  const { state: e } = useStore(),
    a = e.lang;
  return {
    lang: a,
    t: (r, o) => {
      const u = nS[r];
      let l = a === 'ru' ? (u.ru ?? Bi(u.en)) : (u[a] ?? u.en);
      if (o) for (const [c, p] of Object.entries(o)) l = l.replace(new RegExp(`\\{${c}\\}`, 'g'), String(p));
      return l;
    },
    tx: (r, o) => (a === 'uz' ? o : a === 'ru' ? Bi(r) : r),
    p: (r) => $e(r, a),
  };
}
export function deadlineStatus(e, a) {
  const t = e.deadline,
    n = e.source.verification_status === 'demo',
    s = t.date ? ai(a, t.date) : void 0;
  return t.status === 'closed'
    ? {
        kind: 'closed',
        date: t.date,
        days: s,
        isDemo: n,
      }
    : t.status === 'not_announced'
      ? {
          kind: 'not_announced',
          isDemo: n,
        }
      : t.status === 'varies'
        ? {
            kind: 'varies',
            isDemo: n,
          }
        : t.date
          ? s !== void 0 && s < 0
            ? {
                kind: 'closed',
                date: t.date,
                days: s,
                isDemo: n,
              }
            : t.status === 'unverified'
              ? {
                  kind: 'unverified',
                  date: t.date,
                  days: s,
                  isDemo: n,
                }
              : {
                  kind: n ? 'demo' : 'upcoming',
                  date: t.date,
                  days: s,
                  isDemo: n,
                }
          : {
              kind: 'unverified',
              isDemo: n,
            };
}
const sS = (e) => ({
  en: e,
  uz: e,
});
const rS = (e) =>
  e.category === 'exam'
    ? 'exam'
    : e.category === 'reference'
      ? 'reference'
      : e.category === 'custom'
        ? 'milestone'
        : 'document';
function buildEvents(e, a, t, n) {
  var o;
  const s = [],
    r = new Set([...e.map((u) => u.oppId), ...a]);
  for (const u of r) {
    const l = he(u);
    if (!l || !l.deadline.date) continue;
    const c = deadlineStatus(l, n);
    s.push({
      id: `dl-${u}`,
      date: l.deadline.date,
      title: {
        en: `${l.kind === 'program' ? l.university : l.name} — deadline`,
        uz: `${l.kind === 'program' ? l.university : l.name} — muddat`,
      },
      kind: l.kind === 'scholarship' ? 'scholarship' : 'university',
      trust: c.isDemo
        ? 'demo'
        : l.deadline.status === 'verified' || l.deadline.status === 'closed'
          ? 'verified'
          : 'unverified',
      oppId: u,
      appId: (o = e.find((p) => p.oppId === u)) == null ? void 0 : o.id,
    });
  }
  for (const u of e) {
    const l = he(u.oppId);
    for (const c of u.tasks) {
      if (!c.due) continue;
      const p = taskTitle(c),
        d = l ? (l.kind === 'program' ? l.university : l.name) : '';
      s.push({
        id: `task-${u.id}-${c.id}`,
        date: c.due,
        title: {
          en: `${p.en} · ${d}`,
          uz: `${p.uz} · ${d}`,
        },
        kind: rS(c),
        trust: c.dueSource === 'student' ? 'student' : 'suggested',
        appId: u.id,
        taskId: c.id,
        oppId: u.oppId,
        done: c.done,
      });
    }
  }
  for (const u of t)
    s.push({
      id: `custom-${u.id}`,
      date: u.date,
      title: sS(u.title),
      kind: u.kind,
      trust: 'student',
      customId: u.id,
      oppId: u.oppId,
    });
  return s.sort((u, l) => u.date.localeCompare(l.date));
}
function buildNotices(e, a, t, n) {
  const s = [],
    r = [...t].sort((u, l) => u - l);
  for (const u of a) {
    if (u.done) continue;
    const l = ai(n, u.date);
    if (l < 0) continue;
    const c = r.find((d) => l <= d);
    if (c === void 0) continue;
    const p = u.trust === 'unverified';
    s.push({
      id: `${u.id}@${c}`,
      level: l <= 3 ? 'urgent' : l <= 14 ? 'soon' : 'info',
      title:
        l === 0
          ? {
              en: `Due today: ${u.title.en}`,
              uz: `Bugun: ${u.title.uz}`,
            }
          : {
              en: `${l} day${l === 1 ? '' : 's'} left: ${u.title.en}`,
              uz: `${l} kun qoldi: ${u.title.uz}`,
            },
      body: p
        ? {
            en: 'This date is not verified. Confirm it on the official website.',
            uz: 'Bu sana tasdiqlanmagan. Rasmiy saytda tekshiring.',
          }
        : u.trust === 'demo'
          ? {
              en: 'Demo date for demonstration only.',
              uz: 'Faqat namoyish uchun sana.',
            }
          : {
              en: `Reminder set for ${c} days before.`,
              uz: `${c} kun oldin eslatma.`,
            },
      oppId: u.oppId,
      appId: u.appId,
      date: u.date,
    });
  }
  for (const u of e) {
    const l = he(u.oppId);
    if (!l || !l.deadline.date || ['submitted', 'awaiting', 'accepted', 'rejected', 'withdrawn'].includes(u.stage))
      continue;
    const c = ai(n, l.deadline.date);
    if (c < 0 || c > 30) continue;
    const p = u.tasks.filter((m) => m.done && m.mandatory).map((m) => taskTitle(m)),
      d = u.tasks.filter((m) => !m.done && m.mandatory).map((m) => taskTitle(m));
    if (!d.length) continue;
    const h = l.kind === 'program' ? l.university : l.name;
    s.push({
      id: `intel-${u.id}-${l.deadline.date}-${d.length}`,
      level: c <= 7 ? 'urgent' : 'soon',
      title: {
        en: `${h}: deadline in ${c} days`,
        uz: `${h}: muddatga ${c} kun qoldi`,
      },
      body: {
        en: `${
          p.length
            ? `Done: ${p
                .slice(0, 3)
                .map((m) => m.en)
                .join(', ')}${p.length > 3 ? '…' : ''}. `
            : ''
        }Still outstanding: ${d
          .slice(0, 3)
          .map((m) => m.en)
          .join(
            ', ',
          )}${d.length > 3 ? ` and ${d.length - 3} more` : ''}. Review the official instructions${d.some((m) => /referee|recommend/i.test(m.en)) ? ' and contact your referee as soon as possible' : ''}.`,
        uz: `${
          p.length
            ? `Bajarilgan: ${p
                .slice(0, 3)
                .map((m) => m.uz)
                .join(', ')}${p.length > 3 ? '…' : ''}. `
            : ''
        }Hali qolgan: ${d
          .slice(0, 3)
          .map((m) => m.uz)
          .join(
            ', ',
          )}${d.length > 3 ? ` va yana ${d.length - 3} ta` : ''}. Rasmiy ko‘rsatmalarni qayta o‘qing${d.some((m) => /tavsiya/i.test(m.uz)) ? ' va tavsiya beruvchi bilan imkon qadar tez bog‘laning' : ''}.`,
      },
      oppId: l.id,
      appId: u.id,
      date: l.deadline.date,
    });
  }
  const o = {
    urgent: 0,
    soon: 1,
    info: 2,
  };
  return s.sort((u, l) => o[u.level] - o[l.level] || (u.date ?? '').localeCompare(l.date ?? ''));
}
export function planUrgency(e, a, t) {
  const n = deadlineStatus(a, t),
    s = n.days ?? 400,
    r = n.kind === 'upcoming' || n.kind === 'unverified' || n.kind === 'demo' ? 0 : 200,
    o = e.priority === 'high' ? -30 : e.priority === 'low' ? 30 : 0,
    u = e.tasks.filter((l) => l.mandatory && !l.done).length;
  return s + r + o - u * 2;
}
export function useDerivedData() {
  const { state: e } = useStore(),
    a = useToday(),
    t = React.useMemo(() => {
      const o = new Map();
      if (e.profile) for (const u of ii) o.set(u.id, mo(e.profile, u, e.rates));
      return o;
    }, [e.profile, e.rates]),
    n = React.useMemo(
      () => buildEvents(e.applications, e.saved, e.customEvents, a),
      [e.applications, e.saved, e.customEvents, a],
    ),
    s = React.useMemo(() => buildNotices(e.applications, n, e.reminders, a), [e.applications, n, e.reminders, a]),
    r = s.filter((o) => !e.readNotices.includes(o.id));
  return {
    today: a,
    matches: t,
    events: n,
    notices: s,
    unread: r,
  };
}
export function profileCompletion(e) {
  if (!e) return 0;
  const a = [
    !!e.name,
    !!e.citizenship,
    !!e.field,
    !!e.targetLevel,
    !!e.institution,
    e.score !== void 0,
    !!e.graduationYear,
    e.ielts !== void 0 || e.toefl !== void 0 || e.planningExam,
    e.tuitionBudget !== void 0,
    e.totalBudget !== void 0,
    e.preferredCountries.length > 0,
    Object.values(e.experiences).some((t) => t && t.trim()),
    e.birthYear !== void 0,
  ];
  return Math.round((a.filter(Boolean).length / a.length) * 100);
}
export const Vg = 180;
