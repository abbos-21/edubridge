import { normalize, type University } from '@edubridge/shared';
import type { Catalogue } from './types';

/**
 * The rule-based assistant used when the AI is not available (guests, AI switched off). It only repeats facts
 * that are in the catalogue, in a fixed layout, and is always labelled. It never interprets or advises.
 */
export type RuleAnswer = { found: boolean; lines: string[]; links: string[] };
export type RuleLabels = { not: string; ielts: string; tuition: string; deadline: string; fee: string; open: string };

export function ruleBasedAnswer(question: string, data: Catalogue, labels: RuleLabels): RuleAnswer {
  const q = normalize(question);
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const hit: University | undefined = data.universities.find((u) => {
    const short = normalize(u.short ?? '');
    const hay = normalize(`${u.name} ${u.short ?? ''}`);
    return (short.length > 2 && q.includes(short)) || words.some((w) => w.length > 4 && hay.includes(w));
  });
  if (!hit) return { found: false, lines: [], links: [] };
  const lines: string[] = [hit.name];
  const links = new Set<string>();
  for (const lvl of ['bachelor', 'master'] as const) {
    const l = hit.levels[lvl];
    if (!l) continue;
    const t = l.tuition;
    lines.push(
      `${lvl === 'bachelor' ? 'Bachelor' : 'Master'}: ` +
        [
          `${labels.open}: ${l.open}`,
          `${labels.ielts}: ${l.ielts != null ? `${l.ielts}${l.ieltsScope === 'general' ? '' : ' (programme)'}` : labels.not}`,
          `${labels.tuition}: ${t?.amount != null ? `${t.amount}${t.amount_max ? '–' + t.amount_max : ''} ${t.currency ?? ''} ${t.year ?? ''}`.trim() : labels.not}`,
          `${labels.deadline}: ${l.deadline?.date ?? labels.not}`,
        ].join(' · '),
    );
    (l.sources ?? []).slice(0, 2).forEach((s) => links.add(s));
  }
  lines.push(`${labels.fee}: ${hit.fee?.amount != null ? `${hit.fee.amount} ${hit.fee.currency ?? ''}`.trim() : labels.not}`);
  if (hit.admissions) links.add(hit.admissions);
  if (hit.ranking?.value) lines.push(`QS 2027: ${hit.ranking.value}`);
  return { found: true, lines, links: [...links] };
}
