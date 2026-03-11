<template>
  <div class="spec-placeholder">
    <div class="placeholder-icon">👈</div>
    When the mockup is ready,<br>
    specs will appear here.
  </div>
</template>

<style scoped>
.spec-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 200px; color: var(--text-muted); text-align: center;
  font-size: 14px; line-height: 1.6;
}
.placeholder-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.3; }
</style>
