import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, Send, Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useCatalog } from '../../data/CatalogProvider';
import { useStore } from '../../store/AppStore';
import { aiChat, type LinkFlag } from '../../lib/ai';
import { ruleBasedAnswer, type RuleAnswer } from '../../lib/assistant';
import { Badge, Button, Card, Field, Input, Notice } from '../../components/ui';
import { ExternalLinkText } from '../../components/common';
import { AiError, AiGate, Thinking } from '../../ai/AiGate';
import { Markdown } from '../../ai/Markdown';
import { NO_TARGET, TargetPicker, toApiTarget, type Target } from '../../ai/TargetPicker';
import { useAiAction } from '../../ai/useAi';
import { useCollection, type Versioned } from '../../ai/useCollection';

type Msg = { role: 'user' | 'assistant'; content: string; followups?: string[]; linkFlags?: LinkFlag[]; records?: Array<{ name: string }> };
type Chat = Versioned & { title: string; data: { messages: Msg[] } };
type Doc = Versioned & { kind: string; title: string; originalText: string; workingText: string };

export function AskTab() {
  const { tx, lang } = useI18n();
  const store = useStore();
  const chats = useCollection<Chat>('chats');
  const docs = useCollection<Doc>('documents');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [chat, setChat] = useState<{ id: string; version: number } | null>(null);
  const [target, setTarget] = useState<Target>(NO_TARGET);
  const [share, setShare] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [saveError, setSaveError] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const ask = useAiAction(
    useCallback(
      async (signal: AbortSignal, history: Msg[], depth: 'normal' | 'deep') => {
        setMsgs([...history, { role: 'assistant', content: '' }]);
        try {
          const done = await aiChat(
            {
              lang,
              depth,
              messages: history.map((m) => ({ role: m.role, content: m.content })),
              profile: store.profile ?? undefined, // the server reduces it to a minimal form (no name, birth year, school)
              saved: store.saved,
              target: toApiTarget(target),
              shareDocs: share && picked.length > 0,
              docs: share ? docs.items.filter((d) => picked.includes(d.id)).slice(0, 3).map((d) => ({ type: d.kind, title: d.title, text: d.workingText })) : [],
            },
            (t) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: x.content + t } : x))),
            signal,
          );
          const final: Msg[] = [...history, { role: 'assistant', content: done.text, followups: done.followups, linkFlags: done.linkFlags, records: done.records }];
          setMsgs(final);
          await persist(final);
        } catch (e) {
          setMsgs(history); // never keep a half-written or failed answer
          throw e;
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [lang, store.saved, target, share, picked, docs.items, chat],
    ),
  );

  const persist = async (final: Msg[]) => {
    if (!chats.signedIn) return;
    try {
      setSaveError(false);
      const title = (final.find((m) => m.role === 'user')?.content ?? 'Chat').slice(0, 60);
      if (!chat) {
        const row = await chats.create({ title, data: { messages: final } });
        setChat({ id: row.id, version: row.version });
      } else {
        const row = await chats.update(chat.id, chat.version, { title, data: { messages: final } });
        setChat({ id: row.id, version: row.version });
      }
    } catch {
      setSaveError(true);
    }
  };

  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }); }, [msgs]);

  const send = (text: string, depth: 'normal' | 'deep' = 'normal') => {
    const q = text.trim();
    if (!q || ask.busy) return;
    setDraft('');
    void ask.run([...msgs, { role: 'user', content: q }], depth);
  };
  const deeper = () => {
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
    if (!lastUser || ask.busy) return;
    const idx = msgs.lastIndexOf(lastUser);
    void ask.run(msgs.slice(0, idx + 1), 'deep');
  };
  const reset = () => { setMsgs([]); setChat(null); ask.clearError(); };
  const open = (c: Chat) => { setMsgs(c.data.messages); setChat({ id: c.id, version: c.version }); };

  return (
    <AiGate fallback={<RuleBased />}>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <Button className="w-full" onClick={reset}><MessageSquarePlus size={16} aria-hidden /> {tx('New chat', 'Yangi suhbat')}</Button>
          <ul className="space-y-1" aria-label={tx('Saved chats', 'Saqlangan suhbatlar')}>
            {chats.items.map((c) => (
              <li key={c.id} className="flex items-center gap-1">
                <button type="button" onClick={() => open(c)} className="min-h-[40px] flex-1 truncate rounded-lg px-2 text-left text-sm hover:bg-sunken" aria-current={chat?.id === c.id}>{c.title}</button>
                <button type="button" aria-label={tx('Delete chat', 'Suhbatni o‘chirish')} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-sunken" onClick={() => { void chats.remove(c.id); if (chat?.id === c.id) reset(); }}><Trash2 size={15} aria-hidden /></button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-3">
          <Card className="space-y-3">
            <details>
              <summary className="cursor-pointer text-sm font-semibold">{tx('Context for the advisor (optional)', 'Maslahatchi uchun kontekst (ixtiyoriy)')}</summary>
              <div className="mt-3 space-y-3">
                <TargetPicker value={target} onChange={setTarget} />
                {docs.items.length > 0 && (
                  <fieldset className="space-y-1 text-sm">
                    <legend className="font-semibold">{tx('Let the advisor read my documents', 'Maslahatchi hujjatlarimni o‘qisin')}</legend>
                    <label className="flex min-h-[40px] items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={share} onChange={(e) => setShare(e.target.checked)} /> {tx('Share the documents I tick below (off by default)', 'Quyida belgilagan hujjatlarimni ulashish (sukut bo‘yicha o‘chiq)')}</label>
                    {share && docs.items.map((d) => (
                      <label key={d.id} className="ml-6 flex min-h-[36px] items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={picked.includes(d.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, d.id].slice(0, 3) : p.filter((x) => x !== d.id)))} /> {d.title}</label>
                    ))}
                  </fieldset>
                )}
              </div>
            </details>
          </Card>

          <Card className="min-h-[240px] space-y-4" aria-live="polite">
            {msgs.length === 0 && (
              <div className="space-y-2 text-sm text-muted">
                <p>{tx('Ask about universities, scholarships, requirements, costs or your application plan.', 'Universitetlar, grantlar, talablar, xarajatlar yoki ariza rejangiz haqida so‘rang.')}</p>
                <ul className="flex flex-wrap gap-2">
                  {[tx('What do I need to apply to a master’s in Germany?', 'Germaniyada magistraturaga ariza topshirish uchun nima kerak?'), tx('Compare the costs of studying in Malaysia and Hungary.', 'Malayziya va Vengriyada o‘qish xarajatlarini solishtiring.')].map((s) => (
                    <li key={s}><button type="button" className="min-h-[40px] rounded-full border border-line px-3 text-left text-sm text-fg hover:bg-sunken" onClick={() => send(s)}>{s}</button></li>
                  ))}
                </ul>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'ml-auto max-w-[85%] rounded-2xl bg-brand-soft px-3 py-2 text-sm' : 'max-w-full'}>
                {m.role === 'user' ? m.content : (
                  <>
                    <Markdown text={m.content || '…'} linkFlags={m.linkFlags} />
                    {m.linkFlags?.some((f) => !f.verified) && <p className="mt-1 text-xs text-warn">{tx('Some links are not in EduBridge’s verified records. Open them with care and check the official site.', 'Ba’zi havolalar EduBridge’ning tasdiqlangan ma’lumotlarida yo‘q. Ehtiyot bo‘ling va rasmiy saytni tekshiring.')}</p>}
                    {m.records && m.records.length > 0 && <p className="mt-1 text-xs text-muted">{tx('Based on EduBridge records', 'EduBridge ma’lumotlari asosida')}: {m.records.map((r) => r.name).slice(0, 5).join(', ')}</p>}
                    {m.followups && m.followups.length > 0 && i === msgs.length - 1 && !ask.busy && (
                      <ul className="mt-2 flex flex-wrap gap-2">{m.followups.map((f) => <li key={f}><button type="button" className="min-h-[40px] rounded-full border border-line px-3 text-left text-sm hover:bg-sunken" onClick={() => send(f)}>{f}</button></li>)}</ul>
                    )}
                  </>
                )}
              </div>
            ))}
            <div ref={end} />
            {ask.busy && <Thinking onStop={ask.stop} />}
            <AiError error={ask.error} />
            {saveError && <p className="text-xs text-warn" role="status">{tx('This chat could not be saved to your account.', 'Bu suhbatni akkauntingizga saqlab bo‘lmadi.')}</p>}
          </Card>

          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
            <Input aria-label={tx('Your question', 'Savolingiz')} placeholder={tx('Type your question…', 'Savolingizni yozing…')} value={draft} maxLength={8000} onChange={(e) => setDraft(e.target.value)} disabled={ask.busy} />
            <Button type="submit" variant="primary" disabled={ask.busy || !draft.trim()}><Send size={16} aria-hidden /> {tx('Send', 'Yuborish')}</Button>
          </form>
          {msgs.length > 0 && !ask.busy && msgs[msgs.length - 1]!.role === 'assistant' && (
            <Button size="sm" onClick={deeper}>{tx('Explain in more depth', 'Batafsilroq tushuntiring')}</Button>
          )}
          <p className="text-xs text-muted">{tx('The advisor cannot browse the web. It only knows EduBridge’s verified records and what you tell it, and it never estimates your chance of admission.', 'Maslahatchi internetdan foydalana olmaydi. U faqat EduBridge’ning tasdiqlangan ma’lumotlari va siz aytganlarni biladi, qabul ehtimolini hech qachon baholamaydi.')}</p>
        </div>
      </div>
    </AiGate>
  );
}

