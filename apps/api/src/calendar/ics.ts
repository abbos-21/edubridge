import type { CalItem } from './items';
import { itemDescription, itemTitle, type Lang } from './texts';

/** RFC 5545 text escaping. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds a content line at 75 octets (never inside a UTF-8 character) with CRLF + space. */
export function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
      limit = 74; // continuation lines start with one space
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const dateOnly = (iso: string) => iso.replace(/-/g, '');
const nextDay = (iso: string) => dateOnly(new Date(Date.parse(iso + 'T00:00:00Z') + 86_400_000).toISOString().slice(0, 10));

/**
 * An iCalendar file of all-day events (date-only deadlines have no time, so no time zone is invented).
 * Imports into Google Calendar and Apple Calendar.
 */
export function buildIcs(items: CalItem[], lang: Lang, now = new Date()): string {
  const name = { uz: 'EduBridge muddatlari', ru: 'Сроки EduBridge', en: 'EduBridge deadlines' }[lang];
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduBridge//Deadlines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    'REFRESH-INTERVAL;VALUE=DURATION:P1D',
    'X-PUBLISHED-TTL:P1D',
  ];
  for (const i of items) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${i.uid}@edubridge`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${dateOnly(i.date)}`,
      `DTEND;VALUE=DATE:${nextDay(i.date)}`,
      `SUMMARY:${esc(itemTitle(i, lang))}`,
      `DESCRIPTION:${esc(itemDescription(i, lang))}`,
      ...(i.sourceUrl ? [`URL:${i.sourceUrl}`] : []),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
