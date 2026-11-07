import { useState } from 'react';
import { Button, Field, Input } from '../components/ui';
import { admin, errorText } from './adminApi';
import { Problems, StatusBadge, Table, useLoad, when } from './parts';

/** Approve (publish) or reject a revision that is in review. Admin only; the server enforces it. */
export function ReviewActions({ revId, stale, onDone }: { revId: string; stale: boolean; onDone: () => void }) {
  const [comment, setComment] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); onDone(); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2 rounded-xl border border-line p-3">
      <h3 className="font-bold">Review</h3>
      <Field label="Comment (required to reject)"><Input value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      <Problems error={err} />
      <div className="flex gap-2">
        <Button variant="primary" disabled={busy || stale} onClick={() => void go(() => admin.approve(revId, comment || undefined))}>Approve and publish</Button>
        <Button disabled={busy || comment.trim().length < 3} onClick={() => void go(() => admin.reject(revId, comment))}>Reject</Button>
      </div>
      {stale && <p className="text-sm text-warn">The published record changed after this draft began. Reject it so the editor can start again.</p>}
    </div>
  );
}

/** Everything waiting for a decision, oldest first. */
export function ReviewQueue({ onOpen }: { onOpen: (type: 'university' | 'grant', id: string) => void }) {
  const q = useLoad(() => admin.revisions('open'), []);
  return (
    <div className="space-y-3">
      <Problems error={q.error} />
      {q.data && q.data.items.length === 0 && <p className="text-muted">Nothing is waiting.</p>}
      {q.data && q.data.items.length > 0 && (
        <Table label="Open revisions" head={['Record', 'Type', 'State', 'Started', '']}>
          {[...q.data.items].reverse().map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className="py-1 pr-3 font-semibold">{r.entityId}</td>
              <td className="py-1 pr-3">{r.entityType}</td>
              <td className="py-1 pr-3"><StatusBadge status={r.status} /></td>
              <td className="py-1 pr-3">{when(r.createdAt)}</td>
              <td className="py-1"><Button size="sm" onClick={() => onOpen(r.entityType, r.entityId)} aria-label={`Open ${r.entityId}`}>Open</Button></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
