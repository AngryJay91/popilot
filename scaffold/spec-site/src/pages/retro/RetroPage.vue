<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { useRetro } from '@/composables/useRetro'
import { useConfirm } from '@/composables/useConfirm'
import { getActiveSprint } from '@/composables/useNavStore'
import { apiPost } from '@/api/client'
import RetroHeader from './RetroHeader.vue'
import RetroBoard from './RetroBoard.vue'
import RetroActions from './RetroActions.vue'

const route = useRoute()
const router = useRouter()
const { showAlert } = useConfirm()
const sprintId = (route.params.sprint as string) || getActiveSprint().id

async function completeAndKickoff() {
  await apiPost(`/api/v2/retro/${sprintId}/complete`, {})
  router.push('/kickoff/new')
}

const { currentUser, dynamicMembers, loadMembers } = useUser()
const retro = useRetro(sprintId)

const userName = computed(() => currentUser.value ?? localStorage.getItem('retro-user-name') ?? '')

onMounted(async () => {
  loadMembers()
  await retro.loadOrCreateSession()
  retro.startPolling(userName.value)
})

function handleExport() {
  const md = retro.exportMarkdown()
  if (!md) return
  navigator.clipboard.writeText(md).then(async () => {
    await showAlert('Copied to clipboard')
  })
}
</script>

<template>
  <div class="retro-page">
    <RetroHeader
      :session="retro.session.value"
      :sprint-id="sprintId"
      :current-user="userName"
      :votes-remaining="retro.votesRemaining.value"
      :team-members="dynamicMembers"
      :participants="retro.participants.value"
      :item-count="retro.items.value.length"
      @phase-change="retro.setPhase"
      @reset="retro.resetSession"
      @export="handleExport"
    />

    <div v-if="retro.loading.value" class="retro-loading">
      <div class="loading-spinner" />
      <span>Loading...</span>
    </div>

    <div v-else-if="retro.error.value" class="retro-error">
      <div class="error-icon">&#9888;</div>
      <div class="error-msg">Connection error: {{ retro.error.value }}</div>
      <button class="error-retry" @click="retro.loadOrCreateSession()">Retry</button>
    </div>

    <template v-else>
      <RetroBoard
        v-if="retro.session.value && retro.session.value.phase !== 'done'"
        :keep-items="retro.keepItems.value"
        :problem-items="retro.problemItems.value"
        :try-items="retro.tryItems.value"
        :phase="retro.session.value.phase"
        :current-user="userName"
        :votes-remaining="retro.votesRemaining.value"
        @add-item="retro.addItem"
        @delete-item="(id) => retro.deleteItem(id, userName)"
        @toggle-vote="(id, hasVoted) => retro.toggleVote(id, userName, hasVoted)"
      />

      <div v-if="retro.session.value?.phase === 'done'" class="retro-done">
        <div class="done-banner">
          Retrospective completed
          <div class="done-actions">
            <button class="btn btn--primary" @click="completeAndKickoff">
              Next Sprint Kickoff &rarr;
            </button>
          </div>
        </div>
        <RetroBoard
          :keep-items="retro.keepItems.value"
          :problem-items="retro.problemItems.value"
          :try-items="retro.tryItems.value"
          phase="discuss"
          :current-user="userName"
          :votes-remaining="0"
          @add-item="() => {}"
          @delete-item="() => {}"
          @toggle-vote="() => {}"
        />
      </div>

      <RetroActions
        v-if="
          retro.session.value?.phase === 'discuss' ||
          retro.session.value?.phase === 'done'
        "
        :actions="retro.actions.value"
        :team-members="dynamicMembers"
        :readonly="retro.session.value?.phase === 'done'"
        @add-action="retro.addAction"
        @toggle-status="retro.toggleActionStatus"
      />
    </template>
  </div>
</template>

<style scoped>
.retro-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}

/* -- Loading -- */
.retro-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* -- Error -- */
.retro-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.error-icon { font-size: 32px; }
.error-msg { font-size: 14px; color: var(--red); }
.error-retry {
  margin-top: 8px;
  padding: 8px 20px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* -- Done -- */
.retro-done {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.done-banner {
  text-align: center;
  padding: 10px;
  background: var(--green-bg);
  color: var(--green);
  font-weight: 700;
  font-size: 14px;
  border-bottom: 1px solid var(--green-border);
}
.done-actions {
  margin-top: 8px;
}
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn--primary {
  background: var(--primary);
  color: #fff;
}
.btn--primary:hover { opacity: 0.9; }
</style>
