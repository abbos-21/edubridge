import { useCallback, useMemo, useRef, useState } from 'react';
import { Download, FilePlus, Trash2, Undo2 } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { ApiError } from '../../lib/api';
import { aiJson } from '../../lib/ai';
import { wordDiff } from '../../lib/diff';
import { formatDate } from '../../lib/format';
import { Badge, Button, Card, Field, Input, Notice, Select } from '../../components/ui';
import { AiError, AiGate, Thinking } from '../../ai/AiGate';
import { AnalysisView, useReadinessLabel } from '../../ai/AnalysisView';
import { SaveAsDemo } from '../../admin/SaveDemo';
import { NO_TARGET, TargetPicker, toApiTarget, type Target } from '../../ai/TargetPicker';
import { useAiAction } from '../../ai/useAi';
import { useStore } from '../../store/AppStore';
import { useCollection, type Versioned } from '../../ai/useCollection';
import { DOC_KINDS, SAMPLES, type DocKind } from './samples';
import { FilePanel } from './FilePanel';

export type Change = { at: string; action: string; before: string; after: string; pos: number };
export type Analysis = { docType: string; target: Target; extras: { prompt?: string; wordLimit?: number }; at: string; hash: string; result: any; raw: unknown };
export type Doc = Versioned & {
  kind: string;
  title: string;
  originalText: string;
  workingText: string;
  analysis: Analysis | null;
  history: Change[] | null;
  updatedAt?: string;
};

const IMPROVE_ACTIONS = ['improve', 'professional', 'repetition', 'specific', 'connect', 'goals', 'grammar', 'voice'] as const;
const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
};
const words = (s: string) => (s.trim().match(/\S+/g) ?? []).length;

export function useDocKindLabel() {
  const { tx } = useI18n();
  return (k: string) =>
    ({
      cv: tx('Academic CV / resume', 'Akademik CV / rezyume'),
      motivation: tx('Motivation letter', 'Motivatsion xat'),
      personal_statement: tx('Personal statement', 'Shaxsiy bayonot'),
      study_plan: tx('Study plan', 'O‘qish rejasi'),
      scholarship_essay: tx('Scholarship essay', 'Grant inshosi'),
      recommendation: tx('Recommendation letter draft', 'Tavsiyanoma qoralamasi'),
      other: tx('Other application document', 'Boshqa ariza hujjati'),
    })[k] ?? k;
}

