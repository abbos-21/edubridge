import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  FileSearch,
  History,
  ListTree,
  MessageCircleQuestion,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  Square,
  WandSparkles,
} from 'lucide-react';
import { $e, He, Ig, Ko } from '../lib/core';
import { he, ii, we } from '../lib/catalog';
import { useStore } from '../store/store';
import { useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  StatusIcon,
  Tabs,
  Textarea,
  classNames,
} from '../components/ui';
import { _a } from '../components/shared';
import { lz, rz, sz } from '../lib/writing';
import { Un, Xd } from '../lib/ai';

const dz = [
  {
    id: 'why',
    area: {
      en: 'Academic motivation',
      uz: 'Akademik qiziqish',
    },
    q: {
      en: 'Why are you interested in this subject?',
      uz: 'Nega bu fanga qiziqasiz?',
    },
  },
  {
    id: 'moment',
    area: {
      en: 'Relevant experiences',
      uz: 'Tegishli tajriba',
    },
    q: {
      en: 'What experience influenced your decision?',
      uz: 'Qaysi tajriba qaroringizga ta’sir qilgan?',
    },
  },
  {
    id: 'explore',
    area: {
      en: 'Subject knowledge',
      uz: 'Fan bilimi',
    },
    q: {
      en: 'What have you done to explore this field?',
      uz: 'Bu sohani o‘rganish uchun nima qilgansiz?',
    },
  },
  {
    id: 'project',
    area: {
      en: 'Evidence of skills',
      uz: 'Ko‘nikma dalillari',
    },
    q: {
      en: 'What did you learn from a relevant project? What did you personally contribute?',
      uz: 'Tegishli loyihadan nimani o‘rgandingiz? Shaxsan qanday hissa qo‘shdingiz?',
    },
  },
  {
    id: 'challenge',
    area: {
      en: 'Personal development',
      uz: 'Shaxsiy rivojlanish',
    },
    q: {
      en: 'What challenge did you face, and what did you do about it?',
      uz: 'Qanday qiyinchilikka duch keldingiz va nima qildingiz?',
    },
  },
  {
    id: 'connect',
    area: {
      en: 'Past and future',
      uz: 'O‘tmish va kelajak',
    },
    q: {
      en: 'How do your past experiences connect to your future goals?',
      uz: 'O‘tmishdagi tajribangiz kelajakdagi maqsadlaringiz bilan qanday bog‘lanadi?',
    },
  },
  {
    id: 'fit',
    area: {
      en: 'Programme fit',
      uz: 'Dasturga mosligi',
    },
    q: {
      en: 'Why does this university or programme suit your goals?',
      uz: 'Nega aynan shu universitet yoki dastur maqsadlaringizga mos?',
    },
  },
  {
    id: 'future',
    area: {
      en: 'Future ambitions',
      uz: 'Kelajak rejalari',
    },
    q: {
      en: 'What do you hope to achieve in the future?',
      uz: 'Kelajakda nimaga erishmoqchisiz?',
    },
  },
];
export function WritingPage() {
  var _, de;
  const { state: e, route: a, upsertDraft: t, setCvText: n, navigate: s, notify: r, upsertAdvisorDoc: o } = useStore(),
    { tx: u, p: l, lang: c } = useI18n(),
    [p, d] = React.useState(a.id === 'cv' ? 'cv' : 'statement'),
    h = React.useMemo(() => {
      const T = [...new Set([...e.applications.map((Z) => Z.oppId), ...e.saved, ...e.drafts.map((Z) => Z.oppId)])],
        ae = T.map(he).filter(Boolean),
        B = ii.filter((Z) => !T.includes(Z.id) && Z.essay.promptKnown);
      return [...ae, ...B];
    }, [e.applications, e.saved, e.drafts]),
    m =
      a.id && a.id !== 'cv' && he(a.id)
        ? a.id
        : (((_ = e.drafts[0]) == null ? void 0 : _.oppId) ?? ((de = h[0]) == null ? void 0 : de.id) ?? ''),
    [y, E] = React.useState(m),
    C = he(y),
    v = e.drafts.find((T) => T.oppId === y),
    [g, b] = React.useState(
      () =>
        v ?? {
          id: He(),
          oppId: y,
          text: '',
          answers: {},
          revisions: [],
        },
    ),
    [S, A] = React.useState(null),
    [q, w] = React.useState(null),
    [U, j] = React.useState(null),
    [k, K] = React.useState({
      text: '',
      status: 'idle',
    }),
    x = React.useRef(null);
  (React.useEffect(() => {
    Un().then(j);
  }, []),
    React.useEffect(() => {
      const T = e.drafts.find((ae) => ae.oppId === y);
      (b(
        T ?? {
          id: He(),
          oppId: y,
          text: '',
          answers: {},
          revisions: [],
        },
      ),
        A(null),
        w(null),
        K({
          text: '',
          status: 'idle',
        }));
    }, [y]));
  const F = (T) => {
      (b(T), t(T));
    },
    O = g.wordLimit ?? (C == null ? void 0 : C.essay.wordLimit),
    N = Ko(g.text),
    I = () => {
      if (!g.text.trim()) {
        r(u('Write or paste a draft first', 'Avval qoralama yozing yoki joylashtiring'));
        return;
      }
      A(
        sz(g.text, {
          wordLimit: O,
          oppName: C ? (C.kind === 'program' ? C.university : C.name) : void 0,
          country: C ? we[C.country].en : void 0,
          hasPrompt: !!(C != null && C.essay.promptKnown),
        }),
      );
    },
    f = () => {
      g.text.trim() &&
        (F({
          ...g,
          revisions: [
            {
              at: new Date().toISOString(),
              words: N,
              text: g.text,
            },
            ...g.revisions,
          ].slice(0, 15),
        }),
        r(u('Revision saved', 'Tahrir saqlandi')));
    },
    M = () => {
      const T = g.answers,
        ae = (B) => {
          var Z;
          return (Z = T[B]) != null && Z.trim()
            ? `“${T[B].trim().slice(0, 110)}${T[B].trim().length > 110 ? '…' : ''}”`
            : u('(not answered yet)', '(hali javob berilmagan)');
        };
      w([
        `1. ${u('Opening — motivation', 'Kirish — qiziqish')}: ${ae('why')} ${u('+ the moment', '+ lahza')}: ${ae('moment')}`,
        `2. ${u('What you have done', 'Nima qilgansiz')}: ${ae('explore')}`,
        `3. ${u('Evidence', 'Dalil')}: ${ae('project')}`,
        `4. ${u('Growth', 'O‘sish')}: ${ae('challenge')}`,
        `5. ${u('Why this programme', 'Nega bu dastur')}: ${ae('fit')}`,
        `6. ${u('Goals', 'Maqsadlar')}: ${ae('connect')} / ${ae('future')}`,
      ]);
    },
    D = async () => {
      var B;
      if (!C) return;
      (B = x.current) == null || B.abort();
      const T = new AbortController();
      ((x.current = T),
        K({
          text: '',
          status: 'thinking',
        }));
      const ae = [
        'You are a writing tutor for a student from Uzbekistan applying abroad. Give feedback ONLY. Never rewrite the essay, never write new paragraphs for the student, never invent experiences or achievements.',
        `Reply in ${Ig(c)}.`,
        'Give at most 5 issues, most important first. For each: 1) the issue, 2) why it matters, 3) one question that helps the student improve it, 4) a revision strategy. You may add one short illustrative example clearly labelled "Example of the pattern (not your text)". End with one sentence on what already works.',
        C.essay.promptKnown && C.essay.prompt
          ? `Official prompt: ${C.essay.prompt.en}`
          : 'The official prompt is not available; remind the student to check it.',
        O ? `Word limit: ${O}. Current words: ${N}.` : '',
        `Opportunity: ${_a(C, 'en')}${C.source.verification_status === 'demo' ? ' (fictional demo record)' : ''}.`,
        `Student draft:
"""
${g.text.slice(0, 12e3)}
"""`,
      ].filter(Boolean).join(`

`);
      try {
        const Z = await Xd(
          [
            {
              role: 'user',
              content: ae,
            },
          ],
          {
            signal: T.signal,
            cache: !0,
            onText: (oe) =>
              K({
                text: oe,
                status: 'streaming',
              }),
          },
        );
        K({
          text: Z,
          status: 'done',
        });
      } catch (Z) {
        const oe = Z;
        if (oe.code === 'cancelled') {
          K((ve) => ({
            ...ve,
            status: 'done',
          }));
          return;
        }
        K({
          text: oe.partial ?? '',
          status: 'error',
          err:
            oe.code === 'not_granted'
              ? u('Live AI was not allowed for this page.', 'Bu sahifa uchun jonli SI ruxsat etilmadi.')
              : oe.code === 'rate_limited'
                ? u('Too many requests. Try again later.', 'So‘rovlar juda ko‘p. Keyinroq urinib ko‘ring.')
                : u(
                    'Live AI is unavailable right now. The built-in feedback still works.',
                    'Jonli SI hozir mavjud emas. Ichki tahlil ishlayveradi.',
                  ),
        });
      }
    },
    R = lz(e.cvText);
  return (
    <div>
      <PageHeader
        eyebrow={u('Application writing tutor', 'Ariza yozish yordamchisi')}
        title={u('Write your own strong statement', 'O‘zingizning kuchli motivatsion xatingizni yozing')}
        sub={u(
          'The tutor asks questions and points out issues. It does not write your statement for you, and it never invents experiences. You are responsible for your final submission.',
          'Yordamchi savollar beradi va kamchiliklarni ko‘rsatadi. U xatni siz uchun yozmaydi va tajriba o‘ylab topmaydi. Yakuniy ariza uchun o‘zingiz javobgarsiz.',
        )}
      />
      <div className="mb-5">
        <Tabs
          value={p}
          onChange={d}
          items={[
            {
              id: 'statement',
              label: u('Personal statement', 'Motivatsion xat'),
            },
            {
              id: 'cv',
              label: u('CV review', 'CV tekshiruvi'),
            },
            {
              id: 'final',
              label: u('Final checklist', 'Yakuniy ro‘yxat'),
            },
          ]}
        />
      </div>
      {p === 'statement' &&
        (h.length === 0 ? (
          <EmptyState
            title={u('Choose an opportunity first', 'Avval imkoniyatni tanlang')}
            action={<Button onClick={() => s('scholarships')}>{u('Browse scholarships', 'Grantlarni ko‘rish')}</Button>}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <Card className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <div className="flex flex-col gap-3">
                <Field label={u('University or scholarship', 'Universitet yoki grant')} htmlFor="w-opp">
                  <Select id="w-opp" value={y} onChange={(T) => E(T.target.value)}>
                    {h.map((T) => (
                      <option value={T.id} key={T.id}>
                        {T.kind === 'program' ? `${T.university} — ${$e(T.program, c)}` : T.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label={u('Word limit', 'So‘z chegarasi')}
                  htmlFor="w-limit"
                  hint={
                    C != null && C.essay.wordLimit
                      ? u('From the opportunity record.', 'Imkoniyat yozuvidan olingan.')
                      : u(
                          'Not stored — enter the official limit if you know it.',
                          'Saqlanmagan — rasmiy chegarani bilsangiz kiriting.',
                        )
                  }
                >
                  <Input
                    id="w-limit"
                    inputMode="numeric"
                    value={O ?? ''}
                    onChange={(T) =>
                      F({
                        ...g,
                        wordLimit: T.target.value ? Number(T.target.value.replace(/\D/g, '')) : void 0,
                      })
                    }
                  />
                </Field>
              </div>
              <div className="flex flex-col gap-2 text-[14px]">
                <p className="eyebrow">{u('Official prompt', 'Rasmiy savol')}</p>
                {C != null && C.essay.promptKnown && C.essay.prompt ? (
                  <p className="italic">“{l(C.essay.prompt)}”</p>
                ) : (
                  <p className="text-muted">
                    {u(
                      'No verified prompt is stored for this opportunity. Copy it from the official instructions; the structure of your essay should follow that prompt.',
                      'Bu imkoniyat uchun tasdiqlangan savol saqlanmagan. Uni rasmiy ko‘rsatmalardan oling; insho tuzilishi shu savolga mos bo‘lishi kerak.',
                    )}
                  </p>
                )}
                {(C == null ? void 0 : C.essay.criteria) && (
                  <p className="text-muted">
                    <b className="text-fg">{u('Published criteria:', 'E’lon qilingan mezonlar:')}</b>{' '}
                    {l(C.essay.criteria)}
                  </p>
                )}
                {(C == null ? void 0 : C.source.verification_status) === 'demo' && (
                  <Badge tone="warn" className="self-start">
                    {u('Demo prompt', 'Namoyish savoli')}
                  </Badge>
                )}
                <div className="mt-1">
                  {(C == null ? void 0 : C.essay.aiPolicy) === 'unknown' ? (
                    <Callout tone="neutral" icon={<ShieldAlert size={16} />}>
                      {u(
                        'AI-use policy not verified. Check the official instructions before using any AI help.',
                        'SI dan foydalanish qoidasi tekshirilmagan. Har qanday SI yordamidan oldin rasmiy ko‘rsatmalarni tekshiring.',
                      )}
                      {C.essay.aiPolicyNote ? ` ${l(C.essay.aiPolicyNote)}` : ''}
                    </Callout>
                  ) : (
                    <Callout tone="warn" icon={<ShieldAlert size={16} />}>
                      {l(C == null ? void 0 : C.essay.aiPolicyNote)}
                    </Callout>
                  )}
                </div>
              </div>
            </Card>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <Card className="p-4">
                <p className="flex items-center gap-2 font-bold">
                  <MessageCircleQuestion size={17} />
                  {u('Plan with guided questions', 'Yo‘naltiruvchi savollar bilan rejalashtiring')}
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {u(
                    'Answer with real examples. Skip any question that does not fit the official prompt — not every essay follows the same structure.',
                    'Haqiqiy misollar bilan javob bering. Rasmiy savolga mos kelmaydiganini o‘tkazib yuboring — hamma insho bir xil tuzilmada bo‘lmaydi.',
                  )}
                </p>
                <div className="mt-4 flex flex-col gap-4">
                  {dz.map((T) => {
                    const ae = g.answers[T.id] ?? '',
                      B = rz(ae);
                    return (
                      <div key={T.id}>
                        <Field label={l(T.q)} htmlFor={`q-${T.id}`} hint={l(T.area)}>
                          <Textarea
                            id={`q-${T.id}`}
                            className="min-h-[64px]"
                            value={ae}
                            onChange={(Z) =>
                              b({
                                ...g,
                                answers: {
                                  ...g.answers,
                                  [T.id]: Z.target.value,
                                },
                              })
                            }
                            onBlur={() => t(g)}
                          />
                        </Field>
                        {B && (
                          <p className="mt-1.5 flex gap-1.5 rounded-md bg-info-soft px-2.5 py-1.5 text-[13px] text-info">
                            <MessageCircleQuestion size={15} className="mt-0.5 shrink-0" />
                            {l(B)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button className="mt-4" icon={<ListTree size={16} />} onClick={M}>
                  {u('Build an outline from my answers', 'Javoblarimdan reja tuzish')}
                </Button>
                {q && (
                  <div className="mt-3 rounded-lg bg-sunken p-3 text-[13.5px]">
                    <p className="mb-1.5 font-semibold">
                      {u(
                        'Suggested outline (your own words, reordered)',
                        'Taklif etilgan reja (o‘z so‘zlaringiz, qayta tartiblangan)',
                      )}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {q.map((T) => (
                        <li key={T}>{T}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[12px] text-faint">
                      {u('Adapt the order to the official prompt.', 'Tartibni rasmiy savolga moslang.')}
                    </p>
                  </div>
                )}
              </Card>
              <div className="flex min-w-0 flex-col gap-4">
                <Card className="p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="w-text" className="font-bold">
                      {u('Your draft', 'Qoralamangiz')}
                    </label>
                    <span
                      className={classNames(
                        'tabular text-[13px] font-semibold',
                        O && N > O ? 'text-bad' : 'text-muted',
                      )}
                    >
                      {N}
                      {O ? ` / ${O}` : ''} {u('words', 'so‘z')}
                    </span>
                  </div>
                  <Textarea
                    id="w-text"
                    className="min-h-[320px]"
                    value={g.text}
                    onChange={(T) =>
                      b({
                        ...g,
                        text: T.target.value,
                      })
                    }
                    onBlur={() => t(g)}
                    placeholder={u(
                      'Write in the language the application requires. Feedback checks are tuned for English drafts.',
                      'Ariza talab qilgan tilda yozing. Tahlil ingliz tilidagi qoralamalarga moslangan.',
                    )}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="primary" icon={<WandSparkles size={16} />} onClick={I}>
                      {u('Review my draft', 'Qoralamani tekshirish')}
                    </Button>
                    <Button icon={<Save size={16} />} onClick={f} disabled={!g.text.trim()}>
                      {u('Save revision', 'Tahrirni saqlash')}
                    </Button>
                    <Button
                      icon={<FileSearch size={16} />}
                      disabled={!g.text.trim()}
                      onClick={() => {
                        const T = (C == null ? void 0 : C.kind) === 'program' ? C : null,
                          ae =
                            T != null && T.universityId && (T.level === 'bachelor' || T.level === 'master')
                              ? {
                                  kind: 'uni',
                                  id: T.universityId,
                                  level: T.level,
                                }
                              : {
                                  kind: 'custom',
                                  name: C ? _a(C, 'en') : 'Application',
                                };
                        (o({
                          id: He(),
                          type: 'motivation',
                          title: C ? _a(C, c) : u('Motivation letter', 'Motivatsion xat'),
                          addedAt: new Date().toISOString(),
                          original: g.text,
                          working: g.text,
                          target: ae,
                          req: {
                            wordLimit: O || void 0,
                            prompt: C != null && C.essay.promptKnown && C.essay.prompt ? C.essay.prompt.en : void 0,
                          },
                          shared: !1,
                          history: [],
                        }),
                          s('assistant', 'docs'));
                      }}
                    >
                      {u('Full analysis in the AI advisor', 'SI maslahatchida to‘liq tahlil')}
                    </Button>
                    {!e.aiOff &&
                      U &&
                      (k.status === 'thinking' || k.status === 'streaming' ? (
                        <Button
                          icon={<Square size={14} />}
                          onClick={() => {
                            var T;
                            return (T = x.current) == null ? void 0 : T.abort();
                          }}
                        >
                          {u('Stop', 'To‘xtatish')}
                        </Button>
                      ) : (
                        <Button icon={<Sparkles size={16} />} onClick={D} disabled={!g.text.trim()}>
                          {u('Live AI feedback', 'Jonli SI tahlili')}
                        </Button>
                      ))}
                  </div>
                  {(e.aiOff || !U) && (
                    <p className="mt-2 text-[12.5px] text-faint">
                      {u(
                        'Built-in feedback is rule-based and works offline. Live AI feedback can be turned on in Settings when available.',
                        'Ichki tahlil qoidalarga asoslangan va oflayn ishlaydi. Mavjud bo‘lsa, jonli SI tahlilini Sozlamalarda yoqish mumkin.',
                      )}
                    </p>
                  )}
                </Card>
                {k.status !== 'idle' && (
                  <Card className="p-4">
                    <p className="flex items-center gap-2 font-bold">
                      <Sparkles size={16} className="text-teal" />
                      {u('Live AI feedback', 'Jonli SI tahlili')}{' '}
                      <Badge tone="teal">{u('Feedback only — no rewriting', 'Faqat tahlil — qayta yozilmaydi')}</Badge>
                    </p>
                    {k.status === 'thinking' && (
                      <p className="mt-2 text-[14px] text-muted">{u('Thinking…', 'O‘ylamoqda…')}</p>
                    )}
                    {k.text && <div className="prose-copy mt-2 whitespace-pre-wrap text-[14px]">{k.text}</div>}
                    {k.err && (
                      <p className="mt-2 text-[13px] font-semibold text-bad" role="alert">
                        {k.err}
                      </p>
                    )}
                  </Card>
                )}
                {S && (
                  <Card className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{u('Feedback', 'Tahlil')}</p>
                      <p className="tabular text-[12.5px] text-muted">
                        {S.words} {u('words', 'so‘z')}
                        {' · '}
                        {S.sentences} {u('sentences', 'gap')}
                        {' · '}
                        {S.paragraphs} {u('paragraphs', 'xatboshi')}
                      </p>
                    </div>
                    {S.strengths.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {S.strengths.map((T, ae) => (
                          <li className="flex gap-2 text-[13.5px]" key={ae}>
                            <StatusIcon status="met" />
                            {l(T)}
                          </li>
                        ))}
                      </ul>
                    )}
                    <ol className="mt-3 flex flex-col gap-3">
                      {S.issues.map((T) => (
                        <li className="rounded-lg border border-line p-3" key={T.id}>
                          <div className="flex items-start gap-2">
                            <Badge tone={T.severity === 'high' ? 'bad' : T.severity === 'medium' ? 'warn' : 'neutral'}>
                              {T.severity === 'high'
                                ? u('High', 'Muhim')
                                : T.severity === 'medium'
                                  ? u('Medium', 'O‘rta')
                                  : u('Low', 'Kichik')}
                            </Badge>
                            <p className="font-semibold">{l(T.issue)}</p>
                          </div>
                          <dl className="mt-2 grid gap-1.5 text-[13.5px]">
                            <div>
                              <dt className="inline font-semibold">{u('Why it matters: ', 'Nima uchun muhim: ')}</dt>
                              <dd className="inline text-muted">{l(T.why)}</dd>
                            </div>
                            <div>
                              <dt className="inline font-semibold">{u('Ask yourself: ', 'O‘zingizdan so‘rang: ')}</dt>
                              <dd className="inline text-muted">{l(T.question)}</dd>
                            </div>
                            <div>
                              <dt className="inline font-semibold">{u('Strategy: ', 'Strategiya: ')}</dt>
                              <dd className="inline text-muted">{l(T.strategy)}</dd>
                            </div>
                            {T.example && (
                              <div className="rounded-md bg-sunken px-2.5 py-1.5 text-[13px]">{l(T.example)}</div>
                            )}
                          </dl>
                        </li>
                      ))}
                    </ol>
                    {S.issues.length === 0 && (
                      <p className="mt-2 text-[14px] text-ok">
                        {u(
                          'No issues found by the automatic checks. Ask a teacher to read it too.',
                          'Avtomatik tekshiruv kamchilik topmadi. Ustozingizga ham o‘qitib ko‘ring.',
                        )}
                      </p>
                    )}
                  </Card>
                )}
                <Card className="p-4">
                  <p className="flex items-center gap-2 font-bold">
                    <History size={16} />
                    {u('Revision history', 'Tahrirlar tarixi')}
                  </p>
                  {g.revisions.length === 0 ? (
                    <p className="mt-1 text-[13.5px] text-muted">
                      {u(
                        'Save a revision to keep a copy you can return to.',
                        'Qaytish mumkin bo‘lgan nusxa uchun tahrirni saqlang.',
                      )}
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-col">
                      {g.revisions.map((T) => (
                        <li
                          className="flex items-center justify-between gap-2 border-b border-line py-2 text-[13.5px] last:border-0"
                          key={T.at}
                        >
                          <span className="tabular">
                            {new Date(T.at).toLocaleString(c === 'uz' ? 'uz-UZ' : c === 'ru' ? 'ru-RU' : 'en-GB', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                            {' · '}
                            {T.words} {u('words', 'so‘z')}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<RotateCcw size={14} />}
                            onClick={() => {
                              (F({
                                ...g,
                                text: T.text,
                              }),
                                r(u('Revision restored into the editor', 'Tahrir muharrirga tiklandi')));
                            }}
                          >
                            {u('Restore', 'Tiklash')}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ))}
      {p === 'cv' && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="p-4">
            <Field
              label={u('Paste your CV text', 'CV matnini joylashtiring')}
              htmlFor="cv-text"
              hint={u('Stays in this browser.', 'Shu brauzerda qoladi.')}
            >
              <Textarea
                id="cv-text"
                className="min-h-[360px] font-mono text-[13px]"
                value={e.cvText}
                onChange={(T) => n(T.target.value)}
              />
            </Field>
          </Card>
          <Card className="p-4">
            <p className="font-bold">{u('CV review', 'CV tahlili')}</p>
            {e.cvText.trim() ? (
              <>
                <p className="eyebrow mb-1.5 mt-3">{u('Sections found', 'Topilgan bo‘limlar')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {R.found.map((T) => (
                    <Badge tone="ok" key={T.en}>
                      {l(T)}
                    </Badge>
                  ))}
                </div>
                <p className="eyebrow mb-1.5 mt-3">
                  {u(
                    'Consider adding (only if you have real content)',
                    'Qo‘shishni o‘ylang (faqat haqiqiy mazmun bo‘lsa)',
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {R.missing.map((T) => (
                    <Badge key={T.en}>{l(T)}</Badge>
                  ))}
                </div>
                <ul className="mt-3 flex flex-col gap-2 text-[14px]">
                  {R.notes.map((T, ae) => (
                    <li className="flex gap-2" key={ae}>
                      <StatusIcon status="verify" />
                      {l(T)}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-[14px] text-muted">
                {u(
                  'Paste your CV to see which sections are present and what to improve.',
                  'Qaysi bo‘limlar borligini va nimani yaxshilash kerakligini ko‘rish uchun CV ni joylashtiring.',
                )}
              </p>
            )}
          </Card>
        </div>
      )}
      {p === 'final' && (
        <Card className="p-5">
          <p className="font-bold">{u('Before you submit your statement', 'Motivatsion xatni topshirishdan oldin')}</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-[14.5px]">
            {[
              u(
                'It answers the official prompt, in the order it asks.',
                'U rasmiy savolga, so‘ralgan tartibda javob beradi.',
              ),
              u(
                'Every claim about you is supported by a real example.',
                'Siz haqidagi har bir da’vo haqiqiy misol bilan tasdiqlangan.',
              ),
              u(
                'Every experience described really happened, in the way you describe it.',
                'Tasvirlangan har bir tajriba haqiqatda siz aytgandek bo‘lgan.',
              ),
              u(
                'It explains why this specific programme or scholarship fits your goals.',
                'Nega aynan shu dastur yoki grant maqsadlaringizga mosligini tushuntiradi.',
              ),
              u('It is within the word or character limit.', 'So‘z yoki belgi chegarasi doirasida.'),
              u(
                'You followed the institution’s rules on AI use.',
                'Muassasaning SI dan foydalanish qoidalariga amal qildingiz.',
              ),
              u('Someone you trust has read it.', 'Ishonchli odam uni o‘qib chiqdi.'),
              u('You proofread it slowly, out loud.', 'Uni sekin, ovoz chiqarib tekshirdingiz.'),
            ].map((T) => (
              <li className="flex gap-2" key={T}>
                <StatusIcon status="verify" />
                {T}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-muted">
            {u(
              'Authenticity: reviewers read thousands of statements. Your own voice and specific details matter more than impressive vocabulary.',
              'Haqqoniylik: baholovchilar minglab xat o‘qiydi. Murakkab so‘zlardan ko‘ra o‘z ovozingiz va aniq tafsilotlar muhimroq.',
            )}
          </p>
        </Card>
      )}
    </div>
  );
}
