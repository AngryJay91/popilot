import { ref, computed } from 'vue'

export interface MemoItem {
  id: number
  text: string
  author: string
  ts: number
}

export function useMemo(pageId: string) {
  const STORAGE_KEY = `spec-memo-${pageId}`
  const memos = ref<MemoItem[]>([])
  const memoCount = computed(() => memos.value.length)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // localStorage (sync, immediately available)
  function loadFromLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const items = JSON.parse(raw) as Array<{ id: number; text: string; ts: number; author?: string }>
        memos.value = items.map((m) => ({
          id: m.id,
          text: m.text,
          author: m.author ?? '',
          ts: m.ts,
        }))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to read local memos'
    }
  }

  function saveToLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memos.value))
  }

  // Turso dynamic load attempt (falls back to localStorage)
  async function tryLoadFromTurso() {
    try {
      const { query } = await import('./useTurso')
      const r = await query<{ id: number; content: string; author: string; created_at: string }>(
        'SELECT id, content, author, created_at FROM memos WHERE page_id = ? ORDER BY created_at DESC',
        [pageId],
      )
      if (!r.error) {
        memos.value = r.rows.map((row) => ({
          id: Number(row.id),
          text: String(row.content),
          author: String(row.author),
          ts: new Date(row.created_at + 'Z').getTime(),
        }))
      } else {
        error.value = r.error
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Turso load failed'
      // Keep localStorage fallback silently in UI behavior
    }
  }

  async function loadMemos() {
    loading.value = true
    error.value = null
    await tryLoadFromTurso()
    loading.value = false
  }

  async function addMemo(text: string, author: string): Promise<boolean> {
    const trimmed = text.trim()
    if (!trimmed) return false

    // Try Turso
    try {
      const { execute } = await import('./useTurso')
      const r = await execute('INSERT INTO memos (page_id, content, author) VALUES (?, ?, ?)', [
        pageId, trimmed, author,
      ])
      if (!r.error) {
        await tryLoadFromTurso()
        return true
      }
      error.value = r.error ?? 'Turso save failed'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Turso save failed'
    }

    // localStorage fallback
    memos.value.unshift({ id: Date.now(), text: trimmed, author, ts: Date.now() })
    saveToLocal()
    return true
  }

  async function deleteMemo(id: number) {
    try {
      const { execute } = await import('./useTurso')
      const r = await execute('DELETE FROM memos WHERE id = ?', [id])
      if (!r.error) {
        await tryLoadFromTurso()
        return
      }
      error.value = r.error ?? 'Turso delete failed'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Turso delete failed'
    }

    memos.value = memos.value.filter((m) => m.id !== id)
    saveToLocal()
  }

  async function clearAll() {
    try {
      const { execute } = await import('./useTurso')
      const r = await execute('DELETE FROM memos WHERE page_id = ?', [pageId])
      if (r.error) error.value = r.error
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Turso clear failed'
    }
    memos.value = []
    saveToLocal()
  }

  function formatTime(ts: number): string {
    const d = new Date(ts)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${mm}/${dd} ${hh}:${mi}`
  }

  // Immediately load from localStorage (sync), then try Turso (async)
  loadFromLocal()
  loadMemos()

  return { memos, memoCount, loading, error, addMemo, deleteMemo, clearAll, formatTime, loadMemos }
}
