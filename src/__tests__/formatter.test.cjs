const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../formatter.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, {
  exports: exportsObject,
  require(name) {
    assert.equal(name, 'vscode');
    return { TextEdit: { replace: (range, newText) => ({ range, newText }) } };
  },
});

function formatScript(source) {
  const lines = source.split('\n');
  const edits = exportsObject.getFormattingEdits({
    lineCount: lines.length,
    lineAt: index => ({ text: lines[index], range: index }),
  });
  for (const edit of edits) lines[edit.range] = edit.newText;
  return lines.join('\n');
}

test('indents commented blocks and comments, and clamps unmatched closing braces', function checkIndentation() {
  assert.equal(formatScript([
    '}',
    '@start',
    '+?if(true): { // begin',
    '// body comment',
    '+log("hello"); // preserve',
    '} // end',
    '+log("after")',
  ].join('\n')), [
    '}',
    '@start',
    '  +?if(true): { // begin',
    '    // body comment',
    '    +log("hello") // preserve',
    '  } // end',
    '  +log("after")',
  ].join('\n'));
});

test('keeps comment markers inside strings and respects escaped quotes', function checkQuotedComments() {
  const source = '@start\n+log("https://example.test/*path*/", "say \\"//hi\\"");\n+?if(true): { /* begin */\n+log("ok")\n}';
  assert.equal(formatScript(source), '@start\n  +log("https://example.test/*path*/", "say \\"//hi\\"")\n  +?if(true): { /* begin */\n    +log("ok")\n  }');
  assert.equal(formatScript(formatScript(source)), formatScript(source));
});
