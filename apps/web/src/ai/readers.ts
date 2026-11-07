/**
 * Reads the student's files IN THE BROWSER: text, Word and PDF files are turned into text locally; the file itself
 * is never uploaded or stored. The libraries are bundled with the app (no CDN) and loaded only when needed.
 * Scanned pages and photos are sent to the AI (/ai/ocr) only when the student asks.
 */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_OCR_PAGES = 6;

export type ReadResult = { kind: 'text'; text: string; pages?: number } | { kind: 'scanned'; pages: number } | { kind: 'image' };
export type OcrImage = { mediaType: 'image/jpeg'; data: string };

export class ReadError extends Error {
  constructor(public code: 'too_large' | 'unsupported' | 'unreadable' | 'unavailable') {
    super(code);
  }
}

const ext = (f: File) => f.name.toLowerCase().split('.').pop() ?? '';
export const isImageFile = (f: File) => /^image\/(png|jpe?g|webp|gif)$/.test(f.type) || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext(f));

/** Reads what can be read locally. Returns "scanned" for a PDF without a text layer and "image" for photos. */
export async function readFile(file: File): Promise<ReadResult> {
  if (file.size > MAX_FILE_BYTES) throw new ReadError('too_large');
  const e = ext(file);
  if (isImageFile(file)) return { kind: 'image' };
  if (e === 'txt' || e === 'md' || file.type.startsWith('text/')) return { kind: 'text', text: await file.text() };
  if (e === 'docx') {
    try {
      const mammoth = (await import('mammoth/mammoth.browser')).default as { extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
      const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      if (!value.trim()) throw new ReadError('unreadable');
      return { kind: 'text', text: value.replace(/\n{3,}/g, '\n\n').trim() };
    } catch (err) {
      if (err instanceof ReadError) throw err;
      throw new ReadError('unreadable');
    }
  }
  if (e === 'pdf' || file.type === 'application/pdf') return readPdf(file);
  throw new ReadError('unsupported');
}

type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfPage = {
  getTextContent: () => Promise<{ items: Array<{ str?: string; hasEOL?: boolean }> }>;
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
};

async function openPdf(file: File): Promise<PdfDoc> {
  try {
    const pdfjs = await import('pdfjs-dist');
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default as string;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    return (await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise) as unknown as PdfDoc;
  } catch (err) {
    if ((err as { name?: string })?.name === 'PasswordException') throw new ReadError('unreadable');
    throw new ReadError('unavailable');
  }
}

async function readPdf(file: File): Promise<ReadResult> {
  const doc = await openPdf(file);
  const parts: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    parts.push(content.items.map((i) => (i.str ?? '') + (i.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+\n/g, '\n').replace(/ {2,}/g, ' ').trim());
  }
  const text = parts.join('\n\n').trim();
  // a scanned PDF has (almost) no text layer
  if (text.length < 40 * doc.numPages) return { kind: 'scanned', pages: doc.numPages };
  return { kind: 'text', text, pages: doc.numPages };
}

const toBase64 = (canvas: HTMLCanvasElement) => canvas.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, '');

function fitCanvas(w: number, h: number, max = 1600) {
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  return c;
}

/** A photo, shrunk to at most 1600 px and re-encoded as JPEG so the upload stays small. */
export async function imageToOcr(file: File): Promise<OcrImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new ReadError('unreadable'));
      i.src = url;
    });
    const c = fitCanvas(img.naturalWidth, img.naturalHeight);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return { mediaType: 'image/jpeg', data: toBase64(c) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The first pages of a scanned PDF, rendered to JPEG for the AI to read. */
export async function pdfPagesToOcr(file: File, max = MAX_OCR_PAGES): Promise<OcrImage[]> {
  const doc = await openPdf(file);
  const out: OcrImage[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, max); n++) {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1600 / Math.max(base.width, base.height));
    const vp = page.getViewport({ scale: Math.max(0.5, scale) });
    const c = document.createElement('canvas');
    c.width = Math.round(vp.width);
    c.height = Math.round(vp.height);
    await page.render({ canvasContext: c.getContext('2d')!, viewport: vp }).promise;
    out.push({ mediaType: 'image/jpeg', data: toBase64(c) });
  }
  return out;
}
