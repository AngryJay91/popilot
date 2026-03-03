/**
 * Installation diagnostics — check that Popilot is properly set up.
 */

import { readdir, readFile, stat, access } from 'node:fs/promises';
import { join } from 'node:path';
import { loadManifest, getDefaultAdapter } from './adapter.mjs';

/**
 * Run diagnostics on a Popilot installation.
 *
 * @param {string} targetDir - Project root
 * @param {object} [opts]
 * @param {boolean} [opts.skipSpecSite]
 * @param {string} [opts.platform]
 * @returns {Promise<{ passed: string[], failed: string[], warnings: string[] }>}
 */
export async function runDoctor(targetDir, opts = {}) {
  const passed = [];
  const failed = [];
  const warnings = [];

  // Load adapter manifest for platform-specific checks
  const platform = opts.platform || getDefaultAdapter();
  let manifest;
  try {
    manifest = await loadManifest(platform);
  } catch {
    manifest = null;
  }

  console.log();
  console.log('  ──────────────────────────────────────');
  console.log('  🩺 Popilot Doctor');
  console.log('  ──────────────────────────────────────');
  console.log();

  // 1. project.yaml exists (core check)
  await check('project.yaml exists', async () => {
    await access(join(targetDir, '.context', 'project.yaml'));
  }, passed, failed);

  // 2. Platform-specific checks from manifest
  if (manifest?.doctor_checks) {
    for (const dc of manifest.doctor_checks) {
      await check(dc.name, async () => {
        await access(join(targetDir, dc.file));
        if (dc.no_hbs) {
          try {
            await access(join(targetDir, dc.file + '.hbs'));
            throw new Error(`${dc.file}.hbs still exists — hydration incomplete`);
          } catch (e) {
            if (e.message.includes('hydration')) throw e;
            // .hbs not found — good
          }
        }
      }, passed, failed);
    }
  } else {
    // Fallback: CLAUDE.md check (backward compat)
    await check('CLAUDE.md exists (hydrated)', async () => {
      await access(join(targetDir, 'CLAUDE.md'));
      try {
        await access(join(targetDir, 'CLAUDE.md.hbs'));
        throw new Error('CLAUDE.md.hbs still exists — hydration incomplete');
      } catch (e) {
        if (e.message.includes('hydration')) throw e;
      }
    }, passed, failed);
  }

  // 3. No residual .hbs files
  await check('No residual .hbs files', async () => {
    const hbsFiles = await findHbsFiles(targetDir);
    if (hbsFiles.length > 0) {
      throw new Error(`${hbsFiles.length} .hbs files remain: ${hbsFiles.slice(0, 3).join(', ')}`);
    }
  }, passed, failed);

  // 4. agents/ has .md files
  await check('agents/*.md files exist', async () => {
    const agentsDir = join(targetDir, '.context', 'agents');
    const files = await readdir(agentsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    if (mdFiles.length === 0) throw new Error('No .md files in agents/');
  }, passed, failed);

  // 5. sessions/index.yaml exists
  await check('sessions/index.yaml exists', async () => {
    await access(join(targetDir, '.context', 'sessions', 'index.yaml'));
  }, passed, failed);

  // 6. spec-site/node_modules exists (unless skipped)
  if (!opts.skipSpecSite) {
    await check('spec-site/node_modules exists', async () => {
      await access(join(targetDir, 'spec-site', 'node_modules'));
    }, passed, failed, warnings);
  }

  // 7. .gitignore entries
  await check('.gitignore includes user-context.yaml', async () => {
    const content = await readFile(join(targetDir, '.gitignore'), 'utf-8');
    if (!content.includes('user-context.yaml')) {
      throw new Error('user-context.yaml not in .gitignore');
    }
  }, passed, failed, warnings);

  await check('.gitignore includes .secrets.yaml', async () => {
    const content = await readFile(join(targetDir, '.gitignore'), 'utf-8');
    if (!content.includes('.secrets.yaml')) {
      throw new Error('.secrets.yaml not in .gitignore');
    }
  }, passed, failed, warnings);

  // Summary
  console.log();
  console.log('  ──────────────────────────────────────');
  if (failed.length === 0 && warnings.length === 0) {
    console.log('  ✅ All checks passed!');
  } else {
    console.log(`  ${passed.length} passed, ${failed.length} failed, ${warnings.length} warnings`);
  }
  console.log();

  return { passed, failed, warnings };
}

async function check(name, fn, passed, failed, warningsList) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed.push(name);
  } catch (e) {
    if (warningsList) {
      console.log(`  ⚠️  ${name}: ${e.message}`);
      warningsList.push(name);
    } else {
      console.log(`  ❌ ${name}: ${e.message}`);
      failed.push(name);
    }
  }
}

async function findHbsFiles(dir) {
  const results = [];
  async function walk(d) {
    let entries;
    try { entries = await readdir(d, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const fullPath = join(d, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.hbs')) {
        results.push(fullPath.replace(dir + '/', ''));
      }
    }
  }
  await walk(dir);
  return results;
}
