#!/usr/bin/env node

import { resolve, basename } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { copyScaffold, appendToFile, detectExisting } from '../lib/scaffold.mjs';
import { runSetupWizard } from '../lib/setup-wizard.mjs';
import { hydrate } from '../lib/hydrate.mjs';
import { runDoctor } from '../lib/doctor.mjs';
import { loadManifest, getDefaultAdapter } from '../lib/adapter.mjs';

const USAGE = `
  popilot <command> [target-dir] [options]

  Commands:
    init [dir]      Scaffold + interactive setup + hydration (default)
    hydrate [dir]   Sync latest scaffold templates + re-hydrate from project.yaml
    doctor [dir]    Check installation health
    deploy [dir]    Deploy pm-api to Cloudflare Workers (Tier 2)
    migrate [dir]   Run SQL schema migrations on pm-api database (Tier 2)
    help            Show this help

  Options:
    --skip-spec-site   Skip spec-site (Vue3 + Vite) scaffold
    --force            Overwrite existing files
    --platform=<id>    Adapter platform (default: claude-code)
    -h, --help         Show this help

  Examples:
    npx popilot init my-project
    npx popilot hydrate
    npx popilot hydrate --force
    npx popilot doctor
    npx popilot deploy
    npx popilot migrate
    npx popilot my-project          # same as: popilot init my-project
`;

const SUBCOMMANDS = new Set(['init', 'hydrate', 'doctor', 'deploy', 'migrate', 'help']);

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help') || args[0] === 'help') {
    console.log(USAGE);
    process.exit(0);
  }

  const skipSpecSite = args.includes('--skip-spec-site');
  const force = args.includes('--force');
  const platformArg = args.find(a => a.startsWith('--platform='));
  const platform = platformArg ? platformArg.split('=')[1] : getDefaultAdapter();
  const positional = args.filter(a => !a.startsWith('-'));

  // Determine subcommand and target directory
  let cmd, targetDir;
  if (positional.length === 0) {
    cmd = 'init';
    targetDir = resolve('.');
  } else if (SUBCOMMANDS.has(positional[0])) {
    cmd = positional[0];
    targetDir = resolve(positional[1] || '.');
  } else {
    // Backward compat: popilot [dir] → init [dir]
    cmd = 'init';
    targetDir = resolve(positional[0]);
  }

  switch (cmd) {
    case 'init':
      await cmdInit(targetDir, { skipSpecSite, force, platform });
      break;
    case 'hydrate':
      await cmdHydrate(targetDir, { skipSpecSite, platform, force });
      break;
    case 'doctor':
      await cmdDoctor(targetDir, { skipSpecSite, platform });
      break;
    case 'deploy':
      await cmdDeploy(targetDir);
      break;
    case 'migrate':
      await cmdMigrate(targetDir);
      break;
  }
}

// ── init ────────────────────────────────────────────────

