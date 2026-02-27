import { readdir, readFile, writeFile, mkdir, stat, access } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_DIR = join(__dirname, '..', 'scaffold');

/**
 * Copy scaffold directory to target, preserving structure.
 * - .hbs files are copied as-is (hydration happens in Setup Wizard)
 * - .append files are returned for post-processing
 * - All other files copied directly
 *
 * @param {string} targetDir - Destination directory
 * @param {object} options - { skipSpecSite: boolean }
 * @returns {Promise<{ copied: string[], appends: { file: string, content: string }[] }>}
 */
export async function copyScaffold(targetDir, options = {}) {
  const copied = [];
  const appends = [];

  async function walk(srcDir, destDir) {
    const entries = await readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(srcDir, entry.name);
      const relPath = relative(SCAFFOLD_DIR, srcPath);

      // Skip spec-site if requested
      if (options.skipSpecSite && relPath.startsWith('spec-site')) {
        continue;
      }

      if (entry.isDirectory()) {
        const destPath = join(destDir, entry.name);
        await mkdir(destPath, { recursive: true });
        await walk(srcPath, destPath);
      } else if (entry.name.endsWith('.append')) {
        const content = await readFile(srcPath, 'utf-8');
        appends.push({ file: entry.name.replace('.append', ''), content });
      } else {
        const destPath = join(destDir, entry.name);
        await mkdir(dirname(destPath), { recursive: true });

        // Don't overwrite existing files
        try {
          await access(destPath);
          // File exists — skip
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

  await walk(SCAFFOLD_DIR, targetDir);
  return { copied, appends };
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
 * Check if target directory already has Oscar structure
 */
export async function detectExisting(targetDir) {
  const markers = ['.claude', '.context', 'CLAUDE.md'];
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
