import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Button, Input } from '../components/ui';
import { useStore } from '../store/AppStore';
import { admin, errorText } from './adminApi';

/**
 * Admin only (the server checks again): saves the AI result on screen as a demo snapshot, so it opens
 * instantly in the demo, labelled "saved on <date>". Never shown to students.
 */
export function SaveAsDemo({ kind, payload, suggestedTitle }: { kind: 'document_analysis' | 'interview_feedback' | 'coach_plan'; payload: unknown; suggestedTitle: string }) {
  const { me } = useAuth();
  const { lang } = useStore();
  const [title, setTitle] = useState(suggestedTitle);
  const [state, setState] = useState<{ msg: string; bad?: boolean } | null>(null);
  if (me?.role !== 'admin') return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line p-2 text-sm" data-testid="save-demo">
      <span className="font-semibold">Admin:</span>
      <Input aria-label="Demo snapshot title" value={title} onChange={(e) => setTitle(e.target.value)} className="min-w-[12rem] flex-1" />
      <Button size="sm" onClick={async () => {
        try { const r = await admin.saveSnapshot(kind, title.trim(), lang, payload); setState({ msg: r.mock ? 'Saved (marked as a sample, because the AI is in mock mode).' : 'Saved as a demo analysis.' }); } catch (e) { setState({ msg: errorText(e), bad: true }); }
      }}>Save as demo analysis</Button>
      {state && <span role="status" className={state.bad ? 'text-bad' : 'text-ok'}>{state.msg}</span>}
    </div>
  );
}
