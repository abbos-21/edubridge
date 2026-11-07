import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'md' | 'sm' };
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button({ variant = 'secondary', size = 'md', className, ...p }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 min-h-[44px] px-4',
        size === 'sm' && 'min-h-[40px] px-3 text-sm',
        variant === 'primary' && 'bg-brand text-brand-fg hover:opacity-90',
        variant === 'secondary' && 'border border-line bg-surface hover:bg-sunken',
        variant === 'ghost' && 'hover:bg-sunken',
        className,
      )}
    />
  );
});

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-card border border-line bg-surface p-4 sm:p-5', className)} />;
}

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info' | 'brand';
const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-muted',
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  bad: 'bg-bad/10 text-bad',
  info: 'bg-info/10 text-info',
  brand: 'bg-brand-soft text-brand',
};
export function Badge({ tone = 'neutral', className, ...p }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span {...p} className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)} />;
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn'; title?: string; children: ReactNode }) {
  const Icon = tone === 'warn' ? AlertTriangle : Info;
  return (
    <div role="note" className={cx('flex gap-3 rounded-xl border p-3 text-sm', tone === 'warn' ? 'border-warn/40 bg-warn/10' : 'border-info/30 bg-info/10')}>
      <Icon size={18} className={cx('mt-0.5 shrink-0', tone === 'warn' ? 'text-warn' : 'text-info')} aria-hidden />
      <div>
        {title && <p className="font-bold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: Array<{ id: T; label: string }>; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-xl border border-line bg-sunken p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          id={`tab-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          className={cx('min-h-[40px] rounded-lg px-4 text-sm font-semibold', value === t.id ? 'bg-surface shadow-sm text-fg' : 'text-muted hover:text-fg')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-semibold">{label}</span>
    {children}
  </label>
);

const control = 'min-h-[44px] w-full rounded-xl border border-line bg-surface px-3 text-fg placeholder:text-muted';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} {...p} className={cx(control, className)} />;
});
export function Select({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(control, className)} />;
}

export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="py-3">
      <h2 id={id ? `${id}-h` : undefined} className="mb-2 text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}
