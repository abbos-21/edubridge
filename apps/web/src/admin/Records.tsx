import { useEffect, useState } from 'react';
import { Badge, Button, Card, Field, Input, Notice, Select } from '../components/ui';
import { admin, errorText, getPath, setPath, type EntityRow, type EntityType, type Issue, type RevisionDetail } from './adminApi';
import { DiffTable, Problems, StatusBadge, Table, useLoad, when } from './parts';
import { ReviewActions } from './Review';

/** Catalogue editor: find a record, start a draft, edit with sources, send for review. */
export function Records({ role, initialType, initialId }: { role: string; initialType?: EntityType; initialId?: string }) {
  const [type, setType] = useState<EntityType>(initialType ?? 'university');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState<string | null>(initialId ?? null);
  const list = useLoad(() => admin.entities({ type, q, status }), [type, q, status]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select aria-label="Record type" value={type} onChange={(e) => { setType(e.target.value as EntityType); setSel(null); }}>
            <option value="university">Universities</option>
            <option value="grant">Scholarships</option>
          </Select>
          <Select aria-label="Visibility" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Shown and hidden</option>
            <option value="published">Shown</option>
            <option value="hidden">Hidden</option>
          </Select>
          <Input aria-label="Search records" placeholder="Search by name or id" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-[10rem] flex-1" />
        </div>
        <Problems error={list.error} />
        <Table label="Catalogue records" head={['Name', 'Country', 'Checked', 'State']}>
          {list.data?.items.map((r) => <Row key={r.id} r={r} active={sel === r.id} onOpen={() => setSel(r.id)} />)}
        </Table>
        <div className="flex gap-2 text-sm">
          <a href={admin.exportUrl(type, 'csv')}>Export CSV</a>
          <a href={admin.exportUrl(type, 'json')}>Export JSON</a>
        </div>
      </div>
      <div>{sel ? <Editor key={`${type}:${sel}`} type={type} id={sel} role={role} onChanged={() => void list.reload()} /> : <p className="text-muted">Choose a record to see it, start a draft, or mark it reviewed.</p>}</div>
    </div>
  );
}

function Row({ r, active, onOpen }: { r: EntityRow; active: boolean; onOpen: () => void }) {
  return (
    <tr className={'border-t border-line ' + (active ? 'bg-sunken' : '')}>
      <td className="py-1 pr-3"><button className="text-left font-semibold underline-offset-2 hover:underline" onClick={onOpen} aria-label={`Open ${r.name}`}>{r.name}</button></td>
      <td className="py-1 pr-3">{r.country}</td>
      <td className="py-1 pr-3">{r.lastChecked ?? '—'}</td>
      <td className="space-x-1 py-1">
        {r.status === 'hidden' && <Badge tone="bad">hidden</Badge>}
        {r.openRevision && <StatusBadge status={r.openRevision.status} />}
        {r.reviewedAt && <Badge tone="ok">reviewed</Badge>}
      </td>
    </tr>
  );
}

function Editor({ type, id, role, onChanged }: { type: EntityType; id: string; role: string; onChanged: () => void }) {
  const ent = useLoad(() => admin.entity(type, id), [type, id]);
  const open = ent.data?.revisions.find((r) => ['draft', 'in_review', 'rejected'].includes(r.status));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); await ent.reload(); onChanged(); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };

  if (ent.error) return <Problems error={ent.error} />;
  if (!ent.data) return <p role="status" className="text-muted">Loading…</p>;
  const e = ent.data;
  const name = e.record.name as string;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-extrabold">{name}</h2>
        <Badge>{e.status}</Badge>
        <span className="text-sm text-muted">version {e.version}</span>
      </div>
      <Problems error={err} />
      <div className="flex flex-wrap gap-2">
        {!open && <Button variant="primary" disabled={busy} onClick={() => void act(() => admin.startDraft(type, id))}>Start a draft</Button>}
        <Button disabled={busy} onClick={() => void act(() => admin.reviewed(type, id, !e.mark?.reviewedAt))}>{e.mark?.reviewedAt ? 'Clear reviewed mark' : 'Mark as reviewed'}</Button>
      </div>
      {e.mark?.reviewedAt && <p className="text-xs text-muted">Reviewed {when(e.mark.reviewedAt)}</p>}
      {role === 'admin' && (
        <div className="flex flex-wrap items-end gap-2">
          <Field label={e.status === 'hidden' ? 'Reason to show again' : 'Reason to hide from students'}>
            <Input value={reason} onChange={(ev) => setReason(ev.target.value)} />
          </Field>
          <Button disabled={busy || reason.trim().length < 3} onClick={() => void act(async () => { await admin.hide(type, id, e.status !== 'hidden', reason); setReason(''); })}>{e.status === 'hidden' ? 'Show' : 'Hide'}</Button>
        </div>
      )}
      {open ? <DraftEditor key={open.id} revId={open.id} role={role} onDone={() => { void ent.reload(); onChanged(); }} /> : <PublishedView record={e.record} sources={e.sources.length} />}
    </Card>
  );
}

