/**
 * Industry presets test — verifies all presets have required keys
 * and that the setup wizard integration works correctly.
 */

import { strict as assert } from 'node:assert';
import {
  listIndustries,
  getPreset,
  getPresetWithOverrides,
  REQUIRED_KEYS,
} from '../lib/industry-presets.mjs';

let pass = 0, fail = 0;

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

async function run() {
  console.log('\n🏭 Industry Presets Tests\n');

  const industries = listIndustries();

  await test('listIndustries returns 4 presets', () => {
    assert.equal(industries.length, 4);
    assert.deepEqual(industries, ['saas', 'ecommerce', 'b2b_platform', 'generic']);
  });

  await test('REQUIRED_KEYS has 21 entries', () => {
    assert.equal(REQUIRED_KEYS.length, 21, `Got ${REQUIRED_KEYS.length}: ${REQUIRED_KEYS.join(', ')}`);
  });

  // Test each preset has all required keys
  for (const id of industries) {
    await test(`${id} preset has all ${REQUIRED_KEYS.length} required keys`, () => {
      const preset = getPreset(id);
      assert.ok(preset, `Preset ${id} not found`);
      for (const key of REQUIRED_KEYS) {
        assert.ok(
          key in preset && typeof preset[key] === 'string' && preset[key].length > 0,
          `${id} missing or empty key: ${key}`
        );
      }
    });
  }

  await test('getPreset returns null for unknown industry', () => {
    assert.equal(getPreset('unknown'), null);
  });

  await test('getPresetWithOverrides applies overrides', () => {
    const result = getPresetWithOverrides('saas', {
      domain_expertise: 'Custom expertise',
      key_metrics: 'Custom metrics',
    });
    assert.equal(result.domain_expertise, 'Custom expertise');
    assert.equal(result.key_metrics, 'Custom metrics');
    // Non-overridden fields should be from preset
    assert.equal(result.industry_label, 'SaaS');
    assert.equal(result.example_entity, 'subscription plan');
  });

  await test('getPresetWithOverrides falls back to generic for unknown', () => {
    const result = getPresetWithOverrides('unknown_industry');
    assert.equal(result.industry_label, 'Digital Product');
  });

  await test('all presets have non-empty string values', () => {
    for (const id of industries) {
      const preset = getPreset(id);
      for (const [key, value] of Object.entries(preset)) {
        assert.equal(typeof value, 'string', `${id}.${key} is not a string`);
        assert.ok(value.trim().length > 0, `${id}.${key} is empty`);
      }
    }
  });

  await test('preset keys are consistent across all industries', () => {
    const saasKeys = Object.keys(getPreset('saas')).sort();
    for (const id of industries) {
      const keys = Object.keys(getPreset(id)).sort();
      assert.deepEqual(keys, saasKeys, `${id} has different keys than saas`);
    }
  });

  // Verify template variable patterns exist in agent templates
  await test('key template variables are used in agent templates', async () => {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { readdir } = await import('node:fs/promises');

    const agentsDir = join(import.meta.dirname, '..', 'scaffold', '.context', 'agents');
    const files = await readdir(agentsDir);
    const hbsFiles = files.filter(f => f.endsWith('.hbs'));

    let allContent = '';
    for (const f of hbsFiles) {
      allContent += await readFile(join(agentsDir, f), 'utf-8');
    }

    // Key variables should be referenced in at least one template
    const keyVars = [
      'project.industry_label',
      'project.key_metrics',
      'project.example_entity',
      'project.example_entity_plural',
      'project.example_status_feature',
      'project.example_chart_name',
      'project.example_event_name',
      'project.example_icp_ko',
      'project.example_data_path',
      'project.example_few_shot_question',
    ];

    for (const v of keyVars) {
      assert.ok(
        allContent.includes(`{{${v}}}`),
        `Template variable {{${v}}} not found in any agent .hbs file`
      );
    }
  });

  // Summary
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