/** Shown when the AI is not available. Clearly labelled: it only repeats facts from the catalogue. */
function RuleBased() {
  const { tx } = useI18n();
  const data = useCatalog();
  const [q, setQ] = useState('');
  const [ans, setAns] = useState<RuleAnswer | null>(null);
  const labels = { not: tx('not confirmed', 'tasdiqlanmagan'), ielts: 'IELTS', tuition: tx('Tuition', 'Kontrakt'), deadline: tx('Deadline', 'Muddat'), fee: tx('Application fee', 'Ariza to‘lovi'), open: tx('Open', 'Ochiq') };
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-extrabold">{tx('Quick facts (rule-based, not AI)', 'Tezkor faktlar (qoidaga asoslangan, SI emas)')}</h2>
        <Badge>{tx('rule-based', 'qoidaga asoslangan')}</Badge>
      </div>
      <p className="text-sm text-muted">{tx('Type a university name or abbreviation to see what EduBridge has confirmed. This is a fixed lookup, not advice.', 'Universitet nomi yoki qisqartmasini yozing — EduBridge nimani tasdiqlaganini ko‘rasiz. Bu qat’iy qidiruv, maslahat emas.')}</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setAns(ruleBasedAnswer(q, data, labels)); }}>
        <Field label={tx('University', 'Universitet')}><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="KAIST, TUM, UM…" /></Field>
        <Button type="submit" className="self-end">{tx('Look up', 'Qidirish')}</Button>
      </form>
      {ans && !ans.found && <Notice>{tx('EduBridge has no record that matches. Try the university name or its abbreviation.', 'EduBridge’da mos yozuv yo‘q. Universitet nomi yoki qisqartmasini sinab ko‘ring.')}</Notice>}
      {ans?.found && (
        <div className="space-y-1 text-sm">
          {ans.lines.map((l, i) => <p key={i} className={i === 0 ? 'font-extrabold' : ''}>{l}</p>)}
          <p className="text-xs text-muted">{ans.links.map((u, i) => <span key={u}>{i > 0 && ', '}<ExternalLinkText url={u} /></span>)}</p>
        </div>
      )}
    </Card>
  );
}
