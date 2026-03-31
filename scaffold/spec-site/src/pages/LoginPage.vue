<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { loadNavData } from '@/composables/useNavStore'

const { isAuthenticated, authLoading, login, tryAutoLogin } = useAuth()
const router = useRouter()
const route = useRoute()

const tokenInput = ref('')
const loginError = ref(false)
const initializing = ref(true)

const redirectTo = (route.query.redirect as string) || '/'

onMounted(async () => {
  const ok = await tryAutoLogin()
  if (ok) {
    loadNavData()
    router.replace(redirectTo)
  }
  initializing.value = false
})

async function handleLogin() {
  loginError.value = false
  const ok = await login(tokenInput.value.trim())
  if (!ok) {
    loginError.value = true
  } else {
    tokenInput.value = ''
    loadNavData()
    router.replace(redirectTo)
  }
}
</script>

<template>
  <!-- Initializing -->
  <div v-if="initializing" class="auth-init">
    <div class="auth-spinner"></div>
  </div>

  <!-- Already authenticated (brief flash before redirect) -->
  <div v-else-if="isAuthenticated" class="auth-init">
    <div class="auth-spinner"></div>
  </div>

  <!-- Login form -->
  <div v-else class="auth-page">
    <div class="auth-card">
      <div class="auth-logo"><Icon name="sprint" :size="14" /></div>
      <!-- TODO: Change title to your project name -->
      <h1 class="auth-title">Project Spec</h1>
      <p class="auth-desc">Team-only spec site.<br>Enter your auth token to continue.</p>

      <div class="auth-form">
        <input
          v-model="tokenInput"
          type="text"
          class="auth-input"
          placeholder="Auth token"
          autocomplete="off"
          @keydown.enter="handleLogin"
        />
        <button
          class="auth-btn"
          @click="handleLogin"
          :disabled="authLoading || !tokenInput.trim()"
        >
          {{ authLoading ? 'Verifying...' : 'Enter' }}
        </button>
      </div>

      <p v-if="loginError" class="auth-error">Invalid token</p>
      <p class="auth-hint">Contact your team admin for a token</p>
    </div>
  </div>
</template>

<style scoped>
.auth-init {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #f8fafc;
}
.auth-spinner {
  width: 32px; height: 32px; border: 3px solid #e2e8f0;
  border-top-color: #3b82f6; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.auth-page {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.auth-card {
  background: #fff; border-radius: 16px; padding: 48px 40px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  text-align: center; width: 380px; max-width: 90vw;
}

.auth-logo { font-size: 48px; margin-bottom: 12px; }
.auth-title { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
.auth-desc { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 28px; }

.auth-form { display: flex; gap: 8px; }
.auth-input {
  flex: 1; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; font-family: 'Roboto Mono', monospace; color: #1e293b;
}
.auth-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.auth-input::placeholder { color: #94a3b8; }

.auth-btn {
  padding: 12px 20px; background: #1e293b; color: #fff; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: background 0.15s;
}
.auth-btn:hover { background: #334155; }
.auth-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

.auth-error { color: #ef4444; font-size: 13px; margin-top: 12px; }
.auth-hint { color: #94a3b8; font-size: 12px; margin-top: 16px; }
</style>
