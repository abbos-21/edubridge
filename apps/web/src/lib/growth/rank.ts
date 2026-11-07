import type { L } from '@edubridge/shared';
import type { CheckItem } from './check';
import { IDEAS, type Cost, type Group, type Idea } from './ideas';

/**
 * Ranks the 36 ideas for one student: gaps first, then subject fit, then what the time, hours and budget allow.
 * Ported from the previous build (same weights). The score is only an ordering — never shown as a chance of anything.
 */
export type RankInput = { level: 'bachelor' | 'master'; field: string; group: Group; months: number; hours: number; cost: Cost };
export type Ranked = { idea: Idea; score: number; reasons: L[]; fits: boolean };

const COST_ORDER: Record<Cost, number> = { free: 0, low: 1, some: 2 };
const r = (en: string, uz: string): L => ({ en, uz });

export function rankIdeas(check: CheckItem[], a: RankInput, ideas: Idea[] = IDEAS): Ranked[] {
  const gapSignals = new Set(check.filter((c) => c.status === 'gap').flatMap((c) => c.signals));
  const okSignals = new Set(check.filter((c) => c.status === 'ok' || c.status === 'unknown').flatMap((c) => c.signals));
  const gapIds = new Set(check.filter((c) => c.status === 'gap').map((c) => c.id));

  return ideas
    .filter((i) => i.levels.includes(a.level))
    .map((i) => {
      const reasons: L[] = [];
      let score = 0;
      const fieldFits = i.fields === 'all' || i.fields.includes(a.field);
      if (i.fields !== 'all' && i.fields.includes(a.field)) {
        score += 3;
        reasons.push(r('Specific to your subject', 'Aynan sohangiz uchun'));
      }
      if (!fieldFits) score -= 6;

      const filled = i.signals.filter((s) => gapSignals.has(s));
      if (filled.length) {
        score += 4 + 2 * (filled.length - 1);
        reasons.push(r('Fills a gap in your profile', 'Profilingizdagi bo‘shliqni to‘ldiradi'));
      }
      if (i.signals.some((s) => okSignals.has(s))) score += 1;
      if (i.id === 'english-plan' && gapIds.has('english')) {
        score += 10;
        reasons.push(r('English is below your target — fix this first', 'Ingliz tili maqsaddan past — avval shuni tuzating'));
      }
      if (i.id === 'grades-rescue' && gapIds.has('grades')) score += 4;
      if (i.groups.includes(a.group)) {
        score += 2;
        if (a.group === 'selective' && i.effort === 3) reasons.push(r('The kind of depth selective universities notice', 'Kuchli tanlovli universitetlar e’tibor beradigan chuqurlik'));
      }
      const timeFits = i.months <= a.months && i.hours <= a.hours + 2 && COST_ORDER[i.cost] <= COST_ORDER[a.cost];
      if (!timeFits) score -= 5;
      if (a.months < 6 && i.effort === 3) score -= 2;
      return { idea: i, score, reasons, fits: timeFits && fieldFits };
    })
    .sort((x, y) => y.score - x.score);
}
