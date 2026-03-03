import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { strict as assert } from 'node:assert'
import { copyScaffold } from '../lib/scaffold.mjs'

let pass = 0
let fail = 0

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      pass++
      console.log(`  ✅ ${name}`)
    })
    .catch((e) => {
      fail++
      console.log(`  ❌ ${name}`)
      console.log(`     ${e.message}`)
    })
}

const baseDir = await mkdtemp(join(tmpdir(), 'popilot-force-test-'))

try {
  console.log('\n🔧 scaffold force behavior\n')

  await copyScaffold(baseDir, { skipSpecSite: true })
  const target = join(baseDir, 'CLAUDE.md.hbs')
  const original = await readFile(target, 'utf-8')

  await test('without overwriteExisting keeps existing files', async () => {
    await writeFile(target, 'CUSTOM\n')
    const result = await copyScaffold(baseDir, { skipSpecSite: true })
    const current = await readFile(target, 'utf-8')
    assert.equal(current, 'CUSTOM\n')
    assert.ok(result.skipped.includes('CLAUDE.md.hbs'))
  })

  await test('overwriteExisting replaces existing files', async () => {
    await writeFile(target, 'CUSTOM\n')
    const result = await copyScaffold(baseDir, {
      skipSpecSite: true,
      overwriteExisting: true,
    })
    const current = await readFile(target, 'utf-8')
    assert.equal(current, original)
    assert.ok(result.overwritten.includes('CLAUDE.md.hbs'))
  })
} finally {
  await rm(baseDir, { recursive: true, force: true })
}

console.log(`\n${'─'.repeat(40)}`)
console.log(`Results: ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)