export function DocsTab({ docsApi }: { docsApi?: ReturnType<typeof useCollection<Doc>> }) {
  const own = useCollection<Doc>('documents');
  const docs = docsApi ?? own;
  const { tx, pick } = useI18n();
  const kindLabel = useDocKindLabel();
  const [sel, setSel] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ title: string; kind: DocKind; text: string }>({ title: '', kind: 'motivation', text: '' });
  const [err, setErr] = useState<string | null>(null);

  const current = docs.items.find((d) => d.id === sel) ?? null;

  const createDoc = async () => {
    try {
      setErr(null);
      const row = await docs.create({ kind: form.kind, title: form.title.trim() || kindLabel(form.kind), originalText: form.text, workingText: form.text, analysis: null, history: [] });
      setSel(row.id);
      setCreating(false);
      setForm({ title: '', kind: 'motivation', text: '' });
    } catch (e) {
      setErr(e instanceof ApiError && e.code === 'limit_reached' ? tx('You can keep at most 50 documents. Delete one first.', 'Ko‘pi bilan 50 ta hujjat saqlash mumkin. Avval birini o‘chiring.') : tx('Could not save the document.', 'Hujjatni saqlab bo‘lmadi.'));
    }
  };
  return (
    <AiGate>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <Button className="w-full" variant="primary" onClick={() => { setCreating(true); setSel(null); }}><FilePlus size={16} aria-hidden /> {tx('New document', 'Yangi hujjat')}</Button>
          <ul className="space-y-1" aria-label={tx('Your documents', 'Hujjatlaringiz')}>
            {docs.items.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => { setSel(d.id); setCreating(false); }} aria-current={sel === d.id} className={`min-h-[44px] w-full rounded-lg px-2 text-left text-sm hover:bg-sunken ${sel === d.id ? 'bg-brand-soft' : ''}`}>
                  <span className="block truncate font-semibold">{d.title}</span>
                  <span className="block text-xs text-muted">{kindLabel(d.kind)}</span>
                </button>
              </li>
            ))}
          </ul>
          {docs.items.length === 0 && !creating && <p className="text-sm text-muted">{tx('No documents yet. Add your CV or a letter to get a critical review.', 'Hozircha hujjat yo‘q. Tanqidiy baho olish uchun CV yoki xatingizni qo‘shing.')}</p>}
        </aside>

        <div className="space-y-4">
          {creating && (
            <Card className="space-y-3">
              <h2 className="font-extrabold">{tx('New document', 'Yangi hujjat')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tx('Title', 'Sarlavha')}><Input value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label={tx('Type', 'Turi')}>
                  <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as DocKind })}>{DOC_KINDS.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}</Select>
                </Field>
              </div>
              <Field label={tx('Text', 'Matn')}>
                <textarea className="min-h-[200px] w-full rounded-xl border border-line bg-surface p-3 text-sm" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} maxLength={2_000_000} />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <Select aria-label={tx('Try a sample', 'Namunani sinash')} className="max-w-xs" value="" onChange={(e) => { const s = SAMPLES.find((x) => x.id === e.target.value); if (s) setForm({ title: pick(s.title), kind: s.kind as DocKind, text: s.text }); }}>
                  <option value="">{tx('Try a sample…', 'Namunani sinab ko‘ring…')}</option>
                  {SAMPLES.map((s) => <option key={s.id} value={s.id}>{pick(s.title)}</option>)}
                </Select>
              </div>
              <FilePanel onText={(text, title) => setForm((f) => ({ ...f, text, title: f.title || title }))} />
              {err && <p role="alert" className="text-sm text-bad">{err}</p>}
              <div className="flex gap-2">
                <Button variant="primary" disabled={form.text.trim().length < 20} onClick={() => void createDoc()}>{tx('Save', 'Saqlash')}</Button>
                <Button onClick={() => setCreating(false)}>{tx('Cancel', 'Bekor qilish')}</Button>
              </div>
              <p className="text-xs text-muted">{tx('Only the text is saved to your account, never a file.', 'Akkauntingizga faqat matn saqlanadi, fayl emas.')}</p>
            </Card>
          )}
          {current && <DocEditor key={current.id} doc={current} docs={docs} onDeleted={() => setSel(null)} />}
          {!creating && !current && docs.items.length > 0 && <p className="text-sm text-muted">{tx('Choose a document on the left.', 'Chapdan hujjatni tanlang.')}</p>}
          {err && !creating && <p role="alert" className="text-sm text-bad">{err}</p>}
        </div>
      </div>
    </AiGate>
  );
}

