<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet, apiPost, apiPatch, isStaticMode } from '@/api/client'
import MemberSelect from '@/components/MemberSelect.vue'

interface Meeting { id: number; title: string; date: string; participants: string | null; created_by: string }

const meetings = ref<Meeting[]>([])
const meetingsLoading = ref(true)
const showCreate = ref(false)
const form = ref({ title: '', date: new Date().toISOString().split('T')[0], rawTranscript: '' })
const selectedParticipants = ref<string[]>([])
const selectedMeeting = ref<Record<string, unknown> | null>(null)

const structurizing = ref(false)
const uploading = ref(false)

const editSummary = ref('')
const editAgenda = ref('')
const editDecisions = ref('')
const editActionItems = ref('')

async function loadMeetings() {
  if (isStaticMode()) { meetingsLoading.value = false; return }
  meetingsLoading.value = true
  const { data } = await apiGet<{ meetings: Meeting[] }>('/api/v2/meetings')
  if (data?.meetings) meetings.value = data.meetings
  meetingsLoading.value = false
}

async function createMeeting() {
  await apiPost('/api/v2/meetings', {
    ...form.value,
    participants: selectedParticipants.value.join(', ') || null,
  })
  form.value = { title: '', date: new Date().toISOString().split('T')[0], rawTranscript: '' }
  selectedParticipants.value = []
  showCreate.value = false
  await loadMeetings()
}

async function viewMeeting(id: number) {
  const { data } = await apiGet<{ meeting: Record<string, unknown> }>(`/api/v2/meetings/${id}`)
  if (data?.meeting) {
    selectedMeeting.value = data.meeting
    editSummary.value = (data.meeting.summary as string) ?? ''
    editAgenda.value = (data.meeting.agenda as string) ?? ''
    editDecisions.value = (data.meeting.decisions as string) ?? ''
    editActionItems.value = (data.meeting.action_items as string) ?? ''
  }
}

async function saveMeetingEdits() {
  if (!selectedMeeting.value) return
  await apiPatch(`/api/v2/meetings/${selectedMeeting.value.id}`, {
    summary: editSummary.value || null,
    agenda: editAgenda.value || null,
    decisions: editDecisions.value || null,
    actionItems: editActionItems.value || null,
  })
  await viewMeeting(selectedMeeting.value.id as number)
}

async function uploadAudio(e: Event, meetingId: number) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 25 * 1024 * 1024) { alert('File size exceeds 25MB limit'); return }

  uploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  const url = import.meta.env.VITE_API_URL as string
  const token = localStorage.getItem('spec-auth-token') || ''
  const res = await fetch(`${url}/api/v2/meetings/${meetingId}/transcribe`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  })
  const data = await res.json()
  uploading.value = false
  input.value = ''

  if (data.error) { alert(data.error); return }
  alert('Transcription complete')
  await viewMeeting(meetingId)
}

