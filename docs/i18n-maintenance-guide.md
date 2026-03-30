# i18n Maintenance Guide (Flat Keys + JSONC)

This project uses **flat i18n keys** with JSONC as the source of truth.

## Source of truth
- Edit only:
  - `src/locales/en.ui.grouped.jsonc`
  - `src/locales/fr.ui.grouped.jsonc`
- Generated files (do not edit manually):
  - `src/locales/en.json`
  - `src/locales/fr.json`

## Key format
- Use flat keys with `ui.` prefix.
- Example: `ui.failed_to_fetch_data`
- Keep keys semantic and stable.

## 1) Update existing text
1. Change value in `en.ui.grouped.jsonc`.
2. Change matching value in `fr.ui.grouped.jsonc`.
3. Run:
   - `npm run i18n:sync`
4. Commit both JSONC + generated JSON.

## 2) Add new flat key
1. Add key in `en.ui.grouped.jsonc` under the most relevant section comment.
2. Add the same key in `fr.ui.grouped.jsonc`.
3. Run:
   - `npm run i18n:sync`
4. Use in code:
   - `t('ui.your_new_key')`

### Example
```jsonc
// Support Center
"ui.this_feature_is_currently_unavailable": "This feature is currently unavailable."
```
```jsonc
// Support Center
"ui.this_feature_is_currently_unavailable": "Cette fonctionnalité est actuellement indisponible."
```

## 3) Add a new language (example: Spanish `es`)

### A. Add locale source + generated file mapping
1. Create `src/locales/es.ui.grouped.jsonc`.
2. In `scripts/sync-locales-jsonc.mjs`, add mapping:
   - `['es.ui.grouped.jsonc', 'es.json']`
3. In `scripts/validate-locales-jsonc.mjs`, include `es` in parity checks (same key set as `en`).

### B. Register language in app
1. In `src/locales/index.ts`:
   - import `es` from `./es.json`
   - extend `supportedLngs` union to include `'es'`
   - add to `SupportedLanguages` map
   - add `es` in `resources`
   - add `'es'` in `supportedLngs` init option
   - update `getInitialLanguage()` and `languageChanged` guard to accept `'es'`

### C. Sync + verify
1. Run `npm run i18n:sync`
2. Ensure validation passes.
3. Switch language in UI and smoke-test key screens.

## Section comments guideline
- Keep section comments simple (no `--`), e.g. `// Transfer`, `// Shared`.
- `// Shared` should contain only cross-page labels.
- Put page/domain-specific keys in their domain sections.

## Quality checklist
- No typo in key names.
- No duplicate keys.
- EN/FR/(new language) key sets aligned.
- No hardcoded UI strings left in TSX.

## Common commands
- Sync + validate locales:
  - `npm run i18n:sync`
- Validate only:
  - `npm run i18n:validate`
