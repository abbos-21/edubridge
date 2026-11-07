import type { Llm, LlmRequest, LlmResult, Tier } from './llm';

/**
 * A deterministic stand-in for the model, for tests and local development (AI_MOCK=true).
 * It returns replies that pass the real validators, with quotes taken from the student's own text,
 * so the full pipeline (prompt -> reply -> validation -> quote checks -> UI) can be exercised without a key.
 */

const lastUserText = (req: LlmRequest): string => {
  const m = [...req.messages].reverse().find((x) => x.role === 'user');
  if (!m) return '';
  return typeof m.content === 'string' ? m.content : m.content.map((b) => (b.type === 'text' ? b.text : '')).join('\n');
};

/** First real sentence of the first """-quoted block that follows `marker`. */
function firstQuote(prompt: string, marker: string): string {
  const i = prompt.indexOf(marker);
  const rest = i >= 0 ? prompt.slice(i) : prompt;
  const m = /"""\s*([\s\S]*?)"""/.exec(rest);
  const body = (m?.[1] ?? '').replace(/\[(?:L|P)\d+\]\s*/g, '').trim();
  const line = body.split(/\n/).map((l) => l.trim()).find((l) => l.length > 15) ?? body.slice(0, 80);
  return line.split(/(?<=[.!?])\s/)[0]!.slice(0, 160);
}

const sc = (keys: string[], v = 5) => keys.map((key) => ({ key, score: v, reason: 'Mock assessment.' }));


const cvJson = (q: string) => ({
  overall: 'Mock: the CV lists items but shows little impact. The biggest problem is missing results.',
  first_impression: 'Mock first impression.',
  claims: [{ claim: 'Has relevant experience', evidence: q, verdict: 'weak' }],
  red_flags: [{ flag: 'No measurable results', quote: q, severity: 'high' }],
  readiness: 'moderate_improvement',
  scores: sc(['structure', 'academic', 'experience', 'impact', 'skills', 'language', 'relevance']),
  strengths: [{ point: 'Clear start', evidence: q, why: 'It names the subject.' }],
  weaknesses: [{ point: 'No outcomes', evidence: q, consequence: 'A reader cannot judge the impact.' }],
  sections: [{ section: 'Education', assessment: 'Mock.', issues: ['Add grades'] }],
  improvements: [{ priority: 1, change: 'Add a measurable result to each experience.', why: 'Evidence persuades.' }],
  rewrites: [{ original: q, improved: `${q} [add the number of ... and the result]`, why: 'Adds evidence.', missing_info: 'The number and the result.' }],
  questions: ['What was the result of your main project?'],
  action_plan: ['Add results'],
  limits: [] as string[],
});

const letterJson = (q: string) => ({
  verdict: 'Mock: the letter is understandable but generic. The biggest problem is the lack of specific evidence.',
  first_impression: 'Mock.',
  four_questions: [{ question: 'why this subject', answered: 'partly', comment: 'Mock.' }],
  claims: [{ claim: 'Is motivated', evidence: q, verdict: 'weak' }],
  red_flags: [] as unknown[],
  readiness: 'substantial_revision',
  scores: sc(['authenticity', 'academic', 'fit', 'evidence', 'career', 'structure', 'writing', 'compliance']).map((x) => (x.key === 'fit' || x.key === 'compliance' ? { ...x, score: null as number | null } : x)),
  works: [{ quote: q, why: 'It opens clearly.' }],
  weakens: [{ quote: q, why: 'Generic.', fix: 'Add a specific example.' }],
  generic: [{ quote: q, why: 'Anyone could write it.', ask: 'Which course relates to your goals?' }],
  missing: ['A concrete example'],
  paragraphs: [{ n: 1, role: 'opening', assessment: 'Mock.', issues: [] as string[] }],
  improvements: [{ priority: 1, change: 'Add evidence.', why: 'Mock.' }],
  compliance: { status: 'cannot_confirm', notes: [] as string[] },
  questions: ['Why this programme?'],
  limits: [] as string[],
});

