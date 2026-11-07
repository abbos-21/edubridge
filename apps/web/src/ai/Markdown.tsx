import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { LinkFlag } from '../lib/ai';
import { isHttp } from '../lib/format';

/**
 * A small, safe renderer for the advisor's answers: ### headings, lists, **bold** and links.
 * It builds React elements (no raw HTML). Links that are not in EduBridge's official records are flagged.
 */
function inline(text: string, flags: LinkFlag[], key: string, unverifiedLabel: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|https?:\/\/[^\s)\]>]+)/g;
  let last = 0;
  let n = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      out.push(<strong key={`${key}-${n++}`}>{tok.slice(2, -2)}</strong>);
    } else {
      const url = tok.replace(/[.,;:!?]+$/, '');
      const flagged = flags.find((f) => f.url === url);
      const unverified = flagged ? !flagged.verified : true;
      if (isHttp(url)) {
        out.push(
          <span key={`${key}-${n++}`}>
            <a href={url} target="_blank" rel="noopener noreferrer" className="break-all font-semibold">
              {url}
            </a>
            {unverified && (
              <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-warn/10 px-1 text-[11px] font-semibold text-warn" title={unverifiedLabel}>
                <AlertTriangle size={11} aria-hidden /> {unverifiedLabel}
              </span>
            )}
          </span>,
        );
      } else out.push(tok);
      if (url.length < tok.length) out.push(tok.slice(url.length));
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, linkFlags = [] }: { text: string; linkFlags?: LinkFlag[] }) {
  const { tx } = useI18n();
  const label = tx('unverified link', 'tasdiqlanmagan havola');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const k = blocks.length;
    const items = list.items.map((it, i) => <li key={i}>{inline(it, linkFlags, `${k}-${i}`, label)}</li>);
    blocks.push(list.ordered ? <ol key={k} className="my-1.5 list-decimal space-y-1 pl-5">{items}</ol> : <ul key={k} className="my-1.5 list-disc space-y-1 pl-5">{items}</ul>);
    list = null;
  };
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd();
    const h = /^#{1,4}\s+(.*)$/.exec(line);
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (h) {
      flush();
      blocks.push(<h4 key={blocks.length} className="mb-1 mt-3 text-sm font-extrabold first:mt-0">{h[1]!.replace(/\*\*/g, '')}</h4>);
      continue;
    }
    if (ul || ol) {
      const ordered = !!ol && !ul;
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push((ul ?? ol)![1]!);
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={blocks.length} className="my-1">{inline(line, linkFlags, String(blocks.length), label)}</p>);
  }
  flush();
  return <div className="break-words text-sm leading-relaxed">{blocks}</div>;
}
