<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { authUser, isAuthenticated } = useAuth()

const token = computed(() => localStorage.getItem('spec-auth-token') || '')
const maskedToken = computed(() => token.value ? `${token.value.substring(0, 8)}...${token.value.substring(token.value.length - 4)}` : '')
const showFullToken = ref(false)

const copiedId = ref<string | null>(null)

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
            <p>Add the following to <code>.mcp.json</code> in your project root:</p>
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
      </div>

      <div class="note-box">
        <strong>Notes</strong>
        <ul>
          <li>Sprint is auto-detected (no manual setup required)</li>
          <li>User name is auto-extracted from your token</li>
          <li>Add <code>.mcp.json</code> to <code>.gitignore</code> (contains personal token)</li>
        </ul>
      </div>
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
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.card h2 { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.card-desc { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
.token-row { display: flex; gap: 8px; align-items: center; }
.token-display { flex: 1; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 14px; color: #334155; cursor: pointer; user-select: all; word-break: break-all; }
.token-display:hover { background: #f1f5f9; }
.hint { font-size: 11px; color: #94a3b8; margin-top: 6px; }
.tab-bar { display: flex; gap: 0; border-bottom: 2px solid #e2e8f0; margin-bottom: 20px; }
.tab { padding: 8px 20px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 500; color: #94a3b8; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
.tab:hover { color: #475569; }
.tab--active { color: #1e293b; border-bottom-color: #1e293b; }
.step { display: flex; gap: 12px; margin-bottom: 20px; }
.step-num { flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; background: #1e293b; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
.step-body { flex: 1; min-width: 0; }
.step-body p { font-size: 13px; color: #475569; margin-bottom: 8px; line-height: 1.5; }
.step-body code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
.code-block { position: relative; background: #1e293b; border-radius: 8px; padding: 16px; overflow: auto; max-width: 100%; }
.code-block pre { margin: 0; color: #e2e8f0; font-family: monospace; font-size: 12px; line-height: 1.6; white-space: pre; }
.code-copy { position: absolute; top: 8px; right: 8px; padding: 4px 10px; border: 1px solid #475569; border-radius: 4px; background: #334155; color: #94a3b8; font-size: 11px; cursor: pointer; transition: all 0.15s; }
.code-copy:hover { background: #475569; color: #fff; }
.note-box { margin-top: 20px; padding: 14px 18px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 13px; color: #92400e; }
.note-box strong { display: block; margin-bottom: 6px; }
.note-box ul { margin: 0; padding-left: 18px; }
.note-box li { margin-bottom: 4px; line-height: 1.5; }
.note-box code { background: #fef3c7; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
.btn { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; background: #fff; color: #475569; transition: all 0.15s; }
.btn--primary { background: #1e293b; color: #fff; border-color: #1e293b; }
.btn--primary:hover { background: #334155; }
@media (max-width: 767px) { .my-page { padding: 16px; } .token-row { flex-direction: column; } }
</style>
