/**
 * Retro composable — Sprint retrospective board
 *
 * In API mode: full CRUD via REST endpoints
 * In static mode: localStorage-only (offline retro)
 */
import { ref, computed, onUnmounted } from 'vue';
import { apiGet, apiPost, apiPatch, apiDelete, isStaticMode } from '@/api/client';
export const VOTES_PER_PERSON = 5;
const POLL_INTERVAL_MS = 4000;
// ── localStorage fallback for static mode ──
function localKey(sprint) { return `retro_${sprint}`; }
function loadLocal(sprint) {
    try {
        const raw = localStorage.getItem(localKey(sprint));
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
function saveLocal(sprint, data) {
    localStorage.setItem(localKey(sprint), JSON.stringify(data));
}
export function useRetro(sprintId) {
    const session = ref(null);
    const items = ref([]);
    const actions = ref([]);
    const loading = ref(false);
    const error = ref(null);
    // -- Derived --
    const keepItems = computed(() => items.value.filter((i) => i.category === 'keep'));
    const problemItems = computed(() => items.value.filter((i) => i.category === 'problem'));
    const tryItems = computed(() => items.value.filter((i) => i.category === 'try'));
    // -- Session --
    async function loadOrCreateSession() {
        loading.value = true;
        error.value = null;
        if (isStaticMode()) {
            const local = loadLocal(sprintId);
            if (local) {
                session.value = local.session;
                items.value = local.items;
                actions.value = local.actions;
            }
            else {
                const now = new Date().toISOString();
                session.value = {
                    id: Date.now(),
                    sprint: sprintId,
                    title: `${sprintId.toUpperCase()} Retro`,
                    phase: 'write',
                    created_at: now,
                    updated_at: now,
                };
                items.value = [];
                actions.value = [];
                saveLocal(sprintId, { session: session.value, items: [], actions: [] });
            }
            loading.value = false;
            return;
        }
        const { data, error: apiError } = await apiGet(`/api/v2/retro/session`, { sprint: sprintId });
        if (apiError || !data) {
            // Try to create session
            const { data: created, error: createError } = await apiPost('/api/v2/retro/session', {
                sprint: sprintId,
                title: `${sprintId.toUpperCase()} Retro`,
            });
            if (createError || !created) {
                error.value = createError ?? 'Failed to create session';
                loading.value = false;
                return;
            }
            session.value = created.session;
        }
        else {
            session.value = data.session;
        }
        await refresh();
        loading.value = false;
    }
    async function setPhase(phase) {
        if (!session.value)
            return;
        if (isStaticMode()) {
            session.value = { ...session.value, phase };
            saveLocal(sprintId, { session: session.value, items: items.value, actions: actions.value });
            return;
        }
        await apiPatch(`/api/v2/retro/session/${session.value.id}/phase`, { phase });
        session.value = { ...session.value, phase };
    }
    // -- Items --
    async function loadItems(currentUser) {
        if (!session.value)
            return;
        if (isStaticMode())
            return; // items already in memory
        const { data } = await apiGet('/api/v2/retro/items', {
            sessionId: String(session.value.id),
            voter: currentUser,
        });
        if (data)
            items.value = data.items;
    }
    async function addItem(category, content, author) {
        if (!session.value)
            return;
        const trimmed = content.trim();
        if (!trimmed)
            return;
        if (isStaticMode()) {
            const newItem = {
                id: Date.now(),
                session_id: session.value.id,
                category,
                content: trimmed,
                author,
                created_at: new Date().toISOString(),
                voteCount: 0,
                hasVoted: false,
            };
            items.value.push(newItem);
            saveLocal(sprintId, { session: session.value, items: items.value, actions: actions.value });
            return;
        }
        await apiPost('/api/v2/retro/items', {
            sessionId: session.value.id,
            category,
            content: trimmed,
            author,
        });
        await loadItems(author);
    }
    async function deleteItem(itemId, currentUser) {
        if (isStaticMode()) {
            items.value = items.value.filter(i => i.id !== itemId);
            saveLocal(sprintId, { session: session.value, items: items.value, actions: actions.value });
            return;
        }
        await apiDelete(`/api/v2/retro/items/${itemId}`);
        await loadItems(currentUser);
    }
    // -- Votes --
    const myVoteCount = computed(() => items.value.filter((i) => i.hasVoted).length);
    const votesRemaining = computed(() => VOTES_PER_PERSON - myVoteCount.value);
    async function toggleVote(itemId, currentUser, hasVoted) {
        if (!hasVoted && votesRemaining.value <= 0)
            return;
        if (isStaticMode()) {
            items.value = items.value.map(i => {
                if (i.id !== itemId)
                    return i;
                return {
                    ...i,
                    hasVoted: !hasVoted,
                    voteCount: hasVoted ? i.voteCount - 1 : i.voteCount + 1,
                };
            });
            saveLocal(sprintId, { session: session.value, items: items.value, actions: actions.value });
            return;
        }
        await apiPost(`/api/v2/retro/items/${itemId}/vote`, { voter: currentUser, remove: hasVoted });
        await loadItems(currentUser);
    }
    // -- Actions --
    async function loadActions() {
        if (!session.value || isStaticMode())
            return;
        const { data } = await apiGet('/api/v2/retro/actions', {
            sessionId: String(session.value.id),
        });
        if (data)
            actions.value = data.actions;
    }
    async function addAction(content, assignee) {
        if (!session.value)
            return;
        if (isStaticMode()) {
            actions.value.push({
                id: Date.now(),
                session_id: session.value.id,
                content: content.trim(),
                assignee,
                status: 'pending',
                created_at: new Date().toISOString(),
            });
            saveLocal(sprintId, { session: session.value, items: items.value, actions: actions.value });
            return;
        }
        await apiPost('/api/v2/retro/actions', {
            sessionId: session.value.id,
            content: content.trim(),
            assignee,
        });
        await loadActions();
    }
    async function toggleActionStatus(actionId, currentStatus) {
        const next = currentStatus === 'pending' ? 'done' : 'pending';
        if (isStaticMode()) {
            actions.value = actions.value.map(a => a.id === actionId ? { ...a, status: next } : a);
            saveLocal(sprintId, { session: session.value, items: items.value, actions: actions.value });
            return;
        }
        await apiPatch(`/api/v2/retro/actions/${actionId}/status`, { status: next });
        await loadActions();
    }
    // -- Reset --
    async function resetSession() {
        if (!session.value)
            return;
        if (isStaticMode()) {
            localStorage.removeItem(localKey(sprintId));
            session.value = null;
            items.value = [];
            actions.value = [];
            await loadOrCreateSession();
            return;
        }
        await apiDelete(`/api/v2/retro/session/${session.value.id}`);
        session.value = null;
        items.value = [];
        actions.value = [];
        await loadOrCreateSession();
    }
    // -- Export --
    function exportMarkdown() {
        if (!session.value)
            return '';
        const s = session.value;
        const lines = [];
        lines.push(`# ${s.sprint.toUpperCase()} Sprint Retro`);
        lines.push('');
        const cats = [
            { key: 'keep', emoji: '✅', label: 'Keep' },
            { key: 'problem', emoji: '🔴', label: 'Problem' },
            { key: 'try', emoji: '💡', label: 'Try' },
        ];
        for (const cat of cats) {
            const catItems = [...items.value]
                .filter((i) => i.category === cat.key)
                .sort((a, b) => b.voteCount - a.voteCount);
            lines.push(`## ${cat.emoji} ${cat.label}`);
            lines.push('');
            if (catItems.length === 0) {
                lines.push('- (none)');
            }
            else {
                for (const item of catItems) {
                    const votes = item.voteCount > 0 ? ` (${item.voteCount} votes)` : '';
                    lines.push(`- ${item.content}${votes} — _${item.author}_`);
                }
            }
            lines.push('');
        }
        if (actions.value.length > 0) {
            lines.push('## Action Items');
            lines.push('');
            for (const a of actions.value) {
                const check = a.status === 'done' ? '[x]' : '[ ]';
                const assignee = a.assignee ? ` @${a.assignee}` : '';
                lines.push(`- ${check} ${a.content}${assignee}`);
            }
            lines.push('');
        }
        lines.push(`---`);
        lines.push(`_Generated: ${new Date().toLocaleDateString()}_`);
        return lines.join('\n');
    }
    // -- Refresh --
    let _currentUser = '';
    async function refresh() {
        if (!session.value || isStaticMode())
            return;
        const { data } = await apiGet(`/api/v2/retro/session`, {
            sprint: sprintId,
        });
        if (data?.session && data.session.phase !== session.value.phase) {
            session.value = { ...session.value, phase: data.session.phase };
        }
        await loadItems(_currentUser);
        await loadActions();
    }
    // -- Polling --
    let pollTimer = null;
    function startPolling(currentUser) {
        _currentUser = currentUser;
        stopPolling();
        if (!isStaticMode()) {
            pollTimer = setInterval(refresh, POLL_INTERVAL_MS);
        }
    }
    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }
    onUnmounted(stopPolling);
    const participants = computed(() => {
        const authors = new Set(items.value.map(i => i.author));
        return Array.from(authors).sort();
    });
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
        participants,
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
    };
}
