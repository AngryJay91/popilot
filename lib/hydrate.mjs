/**
 * Hydration engine — Integration registry processing + .hbs → .md rendering.
 *
 * Step A: Collect enabled providers, build capabilities map, inject INTEGRATION_* markers.
 * Step B: Render standard Handlebars templates via template-engine.mjs.
 */

import { readdir, readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { join, basename, relative } from 'node:path';
import { parse as parseYaml } from './yaml-lite.mjs';
import { render } from './template-engine.mjs';
import { loadManifest, getDefaultAdapter } from './adapter.mjs';

/**
 * Run full hydration on a project directory.
 *
 * @param {string} targetDir - Root project directory
 * @param {object} [opts]
 * @param {boolean} [opts.skipSpecSite]
 * @param {string} [opts.platform]
 * @returns {Promise<{ hydrated: string[], domains: string[] }>}
 */
export async function hydrate(targetDir, opts = {}) {
  const projectYaml = await readYamlFile(join(targetDir, '.context', 'project.yaml'));
  const registry = await readYamlFile(join(targetDir, '.context', 'integrations', '_registry.yaml'));

  // Load user-context.yaml (optional, gitignored)
  let userYaml = {};
  try {
    userYaml = await readYamlFile(join(targetDir, '.context', 'user-context.yaml'));
  } catch { /* optional */ }

  // Load adapter manifest
  const platform = opts.platform || projectYaml._meta?.platform || getDefaultAdapter();
  let manifest;
  try {
    manifest = await loadManifest(platform);
  } catch {
    manifest = null;
  }

  // 1. Collect enabled providers
  const integrations = projectYaml.operations?.integrations || {};
  const enabledProviders = [];

  for (const [id, cfg] of Object.entries(integrations)) {
    if (cfg?.enabled) {
      try {
        const providerYaml = await readYamlFile(
          join(targetDir, '.context', 'integrations', 'providers', `${id}.yaml`)
        );
        enabledProviders.push({ id, config: cfg, provider: providerYaml });
      } catch {
        // Provider file not found — skip
      }
    }
  }

  // 2. Build capabilities map
  const capabilities = {};
  for (const { provider } of enabledProviders) {
    if (provider.category && registry.categories?.[provider.category]) {
      capabilities[provider.category] = true;
    }
  }

  // 3. Build template context (merge adapter template_vars)
  const ctx = buildContext(projectYaml, capabilities, userYaml, manifest);

  // 4. Process all .hbs files
  const hydrated = [];

  // Agent .hbs files
  const agentMap = {
    'orchestrator.md.hbs': 'orchestrator',
    'strategist.md.hbs': 'strategist',
    'planner.md.hbs': 'planner',
    'validator.md.hbs': 'validator',
    'analyst.md.hbs': 'analyst',
    'researcher.md.hbs': 'researcher',
    'developer.md.hbs': 'developer',
    'qa.md.hbs': 'qa',
  };

  const agentsDir = join(targetDir, '.context', 'agents');
  for (const [file, agentName] of Object.entries(agentMap)) {
    const filePath = join(agentsDir, file);
    const result = await hydrateFile(filePath, {
      ctx,
      registry,
      enabledProviders,
      targetType: 'agent',
      targetName: agentName,
    });
    if (result) hydrated.push(relative(targetDir, result));
  }

  // Command .hbs files — from manifest or fallback
  const commandMap = manifest?.commands?.hydration_map || {
    'analytics.md.hbs': 'analytics',
    'daily.md.hbs': 'daily',
    'dev.md.hbs': 'dev',
  };

  const commandTargetDir = manifest?.commands?.target_dir || '.claude/commands';
  const commandsDir = join(targetDir, commandTargetDir);
  for (const [file, cmdName] of Object.entries(commandMap)) {
    const filePath = join(commandsDir, file);
    const result = await hydrateFile(filePath, {
      ctx,
      registry,
      enabledProviders,
      targetType: 'command',
      targetName: cmdName,
    });
    if (result) hydrated.push(relative(targetDir, result));
  }

  // System .hbs files — from manifest or fallback
  const systemFiles = [];
  if (manifest?.system_prompt) {
    const sp = manifest.system_prompt;
    systemFiles.push({
      path: join(targetDir, sp.source),
      name: sp.hydration?.name || sp.target,
    });
  } else {
    systemFiles.push({ path: join(targetDir, 'CLAUDE.md.hbs'), name: 'CLAUDE.md' });
  }
  systemFiles.push({ path: join(targetDir, '.context', 'WORKFLOW.md.hbs'), name: 'WORKFLOW.md' });

  for (const { path: filePath, name } of systemFiles) {
    const result = await hydrateFile(filePath, {
      ctx,
      registry,
      enabledProviders,
      targetType: 'system',
      targetName: name,
    });
    if (result) hydrated.push(relative(targetDir, result));
  }

  // Domain command generation
  const domains = projectYaml.operations?.domains || [];
  const domainResults = [];
  const domainTemplateFile = manifest?.commands?.domain_template || '_domain.md.hbs';
  const domainTemplatePath = join(commandsDir, domainTemplateFile);
  let domainTemplate;
  try {
    domainTemplate = await readFile(domainTemplatePath, 'utf-8');
  } catch {
    domainTemplate = null;
  }

  if (domainTemplate && domains.length > 0) {
    for (const domain of domains) {
      const domainCtx = { ...ctx, ...domain };
      const rendered = render(domainTemplate, domainCtx);
      const outPath = join(commandsDir, `${domain.id}.md`);
      await writeFile(outPath, rendered);
      domainResults.push(relative(targetDir, outPath));
    }
  }

  // Clean up _domain.md.hbs
  if (domainTemplate) {
    try { await unlink(domainTemplatePath); } catch {}
  }

  return { hydrated, domains: domainResults };
}

// ── Internals ──────────────────────────────────────────

/**
 * Hydrate a single .hbs file:
 *  1. Inject INTEGRATION_* markers
 *  2. Run Handlebars render
 *  3. Write .md, delete .hbs
 *
 * @returns {Promise<string|null>} output path, or null if source not found
 */
async function hydrateFile(hbsPath, { ctx, registry, enabledProviders, targetType, targetName }) {
  let template;
  try {
    template = await readFile(hbsPath, 'utf-8');
  } catch {
    return null; // .hbs not found
  }

  // Step A: Integration marker injection
  template = injectMarkers(template, { registry, enabledProviders, targetType, targetName, ctx });

  // Step B: Handlebars rendering
  const output = render(template, ctx);

  // Write output
  const outPath = hbsPath.replace(/\.hbs$/, '');
  await writeFile(outPath, output);

  // Remove .hbs source
  try { await unlink(hbsPath); } catch {}

  return outPath;
}

/**
 * Inject INTEGRATION_* markers into a template string.
 */
function injectMarkers(template, { registry, enabledProviders, targetType, targetName, ctx }) {
  let result = template;

  if (targetType === 'agent') {
    // {{INTEGRATION_PROMPTS}} — collect agent_prompts.{agentName} from relevant providers
    const prompts = collectPromptsForAgent(targetName, registry, enabledProviders, ctx);
    result = result.replace('{{INTEGRATION_PROMPTS}}', prompts);

    // {{INTEGRATION_TOOLS_FOOTER}} — collect footer_tool_line from all enabled providers for this agent
    const footers = collectFootersForAgent(targetName, registry, enabledProviders, ctx);
    result = result.replace('{{INTEGRATION_TOOLS_FOOTER}}', footers);

    // {{INTEGRATION_CAUTION_LIST}} — from database providers
    const cautions = collectCautionList(registry, enabledProviders, ctx);
    result = result.replace('{{INTEGRATION_CAUTION_LIST}}', cautions);
  } else if (targetType === 'command') {
    // {{INTEGRATION_PROMPTS}} — collect command_prompts.{cmdName} from relevant providers
    const prompts = collectPromptsForCommand(targetName, registry, enabledProviders, ctx);
    result = result.replace('{{INTEGRATION_PROMPTS}}', prompts);
  } else if (targetType === 'system') {
    if (targetName === 'CLAUDE.md') {
      const safetyRules = collectSystemContent('safety_rules', registry, enabledProviders, ctx);
      result = result.replace('{{INTEGRATION_SAFETY_RULES}}', safetyRules);
    } else if (targetName === 'WORKFLOW.md') {
      const workflowRules = collectSystemContent('workflow_rules', registry, enabledProviders, ctx);
      result = result.replace('{{INTEGRATION_WORKFLOW_RULES}}', workflowRules);
    }
  }

  return result;
}

/**
 * Find providers relevant to an agent name, then collect their agent_prompts.
 */
function collectPromptsForAgent(agentName, registry, enabledProviders, ctx) {
  const categories = registry.categories || {};
  // Which categories list this agent?
  const relevantCategories = new Set();
  for (const [catId, cat] of Object.entries(categories)) {
    const agents = cat.agents || [];
    if (agents.includes(agentName)) relevantCategories.add(catId);
  }

  const parts = [];
  for (const { provider, config } of enabledProviders) {
    if (!relevantCategories.has(provider.category)) continue;
    const prompt = provider.agent_prompts?.[agentName];
    if (prompt) parts.push(resolveConfigVars(prompt, config, ctx));
  }
  return parts.join('\n');
}

/**
 * Collect footer tool lines for an agent.
 */
function collectFootersForAgent(agentName, registry, enabledProviders, ctx) {
  const categories = registry.categories || {};
  const relevantCategories = new Set();
  for (const [catId, cat] of Object.entries(categories)) {
    if ((cat.agents || []).includes(agentName)) relevantCategories.add(catId);
  }

  const lines = [];
  for (const { provider, config } of enabledProviders) {
    if (!relevantCategories.has(provider.category)) continue;
    if (provider.footer_tool_line) {
      lines.push(resolveConfigVars(provider.footer_tool_line, config, ctx));
    }
  }
  return lines.join(', ');
}

/**
 * Collect caution_list from database-category providers.
 */
function collectCautionList(registry, enabledProviders, ctx) {
  const parts = [];
  for (const { provider, config } of enabledProviders) {
    if (provider.category !== 'database') continue;
    if (provider.caution_list) {
      parts.push(resolveConfigVars(provider.caution_list, config, ctx));
    }
  }
  return parts.join('\n');
}

/**
 * Collect prompts for a command name.
 */
function collectPromptsForCommand(cmdName, registry, enabledProviders, ctx) {
  const categories = registry.categories || {};
  const relevantCategories = new Set();
  for (const [catId, cat] of Object.entries(categories)) {
    if ((cat.commands || []).includes(cmdName)) relevantCategories.add(catId);
  }

  const parts = [];
  for (const { provider, config } of enabledProviders) {
    if (!relevantCategories.has(provider.category)) continue;
    const prompt = provider.command_prompts?.[cmdName];
    if (prompt) parts.push(resolveConfigVars(prompt, config, ctx));
  }
  return parts.join('\n');
}

/**
 * Collect system-level content (safety_rules or workflow_rules).
 */
function collectSystemContent(fieldName, registry, enabledProviders, ctx) {
  const categories = registry.categories || {};
  // Which categories affect system files?
  const relevantCategories = new Set();
  for (const [catId, cat] of Object.entries(categories)) {
    const sysFiles = cat.system_files || [];
    const targetFile = fieldName === 'safety_rules' ? 'CLAUDE.md' : 'WORKFLOW.md';
    if (sysFiles.includes(targetFile)) relevantCategories.add(catId);
  }

  const parts = [];
  for (const { provider, config } of enabledProviders) {
    if (!relevantCategories.has(provider.category)) continue;
    const rules = provider[fieldName];
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        if (rule.content) parts.push(resolveConfigVars(rule.content, config, ctx));
      }
    }
  }
  return parts.join('\n');
}

