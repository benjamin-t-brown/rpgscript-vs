const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { lintFile } = require('../../../dist/rpgscript/lint');
const { setCommands } = require('../../../dist/generics');
const { disableConsole } = require('../../../dist/logger');

disableConsole();
setCommands(['getChPos', 'getPropPos', 'returnValue', 'setStorage', 'setLocal', 'log']);
const root = path.resolve(__dirname);
const file = path.join(root, 'expressions.rpgscript');

test('accepts a scene command result and a returned boolean used as a guard', function checkPositionGuard() {
  const source = `@isUpstairs
  +[chPos]=+getChPos(John)
  +[result]=?lte([chPos]->1, 1)
  <[result]

@openTerminal
  +?is(+:isUpstairs()):{
    <
  }
  +position=getPropPos(terminal)
  +log("Opened")`;
  assert.deepEqual(lintFile(file, root, source).diagnostics, []);
});

test('tracks calls in conditions and ignores script-like text inside strings', function checkScriptReferences() {
  const source = `@start
  +[matches]=?eq(+:read("0"), "0")
  +?all(is(true), eq(+:read("x"), "+:notAScript()")):+log("Matched")
  +?is(+:missing()):+log("Check")
  +?gte(+:read(), 0):+log("Check arguments")
@read(value)
  <[value]`;
  const { diagnostics } = lintFile(file, root, source);
  assert.deepEqual(diagnostics.map(diagnostic => [diagnostic.code, diagnostic.range.start.line]), [
    ['unknown-script', 3],
    ['script-argument-count', 4],
  ]);
});

test('still reports invalid commands and comparisons in assignments', function checkInvalidExpressions() {
  const unknown = lintFile(file, root, '@start\n+[pos]=+notACommand(John)').diagnostics;
  assert.match(unknown[0]?.message ?? '', /No command exists with name "notACommand"/);

  const missingOperand = lintFile(file, root, '@start\n+[result]=?lt(1)').diagnostics;
  assert.match(missingOperand[0]?.message ?? '', /Invalid arguments for condition lt/);
});
