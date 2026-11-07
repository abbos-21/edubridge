/** Word-level diff (longest common subsequence) for the "accept / reject" view of a rewrite. */
export type DiffPart = { type: 'same' | 'add' | 'del'; text: string };

const tokens = (s: string) => s.match(/\s+|[^\s]+/g) ?? [];

export function wordDiff(before: string, after: string): DiffPart[] {
  const a = tokens(before);
  const b = tokens(after);
  // Very long inputs: fall back to a coarse whole-text diff instead of an O(n*m) table.
  if (a.length * b.length > 4_000_000) return [{ type: 'del', text: before }, { type: 'add', text: after }];
  const n = a.length;
  const m = b.length;
  const t: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i]![j] = a[i] === b[j] ? t[i + 1]![j + 1]! + 1 : Math.max(t[i + 1]![j]!, t[i]![j + 1]!);
  const out: DiffPart[] = [];
  const push = (type: DiffPart['type'], text: string) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ type, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('same', a[i]!); i++; j++; }
    else if (t[i + 1]![j]! >= t[i]![j + 1]!) { push('del', a[i]!); i++; }
    else { push('add', b[j]!); j++; }
  }
  while (i < n) push('del', a[i++]!);
  while (j < m) push('add', b[j++]!);
  return out;
}
