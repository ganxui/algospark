import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { compileMiniPython } from '../src/core/mini-python.js';
import { ALL_LESSONS } from '../src/curriculum.js';

const runner = readFileSync(new URL('../src/core/sandbox-runtime.txt', import.meta.url), 'utf8');
function run(source) {
  const compiled = compileMiniPython(source);
  let result;
  const parent = { postMessage: message => { result = message.result; } };
  const context = vm.createContext({ parent });
  const program = runner.replace('__REQUEST_ID__', '"test"').replace('/* USER_CODE */', () => compiled.code);
  vm.runInContext(program, context, { timeout: 1000 });
  return result;
}

for (const lesson of ALL_LESSONS) {
  test(`Theory example ${lesson.id}: ${lesson.title}`, () => {
    const result = run(lesson.theoryCode);
    assert.equal(result.success, true, result.error);
    const fullOutput = lesson.id === 4 ? Array(5).fill('Маяк включён').join('\n') : lesson.id === 11 ? '0 0\n0 1\n0 2\n1 0\n1 1\n1 2' : lesson.theoryOutput.replace(/^>>> ?/gm, '');
    assert.equal(result.output, fullOutput);
  });
}

test('strings preserve hashes, keywords and restricted words', () => {
  assert.equal(run('print("# True and not window") # comment').output, '# True and not window');
});
test('if / elif / else and nested loops follow indentation', () => {
  assert.equal(run('for x in range(3):\n    if x == 0:\n        print("A")\n    elif x == 1:\n        print("B")\n    else:\n        print("C")').output, 'A\nB\nC');
});
test('range supports a negative step without silently dropping values', () => {
  assert.equal(run('for n in range(3, 0, -1):\n    print(n)').output, '3\n2\n1');
  assert.equal(run('for n in range(1, 4, 0):\n    print(n)').success, false);
  assert.equal(run('for n in range(1001):\n    print(n)').success, false);
});
test('list literals and tab indents work', () => {
  assert.equal(run('for p in ["A", "B"]:\n\tprint(p)').output, 'A\nB');
});
test('invalid indentation is rejected instead of executing a different program', () => {
  for (const code of ['for x in range(3):\nprint(x)', '    print(1)', 'for x in range(3):', 'if True:\n    print(1)\n  print(2)']) {
    assert.throws(() => compileMiniPython(code));
  }
});
test('an infinite loop stops with an error before freezing the browser', () => {
  const result = run('while True:\n    print(1)');
  assert.equal(result.success, false);
  assert.match(result.error, /повторов/);
});
test('comments and string literals cannot satisfy syntax requirements', () => {
  const { syntax } = compileMiniPython('print("for range") # for range');
  assert.doesNotMatch(syntax, /\bfor\b|\brange\b/);
});
test('browser and runtime access is rejected', () => {
  for (const code of ['print(window)', 'print([].constructor)', 'print(__tick())', 'print([]["constructor"]["constructor"]("while(true){}")())']) assert.throws(() => compileMiniPython(code));
});
