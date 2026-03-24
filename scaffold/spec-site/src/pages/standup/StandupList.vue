<script setup lang="ts">
export interface StandupEntry {
  id: number
  user: string
  done_text: string
  plan_text: string
  blockers: string
  created_at: string
}

defineProps<{
  entries: StandupEntry[]
}>()
</script>

<template>
  <div class="standup-list">
    <h3>Team Standups</h3>

    <div v-if="!entries.length" class="empty-msg">No standups submitted yet today.</div>

    <div v-for="entry in entries" :key="entry.id" class="standup-entry">
      <div class="entry-header">
        <span class="entry-avatar">{{ entry.user.charAt(0).toUpperCase() }}</span>
        <span class="entry-user">{{ entry.user }}</span>
        <span class="entry-time">{{ entry.created_at }}</span>
      </div>

      <div class="entry-section" v-if="entry.done_text">
        <div class="section-label">Done</div>
        <p>{{ entry.done_text }}</p>
      </div>

      <div class="entry-section" v-if="entry.plan_text">
        <div class="section-label">Plan</div>
        <p>{{ entry.plan_text }}</p>
      </div>

      <div class="entry-section entry-blockers" v-if="entry.blockers">
        <div class="section-label">Blockers</div>
        <p>{{ entry.blockers }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.standup-list { margin-top: 24px; }
h3 { font-size: 16px; font-weight: 700; margin: 0 0 16px; }

.empty-msg { font-size: 13px; color: var(--text-muted); padding: 20px 0; }

.standup-entry {
  padding: 16px; background: var(--card-bg); border: 1px solid var(--border-light);
  border-radius: var(--radius); margin-bottom: 12px;
}
.entry-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.entry-avatar {
  width: 28px; height: 28px; border-radius: 50%; background: var(--primary);
  color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.entry-user { font-size: 14px; font-weight: 600; }
.entry-time { margin-left: auto; font-size: 12px; color: var(--text-muted); }

.entry-section { margin-bottom: 8px; }
.entry-section:last-child { margin-bottom: 0; }
.section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 2px; }
.entry-section p { font-size: 13px; line-height: 1.5; margin: 0; }
.entry-blockers .section-label { color: var(--red, #ef4444); }
</style>
