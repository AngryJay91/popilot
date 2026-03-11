<script setup lang="ts">
import type { SpecArea } from '@/data/types'

defineProps<{
  areas: SpecArea[]
  activeId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <div class="spec-nav">
    <button
      v-for="area in areas"
      :key="area.id"
      class="spec-nav-btn"
      :class="{ active: activeId === area.id }"
      @click="emit('select', area.id)"
    >
      {{ area.shortLabel }}
    </button>
  </div>
</template>
