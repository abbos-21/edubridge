import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { GUIDE_IMAGE } from '../lib/guide';
import { useStore } from '../store/AppStore';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Short messages after an action ("Saved", "Task completed"), and the plan milestone messages
 * (halfway, all required tasks done, submitted). They never block anything and disappear on their own.
 */
type Toast = { id: number; text: string; celebrate?: boolean };
type Ctx = { notify: (text: string, opts?: { celebrate?: boolean }) => void };
const ToastCtx = createContext<Ctx>({ notify: () => {} });
export const useToast = () => useContext(ToastCtx).notify;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { tx } = useI18n();
  const { workspace } = useStore();
  const [items, setItems] = useState<Toast[]>([]);
  const next = useRef(1);
  const notify = useCallback<Ctx['notify']>((text, opts) => {
    const id = next.current++;
    setItems((l) => [...l.slice(-2), { id, text, celebrate: opts?.celebrate }]);
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(16px,env(safe-area-inset-bottom,0px))+56px)] z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite">
        {items.map((t) => <ToastItem key={t.id} toast={t} image={GUIDE_IMAGE[workspace.guide]} onClose={() => setItems((l) => l.filter((x) => x.id !== t.id))} closeLabel={tx('Close', 'Yopish')} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, image, onClose, closeLabel }: { toast: Toast; image: string; onClose: () => void; closeLabel: string }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const t = window.setTimeout(() => close.current(), toast.celebrate ? 7000 : 3500);
    return () => window.clearTimeout(t);
  }, [toast.id, toast.celebrate]);
  return (
    <div role="status" className="pointer-events-auto relative flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface p-3 pr-9 shadow-xl">
      {toast.celebrate && <img src={image} alt="" className="h-14 w-14 shrink-0 object-contain" />}
      <p className="text-[14px] font-semibold leading-snug text-fg">{toast.text}</p>
      <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute right-2 top-2 rounded-md p-1 text-muted hover:bg-sunken"><X size={14} aria-hidden /></button>
    </div>
  );
}

/** The plan milestone message for a change in progress, or null. */
export function milestone(before: { pct: number; stage: string }, after: { pct: number; stage: string }, tx: (en: string, uz: string) => string): string | null {
  if (after.stage === 'submitted' && before.stage !== 'submitted') return tx('Application submitted. Well done! Save your confirmation and watch for a decision.', 'Ariza topshirildi. Barakalla! Tasdiqni saqlang va qarorni kuting.');
  if (after.pct === 100 && before.pct < 100) return tx('Every required task is ticked off. Do the final review before you submit.', 'Barcha majburiy vazifalar bajarildi. Topshirishdan oldin yakuniy tekshiruvni o‘tkazing.');
  if (after.pct >= 50 && before.pct < 50) return tx('Halfway there! Half of the required tasks are done. Keep going.', 'Yarmiga yetdingiz! Majburiy vazifalarning yarmi bajarildi. Davom eting.');
  return null;
}
