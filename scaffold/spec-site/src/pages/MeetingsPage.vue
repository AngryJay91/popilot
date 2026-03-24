<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet } from '@/api/client'

interface Meeting {
  id: number
  title: string
  date: string
  time: string
  attendees: string[]
  notes: string | null
  status: 'upcoming' | 'completed'
}

interface MeetingsData {
  meetings: Meeting[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const meetings = ref<Meeting[]>([])
const expandedId = ref<number | null>(null)

function toggleNotes(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

onMounted(async () => {
  const { data, error: err } = await apiGet<MeetingsData>('/api/v2/meetings')
  if (err) {
    error.value = err
  } else if (data) {
    meetings.value = data.meetings
  }
  loading.value = false
})
</script>

<template>
  <div class="meetings-page">
    <h1>Meetings</h1>
    <p class="page-desc">Upcoming and past meetings with notes.</p>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading meetings...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">&#9888;</div>
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <div v-if="!meetings.length" class="empty-msg">No meetings scheduled.</div>

      <div v-for="m in meetings" :key="m.id" class="meeting-card" :class="m.status">
        <div class="meeting-header" @click="toggleNotes(m.id)">
          <div class="meeting-info">
            <div class="meeting-title">{{ m.title }}</div>
            <div class="meeting-datetime">
              <span class="meeting-date">{{ m.date }}</span>
              <span class="meeting-time">{{ m.time }}</span>
            </div>
          </div>
          <div class="meeting-right">
            <span class="meeting-status" :class="'status-' + m.status">
              {{ m.status === 'upcoming' ? 'Upcoming' : 'Completed' }}
            </span>
            <span class="toggle-icon">{{ expandedId === m.id ? '&#9650;' : '&#9660;' }}</span>
          </div>
        </div>

        <div class="meeting-attendees">
          <span v-for="a in m.attendees" :key="a" class="attendee-chip">{{ a }}</span>
        </div>

        <div v-if="expandedId === m.id && m.notes" class="meeting-notes">
          <div class="notes-label">Notes</div>
          <p>{{ m.notes }}</p>
        </div>
        <div v-if="expandedId === m.id && !m.notes" class="meeting-notes">
          <p class="no-notes">No notes recorded.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.meetings-page { padding: 32px 40px; max-width: 720px; margin: 0 auto; }
h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.page-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }

.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0; gap: 12px; color: var(--text-muted);
}
.loading-spinner {
  width: 28px; height: 28px; border: 3px solid var(--border);
  border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 32px; }
.error-state p { color: var(--red); font-size: 14px; }
.empty-msg { font-size: 13px; color: var(--text-muted); padding: 40px 0; text-align: center; }

.meeting-card {
  background: var(--card-bg); border: 1px solid var(--border-light);
  border-radius: var(--radius); margin-bottom: 12px; overflow: hidden;
}
.meeting-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; cursor: pointer;
}
.meeting-header:hover { background: var(--bg); }
.meeting-info { flex: 1; min-width: 0; }
.meeting-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.meeting-datetime { display: flex; gap: 12px; font-size: 13px; color: var(--text-secondary); }
.meeting-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.meeting-status {
  font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px;
  text-transform: uppercase;
}
.status-upcoming { background: rgba(59,130,246,0.1); color: #3b82f6; }
.status-completed { background: rgba(34,197,94,0.1); color: #22c55e; }
.toggle-icon { font-size: 10px; color: var(--text-muted); }

.meeting-attendees {
  padding: 0 20px 12px; display: flex; flex-wrap: wrap; gap: 4px;
}
.attendee-chip {
  font-size: 11px; padding: 2px 8px; background: var(--border-light);
  border-radius: 10px; color: var(--text-secondary);
}

.meeting-notes {
  padding: 12px 20px 16px; border-top: 1px solid var(--border-light);
}
.notes-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  color: var(--text-muted); margin-bottom: 6px;
}
.meeting-notes p { font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap; }
.no-notes { color: var(--text-muted); font-style: italic; }
</style>
