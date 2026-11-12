import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { BellRing, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { Uj, ai, me } from '../lib/core';
import { he } from '../lib/catalog';
import { useStore } from '../store/store';
import { useDerivedData, useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Card,
  CmpDS,
  EmptyState,
  Field,
  Input,
  Pa,
  PageHeader,
  Select,
  Tabs,
  Textarea,
  classNames,
} from '../components/ui';
import { Wi } from './plans';

export function CalendarPage() {
  var ae;
  const { state: e, navigate: a, addEvent: t, updateEvent: n, removeEvent: s, setReminders: r, notify: o } = useStore(),
    { events: u, today: l } = useDerivedData(),
    { tx: c, p, lang: d } = useI18n(),
    [h, m] = React.useState('month'),
    [y, E] = React.useState(() => {
      const B = new Date();
      return {
        y: B.getFullYear(),
        m: B.getMonth(),
      };
    }),
    [C, v] = React.useState(l),
    [g, b] = React.useState([]),
    [S, A] = React.useState(null),
    [q, w] = React.useState(''),
    [U, j] = React.useState(null),
    k = u.filter((B) => !g.includes(B.kind)),
    K = React.useMemo(() => {
      const B = new Map();
      for (const Z of k) B.set(Z.date, [...(B.get(Z.date) ?? []), Z]);
      return B;
    }, [k]),
    F = (new Date(y.y, y.m, 1).getDay() + 6) % 7,
    O = new Date(y.y, y.m + 1, 0).getDate(),
    N = [
      ...Array(F).fill(null),
      ...Array.from(
        {
          length: O,
        },
        (B, Z) => `${y.y}-${String(y.m + 1).padStart(2, '0')}-${String(Z + 1).padStart(2, '0')}`,
      ),
    ];
  for (; N.length % 7;) N.push(null);
  const I =
      d === 'uz'
        ? ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
        : d === 'ru'
          ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    f = (B) =>
      E(({ y: Z, m: oe }) => {
        const ve = new Date(Z, oe + B, 1);
        return {
          y: ve.getFullYear(),
          m: ve.getMonth(),
        };
      }),
    M = (B) =>
      B.trust === 'verified' ? (
        <Badge tone="ok">{c('Verified', 'Tasdiqlangan')}</Badge>
      ) : B.trust === 'unverified' ? (
        <Badge tone="info">{c('Unverified', 'Tasdiqlanmagan')}</Badge>
      ) : B.trust === 'demo' ? (
        <Badge tone="warn">{c('Demo', 'Namoyish')}</Badge>
      ) : B.trust === 'student' ? (
        <Badge>{c('Your date', 'Sizning sanangiz')}</Badge>
      ) : (
        <Badge>{c('Suggested', 'Tavsiya')}</Badge>
      ),
    D = ({ e: B }) => {
      const Z = ai(l, B.date),
        oe = B.oppId ? he(B.oppId) : void 0;
      return (
        <li className="flex flex-wrap items-start gap-3 border-b border-line px-4 py-3 last:border-0">
          <span className={classNames('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', Wi[B.kind].dot)} aria-hidden={!0} />
          <div className="min-w-0 flex-1">
            <p className={classNames('font-semibold', B.done && 'text-muted line-through')}>{p(B.title)}</p>
            <p className="tabular text-[12.5px] text-muted">
              {me(B.date, d)}
              {' · '}
              {Z === 0
                ? c('today', 'bugun')
                : Z > 0
                  ? c(`in ${Z} days`, `${Z} kundan keyin`)
                  : c(`${-Z} days ago`, `${-Z} kun oldin`)}
              {' · '}
              {c(...Wi[B.kind].label)}
            </p>
            {(oe == null ? void 0 : oe.deadline.tz) && B.id.startsWith('dl-') && (
              <p className="text-[12px] text-faint">
                {oe.deadline.time} {oe.deadline.tz}
                {oe.deadline.intake ? ` · ${c('Intake', 'Qabul')} ${oe.deadline.intake}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {M(B)}
            {B.appId && (
              <Button size="sm" variant="ghost" onClick={() => a('plan', B.appId)}>
                {c('Plan', 'Reja')}
              </Button>
            )}
            {!B.appId && B.oppId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  var ve;
                  return a(
                    ((ve = he(B.oppId)) == null ? void 0 : ve.kind) === 'program' ? 'university' : 'scholarship',
                    B.oppId,
                  );
                }}
              >
                {c('Details', 'Batafsil')}
              </Button>
            )}
            {B.customId && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={c('Edit', 'Tahrirlash')}
                  icon={<Pencil size={14} />}
                  onClick={() => A(e.customEvents.find((ve) => ve.id === B.customId) ?? null)}
                />
                {U === B.customId ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      (s(B.customId), j(null), o(c('Event removed', 'Hodisa o‘chirildi')));
                    }}
                  >
                    {c('Confirm delete', 'O‘chirishni tasdiqlash')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={c('Delete', 'O‘chirish')}
                    icon={<Trash2 size={14} />}
                    onClick={() => j(B.customId)}
                  />
                )}
              </>
            )}
          </div>
        </li>
      );
    },
    R = () => {
      var B;
      if (!((B = S == null ? void 0 : S.title) != null && B.trim())) {
        w(c('Give the event a title.', 'Hodisaga nom bering.'));
        return;
      }
      if (!S.date) {
        w(c('Choose a date.', 'Sanani tanlang.'));
        return;
      }
      (S.id
        ? n(S.id, S)
        : t({
            title: S.title.trim(),
            date: S.date,
            kind: S.kind ?? 'milestone',
            note: S.note ?? '',
            oppId: S.oppId,
          }),
        o(
          S.id
            ? c('Event updated', 'Hodisa yangilandi')
            : c('Event added to your calendar', 'Hodisa taqvimga qo‘shildi'),
        ),
        A(null),
        w(''));
    },
    _ = k.filter((B) => B.date >= l),
    de = k.filter((B) => B.taskId && !B.done && ai(l, B.date) <= 21),
    T = e.applications.flatMap((B) => (he(B.oppId).deadline.date ? [] : [B]));
  return (
    <div>
      <PageHeader
        eyebrow={c('Deadline intelligence', 'Muddatlar nazorati')}
        title={c('Calendar and deadlines', 'Taqvim va muddatlar')}
        sub={c(
          'Official deadlines, your task dates and your own events in one place. Verified, unverified and demo dates are marked separately.',
          'Rasmiy muddatlar, vazifa sanalari va o‘z hodisalaringiz bir joyda. Tasdiqlangan, tasdiqlanmagan va namoyish sanalari alohida belgilangan.',
        )}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              (A({
                date: C,
                kind: 'milestone',
              }),
                w(''));
            }}
          >
            {c('Add a date', 'Sana qo‘shish')}
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={h}
          onChange={m}
          items={[
            {
              id: 'month',
              label: c('Month', 'Oy'),
            },
            {
              id: 'upcoming',
              label: c('Upcoming', 'Yaqin'),
              count: _.length,
            },
            {
              id: 'tasks',
              label: c('Tasks due soon', 'Yaqin vazifalar'),
              count: de.length,
            },
            {
              id: 'byapp',
              label: c('By application', 'Ariza bo‘yicha'),
            },
          ]}
        />
        <div className="flex flex-wrap gap-1.5" aria-label={c('Show event types', 'Hodisa turlari')}>
          {Object.keys(Wi).map((B) => (
            <Pa active={!g.includes(B)} onClick={() => b(g.includes(B) ? g.filter((Z) => Z !== B) : [...g, B])} key={B}>
              <span className="inline-flex items-center gap-1.5">
                <span className={classNames('h-2 w-2 rounded-full', Wi[B].dot)} />
                {c(...Wi[B].label)}
              </span>
            </Pa>
          ))}
        </div>
      </div>
      {h === 'month' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="p-3 md:p-4">
            <div className="mb-3 flex items-center justify-between">
              <Button
                size="sm"
                variant="ghost"
                aria-label={c('Previous month', 'Oldingi oy')}
                icon={<ChevronLeft size={18} />}
                onClick={() => f(-1)}
              />
              <p className="font-bold">
                {Uj(y.m, d)} {y.y}
              </p>
              <Button
                size="sm"
                variant="ghost"
                aria-label={c('Next month', 'Keyingi oy')}
                icon={<ChevronRight size={18} />}
                onClick={() => f(1)}
              />
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11.5px] font-bold text-faint">
              {I.map((B) => (
                <div key={B}>{B}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {N.map((B, Z) => {
                if (!B) return <div key={Z} />;
                const oe = K.get(B) ?? [];
                return (
                  <button
                    type="button"
                    onClick={() => v(B)}
                    aria-pressed={C === B}
                    aria-label={`${me(B, d)}: ${oe.length}`}
                    className={classNames(
                      'flex min-h-[54px] flex-col items-start rounded-lg border p-1.5 text-left md:min-h-[72px]',
                      C === B ? 'border-teal bg-teal-soft/60' : 'border-transparent hover:bg-sunken',
                      B === l && 'ring-1 ring-navy',
                    )}
                    key={B}
                  >
                    <span
                      className={classNames('tabular text-[12.5px] font-semibold', B === l ? 'text-navy' : 'text-fg')}
                    >
                      {Number(B.slice(8))}
                    </span>
                    <span className="mt-auto flex flex-wrap gap-0.5">
                      {oe.slice(0, 4).map((ve) => (
                        <span
                          className={classNames(
                            'h-1.5 w-1.5 rounded-full md:h-2 md:w-2',
                            Wi[ve.kind].dot,
                            ve.done && 'opacity-30',
                          )}
                          key={ve.id}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="font-bold">{me(C, d)}</p>
            </div>
            {(K.get(C) ?? []).length ? (
              <ul>
                {(K.get(C) ?? []).map((B) => (
                  <D e={B} key={B.id} />
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-[14px] text-muted">
                {c('Nothing on this day.', 'Bu kunda hech narsa yo‘q.')}
              </p>
            )}
          </Card>
        </div>
      )}
      {h === 'upcoming' &&
        (_.length ? (
          <Card className="overflow-hidden">
            <ul>
              {_.map((B) => (
                <D e={B} key={B.id} />
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState
            title={c('No upcoming dates', 'Yaqin sanalar yo‘q')}
            body={c(
              'Save opportunities or add plans to see their deadlines here.',
              'Muddatlarini ko‘rish uchun imkoniyatlarni saqlang yoki rejaga qo‘shing.',
            )}
          />
        ))}
      {h === 'tasks' &&
        (de.length ? (
          <Card className="overflow-hidden">
            <ul>
              {de.map((B) => (
                <D e={B} key={B.id} />
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState title={c('No tasks due in the next three weeks', 'Keyingi uch haftada vazifa yo‘q')} />
        ))}
      {h === 'byapp' && (
        <div className="flex flex-col gap-4">
          {e.applications.length === 0 && <EmptyState title={c('No plans yet', 'Hali rejalar yo‘q')} />}
          {e.applications.map((B) => {
            const Z = he(B.oppId),
              oe = k.filter((ve) => ve.appId === B.id || ve.oppId === B.oppId);
            return (
              <Card className="overflow-hidden" key={B.id}>
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="font-bold">{Z.kind === 'program' ? Z.university : Z.name}</p>
                  <Button size="sm" variant="ghost" onClick={() => a('plan', B.id)}>
                    {c('Open plan', 'Rejani ochish')}
                  </Button>
                </div>
                {oe.length ? (
                  <ul>
                    {oe.map((ve) => (
                      <D e={ve} key={ve.id} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-4 text-[14px] text-muted">
                    {c(
                      'No dated items. The deadline is not announced or not verified.',
                      'Sanali bandlar yo‘q. Muddat e’lon qilinmagan yoki tasdiqlanmagan.',
                    )}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {T.length > 0 && h !== 'byapp' && (
        <p className="mt-4 text-[13px] text-muted">
          {c(
            `${T.length} plan(s) have no confirmed deadline and do not appear on the calendar: `,
            `${T.length} ta rejaning tasdiqlangan muddati yo‘q va taqvimda ko‘rinmaydi: `,
          )}
          {T.map((B) => {
            const Z = he(B.oppId);
            return Z.kind === 'program' ? Z.university : Z.name;
          }).join(', ')}
          .
        </p>
      )}
      <Card className="mt-6 p-4">
        <p className="flex items-center gap-2 font-bold">
          <BellRing size={17} />
          {c('Reminder settings', 'Eslatma sozlamalari')}
        </p>
        <p className="mt-1 text-[13.5px] text-muted">
          {c(
            'Choose when in-app reminders appear. Telegram reminders can be switched on in Settings. No emails or SMS are sent.',
            'Ilova ichidagi eslatmalar qachon chiqishini tanlang. Telegram eslatmalarini Sozlamalarda yoqish mumkin. Email yoki SMS yuborilmaydi.',
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[30, 14, 7, 3, 1].map((B) => (
            <Pa
              active={e.reminders.includes(B)}
              onClick={() => {
                const Z = e.reminders.includes(B) ? e.reminders.filter((oe) => oe !== B) : [...e.reminders, B];
                (r(Z),
                  o(
                    c(
                      `Reminders: ${Z.sort((oe, ve) => ve - oe).join(', ') || 'off'}`,
                      `Eslatmalar: ${Z.sort((oe, ve) => ve - oe).join(', ') || 'o‘chiq'}`,
                    ),
                  ));
              }}
              key={B}
            >
              {c(`${B} day${B === 1 ? '' : 's'} before`, `${B} kun oldin`)}
            </Pa>
          ))}
        </div>
      </Card>
      <CmpDS
        open={!!S}
        onClose={() => A(null)}
        title={S != null && S.id ? c('Edit date', 'Sanani tahrirlash') : c('Add a date', 'Sana qo‘shish')}
      >
        {S && (
          <div className="flex flex-col gap-3">
            <Field
              label={c('Title', 'Nomi')}
              htmlFor="ev-title"
              error={q && !((ae = S.title) != null && ae.trim()) ? q : void 0}
            >
              <Input
                id="ev-title"
                value={S.title ?? ''}
                onChange={(B) =>
                  A({
                    ...S,
                    title: B.target.value,
                  })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={c('Date', 'Sana')} htmlFor="ev-date" error={q && !S.date ? q : void 0}>
                <Input
                  id="ev-date"
                  type="date"
                  value={S.date ?? ''}
                  onChange={(B) =>
                    A({
                      ...S,
                      date: B.target.value,
                    })
                  }
                />
              </Field>
              <Field label={c('Type', 'Turi')} htmlFor="ev-kind">
                <Select
                  id="ev-kind"
                  value={S.kind ?? 'milestone'}
                  onChange={(B) =>
                    A({
                      ...S,
                      kind: B.target.value,
                    })
                  }
                >
                  {Object.keys(Wi).map((B) => (
                    <option value={B} key={B}>
                      {c(...Wi[B].label)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label={c('Related opportunity', 'Bog‘liq imkoniyat')} htmlFor="ev-opp" optional={!0}>
              <Select
                id="ev-opp"
                value={S.oppId ?? ''}
                onChange={(B) =>
                  A({
                    ...S,
                    oppId: B.target.value || void 0,
                  })
                }
              >
                <option value="">—</option>
                {[...new Set([...e.applications.map((B) => B.oppId), ...e.saved])].map((B) => {
                  const Z = he(B);
                  return Z ? (
                    <option value={B} key={B}>
                      {Z.kind === 'program' ? Z.university : Z.name}
                    </option>
                  ) : null;
                })}
              </Select>
            </Field>
            <Field label={c('Note', 'Izoh')} htmlFor="ev-note" optional={!0}>
              <Textarea
                id="ev-note"
                value={S.note ?? ''}
                onChange={(B) =>
                  A({
                    ...S,
                    note: B.target.value,
                  })
                }
              />
            </Field>
            <p className="text-[12.5px] text-faint">
              {c(
                'Dates you add are your own. They never change official deadlines.',
                'Siz qo‘shgan sanalar o‘zingizniki. Ular rasmiy muddatlarni o‘zgartirmaydi.',
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => A(null)}>{c('Cancel', 'Bekor qilish')}</Button>
              <Button variant="primary" onClick={R}>
                {c('Save', 'Saqlash')}
              </Button>
            </div>
          </div>
        )}
      </CmpDS>
    </div>
  );
}
