#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const localeDir = resolve(root, 'src/locales');

const stripJsonComments = (text) => {
  let output = '';
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < text.length) {
    const current = text[i];
    const next = text[i + 1];

    if (inString) {
      output += current;
      if (escaped) {
        escaped = false;
      } else if (current === '\\') {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
      output += current;
      i += 1;
      continue;
    }

    if (current === '/' && next === '/') {
      i += 2;
      while (i < text.length && text[i] !== '\n') i += 1;
      continue;
    }

    if (current === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    output += current;
    i += 1;
  }

  return output;
};

const stripTrailingCommas = (text) => text.replace(/,\s*([}\]])/g, '$1');

const parseJsoncObject = (fileName) => {
  const content = readFileSync(resolve(localeDir, fileName), 'utf8');
  const cleaned = stripTrailingCommas(stripJsonComments(content));
  const parsed = JSON.parse(cleaned);
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${fileName} root must be an object`);
  }
  return parsed;
};

const en = parseJsoncObject('en.ui.grouped.jsonc');
const fr = parseJsoncObject('fr.ui.grouped.jsonc');

const enKeys = new Set(Object.keys(en));
const frKeys = new Set(Object.keys(fr));

const missingInFr = [...enKeys].filter((key) => !frKeys.has(key)).sort();
const missingInEn = [...frKeys].filter((key) => !enKeys.has(key)).sort();

if (missingInFr.length > 0 || missingInEn.length > 0) {
  if (missingInFr.length > 0) {
    console.error('Missing in fr.ui.grouped.jsonc:');
    for (const key of missingInFr) console.error(`  - ${key}`);
  }
  if (missingInEn.length > 0) {
    console.error('Missing in en.ui.grouped.jsonc:');
    for (const key of missingInEn) console.error(`  - ${key}`);
  }
  process.exit(1);
}

console.log(`Locale validation passed (${enKeys.size} keys aligned).`);
