/**
 * Interactive setup wizard — terminal interview → project.yaml + related files.
 *
 * Collects only essential config. AI deep interview is deferred to Claude Code
 * via metadata gate fields (`_meta.needs_deep_interview`, `_meta.ambiguity_score`).
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ask, confirm, select, createPrompt } from './prompt.mjs';
import { parse as parseYaml, stringify as stringifyYaml } from './yaml-lite.mjs';
import { listIndustries, getPresetWithOverrides } from './industry-presets.mjs';

/**
 * Run the interactive setup wizard.
 *
 * @param {string} targetDir - Project root (scaffold already copied)
 * @param {object} [opts]
 * @param {import('node:readline/promises').Interface} [opts.rl] - Inject readline for testing
 * @param {string|null} [opts.platform] - Optional adapter/platform name
 * @returns {Promise<void>}
 */
export async function runSetupWizard(targetDir, opts = {}) {
  const rl = opts.rl || createPrompt();
  const ownsRl = !opts.rl;

  try {
    console.log();
    console.log('  ──────────────────────────────────────');
    console.log('  📝 Project Setup');
    console.log('  ──────────────────────────────────────');
    console.log();

    // ── Phase 0: User preferences ──────────────────────
    console.log('  👤 User Preferences');
    console.log();
    const userName = await ask(rl, 'What should the agents call you?', 'there');
    const userRole = await ask(rl, 'Your role/title (optional)');
    const preferredLanguage = await select(rl, 'Preferred response language:', [
      { label: 'Korean (ko)', value: 'ko' },
      { label: 'English (en)', value: 'en' },
      { label: 'Japanese (ja)', value: 'ja' },
    ], 0);
    const communicationStyle = await select(rl, 'Communication style:', [
      { label: 'Concise', value: 'concise' },
      { label: 'Detailed', value: 'detailed' },
      { label: 'Casual', value: 'casual' },
    ], 0);

    console.log();

    // ── Phase 1: Basic info ──────────────────────────
    const projectName = await ask(rl, 'Project name', getDefaultProjectName(targetDir));
    const tagline = await ask(rl, 'Tagline (optional)');
    const projectType = await select(rl, 'Project type:', [
      { label: 'brownfield (existing codebase)', value: 'brownfield' },
      { label: 'greenfield (new project)', value: 'greenfield' },
    ], 0);

    console.log();

    // ── Phase 1.5: Industry ──────────────────────────
    console.log('  ──────────────────────────────────────');
    console.log('  🏭 Industry');
    console.log('  ──────────────────────────────────────');
    console.log();

    const industryOptions = listIndustries().map(id => ({
      label: id === 'saas' ? 'SaaS' :
             id === 'ecommerce' ? 'E-commerce' :
             id === 'b2b_platform' ? 'B2B Platform' :
             'Generic (any product)',
      value: id,
    }));

    const industry = await select(rl, 'Industry type:', industryOptions, 3);
    const preset = getPresetWithOverrides(industry);

    // Offer override for key fields
    console.log();
    console.log('  You can customize key fields (Enter to keep defaults):');
    const domainExpertiseOverride = await ask(rl, `Domain expertise [${preset.domain_expertise.slice(0, 50)}...]`);
    const keyMetricsOverride = await ask(rl, `Key metrics [${preset.key_metrics.slice(0, 50)}...]`);
    const exampleEntityOverride = await ask(rl, `Example entity [${preset.example_entity}]`);

    const industryOverrides = {};
    if (domainExpertiseOverride) industryOverrides.domain_expertise = domainExpertiseOverride;
    if (keyMetricsOverride) industryOverrides.key_metrics = keyMetricsOverride;
    if (exampleEntityOverride) industryOverrides.example_entity = exampleEntityOverride;

    const industryPreset = getPresetWithOverrides(industry, industryOverrides);

    console.log();

    // ── Phase 2: Domains ─────────────────────────────
    const hasDomains = await confirm(rl, 'Do you have work domains?', false);
    let domains = [];
    if (hasDomains) {
      const domainsInput = await ask(rl, 'Domains (id:name, comma-separated)', '');
      domains = parseDomainInput(domainsInput);
    }

    console.log();

    // ── Phase 3: Dev scope ───────────────────────────
    const hasDevRepo = await confirm(rl, 'Do you have a separate dev repo?', false);
    let devScope = { repo_name: '', service_repo: '' };
    if (hasDevRepo) {
      devScope.repo_name = await ask(rl, 'Dashboard repo name');
      devScope.service_repo = await ask(rl, 'Service repo name');
    }

    console.log();

    // ── Phase 4: Spec Site ──────────────────────────
    console.log('  ──────────────────────────────────────');
    console.log('  🌐 Spec Site');
    console.log('  ──────────────────────────────────────');
    console.log();

    const specSiteTier = await select(rl, 'Spec site mode:', [
      { label: 'None — .md files only', value: 'none' },
      { label: 'Static viewer — renders .md files as web pages (no backend)', value: 'static' },
      { label: 'Full interactive — Board, Standup, Retro (backend required)', value: 'interactive' },
    ], 0);

    let specSiteConfig = { enabled: false, mode: 'static', backend: '' };
    if (specSiteTier !== 'none') {
      specSiteConfig.enabled = true;
      specSiteConfig.mode = specSiteTier;
    }

    // ── Phase 6: Backend Setup (Tier 2) ──────────────
    let pmApiConfig = { enabled: false, url: '', features: { rewards: false, meetings: true, docs: true, initiatives: true }, blockchain: { enabled: false, provider: '', token_name: '', contract_address: '', token_decimals: 8 } };

    if (specSiteTier === 'interactive') {
      console.log();
      console.log('  ──────────────────────────────────────');
      console.log('  🖥️  Backend Setup (Tier 2)');
      console.log('  ──────────────────────────────────────');
      console.log();

      pmApiConfig.enabled = true;
      pmApiConfig.url = await ask(rl, 'PM API URL (leave empty to configure later)');

      console.log();
      console.log('  Feature modules:');
      pmApiConfig.features.rewards = await confirm(rl, 'Enable rewards/penalties module?', false);
      pmApiConfig.features.meetings = await confirm(rl, 'Enable meetings module?', true);
      pmApiConfig.features.docs = await confirm(rl, 'Enable docs module?', true);
      pmApiConfig.features.initiatives = await confirm(rl, 'Enable initiatives module?', true);

      console.log();
      const enableBlockchain = await confirm(rl, 'Enable blockchain integration?', false);
      if (enableBlockchain) {
        pmApiConfig.blockchain.enabled = true;
        pmApiConfig.blockchain.provider = await select(rl, 'Blockchain provider:', [
          { label: 'TRON', value: 'tron' },
        ], 0);
        pmApiConfig.blockchain.token_name = await ask(rl, 'Token name');
        pmApiConfig.blockchain.contract_address = await ask(rl, 'Contract address');
      }
    }

    console.log();

    // ── Phase 5: Integrations ────────────────────────
    const integrations = await collectIntegrations(rl, targetDir);

    // ── Generate files ───────────────────────────────
    console.log();

    // project.yaml
    const projectYaml = buildProjectYaml({
      projectName, tagline, projectType,
      domains, devScope, integrations, specSiteConfig, pmApiConfig,
      platform: opts.platform || null,
      industryPreset,
    });
    const contextDir = join(targetDir, '.context');
    await mkdir(contextDir, { recursive: true });
    await writeFile(join(contextDir, 'project.yaml'), stringifyYaml(projectYaml));

    // user-context.yaml
    const userContext = {
      user: {
        name: userName,
      },
      _meta: {
        source: 'cli',
        created_at: new Date().toISOString(),
      },
    };
    if (userRole) userContext.user.role = userRole;
    if (preferredLanguage) userContext.user.language = preferredLanguage;
    if (communicationStyle) userContext.user.communication_style = communicationStyle;

    await writeFile(join(contextDir, 'user-context.yaml'), stringifyYaml(userContext));

    // sessions/index.yaml
    const sessionsDir = join(contextDir, 'sessions');
    await mkdir(join(sessionsDir, 'active'), { recursive: true });
    await mkdir(join(sessionsDir, 'archive'), { recursive: true });
    await writeFile(join(sessionsDir, 'index.yaml'), stringifyYaml({
      sessions: [],
      _meta: { last_updated: new Date().toISOString() },
    }));

    // sprints/s1/context.md
    const sprintDir = join(contextDir, 'sprints', 's1');
    await mkdir(sprintDir, { recursive: true });
    await writeFile(join(sprintDir, 'context.md'), `# Sprint 1\n\n> Write your sprint context here.\n`);

    // Domain folders
    if (domains.length > 0) {
      for (const d of domains) {
        const domainDir = join(contextDir, 'domains', d.id);
        await mkdir(domainDir, { recursive: true });
        await writeFile(join(domainDir, 'index.md'), `# ${d.name}\n\n> Write your domain context here.\n`);
      }
    }

    // Ensure standard directories
    for (const dir of ['global/product', 'global/database', 'global/tracking', 'metrics', 'daily']) {
      await mkdir(join(contextDir, dir), { recursive: true });
    }

  } finally {
    if (ownsRl) rl.close();
  }
}

