const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { INITIAL, Registry, parseRawGrammar } = require('vscode-textmate');
const oniguruma = require('vscode-oniguruma');

const grammarPath = path.join(__dirname, '../rpgscript.tmLanguage');
const onigLib = oniguruma.loadWASM(fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')))
  .then(() => ({
    createOnigScanner: patterns => new oniguruma.OnigScanner(patterns),
    createOnigString: text => new oniguruma.OnigString(text),
  }));
const grammar = new Registry({
  onigLib,
  loadGrammar: async () => parseRawGrammar(fs.readFileSync(grammarPath, 'utf8'), grammarPath),
}).loadGrammar('source.rpgscript');

const operatorScope = 'keyword.operator.assignment.rpgscript';
const functionScope = 'entity.name.function.rpgscript';
const constantScope = 'variable.other.constant.rpgscript';
const scriptScope = 'storage.type.function.rpgscript';

async function tokenizeLines(lines) {
  const tokenizer = await grammar;
  let stack = INITIAL;
  return lines.map(line => {
    const { tokens, ruleStack } = tokenizer.tokenizeLine(line, stack);
    stack = ruleStack;
    return { line, tokens };
  });
}

function assertScope({ line, tokens }, text, expected, start = 0) {
  const index = line.indexOf(text, start);
  assert.notEqual(index, -1, `Missing ${text} in ${line}`);
  for (let offset = index; offset < index + text.length; offset++) {
    const token = tokens.find(({ startIndex, endIndex }) => startIndex <= offset && offset < endIndex);
    assert.equal(token?.scopes.at(-1), expected, `${line} (${text}, column ${offset + 1})`);
  }
}

test('highlights the trigger prefix separately from the script name and timer interval', async function checkTriggerScopes() {
  for (const prefix of ['#', '#action', '#step', '#load', '#timer']) {
    const [header] = await tokenizeLines([`  ${prefix}@entry${prefix === '#timer' ? ', 250' : ''}`]);
    assertScope(header, prefix, functionScope);
    assertScope(header, '@entry', scriptScope);
    if (prefix === '#timer') assertScope(header, '250', constantScope);
  }
  const [trigger, script] = await tokenizeLines(['#step', '@entry']);
  assertScope(trigger, '#step', functionScope);
  assertScope(script, '@entry', scriptScope);
});

test('uses the same scopes for booleans, predicates, and command calls inside assignments', async function checkAssignmentScopes() {
  const lines = await tokenizeLines([
    '  +log(false)',
    '  +enabled=false',
    '  +^settings.enabled=true',
    '  +getChPos(John)',
    '  +[chPos]=+getChPos(John)',
    '  +[propPos]=getPropPos(crate)',
    '  +?lte([chPos]->1, 1):{',
    '    +[result]=?all(lte([chPos]->1, 1), eq(false, false))',
    '  }',
  ]);
  assertScope(lines[0], 'false', constantScope);
  assertScope(lines[1], 'false', constantScope);
  assertScope(lines[2], 'true', constantScope);
  assertScope(lines[3], 'getChPos', functionScope);
  assertScope(lines[4], 'getChPos', functionScope);
  assertScope(lines[5], 'getPropPos', functionScope);
  assertScope(lines[6], '?lte(', operatorScope);
  assertScope(lines[7], '?all(lte(', operatorScope);
  assertScope(lines[7], 'eq(', operatorScope);
  assertScope(lines[7], 'false', constantScope);
  assertScope(lines[7], '->', operatorScope);
});

test('keeps nested script calls scoped like standalone calls without consuming the condition delimiter', async function checkNestedCallScopes() {
  const lines = await tokenizeLines([
    '+:helper()',
    '  +[saved]<+:helper()',
    '  +?is(+:helper()):{',
    '    +[ok]=?gte(+:helper(), 0)',
    '  }',
    '+?eq(+:helper(), "+:helper()"):+log(true)',
    '+?lt((1+2), +:helper()):+log(false)',
    '  +?switch(result):{',
    '    eq(+:helper(), 0):{',
    '      +log(true)',
    '    }',
    '  }',
  ]);
  for (const index of [0, 1, 2, 3, 5, 6, 8]) assertScope(lines[index], '+:helper()', functionScope);
  assertScope(lines[2], '):', operatorScope, lines[2].line.indexOf('helper') + 'helper()'.length);
  assertScope(lines[3], '?gte(', operatorScope);
  assertScope(lines[5], '"+:helper()"', 'string.rpgscript');
  assertScope(lines[5], 'log', functionScope);
  assertScope(lines[6], 'log', functionScope);
  assertScope(lines[9], 'true', constantScope);
});

test('a condition assignment ends at the line break, including when incomplete', async function checkAssignmentRecovery() {
  const lines = await tokenizeLines([
    '  +[a]=?is(true) // +:helper()',
    '  +[b]=?lte(',
    '@after',
    '  +:helper()',
  ]);
  assertScope(lines[0], '// +:helper()', 'comment.rpgscript');
  assertScope(lines[2], '@after', 'storage.type.function.rpgscript');
  assertScope(lines[3], '+:helper()', functionScope);
});
