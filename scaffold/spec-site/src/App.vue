<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import MemoSidebar from './components/MemoSidebar.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <main class="app-main">
      <router-view />
    </main>
    <MemoSidebar />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
