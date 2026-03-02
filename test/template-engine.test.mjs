import { render } from '../lib/template-engine.mjs';
import { strict as assert } from 'node:assert';

let pass = 0, fail = 0;

function test(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

// ──────────────────────────────────────────────
// Issue 1: {{#each}} extra blank lines
// ──────────────────────────────────────────────
console.log('\n🔧 Issue 1: {{#each}} blank lines\n');

test('each: no extra blank lines between string items', () => {
  const tpl = `| 테이블 | 이유 |
|--------|------|
{{#each items}}
| {{this}} |
{{/each}}`;
  const out = render(tpl, { items: ['A - 이유1', 'B - 이유2', 'C - 이유3'] });
  // Should NOT have double newlines between rows
  assert.ok(!out.includes('\n\n|'), `Got double newlines:\n${out}`);
  // Should have exactly 3 table rows after header
  const dataRows = out.split('\n').filter(l => l.startsWith('|') && !l.includes('---'));
  assert.equal(dataRows.length, 4, `Expected 4 rows (1 header + 3 data), got ${dataRows.length}`);
});

test('each: no extra blank lines between object items', () => {
  const tpl = `{{#each people}}
- {{name}}: {{role}}
{{/each}}`;
  const out = render(tpl, { people: [
    { name: 'Alice', role: 'Dev' },
    { name: 'Bob', role: 'QA' }
  ]});
  assert.ok(!out.includes('\n\n-'), `Got double newlines:\n${out}`);
});

test('each: single item has no leading/trailing blank lines', () => {
  const tpl = `before
{{#each items}}
- {{this}}
{{/each}}
after`;
  const out = render(tpl, { items: ['only'] });
  assert.ok(!out.includes('\n\n-'), `Leading blank line before item:\n${out}`);
  assert.ok(!out.includes('only\n\n'), `Trailing blank line after item:\n${out}`);
});

test('each: empty array produces no blank lines', () => {
  const tpl = `before
{{#each items}}
- {{this}}
{{/each}}
after`;
  const out = render(tpl, { items: [] });
  assert.ok(!out.includes('\n\n\n'), `Triple newlines in empty:\n${out}`);
});

// ──────────────────────────────────────────────
// Issue 2: {{/if}} inside code fences
// ──────────────────────────────────────────────
console.log('\n🔧 Issue 2: {{/if}} in code fences\n');

test('if: code fence containing {{/if}} literal does not close outer block', () => {
  const tpl = `{{#if enabled}}
BEFORE
\`\`\`
example: {{/if}} this is literal
\`\`\`
AFTER
{{/if}}`;
  const out = render(tpl, { enabled: true });
  assert.ok(out.includes('BEFORE'), `Missing BEFORE:\n${out}`);
  assert.ok(out.includes('AFTER'), `Missing AFTER:\n${out}`);
  assert.ok(out.includes('{{/if}} this is literal'), `Code fence content corrupted:\n${out}`);
});

test('if: inline code containing {{/if}} does not close outer block', () => {
  const tpl = `{{#if enabled}}
Use \`{{/if}}\` to close blocks.
Real content here.
{{/if}}`;
  const out = render(tpl, { enabled: true });
  assert.ok(out.includes('Real content here'), `Missing real content:\n${out}`);
  assert.ok(out.includes('`{{/if}}`'), `Inline code corrupted:\n${out}`);
});

test('if: no orphaned {{/if}} tokens after rendering', () => {
  const tpl = `{{#if enabled}}
\`\`\`
{{/if}} literal
\`\`\`
content
{{/if}}`;
  const out = render(tpl, { enabled: true });
  // After full rendering, no bare {{/if}} should remain outside code fences
  const outsideCode = out.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  assert.ok(!outsideCode.includes('{{/if}}'), `Orphaned {{/if}} found:\n${out}`);
});

test('if: nested if still works', () => {
  const tpl = `{{#if a}}
A
{{#if b}}
B
{{/if}}
{{/if}}`;
  const out = render(tpl, { a: true, b: true });
  assert.ok(out.includes('A'), 'Missing A');
  assert.ok(out.includes('B'), 'Missing B');
  assert.ok(!out.includes('{{'), `Unresolved tokens:\n${out}`);
});

test('if: false condition with code fence containing {{/if}}', () => {
  const tpl = `{{#if enabled}}
\`\`\`
{{/if}} inside fence
\`\`\`
visible
{{/if}}
always here`;
  const out = render(tpl, { enabled: false });
  assert.ok(!out.includes('visible'), 'Should not show conditional content');
  assert.ok(out.includes('always here'), 'Should show unconditional content');
  assert.ok(!out.includes('{{/if}}'), `Orphaned tokens:\n${out}`);
});

// ──────────────────────────────────────────────
// Existing functionality (regression)
// ──────────────────────────────────────────────
console.log('\n🔧 Regression tests\n');

test('simple variable substitution', () => {
  assert.equal(render('Hello {{name}}!', { name: 'World' }), 'Hello World!');
});

test('nested variable', () => {
  assert.equal(render('{{a.b.c}}', { a: { b: { c: 42 } } }), '42');
});

test('if true', () => {
  assert.equal(render('{{#if x}}yes{{/if}}', { x: true }).trim(), 'yes');
});

test('if false', () => {
  assert.equal(render('{{#if x}}yes{{/if}}', { x: false }).trim(), '');
});

test('if/else', () => {
  assert.equal(render('{{#if x}}yes{{else}}no{{/if}}', { x: false }).trim(), 'no');
});

test('unless', () => {
  assert.equal(render('{{#unless x}}shown{{/unless}}', { x: false }).trim(), 'shown');
});

test('each with this', () => {
  const out = render('{{#each items}}[{{this}}]{{/each}}', { items: ['a', 'b'] });
  assert.ok(out.includes('[a]') && out.includes('[b]'), `Got: ${out}`);
});

// ──────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