/**
 * Resolve {{config.KEY}} and {{#each config.KEY}} within a provider prompt string.
 * Also handles {{{config.KEY}}} (triple-brace, unescaped — same as double for us).
 */
function resolveConfigVars(str, providerConfig, ctx) {
  let result = str;

  // Handle triple-brace (unescaped) — treat same as double
  result = result.replace(/\{\{\{config\.([a-zA-Z0-9_]+)\}\}\}/g, (_, key) => {
    return providerConfig[key] ?? '';
  });

  // Handle {{#each config.KEY}}...{{/each}} blocks
  result = result.replace(
    /\{\{#each config\.([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, key, body) => {
      const arr = providerConfig[key];
      if (!Array.isArray(arr) || arr.length === 0) return '';
      return arr.map(item => {
        let line = body;
        // Replace {{this.field}} references
        line = line.replace(/\{\{this\.([a-zA-Z0-9_]+)\}\}/g, (__, field) => {
          return item[field] ?? '';
        });
        return line;
      }).join('');
    }
  );

  // Handle simple {{config.KEY}} placeholders
  result = result.replace(/\{\{config\.([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    return providerConfig[key] ?? '';
  });

  return result;
}

/**
 * Build a flat context object for Handlebars rendering.
 * Merges adapter template_vars if provided.
 */
function buildContext(projectYaml, capabilities, userYaml = {}, manifest = null) {
  const project = projectYaml.project || {};
  const ops = projectYaml.operations || {};
  const domains = ops.domains || [];
  const devScope = ops.dev_scope || {};
  const specSite = ops.spec_site || {};
  const integrations = ops.integrations || {};

  const ctx = {
    project,
    domains,
    dev_scope: devScope,
    spec_site: specSite,
    integrations,
    capabilities,
    user: userYaml.user || {},
  };

  // Merge adapter template variables
  if (manifest?.template_vars) {
    for (const [key, value] of Object.entries(manifest.template_vars)) {
      ctx[key] = value;
    }
  }

  return ctx;
}

/**
 * Read and parse a YAML file.
 */
async function readYamlFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  return parseYaml(content);
}
