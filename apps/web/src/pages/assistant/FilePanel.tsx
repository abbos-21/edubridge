import { useCallback, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { aiOcr, type OcrPage } from '../../lib/ai';
import { Badge, Button, Notice } from '../../components/ui';
import { AiError, Thinking } from '../../ai/AiGate';
import { useAiAction } from '../../ai/useAi';
import { MAX_OCR_PAGES, ReadError, imageToOcr, isImageFile, pdfPagesToOcr, readFile, type OcrImage } from '../../ai/readers';

type Pending = { file: File; kind: 'scanned' | 'image'; pages?: number };

/**
 * Opens a text, Word or PDF file locally. A scanned PDF or a photo can be read by the AI on request (one AI request);
 * the student reviews and edits the transcription before it is used. The file itself is never stored.
 */
export function FilePanel({ onText }: { onText: (text: string, title: string) => void }) {
  const { tx } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [pages, setPages] = useState<OcrPage[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const message = (e: unknown) => {
    const code = e instanceof ReadError ? e.code : 'unreadable';
    return {
      too_large: tx('The file is larger than 10 MB.', 'Fayl 10 MB dan katta.'),
      unsupported: tx('This file type is not supported. Use .txt, .docx, .pdf or a photo (PNG, JPG).', 'Bu fayl turi qo‘llab-quvvatlanmaydi. .txt, .docx, .pdf yoki rasm (PNG, JPG) ishlating.'),
      unreadable: tx('This file could not be read. Paste the text instead.', 'Bu faylni o‘qib bo‘lmadi. Uning o‘rniga matnni joylashtiring.'),
      unavailable: tx('The file reader could not be loaded. Paste the text instead.', 'Fayl o‘quvchisi yuklanmadi. Uning o‘rniga matnni joylashtiring.'),
    }[code];
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr(null); setPending(null); setPages(null); setNote(null); setBusy(true);
    try {
      const r = await readFile(file);
      const title = file.name.replace(/\.[^.]+$/, '');
      if (r.kind === 'text') {
        onText(r.text, title);
        setNote(tx('Read {0} words from {1}.', '{1} faylidan {0} ta so‘z o‘qildi.', (r.text.match(/\S+/g) ?? []).length, file.name));
      } else setPending({ file, kind: r.kind, pages: r.kind === 'scanned' ? r.pages : undefined });
    } catch (e) {
      setErr(message(e));
    } finally {
      setBusy(false);
    }
  };

  const ocr = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        if (!pending) return;
        let images: OcrImage[];
        try {
          images = pending.kind === 'image' || isImageFile(pending.file) ? [await imageToOcr(pending.file)] : await pdfPagesToOcr(pending.file, MAX_OCR_PAGES);
        } catch (e) {
          setErr(message(e));
          return;
        }
        const r = await aiOcr(images, signal);
        setPages(r.pages);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [pending],
    ),
  );

  const use = () => {
    if (!pages || !pending) return;
    onText(pages.map((p) => p.text.trim()).filter(Boolean).join('\n\n'), pending.file.name.replace(/\.[^.]+$/, ''));
    setPages(null);
    setPending(null);
    setNote(tx('The transcription was added below. Check it against your original before analysing.', 'Transkripsiya quyiga qo‘shildi. Tahlildan oldin asl nusxa bilan solishtiring.'));
  };

  return (
    <div className="space-y-2">
      <label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-xl border border-line px-3 text-sm font-semibold hover:bg-sunken">
        {tx('Open a file (.txt, .docx, .pdf or a photo)', 'Fayl ochish (.txt, .docx, .pdf yoki rasm)')}
        <input type="file" accept=".txt,.md,.docx,.pdf,.png,.jpg,.jpeg,.webp,text/plain,application/pdf,image/*" className="sr-only" aria-label={tx('Open a file', 'Fayl ochish')} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
      <p className="text-xs text-muted">{tx('The file is read in your browser and is never stored; only the text you keep is saved.', 'Fayl brauzeringizda o‘qiladi va hech qachon saqlanmaydi; faqat siz qoldirgan matn saqlanadi.')}</p>
      {busy && <p role="status" className="text-sm text-muted">{tx('Reading the file…', 'Fayl o‘qilmoqda…')}</p>}
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      {note && <p role="status" className="text-sm text-ok">{note}</p>}

      {pending && !pages && (
        <Notice tone="warn" title={pending.kind === 'image' ? tx('This is a photo', 'Bu rasm') : tx('This PDF looks scanned (no text inside)', 'Bu PDF skanerlangan ko‘rinadi (ichida matn yo‘q)')}>
          <p>{tx('The AI can read the text from it. This uses one AI request, and the pages are sent to the AI service for reading but not stored. Handwriting and poor photos may come out wrong, so you will check the result.', 'SI undan matnni o‘qiy oladi. Bu bitta SI so‘rovini ishlatadi, sahifalar o‘qish uchun SI xizmatiga yuboriladi, lekin saqlanmaydi. Qo‘lyozma va yomon rasmlar noto‘g‘ri chiqishi mumkin, shuning uchun natijani tekshirasiz.')}
            {pending.pages && pending.pages > MAX_OCR_PAGES ? ' ' + tx('Only the first {0} pages are read.', 'Faqat dastlabki {0} ta sahifa o‘qiladi.', MAX_OCR_PAGES) : ''}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="primary" disabled={ocr.busy} onClick={() => void ocr.run()}>{tx('Read with AI', 'SI bilan o‘qish')}</Button>
            <Button size="sm" onClick={() => setPending(null)}>{tx('Cancel', 'Bekor qilish')}</Button>
          </div>
        </Notice>
      )}
      {ocr.busy && <Thinking onStop={ocr.stop} label={tx('Reading the pages…', 'Sahifalar o‘qilmoqda…')} />}
      <AiError error={ocr.error} />

      {pages && (
        <div className="space-y-2 rounded-xl border border-line p-3">
          <h3 className="font-bold">{tx('Check the transcription', 'Transkripsiyani tekshiring')}</h3>
          {pages.map((p, i) => (
            <div key={p.n} className="space-y-1">
              <p className="flex items-center gap-2 text-xs font-semibold text-muted">
                {tx('Page {0}', '{0}-sahifa', p.n)}
                <Badge tone={p.legible === 'yes' ? 'ok' : p.legible === 'partial' ? 'warn' : 'bad'}>{p.legible === 'yes' ? tx('legible', 'o‘qiladigan') : p.legible === 'partial' ? tx('partly legible', 'qisman o‘qiladigan') : tx('not legible', 'o‘qilmaydigan')}</Badge>
                {p.legible !== 'yes' && <span className="flex items-center gap-1 text-warn"><AlertTriangle size={12} aria-hidden /> {tx('Look for [unreadable] and fill the gaps yourself.', '[unreadable] ni qidiring va bo‘shliqlarni o‘zingiz to‘ldiring.')}</span>}
              </p>
              <textarea aria-label={tx('Page {0}', '{0}-sahifa', p.n)} className="min-h-[120px] w-full rounded-xl border border-line bg-surface p-3 text-sm" value={p.text} onChange={(e) => setPages(pages.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={use}>{tx('Use this text', 'Shu matndan foydalanish')}</Button>
            <Button size="sm" onClick={() => { setPages(null); setPending(null); }}>{tx('Discard', 'Bekor qilish')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
