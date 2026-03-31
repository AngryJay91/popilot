/**
 * Memo composable — Page-level notes/memos
 *
 * Always uses localStorage as primary storage.
 * In API mode, also syncs with backend.
 */
import { ref, computed } from 'vue';
import { isStaticMode } from '@/api/client';
export const MEMO_TYPES = [
    { value: 'memo', label: 'Memo', icon: '📝', color: '#3b82f6' },
    { value: 'decision', label: 'Decision', icon: '⚡', color: '#8b5cf6' },
    { value: 'request', label: 'Request', icon: '📋', color: '#f59e0b' },
    { value: 'backlog', label: 'Backlog', icon: '💡', color: '#22c55e' },
    { value: 'blocker', label: 'Blocker', icon: '🚧', color: '#ef4444' },
    { value: 'question', label: 'Question', icon: '❓', color: '#06b6d4' },
    { value: 'announcement', label: 'Announcement', icon: '📢', color: '#6366f1' },
];
export function useMemo(pageId) {
    const STORAGE_KEY = `spec-memo-${pageId}`;
    const memos = ref([]);
    const memoCount = computed(() => memos.value.length);
    const loading = ref(false);
    const error = ref(null);
    // localStorage (sync, immediately available)
    function loadFromLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const items = JSON.parse(raw);
                memos.value = items.map((m) => ({
                    id: m.id,
                    text: m.text,
                    author: m.author ?? '',
                    ts: m.ts,
                }));
            }
        }
        catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to read local memos';
        }
    }
    function saveToLocal() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memos.value));
    }
    async function tryLoadFromApi() {
        if (isStaticMode())
            return;
        try {
            const { apiGet } = await import('@/api/client');
            const r = await apiGet('/api/v2/memos', { pageId });
            if (!r.error && r.data) {
                memos.value = r.data.memos.map((row) => ({
                    id: Number(row.id),
                    text: String(row.content),
                    author: String(row.author),
                    ts: new Date(row.created_at + 'Z').getTime(),
                }));
            }
            else if (r.error) {
                error.value = r.error;
            }
        }
        catch (err) {
            error.value = err instanceof Error ? err.message : 'API load failed';
        }
    }
    async function loadMemos() {
        loading.value = true;
        error.value = null;
        await tryLoadFromApi();
        loading.value = false;
    }
    async function addMemo(text, author) {
        const trimmed = text.trim();
        if (!trimmed)
            return false;
        if (!isStaticMode()) {
            try {
                const { apiPost } = await import('@/api/client');
                const r = await apiPost('/api/v2/memos', { pageId, content: trimmed, author });
                if (!r.error) {
                    await tryLoadFromApi();
                    return true;
                }
                error.value = r.error ?? 'API save failed';
            }
            catch (err) {
                error.value = err instanceof Error ? err.message : 'API save failed';
            }
        }
        // localStorage fallback
        memos.value.unshift({ id: Date.now(), text: trimmed, author, ts: Date.now() });
        saveToLocal();
        return true;
    }
    async function deleteMemo(id) {
        if (!isStaticMode()) {
            try {
                const { apiDelete } = await import('@/api/client');
                const r = await apiDelete(`/api/v2/memos/${id}`);
                if (!r.error) {
                    await tryLoadFromApi();
                    return;
                }
                error.value = r.error ?? 'API delete failed';
            }
            catch (err) {
                error.value = err instanceof Error ? err.message : 'API delete failed';
            }
        }
        memos.value = memos.value.filter((m) => m.id !== id);
        saveToLocal();
    }
    async function clearAll() {
        if (!isStaticMode()) {
            try {
                const { apiDelete } = await import('@/api/client');
                const r = await apiDelete('/api/v2/memos', { pageId });
                if (r.error)
                    error.value = r.error;
            }
            catch (err) {
                error.value = err instanceof Error ? err.message : 'API clear failed';
            }
        }
        memos.value = [];
        saveToLocal();
    }
    function formatTime(ts) {
        const d = new Date(ts);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${mm}/${dd} ${hh}:${mi}`;
    }
    // Immediately load from localStorage (sync), then try API (async)
    loadFromLocal();
    loadMemos();
    return { memos, memoCount, loading, error, addMemo, deleteMemo, clearAll, formatTime, loadMemos };
}
