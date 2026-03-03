/**
 * Adapter resolution — locate and load adapter manifests.
 *
 * An adapter contains platform-specific files (system prompts, commands)
 * that are layered on top of the core scaffold during init/hydrate.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from './yaml-lite.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ADAPTERS_DIR = join(__dirname, '..', 'adapters');

const DEFAULT_ADAPTER = 'claude-code';

/**
 * Get the directory path for an adapter.
 * @param {string} adapterId
 * @returns {string}
 */
export function getAdapterDir(adapterId) {
  return join(ADAPTERS_DIR, adapterId);
}

/**
 * Load and parse an adapter's manifest.yaml.
 * @param {string} adapterId
 * @returns {Promise<object>}
 */
export async function loadManifest(adapterId) {
  const manifestPath = join(getAdapterDir(adapterId), 'manifest.yaml');
  const content = await readFile(manifestPath, 'utf-8');
  return parseYaml(content);
}

/**
 * List all available adapter IDs by scanning the adapters/ directory.
 * @returns {Promise<string[]>}
 */
export async function listAdapters() {
  try {
    const entries = await readdir(ADAPTERS_DIR, { withFileTypes: true });
    const ids = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          await readFile(join(ADAPTERS_DIR, entry.name, 'manifest.yaml'));
          ids.push(entry.name);
        } catch {
          // No manifest — skip
        }
      }
    }
    return ids;
  } catch {
    return [];
  }
}

/**
 * Get the default adapter ID.
 * @returns {string}
 */
export function getDefaultAdapter() {
  return DEFAULT_ADAPTER;
}
