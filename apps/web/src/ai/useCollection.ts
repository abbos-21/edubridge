import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../auth/AuthProvider';

/** A private collection stored in the student's account (documents, chats, interviews). Needs sign-in. */
export type Versioned = { id: string; version: number };

export function useCollection<T extends Versioned>(path: 'documents' | 'chats' | 'interviews' | 'events') {
  const { me } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!me) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ items: T[] }>(`/me/${path}`);
      if (alive.current) {
        setItems(r.items);
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError(e instanceof ApiError ? e.code : 'network');
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [me, path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (body: Record<string, unknown>): Promise<T> => {
      const row = await api<T>(`/me/${path}`, { method: 'POST', body });
      setItems((l) => [row, ...l]);
      return row;
    },
    [path],
  );

  /** Update with the version the caller has; a stale version throws ApiError(409) carrying the server copy. */
  const update = useCallback(
    async (id: string, version: number, body: Record<string, unknown>): Promise<T> => {
      const row = await api<T>(`/me/${path}/${id}`, { method: 'PUT', body: { ...body, version } });
      setItems((l) => l.map((x) => (x.id === id ? row : x)));
      return row;
    },
    [path],
  );

  const remove = useCallback(
    async (id: string) => {
      await api(`/me/${path}/${id}`, { method: 'DELETE' });
      setItems((l) => l.filter((x) => x.id !== id));
    },
    [path],
  );

  return { items, loading, error, reload, create, update, remove, signedIn: !!me };
}