function DocEditor({ doc: initial, docs, onDeleted }: { doc: Doc; docs: ReturnType<typeof useCollection<Doc>>; onDeleted: () => void }) {
  const { tx, lang } = useI18n();
  const kindLabel = useDocKindLabel();
  const readiness = useReadinessLabel();
  const profile = useStore().profile ?? undefined;
  const [doc, setDoc] = useState(initial);
  const [text, setText] = useState(initial.workingText);
  const [title, setTitle] = useState(initial.title);
  const [showOriginal, setShowOriginal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [target, setTarget] = useState<Target>(initial.analysis?.target ?? NO_TARGET);
  const [extras, setExtras] = useState<{ prompt: string; wordLimit: string }>({ prompt: initial.analysis?.extras.prompt ?? '', wordLimit: String(initial.analysis?.extras.wordLimit ?? '') });
  const [cvCtx, setCvCtx] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [action, setAction] = useState<(typeof IMPROVE_ACTIONS)[number]>('improve');
  const [instruction, setInstruction] = useState('');
  const [pending, setPending] = useState<{ start: number; before: string; result: { revised: string; changes: Array<{ what: string; why: string }>; questions: string[]; warnings: string[] } } | null>(null);

  const dirty = text !== doc.workingText || title !== doc.title;
  const cvDocs = docs.items.filter((d) => d.kind === 'cv' && d.id !== doc.id);
  const extrasApi = useMemo(() => ({ ...(extras.prompt.trim() ? { prompt: extras.prompt.trim() } : {}), ...(Number(extras.wordLimit) > 0 ? { wordLimit: Math.floor(Number(extras.wordLimit)) } : {}) }), [extras]);

  const save = useCallback(
    async (patch: Partial<Pick<Doc, 'analysis' | 'history'>> = {}, nextText = text): Promise<Doc | null> => {
      try {
        const row = await docs.update(doc.id, doc.version, {
          kind: doc.kind, title: title.trim() || doc.title, originalText: doc.originalText, workingText: nextText,
          analysis: patch.analysis !== undefined ? patch.analysis : doc.analysis, history: patch.history !== undefined ? patch.history : doc.history ?? [],
        });
        setDoc(row);
        setMsg(null);
        return row;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          const server = (e.details as { server?: Doc } | undefined)?.server;
          if (server) { setDoc(server); setText(server.workingText); setTitle(server.title); }
          setMsg(tx('This document changed on another device. The latest copy was loaded.', 'Bu hujjat boshqa qurilmada o‘zgargan. Eng so‘nggi nusxa yuklandi.'));
        } else setMsg(tx('Could not save. Your text is still here.', 'Saqlab bo‘lmadi. Matningiz shu yerda turibdi.'));
        return null;
      }
    },
    [docs, doc, text, title, tx],
  );

  // ---- analysis ------------------------------------------------------------------------------------------
  const analyse = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        const base = { lang, target: toApiTarget(target), extras: extrasApi, profile };
        const body = doc.kind === 'cv' ? { task: 'cv', ...base, cv: text } : { task: 'letter', ...base, type: doc.kind, text, ...(cvCtx ? { cvForContext: cvDocs.find((d) => d.id === cvCtx)?.workingText } : {}) };
        const r = await aiJson<any>(body, signal);
        const analysis: Analysis = { docType: doc.kind, target: toApiTarget(target), extras: extrasApi, at: new Date().toISOString(), hash: hash(text), result: r.result, raw: (r as { raw?: unknown }).raw };
        await save({ analysis }, text);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [lang, target, extrasApi, doc, text, cvCtx, save],
    ),
  );
  const audit = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        const a = doc.analysis!;
        const r = await aiJson<any>({ task: 'audit', lang, profile, target: a.target, extras: a.extras, kind: doc.kind === 'cv' ? 'cv' : 'letter', ...(doc.kind === 'cv' ? {} : { type: doc.kind }), doc: text, draft: a.raw ?? {} }, signal);
        await save({ analysis: { ...a, at: new Date().toISOString(), hash: hash(text), result: r.result } }, text);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [lang, doc, text, save],
    ),
  );

  // ---- improve a passage -------------------------------------------------------------------------------------
  const improve = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        if (!selection || selection.end - selection.start < 5) return;
        const passage = text.slice(selection.start, selection.end);
        const r = await aiJson<any>({ task: 'improve', lang, profile, target: toApiTarget(target), extras: extrasApi, docType: doc.kind, action, instruction: instruction.trim() || undefined, fullText: text, passage }, signal);
        setPending({ start: selection.start, before: passage, result: r.result });
      },
      [lang, target, extrasApi, doc.kind, action, instruction, text, selection],
    ),
  );
  const accept = async () => {
    if (!pending) return;
    if (text.slice(pending.start, pending.start + pending.before.length) !== pending.before) {
      setMsg(tx('The text changed since the suggestion. Select the passage again.', 'Taklifdan keyin matn o‘zgargan. Parchani qayta belgilang.'));
      setPending(null);
      return;
    }
    const next = text.slice(0, pending.start) + pending.result.revised + text.slice(pending.start + pending.before.length);
    const history = [...(doc.history ?? []), { at: new Date().toISOString(), action, before: pending.before, after: pending.result.revised, pos: pending.start }].slice(-20);
    setText(next);
    setPending(null);
    setSelection(null);
    await save({ history }, next);
  };
  const undo = async () => {
    const hist = doc.history ?? [];
    const last = hist[hist.length - 1];
    if (!last) return;
    let at = text.slice(last.pos, last.pos + last.after.length) === last.after ? last.pos : -1;
    if (at < 0) {
      const first = text.indexOf(last.after);
      at = first >= 0 && first === text.lastIndexOf(last.after) ? first : -1;
    }
    if (at < 0) { setMsg(tx('This change can no longer be undone automatically because the text around it changed.', 'Bu o‘zgarishni avtomatik qaytarib bo‘lmaydi, chunki atrofdagi matn o‘zgargan.')); return; }
    const next = text.slice(0, at) + last.before + text.slice(at + last.after.length);
    setText(next);
    await save({ history: hist.slice(0, -1) }, next);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'document').replace(/[^\p{L}\p{N}_-]+/gu, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const a = doc.analysis;
  const stale = !!a && a.hash !== hash(text);
  const diff = pending ? wordDiff(pending.before, pending.result.revised) : [];

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label={tx('Title', 'Sarlavha')}><Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Badge>{kindLabel(doc.kind)}</Badge>
          <span className="text-xs text-muted">{tx('{0} words', '{0} ta so‘z', words(text))}</span>
        </div>
        <textarea
          ref={taRef}
          aria-label={tx('Working copy', 'Ishchi nusxa')}
          className="min-h-[260px] w-full rounded-xl border border-line bg-surface p-3 text-sm leading-relaxed"
          value={text}
          maxLength={2_000_000}
          onChange={(e) => { setText(e.target.value); setPending(null); }}
          onSelect={(e) => { const t = e.currentTarget; setSelection(t.selectionEnd > t.selectionStart ? { start: t.selectionStart, end: t.selectionEnd } : null); }}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={!dirty} onClick={() => void save()}>{tx('Save', 'Saqlash')}</Button>
          <Button onClick={download}><Download size={16} aria-hidden /> {tx('Download working copy', 'Ishchi nusxani yuklab olish')}</Button>
          <Button onClick={() => setShowOriginal((s) => !s)}>{showOriginal ? tx('Hide original', 'Asl nusxani yashirish') : tx('Show original', 'Asl nusxani ko‘rsatish')}</Button>
          <Button onClick={() => void docs.remove(doc.id).then(onDeleted)} className="text-bad"><Trash2 size={16} aria-hidden /> {tx('Delete', 'O‘chirish')}</Button>
        </div>
        {dirty && <p className="text-xs text-warn" role="status">{tx('Unsaved changes', 'Saqlanmagan o‘zgarishlar')}</p>}
        {msg && <p className="text-sm text-warn" role="alert">{msg}</p>}
        {showOriginal && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">{tx('Original (never overwritten)', 'Asl nusxa (hech qachon o‘zgartirilmaydi)')}</p>
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-sunken p-3 text-sm">{doc.originalText}</pre>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-extrabold">{tx('Critical review', 'Tanqidiy baho')}</h2>
        <TargetPicker value={target} onChange={setTarget} />
        {doc.kind !== 'cv' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tx('Essay prompt or question (optional)', 'Insho savoli (ixtiyoriy)')}><Input value={extras.prompt} maxLength={3000} onChange={(e) => setExtras({ ...extras, prompt: e.target.value })} /></Field>
            <Field label={tx('Word limit (optional)', 'So‘z chegarasi (ixtiyoriy)')}><Input inputMode="numeric" value={extras.wordLimit} onChange={(e) => setExtras({ ...extras, wordLimit: e.target.value.replace(/\D/g, '') })} /></Field>
            {cvDocs.length > 0 && (
              <Field label={tx('Use my CV for context (optional)', 'Kontekst uchun CV’imdan foydalaning (ixtiyoriy)')}>
                <Select value={cvCtx} onChange={(e) => setCvCtx(e.target.value)}><option value="">{tx('No', 'Yo‘q')}</option>{cvDocs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</Select>
              </Field>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={analyse.busy || audit.busy || text.trim().length < 20} onClick={() => void analyse.run()}>{a ? tx('Analyse again', 'Qayta tahlil qilish') : tx('Analyse', 'Tahlil qilish')}</Button>
          {a && <Button disabled={analyse.busy || audit.busy || stale} onClick={() => void audit.run()}>{tx('Second reader', 'Ikkinchi o‘quvchi')}</Button>}
        </div>
        {(analyse.busy || audit.busy) && <Thinking onStop={analyse.busy ? analyse.stop : audit.stop} label={audit.busy ? tx('The second reader is checking the analysis…', 'Ikkinchi o‘quvchi tahlilni tekshirmoqda…') : undefined} />}
        <AiError error={analyse.error ?? audit.error} />
      </Card>

      {a && (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            {tx('Analysis from {0}', 'Tahlil sanasi: {0}', formatDate(a.at, lang) ?? '')} · {readiness(a.result.readiness)}
          </p>
          {stale && <Notice tone="warn">{tx('Your text changed after this analysis. Analyse again to see how the changes look.', 'Bu tahlildan keyin matningiz o‘zgargan. O‘zgarishlar qanday ko‘rinishini bilish uchun qayta tahlil qiling.')}</Notice>}
          <AnalysisView result={a.result} />
          <SaveAsDemo kind="document_analysis" payload={a.result} suggestedTitle={`Analysis: ${doc.title}`} />
        </div>
      )}

      <Card className="space-y-3">
        <h2 className="font-extrabold">{tx('Improve a passage', 'Parchani yaxshilash')}</h2>
        <p className="text-sm text-muted">{tx('Select a passage in the working copy above, choose what to improve, and review the suggestion. You decide what to accept; the original is never overwritten.', 'Yuqoridagi ishchi nusxada parchani belgilang, nimani yaxshilashni tanlang va taklifni ko‘rib chiqing. Nimani qabul qilishni o‘zingiz hal qilasiz; asl nusxa hech qachon o‘zgartirilmaydi.')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tx('What to do', 'Nima qilish kerak')}>
            <Select value={action} onChange={(e) => setAction(e.target.value as (typeof IMPROVE_ACTIONS)[number])}>
              {IMPROVE_ACTIONS.map((x) => <option key={x} value={x}>{{
                improve: tx('Improve overall', 'Umuman yaxshilash'), professional: tx('More professional', 'Professionalroq qilish'), repetition: tx('Remove repetition', 'Takrorni olib tashlash'),
                specific: tx('Make it more specific', 'Aniqroq qilish'), connect: tx('Connect experience to the degree', 'Tajribani darajaga bog‘lash'), goals: tx('Clearer career goals', 'Karyera maqsadlarini aniqlashtirish'),
                grammar: tx('Fix grammar only', 'Faqat grammatikani tuzatish'), voice: tx('Keep my voice', 'Ovozimni saqlash'),
              }[x]}</option>)}
            </Select>
          </Field>
          <Field label={tx('Extra instruction (optional)', 'Qo‘shimcha ko‘rsatma (ixtiyoriy)')}><Input value={instruction} maxLength={500} onChange={(e) => setInstruction(e.target.value)} /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" disabled={!selection || improve.busy || selection.end - selection.start < 5} onClick={() => void improve.run()}>{tx('Suggest a revision', 'Tahrir taklif qilish')}</Button>
          {!selection && <span className="text-xs text-muted">{tx('Select at least a few words first.', 'Avval kamida bir necha so‘zni belgilang.')}</span>}
          {(doc.history?.length ?? 0) > 0 && <Button onClick={() => void undo()}><Undo2 size={16} aria-hidden /> {tx('Undo last change', 'Oxirgi o‘zgarishni qaytarish')}</Button>}
        </div>
        {improve.busy && <Thinking onStop={improve.stop} />}
        <AiError error={improve.error} />
        {pending && (
          <div className="space-y-3 rounded-xl border border-line p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div><p className="mb-1 text-xs font-semibold text-muted">{tx('Your text', 'Sizning matningiz')}</p><p className="whitespace-pre-wrap text-sm">{pending.before}</p></div>
              <div><p className="mb-1 text-xs font-semibold text-muted">{tx('Suggestion', 'Taklif')}</p><p className="whitespace-pre-wrap text-sm">{pending.result.revised}</p></div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">{tx('What changed', 'Nima o‘zgardi')}</p>
              <p className="whitespace-pre-wrap text-sm" data-testid="diff">
                {diff.map((d, i) => d.type === 'same' ? <span key={i}>{d.text}</span> : d.type === 'add' ? <ins key={i} className="bg-ok/15 no-underline">{d.text}</ins> : <del key={i} className="bg-bad/15">{d.text}</del>)}
              </p>
            </div>
            {pending.result.changes.length > 0 && <ul className="list-disc pl-5 text-sm">{pending.result.changes.map((c, i) => <li key={i}><span className="font-semibold">{c.what}</span> — {c.why}</li>)}</ul>}
            {pending.result.questions.length > 0 && <div className="text-sm"><p className="font-semibold">{tx('Please add the missing facts (shown as [placeholders]):', 'Yetishmayotgan faktlarni qo‘shing ([placeholder] sifatida ko‘rsatilgan):')}</p><ul className="list-disc pl-5">{pending.result.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></div>}
            {pending.result.warnings.length > 0 && <Notice tone="warn"><ul className="list-disc pl-5">{pending.result.warnings.map((q, i) => <li key={i}>{q}</li>)}</ul></Notice>}
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => void accept()}>{tx('Accept', 'Qabul qilish')}</Button>
              <Button onClick={() => setPending(null)}>{tx('Reject', 'Rad etish')}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
