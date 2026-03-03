/**
 * Interactive setup wizard — terminal interview → project.yaml + related files.
 *
 * Collects only essential config. AI deep interview is deferred to Claude Code
 * via `_meta.needs_deep_interview: true`.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ask, confirm, select, createPrompt } from './prompt.mjs';
import { parse as parseYaml, stringify as stringifyYaml } from './yaml-lite.mjs';

/**
 * Run the interactive setup wizard.
 *
 * @param {string} targetDir - Project root (scaffold already copied)
 * @param {object} [opts]
 * @param {import('node:readline/promises').Interface} [opts.rl] - Inject readline for testing
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

    // ── Phase 4: Integrations ────────────────────────
    const integrations = await collectIntegrations(rl, targetDir);

    // ── Generate files ───────────────────────────────
    console.log();

    // project.yaml
    const projectYaml = buildProjectYaml({
      projectName, tagline, projectType,
      domains, devScope, integrations,
      platform: opts.platform || null,
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

// ── project.yaml builder ────────────────────────────────

function buildProjectYaml({ projectName, tagline, projectType, domains, devScope, integrations, platform }) {
  // Build the full integrations block with all known providers
  const allProviders = ['ga4', 'mixpanel', 'notion', 'linear', 'channel_io', 'intercom', 'prod_db', 'notebooklm', 'corti'];
  const integrationsBlock = {};

  for (const id of allProviders) {
    if (integrations[id]) {
      integrationsBlock[id] = integrations[id];
    } else {
      integrationsBlock[id] = { enabled: false };
    }
  }

  return {
    project: {
      name: projectName,
      tagline: tagline || '',
      type: projectType,
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
        title: `${projectName} Spec`,
        deploy_url: '',
      },
    },
    _meta: {
      created_at: new Date().toISOString(),
      created_by: 'popilot init',
      needs_deep_interview: true,
      last_interview: null,
      version: '1.0.0',
      ...(platform ? { platform } : {}),
    },
  };
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
