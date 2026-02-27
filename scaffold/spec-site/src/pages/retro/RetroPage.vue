<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { useRetro } from '@/composables/useRetro'
import { getActiveSprint } from '@/data/navigation'
import RetroHeader from './RetroHeader.vue'
import RetroBoard from './RetroBoard.vue'
import RetroActions from './RetroActions.vue'

const route = useRoute()
const sprintId = (route.params.sprint as string) || getActiveSprint().id

const { currentUser, setUser, TEAM_MEMBERS } = useUser()
const retro = useRetro(sprintId)

onMounted(async () => {
  await retro.loadOrCreateSession()
  retro.startPolling(currentUser.value ?? '')
})

function handleExport() {
  const md = retro.exportMarkdown()
  if (!md) return
  navigator.clipboard.writeText(md).then(() => {
    alert('Copied to clipboard')
  })
}
</script>

<template>
  <div class="retro-page">
    <RetroHeader
      :session="retro.session.value"
      :sprint-id="sprintId"
      :current-user="currentUser"
      :votes-remaining="retro.votesRemaining.value"
      :team-members="[...TEAM_MEMBERS]"
      @phase-change="retro.setPhase"
      @select-user="setUser"
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
        :current-user="currentUser ?? ''"
        :votes-remaining="retro.votesRemaining.value"
        @add-item="retro.addItem"
        @delete-item="(id) => retro.deleteItem(id, currentUser ?? '')"
        @toggle-vote="(id, hasVoted) => retro.toggleVote(id, currentUser ?? '', hasVoted)"
      />

      <div v-if="retro.session.value?.phase === 'done'" class="retro-done">
        <div class="done-banner">Retro completed</div>
        <RetroBoard
          :keep-items="retro.keepItems.value"
          :problem-items="retro.problemItems.value"
          :try-items="retro.tryItems.value"
          phase="discuss"
          :current-user="currentUser ?? ''"
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
        :team-members="[...TEAM_MEMBERS]"
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
  font-family: var(--font-kr);
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
</style>
