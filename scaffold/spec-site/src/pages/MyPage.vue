<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiGet, apiPatch, isStaticMode } from '@/api/client'
import { useAuth } from '@/composables/useAuth'

const { authUser, isAuthenticated } = useAuth()

const token = computed(() => localStorage.getItem('spec-auth-token') || '')
const maskedToken = computed(() => token.value ? `${token.value.substring(0, 8)}...${token.value.substring(token.value.length - 4)}` : '')
const showFullToken = ref(false)

const copiedId = ref<string | null>(null)

// Webhook URL
const webhookUrl = ref('')
const savingWebhook = ref(false)
const webhookSaved = ref(false)

async function loadWebhookUrl() {
  if (isStaticMode()) return
  try {
    const { data } = await apiGet<{ members: Array<{ webhook_url: string | null; display_name: string }> }>('/api/v2/admin/members')
    if (data?.members) {
      const me = data.members.find(m => m.display_name === authUser.value)
      if (me?.webhook_url) webhookUrl.value = me.webhook_url
    }
  } catch (_) { /* ignore */ }
}

async function saveWebhookUrl() {
  savingWebhook.value = true
  webhookSaved.value = false
  try {
    const { data } = await apiGet<{ members: Array<{ id: number; display_name: string }> }>('/api/v2/admin/members')
    const me = data?.members?.find(m => m.display_name === authUser.value)
    if (me) {
      await apiPatch(`/api/v2/admin/members/${me.id}`, { webhook_url: webhookUrl.value || null })
      webhookSaved.value = true
      setTimeout(() => { webhookSaved.value = false }, 3000)
    }
  } catch (_) { /* ignore */ }
  savingWebhook.value = false
}

loadWebhookUrl()

function copyText(text: string, id: string) {
  navigator.clipboard.writeText(text)
  copiedId.value = id
  setTimeout(() => { copiedId.value = null }, 2000)
}

const apiUrl = import.meta.env.VITE_API_URL as string

const claudeCodeConfig = computed(() => JSON.stringify({
  mcpServers: {
    'mcp-pm': {
      type: 'http',
      url: `${apiUrl}/mcp`,
      headers: {
        Authorization: `Bearer ${token.value || '<your-token>'}`
      }
    }
  }
}, null, 2))

const codexConfig = computed(() => {
  const t = token.value || '<your-token>'
  return `[mcp_servers.mcp-pm]
url = "${apiUrl}/mcp"
http_headers = { "Authorization" = "Bearer ${t}" }`
})

const activeTab = ref<'claude' | 'codex'>('claude')
</script>

