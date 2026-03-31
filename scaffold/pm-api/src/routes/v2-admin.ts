import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'
import { hashToken } from '../utils/hash.js'

const app = new Hono<AppEnv>()

// ── Members (from members table) ──

// GET /members — list from members table (primary), with auth_tokens info joined
app.get('/members', async (c) => {
  const { rows } = await queryOrThrow(
    `SELECT m.id, m.display_name, m.email, m.role, m.is_active, m.webhook_url, m.wallet_address, m.created_at, m.updated_at
     FROM members m ORDER BY m.is_active DESC, m.display_name`,
  )
  return c.json({ members: rows })
})

// PATCH /members/:id — update display_name, email, role
app.patch('/members/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ display_name?: string; email?: string; role?: string; webhook_url?: string | null; wallet_address?: string | null }>()
  const sets: string[] = []
  const args: (string | number)[] = []

  if (body.display_name !== undefined) { sets.push('display_name = ?'); args.push(body.display_name) }
  if (body.email !== undefined) { sets.push('email = ?'); args.push(body.email) }
  if (body.role !== undefined) { sets.push('role = ?'); args.push(body.role) }
  if (body.webhook_url !== undefined) { sets.push('webhook_url = ?'); args.push(body.webhook_url ?? '') }
  if (body.wallet_address !== undefined) { sets.push('wallet_address = ?'); args.push(body.wallet_address ?? '') }
  if ((body as any).is_active !== undefined) { sets.push('is_active = ?'); args.push((body as any).is_active ? 1 : 0) }
  if (sets.length === 0) return c.json({ ok: true })

  sets.push('updated_at = CURRENT_TIMESTAMP')
  args.push(id)
  const { rowsAffected } = await executeOrThrow(`UPDATE members SET ${sets.join(', ')} WHERE id = ?`, args)
  return c.json({ ok: true })
})

// ── Auth Tokens (keep existing endpoints working) ──

// POST /members (create auth token — legacy)
app.post('/members', async (c) => {
  const body = await c.req.json<{
    token: string; userName: string; userEmail?: string; ttlDays?: number
  }>()

  // Hash the token before storing (SHA-256 via Web Crypto API)
  const tokenHash = await hashToken(body.token)

  let sql: string
  let args: (string | null)[]

  // Store original token in `token` column (NOT NULL constraint during migration period).
  // token_hash is the authoritative lookup key; plaintext token is kept only as a placeholder.
  // Once all tokens are re-issued, the token column can be dropped.
  if (body.ttlDays) {
    sql = `INSERT INTO auth_tokens (token, token_hash, user_name, user_email, expires_at) VALUES (?, ?, ?, ?, datetime('now', '+' || ? || ' days'))`
    args = [body.token, tokenHash, body.userName, body.userEmail ?? null, String(body.ttlDays)]
  } else {
    sql = 'INSERT INTO auth_tokens (token, token_hash, user_name, user_email) VALUES (?, ?, ?, ?)'
    args = [body.token, tokenHash, body.userName, body.userEmail ?? null]
  }

  const { rowsAffected } = await executeOrThrow(sql, args)

  // Also insert into members table (skip if already exists)
  try {
    await executeOrThrow(
      "INSERT INTO members (display_name, email, role, is_active) VALUES (?, ?, 'member', 1)",
      [body.userName, body.userEmail ?? null],
    )
  } catch {
    // Ignore if already exists
  }

  return c.json({ ok: true }, 201)
})

// PATCH /members/:token/revoke
app.patch('/members/:token/revoke', async (c) => {
  const token = c.req.param('token')
  const { rowsAffected } = await executeOrThrow(
    'UPDATE auth_tokens SET is_active = 0 WHERE token = ?',
    [token],
  )
  return c.json({ ok: true })
})

// PATCH /members/:token/activate
app.patch('/members/:token/activate', async (c) => {
  const token = c.req.param('token')
  const { rowsAffected } = await executeOrThrow(
    'UPDATE auth_tokens SET is_active = 1 WHERE token = ?',
    [token],
  )
  return c.json({ ok: true })
})

// POST /members/:token/regenerate
app.post('/members/:token/regenerate', async (c) => {
  const token = c.req.param('token')
  const body = await c.req.json<{ newToken: string }>()
  const newTokenHash = await hashToken(body.newToken)
  const { rowsAffected } = await executeOrThrow(
    'UPDATE auth_tokens SET token = ?, token_hash = ?, created_at = CURRENT_TIMESTAMP WHERE token = ? OR token_hash = ?',
    [body.newToken, newTokenHash, token, await hashToken(token)],
  )
  return c.json({ ok: true })
})

// DELETE /members/:id — deactivate members + auth_tokens (by numeric ID)
app.delete('/members/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { rows } = await queryOrThrow<{ display_name: string }>('SELECT display_name FROM members WHERE id = ?', [id])
  if (!rows.length) return c.json({ error: 'Member not found' }, 404)
  await executeOrThrow('UPDATE members SET is_active = 0 WHERE id = ?', [id])
  await executeOrThrow('UPDATE auth_tokens SET is_active = 0 WHERE user_name = ?', [rows[0].display_name])
  return c.json({ ok: true })
})

// ── Spec Rules management ──

// DELETE /spec-rules/:pageId/:ruleId
app.delete('/spec-rules/:pageId/:ruleId', async (c) => {
  const pageId = c.req.param('pageId')
  const ruleId = c.req.param('ruleId')
  const { rowsAffected } = await executeOrThrow(
    'DELETE FROM spec_rules WHERE page_id = ? AND id = ?',
    [pageId, ruleId],
  )
  return c.json({ ok: true })
})

// PATCH /spec-areas/:pageId/:areaId — update rule_count etc
app.patch('/spec-areas/:pageId/:areaId', async (c) => {
  const pageId = c.req.param('pageId')
  const areaId = c.req.param('areaId')
  const body = await c.req.json<{ ruleCount?: number; label?: string; shortLabel?: string }>()
  const sets: string[] = []
  const args: (string | number | null)[] = []
  if (body.ruleCount !== undefined) { sets.push('rule_count = ?'); args.push(body.ruleCount) }
  if (body.label !== undefined) { sets.push('label = ?'); args.push(body.label) }
  if (body.shortLabel !== undefined) { sets.push('short_label = ?'); args.push(body.shortLabel) }
  if (sets.length === 0) return c.json({ ok: true })
  args.push(pageId, areaId)
  const { rowsAffected } = await executeOrThrow(`UPDATE spec_areas SET ${sets.join(', ')} WHERE page_id = ? AND area_id = ?`, args)
  return c.json({ ok: true })
})

// ── Settings (key-value) ──
app.get('/settings', async (c) => {
  const { rows } = await queryOrThrow('SELECT key, value FROM settings')
  const obj: Record<string, string> = {}
  for (const r of rows as Array<{ key: string; value: string }>) obj[r.key] = r.value
  return c.json({ settings: obj })
})

app.put('/settings/:key', async (c) => {
  const key = c.req.param('key')
  const body = await c.req.json<{ value?: string | null }>()
  if (!body.value) {
    await executeOrThrow('DELETE FROM settings WHERE key = ?', [key])
  } else {
    await executeOrThrow(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, body.value],
    )
  }
  return c.json({ ok: true })
})

export default app
