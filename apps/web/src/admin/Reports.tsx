import { useState } from 'react';
import { Badge, Button, Card, Field, Input, Select } from '../components/ui';
import { admin, errorText, type AuditRow, type EntityType, type Finding, type UserRow } from './adminApi';
import { Problems, Table, useLoad, when } from './parts';

type Open = (type: EntityType, id: string) => void;

export function AuditLog() {
  const [action, setAction] = useState('');
  const [entityId, setEntityId] = useState('');
  const [more, setMore] = useState<AuditRow[]>([]);
  const first = useLoad(() => admin.audit({ limit: '50', ...(action ? { action } : {}), ...(entityId ? { entityId } : {}) }), [action, entityId]);
  const [loadingMore, setLoadingMore] = useState(false);
  const rows = [...(first.data?.items ?? []), ...more];
  const next = more.length ? null : first.data?.next; // simple paging: one extra page at a time

  const loadMore = async () => {
    if (!first.data?.next) return;
    setLoadingMore(true);
    try { setMore((await admin.audit({ limit: '50', before: first.data.next, ...(action ? { action } : {}), ...(entityId ? { entityId } : {}) })).items); } finally { setLoadingMore(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Field label="Action starts with"><Input value={action} onChange={(e) => { setAction(e.target.value); setMore([]); }} placeholder="revision." /></Field>
        <Field label="Record id"><Input value={entityId} onChange={(e) => { setEntityId(e.target.value); setMore([]); }} /></Field>
      </div>
      <Problems error={first.error} />
      <Table label="Audit log" head={['When', 'Who', 'Action', 'Record', 'Details']}>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-line align-top">
            <td className="py-1 pr-3 whitespace-nowrap">{when(r.createdAt)}</td>
            <td className="py-1 pr-3">{r.actor ? `${r.actor.displayName ?? r.actor.id.slice(0, 8)} (${r.actor.role ?? '?'})` : 'system'}</td>
            <td className="py-1 pr-3 font-mono text-xs">{r.action}</td>
            <td className="py-1 pr-3">{r.entityType}/{r.entityId.slice(0, 40)}</td>
            <td className="py-1">{r.diff ? <details><summary className="cursor-pointer text-xs">show</summary><pre className="max-h-48 overflow-auto text-xs">{JSON.stringify(r.diff, null, 1)}</pre></details> : '—'}</td>
          </tr>
        ))}
      </Table>
      {next && <Button disabled={loadingMore} onClick={() => void loadMore()}>Load older entries</Button>}
    </div>
  );
}

