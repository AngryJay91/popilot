<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet, apiPut } from '@/composables/useTurso'
import { useAuth } from '@/composables/useAuth'

const { authUser } = useAuth()
const settings = ref({ mention: true, story_update: true, pr_review: true, sprint_event: true })
const saved = ref(false)

onMounted(async () => {
  const user = authUser.value
  if (!user) return
  const { data } = await apiGet(`/api/v2/notifications/settings?user=${encodeURIComponent(user)}`)
  if (data?.settings) {
    const s = data.settings as any
    settings.value = { mention: !!s.mention, story_update: !!s.story_update, pr_review: !!s.pr_review, sprint_event: !!s.sprint_event }
  }
})

async function save() {
  const user = authUser.value
  if (!user) return
  await apiPut('/api/v2/notifications/settings', { user, ...settings.value })
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}
</script>

<template>
  <div class="settings-page">
    <h1>Notification Settings</h1>
    <div class="settings-card">
      <label class="setting-row">
        <span>@Mention Notifications</span>
        <input type="checkbox" v-model="settings.mention" />
      </label>
      <label class="setting-row">
        <span>Story Updates</span>
        <input type="checkbox" v-model="settings.story_update" />
      </label>
      <label class="setting-row">
        <span>PR Review Requests</span>
        <input type="checkbox" v-model="settings.pr_review" />
      </label>
      <label class="setting-row">
        <span>Sprint Events</span>
        <input type="checkbox" v-model="settings.sprint_event" />
      </label>
      <button class="btn btn--primary" @click="save">{{ saved ? 'Saved ✓' : 'Save' }}</button>
    </div>
  </div>
</template>

<style scoped>
.settings-page { padding: 24px; max-width: 480px; }
h1 { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
.settings-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.setting-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; cursor: pointer; }
</style>