<template>
  <div class="my-page" v-if="isAuthenticated">
    <h1>My Profile</h1>
    <p class="subtitle">Hello, {{ authUser }}</p>

    <!-- Token Section -->
    <section class="card">
      <h2>My Token</h2>
      <p class="card-desc">Personal token used for authentication and MCP connections.</p>
      <div class="token-row">
        <code class="token-display" @click="showFullToken = !showFullToken">
          {{ showFullToken ? token : maskedToken }}
        </code>
        <button class="btn btn--primary" @click="copyText(token, 'token')">{{ copiedId === 'token' ? 'Copied!' : 'Copy' }}</button>
      </div>
      <p class="hint">Click to show full token</p>
    </section>

    <!-- Webhook URL Section -->
    <section class="card">
      <h2>Notification Webhook URL</h2>
      <p class="card-desc">Set a Discord/Slack webhook URL to receive memo/story notifications.</p>
      <div class="token-row">
        <input v-model="webhookUrl" class="webhook-input" placeholder="https://discord.com/api/webhooks/..." />
        <button class="btn btn--primary" @click="saveWebhookUrl" :disabled="savingWebhook">
          {{ savingWebhook ? 'Saving...' : 'Save' }}
        </button>
      </div>
      <p v-if="webhookSaved" class="hint" style="color: #16a34a;">Saved successfully</p>
    </section>

    <!-- MCP Guide Section -->
    <section class="card">
      <h2>MCP Connection Guide</h2>
      <p class="card-desc">Use PM tools (tasks, standup, memos, events) directly from your AI coding assistant.</p>

      <!-- Tab Selector -->
      <div class="tab-bar">
        <button class="tab" :class="{ 'tab--active': activeTab === 'claude' }" @click="activeTab = 'claude'">Claude Code</button>
        <button class="tab" :class="{ 'tab--active': activeTab === 'codex' }" @click="activeTab = 'codex'">Codex CLI</button>
      </div>

      <!-- Claude Code Tab -->
      <div v-if="activeTab === 'claude'" class="tab-content">
        <div class="step">
          <span class="step-num">1</span>
          <div class="step-body">
            <p>Add the following to <code>.mcp.json</code> in your project root (or create it):</p>
            <div class="code-block">
              <button class="code-copy" @click="copyText(claudeCodeConfig, 'claude-config')">{{ copiedId === 'claude-config' ? 'Copied!' : 'Copy' }}</button>
              <pre>{{ claudeCodeConfig }}</pre>
            </div>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div class="step-body">
            <p>Restart Claude Code to connect to the MCP server automatically.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div class="step-body">
            <p>Verify connection:</p>
            <div class="code-block">
              <button class="code-copy" @click="copyText('claude &quot;Show my dashboard&quot;', 'claude-test')">{{ copiedId === 'claude-test' ? 'Copied!' : 'Copy' }}</button>
              <pre>claude "Show my dashboard"</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Codex Tab -->
      <div v-if="activeTab === 'codex'" class="tab-content">
        <div class="step">
          <span class="step-num">1</span>
          <div class="step-body">
            <p>Add to <code>~/.codex/config.toml</code> (global) or project-level <code>.codex/config.toml</code>:</p>
            <div class="code-block">
              <button class="code-copy" @click="copyText(codexConfig, 'codex-config')">{{ copiedId === 'codex-config' ? 'Copied!' : 'Copy' }}</button>
              <pre>{{ codexConfig }}</pre>
            </div>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div class="step-body">
            <p>Or add via CLI:</p>
            <div class="code-block">
              <button class="code-copy" @click="copyText(`codex mcp add mcp-pm --transport http --url ${apiUrl}/mcp`, 'codex-add')">{{ copiedId === 'codex-add' ? 'Copied!' : 'Copy' }}</button>
              <pre>codex mcp add mcp-pm --transport http \
  --url {{ apiUrl }}/mcp</pre>
            </div>
            <p>Then manually add the Authorization header to <code>~/.codex/config.toml</code> under <code>http_headers</code>.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div class="step-body">
            <p>Verify connection:</p>
            <div class="code-block">
              <button class="code-copy" @click="copyText('codex &quot;Show my dashboard&quot;', 'codex-test')">{{ copiedId === 'codex-test' ? 'Copied!' : 'Copy' }}</button>
              <pre>codex "Show my dashboard"</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Common Notes -->
      <div class="note-box">
        <strong>Notes</strong>
        <ul>
          <li>Sprint is auto-detected (no manual setup required)</li>
          <li>User name is auto-extracted from your token</li>
          <li>DB credentials stay on the server only -- <code>.mcp.json</code> has no secrets</li>
          <li>Add <code>.mcp.json</code> to <code>.gitignore</code> (contains personal token)</li>
        </ul>
      </div>
    </section>

    <!-- Available MCP Tools -->
    <section class="card">
      <h2>MCP Tools</h2>
      <p class="card-desc">Tools your AI agent can call. Just use natural language and the agent will pick the right tool.</p>

      <table class="tool-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr class="tool-group-row"><td colspan="3">Dashboard &amp; Navigation</td></tr>
          <tr><td><code>my_dashboard</code></td><td>Overview of your tasks, unread memos, notifications, and standup status</td><td class="tool-example">"Show my status"</td></tr>
          <tr><td><code>list_sprints</code></td><td>List all sprints (active sprint highlighted)</td><td class="tool-example">"Sprint list"</td></tr>
          <tr><td><code>activate_sprint</code></td><td>Activate a sprint (deactivates others)</td><td class="tool-example">"Activate sprint s55"</td></tr>
          <tr><td><code>sprint_summary</code></td><td>Progress by epic, workload by member, blockers</td><td class="tool-example">"Sprint summary"</td></tr>
          <tr><td><code>list_team_members</code></td><td>List active team members</td><td class="tool-example">"Who's on the team?"</td></tr>

          <tr class="tool-group-row"><td colspan="3">Epics</td></tr>
          <tr><td><code>list_epics</code></td><td>All epics with story counts</td><td class="tool-example">"Show epics"</td></tr>
          <tr><td><code>add_epic</code></td><td>Create a new epic</td><td class="tool-example">"Add epic: AI Diagnostics"</td></tr>
          <tr><td><code>update_epic</code></td><td>Update epic (title, description, status, owner)</td><td class="tool-example">"Set epic 3 to completed"</td></tr>
          <tr><td><code>delete_epic</code></td><td>Delete epic (child stories get epic_id=null)</td><td class="tool-example">"Delete epic 5"</td></tr>

          <tr class="tool-group-row"><td colspan="3">Stories</td></tr>
          <tr><td><code>list_stories</code></td><td>Stories with sprint/epic/status/assignee filters</td><td class="tool-example">"s55 stories"</td></tr>
          <tr><td><code>add_story</code></td><td>Create a story under an epic</td><td class="tool-example">"Add story to epic 2: API Design"</td></tr>
          <tr><td><code>update_story</code></td><td>Update story (title, status, assignee, points)</td><td class="tool-example">"Set story 10 to in-progress"</td></tr>
          <tr><td><code>delete_story</code></td><td>Delete story and its tasks</td><td class="tool-example">"Delete story 15"</td></tr>

          <tr class="tool-group-row"><td colspan="3">Tasks</td></tr>
          <tr><td><code>list_my_tasks</code></td><td>Task tree: epic > story > task, filterable by status</td><td class="tool-example">"In-progress tasks only"</td></tr>
          <tr><td><code>get_task</code></td><td>Task details + parent story + sibling tasks</td><td class="tool-example">"Task 42 details"</td></tr>
          <tr><td><code>update_task_status</code></td><td>Change status (todo > in-progress > done)</td><td class="tool-example">"Mark task 42 done"</td></tr>
          <tr><td><code>update_task</code></td><td>Update task (title, assignee, status, description)</td><td class="tool-example">"Assign task 42 to Alex"</td></tr>
          <tr><td><code>add_task</code></td><td>Add task under a story; auto-assigns to you if unspecified</td><td class="tool-example">"Add task to story 10: API integration"</td></tr>
          <tr><td><code>delete_task</code></td><td>Delete a task</td><td class="tool-example">"Delete task 50"</td></tr>

          <tr class="tool-group-row"><td colspan="3">Standup</td></tr>
          <tr><td><code>get_standup</code></td><td>Get standup for a date (default: today)</td><td class="tool-example">"Yesterday's standup"</td></tr>
          <tr><td><code>save_standup</code></td><td>Save today's standup (done/planned/blockers); overwrites if exists</td><td class="tool-example">"Standup: done API, plan FE integration"</td></tr>
          <tr><td><code>list_standup_entries</code></td><td>Standup entries (sprint/date filter)</td><td class="tool-example">"This sprint's standups"</td></tr>

          <tr class="tool-group-row"><td colspan="3">Memos</td></tr>
          <tr><td><code>send_memo</code></td><td>Send memo to team members (comma-separated recipients)</td><td class="tool-example">"Send API spec review request to Alex, Jordan"</td></tr>
          <tr><td><code>list_my_memos</code></td><td>My memos; filter for unread</td><td class="tool-example">"Any unread memos?"</td></tr>
          <tr><td><code>read_memo</code></td><td>Read memo + replies; marks as read</td><td class="tool-example">"Read memo 15"</td></tr>
          <tr><td><code>reply_memo</code></td><td>Reply to a memo</td><td class="tool-example">"Reply to memo 15: acknowledged"</td></tr>
          <tr><td><code>resolve_memo</code></td><td>Mark memo as resolved</td><td class="tool-example">"Resolve memo 15"</td></tr>

          <tr class="tool-group-row"><td colspan="3">Retrospective</td></tr>
          <tr><td><code>get_retro_session</code></td><td>Retro session with items + actions</td><td class="tool-example">"Show this sprint's retro"</td></tr>
          <tr><td><code>add_retro_item</code></td><td>Add retro item (keep/problem/try)</td><td class="tool-example">"Add to keep: great code reviews"</td></tr>
          <tr><td><code>vote_retro_item</code></td><td>Vote/unvote retro item</td><td class="tool-example">"Vote for item 3"</td></tr>
          <tr><td><code>change_retro_phase</code></td><td>Change phase (collect > vote > discuss > action > done)</td><td class="tool-example">"Move retro to vote phase"</td></tr>
          <tr><td><code>add_retro_action</code></td><td>Add retro action item</td><td class="tool-example">"Action: PR reviews within 24h"</td></tr>
          <tr><td><code>update_retro_action_status</code></td><td>Update action status (todo > in-progress > done)</td><td class="tool-example">"Complete action 2"</td></tr>
          <tr><td><code>export_retro</code></td><td>Export retro summary (keep/problem/try + actions + votes)</td><td class="tool-example">"Export retro results"</td></tr>

          <tr class="tool-group-row"><td colspan="3">Agent Events (Push-Native)</td></tr>
          <tr><td><code>emit_event</code></td><td>Emit event to agent/user; delivered via SSE in real-time</td><td class="tool-example">"Notify Oscar about sprint"</td></tr>
          <tr><td><code>poll_events</code></td><td>Poll pending events (fallback for non-SSE clients)</td><td class="tool-example">"Check my events"</td></tr>
          <tr><td><code>ack_event</code></td><td>Acknowledge event; unacked events get retried</td><td class="tool-example">"Ack event 3"</td></tr>

          <tr class="tool-group-row"><td colspan="3">Notifications</td></tr>
          <tr><td><code>check_notifications</code></td><td>Check notifications (unread first)</td><td class="tool-example">"Check notifications"</td></tr>
          <tr><td><code>mark_notification_read</code></td><td>Mark notification as read</td><td class="tool-example">"Mark notification 5 read"</td></tr>
          <tr><td><code>mark_all_notifications_read</code></td><td>Mark all notifications read</td><td class="tool-example">"Mark all read"</td></tr>
        </tbody>
      </table>
    </section>
  </div>

  <!-- Not Authenticated -->
  <div class="my-page" v-else>
    <div class="card" style="text-align: center; padding: 48px 24px;">
      <h2>Login Required</h2>
      <p class="card-desc">Access via a token link or contact your administrator.</p>
    </div>
  </div>
