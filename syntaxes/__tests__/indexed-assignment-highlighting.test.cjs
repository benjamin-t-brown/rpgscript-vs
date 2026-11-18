const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const grammar = fs.readFileSync(path.join(__dirname, '../rpgscript.tmLanguage'), 'utf8');
const assignmentRules = grammar.split('<key>storage_assignment</key>')[1].split('<key>storage_assignment__1</key>')[0];
const assignmentBody = grammar.split('<key>storage_assignment__1</key>')[1].split('<key>trigger</key>')[0];
const argumentRules = grammar.split('<key>in_parens</key>')[1].split('<key>in_parens__1</key>')[0];

function getRegex(pattern) {
  return new RegExp(pattern.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&').replaceAll('\\x{0020}', ' '));
}

const assignmentPattern = getRegex(assignmentRules.match(/<key>begin<\/key>\s*<string>([^<]*)<\/string>/)[1]);

test('routes indexed writes through the normal variable highlighting rules', function checkIndexedWrites() {
  for (const target of ['{quest.searched}', '[searched]']) {
    for (const index of ['1', '[i]', '{quest.index}']) {
      for (const separator of ['->', ' -> ']) {
        const expression = `${target}${separator}${index}=[canId]`;
        assert.equal(assignmentPattern.exec(expression)?.index, 0, expression);
      }
    }
  }
  assert.ok(assignmentBody.includes('<string>#in_parens</string>'));
  assert.ok(assignmentBody.includes('<string>-&gt;</string>'));

  const variableRule = argumentRules.match(/<key>match<\/key><string>([^<]*\\\{[^<]*)<\/string>\s*<key>captures<\/key>([^\n]*)/);
  assert.equal(getRegex(variableRule[1]).exec('{quest.searched}')?.[2], 'quest.searched');
  assert.ok(variableRule[2].includes('<string>punctuation.terminator.statement.rpgscript</string>'));
});

test('keeps ordinary assignments recognized without mistaking blocks or indexed reads for writes', function checkAssignmentBoundaries() {
  for (const expression of ['quest.flag=true', '^quest.flag=false', '{quest.key}=1', '[value]=1', '[value]<+:getValue()']) {
    assert.equal(assignmentPattern.exec(expression)?.index, 0, expression);
  }
  for (const expression of ['{', '{quest.searched}', '{quest.searched}->1', '[searched]->[i]', '{quest.searched}->=1']) {
    assert.equal(assignmentPattern.test(expression), false, expression);
  }
});