// ── Integration collection ──────────────────────────────

async function collectIntegrations(rl, targetDir) {
  const registryPath = join(targetDir, '.context', 'integrations', '_registry.yaml');
  const providersDir = join(targetDir, '.context', 'integrations', 'providers');

  let registry;
  try {
    registry = parseYaml(await readFile(registryPath, 'utf-8'));
  } catch {
    return {}; // No registry — skip integrations
  }

  // Load all provider definitions
  const providerFiles = await safeReaddir(providersDir);
  const providers = [];
  for (const file of providerFiles) {
    if (!file.endsWith('.yaml') || file.startsWith('_')) continue;
    try {
      const yaml = parseYaml(await readFile(join(providersDir, file), 'utf-8'));
      providers.push(yaml);
    } catch { /* skip */ }
  }

  console.log('  ──────────────────────────────────────');
  console.log('  🔌 Integrations');
  console.log('  ──────────────────────────────────────');
  console.log();

  const integrations = {};
  const categories = registry.categories || {};

  // Group providers by category
  for (const [catId, cat] of Object.entries(categories)) {
    const catProviders = providers.filter(p => p.category === catId);
    if (catProviders.length === 0) continue;

    const options = [
      ...catProviders.map(p => ({ label: `${p.name}`, value: p.id })),
      { label: 'None', value: null },
    ];

    const selected = await select(rl, `[${cat.label}]`, options, options.length - 1);
    console.log();

    if (!selected) continue;

    const provider = catProviders.find(p => p.id === selected);
    if (!provider) continue;

    // Ask setup questions
    const config = { enabled: true };
    const questions = provider.setup_questions || [];
    for (const q of questions) {
      if (q.type === 'object_list') {
        // Special: collect table/risk/reason list
        const items = await collectObjectList(rl, q);
        config[q.key] = items;
      } else {
        const hint = q.example ? ` (e.g. ${q.example})` : '';
        const label = q.required ? `${q.label}${hint}` : `${q.label}${hint} (optional)`;
        const answer = await ask(rl, label);
        if (answer) config[q.key] = answer;
      }
    }

    integrations[selected] = config;
  }

  return integrations;
}

