import type { Level } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { Field, Input, Select } from '../components/ui';

export type Target =
  | { kind: 'none' }
  | { kind: 'uni'; id: string; level: Level }
  | { kind: 'grant'; id: string }
  | { kind: 'custom'; name: string };

export const NO_TARGET: Target = { kind: 'none' };

/** The university or scholarship an analysis is judged against. Fit can only be judged against a target. */
export function TargetPicker({ value, onChange }: { value: Target; onChange: (t: Target) => void }) {
  const { tx, t } = useI18n();
  const { universities, grants } = useCatalog();
  const national = grants.filter((g) => g.kind === 'national');

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={tx('Target university or scholarship', 'Maqsad: universitet yoki grant')}>
        <Select
          value={value.kind}
          onChange={(e) => {
            const k = e.target.value;
            onChange(k === 'uni' ? { kind: 'uni', id: universities[0]!.id, level: 'master' } : k === 'grant' ? { kind: 'grant', id: national[0]!.id } : k === 'custom' ? { kind: 'custom', name: '' } : NO_TARGET);
          }}
        >
          <option value="none">{tx('No target chosen', 'Maqsad tanlanmagan')}</option>
          <option value="uni">{tx('A university in EduBridge', 'EduBridge’dagi universitet')}</option>
          <option value="grant">{tx('A national grant in EduBridge', 'EduBridge’dagi milliy grant')}</option>
          <option value="custom">{tx('Something else (not verified)', 'Boshqa (tasdiqlanmagan)')}</option>
        </Select>
      </Field>
      {value.kind === 'uni' && (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field label={t('nav.universities')}>
            <Select value={value.id} onChange={(e) => onChange({ ...value, id: e.target.value })}>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label={tx('Level', 'Daraja')}>
            <Select value={value.level} onChange={(e) => onChange({ ...value, level: e.target.value as Level })}>
              <option value="bachelor">{t('lvl.bachelor')}</option>
              <option value="master">{t('lvl.master')}</option>
            </Select>
          </Field>
        </div>
      )}
      {value.kind === 'grant' && (
        <Field label={t('nav.scholarships')}>
          <Select value={value.id} onChange={(e) => onChange({ kind: 'grant', id: e.target.value })}>
            {national.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </Field>
      )}
      {value.kind === 'custom' && (
        <Field label={tx('Name', 'Nomi')}>
          <Input value={value.name} maxLength={200} onChange={(e) => onChange({ kind: 'custom', name: e.target.value })} />
        </Field>
      )}
      {value.kind === 'custom' && <p className="text-xs text-muted sm:col-span-2">{tx('EduBridge has no verified record of this, so the advisor will not state its requirements as fact.', 'EduBridge’da bu haqda tasdiqlangan ma’lumot yo‘q, shuning uchun maslahatchi uning talablarini fakt sifatida aytmaydi.')}</p>}
    </div>
  );
}

/** Converts the picker value to the API shape; an empty custom name means "no target". */
export const toApiTarget = (t: Target): Target => (t.kind === 'custom' && !t.name.trim() ? NO_TARGET : t);
