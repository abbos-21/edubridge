import { parseEvents, type CalendarEvent } from '../reminders/engine';

/** RFC 5545 text escaping and 75-octet line folding. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}
const ymd = (iso: string) => iso.replace(/-/g, '');
const next = (iso: string) => ymd(new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10));

/** An all-day event per dated item. Unverified and demo dates are left out; so are finished tasks. */
export function buildIcs(rawEvents: unknown, lang: 'uz' | 'ru' | 'en', now = new Date()): string {
  const events: CalendarEvent[] = parseEvents(rawEvents).filter((e) => !e.done && e.trust !== 'unverified' && e.trust !== 'demo');
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EduBridge//Calendar//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:EduBridge'];
  for (const e of events) {
    const title = lang === 'ru' ? e.title.ru ?? e.title.en : lang === 'uz' ? e.title.uz || e.title.en : e.title.en;
    lines.push('BEGIN:VEVENT', `UID:${esc(e.id)}@edubridge`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${next(e.date)}`, `SUMMARY:${esc(title)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
