import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Notice, Tabs } from '../components/ui';
import { navigate } from '../lib/router';
import type { EntityType } from './adminApi';
import { Records } from './Records';
import { ReviewQueue } from './Review';
import { AuditLog, GapsView, RecheckView, UsageView, Users } from './Reports';

type Tab = 'records' | 'review' | 'recheck' | 'gaps' | 'audit' | 'users' | 'ai';

/**
 * #admin. This screen only reflects the role; every admin API call is checked again on the server,
 * so hiding a tab here is a convenience, not the protection.
 * The admin area is a staff tool and is written in English only.
 */
export default function Admin({ tab }: { tab: string | null }) {
  const { me, status } = useAuth();
  const loading = status === 'loading';
  const [open, setOpen] = useState<{ type: EntityType; id: string } | null>(null);
  const current = (['records', 'review', 'recheck', 'gaps', 'audit', 'users', 'ai'] as Tab[]).includes(tab as Tab) ? (tab as Tab) : 'records';
  const go = (t: Tab) => navigate('admin', t);
  const openRecord = (type: EntityType, id: string) => { setOpen({ type, id }); go('records'); };

  if (loading) return <p role="status" className="py-10 text-center text-muted">…</p>;
  if (!me) return <Notice title="Sign in required">The admin area is for editors and admins. <a href="#signin">Sign in</a>.</Notice>;
  if (me.role === 'student') return <Notice tone="warn" title="No access">Your account is not an editor or admin account.</Notice>;

  const isAdmin = me.role === 'admin';
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'records', label: 'Catalogue' },
    { id: 'review', label: 'Review queue' },
    { id: 'recheck', label: 'Link recheck' },
    { id: 'gaps', label: 'Data gaps' },
    { id: 'audit', label: 'Audit log' },
    ...(isAdmin ? ([{ id: 'users', label: 'Users' }, { id: 'ai', label: 'AI cost' }] as Array<{ id: Tab; label: string }>) : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-extrabold">Admin</h1>
        <span className="text-sm text-muted">Signed in as {me.role}. Changes need a recent sign-in.</span>
      </div>
      <Tabs label="Admin sections" value={current} onChange={go} tabs={tabs} />
      {current === 'records' && <Records key={open ? `${open.type}:${open.id}` : 'none'} role={me.role} initialType={open?.type} initialId={open?.id} />}
      {current === 'review' && <ReviewQueue onOpen={openRecord} />}
      {current === 'recheck' && <RecheckView isAdmin={isAdmin} onOpen={openRecord} />}
      {current === 'gaps' && <GapsView onOpen={openRecord} />}
      {current === 'audit' && <AuditLog />}
      {current === 'users' && isAdmin && <Users selfId={me.id} />}
      {current === 'ai' && isAdmin && <UsageView />}
    </div>
  );
}
