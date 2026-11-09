import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'md' | 'sm' | 'lg' };
/** Same buttons as the original EduBridge: navy primary, outlined secondary, quiet ghost. */
export const buttonClass = (variant: 'primary' | 'secondary' | 'ghost' = 'secondary', size: 'md' | 'sm' | 'lg' = 'md') =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap no-underline',
    size === 'lg' ? 'h-11 px-5 text-[15px]' : size === 'sm' ? 'h-10 px-3 text-[13.5px]' : 'h-10 px-4 text-sm',
    variant === 'primary' && 'bg-navy text-navy-ink hover:bg-navy/90',
    variant === 'secondary' && 'border border-line bg-surface text-fg hover:bg-sunken',
    variant === 'ghost' && 'text-muted hover:bg-sunken hover:text-fg',
  );
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button({ variant = 'secondary', size = 'md', className, ...p }, ref) {
  return <button ref={ref} type="button" {...p} className={cx(buttonClass(variant, size), className)} />;
});

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5', className)} />;
}

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info' | 'brand' | 'teal';
const tones: Record<Tone, string> = {
  neutral: 'border-line bg-sunken text-muted',
  ok: 'border-ok/20 bg-ok-soft text-ok',
  warn: 'border-warn/25 bg-warn-soft text-warn',
  bad: 'border-bad/20 bg-bad-soft text-bad',
  info: 'border-info/20 bg-info-soft text-info',
  brand: 'border-navy/15 bg-navy-soft text-navy',
  teal: 'border-teal/30 bg-teal-soft text-teal-ink',
};
export function Badge({ tone = 'neutral', className, ...p }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span {...p} className={cx('inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-semibold leading-5', tones[tone], className)} />;
}

/** A filter pill (country, group...). */
export function Chip({ active, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      {...p}
      className={cx('rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors', active ? 'border-navy bg-navy text-navy-ink' : 'border-line bg-surface text-muted hover:text-fg', className)}
    />
  );
}

/** Page title block: small caps line, big title, a sentence, and actions on the right. */
export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-[26px] font-extrabold leading-tight md:text-[30px]">{title}</h1>
        {children && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn'; title?: string; children: ReactNode }) {
  const Icon = tone === 'warn' ? AlertTriangle : Info;
  return (
    <div role="note" className={cx('flex gap-3 rounded-xl border p-3 text-sm', tone === 'warn' ? 'border-warn/30 bg-warn-soft' : 'border-info/25 bg-info-soft')}>
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
    <div role="tablist" aria-label={label} className="inline-flex max-w-full flex-wrap rounded-lg border border-line bg-surface p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          id={`tab-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          className={cx('min-h-[40px] rounded-md px-4 text-sm font-semibold', value === t.id ? 'bg-navy text-navy-ink' : 'text-muted hover:text-fg')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="text-[13px] font-semibold">{label}</span>
    {children}
  </label>
);

const control = 'min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-fg placeholder:text-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} {...p} className={cx(control, className)} />;
});
export function Select({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(control, className)} />;
}

export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="py-4">
      <h2 id={id ? `${id}-h` : undefined} className="mb-3 text-[20px] font-extrabold">{title}</h2>
      {children}
    </section>
  );
}
