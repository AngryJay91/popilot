import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppEnv } from './types.js'
import { setAdapter } from './db/adapter.js'
import { TursoAdapter } from './db/turso.js'
import { authMiddleware } from './auth.js'
import mcpRoutes from './mcp.js'
import authRoutes from './routes/auth.js'

import v2NavRoutes from './routes/v2-nav.js'
import v2PageContentRoutes from './routes/v2-page-content.js'
import v2ScenariosRoutes from './routes/v2-scenarios.js'
import v2PmRoutes from './routes/v2-pm.js'
import v2PolicyRoutes from './routes/v2-policy.js'
import v2StandupRoutes from './routes/v2-standup.js'
import v2RetroRoutes from './routes/v2-retro.js'
import v2NotificationsRoutes from './routes/v2-notifications.js'
import v2MemosRoutes from './routes/v2-memos.js'
import v2UserRoutes from './routes/v2-user.js'
import v2AdminRoutes from './routes/v2-admin.js'
import v2DashboardRoutes from './routes/v2-dashboard.js'
import v2KickoffRoutes from './routes/v2-kickoff.js'
import v2InitiativeRoutes from './routes/v2-initiatives.js'
import v2DocsRoutes from './routes/v2-docs.js'
import v2MeetingsRoutes from './routes/v2-meetings.js'
import v2RewardsRoutes from './routes/v2-rewards.js'
import v2ActivityRoutes from './routes/v2-activity.js'
import v2SearchRoutes from './routes/v2-search.js'

const app = new Hono<AppEnv>()

// CORS — origins from env var (comma-separated) or default to localhost
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env.ALLOWED_ORIGINS
      ? c.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
      : ['http://localhost:5173', 'http://localhost:5174']
    return allowed.includes(origin) ? origin : null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// DB error handling
app.onError((err, c) => {
  if (err.name === 'DbError') {
    return c.json({ error: err.message }, 500)
  }
  throw err
})

// Inject DB adapter per request
app.use('*', async (c, next) => {
  setAdapter(new TursoAdapter(c.env.TURSO_URL, c.env.TURSO_AUTH_TOKEN))
  await next()
})

// Public routes (no auth)
app.get('/health', (c) => c.json({ ok: true }))
app.route('/api/auth', authRoutes)

// Auth middleware for /api/* and /mcp
app.use('/api/*', authMiddleware)
app.use('/mcp/*', authMiddleware)

// MCP endpoint
app.route('/mcp', mcpRoutes)

// v2 API routes
app.route('/api/v2/nav', v2NavRoutes)
app.route('/api/v2/page-content', v2PageContentRoutes)
app.route('/api/v2/scenarios', v2ScenariosRoutes)
app.route('/api/v2/pm', v2PmRoutes)
app.route('/api/v2/policy', v2PolicyRoutes)
app.route('/api/v2/standup', v2StandupRoutes)
app.route('/api/v2/retro', v2RetroRoutes)
app.route('/api/v2/notifications', v2NotificationsRoutes)
app.route('/api/v2/memos', v2MemosRoutes)
app.route('/api/v2/user', v2UserRoutes)
app.route('/api/v2/admin', v2AdminRoutes)
app.route('/api/v2/dashboard', v2DashboardRoutes)
app.route('/api/v2/kickoff', v2KickoffRoutes)
app.route('/api/v2/initiatives', v2InitiativeRoutes)
app.route('/api/v2/docs', v2DocsRoutes)
app.route('/api/v2/meetings', v2MeetingsRoutes)
app.route('/api/v2/rewards', v2RewardsRoutes)
app.route('/api/v2/activity', v2ActivityRoutes)
app.route('/api/v2/search', v2SearchRoutes)

// Proactive Nudge (Cron Trigger)
import { handleScheduled } from './nudge.js'
import { isAdmin } from './utils/admin.js'

// Manual nudge trigger — admin only
app.post('/api/v2/dashboard/nudge-trigger', async (c) => {
  const userName = c.get('userName')
  if (!await isAdmin(userName)) {
    return c.json({ error: 'Admin permission required' }, 403)
  }
  const env = {
    TURSO_URL: c.env.TURSO_URL,
    TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
    NUDGE_WEBHOOK_URL: c.env.NUDGE_WEBHOOK_URL,
  }
  await handleScheduled(env)
  return c.json({ ok: true, message: 'Nudge triggered manually' })
})

export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Record<string, string>) => {
    await handleScheduled(env as unknown as { TURSO_URL: string; TURSO_AUTH_TOKEN: string; NUDGE_WEBHOOK_URL?: string })
  },
}