</template>

<style scoped>
.my-page { max-width: 720px; margin: 0 auto; padding: 32px 24px; height: calc(100vh - var(--header-height, 48px)); overflow-y: auto; }
h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.subtitle { font-size: 14px; color: #64748b; margin-bottom: 28px; }

.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 20px; min-width: 0; }
.card h2 { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.card-desc { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }

/* Token */
.token-row { display: flex; gap: 8px; align-items: center; }
.token-display { flex: 1; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 14px; color: #334155; cursor: pointer; user-select: all; word-break: break-all; }
.token-display:hover { background: #f1f5f9; }
.webhook-input { flex: 1; padding: 8px 12px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; font-size: 13px; font-family: monospace; }
.hint { font-size: 11px; color: #94a3b8; margin-top: 6px; }

/* Tabs */
.tab-bar { display: flex; gap: 0; border-bottom: 2px solid #e2e8f0; margin-bottom: 20px; }
.tab { padding: 8px 20px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 500; color: #94a3b8; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
.tab:hover { color: #475569; }
.tab--active { color: #1e293b; border-bottom-color: #1e293b; }

/* Steps */
.step { display: flex; gap: 12px; margin-bottom: 20px; }
.step-num { flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; background: #1e293b; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
.step-body { flex: 1; min-width: 0; }
.step-body p { font-size: 13px; color: #475569; margin-bottom: 8px; line-height: 1.5; }
.step-body code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 12px; }

.code-block { position: relative; background: #1e293b; border-radius: 8px; padding: 16px; overflow: auto; max-width: 100%; }
.code-block pre { margin: 0; color: #e2e8f0; font-family: monospace; font-size: 12px; line-height: 1.6; white-space: pre; }
.code-copy { position: absolute; top: 8px; right: 8px; padding: 4px 10px; border: 1px solid #475569; border-radius: 4px; background: #334155; color: #94a3b8; font-size: 11px; cursor: pointer; transition: all 0.15s; }
.code-copy:hover { background: #475569; color: #fff; }

/* Note */
.note-box { margin-top: 20px; padding: 14px 18px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 13px; color: #92400e; }
.note-box strong { display: block; margin-bottom: 6px; }
.note-box ul { margin: 0; padding-left: 18px; }
.note-box li { margin-bottom: 4px; line-height: 1.5; }
.note-box code { background: #fef3c7; padding: 1px 4px; border-radius: 3px; font-size: 11px; }

/* Tools table */
.tool-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.tool-table th { text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
.tool-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: top; }
.tool-table code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; color: #1e293b; white-space: nowrap; }
.tool-table tr:hover td { background: #f8fafc; }
.tool-group-row td { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; padding-top: 14px; border-bottom: 1px solid #e2e8f0; background: none !important; }
.tool-example { font-size: 12px; color: #94a3b8; font-style: italic; white-space: nowrap; }

/* Buttons */
.btn { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; background: #fff; color: #475569; white-space: nowrap; transition: all 0.15s; }
.btn:hover { background: #f1f5f9; }
.btn--primary { background: #1e293b; color: #fff; border-color: #1e293b; }
.btn--primary:hover { background: #334155; }

@media (max-width: 767px) {
  .my-page { padding: 16px; }
  .token-row { flex-direction: column; }
  .tab { padding: 8px 14px; font-size: 12px; }
}
</style>
