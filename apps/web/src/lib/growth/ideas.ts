import type { L } from '@edubridge/shared';
import data from '../../data/growth.json';

/** The 36 activity ideas of the profile builder, in English and Uzbek (Russian comes from the dictionary). */
export type Group = 'selective' | 'middle' | 'accessible';
export type Cost = 'free' | 'low' | 'some';
export type Idea = {
  id: string;
  cat: string;
  signals: string[];
  fields: 'all' | string[];
  levels: Array<'bachelor' | 'master'>;
  months: number;
  hours: number;
  cost: Cost;
  effort: number;
  groups: Group[];
  title: L;
  what: L;
  steps: L[];
  cv: L;
  angle: L;
  pitfall: L;
  evidence: L;
  ladder: [L, L, L];
};

export const IDEAS = data.ideas as unknown as Idea[];
export const CATEGORIES = data.categories as Record<string, L>;
export const SIGNALS = data.signals as Record<string, L>;
export const MIN_IELTS = data.minIelts as unknown as Record<Group, { bachelor: number; master: number }>;
export const MIN_GRADES = data.minGrades as unknown as Record<Group, { percent: number; gpa4: number }>;
