/**
 * Hydration engine E2E test.
 *
 * Creates a minimal scaffold in a temp directory, runs hydration,
 * and verifies the output.
 */

import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { strict as assert } from 'node:assert';
import { hydrate } from '../lib/hydrate.mjs';
import { stringify as stringifyYaml } from '../lib/yaml-lite.mjs';
import { parse as parseYaml } from '../lib/yaml-lite.mjs';

let pass = 0, fail = 0;
let tempDir;

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

// ── Setup: create minimal scaffold ──────────────────────

async function setup() {
  tempDir = join(tmpdir(), `popilot-test-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  // Registry
  const integrationsDir = join(tempDir, '.context', 'integrations');
  const providersDir = join(integrationsDir, 'providers');
  await mkdir(providersDir, { recursive: true });

  await writeFile(join(integrationsDir, '_registry.yaml'), `version: "1.0"

categories:
  analytics:
    label: "데이터 분석"
    agents: [analyst, validator]
    commands: [analytics]
  database:
    label: "데이터베이스"
    agents: [analyst]
    commands: [analytics]
    system_files: [CLAUDE.md, WORKFLOW.md]
  pm_tool:
    label: "프로젝트 관리"
    agents: [strategist, planner]
    commands: [daily]
    system_files: [WORKFLOW.md]
`);

  // GA4 provider
  await writeFile(join(providersDir, 'ga4.yaml'), `id: ga4
name: "Google Analytics 4"
category: analytics

setup_questions:
  - key: property_id
    label: "GA4 Property ID"
    type: string
    required: true

agent_prompts:
  analyst: |
    ### GA4 MCP
    property_id: {{config.property_id}}
  validator: |
    ### GA4 Validator
    property_id: {{config.property_id}}

command_prompts:
  analytics: |
    - **GA4 MCP 서버**

footer_tool_line: "GA4 MCP"
`);

  // Prod DB provider
  await writeFile(join(providersDir, 'prod_db.yaml'), `id: prod_db
name: "Production Database"
category: database

agent_prompts:
  analyst: |
    ### DB 선택 기준
    운영 DB: {{config.mcp_name}}
    {{#each config.caution}}
    | {{this.table}} | {{this.risk}} |
    {{/each}}

command_prompts:
  analytics: |
    - **Prod DB MCP**

safety_rules:
  - content: |
      ## DB 주의사항
      caution 참조

workflow_rules:
  - content: |
      ## DB 사용 규칙
      {{config.rules}}

caution_list: |
  {{#each config.caution}}
  | {{this.table}} | {{this.risk}} |
  {{/each}}

footer_tool_line: "DB MCP ({{config.mcp_name}})"
`);

  // project.yaml
  const projectYaml = {
    project: { name: 'Test Project', tagline: 'A test', type: 'greenfield' },
    operations: {
      sprint: { enabled: true, current: 1, duration_weeks: 2, d_day: '' },
      domains: [
        { id: 'growth', name: '그로스', path: 'domains/growth/' },
      ],
      integrations: {
        ga4: { enabled: true, property_id: '12345' },
        prod_db: {
          enabled: true,
          mcp_name: 'my_prod_db',
          snapshot_mcp_name: 'my_snapshot_db',
          caution: [
            { table: 'BigTable', risk: 'HIGH', reason: 'Very large' },
          ],
          rules: 'WHERE + LIMIT 필수',
        },
      },
      dev_scope: { repo_name: 'my-dashboard', service_repo: 'my-backend' },
      spec_site: { title: 'Test 스펙', deploy_url: '' },
    },
  };
  await mkdir(join(tempDir, '.context'), { recursive: true });
  await writeFile(join(tempDir, '.context', 'project.yaml'), stringifyYaml(projectYaml));

  // Agent .hbs files
  const agentsDir = join(tempDir, '.context', 'agents');
  await mkdir(agentsDir, { recursive: true });

  // Analyst with all 3 integration markers
  await writeFile(join(agentsDir, 'analyst.md.hbs'), `# Danny - Analyst

## MCP 도구 활용

{{INTEGRATION_PROMPTS}}

## Quick Reference: 위험 테이블

{{INTEGRATION_CAUTION_LIST}}

*도구*: {{INTEGRATION_TOOLS_FOOTER}}
`);

  // Validator with just INTEGRATION_PROMPTS
  await writeFile(join(agentsDir, 'validator.md.hbs'), `# Vicky - Validator

## MCP 도구 활용

{{INTEGRATION_PROMPTS}}
`);

  // Strategist — no integration prompts for its categories
  await writeFile(join(agentsDir, 'strategist.md.hbs'), `# Simon - Strategist

## MCP 도구 활용

{{INTEGRATION_PROMPTS}}
`);

  // Planner
  await writeFile(join(agentsDir, 'planner.md.hbs'), `# Penny - Planner

## MCP 도구 활용

{{INTEGRATION_PROMPTS}}
`);

  // Orchestrator — with template var
  await writeFile(join(agentsDir, 'orchestrator.md.hbs'), `# Oscar - Orchestrator

{{#if domains}}
## Domains
{{#each domains}}
- {{id}}: {{name}}
{{/each}}
{{/if}}

System prompt: {{SYSTEM_PROMPT_FILE}}
`);

  // Developer with {{#if dev_scope.repo_name}} and template var
  await writeFile(join(agentsDir, 'developer.md.hbs'), `# Derek - Developer

{{#if dev_scope.repo_name}}
Repo: {{dev_scope.repo_name}}
Service: {{dev_scope.service_repo}}
Commands: {{COMMAND_DIR}}
{{/if}}
`);

  // QA
  await writeFile(join(agentsDir, 'qa.md.hbs'), `# Quinn - QA

{{#if dev_scope.repo_name}}
Repo: {{dev_scope.repo_name}}
{{/if}}
`);

  // Researcher
  await writeFile(join(agentsDir, 'researcher.md.hbs'), `# Rita - Researcher

## MCP 도구 활용

{{INTEGRATION_PROMPTS}}
`);

  // Command .hbs files
  const commandsDir = join(tempDir, '.claude', 'commands');
  await mkdir(commandsDir, { recursive: true });

  await writeFile(join(commandsDir, 'analytics.md.hbs'), `# Analytics

## 도구

{{INTEGRATION_PROMPTS}}
`);

  await writeFile(join(commandsDir, 'daily.md.hbs'), `# Daily

{{#if capabilities.pm_tool}}
## PM 도구
{{INTEGRATION_PROMPTS}}
{{else}}
## PM 도구 없음
{{/if}}
`);

  await writeFile(join(commandsDir, 'dev.md.hbs'), `# Dev

{{dev_scope.repo_name}}
`);

  // Domain template
  await writeFile(join(commandsDir, '_domain.md.hbs'), `# {{name}} 도메인

도메인 ID: {{id}}
경로: {{path}}
`);

  // System .hbs files
  await writeFile(join(tempDir, 'CLAUDE.md.hbs'), `# {{project.name}}

{{project.tagline}}

{{#if domains}}
## Domains
{{#each domains}}
| {{id}} | {{name}} |
{{/each}}
{{/if}}

{{#if dev_scope.repo_name}}
## Dev Team
Repo: {{dev_scope.repo_name}}
{{/if}}

{{INTEGRATION_SAFETY_RULES}}
`);

  await writeFile(join(tempDir, '.context', 'WORKFLOW.md.hbs'), `# Workflow

{{#if dev_scope.service_repo}}
서비스 레포: {{dev_scope.service_repo}}
{{/if}}

{{INTEGRATION_WORKFLOW_RULES}}
`);
}

async function cleanup() {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
}

// ── Tests ───────────────────────────────────────────────

async function run() {
  console.log('\n🔧 Hydration Engine Tests\n');

  await setup();

  try {
    // Run hydration
    const { hydrated, domains } = await hydrate(tempDir);

    await test('hydrated files count', async () => {
      // 8 agents + 3 commands + 2 system = 13
      assert.ok(hydrated.length >= 10, `Expected >= 10 hydrated files, got ${hydrated.length}`);
    });

    await test('domain commands generated', async () => {
      assert.equal(domains.length, 1, `Expected 1 domain, got ${domains.length}`);
      assert.ok(domains[0].includes('growth.md'));
    });

    await test('CLAUDE.md rendered (no .hbs)', async () => {
      const content = await readFile(join(tempDir, 'CLAUDE.md'), 'utf-8');
      assert.ok(content.includes('Test Project'), 'Missing project name');
      assert.ok(content.includes('A test'), 'Missing tagline');
      assert.ok(!content.includes('{{'), `Unresolved tokens in CLAUDE.md:\n${content.substring(0, 500)}`);
    });

    await test('CLAUDE.md has safety rules', async () => {
      const content = await readFile(join(tempDir, 'CLAUDE.md'), 'utf-8');
      assert.ok(content.includes('DB 주의사항'), 'Missing safety rules');
    });

    await test('CLAUDE.md has domain table', async () => {
      const content = await readFile(join(tempDir, 'CLAUDE.md'), 'utf-8');
      assert.ok(content.includes('growth'), 'Missing domain');
      assert.ok(content.includes('그로스'), 'Missing domain name');
    });

    await test('CLAUDE.md has dev team section', async () => {
      const content = await readFile(join(tempDir, 'CLAUDE.md'), 'utf-8');
      assert.ok(content.includes('my-dashboard'), 'Missing dev repo');
    });

    await test('analyst.md has GA4 + DB prompts', async () => {
      const content = await readFile(join(tempDir, '.context', 'agents', 'analyst.md'), 'utf-8');
      assert.ok(content.includes('GA4 MCP'), 'Missing GA4 prompt');
      assert.ok(content.includes('12345'), 'Missing GA4 property_id');
      assert.ok(content.includes('DB 선택 기준'), 'Missing DB prompt');
      assert.ok(content.includes('my_prod_db'), 'Missing DB mcp_name');
    });

    await test('analyst.md has caution list', async () => {
      const content = await readFile(join(tempDir, '.context', 'agents', 'analyst.md'), 'utf-8');
      assert.ok(content.includes('BigTable'), 'Missing caution table');
      assert.ok(content.includes('HIGH'), 'Missing caution risk');
    });

    await test('analyst.md has tools footer', async () => {
      const content = await readFile(join(tempDir, '.context', 'agents', 'analyst.md'), 'utf-8');
      assert.ok(content.includes('GA4 MCP'), 'Missing GA4 footer');
      assert.ok(content.includes('DB MCP'), 'Missing DB footer');
    });

    await test('validator.md has GA4 prompt', async () => {
      const content = await readFile(join(tempDir, '.context', 'agents', 'validator.md'), 'utf-8');
      assert.ok(content.includes('GA4 Validator'), 'Missing GA4 validator prompt');
      assert.ok(content.includes('12345'), 'Missing property_id');
    });

    await test('WORKFLOW.md has workflow rules', async () => {
      const content = await readFile(join(tempDir, '.context', 'WORKFLOW.md'), 'utf-8');
      assert.ok(content.includes('DB 사용 규칙'), 'Missing workflow rules');
      assert.ok(content.includes('WHERE + LIMIT 필수'), 'Missing db rules');
    });

    await test('analytics command has integration prompts', async () => {
      const content = await readFile(join(tempDir, '.claude', 'commands', 'analytics.md'), 'utf-8');
      assert.ok(content.includes('GA4 MCP 서버'), 'Missing GA4 command prompt');
      assert.ok(content.includes('Prod DB MCP'), 'Missing DB command prompt');
    });

    await test('domain command file generated correctly', async () => {
      const content = await readFile(join(tempDir, '.claude', 'commands', 'growth.md'), 'utf-8');
      assert.ok(content.includes('그로스 도메인'), 'Missing domain name');
      assert.ok(content.includes('growth'), 'Missing domain id');
    });

    await test('_domain.md.hbs cleaned up', async () => {
      let exists = true;
      try {
        await readFile(join(tempDir, '.claude', 'commands', '_domain.md.hbs'));
      } catch {
        exists = false;
      }
      assert.ok(!exists, '_domain.md.hbs should be deleted');
    });

    await test('no .hbs files remain', async () => {
      const hbsFiles = await findHbsFiles(tempDir);
      assert.equal(hbsFiles.length, 0, `Residual .hbs files: ${hbsFiles.join(', ')}`);
    });

    await test('orchestrator.md rendered with domains and template vars', async () => {
      const content = await readFile(join(tempDir, '.context', 'agents', 'orchestrator.md'), 'utf-8');
      assert.ok(content.includes('growth'), 'Missing domain id');
      assert.ok(content.includes('그로스'), 'Missing domain name');
      assert.ok(content.includes('CLAUDE.md'), 'Missing SYSTEM_PROMPT_FILE template var');
      assert.ok(!content.includes('{{'), 'Unresolved tokens');
    });

    await test('developer.md rendered with dev_scope and template vars', async () => {
      const content = await readFile(join(tempDir, '.context', 'agents', 'developer.md'), 'utf-8');
      assert.ok(content.includes('my-dashboard'), 'Missing repo name');
      assert.ok(content.includes('my-backend'), 'Missing service repo');
      assert.ok(content.includes('.claude/commands/'), 'Missing COMMAND_DIR template var');
    });

  } finally {
    await cleanup();
  }

  // ── Adapter tests ────────────────────────────────────
  console.log('\n🔧 Adapter Tests\n');

  const { listAdapters, loadManifest, getDefaultAdapter } = await import('../lib/adapter.mjs');

  await test('default adapter is claude-code', async () => {
    assert.equal(getDefaultAdapter(), 'claude-code');
  });

  await test('listAdapters returns claude-code', async () => {
    const adapters = await listAdapters();
    assert.ok(adapters.includes('claude-code'), `Expected claude-code in ${adapters}`);
  });

  await test('listAdapters returns codex', async () => {
    const adapters = await listAdapters();
    assert.ok(adapters.includes('codex'), `Expected codex in ${adapters}`);
  });

  await test('listAdapters returns gemini', async () => {
    const adapters = await listAdapters();
    assert.ok(adapters.includes('gemini'), `Expected gemini in ${adapters}`);
  });

  await test('loadManifest parses claude-code manifest', async () => {
    const manifest = await loadManifest('claude-code');
    assert.equal(manifest.id, 'claude-code');
    assert.ok(manifest.system_prompt, 'Missing system_prompt');
    assert.ok(manifest.commands, 'Missing commands');
    assert.ok(manifest.template_vars, 'Missing template_vars');
    assert.equal(manifest.template_vars.SYSTEM_PROMPT_FILE, 'CLAUDE.md');
    assert.equal(manifest.template_vars.COMMAND_DIR, '.claude/commands/');
  });

  await test('loadManifest parses codex manifest', async () => {
    const manifest = await loadManifest('codex');
    assert.equal(manifest.id, 'codex');
    assert.equal(manifest.system_prompt.target, 'AGENTS.md');
    assert.equal(manifest.template_vars.PLATFORM_NAME, 'Codex CLI');
    assert.equal(manifest.template_vars.COMMAND_DIR, '.codex/commands/');
  });

  await test('loadManifest parses gemini manifest', async () => {
    const manifest = await loadManifest('gemini');
    assert.equal(manifest.id, 'gemini');
    assert.equal(manifest.system_prompt.target, 'GEMINI.md');
    assert.equal(manifest.template_vars.PLATFORM_NAME, 'Gemini CLI');
    assert.equal(manifest.template_vars.COMMAND_DIR, '.gemini/commands/');
  });

  // ── YAML parser tests ─────────────────────────────
  console.log('\n🔧 YAML Lite Parser Tests\n');

  await test('parse simple key-value', async () => {
    const result = parseYaml('name: hello\ncount: 42\nenabled: true');
    assert.equal(result.name, 'hello');
    assert.equal(result.count, 42);
    assert.equal(result.enabled, true);
  });

  await test('parse nested map', async () => {
    const result = parseYaml('project:\n  name: Test\n  type: greenfield');
    assert.equal(result.project.name, 'Test');
    assert.equal(result.project.type, 'greenfield');
  });

  await test('parse inline flow sequence', async () => {
    const result = parseYaml('items: [a, b, c]');
    assert.deepEqual(result.items, ['a', 'b', 'c']);
  });

  await test('parse inline flow mapping', async () => {
    const result = parseYaml('item: { id: growth, name: "그로스" }');
    assert.equal(result.item.id, 'growth');
    assert.equal(result.item.name, '그로스');
  });

  await test('parse block sequence', async () => {
    const result = parseYaml('items:\n  - alpha\n  - beta\n  - gamma');
    assert.deepEqual(result.items, ['alpha', 'beta', 'gamma']);
  });

  await test('parse block sequence of maps', async () => {
    const result = parseYaml('people:\n  - name: Alice\n    role: Dev\n  - name: Bob\n    role: QA');
    assert.equal(result.people.length, 2);
    assert.equal(result.people[0].name, 'Alice');
    assert.equal(result.people[1].role, 'QA');
  });

  await test('parse literal block scalar', async () => {
    const result = parseYaml('content: |\n  line one\n  line two');
    assert.ok(result.content.includes('line one'));
    assert.ok(result.content.includes('line two'));
  });

  await test('parse boolean and null', async () => {
    const result = parseYaml('a: true\nb: false\nc: null');
    assert.equal(result.a, true);
    assert.equal(result.b, false);
    assert.equal(result.c, null);
  });

  await test('parse comments', async () => {
    const result = parseYaml('name: hello # this is a comment\n# full line comment\ncount: 10');
    assert.equal(result.name, 'hello');
    assert.equal(result.count, 10);
  });

  await test('stringify and re-parse roundtrip', async () => {
    const original = {
      project: { name: 'Test', type: 'greenfield' },
      items: ['a', 'b'],
      enabled: true,
      count: 42,
    };
    const yaml = stringifyYaml(original);
    const parsed = parseYaml(yaml);
    assert.equal(parsed.project.name, 'Test');
    assert.equal(parsed.enabled, true);
    assert.equal(parsed.count, 42);
  });

  // Summary
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

async function findHbsFiles(dir) {
  const results = [];
  async function walk(d) {
    const entries = await readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.hbs')) {
        results.push(fullPath);
      }
    }
  }
  await walk(dir);
  return results;
}

run();
