import { readdir, readFile, writeFile, mkdir, stat, access } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAdapterDir, getDefaultAdapter } from './adapter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_DIR = join(__dirname, '..', 'scaffold');

/**
 * Copy scaffold directory to target, preserving structure.
 * Two-pass: 1) core scaffold, 2) adapter overlay.
 *
 * - .hbs files are copied as-is (hydration happens in Setup Wizard)
 * - .append files are returned for post-processing
 * - All other files copied directly
 *
 * @param {string} targetDir - Destination directory
 * @param {object} options - { skipSpecSite, overwriteExisting, platform }
 * @returns {Promise<{ copied: string[], overwritten: string[], skipped: string[], appends: { file: string, content: string }[] }>}
 */
export async function copyScaffold(targetDir, options = {}) {
  const copied = [];
  const overwritten = [];
  const skipped = [];
  const appends = [];

  // Pass 1: Core scaffold
  await walk(SCAFFOLD_DIR, targetDir, targetDir, options, copied, overwritten, skipped, appends);

  // Pass 2: Adapter overlay
  const platform = options.platform || getDefaultAdapter();
  const adapterDir = getAdapterDir(platform);
  try {
    await access(adapterDir);
    await walk(adapterDir, targetDir, targetDir, options, copied, overwritten, skipped, appends);
  } catch {
    // Adapter dir not found — skip
  }

  return { copied, overwritten, skipped, appends };
}

async function walk(srcDir, destDir, targetDir, options, copied, overwritten, skipped, appends) {
  let entries;
  try {
    entries = await readdir(srcDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const relPath = relative(srcDir, srcPath);

    // Skip spec-site if requested
    if (options.skipSpecSite && relPath.startsWith('spec-site')) {
      continue;
    }

    // Skip manifest.yaml (adapter metadata, not a project file)
    if (entry.name === 'manifest.yaml') {
      continue;
    }

    if (entry.isDirectory()) {
      const destPath = join(destDir, entry.name);
      await mkdir(destPath, { recursive: true });
      await walk(srcPath, destPath, targetDir, options, copied, overwritten, skipped, appends);
    } else if (entry.name.endsWith('.append')) {
      const content = await readFile(srcPath, 'utf-8');
      appends.push({ file: entry.name.replace('.append', ''), content });
    } else {
      const destPath = join(destDir, entry.name);
      await mkdir(dirname(destPath), { recursive: true });

      // Existing file handling
      try {
        await access(destPath);
        if (!options.overwriteExisting) {
          skipped.push(relative(targetDir, destPath));
          continue;
        }
        const content = await readFile(srcPath);
        await writeFile(destPath, content);
        overwritten.push(relative(targetDir, destPath));
        continue;
      } catch {
        // File doesn't exist — copy
      }

      const content = await readFile(srcPath);
      await writeFile(destPath, content);
      copied.push(relative(targetDir, destPath));
    }
  }
}

/**
 * Append content to a file (create if doesn't exist)
 */
export async function appendToFile(filePath, content) {
  let existing = '';
  try {
    existing = await readFile(filePath, 'utf-8');
  } catch {
    // File doesn't exist
  }

  // Avoid duplicate lines
  const lines = content.split('\n').filter(l => l.trim());
  const newLines = lines.filter(l => !existing.includes(l));

  if (newLines.length > 0) {
    const separator = existing.endsWith('\n') || existing === '' ? '' : '\n';
    await writeFile(filePath, existing + separator + newLines.join('\n') + '\n');
  }
}

/**
 * Check if target directory already has Popilot structure.
 * Uses adapter detection markers if available.
 */
export async function detectExisting(targetDir, platform) {
  let markers;
  if (platform) {
    try {
      const { loadManifest } = await import('./adapter.mjs');
      const manifest = await loadManifest(platform);
      markers = manifest.detection_markers || [];
    } catch {
      markers = [];
    }
  }

  if (!markers || markers.length === 0) {
    markers = ['.claude', '.context', 'CLAUDE.md'];
  }

  // Always include .context
  if (!markers.includes('.context')) {
    markers.push('.context');
  }

  const found = [];
  for (const marker of markers) {
    try {
      await stat(join(targetDir, marker));
      found.push(marker);
    } catch {
      // Not found
    }
  }

  return found;
}
