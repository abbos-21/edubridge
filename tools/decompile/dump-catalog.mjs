#!/usr/bin/env node
/**
 * Writes the catalogue data of the original app to JSON (the database seed and the offline snapshot).
 *   node dump-catalog.mjs <apps/web/src/data/raw.js> <out.json>
 * The data in the original source calls small helper functions (shared source objects, essay prompts); importing the
 * module evaluates them, so the JSON holds plain values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , rawPath, outPath] = process.argv;
if (!rawPath || !outPath) {
  console.error('usage: node dump-catalog.mjs <raw.js> <out.json>');
  process.exit(1);
}
const raw = await import(pathToFileURL(path.resolve(rawPath)).href);
const catalog = {
  /** the 7 national grants and other scholarships (the "opportunities" the app lists) */
  scholarships: raw.Kb,
  /** programmes of the demo and extra universities */
  programs: raw.yh,
  legacyUniversities: raw.Yb,
  legacyScholarships: raw.Wb,
  /** the curated 5-country x 10-university catalogue */
  checked: raw.Vb,
  selection: raw.Qb,
  universities: raw.Xb,
  grants: raw.Jb,
};
fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(catalog));
const counts = Object.fromEntries(Object.entries(catalog).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v === 'string' ? v : Object.keys(v).length]));
console.log(counts, (fs.statSync(outPath).size / 1024).toFixed(0) + ' KB');
