import { exit } from 'node:process';
import { spawnSync } from 'node:child_process';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    exit(result.status ?? 1);
  }
}

// Ensure template dependencies are installed from lockfile.
run('npm', ['--prefix', 'scaffold/spec-site', 'ci']);

// Validate scaffold/spec-site TypeScript sources.
run('npm', [
  '--prefix',
  'scaffold/spec-site',
  'exec',
  '--',
  'vue-tsc',
  '-p',
  'scaffold/spec-site/tsconfig.json',
  '--noEmit',
]);