async function collectObjectList(rl, question) {
  const items = [];
  const fields = question.fields || [];
  const hasMore = await confirm(rl, `Add ${question.label} entries?`, false);
  if (!hasMore) return items;

  let adding = true;
  while (adding) {
    const item = {};
    for (const field of fields) {
      item[field] = await ask(rl, `  ${field}`);
    }
    items.push(item);
    adding = await confirm(rl, '  Add another?', false);
  }
  return items;
}

// ── Ambiguity score ─────────────────────────────────────

/**
 * Calculate ambiguity score from project.yaml content.
 * Returns 0.0 (clear) to 1.0 (high ambiguity).
 *
 * Note: fresh setup defaults are usually high ambiguity because deep-interview
 * fields are empty, but this may be below 1.0 if users fill optional basics
 * (for example `project.tagline`) during setup.
 *
 * @param {object} yaml
 * @returns {number}
 */
export function calculateAmbiguityScore(yaml) {
  const root = (yaml && typeof yaml === 'object') ? yaml : {};

  const checks = [
    // Basic clarity
    { weight: 0.1, filled: !!root.project?.tagline },

    // Problem & market
    { weight: 0.15, filled: !!root.problem?.core },
    { weight: 0.1, filled: !!root.problem?.target },
    { weight: 0.05, filled: root.problem?.alternatives?.length > 0 },
    { weight: 0.05, filled: !!root.problem?.timing },

    // Solution
    { weight: 0.15, filled: !!root.solution?.approach },
    { weight: 0.08, filled: !!root.solution?.differentiation },
    { weight: 0.05, filled: root.solution?.outcome?.length > 0 },

    // Current state
    { weight: 0.1, filled: !!root.current_state?.stage },
    { weight: 0.07, filled: !!root.current_state?.focus },
    { weight: 0.05, filled: !!root.current_state?.next_milestone },

    // Validation
    { weight: 0.05, filled: root.validation?.confirmed?.length > 0 },
  ];

  let totalWeight = 0;
  let filledWeight = 0;

  for (const { weight, filled } of checks) {
    totalWeight += weight;
    if (filled) filledWeight += weight;
  }

  return Math.round((1 - filledWeight / totalWeight) * 100) / 100;
}