async function cmdInit(targetDir, { skipSpecSite, force, platform }) {
  console.log();
  console.log('  🚀 Popilot — Multi-agent PO/PM System');
  console.log('  ══════════════════════════════════════');
  console.log();
  console.log(`  Target: ${targetDir}`);
  console.log();

  // Check existing structure
  const existing = await detectExisting(targetDir, platform);
  if (existing.length > 0 && !force) {
    console.log('  ⚠️  Existing Popilot structure detected:');
    existing.forEach(f => console.log(`      - ${f}`));
    console.log();
    console.log('  Use --force to overwrite, or run in an empty directory.');
    console.log();
    process.exit(1);
  }

  // 1. Copy scaffold (core + adapter)
  console.log('  📦 Copying scaffold...');
  const { copied, overwritten, skipped, appends } = await copyScaffold(targetDir, {
    skipSpecSite,
    overwriteExisting: force,
    platform,
  });
  console.log(`     ${copied.length} files created`);
  if (overwritten.length > 0) {
    console.log(`     ${overwritten.length} files overwritten (--force)`);
  }
  if (skipped.length > 0) {
    console.log(`     ${skipped.length} existing files kept`);
  }

  // Process .append files (gitignore)
  for (const { file, content } of appends) {
    const filePath = resolve(targetDir, file);
    await appendToFile(filePath, content);
    console.log(`  ✅ Updated ${file}`);
  }

  // 2. Interactive setup wizard
  await runSetupWizard(targetDir, { platform });

  // 3. Hydrate templates
  console.log();
  console.log('  ──────────────────────────────────────');
  console.log('  🔧 Hydrating templates...');
  console.log('  ──────────────────────────────────────');
  const { hydrated, domains } = await hydrate(targetDir, { skipSpecSite, platform });
  for (const f of hydrated) {
    console.log(`     ${f} ✅`);
  }
  for (const f of domains) {
    console.log(`     ${f} ✅ (domain)`);
  }

  // 4a. Install pm-api dependencies (Tier 2)
  const pmApiDir = resolve(targetDir, 'pm-api');
  try {
    const { access: fsAccess } = await import('node:fs/promises');
    await fsAccess(resolve(pmApiDir, 'package.json'));
    console.log();
    console.log('  📦 Installing pm-api dependencies...');
    try {
      execSync('npm install', { cwd: pmApiDir, stdio: 'pipe' });
      console.log('     ✅ Done');
    } catch {
      console.log('     ⚠️  npm install failed. Run manually: cd pm-api && npm install');
    }

    // Also install mcp-pm
    const mcpPmDir = resolve(targetDir, 'mcp-pm');
    console.log('  📦 Installing mcp-pm dependencies...');
    try {
      execSync('npm install', { cwd: mcpPmDir, stdio: 'pipe' });
      console.log('     ✅ npm install done');
    } catch {
      console.log('     ⚠️  npm install failed. Run manually: cd mcp-pm && npm install');
    }

    // Build mcp-pm — generates dist/index.js required for MCP connection
    console.log('  🔨 Building mcp-pm (TypeScript compile)...');
    try {
      execSync('npm run build', { cwd: mcpPmDir, stdio: 'pipe' });
      console.log('     ✅ Done (dist/index.js ready)');
    } catch {
      console.log('     ⚠️  Build failed. Run manually: cd mcp-pm && npm run build');
      console.log('     ℹ️  MCP connection requires dist/index.js to exist.');
    }
  } catch {
    // pm-api not present (Tier 0/1) — skip
  }

  // 4b. Install spec-site dependencies
  if (!skipSpecSite) {
    const specSiteDir = resolve(targetDir, 'spec-site');
    console.log();
    console.log('  📦 Installing spec-site dependencies...');
    try {
      execSync('npm install', { cwd: specSiteDir, stdio: 'pipe' });
      console.log('     ✅ Done');
    } catch {
      console.log('     ⚠️  npm install failed. Run manually: cd spec-site && npm install');
    }
  }

  // 5. Summary — load post-install from manifest
  let postInstallSteps;
  try {
    const manifest = await loadManifest(platform);
    postInstallSteps = manifest.post_install?.steps;
  } catch {
    postInstallSteps = null;
  }

  console.log();
  console.log('  ──────────────────────────────────────');
  console.log('  ✅ Popilot is ready!');
  console.log('  ──────────────────────────────────────');
  console.log();
  console.log('  Next steps:');
  if (postInstallSteps && postInstallSteps.length > 0) {
    postInstallSteps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });
  } else {
    console.log('  1. Open Claude Code in this directory');
    console.log('  2. Type /start — Oscar will greet you');
  }
  console.log('  3. Oscar can run a deep interview to enrich your project context');
  console.log();
  // Platform-aware file paths
  let sysPromptName = 'CLAUDE.md';
  let cmdDirName = '.claude/commands/';
  try {
    const m = await loadManifest(platform);
    sysPromptName = m.system_prompt?.target || sysPromptName;
    cmdDirName = m.commands?.target_dir || cmdDirName;
  } catch {}

  console.log('  📁 Created:');
  console.log(`     ${sysPromptName.padEnd(20)} → System instructions (hydrated)`);
  console.log('     .context/project.yaml  → Project configuration');
  console.log(`     ${(cmdDirName + '/').replace(/\/\/$/, '/').padEnd(20)} → Slash commands`);
  console.log('     .context/agents/       → Agent personas (hydrated)');
  if (!skipSpecSite) {
    console.log('     spec-site/            → Interactive spec viewer (Vue3 + Vite)');
  }
  console.log();
}

