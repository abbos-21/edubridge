#!/usr/bin/env node
/**
 * Rebuilds readable React source from the original EduBridge HTML artifact (a single-file Vite build).
 *
 *   node decompile.mjs <original.html> <out-dir>
 *
 * What it does, in order:
 *  1. cuts the compiled stylesheet and the module script out of the HTML;
 *  2. parses the script and splits every top-level declaration into a unit;
 *  3. drops the bundled libraries (React, ReactDOM) and replaces them with real imports; bundled icons become
 *     `lucide-react` imports;
 *  4. turns every `jsx(type, props)` call back into JSX, so the class names and DOM stay exactly as they were;
 *  5. extracts embedded images to files and renames identifiers using `names.json`;
 *  6. groups the units into modules (`modules.mjs`), computes imports and exports, and prints formatted files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import traverseMod from '@babel/traverse';
import generateMod from '@babel/generator';
import * as t from '@babel/types';
import prettier from 'prettier';

const traverse = traverseMod.default ?? traverseMod;
const generate = generateMod.default ?? generateMod;
const here = path.dirname(fileURLToPath(import.meta.url));
const [, , htmlPath, outDir] = process.argv;
if (!htmlPath || !outDir) {
  console.error('usage: node decompile.mjs <original.html> <out-dir>');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const names = JSON.parse(fs.readFileSync(path.join(here, 'names.json'), 'utf8'));
const { default: MODULES, DATA_START, ENTRY_START } = await import('./modules.mjs');
const write = (rel, data) => {
  const p = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
};

// ------------------------------------------------------------------ 1. cut the HTML
const cssOpen = '<style rel="stylesheet" crossorigin>';
const cssStart = html.indexOf(cssOpen) + cssOpen.length;
write('src/styles/original.css', html.slice(cssStart, html.indexOf('</style>', cssStart)));
const jsOpen = '<script type="module" crossorigin>';
const js = html.slice(html.indexOf(jsOpen) + jsOpen.length, html.lastIndexOf('</script>'));

// ------------------------------------------------------------------ 2. units
const ast = parse(js, { sourceType: 'module' });
const bindingNames = (id, out = []) => {
  if (t.isIdentifier(id)) out.push(id.name);
  else if (t.isObjectPattern(id)) id.properties.forEach((p) => bindingNames(t.isRestElement(p) ? p.argument : p.value, out));
  else if (t.isArrayPattern(id)) id.elements.forEach((e) => e && bindingNames(e, out));
  else if (t.isAssignmentPattern(id)) bindingNames(id.left, out);
  return out;
};
const units = [];
for (const st of ast.program.body) {
  if (t.isVariableDeclaration(st)) {
    for (const d of st.declarations) units.push({ kind: st.kind, node: d, start: d.start, end: d.end, names: bindingNames(d.id), isVar: true });
  } else if (t.isFunctionDeclaration(st) || t.isClassDeclaration(st)) {
    units.push({ node: st, start: st.start, end: st.end, names: [st.id.name] });
  } else {
    units.push({ node: st, start: st.start, end: st.end, names: [] });
  }
}
const unitAt = (pos) => {
  let lo = 0, hi = units.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (units[mid].start <= pos) lo = mid; else hi = mid - 1;
  }
  return units[lo];
};

// ------------------------------------------------------------------ 3. what is bundled library
const iconName = (u) => {
  const n = u.node;
  if (!u.isVar || !t.isCallExpression(n.init) || !t.isIdentifier(n.init.callee)) return null;
  const a = n.init.arguments;
  return a.length === 2 && t.isStringLiteral(a[0]) && t.isArrayExpression(a[1]) && /^[A-Z][A-Za-z0-9]*$/.test(a[0].value) ? a[0].value : null;
};
const icons = new Map(); // bundle name -> lucide name
for (const u of units) {
  const ic = iconName(u);
  if (ic && u.start < ENTRY_START) {
    icons.set(u.names[0], ic);
    u.drop = 'icon';
  }
}
for (const u of units) if (!u.drop && u.start < DATA_START) u.drop = 'vendor';
// the three library handles the app uses
const LIB = { React: 'z', jsx: 'i', createRoot: 'tg' };
const LIB_ORIG = { ...LIB };
let programScope;
traverse(ast, { Program(p) { programScope = p.scope; p.stop(); } });
const isProgramBinding = (path, name) => path.scope.getBinding(name) === programScope.getBinding(name) && !!programScope.getBinding(name);

// ------------------------------------------------------------------ 4. JSX
const jsxFallback = new Set();
const safeAttr = (s) => !/["\\\n\r&<>{}]/.test(s);
const safeText = (s) => s.length > 0 && s === s.trim() && !/[{}<>&\\\n\r]/.test(s) && !/\s{2,}/.test(s);
const nameOfType = (n) => {
  if (t.isStringLiteral(n)) return /^[a-z][a-z0-9-]*$/.test(n.value) ? t.jsxIdentifier(n.value) : null;
  if (t.isIdentifier(n)) return /^[A-Z]/.test(n.name) ? t.jsxIdentifier(n.name) : null;
  if (t.isMemberExpression(n) && !n.computed && t.isIdentifier(n.property)) {
    const o = nameOfType(n.object);
    return o && !t.isJSXMemberExpression(o) ? t.jsxMemberExpression(o, t.jsxIdentifier(n.property.name)) : o ? t.jsxMemberExpression(o, t.jsxIdentifier(n.property.name)) : null;
  }
  return null;
};
const jsxMemberFromIdentifierMember = (n) => {
  // members like a.Provider where `a` is lower case are legal in JSX
  if (t.isMemberExpression(n) && !n.computed && t.isIdentifier(n.property)) {
    const obj = t.isIdentifier(n.object) ? t.jsxIdentifier(n.object.name) : jsxMemberFromIdentifierMember(n.object);
    return obj ? t.jsxMemberExpression(obj, t.jsxIdentifier(n.property.name)) : null;
  }
  return null;
};
const toChild = (n) => {
  if (t.isJSXElement(n) || t.isJSXFragment(n)) return n;
  if (t.isStringLiteral(n) && safeText(n.value)) return t.jsxText(n.value);
  return t.jsxExpressionContainer(n);
};
const attrValue = (v) => (t.isStringLiteral(v) && safeAttr(v.value) ? v : t.jsxExpressionContainer(v));

function toJsx(call, path) {
  const [type, props] = call.arguments;
  if (!type) return null;
  // fragment
  const isFragment = t.isMemberExpression(type) && t.isIdentifier(type.object) && type.object.name === LIB.jsx && t.isIdentifier(type.property, { name: 'Fragment' }) && isProgramBinding(path, LIB.jsx);
  let el = isFragment ? null : nameOfType(type);
  if (!isFragment && !el && t.isIdentifier(type) && /^[a-z]/.test(type.name)) el = null; // lower-case component: keep the call
  if (!isFragment && !el && t.isMemberExpression(type)) el = jsxMemberFromIdentifierMember(type);
  if (!isFragment && !el) return null;
  const attrs = [];
  let children = [];
  if (props && t.isObjectExpression(props)) {
    for (const p of props.properties) {
      if (t.isSpreadElement(p)) { attrs.push(t.jsxSpreadAttribute(p.argument)); continue; }
      if (!t.isObjectProperty(p) || p.computed) return null;
      const key = t.isIdentifier(p.key) ? p.key.name : t.isStringLiteral(p.key) ? p.key.value : null;
      if (key === null || !/^[A-Za-z_$][\w$-]*$/.test(key)) return null;
      if (key === 'children') {
        if (t.isArrayExpression(p.value)) {
          for (const e of p.value.elements) {
            if (!e || t.isSpreadElement(e)) return null;
            children.push(toChild(e));
          }
        } else children = [toChild(p.value)];
      } else attrs.push(t.jsxAttribute(t.jsxIdentifier(key), attrValue(p.value)));
    }
  } else if (props) attrs.push(t.jsxSpreadAttribute(props));
  // a `key` as third argument (jsx(type, props, key))
  if (call.arguments[2]) attrs.push(t.jsxAttribute(t.jsxIdentifier('key'), t.jsxExpressionContainer(call.arguments[2])));
  if (isFragment) {
    if (attrs.length) return null;
    return t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children);
  }
  const selfClose = children.length === 0;
  return t.jsxElement(t.jsxOpeningElement(el, attrs, selfClose), selfClose ? null : t.jsxClosingElement(el), children, selfClose);
}

let jsxCount = 0, jsxKept = 0;
function convertJsx() {
  traverse(ast, {
    CallExpression: {
      exit(path) {
        const c = path.node.callee;
        if (!t.isMemberExpression(c) || !t.isIdentifier(c.object, { name: LIB.jsx }) || !t.isIdentifier(c.property)) return;
        if (c.property.name !== 'jsx' && c.property.name !== 'jsxs') return;
        if (!isProgramBinding(path, LIB.jsx)) return;
        const out = toJsx(path.node, path);
        if (out) { path.replaceWith(out); jsxCount++; } else { jsxKept++; jsxFallback.add(unitAt(path.node.start ?? 0)); }
      },
    },
  });
  console.log(`jsx converted: ${jsxCount}, kept as calls: ${jsxKept}`);
}

// ------------------------------------------------------------------ 5. images
const assets = []; // { name, file }
for (const u of units) {
  if (u.drop || !u.isVar || !t.isStringLiteral(u.node.init)) continue;
  const m = /^data:image\/([a-z0-9+.-]+);base64,(.+)$/s.exec(u.node.init.value);
  if (!m || m[2].length < 2000) continue;
  const ext = m[1] === 'svg+xml' ? 'svg' : m[1];
  const base = names[u.names[0]] ?? u.names[0];
  const file = `src/assets/${base}.${ext}`;
  write(file, Buffer.from(m[2], 'base64'));
  assets.push({ name: u.names[0], base, file: `${base}.${ext}` });
  u.asset = `${base}.${ext}`;
}
console.log(`images extracted: ${assets.length}`);

// ------------------------------------------------------------------ 6. dependency graph and naming
const scopeInfo = programScope;
const declUnit = new Map(); // name -> unit
for (const u of units) for (const n of u.names) declUnit.set(n, u);
const deps = new Map(); // unit -> Set(name)
const used = new Set(); // unit used by other unit
for (const u of units) deps.set(u, new Set());
for (const [name, b] of Object.entries(scopeInfo.bindings)) {
  const owner = declUnit.get(name);
  for (const ref of b.referencePaths) {
    const user = unitAt(ref.node.start);
    if (user !== owner) deps.get(user)?.add(name);
  }
  for (const ref of b.constantViolations) {
    const user = unitAt(ref.node.start ?? 0);
    if (user !== owner) deps.get(user)?.add(name);
  }
}
const iconNames = new Set(icons.keys());
const libNames = new Set(Object.values(LIB_ORIG));

// module of a unit
const moduleOf = (u) => {
  let m = MODULES[0][1];
  for (const [from, name] of MODULES) if (u.start >= from) m = name;
  return m;
};
for (const u of units) if (!u.drop) u.module = u.asset ? 'assets/index' : moduleOf(u);

// export set: names used from another module
const exported = new Map(); // module -> Set(name)
const importsOf = new Map(); // module -> Map(fromModule -> Set(name))
const need = (mod, from, name) => {
  if (!importsOf.has(mod)) importsOf.set(mod, new Map());
  const m = importsOf.get(mod);
  if (!m.has(from)) m.set(from, new Set());
  m.get(from).add(name);
  if (!exported.has(from)) exported.set(from, new Set());
  exported.get(from).add(name);
};
const lucideNeed = new Map(); // module -> Set(bundle name)
const libNeed = new Map(); // module -> Set(key)
for (const u of units) {
  if (u.drop) continue;
  for (const name of deps.get(u)) {
    if (iconNames.has(name)) { (lucideNeed.get(u.module) ?? lucideNeed.set(u.module, new Set()).get(u.module)).add(name); continue; }
    if (libNames.has(name)) { (libNeed.get(u.module) ?? libNeed.set(u.module, new Set()).get(u.module)).add(name); continue; }
    const d = declUnit.get(name);
    if (!d) continue;
    if (d.drop === 'vendor') { console.warn(`unresolved vendor reference: ${name} (in ${u.module})`); continue; }
    if (d.module !== u.module) need(u.module, d.module, name);
  }
}

// rename (program level), including icons -> lucide names
const renameMap = { ...names };
for (const [bundleName, lucide] of icons) renameMap[bundleName] = lucide;
renameMap[LIB_ORIG.React] = 'React';
renameMap[LIB_ORIG.jsx] = 'jsxRuntime';
renameMap[LIB_ORIG.createRoot] = 'createRoot';
const taken = new Set(Object.keys(scopeInfo.bindings));
const finalName = (n) => renameMap[n] ?? n;
// avoid collisions between renamed names
const seen = new Map();
for (const n of Object.keys(scopeInfo.bindings)) {
  const f = finalName(n);
  if (seen.has(f) && seen.get(f) !== n) console.warn(`name collision: ${n} and ${seen.get(f)} -> ${f}`);
  seen.set(f, n);
}
for (const [from, to] of Object.entries(renameMap)) {
  if (from !== to && scopeInfo.hasOwnBinding(from)) {
    try { scopeInfo.rename(from, to); } catch (e) { console.warn('rename failed', from, to, e.message); }
  }
}
const R = (n) => finalName(n);

// component types that are still lower case (not in names.json) must be capitalised to be valid JSX
{
  const pending = new Map(); // program-level name -> new name
  traverse(ast, {
    CallExpression(path) {
      const c = path.node.callee;
      if (!t.isMemberExpression(c) || !t.isIdentifier(c.object, { name: 'jsxRuntime' }) || !t.isIdentifier(c.property)) return;
      if (c.property.name !== 'jsx' && c.property.name !== 'jsxs') return;
      const type = path.node.arguments[0];
      if (!t.isIdentifier(type) || /^[A-Z]/.test(type.name)) return;
      const binding = path.scope.getBinding(type.name);
      if (!binding) return;
      const next = 'Cmp' + type.name[0].toUpperCase() + type.name.slice(1);
      if (binding.scope === programScope) pending.set(type.name, next);
      else if (!binding.scope.hasBinding(next)) binding.scope.rename(type.name, next);
    },
  });
  for (const [from, to] of pending) {
    if (!programScope.hasBinding(to)) { programScope.rename(from, to); renameMap[from] = to; }
  }
}
LIB.jsx = 'jsxRuntime';
convertJsx();

// ------------------------------------------------------------------ 7. print modules
const byModule = new Map();
for (const u of units) {
  if (u.drop) continue;
  if (!byModule.has(u.module)) byModule.set(u.module, []);
  byModule.get(u.module).push(u);
}
const relImport = (from, to) => {
  let r = path.posix.relative(path.posix.dirname(from), to);
  if (!r.startsWith('.')) r = './' + r;
  return r;
};
const printed = [];
for (const [mod, list] of byModule) {
  const body = [];
  const exp = exported.get(mod) ?? new Set();
  // imports
  const imps = [];
  if (libNeed.get(mod)?.has(LIB_ORIG.React)) imps.push(`import React from 'react';`);
  if (libNeed.get(mod)?.has(LIB_ORIG.jsx) || jsxFallbackIn(list)) imps.push(`import * as jsxRuntime from 'react/jsx-runtime';`);
  if (libNeed.get(mod)?.has(LIB_ORIG.createRoot)) imps.push(`import { createRoot } from 'react-dom/client';`);
  const ic = [...(lucideNeed.get(mod) ?? [])].map((n) => icons.get(n)).sort();
  if (ic.length) imps.push(`import { ${ic.join(', ')} } from 'lucide-react';`);
  for (const [from, set] of importsOf.get(mod) ?? []) {
    imps.push(`import { ${[...set].map(R).sort().join(', ')} } from '${relImport(mod, from)}';`);
  }
  if (mod === 'assets/index') {
    for (const u of list) imps.push(`import ${R(u.names[0])}_file from './${u.asset}';`);
  }
  for (const u of list) {
    if (u.asset) {
      body.push(`export const ${R(u.names[0])} = ${R(u.names[0])}_file;`);
      continue;
    }
    let node;
    if (u.isVar) node = t.variableDeclaration(u.kind, [u.node]);
    else node = u.node;
    const isExp = u.names.some((n) => exp.has(n));
    if (isExp && u.names.length === 1) node = t.exportNamedDeclaration(node, []);
    else if (isExp) node = t.exportNamedDeclaration(node, []);
    body.push(generate(node, { compact: false, comments: false, jsescOption: { minimal: true } }).code);
  }
  if (mod === 'main') {
    // entry module: nothing to export
  }
  printed.push({ mod, code: [...imps, '', ...body].join('\n') });
}
function jsxFallbackIn(list) {
  return list.some((u) => jsxFallback.has(u));
}

for (const { mod, code } of printed) {
  let out = code;
  try {
    out = await prettier.format(code, { parser: 'babel', printWidth: 120, singleQuote: true, trailingComma: 'all' });
  } catch (e) {
    console.warn(`prettier failed for ${mod}: ${e.message.split('\n')[0]}`);
  }
  write(`src/${mod}.${mod === 'main' ? 'jsx' : /<[A-Za-z]/.test(out) ? 'jsx' : 'js'}`, out);
}
console.log(`modules: ${printed.length}, units: ${units.length}, dropped: ${units.filter((u) => u.drop).length}`);
