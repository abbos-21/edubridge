import { LEVELS, type University } from '@edubridge/shared';

type Row = Record<string, string | number | null>;

/** CSV that is safe to open in a spreadsheet: values starting with = + - @ are prefixed so they are never run as formulas. */
export function toCsv(rows: Row[]): string {
  if (!rows.length) return '';
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: string | number | null | undefined) => {
    if (v == null) return '';
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
}

export function universityRows(unis: Array<University & { status?: string }>): Row[] {
  return unis.map((u) => {
    const r: Row = { id: u.id, country: u.country, order: u.order, tier: u.tier, name: u.name, city: u.city ?? null, type: u.type ?? null, website: u.website ?? null, status: u.status ?? null, lastChecked: u.lastChecked ?? null, qs: u.ranking?.value ?? null, qsSource: u.ranking?.source?.url ?? null };
    for (const lvl of LEVELS) {
      const l = u.levels[lvl];
      r[`${lvl}_open`] = l?.open ?? null;
      r[`${lvl}_ielts`] = l?.ielts ?? null;
      r[`${lvl}_ieltsScope`] = l?.ieltsScope ?? null;
      r[`${lvl}_tuition`] = l?.tuition?.amount ?? null;
      r[`${lvl}_currency`] = l?.tuition?.currency ?? null;
      r[`${lvl}_deadline`] = l?.deadline?.date ?? null;
      r[`${lvl}_sources`] = (l?.sources ?? []).join(' ');
    }
    return r;
  });
}

export function grantRows(grants: Array<Record<string, unknown>>): Row[] {
  return grants.map((g) => ({
    id: String(g.id),
    kind: String(g.kind ?? ''),
    name: String(g.name ?? ''),
    country: String(g.country ?? ''),
    status: String(g.status ?? ''),
    checked: (g.checked as string) ?? null,
    sources: [g.url, g.infoUrl, g.applyUrl, g.source, ...(Array.isArray(g.sources) ? g.sources : [])].filter((x) => typeof x === 'string').join(' '),
  }));
}
