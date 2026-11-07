import type { L, University } from '@edubridge/shared';

export type CountryRecord = {
  code: string;
  position: number;
  name: L;
  tagline: L;
  selection?: L;
  guidance?: { bachelor?: L; master?: L; notes?: L[]; sources?: string[] };
  documents?: Partial<Record<'bachelor' | 'master', Array<{ label: L; kind: 'required' | 'depends' | 'optional' }>>>;
  steps?: Partial<Record<'bachelor' | 'master', L[]>>;
  universityCount?: number;
};

/** National grants have researched fields; "other" ones come from an older import and have a different shape. */
export type GrantRecord = Record<string, any> & { id: string; kind: 'national' | 'other'; name: string; country: string };

export type Catalogue = {
  version: number;
  universities: University[];
  grants: GrantRecord[];
  countries: CountryRecord[];
};