export function GapsView({ onOpen }: { onOpen: Open }) {
  const [days, setDays] = useState(180);
  const g = useLoad(() => admin.gaps(days), [days]);
  const chk = useLoad(() => admin.check(), []);
  const link = (id: string, name: string) => <button className="font-semibold underline-offset-2 hover:underline" onClick={() => onOpen('university', id)}>{name}</button>;
  if (g.error) return <Problems error={g.error} />;
  if (!g.data) return <p role="status" className="text-muted">Loading…</p>;
  const d = g.data;
  return (
    <div className="space-y-4">
      <Card className="space-y-1">
        <h2 className="font-extrabold">Batch check</h2>
        {chk.data && (chk.data.ok ? <p className="text-ok">All {chk.data.universities} universities pass the structure and source rules ({chk.data.hidden} hidden).</p> : <ul className="list-disc pl-5 text-sm text-bad">{[...chk.data.problems, ...chk.data.violations.map((v) => `${v.id}: ${v.message}`), ...chk.data.invalid.map((i) => `${i.id}: ${i.issues.map((x) => x.message).join('; ')}`)].map((x, i) => <li key={i}>{x}</li>)}</ul>)}
        <Button size="sm" onClick={() => void chk.reload()}>Run again</Button>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-extrabold">Levels with links only ({d.totals.linksOnlyLevels})</h2>
        <p className="text-sm text-muted">These levels have source links but no requirement facts yet. Fill them from the official pages; leave a value empty if it cannot be confirmed.</p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">{d.linksOnly.map((x) => <li key={x.id + x.level}>{link(x.id, x.name)} <Badge>{x.level}</Badge> <span className="text-muted">{x.country}</span></li>)}</ul>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-extrabold">Missing QS positions ({d.totals.missingQs})</h2>
        <ul className="text-sm">{d.missingQs.map((x) => <li key={x.id}>{link(x.id, x.name)} <span className="text-muted">{x.country}</span></li>)}</ul>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-extrabold">Not checked for {d.staleDays} days ({d.totals.stale})</h2>
        <Field label="Days"><Select value={days} onChange={(e) => setDays(Number(e.target.value))}>{[30, 90, 180, 365].map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>
        <ul className="text-sm">{d.stale.map((x) => <li key={x.id}>{link(x.id, x.name)} <span className="text-muted">last checked {x.lastChecked ?? 'never'}{x.ageDays != null ? ` (${x.ageDays} days)` : ''}</span></li>)}</ul>
      </Card>
      <p className="text-sm text-muted">Russian: {d.russianInRecords.withoutRussian} of {d.russianInRecords.texts} catalogue texts have no Russian inside the record. {d.russianInRecords.note}</p>
    </div>
  );
}

export function Users({ selfId }: { selfId: string }) {
  const [q, setQ] = useState('');
  const u = useLoad(() => admin.users(q), [q]);
  const [err, setErr] = useState<string | null>(null);
  const act = async (fn: () => Promise<unknown>) => { setErr(null); try { await fn(); await u.reload(); } catch (e) { setErr(errorText(e)); } };
  return (
    <div className="space-y-3">
      <Field label="Search by name or id"><Input value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      <Problems error={u.error ?? err} />
      <Table label="Users" head={['User', 'Role', 'Joined', 'AI today', 'AI this month', 'AI']}>
        {u.data?.items.map((r: UserRow) => (
          <tr key={r.id} className="border-t border-line">
            <td className="py-1 pr-3">{r.displayName ?? r.id.slice(0, 8)} <span className="text-xs text-muted">{r.providers.join(', ')}</span></td>
            <td className="py-1 pr-3">
              <Select aria-label={`Role of ${r.displayName ?? r.id.slice(0, 8)}`} value={r.role} disabled={r.id === selfId} onChange={(e) => void act(() => admin.setRole(r.id, e.target.value))}>
                {['student', 'editor', 'admin'].map((x) => <option key={x}>{x}</option>)}
              </Select>
            </td>
            <td className="py-1 pr-3">{r.createdAt.slice(0, 10)}</td>
            <td className="py-1 pr-3">{r.aiToday}/{u.data?.dailyLimit}</td>
            <td className="py-1 pr-3">{r.aiMonthRequests} · ${r.aiMonthCostUsd.toFixed(2)}</td>
            <td className="py-1"><Button size="sm" onClick={() => void act(() => admin.setAiSuspended(r.id, !r.suspendedAi))}>{r.suspendedAi ? 'Restore AI' : 'Suspend AI'}</Button></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

export function UsageView() {
  const [days, setDays] = useState(30);
  const u = useLoad(() => admin.usage(days), [days]);
  if (u.error) return <Problems error={u.error} />;
  if (!u.data) return <p role="status" className="text-muted">Loading…</p>;
  const d = u.data;
  const max = Math.max(0.0001, ...d.perDay.map((x) => x.costUsd));
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="font-extrabold">This month</h2>
        <p>${d.month.spentUsd.toFixed(2)} of ${d.month.budgetUsd} ({d.month.percent ?? 0}%) · {d.month.requests} requests · {d.today.requests} today (limit {d.today.dailyLimitPerUser} per user)</p>
        <div className="h-3 rounded-full bg-sunken" role="img" aria-label={`${d.month.percent ?? 0}% of the monthly budget used`}><div className={'h-3 rounded-full ' + (d.month.paused ? 'bg-bad' : 'bg-brand')} style={{ width: `${Math.min(100, d.month.percent ?? 0)}%` }} /></div>
        {d.month.paused && <p className="font-semibold text-bad">The AI is paused: the monthly budget is used up.</p>}
        {!d.aiEnabled && <p className="font-semibold text-warn">The AI is switched off (AI_ENABLED).</p>}
        <p className="text-xs text-muted">{d.note}</p>
      </Card>
      <Field label="Period"><Select value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 30, 90].map((n) => <option key={n} value={n}>{n} days</option>)}</Select></Field>
      <Card className="space-y-1">
        <h2 className="font-extrabold">Per day</h2>
        <div className="flex h-28 items-end gap-1" role="img" aria-label="Estimated cost per day">
          {d.perDay.map((x) => <div key={x.day} title={`${x.day}: $${x.costUsd.toFixed(2)}, ${x.requests} requests`} className="min-w-[4px] flex-1 rounded-t bg-brand" style={{ height: `${Math.max(3, (x.costUsd / max) * 100)}%` }} />)}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h2 className="mb-1 font-extrabold">Per task</h2><Table label="Cost per task" head={['Task', 'Requests', 'Cost']}>{d.perTask.map((x) => <tr key={x.task} className="border-t border-line"><td className="py-1 pr-3">{x.task}</td><td className="py-1 pr-3">{x.requests}</td><td className="py-1">${x.costUsd.toFixed(2)}</td></tr>)}</Table></Card>
        <Card><h2 className="mb-1 font-extrabold">Top users</h2><Table label="Cost per user" head={['User', 'Requests', 'Cost']}>{d.perUser.map((x) => <tr key={x.userId} className="border-t border-line"><td className="py-1 pr-3">{x.displayName ?? x.userId.slice(0, 8)}{x.suspendedAi ? ' (suspended)' : ''}</td><td className="py-1 pr-3">{x.requests}</td><td className="py-1">${x.costUsd.toFixed(2)}</td></tr>)}</Table></Card>
      </div>
    </div>
  );
}

const KIND_TONE = { changed: 'warn', broken: 'bad', blocked: 'info', moved: 'warn' } as const;
const KIND_HELP = {
  changed: 'The page text changed since the last check. A person must read it before any value is edited.',
  broken: 'The link did not load (error, timeout or removed).',
  blocked: 'The site refuses automated reading. Open it yourself; the checker never works around this.',
  moved: 'The link now ends up at a different address.',
} as const;

/** Monthly recheck results. Findings are suggestions; accepting one only opens a draft for an editor. */
export function RecheckView({ isAdmin, onOpen }: { isAdmin: boolean; onOpen: Open }) {
  const [kind, setKind] = useState('');
  const runs = useLoad(() => admin.recheckRuns(), []);
  const found = useLoad(() => admin.findings(kind), [kind]);
  const manual = useLoad(() => admin.manualLinks(), []);
  const [msg, setMsg] = useState<string | null>(null);
  const act = async (fn: () => Promise<unknown>, done?: string) => {
    setMsg(null);
    try {
      await fn();
      if (done) setMsg(done);
      await Promise.all([found.reload(), runs.reload(), manual.reload()]);
    } catch (e) {
      setMsg(errorText(e));
    }
  };
  const last = runs.data?.items.find((r) => r.status === 'done');
  const active = runs.data?.items.find((r) => r.status === 'queued' || r.status === 'running');
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="font-extrabold">Link recheck</h2>
        <p className="text-sm text-muted">Every month the worker reads each source link politely (it identifies itself, follows robots.txt and never logs in). It only reports. Nothing is published or edited without an editor and an admin.</p>
        {last && <p className="text-sm">Last finished run: {when(last.finishedAt)} — {last.summary?.urls ?? 0} links, {last.summary?.changed ?? 0} changed, {last.summary?.broken ?? 0} broken, {last.summary?.blocked ?? 0} refuse automation, {last.summary?.moved ?? 0} moved.</p>}
        {active && <p role="status" className="text-sm text-warn">A run is {active.status}. The worker picks it up within a minute.</p>}
        {isAdmin && <Button disabled={!!active} onClick={() => void act(() => admin.recheckRun(), 'Recheck queued.')}>Run the recheck now</Button>}
        {msg && <p role="status" className="text-sm">{msg}</p>}
      </Card>
      <div className="flex flex-wrap items-center gap-2">
        <Field label="Show">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All open findings</option>
            {(['changed', 'broken', 'moved', 'blocked'] as const).map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
        </Field>
      </div>
      <Problems error={found.error} />
      {found.data && found.data.items.length === 0 && <p className="text-muted">No open findings.</p>}
      <ul className="space-y-3">
        {found.data?.items.map((f: Finding) => (
          <li key={f.id}>
            <Card className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={KIND_TONE[f.kind]}>{f.kind}</Badge>
                <a href={f.url} target="_blank" rel="noreferrer noopener" className="break-all text-sm font-semibold">{f.url}</a>
              </div>
              <p className="text-xs text-muted">{KIND_HELP[f.kind]} {f.note && f.kind !== 'moved' ? `(${f.note})` : ''} {f.httpStatus ? `HTTP ${f.httpStatus}.` : ''} {f.kind === 'moved' && f.finalUrl ? `Now: ${f.finalUrl}` : ''}</p>
              <p className="text-xs text-muted">Checked {when(f.checkedAt)} · previously {when(f.previouslyCheckedAt)}</p>
              <p className="text-sm">
                Used by:{' '}
                {f.entities.map((e, i) => (
                  <span key={i}><button className="font-semibold underline-offset-2 hover:underline" onClick={() => onOpen(e.type as EntityType, e.id)}>{e.id}</button> <span className="text-muted">({e.field})</span>{i < f.entities.length - 1 ? ', ' : ''}</span>
                ))}
              </p>
              {f.snippet && <pre className="max-h-40 overflow-auto rounded-xl bg-sunken p-2 text-xs">{f.snippet}</pre>}
              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" onClick={() => void act(async () => { const r = await admin.acceptFinding(f.id); onOpen(r.entityType, r.entityId); })}>Accept: open a draft</Button>
                  <Button size="sm" onClick={() => void act(() => admin.dismissFinding(f.id))}>Dismiss</Button>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
      <Card className="space-y-2">
        <h2 className="font-extrabold">Needs a manual check ({manual.data?.items.length ?? 0})</h2>
        <p className="text-sm text-muted">These sites refuse automatic reading. Open them yourself now and then, then press "I checked it".</p>
        <ul className="space-y-1 text-sm">
          {manual.data?.items.map((m) => (
            <li key={m.url} className="flex flex-wrap items-center gap-2">
              <a href={m.url} target="_blank" rel="noreferrer noopener" className="break-all">{m.url}</a>
              <span className="text-xs text-muted">last checked {when(m.lastCheckedAt)}</span>
              <Button size="sm" onClick={() => void act(() => admin.manualChecked(m.url))}>I checked it</Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