// ── hydrate ─────────────────────────────────────────────

async function cmdHydrate(targetDir, { skipSpecSite, platform, force }) {
  console.log();
  console.log('  🚀 Popilot — Re-hydrating templates');
  console.log('  ══════════════════════════════════════');
  console.log();

  // 0. Sync scaffold updates before hydration.
  // - default: only add missing files (safe upgrade path)
  // - --force: overwrite existing scaffold files as well
  console.log(`  🔄 Syncing latest scaffold (${force ? 'overwrite enabled' : 'missing files only'})...`);
  const { copied, overwritten, appends } = await copyScaffold(targetDir, {
    skipSpecSite,
    overwriteExisting: force,
    platform,
  });

  for (const { file, content } of appends) {
    const filePath = resolve(targetDir, file);
    await appendToFile(filePath, content);
  }

  console.log(`     +${copied.length} files added`);
  if (overwritten.length > 0) {
    console.log(`     ~${overwritten.length} files overwritten (--force)`);
  }

  // 1. Hydrate
  const { hydrated, domains } = await hydrate(targetDir, { skipSpecSite, platform });
  for (const f of hydrated) {
    console.log(`     ${f} ✅`);
  }
  for (const f of domains) {
    console.log(`     ${f} ✅ (domain)`);
  }

  const total = hydrated.length + domains.length;
  console.log();
  console.log(`  ✅ ${total} files hydrated.`);
  console.log();
}

// ── doctor ──────────────────────────────────────────────

async function cmdDoctor(targetDir, { skipSpecSite, platform }) {
  const { passed, failed } = await runDoctor(targetDir, { skipSpecSite, platform });
  process.exit(failed.length > 0 ? 1 : 0);
}

// ── deploy ───────────────────────────────────────────────

async function cmdDeploy(targetDir) {
  console.log();
  console.log('  🚀 Popilot — Deploy pm-api');
  console.log('  ══════════════════════════════════════');
  console.log();

  const pmApiDir = resolve(targetDir, 'pm-api');

  if (!existsSync(pmApiDir)) {
    console.log('  ❌ pm-api directory not found.');
    console.log(`     Expected at: ${pmApiDir}`);
    console.log('     Deploy is only available for Tier 2 (interactive spec-site with backend).');
    console.log();
    process.exit(1);
  }

  const wranglerToml = resolve(pmApiDir, 'wrangler.toml');
  if (!existsSync(wranglerToml)) {
    console.log('  ❌ wrangler.toml not found in pm-api.');
    console.log('     Found wrangler.toml.hbs — run `popilot hydrate` first to generate wrangler.toml.');
    console.log();
    process.exit(1);
  }

  console.log(`  📂 Deploying from: ${pmApiDir}`);
  console.log();

  try {
    execSync('npx wrangler deploy', { cwd: pmApiDir, stdio: 'inherit' });
    console.log();
    console.log('  ✅ pm-api deployed successfully.');
    console.log();
  } catch {
    console.log();
    console.log('  ❌ Deploy failed. Check the wrangler output above for details.');
    console.log();
    process.exit(1);
  }
}

// ── migrate ──────────────────────────────────────────────