// ── project.yaml builder ────────────────────────────────

export const ALL_INTEGRATION_PROVIDERS = [
  'ga4',
  'mixpanel',
  'notion',
  'linear',
  'channel_io',
  'intercom',
  'prod_db',
  'notebooklm',
  'corti',
  'turso_cf',
  'supabase',
  'sqlite_lambda',
];

function buildProjectYaml({ projectName, tagline, projectType, domains, devScope, integrations, specSiteConfig, pmApiConfig, platform, industryPreset }) {
  // Build the full integrations block with all known providers
  const integrationsBlock = {};

  for (const id of ALL_INTEGRATION_PROVIDERS) {
    if (integrations[id]) {
      integrationsBlock[id] = integrations[id];
    } else {
      integrationsBlock[id] = { enabled: false };
    }
  }

  const yaml = {
    project: {
      name: projectName,
      tagline: tagline || '',
      type: projectType,
      ...(industryPreset || {}),
    },
    problem: {
      core: '',
      target: '',
      alternatives: [],
      timing: '',
    },
    solution: {
      approach: '',
      differentiation: '',
      outcome: [],
    },
    current_state: {
      stage: '',
      focus: '',
      uncertainty: '',
      next_milestone: '',
    },
    validation: {
      confirmed: [],
      unknown: [],
      customer_feedback: '',
    },
    operations: {
      sprint: {
        enabled: true,
        current: 1,
        duration_weeks: 2,
        d_day: '',
      },
      domains: domains.map(d => ({
        id: d.id,
        name: d.name,
        path: `domains/${d.id}/`,
      })),
      integrations: integrationsBlock,
      dev_scope: devScope,
      spec_site: {
        enabled: specSiteConfig.enabled,
        mode: specSiteConfig.mode,
        title: `${projectName} Spec`,
        deploy_url: '',
        backend: specSiteConfig.backend,
      },
      pm_api: pmApiConfig || { enabled: false },
    },
    _meta: {
      created_at: new Date().toISOString(),
      created_by: 'popilot init',
      needs_deep_interview: true,
      ambiguity_score: 0,
      last_interview: null,
      version: '1.0.0',
      ...(platform ? { platform } : {}),
    },
  };

  yaml._meta.ambiguity_score = calculateAmbiguityScore(yaml);

  return yaml;
}

// ── Helpers ─────────────────────────────────────────────

function getDefaultProjectName(targetDir) {
  const parts = targetDir.split('/');
  const last = parts[parts.length - 1];
  return last === '.' ? parts[parts.length - 2] || 'my-project' : last;
}

function parseDomainInput(input) {
  if (!input.trim()) return [];
  return input.split(',').map(s => {
    const trimmed = s.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      return { id: trimmed.slice(0, colonIdx).trim(), name: trimmed.slice(colonIdx + 1).trim() };
    }
    // No colon — use as both id and name
    return { id: trimmed, name: trimmed };
  }).filter(d => d.id);
}

async function safeReaddir(dir) {
  try { return await readdir(dir); } catch { return []; }
}
