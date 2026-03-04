import { readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { cwd, exit } from 'node:process';
import { spawnSync } from 'node:child_process';

const ROOT = cwd();
const TARGET_DIRS = ['bin', 'lib', 'test', 'scripts'];
const JS_EXTENSIONS = new Set(['.mjs', '.js']);

async function collectScriptFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectScriptFiles(fullPath));
      continue;
    }

    const ext = extname(entry.name);
    if (JS_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const allFiles = [];
  for (const dir of TARGET_DIRS) {
    allFiles.push(...await collectScriptFiles(join(ROOT, dir)));
  }

  const errors = [];
  for (const file of allFiles) {
    const result = spawnSync('node', ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
      errors.push({ file, stderr: result.stderr || result.stdout || 'syntax check failed' });
    }
  }

  if (errors.length > 0) {
    console.error(`❌ lint failed (${errors.length} files)`);
    for (const { file, stderr } of errors) {
      console.error(`\n- ${relative(ROOT, file)}\n${stderr.trim()}`);
    }
    exit(1);
  }

  console.log(`✅ lint passed (${allFiles.length} files)`);
}

await main();
