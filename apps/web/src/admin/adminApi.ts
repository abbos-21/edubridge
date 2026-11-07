import { api } from '../lib/api';

/** Typed calls to /api/v1/admin/*. The server decides who may do what; the screens only reflect it. */
export type EntityType = 'university' | 'grant';
export type Issue = { rule: string; path: string; message: string };
export type Change = { path: string; before: unknown; after: unknown };
export type RevStatus = 'draft' | 'in_review' | 'rejected' | 'published' | 'superseded';

export type EntityRow = {
  id: string; name: string; country: string; status: 'published' | 'hidden'; version: number;
  lastChecked: string | null; detail: string | null; reviewedAt: string | null;
  openRevision: { id: string; status: RevStatus } | null;
};
export type RevisionRow = { id: string; entityType: EntityType; entityId: string; version: number; status: RevStatus; authorId: string | null; reviewedBy: string | null; reviewedAt: string | null; comment: string | null; createdAt: string };
export type RevisionDetail = { revision: RevisionRow; data: Record<string, any>; published: Record<string, any> | null; changes: Change[]; issues: Issue[]; stale: boolean };
export type EntityDetail = { record: Record<string, any>; status: string; version: number; mark: { reviewedAt: string | null; note: string | null } | null; revisions: RevisionRow[]; sources: Array<{ id: string; url: string; field: string; lastCheckedAt: string | null; lastStatus: string | null; blocksAutomation: boolean }> };
export type AuditRow = { id: string; action: string; entityType: string; entityId: string; diff: unknown; createdAt: string; actor: { id: string; displayName: string | null; role: string | null } | null };
export type UserRow = { id: string; displayName: string | null; role: 'student' | 'editor' | 'admin'; lang: string; createdAt: string; suspendedAi: boolean; providers: string[]; aiToday: number; aiMonthRequests: number; aiMonthCostUsd: number };
export type Gaps = {
  totals: { universities: number; linksOnlyLevels: number; missingQs: number; stale: number };
  linksOnly: Array<{ id: string; name: string; country: string; level: string }>;
  missingQs: Array<{ id: string; name: string; country: string }>;
  stale: Array<{ id: string; name: string; country: string; lastChecked: string | null; ageDays: number | null }>;
  russianInRecords: { texts: number; withoutRussian: number; note: string };
  staleDays: number;
};
export type Usage = {
  note: string; days: number; aiEnabled: boolean;
  month: { requests: number; spentUsd: number; budgetUsd: number; percent: number | null; paused: boolean };
  today: { requests: number; dailyLimitPerUser: number };
  perDay: Array<{ day: string; requests: number; costUsd: number }>;
  perTask: Array<{ task: string; requests: number; costUsd: number }>;
  perUser: Array<{ userId: string; displayName: string | null; suspendedAi: boolean; requests: number; costUsd: number }>;
  byStatus: Record<string, number>;
};
export type CheckReport = { ok: boolean; universities: number; hidden: number; problems: string[]; violations: Array<{ rule: string; id: string; message: string }>; invalid: Array<{ id: string; issues: Issue[] }> };

const body = (b: unknown) => ({ method: 'POST', body: b ?? {} });

export type Finding = { id: string; kind: 'changed' | 'broken' | 'blocked' | 'moved'; status: string; url: string; entities: Array<{ type: string; id: string; field: string }>; snippet: string | null; httpStatus: number | null; finalUrl: string | null; note: string | null; previouslyCheckedAt: string | null; checkedAt: string };
export type RunRow = { id: string; status: string; trigger: string; createdAt: string; startedAt: string | null; finishedAt: string | null; summary: Record<string, any> | null };
export type ManualRow = { url: string; lastCheckedAt: string | null; entities: Array<{ type: string; id: string; field: string }> };

