import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { strict as assert } from 'node:assert';
import {
  runSetupWizard,
  calculateAmbiguityScore,
  ALL_INTEGRATION_PROVIDERS,
} from '../lib/setup-wizard.mjs';
import { parse as parseYaml, stringify as stringifyYaml } from '../lib/yaml-lite.mjs';

let pass = 0;
let fail = 0;

async function test(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

function createFakeRl(answers = []) {
  let idx = 0;
  return {
    async question() {
      const answer = answers[idx];
      idx++;
      return answer ?? '';
    },
    close() {},
  };
}

function evaluateGate(meta) {
  if (!meta || typeof meta !== 'object') return true;

  const needsDeepInterview = meta.needs_deep_interview === true;
  const ambiguityScoreRaw = meta.ambiguity_score ?? (needsDeepInterview ? 1 : 0);
  const ambiguityScoreParsed = Number(ambiguityScoreRaw);
  const ambiguityScore = Number.isFinite(ambiguityScoreParsed) ? ambiguityScoreParsed : 1;

  return needsDeepInterview || ambiguityScore >= 0.6;
}

async function roundTripMeta(dir, meta) {
  const contextDir = join(dir, '.context');
  await mkdir(contextDir, { recursive: true });
  const yaml = { project: { name: 'test' }, _meta: meta };
  await writeFile(join(contextDir, 'project.yaml'), stringifyYaml(yaml));
  const raw = await readFile(join(contextDir, 'project.yaml'), 'utf-8');
  return parseYaml(raw)._meta;
}

async function readExampleYaml() {
  const raw = await readFile(
    join(process.cwd(), 'scaffold', '.context', 'project.yaml.example'),
    'utf-8',
  );
  return parseYaml(raw);
}

console.log('\n🔧 setup wizard ambiguity gate\n');

const tempDir = await mkdtemp(join(tmpdir(), 'popilot-ambiguity-test-'));

try {
  console.log('  ── wizard defaults ──');

  await test('setup wizard writes ambiguity gate defaults', async () => {
    const rl = createFakeRl();
    await runSetupWizard(tempDir, { rl, platform: 'claude-code' });

    const raw = await readFile(join(tempDir, '.context', 'project.yaml'), 'utf-8');
    const projectYaml = parseYaml(raw);

    assert.equal(projectYaml._meta.needs_deep_interview, true);
    assert.equal(projectYaml._meta.last_interview, null);
    assert.equal(projectYaml._meta.created_by, 'popilot init');
    assert.equal(projectYaml._meta.platform, 'claude-code');
    assert.equal(typeof projectYaml._meta.ambiguity_score, 'number');
    assert.equal(projectYaml._meta.ambiguity_score, 1);
    assert.equal(evaluateGate(projectYaml._meta), true);
  });

  await test('wizard output integrations include all provider keys', async () => {
    const raw = await readFile(join(tempDir, '.context', 'project.yaml'), 'utf-8');
    const projectYaml = parseYaml(raw);

    const actualKeys = Object.keys(projectYaml.operations.integrations).sort();
    const expectedKeys = [...ALL_INTEGRATION_PROVIDERS].sort();
    assert.deepEqual(actualKeys, expectedKeys);
  });

  console.log('\n  ── ambiguity score math ──');

  await test('calculateAmbiguityScore is null-safe at root', () => {
    assert.equal(calculateAmbiguityScore(null), 1);
    assert.equal(calculateAmbiguityScore(undefined), 1);
  });

  await test('tagline-only score is 0.9', () => {
    const score = calculateAmbiguityScore({
      project: { tagline: 'quick summary' },
    });
    assert.equal(score, 0.9);
  });

  await test('fully-filled weighted fields score to 0.0', () => {
    const score = calculateAmbiguityScore({
      project: { tagline: 'a' },
      problem: { core: 'a', target: 'a', alternatives: ['a'], timing: 'a' },
      solution: { approach: 'a', differentiation: 'a', outcome: ['a'] },
      current_state: { stage: 'mvp', focus: 'a', next_milestone: 'a' },
      validation: { confirmed: ['a'] },
    });
    assert.equal(score, 0);
  });

  await test('partially-filled fields reduce ambiguity below 1.0', () => {
    const score = calculateAmbiguityScore({
      problem: { core: 'a' },
      solution: { approach: 'a' },
    });
    assert.equal(score, 0.7);
  });

  console.log('\n  ── gate evaluation ──');

  await test('gate opens when _meta is missing', () => {
    assert.equal(evaluateGate(null), true);
    assert.equal(evaluateGate(undefined), true);
  });

  await test('gate opens on malformed ambiguity score', () => {
    assert.equal(
      evaluateGate({ needs_deep_interview: false, ambiguity_score: 'not-a-number' }),
      true,
    );
  });

  await test('gate closes at score < 0.6', () => {
    assert.equal(
      evaluateGate({ needs_deep_interview: false, ambiguity_score: 0.59 }),
      false,
    );
  });

  await test('gate opens at score >= 0.6', () => {
    assert.equal(
      evaluateGate({ needs_deep_interview: false, ambiguity_score: 0.6 }),
      true,
    );
  });

  await test('needs_deep_interview flag overrides low score', () => {
    assert.equal(
      evaluateGate({ needs_deep_interview: true, ambiguity_score: 0 }),
      true,
    );
  });

  console.log('\n  ── YAML round-trip ──');

  const rtDir = await mkdtemp(join(tmpdir(), 'popilot-rt-test-'));

  await test('round-trip preserves boolean/number/null types', async () => {
    const meta = await roundTripMeta(rtDir, {
      needs_deep_interview: false,
      ambiguity_score: 0.25,
      last_interview: null,
    });
    assert.equal(typeof meta.needs_deep_interview, 'boolean');
    assert.equal(typeof meta.ambiguity_score, 'number');
    assert.equal(meta.last_interview, null);
  });

  await test('round-trip preserves ISO timestamp for last_interview', async () => {
    const ts = '2026-03-04T12:00:00.000Z';
    const meta = await roundTripMeta(rtDir, {
      needs_deep_interview: false,
      ambiguity_score: 0.2,
      last_interview: ts,
    });
    assert.equal(meta.last_interview, ts);
  });

  await rm(rtDir, { recursive: true, force: true });

  console.log('\n  ── docs + template consistency ──');

  await test('start.md documents null/malformed guard in gate logic', async () => {
    const startMd = await readFile(
      join(process.cwd(), 'adapters', 'claude-code', '.claude', 'commands', 'start.md'),
      'utf-8',
    );
    assert.match(startMd, /meta = _meta \?\? \{\};/);
    assert.match(startMd, /Number\.isFinite\(ambiguityScoreParsed\) \? ambiguityScoreParsed : 1/);
    assert.match(startMd, /If `_meta` is missing or malformed, treat it as \*\*gate open\*\*/);
    assert.match(startMd, /do not proceed to step 0\/session selection yet/i);
  });

  await test('project.yaml example provider list matches runtime provider list', async () => {
    const exampleYaml = await readExampleYaml();
    const actualKeys = Object.keys(exampleYaml.operations.integrations).sort();
    const expectedKeys = [...ALL_INTEGRATION_PROVIDERS].sort();
    assert.deepEqual(actualKeys, expectedKeys);
  });

  await test('project.yaml example metadata defaults match runtime defaults', async () => {
    const exampleYaml = await readExampleYaml();
    assert.equal(exampleYaml._meta.created_by, 'popilot init');
    assert.equal(exampleYaml._meta.needs_deep_interview, true);
    assert.equal(exampleYaml._meta.ambiguity_score, 1);
  });
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
