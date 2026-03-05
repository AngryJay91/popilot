#!/usr/bin/env node

import { resolve, basename } from 'node:path';
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
    npx popilot my-project          # same as: popilot init my-project
`;

const SUBCOMMANDS = new Set(['init', 'hydrate', 'doctor', 'help']);

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

  // 4. Install spec-site dependencies
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
  console.log('  📁 Created:');
  console.log('     CLAUDE.md              → System instructions (hydrated)');
  console.log('     .context/project.yaml  → Project configuration');
  console.log('     .claude/commands/      → Slash commands');
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

// ── Run ─────────────────────────────────────────────────

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
