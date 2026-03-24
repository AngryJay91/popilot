import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { queryOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET / — activity feed
app.get('/', async (c) => {
  const limit = Number(c.req.query('limit') ?? '50')
  const date = c.req.query('date')

  let sql = 'SELECT * FROM activity_log'
  const args: (string | number)[] = []

  if (date) {
    sql += ' WHERE created_at >= ? AND created_at < ?'
    args.push(date, date + 'T23:59:59')
  }

  sql += ' ORDER BY created_at DESC LIMIT ?'
  args.push(limit)

  const { rows } = await queryOrThrow(sql, args)
  return c.json({ activities: rows })
})

export default app