async function cmdMigrate(targetDir) {
  console.log();
  console.log('  🗄️  Popilot — Run SQL Migrations');
  console.log('  ══════════════════════════════════════');
  console.log();

  const pmApiDir = resolve(targetDir, 'pm-api');

  if (!existsSync(pmApiDir)) {
    console.log('  ❌ pm-api directory not found.');
    console.log(`     Expected at: ${pmApiDir}`);
    console.log('     Migrate is only available for Tier 2 (interactive spec-site with backend).');
    console.log();
    process.exit(1);
  }

  const sqlDir = resolve(pmApiDir, 'sql');
  if (!existsSync(sqlDir)) {
    console.log('  ❌ pm-api/sql/ directory not found.');
    console.log('     No migration files available.');
    console.log();
    process.exit(1);
  }

  // Read D1 database name from wrangler.toml
  const wranglerToml = resolve(pmApiDir, 'wrangler.toml');
  if (!existsSync(wranglerToml)) {
    console.log('  ❌ wrangler.toml not found in pm-api.');
    console.log('     Run `popilot hydrate` first to generate wrangler.toml.');
    console.log();
    process.exit(1);
  }

  const wranglerContent = readFileSync(wranglerToml, 'utf-8');
  const dbNameMatch = wranglerContent.match(/database_name\s*=\s*"([^"]+)"/);
  const dbName = dbNameMatch ? dbNameMatch[1] : null;

  if (!dbName) {
    console.log('  ❌ Could not find D1 database_name in wrangler.toml.');
    console.log('     Ensure [[d1_databases]] is configured with a database_name.');
    console.log();
    process.exit(1);
  }

  console.log(`  📂 SQL directory: ${sqlDir}`);
  console.log(`  🗃️  D1 database:  ${dbName}`);
  console.log();

  // Read project.yaml to determine enabled features
  const projectYaml = resolve(targetDir, '.context', 'project.yaml');
  let features = { rewards: false, meetings: true, docs: true };

  if (existsSync(projectYaml)) {
    try {
      const yamlContent = readFileSync(projectYaml, 'utf-8');
      // Parse feature flags from YAML (simple regex — avoids adding a YAML dep)
      const rewardsMatch = yamlContent.match(/features:[\s\S]*?rewards:\s*(true|false)/);
      const meetingsMatch = yamlContent.match(/features:[\s\S]*?meetings:\s*(true|false)/);
      const docsMatch = yamlContent.match(/features:[\s\S]*?docs:\s*(true|false)/);

      if (rewardsMatch) features.rewards = rewardsMatch[1] === 'true';
      if (meetingsMatch) features.meetings = meetingsMatch[1] === 'true';
      if (docsMatch) features.docs = docsMatch[1] === 'true';
    } catch {
      console.log('  ⚠️  Could not read project.yaml — using default feature flags.');
    }
  }

  // Build list of schemas to apply
  const schemas = [{ file: 'schema-core.sql', label: 'core (always)' }];

  if (features.rewards) {
    schemas.push({ file: 'schema-rewards.sql', label: 'rewards' });
  }
  if (features.meetings) {
    schemas.push({ file: 'schema-meetings.sql', label: 'meetings' });
  }
  if (features.docs) {
    schemas.push({ file: 'schema-docs.sql', label: 'docs' });
  }

  // Collect numbered migration files (NNN-*.sql) sorted by numeric prefix
  let numberedMigrations = [];
  try {
    numberedMigrations = readdirSync(sqlDir)
      .filter(f => /^\d{3}-.+\.sql$/.test(f))
      .sort((a, b) => parseInt(a.slice(0, 3), 10) - parseInt(b.slice(0, 3), 10))
      .map(f => ({ file: f, label: `migration ${f.slice(0, 3)}` }));
  } catch (err) {
    console.log(`  ⚠️  Could not read sql/ directory for migrations: ${err.message}`);
  }

  const allSteps = [...schemas, ...numberedMigrations];

  console.log('  📋 Steps to apply:');
  for (const s of allSteps) {
    console.log(`     - ${s.file} (${s.label})`);
  }
  console.log();

  // Execute each step (schemas first, then numbered migrations in order)
  let applied = 0;
  let failed = 0;

  for (const s of allSteps) {
    const sqlFile = resolve(sqlDir, s.file);
    if (!existsSync(sqlFile)) {
      console.log(`  ⚠️  ${s.file} not found — skipped`);
      continue;
    }

    try {
      execSync(
        `npx wrangler d1 execute ${dbName} --file=sql/${s.file} --remote`,
        { cwd: pmApiDir, stdio: 'pipe' }
      );
      console.log(`  ✅ ${s.file} applied`);
      applied++;
    } catch (err) {
      console.log(`  ❌ ${s.file} failed: ${err.message}`);
      failed++;
    }
  }

  console.log();
  if (failed === 0) {
    console.log(`  ✅ Migration complete — ${applied} step(s) applied (${schemas.length} schema + ${numberedMigrations.length} migration).`);
  } else {
    console.log(`  ⚠️  Migration finished with errors — ${applied} applied, ${failed} failed.`);
  }
  console.log();
}

// ── Run ─────────────────────────────────────────────────

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
