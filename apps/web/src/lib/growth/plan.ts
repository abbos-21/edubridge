import type { L } from '@edubridge/shared';
import { IDEAS, type Idea } from './ideas';

/** The student's chosen ideas and when each starts (month 1 = the first month of the plan). */
export type PlanItem = { ideaId: string; start: number };
export type GrowthPlan = { items: PlanItem[]; startedAt?: string };

export type MonthTask = { ideaId: string; step: L; stepNo: number; of: number };
export type MonthRow = { month: number; tasks: MonthTask[]; hoursPerWeek: number };

/**
 * Spreads each idea's steps evenly over the months it takes, starting at its start month.
 * Returns one row per month up to `months`, with the weekly hours the chosen ideas need together.
 */
export function buildMonthlyPlan(items: PlanItem[], months: number, ideas: Idea[] = IDEAS): { rows: MonthRow[]; overflow: PlanItem[] } {
  const rows: MonthRow[] = Array.from({ length: months }, (_, i) => ({ month: i + 1, tasks: [], hoursPerWeek: 0 }));
  const overflow: PlanItem[] = [];
  for (const it of items) {
    const idea = ideas.find((x) => x.id === it.ideaId);
    if (!idea) continue;
    if (it.start < 1 || it.start + idea.months - 1 > months) overflow.push(it); // does not fit in the time available
    idea.steps.forEach((step, i) => {
      const m = it.start + Math.floor((i * idea.months) / idea.steps.length);
      const row = rows[m - 1];
      if (row) row.tasks.push({ ideaId: idea.id, step, stepNo: i + 1, of: idea.steps.length });
    });
    for (let m = it.start; m < it.start + idea.months; m++) {
      const row = rows[m - 1];
      if (row) row.hoursPerWeek += idea.hours;
    }
  }
  return { rows, overflow };
}

/** The earliest start month that does not overload the student's weekly hours (or 1 when nothing fits better). */
export function suggestStart(items: PlanItem[], idea: Idea, months: number, hoursAvailable: number, ideas: Idea[] = IDEAS): number {
  for (let start = 1; start + idea.months - 1 <= months; start++) {
    const { rows } = buildMonthlyPlan([...items, { ideaId: idea.id, start }], months, ideas);
    if (rows.slice(start - 1, start - 1 + idea.months).every((r) => r.hoursPerWeek <= hoursAvailable)) return start;
  }
  return 1;
}
