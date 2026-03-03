#!/usr/bin/env node

import { resolve, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { copyScaffold, appendToFile, detectExisting } from '../lib/scaffold.mjs';

const USAGE = `
  popilot [target-dir] [options]

  Scaffold the Popilot multi-agent PO/PM system for Claude Code.

  Options:
    --skip-spec-site   Skip spec-site (Vue3 + Vite) scaffold
    --force            Overwrite existing files
    -h, --help         Show this help
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    console.log(USAGE);
    process.exit(0);
  }

  const skipSpecSite = args.includes('--skip-spec-site');
  const force = args.includes('--force');
  const positional = args.filter(a => !a.startsWith('-'));
  const targetDir = resolve(positional[0] || '.');
  const projectName = basename(targetDir) === '.' ? basename(resolve('.')) : basename(targetDir);

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

  // Copy scaffold
  console.log('  📦 Copying scaffold...');
  const { copied, appends } = await copyScaffold(targetDir, { skipSpecSite });
  console.log(`     ${copied.length} files created`);

  // Process .append files (gitignore)
  for (const { file, content } of appends) {
    const filePath = resolve(targetDir, file);
    await appendToFile(filePath, content);
    console.log(`     ✅ Updated ${file}`);
  }

  // Install spec-site dependencies
  if (!skipSpecSite) {
    const specSiteDir = resolve(targetDir, 'spec-site');
    console.log();
    console.log('  📦 Installing spec-site dependencies...');
    try {
      execSync('npm install', { cwd: specSiteDir, stdio: 'pipe' });
      console.log('     ✅ Done');
    } catch (e) {
      console.log('     ⚠️  npm install failed. Run manually: cd spec-site && npm install');
    }
  }

  console.log();
  console.log('  ✅ Popilot scaffold complete!');
  console.log();
  console.log('  Next steps:');
  console.log('  1. Open Claude Code in this directory');
  console.log('  2. Type /start — Setup Wizard will begin');
  console.log('  3. Setup will interview you and configure the system');
  console.log();
  console.log(`  📁 Created structure:`);
  console.log(`     CLAUDE.md.hbs        → System instructions (hydrated in Setup)`);
  console.log(`     .claude/commands/     → 29 slash commands`);
  console.log(`     .context/agents/      → 10 agent personas`);
  console.log(`     .context/templates/   → 11 document templates`);
  console.log(`     .context/WORKFLOW.md  → Workflow guide`);
  if (!skipSpecSite) {
    console.log(`     spec-site/            → Interactive spec viewer (Vue3 + Vite)`);
  }
  console.log();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