export const admin = {
  recheckRuns: () => api<{ items: RunRow[] }>('/admin/recheck/runs'),
  recheckRun: () => api<{ id: string }>('/admin/recheck/run', { method: 'POST', body: {} }),
  findings: (kind: string) => api<{ items: Finding[] }>(`/admin/recheck/findings?status=open${kind ? `&kind=${kind}` : ''}`),
  acceptFinding: (id: string) => api<{ revisionId: string; entityType: EntityType; entityId: string; created: boolean }>(`/admin/recheck/findings/${id}/accept`, { method: 'POST', body: {} }),
  dismissFinding: (id: string, note?: string) => api(`/admin/recheck/findings/${id}/dismiss`, { method: 'POST', body: { note } }),
  manualLinks: () => api<{ items: ManualRow[] }>('/admin/recheck/manual'),
  manualChecked: (url: string) => api('/admin/recheck/manual/checked', { method: 'POST', body: { url } }),
  me: () => api<{ role: string; reauthRequiredAfter: string }>('/admin/me'),
  entities: (q: { type: EntityType; q?: string; country?: string; status?: string }) => api<{ items: EntityRow[] }>(`/admin/entities?${new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][])}`),
  entity: (t: EntityType, id: string) => api<EntityDetail>(`/admin/entities/${t}/${encodeURIComponent(id)}`),
  reviewed: (t: EntityType, id: string, reviewed: boolean) => api(`/admin/entities/${t}/${encodeURIComponent(id)}/reviewed`, body({ reviewed })),
  hide: (t: EntityType, id: string, hidden: boolean, reason: string) => api(`/admin/entities/${t}/${encodeURIComponent(id)}/hide`, body({ hidden, reason })),
  revisions: (status: string) => api<{ items: RevisionRow[] }>(`/admin/revisions?status=${status}`),
  revision: (id: string) => api<RevisionDetail>(`/admin/revisions/${id}`),
  startDraft: (entityType: EntityType, entityId: string) => api<RevisionRow>('/admin/revisions', body({ entityType, entityId })),
  saveDraft: (id: string, data: unknown) => api<{ changes: number }>(`/admin/revisions/${id}`, { method: 'PUT', body: { data } }),
  discard: (id: string) => api(`/admin/revisions/${id}`, { method: 'DELETE' }),
  submit: (id: string) => api(`/admin/revisions/${id}/submit`, body({})),
  approve: (id: string, comment?: string) => api(`/admin/revisions/${id}/approve`, body({ comment })),
  reject: (id: string, comment: string) => api(`/admin/revisions/${id}/reject`, body({ comment })),
  audit: (q: Record<string, string>) => api<{ items: AuditRow[]; next: string | null }>(`/admin/audit?${new URLSearchParams(q)}`),
  gaps: (staleDays: number) => api<Gaps>(`/admin/gaps?staleDays=${staleDays}`),
  check: () => api<CheckReport>('/admin/check'),
  users: (q: string) => api<{ items: UserRow[]; dailyLimit: number }>(`/admin/users?${new URLSearchParams(q ? { q } : {})}`),
  setRole: (id: string, role: string) => api(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  setAiSuspended: (id: string, suspended: boolean) => api(`/admin/users/${id}/ai`, { method: 'PATCH', body: { suspended } }),
  usage: (days: number) => api<Usage>(`/admin/ai/usage?days=${days}`),
  saveSnapshot: (kind: 'document_analysis' | 'interview_feedback' | 'coach_plan', title: string, lang: string, payload: unknown) =>
    api<{ id: string; mock: boolean }>('/admin/demo-snapshots', body({ kind, title, lang, payload })),
  deleteSnapshot: (id: string) => api(`/admin/demo-snapshots/${id}`, { method: 'DELETE' }),
  exportUrl: (type: EntityType, format: 'json' | 'csv') => `/api/v1/admin/export?type=${type}&format=${format}`,
};

export const snapshots = {
  list: () => api<{ items: Array<{ id: string; kind: string; title: string; lang: string | null; mock: boolean; savedAt: string }> }>('/demo-snapshots'),
  get: (id: string) => api<{ id: string; kind: string; title: string; lang: string | null; mock: boolean; savedAt: string; payload: any }>(`/demo-snapshots/${id}`),
};

export const errorText = (e: unknown): string => {
  const x = e as { code?: string; message?: string; details?: { issues?: Issue[] } };
  if (x?.code === 'reauth_required') return 'Your sign-in is too old for changes. Sign out and sign in again, then retry.';
  if (x?.details?.issues?.length) return `${x.message}: ${x.details.issues.map((i) => `${i.path || i.rule}: ${i.message}`).join('; ')}`;
  return x?.message ?? 'Something went wrong';
};

/** `a.b.0.c` helpers for editing nested records. */
export function getPath(o: any, path: string): any {
  return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
}
export function setPath<T>(o: T, path: string, value: unknown): T {
  const copy: any = structuredClone(o);
  const keys = path.split('.');
  let cur = copy;
  keys.slice(0, -1).forEach((k, i) => {
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = /^\d+$/.test(keys[i + 1]!) ? [] : {};
    cur = cur[k];
  });
  cur[keys[keys.length - 1]!] = value;
  return copy;
}
