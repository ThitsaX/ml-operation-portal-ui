#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const localeDir = resolve(root, 'src/locales');

const localeMappings = [
  ['en.ui.grouped.jsonc', 'en.json'],
  ['fr.ui.grouped.jsonc', 'fr.json']
];

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

const parseJsoncObject = (text, fileName) => {
  try {
    const cleaned = stripTrailingCommas(stripJsonComments(text));
    const parsed = JSON.parse(cleaned);
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Locale root must be an object.');
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${fileName}: ${message}`);
  }
};

for (const [sourceFile, outputFile] of localeMappings) {
  const sourcePath = resolve(localeDir, sourceFile);
  const outputPath = resolve(localeDir, outputFile);
  const source = readFileSync(sourcePath, 'utf8');
  const parsed = parseJsoncObject(source, sourceFile);
  writeFileSync(outputPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  console.log(`Synced ${sourceFile} -> ${outputFile}`);
}
