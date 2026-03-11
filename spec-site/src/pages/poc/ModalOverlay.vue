<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
}>()

function onBackdrop(ev: MouseEvent) {
  if (ev.target === ev.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @mousedown="onBackdrop">
      <div class="modal-container">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}
.modal-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