export function mockReply(req: LlmRequest): string {
  const p = lastUserText(req);
  const sys = req.system ?? '';
  if (sys.includes('TASK: answer the student')) {
    return '### Short answer\nThis is a mock answer (official). See https://study.um.edu.my/how-to-apply and https://not-in-records.example/page for details.\n\n### Sources and verification\n- Mock source: https://study.um.edu.my/how-to-apply\n\nFOLLOWUPS: What is the deadline? | Which documents do I need? | How much does it cost?';
  }
  if (p.includes("evaluation of the student's academic CV")) return JSON.stringify(cvJson(firstQuote(p, 'THE CV')));
  if (p.includes("evaluation of the student's document")) return JSON.stringify(letterJson(firstQuote(p, 'THE DOCUMENT')));
  if (p.includes('SECOND, more senior admissions reader')) {
    const q = firstQuote(p, 'THE DOCUMENT');
    const base = p.includes("analysed the student's CV") ? cvJson(q) : letterJson(q);
    return JSON.stringify({ ...base, audit_notes: ['Mock audit: no change needed.'] });
  }
  if (p.includes('help the student improve one passage')) {
    const q = firstQuote(p, 'PASSAGE TO REVISE');
    return JSON.stringify({ revised: `${q} [add a specific detail]`, changes: [{ what: 'Added a placeholder', why: 'A detail is missing.' }], questions: ['What exactly did you do?'], warnings: [] });
  }
  if (p.includes('prepare a realistic')) {
    const n = Number(/Write (\d+) questions/.exec(p)?.[1] ?? 5);
    return JSON.stringify({ questions: Array.from({ length: n }, (_, i) => ({ q: `Mock interview question ${i + 1}?`, why: 'Tests motivation.' })) });
  }
  if (p.includes('strict but fair scholarship interview evaluator')) {
    return JSON.stringify({ effective: ['Clear start'], weak: ['No evidence'], missing: ['An example'], improve: ['Add an example'], stronger: 'Mock stronger answer [add fact].', stronger_note: 'Fill in the facts.', scores: sc(['clarity', 'authenticity', 'relevance', 'evidence', 'communication', 'alignment']), follow_up: 'Can you give an example?' });
  }
  if (p.includes('tell one coherent, consistent story')) {
    const cv = firstQuote(p, 'CV:');
    const letter = firstQuote(p, 'MOTIVATION') || firstQuote(p, 'LETTER');
    return JSON.stringify({ summary: 'Mock: mostly consistent.', consistent: ['Same subject'], inconsistencies: [{ issue: 'Mock inconsistency', cv_quote: cv, letter_quote: letter, verify: 'Check the dates.' }], ignored_cv_items: ['A project'], interests: 'Consistent.', goals: 'Aligned.' });
  }
  if (p.includes('consecutive pages of a student')) {
    return JSON.stringify({ pages: [{ n: 1, text: 'Mock transcribed text.', legible: 'yes' }] });
  }
  if (p.includes('demanding profile-building coach')) {
    return JSON.stringify({ diagnosis: 'Mock diagnosis.', themes: [{ theme: 'Data for public good', why: 'Mock.' }], ideas: [{ title: 'Mock project', why_for_you: 'Mock.', steps: ['Week 1: plan', 'Week 4: build'], output: 'A report', cv_line: 'Built [what] used by [number] people', essay_angle: 'Mock', risk: 'Mock', months: 3, hours_per_week: 4 }], avoid: [{ what: 'Easy certificates', why: 'Little proof.' }], questions: ['What do you enjoy most?'] });
  }
  if (p.includes('describes an activity they have done')) {
    return JSON.stringify({ verdict: 'Mock verdict.', strength: 'moderate', shows: ['Initiative'], doubts: ['Impact unclear'], stronger: ['Add a measurable result'], ladder: ['Basic', 'Strong', 'Outstanding'], cv_line: 'Did [x] for [number] people', questions: ['How many people?'] });
  }
  return 'Mock reply.';
}

export function createMockLlm(model = (t: Tier) => `mock-${t}`): Llm {
  const run = (req: LlmRequest): LlmResult => ({
    text: mockReply(req),
    usage: { model: model(req.tier), inputTokens: Math.ceil(JSON.stringify(req).length / 4), outputTokens: 400 },
    refused: false,
    truncated: false,
  });
  return {
    enabled: true,
    mock: true,
    modelFor: model,
    async complete(req) {
      if (req.signal?.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
      return run(req);
    },
    async stream(req, onText) {
      const r = run(req);
      for (const word of r.text.split(/(?<=\s)/)) {
        if (req.signal?.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
        onText(word);
        await new Promise((res) => setTimeout(res, 2));
      }
      return r;
    },
  };
}
