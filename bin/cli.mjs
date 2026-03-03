#!/usr/bin/env node

import { resolve, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { copyScaffold, appendToFile, detectExisting } from '../lib/scaffold.mjs';
import { runSetupWizard } from '../lib/setup-wizard.mjs';
import { hydrate } from '../lib/hydrate.mjs';
import { runDoctor } from '../lib/doctor.mjs';

const USAGE = `
  popilot <command> [target-dir] [options]

  Commands:
    init [dir]      Scaffold + interactive setup + hydration (default)
    hydrate [dir]   Re-hydrate .hbs templates from existing project.yaml
    doctor [dir]    Check installation health
    help            Show this help

  Options:
    --skip-spec-site   Skip spec-site (Vue3 + Vite) scaffold
    --force            Overwrite existing files
    -h, --help         Show this help

  Examples:
    npx popilot init my-project
    npx popilot hydrate
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
      await cmdInit(targetDir, { skipSpecSite, force });
      break;
    case 'hydrate':
      await cmdHydrate(targetDir, { skipSpecSite });
      break;
    case 'doctor':
      await cmdDoctor(targetDir, { skipSpecSite });
      break;
  }
}

// ── init ────────────────────────────────────────────────

async function cmdInit(targetDir, { skipSpecSite, force }) {
  console.log();
  console.log('  🚀 Popilot — Multi-agent PO/PM System');
  console.log('  ══════════════════════════════════════');
  console.log();
  console.log(`  Target: ${targetDir}`);
  console.log();

  // Check existing structure
  const existing = await detectExisting(targetDir);
  if (existing.length > 0 && !force) {
    console.log('  ⚠️  Existing Popilot structure detected:');
    existing.forEach(f => console.log(`      - ${f}`));
    console.log();
    console.log('  Use --force to overwrite, or run in an empty directory.');
    console.log();
    process.exit(1);
  }

  // 1. Copy scaffold
  console.log('  📦 Copying scaffold...');
  const { copied, overwritten, skipped, appends } = await copyScaffold(targetDir, {
    skipSpecSite,
    overwriteExisting: force,
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
  await runSetupWizard(targetDir);

  // 3. Hydrate templates
  console.log();
  console.log('  ──────────────────────────────────────');
  console.log('  🔧 Hydrating templates...');
  console.log('  ──────────────────────────────────────');
  const { hydrated, domains } = await hydrate(targetDir, { skipSpecSite });
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

  // 5. Summary
  console.log();
  console.log('  ──────────────────────────────────────');
  console.log('  ✅ Popilot is ready!');
  console.log('  ──────────────────────────────────────');
  console.log();
  console.log('  Next steps:');
  console.log('  1. Open Claude Code in this directory');
  console.log('  2. Type /start — Oscar will greet you');
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

async function cmdHydrate(targetDir, { skipSpecSite }) {
  console.log();
  console.log('  🚀 Popilot — Re-hydrating templates');
  console.log('  ══════════════════════════════════════');
  console.log();

  const { hydrated, domains } = await hydrate(targetDir, { skipSpecSite });
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

async function cmdDoctor(targetDir, { skipSpecSite }) {
  const { passed, failed } = await runDoctor(targetDir, { skipSpecSite });
  process.exit(failed.length > 0 ? 1 : 0);
}

// ── Run ─────────────────────────────────────────────────

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
