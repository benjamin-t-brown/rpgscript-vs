const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const tests = [
  ...fs.readdirSync(__dirname)
    .filter(file => /^test-.*\.js$/.test(file))
    .map(file => path.join('scripts', file)),
  ...['src/__tests__', 'src/server/src/rpgscript/__tests__', 'syntaxes/__tests__'].flatMap(dir =>
    fs.readdirSync(path.join(root, dir))
      .filter(file => file.endsWith('.cjs'))
      .map(file => path.join(dir, file))
  ),
];

let failed = 0;
for (const test of tests) {
  console.log(test);
  const result = spawnSync(process.execPath, [test], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) failed++;
}
console.log(`${tests.length} test files; ${failed} failed.`);
process.exitCode = failed ? 1 : 0;
