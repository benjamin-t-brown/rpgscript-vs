# Extraction provenance

Created as a source snapshot on 2026-11-17; no parent repository history was
rewritten. The maintainer subsequently supplied this standalone remote:
https://github.com/benjamin-t-brown/rpgscript-vs

- Base: `C:/progs/regem-ludos/rpgscript-vs`, from Regem Ludos revision
  `782cebb78218b23a2246a530b9c5d6fd2bea4b2b` plus the tooling updates made during
  extraction.
- Highlighting and formatter updates: working tree of
  `C:/progs/incanterm/reference/rpgscript-regem-ludos`, based on Incanterm revision
  `5c47e2c81bff9e840d627c63584dad7e1c3a9946`. The grammar changes and
  `indexed-assignment-highlighting.test.cjs` included uncommitted source work.
- Retained Regem-specific support: native command discovery, interpolated script
  targets, legacy parsing and diagnostic severities, optional `+` before control
  commands, and self-contained client/server bundles.
- Ported the updated legacy formatter's comment handling and indentation into
  the existing built-in formatter, with regression tests.

Only plugin source, tests, grammar, icon and build configuration were extracted.
Game scripts, runtime implementations, dependencies and generated JavaScript
were not copied. The legacy separate formatter is unnecessary because the
language extension already registers a formatting provider.

Standalone build changes use npm, an explicit lockfile, direct TypeScript output
to `src/server/dist`, minimal required dependencies, and pinned VSIX packaging.
The game repositories retain their current plugin copies pending migration.

No license grant is inferred from this extraction. Confirm licensing before
publishing extension releases.
