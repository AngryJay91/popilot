<template>
  <div class="placeholder-content">
    <div class="placeholder-icon">📝</div>
    <h2>Spec coming soon</h2>
    <p>Interactive mockup for this screen will be added soon.</p>
    <div class="placeholder-badge">In progress</div>
  </div>
</template>

<style scoped>
.placeholder-content {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; color: var(--text-muted); text-align: center; padding: 40px;
}
.placeholder-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.3; }
h2 { font-size: 24px; color: var(--text-primary); margin-bottom: 8px; }
p { font-size: 14px; margin-bottom: 24px; }
.placeholder-badge {
  padding: 8px 16px; border-radius: 6px;
  background: var(--yellow-bg); color: var(--yellow); font-size: 12px; font-weight: 600;
}
</style>
