import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'
import { isAdmin } from '../utils/admin.js'

const app = new Hono<AppEnv>()

// Admin-only middleware for write APIs
async function requireAdmin(c: any, next: () => Promise<void>) {
  const userName = c.get('userName')
  if (!await isAdmin(userName)) return c.json({ error: 'Admin privileges required' }, 403)
  await next()
}

// GET / — full history (filterable by member)
app.get('/', async (c) => {
  const member = c.req.query('member')
  const status = c.req.query('status')

  let sql = 'SELECT * FROM rewards'
  const conditions: string[] = []
  const args: (string | number)[] = []

  if (member) { conditions.push('member_name = ?'); args.push(member) }
  if (status) { conditions.push('status = ?'); args.push(status) }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY created_at DESC'

  const { rows } = await queryOrThrow(sql, args)
  return c.json({ rewards: rows })
})

// GET /summary — balance summary by member
app.get('/summary', async (c) => {
  const { rows } = await queryOrThrow(
    `SELECT member_name,
       SUM(CASE WHEN type = 'reward' THEN amount ELSE 0 END) as total_rewards,
       SUM(CASE WHEN type = 'penalty' THEN amount ELSE 0 END) as total_penalties,
       SUM(CASE WHEN type = 'reward' THEN amount ELSE -amount END) as balance,
       SUM(CASE WHEN status = 'pending' AND type = 'reward' THEN amount WHEN status = 'pending' AND type = 'penalty' THEN -amount ELSE 0 END) as pending_balance
     FROM rewards GROUP BY member_name ORDER BY member_name`,
  )
  return c.json({ summary: rows })
})

// POST / — register reward/penalty
app.post('/', requireAdmin, async (c) => {
  const body = await c.req.json<{
    memberName: string
    type: 'reward' | 'penalty'
    amount: number
    reason: string
    issuedBy?: string
  }>()

  const issuedBy = body.issuedBy || c.get('userName') || 'system'

  await executeOrThrow(
    `INSERT INTO rewards (member_name, type, amount, reason, status, issued_by)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [body.memberName, body.type, body.amount, body.reason, issuedBy],
  )
  return c.json({ ok: true }, 201)
})

// PATCH /:id/pay — pending -> paid transition
app.patch('/:id/pay', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ txHash?: string }>()

  await executeOrThrow(
    `UPDATE rewards SET status = 'paid', tx_hash = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`,
    [body.txHash ?? null, id],
  )
  return c.json({ ok: true })
})

// PATCH /batch-pay — batch pay all pending for a member
app.patch('/batch-pay', requireAdmin, async (c) => {
  const body = await c.req.json<{ memberName: string; txHash?: string }>()

  const { rowsAffected } = await executeOrThrow(
    `UPDATE rewards SET status = 'paid', tx_hash = ?, paid_at = CURRENT_TIMESTAMP WHERE member_name = ? AND status = 'pending'`,
    [body.txHash ?? null, body.memberName],
  )
  return c.json({ ok: true, paidCount: rowsAffected })
})

// DELETE /:id — delete (admin)
app.delete('/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  await executeOrThrow('DELETE FROM rewards WHERE id = ?', [id])
  return c.json({ ok: true })
})

// GET /wallets — bulk wallet balance query via blockchain adapter
app.get('/wallets', async (c) => {
  const { rows: members } = await queryOrThrow<{ display_name: string; wallet_address: string | null }>(
    "SELECT display_name, wallet_address FROM members WHERE is_active = 1 AND wallet_address IS NOT NULL AND wallet_address != ''",
  )

  const { getBlockchainAdapter } = await import('../blockchain/adapter.js')
  const blockchain = getBlockchainAdapter()

  const wallets = await Promise.all(members.map(async (m) => {
    try {
      const balance = await blockchain.getBalance(m.wallet_address!)
      return { name: m.display_name, address: m.wallet_address, ...balance }
    } catch {
      return { name: m.display_name, address: m.wallet_address, native: 0, token: 0 }
    }
  }))

  return c.json({ wallets })
})

// GET /onchain/:address — on-chain balance query via blockchain adapter
app.get('/onchain/:address', async (c) => {
  const address = c.req.param('address')

  try {
    const { getBlockchainAdapter } = await import('../blockchain/adapter.js')
    const blockchain = getBlockchainAdapter()
    const balance = await blockchain.getBalance(address)
    return c.json({ address, ...balance })
  } catch (e) {
    return c.json({ address, native: 0, token: 0, error: 'Blockchain query failed' })
  }
})

export default app
