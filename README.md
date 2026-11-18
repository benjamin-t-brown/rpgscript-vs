# RPGScript for VS Code and Cursor

Standalone source for the `incanterm.rpgscript-vs` extension: syntax highlighting,
formatting, diagnostics, completion, hover help, and go-to-definition.
Neither game repository is required to build or test it.

Source: https://github.com/benjamin-t-brown/rpgscript-vs

## Build and install

Use Node.js 22 or newer and npm 11.10 or newer:

```sh
git clone https://github.com/benjamin-t-brown/rpgscript-vs.git
cd rpgscript-vs
npm ci
npm test
npm run package:vsix
cursor --install-extension ./rpgscript-vs-0.0.3.vsix --force
```

For VS Code, replace `cursor` with `code`. Alternatively run **Extensions: Install
from VSIX...** and select the generated package. Reload the editor afterward.
Disable old RPGScript copies and the separate `revirtualis.rpgscript-format`
extension; this extension already includes formatting.

`npm run package:vsix` automatically builds both production bundles. The VSIX
contains `dist/extension.js` and `dist/server.js`, including runtime dependencies;
it does not depend on `node_modules` or source files outside the package.
`npm run build` builds development bundles plus the testable server modules.

Dependency lifecycle scripts remain disabled in `.npmrc`. Use `npm ci` with the
committed lockfile; neither Yarn nor dependency install-script exceptions are
required. Packaging currently skips the missing license check; confirm licensing
before publishing extension releases.

## Workspace configuration

Keep these settings in the game, not in the extension repository.

### Regem Ludos

```json
{
  "rpgscript.scriptsRoot": "${workspaceFolder}/src/rpgscript",
  "rpgscript.sceneCommandsPath": "${workspaceFolder}/src/controller/scene/scene-commands.ts",
  "rpgscript.debug": false,
  "[rpgscript]": {
    "editor.defaultFormatter": "incanterm.rpgscript-vs"
  }
}
```

### Incanterm

Point `scriptsRoot` at the selected project's scripts directory; for example:

```json
{
  "rpgscript.scriptsRoot": "${workspaceFolder}/projects/ProjectJohnathan/assets/scripts",
  "rpgscript.sceneCommandsPath": "${workspaceFolder}/src/game/scene-commands.ts",
  "rpgscript.debug": false,
  "[rpgscript]": {
    "editor.defaultFormatter": "incanterm.rpgscript-vs"
  }
}
```

Workspace trust is required. The server reads the configured command catalog and,
when present, sibling `native-commands.ts` declarations. Missing script calls are
errors; legacy argument-count mismatches and undeclared locals are warnings.
Those Regem-compatible severities differ from Incanterm's stricter vendored
extension; review that policy before retiring its copy.

## Future updates

1. Make tooling changes and add regression tests **here**, not in either game.
2. Update `version` in `package.json` and `CHANGELOG.md`; refresh the lockfile with
   `npm install --package-lock-only`.
3. Run `npm test` and `npm run package:vsix`.
4. Install the versioned VSIX in either game's editor. There is no game runtime
   dependency on this repository and no need for a submodule.

CI builds/tests on Windows and Linux and retains versioned VSIX artifacts.
No Marketplace publishing or GitHub release publishing is configured.
After installing a verified release in both projects,
remove the vendored plugin directories in separate, explicit cleanup changes.
See `PROVENANCE.md` in the source checkout for the snapshot's origin and boundaries.

## Dependency audit

At extraction, `npm audit` reports six build-tool advisories (one moderate and
five high), involving VSCE/ts-loader glob matching dependencies. The registry
currently has no patched picomatch release for the reported advisory.
These are development dependencies, not language-server runtime dependencies.
Review them before public release; no forced upgrades or security-policy
exceptions have been applied.
