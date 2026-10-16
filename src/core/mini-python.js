// Small, deliberately bounded Python subset used by the existing lessons.
export function compileMiniPython(source) {
  if (typeof source !== 'string' || source.length > 2000) throw new Error('Код должен быть не длиннее 2000 символов.');
  const strings = [];
  const mask = line => {
    let result = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '#') break;
      if (char !== '"' && char !== "'") { result += char; continue; }
      const quote = char;
      let literal = char;
      let closed = false;
      for (i++; i < line.length; i++) {
        literal += line[i];
        if (line[i] === '\\') { if (++i < line.length) literal += line[i]; }
        else if (line[i] === quote) { closed = true; break; }
      }
      if (!closed) throw new Error('Закрой кавычки в строке.');
      result += `ZZSTRING${strings.push(literal) - 1}ZZ`;
    }
    return result;
  };
  const restore = text => text.replace(/ZZSTRING(\d+)ZZ/g, (_, index) => strings[Number(index)]);
  const convert = text => text.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null')
    .replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\s+/g, '!').replace(/\.append\(/g, '.push(');
  const lines = [];
  const stack = [{ indent: 0, kind: 'root' }];
  let needsBody = false;
  let previousIndent = 0;
  let previousKind = 'root';
  for (const raw of source.split(/\r?\n/)) {
    const masked = mask(raw.replace(/\t/g, '    '));
    if (!masked.trim()) continue;
    const indent = masked.match(/^ */)[0].length;
    const text = masked.trim();
    if (/(?:\b(?:globalThis|window|document|location|fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|navigator|frames|parent|top|self|Worker|importScripts|WebSocket|process|require|eval|Function|constructor|prototype|postMessage|this|new|var|let|const|function|try|catch|throw|class|delete|typeof|instanceof)\b|__|ZZSTRING\D|[`{};$\\])/i.test(text)) throw new Error('Эта конструкция не поддерживается в учебном редакторе.');
    const calls = [...text.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)].map(match => match[1]);
    if (calls.some(name => !['print', 'range', 'len', 'int', 'str', 'append'].includes(name)) || /(?:\]|\))\s*\(|=>|\.(?!\d|append\s*\()/.test(text)) throw new Error('В учебном редакторе доступны print(), range(), len(), int(), str() и append().');
    if (needsBody) {
      if (indent <= previousIndent) throw new Error('Добавь отступ перед командой внутри блока.');
      stack.push({ indent, kind: previousKind });
      needsBody = false;
    } else if (indent > stack.at(-1).indent) throw new Error('Лишний отступ: проверь начало строки.');
    let closedKind;
    while (indent < stack.at(-1).indent) { closedKind = stack.pop().kind; lines.push('}'); }
    if (indent !== stack.at(-1).indent) throw new Error('Отступы команд одного блока должны совпадать.');
    const header = /^(for|while|if|elif)\b.*:$/.test(text) || text === 'else:';
    if (header) {
      let statement;
      let kind;
      const loop = text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+):$/);
      if (loop) { statement = `for (let ${loop[1]} of ${convert(loop[2])}) { __tick();`; kind = 'for'; }
      else if (text.startsWith('while ')) { statement = `while (${convert(text.slice(6, -1))}) { __tick();`; kind = 'while'; }
      else if (text.startsWith('if ')) { statement = `if (${convert(text.slice(3, -1))}) {`; kind = 'if'; }
      else if (text === 'else:' || text.startsWith('elif ')) {
        if (!['if', 'elif'].includes(closedKind)) throw new Error('Перед else или elif нужен блок if с тем же отступом.');
        statement = text === 'else:' ? 'else {' : `else if (${convert(text.slice(5, -1))}) {`;
        kind = text === 'else:' ? 'else' : 'elif';
      } else throw new Error('Проверь заголовок цикла: for переменная in диапазон:');
      lines.push(statement);
      needsBody = true;
      previousIndent = indent;
      previousKind = kind;
    } else {
      if (/^(for|while|if|elif|else|def)\b/.test(text)) throw new Error('Проверь заголовок блока и двоеточие в конце.');
      if (!/^(?:[A-Za-z_]\w*\s*(?:=(?!=)|\+=|-=|\*=)|print\s*\(|[A-Za-z_]\w*\.append\s*\(|break$|continue$|pass$)/.test(text)) throw new Error('Поддерживаются присваивания, print(), циклы и условия.');
      if (/^(break|continue)$/.test(text) && !stack.some(block => ['for', 'while'].includes(block.kind))) throw new Error('Эта команда работает только внутри цикла.');
      const statement = convert(text);
      lines.push(text === 'pass' ? ';' : `${/^[A-Za-z_]\w*\s*=(?!=)/.test(text) ? 'var ' : ''}${statement};`);
    }
  }
  if (needsBody) throw new Error('Добавь команду с отступом после заголовка блока.');
  while (stack.length > 1) { stack.pop(); lines.push('}'); }
  return { code: restore(lines.join('\n')), syntax: source.split(/\r?\n/).map(mask).join('\n') };
}