async function structurize(id: number) {
  if (!selectedMeeting.value?.raw_transcript) { alert('No transcript available'); return }

  const { data: settingsData } = await apiGet<{ settings: Record<string, string> }>('/api/v2/admin/settings')
  const settings = settingsData?.settings ?? {}
  const apiKey = settings.llm_api_key
  if (!apiKey) { alert('Please set an API key in /admin settings'); return }

  const provider = settings.llm_provider ?? (apiKey.startsWith('sk-ant') ? 'anthropic' : apiKey.startsWith('AI') ? 'gemini' : 'openai')
  const model = settings.llm_model ?? (provider === 'openai' ? 'gpt-4o-mini' : provider === 'gemini' ? 'gemini-2.0-flash' : 'claude-sonnet-4-20250514')
  const transcript = selectedMeeting.value.raw_transcript as string

  const systemPrompt = `You are an expert at structuring meeting transcripts.
Analyze the transcript below and return a JSON object:
{
  "summary": "One-line summary",
  "agenda": "Agenda items (newline-separated)",
  "decisions": "Decisions made (newline-separated)",
  "action_items": "Action items (newline-separated, include assignee on each line)"
}
Return only JSON.`

  structurizing.value = true
  try {
    let result: { summary?: string; agenda?: string; decisions?: string; action_items?: string }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: transcript }],
          response_format: { type: 'json_object' },
        }),
      })
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
      result = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    } else if (provider === 'gemini') {
      const geminiModel = model || 'gemini-2.0-flash'
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${transcript}` }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        },
      )
      const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
      const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
      const gMatch = geminiText.match(/\{[\s\S]*\}/)
      result = JSON.parse(gMatch?.[0] ?? '{}')
    } else {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model, max_tokens: 4096, system: systemPrompt,
          messages: [{ role: 'user', content: transcript }],
        }),
      })
      const data = await res.json() as { content?: Array<{ text?: string }> }
      const text = data.content?.[0]?.text ?? '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch?.[0] ?? '{}')
    }

    editSummary.value = result.summary ?? ''
    editAgenda.value = result.agenda ?? ''
    editDecisions.value = result.decisions ?? ''
    editActionItems.value = result.action_items ?? ''
    await saveMeetingEdits()
    await viewMeeting(id)
  } catch (e) {
    alert(`AI structuring failed: ${String(e)}`)
  } finally { structurizing.value = false }
}

async function createTasks(id: number) {
  const { data } = await apiPost(`/api/v2/meetings/${id}/create-tasks`, {})
  if (data) alert(`${(data as any).created} tasks created`)
}

onMounted(loadMeetings)
</script>

<template>
  <div class="meetings-page">
    <div class="meetings-header">
      <h1>Meeting Notes</h1>
      <button class="btn btn--primary" @click="showCreate = !showCreate">+ New Meeting</button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="create-form glass-card">
      <input v-model="form.title" class="form-input" placeholder="Meeting title" />
      <input v-model="form.date" type="date" class="form-input" />
      <div class="participants-select">
        <span class="participants-label">Participants:</span>
        <MemberSelect v-model="selectedParticipants" />
      </div>
      <textarea v-model="form.rawTranscript" class="form-textarea" placeholder="Paste transcript here..." rows="8"></textarea>
      <button class="btn btn--primary" @click="createMeeting">Save</button>
    </div>

    <!-- List -->
    <div class="meetings-list">
      <div v-for="m in meetings" :key="m.id" class="meeting-card glass-card" @click="viewMeeting(m.id)">
        <div class="meeting-title">{{ m.title }}</div>
        <div class="meeting-meta">
          <span>{{ m.date }}</span>
          <span v-if="m.participants">{{ m.participants }}</span>
          <span>{{ m.created_by }}</span>
        </div>
      </div>
      <div v-if="meetingsLoading" class="empty">Loading...</div>
      <div v-else-if="!meetings.length" class="empty">No meeting notes yet. Create one to get started.</div>
    </div>

    <!-- Detail -->
    <div v-if="selectedMeeting" class="meeting-detail glass-card">
      <div class="detail-header">
        <h2>{{ selectedMeeting.title }}</h2>
        <button class="btn btn--sm" @click="selectedMeeting = null">Close</button>
      </div>
      <div class="detail-meta">{{ selectedMeeting.date }} | {{ selectedMeeting.participants }}</div>

      <!-- Structured results (editable) -->
      <div class="detail-section">
        <h3>Summary</h3>
        <textarea v-model="editSummary" class="edit-textarea" rows="2" placeholder="Meeting summary"></textarea>
      </div>
      <div class="detail-section">
        <h3>Agenda</h3>
        <textarea v-model="editAgenda" class="edit-textarea" rows="3" placeholder="Agenda items (one per line)"></textarea>
      </div>
      <div class="detail-section">
        <h3>Decisions</h3>
        <textarea v-model="editDecisions" class="edit-textarea" rows="3" placeholder="Decisions (one per line)"></textarea>
      </div>
      <div class="detail-section">
        <h3>Action Items</h3>
        <textarea v-model="editActionItems" class="edit-textarea" rows="3" placeholder="Action items (one per line, include assignee)"></textarea>
        <button v-if="editActionItems" class="btn btn--sm btn--primary" @click="createTasks(selectedMeeting.id as number)">Auto-create Tasks</button>
      </div>

      <div class="detail-actions">
        <button class="btn btn--primary" @click="saveMeetingEdits">Save</button>
        <label class="btn btn--sm upload-btn">
          Upload Audio
          <input type="file" accept=".mp3,.wav,.m4a,.webm,.ogg" hidden @change="uploadAudio($event, selectedMeeting.id as number)" />
        </label>
        <span v-if="uploading" class="upload-status">Transcribing...</span>
        <button v-if="selectedMeeting.raw_transcript" class="btn btn--sm" :disabled="structurizing" @click="structurize(selectedMeeting.id as number)">
          {{ structurizing ? 'AI Structuring...' : 'AI Structure' }}
        </button>
      </div>

      <div v-if="selectedMeeting.raw_transcript" class="detail-section">
        <h3>Transcript</h3>
        <pre class="transcript">{{ selectedMeeting.raw_transcript }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meetings-page { max-width: 800px; margin: 0 auto; padding: 24px; min-height: 100vh; }
.meetings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.meetings-header h1 { font-size: 22px; font-weight: 700; }
.create-form { padding: 20px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.form-input { padding: 8px 12px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; font-size: 14px; }
.form-textarea { padding: 8px 12px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; font-size: 13px; font-family: monospace; resize: vertical; }
.meetings-list { display: flex; flex-direction: column; gap: 8px; }
.meeting-card { padding: 16px; cursor: pointer; }
.meeting-card:hover { transform: translateY(-1px); }
.meeting-title { font-size: 15px; font-weight: 600; }
.meeting-meta { font-size: 12px; color: var(--text-secondary); display: flex; gap: 12px; margin-top: 4px; }
.meeting-detail { padding: 24px; margin-top: 20px; }
.detail-header { display: flex; justify-content: space-between; align-items: center; }
.detail-header h2 { font-size: 18px; }
.detail-meta { font-size: 13px; color: var(--text-secondary); margin: 8px 0 16px; }
.detail-section { margin-bottom: 16px; }
.detail-section h3 { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.detail-section pre { font-size: 13px; white-space: pre-wrap; line-height: 1.6; }
.transcript { max-height: 300px; overflow-y: auto; background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; }
.empty { color: var(--text-muted); padding: 20px; text-align: center; }
.edit-textarea { width: 100%; padding: 8px 12px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; font-size: 13px; resize: vertical; font-family: inherit; }
.detail-actions { display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap; }
.participants-select { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.participants-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; flex-shrink: 0; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn--primary { background: var(--primary); color: #fff; }
.btn--sm { padding: 4px 10px; font-size: 12px; }
.glass-card {
  background: rgba(255,255,255,0.25); backdrop-filter: blur(40px) saturate(1.8);
  border: 1px solid rgba(255,255,255,0.45); border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5);
}
.upload-btn { cursor: pointer; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.upload-status { font-size: 12px; color: #f59e0b; }
</style>
