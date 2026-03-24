<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RetroSession, RetroPhase } from '@/composables/useRetro'
import { VOTES_PER_PERSON } from '@/composables/useRetro'

const AUTHOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const props = defineProps<{
  session: RetroSession | null
  sprintId: string
  currentUser: string
  votesRemaining: number
  teamMembers: string[]
  participants: string[]
  itemCount?: number
}>()

const emit = defineEmits<{
  (e: 'phase-change', phase: RetroPhase): void
  (e: 'reset'): void
  (e: 'export'): void
}>()

function authorColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length]
}

const participantList = computed(() =>
  props.participants.map(name => ({
    name,
    initial: name.charAt(0),
    color: authorColor(name),
    isMe: name === props.currentUser,
  }))
)

const PHASE_META: Record<RetroPhase, { label: string; next: string }> = {
  write: { label: 'Writing', next: 'Start Voting' },
  vote: { label: 'Voting', next: 'Start Discussion' },
  discuss: { label: 'Discussing', next: 'Complete' },
  done: { label: 'Done', next: '' },
}

const PHASE_ORDER: RetroPhase[] = ['write', 'vote', 'discuss', 'done']

function prevPhase() {
  if (!props.session) return
  const idx = PHASE_ORDER.indexOf(props.session.phase)
  if (idx > 0) emit('phase-change', PHASE_ORDER[idx - 1])
}

function nextPhase() {
  if (!props.session) return
  // write -> vote: require at least 1 card
  if (props.session.phase === 'write' && (props.itemCount ?? 0) === 0) {
    alert('Add at least one card before starting the vote.')
    return
  }
  const idx = PHASE_ORDER.indexOf(props.session.phase)
  if (idx < PHASE_ORDER.length - 1) emit('phase-change', PHASE_ORDER[idx + 1])
}

function phase(): RetroPhase {
  return props.session?.phase ?? 'write'
}

const menuOpen = ref(false)

function handleReset() {
  menuOpen.value = false
  if (confirm('Reset all retro data for this sprint?')) {
    emit('reset')
  }
}

function handleExport() {
  menuOpen.value = false
  emit('export')
}
</script>

<template>
  <div class="retro-header">
    <div class="rh-left">
      <span class="rh-sprint">{{ sprintId.toUpperCase() }} Retro</span>
      <span class="rh-phase" :data-phase="phase()">
        {{ PHASE_META[phase()].label }}
      </span>
      <span v-if="phase() === 'vote'" class="rh-votes">
        Votes left: <strong>{{ votesRemaining }}</strong>/{{ VOTES_PER_PERSON }}
      </span>
    </div>
    <div class="rh-right">
      <!-- Participants -->
      <div class="rh-participants">
        <div
          v-for="p in participantList"
          :key="p.name"
          class="rh-avatar"
          :class="{ 'rh-avatar--me': p.isMe }"
          :style="{ background: p.color }"
          :title="p.name + (p.isMe ? ' (me)' : '')"
        >
          {{ p.initial }}
        </div>
        <span v-if="participantList.length === 0" class="rh-no-participants">No participants yet</span>
        <span v-else class="rh-participant-count">{{ participantList.length }} joined</span>
      </div>

      <!-- Current user badge -->
      <div v-if="currentUser" class="rh-me-badge">
        <span class="rh-me-dot" :style="{ background: authorColor(currentUser) }" />
        {{ currentUser }}
      </div>

      <!-- Phase controls -->
      <button v-if="phase() !== 'write'" class="rh-prev" @click="prevPhase">
        &larr; Prev
      </button>
      <button v-if="phase() !== 'done'" class="rh-next" :disabled="phase() === 'write' && (itemCount ?? 0) === 0" @click="nextPhase">
        {{ PHASE_META[phase()].next }} &rarr;
      </button>

      <!-- More menu -->
      <div class="rh-menu-wrap">
        <button class="rh-menu-btn" @click.stop="menuOpen = !menuOpen">&#8943;</button>
        <div v-if="menuOpen" class="rh-menu-dropdown">
          <div class="rh-menu-item" @click="handleExport">&#128203; Copy Markdown</div>
          <div class="rh-menu-item rh-menu-danger" @click="handleReset">&#128465; Reset</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.retro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--card-bg);
  flex-shrink: 0;
}

.rh-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rh-sprint {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.rh-phase {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}
.rh-phase[data-phase='write'] { background: var(--blue-bg); color: var(--blue); }
.rh-phase[data-phase='vote'] { background: var(--yellow-bg); color: var(--yellow); }
.rh-phase[data-phase='discuss'] { background: var(--green-bg); color: var(--green); }
.rh-phase[data-phase='done'] { background: var(--border-light); color: var(--text-muted); }

.rh-votes { font-size: 13px; color: var(--text-secondary); }
.rh-votes strong { color: var(--yellow); }

.rh-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* -- Participants -- */
.rh-participants {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rh-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  border: 2px solid transparent;
  transition: transform 0.15s;
}
.rh-avatar:hover { transform: scale(1.15); }
.rh-avatar--me { border-color: var(--primary); box-shadow: 0 0 0 1px #fff; }

.rh-no-participants { font-size: 12px; color: var(--text-muted); }
.rh-participant-count { font-size: 11px; color: var(--text-muted); margin-left: 2px; }

.rh-me-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
.rh-me-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* -- Phase buttons -- */
.rh-prev {
  padding: 6px 12px;
  background: none;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.rh-prev:hover { background: var(--bg); color: var(--text-primary); }

.rh-next {
  padding: 6px 14px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.rh-next:hover { opacity: 0.9; }
.rh-next:disabled { opacity: 0.5; cursor: not-allowed; }

/* -- More menu -- */
.rh-menu-wrap { position: relative; }

.rh-menu-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.rh-menu-btn:hover { background: var(--bg); color: var(--text-primary); }

.rh-menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 150px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  padding: 4px;
  z-index: 100;
}

.rh-menu-item {
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.1s;
  white-space: nowrap;
}
.rh-menu-item:hover { background: var(--bg); color: var(--text-primary); }

.rh-menu-danger { color: var(--red); }
.rh-menu-danger:hover { background: #FFF4F4; color: var(--red); }
</style>
