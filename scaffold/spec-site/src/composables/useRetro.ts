import { ref, computed, onUnmounted } from 'vue'
import { query, execute } from './useTurso'

export type RetroPhase = 'write' | 'vote' | 'discuss' | 'done'
export type RetroCategory = 'keep' | 'problem' | 'try'

export interface RetroSession {
  id: number
  sprint: string
  title: string | null
  phase: RetroPhase
  created_at: string
  updated_at: string
}

export interface RetroItem {
  id: number
  session_id: number
  category: RetroCategory
  content: string
  author: string
  created_at: string
  voteCount: number
  hasVoted: boolean
}

export interface RetroAction {
  id: number
  session_id: number
  content: string
  assignee: string | null
  status: 'pending' | 'done'
  created_at: string
}

export const VOTES_PER_PERSON = 5
const POLL_INTERVAL_MS = 4000

export function useRetro(sprintId: string) {
  const session = ref<RetroSession | null>(null)
  const items = ref<RetroItem[]>([])
  const actions = ref<RetroAction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // -- Derived --
  const keepItems = computed(() => items.value.filter((i) => i.category === 'keep'))
  const problemItems = computed(() => items.value.filter((i) => i.category === 'problem'))
  const tryItems = computed(() => items.value.filter((i) => i.category === 'try'))

  // -- Session --
  async function loadOrCreateSession() {
    loading.value = true
    error.value = null

    const r = await query<RetroSession>(
      'SELECT * FROM retro_sessions WHERE sprint = ? LIMIT 1',
      [sprintId],
    )
    if (r.error) {
      error.value = r.error
      loading.value = false
      return
    }

    if (r.rows.length > 0) {
      session.value = r.rows[0]
    } else {
      const ins = await execute(
        'INSERT INTO retro_sessions (sprint, title) VALUES (?, ?)',
        [sprintId, `${sprintId.toUpperCase()} Retro`],
      )
      if (ins.error) {
        error.value = ins.error
        loading.value = false
        return
      }
      const r2 = await query<RetroSession>(
        'SELECT * FROM retro_sessions WHERE sprint = ? LIMIT 1',
        [sprintId],
      )
      session.value = r2.rows[0] ?? null
    }

    await refresh()
    loading.value = false
  }

  async function setPhase(phase: RetroPhase) {
    if (!session.value) return
    await execute(
      "UPDATE retro_sessions SET phase = ?, updated_at = datetime('now') WHERE id = ?",
      [phase, session.value.id],
    )
    session.value = { ...session.value, phase }
  }

  // -- Items --
  async function loadItems(currentUser: string) {
    if (!session.value) return
    const r = await query<Record<string, unknown>>(
      `SELECT i.*,
        COUNT(v.voter) as voteCount,
        MAX(CASE WHEN v.voter = ? THEN 1 ELSE 0 END) as hasVoted
       FROM retro_items i
       LEFT JOIN retro_votes v ON v.item_id = i.id
       WHERE i.session_id = ?
       GROUP BY i.id
       ORDER BY i.created_at ASC`,
      [currentUser, session.value.id],
    )
    if (!r.error) {
      items.value = r.rows.map((row) => ({
        id: Number(row.id),
        session_id: Number(row.session_id),
        category: row.category as RetroCategory,
        content: row.content as string,
        author: row.author as string,
        created_at: row.created_at as string,
        voteCount: Number(row.voteCount),
        hasVoted: Boolean(Number(row.hasVoted)),
      }))
    }
  }

  async function addItem(category: RetroCategory, content: string, author: string) {
    if (!session.value) return
    const trimmed = content.trim()
    if (!trimmed) return
    await execute(
      'INSERT INTO retro_items (session_id, category, content, author) VALUES (?, ?, ?, ?)',
      [session.value.id, category, trimmed, author],
    )
    await loadItems(author)
  }

  async function deleteItem(itemId: number, currentUser: string) {
    await execute('DELETE FROM retro_votes WHERE item_id = ?', [itemId])
    await execute('DELETE FROM retro_items WHERE id = ?', [itemId])
    await loadItems(currentUser)
  }

  // -- Votes --
  const myVoteCount = computed(() => items.value.filter((i) => i.hasVoted).length)
  const votesRemaining = computed(() => VOTES_PER_PERSON - myVoteCount.value)

  async function toggleVote(itemId: number, currentUser: string, hasVoted: boolean) {
    if (!hasVoted && votesRemaining.value <= 0) return
    if (hasVoted) {
      await execute('DELETE FROM retro_votes WHERE item_id = ? AND voter = ?', [
        itemId,
        currentUser,
      ])
    } else {
      await execute('INSERT OR IGNORE INTO retro_votes (item_id, voter) VALUES (?, ?)', [
        itemId,
        currentUser,
      ])
    }
    await loadItems(currentUser)
  }

  // -- Actions --
  async function loadActions() {
    if (!session.value) return
    const r = await query<RetroAction>(
      'SELECT * FROM retro_actions WHERE session_id = ? ORDER BY created_at ASC',
      [session.value.id],
    )
    if (!r.error) actions.value = r.rows
  }

  async function addAction(content: string, assignee: string | null) {
    if (!session.value) return
    await execute(
      'INSERT INTO retro_actions (session_id, content, assignee) VALUES (?, ?, ?)',
      [session.value.id, content.trim(), assignee],
    )
    await loadActions()
  }

  async function toggleActionStatus(actionId: number, currentStatus: 'pending' | 'done') {
    const next = currentStatus === 'pending' ? 'done' : 'pending'
    await execute('UPDATE retro_actions SET status = ? WHERE id = ?', [next, actionId])
    await loadActions()
  }

  // -- Reset --
  async function resetSession() {
    if (!session.value) return
    const sid = session.value.id
    await execute(
      'DELETE FROM retro_votes WHERE item_id IN (SELECT id FROM retro_items WHERE session_id = ?)',
      [sid],
    )
    await execute('DELETE FROM retro_actions WHERE session_id = ?', [sid])
    await execute('DELETE FROM retro_items WHERE session_id = ?', [sid])
    await execute('DELETE FROM retro_sessions WHERE id = ?', [sid])
    session.value = null
    items.value = []
    actions.value = []
    await loadOrCreateSession()
  }

  // -- Export --
  function exportMarkdown(): string {
    if (!session.value) return ''
    const s = session.value
    const lines: string[] = []

    lines.push(`# ${s.sprint.toUpperCase()} Sprint Retro`)
    lines.push('')

    const cats: { key: RetroCategory; emoji: string; label: string }[] = [
      { key: 'keep', emoji: '✅', label: 'Keep' },
      { key: 'problem', emoji: '🔴', label: 'Problem' },
      { key: 'try', emoji: '💡', label: 'Try' },
    ]

    for (const cat of cats) {
      const catItems = [...items.value]
        .filter((i) => i.category === cat.key)
        .sort((a, b) => b.voteCount - a.voteCount)

      lines.push(`## ${cat.emoji} ${cat.label}`)
      lines.push('')
      if (catItems.length === 0) {
        lines.push('- (none)')
      } else {
        for (const item of catItems) {
          const votes = item.voteCount > 0 ? ` (👍 ${item.voteCount})` : ''
          lines.push(`- ${item.content}${votes} — _${item.author}_`)
        }
      }
      lines.push('')
    }

    if (actions.value.length > 0) {
      lines.push('## 📋 Action Items')
      lines.push('')
      for (const a of actions.value) {
        const check = a.status === 'done' ? '✅' : '⬜'
        const assignee = a.assignee ? ` @${a.assignee}` : ''
        lines.push(`- ${check} ${a.content}${assignee}`)
      }
      lines.push('')
    }

    lines.push(`---`)
    lines.push(`_Generated: ${new Date().toLocaleDateString()}_`)

    return lines.join('\n')
  }

  // -- Refresh (items + actions + session phase) --
  let _currentUser = ''

  async function refresh() {
    if (!session.value) return
    const r = await query<{ phase: string }>(
      'SELECT phase FROM retro_sessions WHERE id = ?',
      [session.value.id],
    )
    if (r.rows[0] && r.rows[0].phase !== session.value.phase) {
      session.value = { ...session.value, phase: r.rows[0].phase as RetroPhase }
    }
    await loadItems(_currentUser)
    await loadActions()
  }

  // -- Polling --
  let pollTimer: ReturnType<typeof setInterval> | null = null

  function startPolling(currentUser: string) {
    _currentUser = currentUser
    stopPolling()
    pollTimer = setInterval(refresh, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onUnmounted(stopPolling)

  return {
    session,
    items,
    actions,
    loading,
    error,
    keepItems,
    problemItems,
    tryItems,
    myVoteCount,
    votesRemaining,
    loadOrCreateSession,
    setPhase,
    addItem,
    deleteItem,
    toggleVote,
    addAction,
    toggleActionStatus,
    resetSession,
    exportMarkdown,
    startPolling,
    stopPolling,
    refresh,
  }
}
