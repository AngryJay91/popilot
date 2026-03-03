/**
 * Zero-dep interactive prompt helpers using Node.js readline/promises.
 * All functions accept an optional `rl` parameter for testing/injection.
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

/** Create a shared readline interface */
export function createPrompt() {
  return createInterface({ input: stdin, output: stdout });
}

/**
 * Ask a single question, return the answer (or default).
 * @param {import('node:readline/promises').Interface} rl
 * @param {string} question
 * @param {string} [defaultValue]
 * @returns {Promise<string>}
 */
export async function ask(rl, question, defaultValue) {
  const suffix = defaultValue != null ? ` [${defaultValue}]` : '';
  const answer = (await rl.question(`  ${question}${suffix}: `)).trim();
  return answer || defaultValue || '';
}

/**
 * Y/n confirmation.
 * @param {import('node:readline/promises').Interface} rl
 * @param {string} question
 * @param {boolean} [defaultYes=false]
 * @returns {Promise<boolean>}
 */
export async function confirm(rl, question, defaultYes = false) {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const answer = (await rl.question(`  ${question} (${hint}): `)).trim().toLowerCase();
  if (answer === '') return defaultYes;
  return answer === 'y' || answer === 'yes';
}

/**
 * Numbered single-select menu.
 * @param {import('node:readline/promises').Interface} rl
 * @param {string} question
 * @param {{ label: string, value: any }[]} options
 * @param {number} [defaultIndex=0] - 0-based default index
 * @returns {Promise<any>} selected value
 */
export async function select(rl, question, options, defaultIndex = 0) {
  console.log(`  ${question}`);
  options.forEach((opt, i) => {
    console.log(`    ${i + 1}. ${opt.label}`);
  });
  const answer = (await rl.question(`  Select [${defaultIndex + 1}]: `)).trim();
  const idx = answer ? parseInt(answer, 10) - 1 : defaultIndex;
  if (idx >= 0 && idx < options.length) return options[idx].value;
  return options[defaultIndex].value;
}

/**
 * Numbered multi-select menu (comma-separated input).
 * @param {import('node:readline/promises').Interface} rl
 * @param {string} question
 * @param {{ label: string, value: any }[]} options
 * @returns {Promise<any[]>} selected values
 */
export async function multiSelect(rl, question, options) {
  console.log(`  ${question}`);
  options.forEach((opt, i) => {
    console.log(`    ${i + 1}. ${opt.label}`);
  });
  const answer = (await rl.question('  Select (comma-separated, Enter to skip): ')).trim();
  if (!answer) return [];
  const indices = answer.split(',').map(s => parseInt(s.trim(), 10) - 1);
  return indices
    .filter(i => i >= 0 && i < options.length)
    .map(i => options[i].value);
}
