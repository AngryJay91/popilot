<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { provideActiveSection } from '@/composables/useActiveSection'
import SpecNav from '@/components/SpecNav.vue'
import type { SpecArea } from '@/data/types'

defineProps<{
  specAreas: SpecArea[]
  title?: string
}>()

const { activeSection, setActiveSection } = provideActiveSection()

// Resizable divider
const leftPane = ref<HTMLElement | null>(null)
const divider = ref<HTMLElement | null>(null)
let isDragging = false
let startX = 0
let startWidth = 0

function onMouseDown(e: MouseEvent) {
  if (!leftPane.value) return
  isDragging = true
  startX = e.clientX
  startWidth = leftPane.value.offsetWidth
  divider.value?.classList.add('dragging')
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging || !leftPane.value) return
  const newWidth = Math.max(400, Math.min(startWidth + e.clientX - startX, window.innerWidth - 560))
  leftPane.value.style.width = newWidth + 'px'
  leftPane.value.style.flex = 'none'
}

function onMouseUp() {
  if (!isDragging) return
  isDragging = false
  divider.value?.classList.remove('dragging')
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div class="split-pane">
    <div class="pane-left" ref="leftPane">
      <slot name="mockup" />
    </div>

    <div class="pane-divider" ref="divider" @mousedown="onMouseDown" />

    <div class="pane-right">
      <div class="spec-panel-header">
        <div class="spec-panel-title">{{ title ?? 'Storyboard Spec' }}</div>
        <SpecNav
          :areas="specAreas"
          :active-id="activeSection"
          @select="setActiveSection"
        />
      </div>
      <div class="spec-panel-body" id="spec-body">
        <slot name="spec" />
      </div>
    </div>
  </div>
</template>
