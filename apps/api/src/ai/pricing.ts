/** Estimated USD per million tokens [input, output]. Estimates for the budget cap only — not billing. */
const DEFAULTS: Record<string, [number, number]> = {
  'claude-sonnet-5-5': [2, 10],
  'claude-sonnet-5': [2, 10],
  'claude-haiku-5-5': [0.1, 0.5],
  'claude-opus-5-5': [4, 20],
  'claude-opus-5': [5, 25],
  'claude-fable-5-1': [10, 50],
};
/** An unknown model is priced high, so the budget cap errs on the safe side. */
const UNKNOWN: [number, number] = [10, 50];

export function parsePrices(json: string): Record<string, [number, number]> {
  if (!json.trim()) return {};
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(o).filter(([, v]) => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number')) as Array<[string, [number, number]]>);
  } catch {
    return {};
  }
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number, overrides: Record<string, [number, number]> = {}): number {
  const [pin, pout] = overrides[model] ?? DEFAULTS[model] ?? UNKNOWN;
  return (inputTokens * pin + outputTokens * pout) / 1_000_000;
}
