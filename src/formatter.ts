import { languages, TextDocument, TextEdit } from 'vscode';

function replaceRepeatedQuotedSpaces(text: string): string {
  let quote = '';
  let result = '';
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === quote) quote = '';
    else if (!quote && (character === '"' || character === "'")) quote = character;

    if (quote && character === ' ' && text[index + 1] === ' ') {
      result += ' ';
      while (text[index + 1] === ' ') index++;
    } else {
      result += character;
    }
  }
  return result;
}

// Ignore comments only outside quoted strings when deciding indentation.
function stripComments(text: string): string {
  let result = '';
  let quote = '';
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quote) {
      result += character;
      if (character === '\\' && index + 1 < text.length) result += text[++index];
      else if (character === quote) quote = '';
    } else if (character === '"' || character === "'") {
      quote = character;
      result += character;
    } else if (character === '/' && text[index + 1] === '/' && text[index - 1] !== ':') {
      break;
    } else if (character === '/' && text[index + 1] === '*') {
      const close = text.indexOf('*/', index + 2);
      if (close === -1) break;
      index = close + 1;
    } else {
      result += character;
    }
  }
  return result.trim();
}

export function getFormattingEdits(document: TextDocument): TextEdit[] {
  const edits: TextEdit[] = [];
  let indentLevel = 0;
  for (let index = 0; index < document.lineCount; index++) {
    const line = document.lineAt(index);
    let trimmed = line.text.trim();
    if (trimmed === '') continue;

    const code = stripComments(trimmed).replace(/;+$/, '').trim();
    if (code === '') {
      edits.push(TextEdit.replace(line.range, '  '.repeat(indentLevel) + trimmed));
      continue;
    }

    if (trimmed.length > code.length && trimmed.startsWith(code + ';')) {
      trimmed = trimmed.replace(/^([^]*?);+(\s*(\/\/|\/\*).*)?$/, (_match, content, rest) => content + (rest ?? ''));
    } else {
      while (trimmed.endsWith(';')) trimmed = trimmed.slice(0, -1);
    }

    const isHeader = code.startsWith('@') || code.startsWith('#');
    if (isHeader) indentLevel = 0;
    if (code.startsWith('}') || code === '|') indentLevel = Math.max(0, indentLevel - 1);

    edits.push(TextEdit.replace(line.range, '  '.repeat(indentLevel) + replaceRepeatedQuotedSpaces(trimmed)));
    if (isHeader || code.endsWith('{') || /^\+(?:\^?[A-Za-z_][\w.-]*|\[[A-Za-z_][\w-]*\])\s*=\s*\|$/.test(code)) indentLevel++;
  }
  return edits;
}

export function registerRpgScriptFormatter(): ReturnType<typeof languages.registerDocumentFormattingEditProvider> {
  return languages.registerDocumentFormattingEditProvider('rpgscript', {
    provideDocumentFormattingEdits: getFormattingEdits,
  });
}
