import { LEVELS, type University } from '@edubridge/shared';

type Rec = University & { status?: string };

const hasText = (x: unknown) => !!x && typeof x === 'object' && Object.values(x as object).some((v) => typeof v === 'string' && v.trim());

/** A level is "links only" when it is not closed but holds no requirement facts at all, only source links. */
function linksOnlyLevel(l: NonNullable<University['levels']['bachelor']>): boolean {
  if (l.open === 'no') return false;
  return !hasText(l.academic) && !hasText(l.language) && !hasText(l.exams) && l.tuition?.amount == null && !l.deadline?.date && l.ielts == null;
}

function pairsMissingRu(v: unknown, acc = { total: 0, missing: 0 }) {
  if (!v || typeof v !== 'object') return acc;
  if (Array.isArray(v)) {
    v.forEach((x) => pairsMissingRu(x, acc));
    return acc;
  }
  const o = v as Record<string, unknown>;
  if ('en' in o && 'uz' in o && Object.keys(o).every((k) => k === 'en' || k === 'uz' || k === 'ru')) {
    acc.total++;
    if (!o.ru) acc.missing++;
    return acc;
  }
  Object.values(o).forEach((x) => pairsMissingRu(x, acc));
  return acc;
}

const daysBetween = (a: string, b: Date) => Math.floor((b.getTime() - Date.parse(a)) / 86_400_000);

/** What still needs content work (ToR F10). Reads the data; invents nothing. */
export function gapsReport(unis: Rec[], staleDays: number, now = new Date()) {
  const linksOnly: Array<{ id: string; name: string; country: string; level: string }> = [];
  for (const u of unis) {
    for (const lvl of LEVELS) {
      const l = u.levels[lvl];
      if (l && linksOnlyLevel(l)) linksOnly.push({ id: u.id, name: u.name, country: u.country, level: lvl });
    }
  }
  const missingQs = unis.filter((u) => !u.ranking || u.ranking.value == null).map((u) => ({ id: u.id, name: u.name, country: u.country, edition: u.ranking?.edition ?? null }));
  const stale = unis
    .map((u) => ({ id: u.id, name: u.name, country: u.country, lastChecked: u.lastChecked ?? null, ageDays: u.lastChecked ? daysBetween(u.lastChecked, now) : null }))
    .filter((u) => u.ageDays == null || u.ageDays > staleDays)
    .sort((a, b) => (b.ageDays ?? 1e9) - (a.ageDays ?? 1e9));
  const ru = pairsMissingRu(unis);
  return {
    generatedAt: now.toISOString(),
    staleDays,
    totals: { universities: unis.length, linksOnlyLevels: linksOnly.length, missingQs: missingQs.length, stale: stale.length },
    linksOnly,
    missingQs,
    stale,
    russianInRecords: { texts: ru.total, withoutRussian: ru.missing, note: 'Russian is currently looked up from the interface dictionary; new or changed texts must carry all three languages.' },
  };
}