function PublishedView({ record, sources }: { record: Record<string, any>; sources: number }) {
  return (
    <details>
      <summary className="cursor-pointer text-sm font-semibold">Published record ({sources} source links tracked)</summary>
      <pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-sunken p-3 text-xs">{JSON.stringify(record, null, 2)}</pre>
    </details>
  );
}

const LEVELS = ['bachelor', 'master'] as const;

function DraftEditor({ revId, role, onDone }: { revId: string; role: string; onDone: () => void }) {
  const rev = useLoad(() => admin.revision(revId), [revId]);
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const [json, setJson] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => { if (rev.data) { setDraft(rev.data.data); setJson(JSON.stringify(rev.data.data, null, 2)); } }, [rev.data]);
  if (rev.error) return <Problems error={rev.error} />;
  if (!rev.data || !draft) return <p role="status" className="text-muted">Loading draft…</p>;
  const d: RevisionDetail = rev.data;
  const editable = d.revision.status === 'draft' || d.revision.status === 'rejected';
  const type = d.revision.entityType;

  const update = (path: string, value: unknown) => { const n = setPath(draft, path, value); setDraft(n); setJson(JSON.stringify(n, null, 2)); setNote(null); };
  const text = (path: string, label: string, kind: 'text' | 'number' | 'date' = 'text') => (
    <Field label={label}>
      <Input type={kind === 'number' ? 'number' : 'text'} step={kind === 'number' ? 'any' : undefined} placeholder={kind === 'date' ? 'YYYY-MM-DD' : undefined} disabled={!editable} value={getPath(draft, path) ?? ''}
        onChange={(e) => update(path, e.target.value === '' ? null : kind === 'number' ? Number(e.target.value) : e.target.value)} />
    </Field>
  );
  const lines = (path: string, label: string) => (
    <Field label={label}>
      <textarea disabled={!editable} className="min-h-[70px] w-full rounded-xl border border-line bg-surface p-2 text-sm" value={((getPath(draft, path) as string[] | undefined) ?? []).join('\n')}
        onChange={(e) => update(path, e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
    </Field>
  );
  const trio = (path: string, label: string) => (
    <fieldset className="space-y-1 rounded-xl border border-line p-2">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      {(['en', 'uz', 'ru'] as const).map((l) => (
        <Field key={l} label={`${label} (${l.toUpperCase()})`}>
          <textarea disabled={!editable} className="min-h-[50px] w-full rounded-xl border border-line bg-surface p-2 text-sm" value={getPath(draft, `${path}.${l}`) ?? ''} onChange={(e) => update(`${path}.${l}`, e.target.value)} />
        </Field>
      ))}
    </fieldset>
  );

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true); setErr(null); setIssues([]);
    try { await fn(); if (done) setNote(done); await rev.reload(); onDone(); } catch (e) {
      const x = e as { details?: { issues?: Issue[] } };
      setIssues(x.details?.issues ?? []);
      setErr(errorText(e));
    } finally { setBusy(false); }
  };

  const applyJson = () => {
    try { const o = JSON.parse(json); if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error(); setDraft(o); setErr(null); setNote('Advanced JSON applied to the form. Save to check it against the rules.'); } catch { setErr('That is not valid JSON.'); }
  };

  return (
    <div className="space-y-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={d.revision.status} />
        {d.stale && <Badge tone="bad">stale: the published record changed after this draft began</Badge>}
        {d.revision.comment && <span className="text-sm">Reviewer: “{d.revision.comment}”</span>}
      </div>

      {editable && (
        <>
          <Notice tone="warn" title="Rules">Every official value needs a source link and the record needs a check date. New or changed texts need English, Uzbek and Russian. Nothing here reaches students until an admin approves it.</Notice>
          {type === 'university' ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {text('website', 'Official website')}
                {text('lastChecked', 'Check date', 'date')}
                {text('ranking.value', 'QS rank (as published)')}
                {text('ranking.source.url', 'QS source page')}
              </div>
              {LEVELS.filter((l) => draft.levels?.[l]).map((l) => (
                <fieldset key={l} className="space-y-2 rounded-xl border border-line p-3">
                  <legend className="px-1 font-bold capitalize">{l}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label={`${l}: open for Uzbek students`}>
                      <Select disabled={!editable} value={getPath(draft, `levels.${l}.open`) ?? 'unknown'} onChange={(e) => update(`levels.${l}.open`, e.target.value)}>
                        {['yes', 'no', 'integrated', 'unknown'].map((o) => <option key={o}>{o}</option>)}
                      </Select>
                    </Field>
                    {text(`levels.${l}.ielts`, `${l}: IELTS`, 'number')}
                    <Field label={`${l}: IELTS applies to`}>
                      <Select disabled={!editable} value={getPath(draft, `levels.${l}.ieltsScope`) ?? ''} onChange={(e) => update(`levels.${l}.ieltsScope`, e.target.value || null)}>
                        <option value="">—</option><option value="general">whole university</option><option value="programme">specific programme</option>
                      </Select>
                    </Field>
                    {text(`levels.${l}.tuition.amount`, `${l}: tuition amount`, 'number')}
                    {text(`levels.${l}.tuition.currency`, `${l}: tuition currency`)}
                    {text(`levels.${l}.tuition.per`, `${l}: tuition per (year, semester…)`)}
                    {text(`levels.${l}.tuition.source`, `${l}: tuition source link`)}
                    {text(`levels.${l}.deadline.date`, `${l}: deadline date`, 'date')}
                    {text(`levels.${l}.deadline.source`, `${l}: deadline source link`)}
                    {text(`levels.${l}.apply`, `${l}: application link`)}
                  </div>
                  {lines(`levels.${l}.sources`, `${l}: source links (one per line)`)}
                  {trio(`levels.${l}.note`, `${l} note`)}
                </fieldset>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {text('name', 'Name')}
                {text('checked', 'Check date', 'date')}
                {text('url', 'Main link')}
              </div>
              {lines('sources', 'Source links (one per line)')}
              {trio('who', 'Who can apply')}
            </div>
          )}
          <details>
            <summary className="cursor-pointer text-sm font-semibold">Advanced: edit every field as JSON</summary>
            <textarea aria-label="Record as JSON" className="mt-2 min-h-[260px] w-full rounded-xl border border-line bg-surface p-2 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
            <Button size="sm" onClick={applyJson}>Apply JSON to the form</Button>
          </details>
        </>
      )}

      <h3 className="font-bold">Changes against the published record</h3>
      <DiffTable changes={d.changes} />

      {issues.length > 0 && (
        <div role="alert" className="rounded-xl border border-bad/40 p-3 text-sm">
          <p className="font-bold text-bad">This draft breaks the data rules:</p>
          <ul className="list-disc pl-5">{issues.map((i, k) => <li key={k}><span className="font-mono text-xs">{i.path || i.rule}</span> — {i.message}</li>)}</ul>
        </div>
      )}
      {d.issues.length > 0 && issues.length === 0 && <p className="text-sm text-warn">{d.issues.length} rule problem(s) in the saved draft. Open “Save draft” to see them.</p>}
      <Problems error={err} />
      {note && <p role="status" className="text-sm text-ok">{note}</p>}

      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={busy} onClick={() => void run(() => admin.saveDraft(revId, draft), 'Draft saved.')}>Save draft</Button>
          <Button disabled={busy} onClick={() => void run(() => admin.submit(revId), 'Sent for review.')}>Send for review</Button>
          <Button disabled={busy} onClick={() => { if (confirm('Discard this draft?')) void run(async () => { await admin.discard(revId); }); }}>Discard draft</Button>
        </div>
      )}
      {d.revision.status === 'in_review' && (role === 'admin' ? <ReviewActions revId={revId} stale={d.stale} onDone={onDone} /> : <p className="text-sm text-muted">Waiting for an admin to review.</p>)}
    </div>
  );
}
