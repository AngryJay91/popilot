<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { visible, title, message, confirmText, cancelText, isAlertMode, onConfirm, onCancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click.self="isAlertMode ? onConfirm() : onCancel()">
        <div class="modal-card" role="dialog" :aria-modal="true" aria-labelledby="confirm-dialog-title">
          <p v-if="title" id="confirm-dialog-title" class="modal-title">{{ title }}</p>
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button v-if="!isAlertMode" class="btn-cancel" @click="onCancel">{{ cancelText }}</button>
            <button class="btn-confirm" @click="onConfirm">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 24px;
  min-width: 320px;
  max-width: 480px;
  width: 90%;
}

.modal-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.modal-message {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cancel {
  padding: 7px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover { background: var(--border-light); }

.btn-confirm {
  padding: 7px 16px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: #fff;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-confirm:hover { background: var(--primary-dark); }

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
