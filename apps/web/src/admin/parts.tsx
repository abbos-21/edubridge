import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Badge } from '../components/ui';
import { errorText, type Change, type RevStatus } from './adminApi';

/** Runs a loader and keeps data / error / reload together. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    setLoading(true);
    return fn().then((d) => { setData(d); setError(null); }, (e) => setError(errorText(e))).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { void run(); }, [run]);
  return { data, error, loading, reload: run };
}

const show = (v: unknown): string => {
  if (v === null || v === undefined) return '—';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 300 ? s.slice(0, 300) + '…' : s;
};

/** Side-by-side list of what a draft changes against the published record. */
export function DiffTable({ changes }: { changes: Change[] }) {
  if (!changes.length) return <p className="text-sm text-muted">No changes against the published record.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" aria-label="Changes against the published record">
        <thead><tr className="text-muted"><th className="py-1 pr-3">Field</th><th className="py-1 pr-3">Published now</th><th className="py-1">This draft</th></tr></thead>
        <tbody>
          {changes.map((c) => (
            <tr key={c.path} className="border-t border-line align-top">
              <td className="py-1 pr-3 font-mono text-xs">{c.path}</td>
              <td className="py-1 pr-3 text-bad">{show(c.before)}</td>
              <td className="py-1 text-ok">{show(c.after)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TONE: Record<RevStatus, 'neutral' | 'warn' | 'bad' | 'ok' | 'info'> = { draft: 'neutral', in_review: 'info', rejected: 'bad', published: 'ok', superseded: 'neutral' };
export const StatusBadge = ({ status }: { status: RevStatus }) => <Badge tone={TONE[status]}>{status.replace('_', ' ')}</Badge>;

export const when = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—');

export function Problems({ error }: { error: string | null }) {
  return error ? <p role="alert" className="text-sm text-bad">{error}</p> : null;
}

export function Table({ head, children, label }: { head: string[]; children: ReactNode; label: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" aria-label={label}>
        <thead><tr className="text-muted">{head.map((h) => <th key={h} className="py-1 pr-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
