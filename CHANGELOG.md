# Change Log

All notable changes to the "rpgscript-vscode-linter" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release

## [0.0.3] - 2026-11-17

- Extract the language extension from Regem Ludos into a standalone source repo.
- Sync Incanterm highlighting for indexed writes, complete numeric/boolean
  literals, digit-prefixed arguments, substitutions, and conditional keywords.
- Port comment-aware formatting and safe indentation into the built-in formatter.
- Retain native command support, interpolated script targets and legacy warnings.
- Build/test/package with npm; bundle both client and server in a versioned VSIX.
