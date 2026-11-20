const assert = require('node:assert/strict');
const path = require('node:path');
const { lintFile } = require('../../../dist/rpgscript/lint');
const { setCommands } = require('../../../dist/generics');
const { disableConsole } = require('../../../dist/logger');

disableConsole();
setCommands(['callScript', 'log', 'playDialogue', 'setLocal']);
const root = path.resolve(__dirname);
const file = path.join(root, 'main.rpgscript');
const source = '@start\n+:poster()\n#@poster\nGuide: "Smile!"';
const result = lintFile(file, root, source);
assert.deepEqual(result.diagnostics, []);
assert.equal(result.parser.getScripts().poster.lineNum, 3);
for (const declaration of ['@poster', '#poster', '#@poster']) {
  const result = lintFile(file, root, `${source}\n${declaration}`);
  assert(result.diagnostics.some(d => String(d.code).startsWith('duplicate-')));
}
assert(lintFile(file, root, '#@poster(value)').diagnostics.some(d => d.severity === 1));

for (const [header, type, intervalMs] of [
  ['#action@poster', 'action'],
  ['#step@poster', 'step'],
  ['#load@poster', 'load'],
  ['#timer@poster, 250', 'timer', 250],
]) {
  const typed = `@start\n+:poster()\n${header}\n+[greeting]=1\nGuide: "[greeting]"`;
  const result = lintFile(file, root, typed);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.parser.getScripts().poster.lineNum, 3);
  assert.deepEqual(result.parser.getTriggers().poster.scriptCalls, [
    { type, condition: true, scriptName: 'poster', ...(intervalMs === undefined ? {} : { intervalMs }) },
  ]);
  const duplicate = lintFile(file, root, `${typed}\n#@poster`);
  for (const kind of ['script', 'trigger']) {
    const declaration = duplicate.diagnostics.find(d => d.code === `duplicate-${kind}` && d.range.start.line === 2);
    assert.equal(declaration?.range.start.character, header.indexOf('poster'));
    assert.equal(declaration?.range.end.character, header.indexOf('poster') + 'poster'.length);
  }
}

for (const header of ['#timer@clock', '#timer@clock,0', '#timer@clock,Guide,250',
  '#step@door,10', '#load@intro(value)', '#item@pickup']) {
  assert(lintFile(file, root, header).diagnostics.some(d => d.severity === 1), header);
}
console.log('Inline trigger headers: declarations, references, locations, intervals, and duplicates passed.');
