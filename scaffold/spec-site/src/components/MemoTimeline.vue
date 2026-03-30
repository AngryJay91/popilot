<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref, onMounted } from 'vue'
import { apiGet } from '@/composables/useTurso'
import { renderMarkdown } from '@/utils/markdown'

interface TimelineEntry { type: string; id: number; content: string; author: string; created_at: string }

const props = defineProps<{ memoId: number }>()
const timeline = ref<TimelineEntry[]>([])

async function load() {
  const { data } = await apiGet<{ timeline: TimelineEntry[] }>(`/api/v2/memos/${props.memoId}/timeline`)
  timeline.value = data?.timeline || []
}

const typeIcons: Record<string, string> = { reply: '<Icon name="messageCircle" :size="14" />', activity: '<Icon name="document" :size="14" />', status_change: '<Icon name="refreshCw" :size="14" />' }
const typeLabels: Record<string, string> = { reply: 'Reply', activity: 'Activity', status_change: 'Status Change' }

onMounted(load)
</script>

<template>
  <div class="memo-timeline">
    <div v-for="entry in timeline" :key="`${entry.type}-${entry.id}`" class="tl-entry">
      <div class="tl-dot" />
      <div class="tl-content">
        <div class="tl-header">
          <span class="tl-icon">{{ typeIcons[entry.type] || '<Icon name="pin" :size="14" />' }}</span>
          <span class="tl-author">{{ entry.author }}</span>
          <span class="tl-type">{{ typeLabels[entry.type] || entry.type }}</span>
          <span class="tl-time">{{ entry.created_at }}</span>
        </div>
        <div class="tl-body" v-html="renderMarkdown(entry.content || '')"></div>
      </div>
    </div>
    <div v-if="!timeline.length" class="tl-empty">Timeline is empty.</div>
  </div>
</template>

<style scoped>
.memo-timeline { padding: 8px 0; }
.tl-entry { display: flex; gap: 12px; padding: 8px 0; border-left: 2px solid #e5e7eb; margin-left: 8px; padding-left: 16px; position: relative; }
.tl-dot { position: absolute; left: -5px; top: 12px; width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; }
.tl-content { flex: 1; }
.tl-header { display: flex; gap: 8px; align-items: center; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.tl-icon { font-size: 14px; }
.tl-author { font-weight: 600; color: #374151; }
.tl-time { margin-left: auto; font-size: 11px; }
.tl-body { font-size: 13px; line-height: 1.5; }
.tl-empty { color: #9ca3af; font-size: 13px; text-align: center; padding: 24px; }
@media (max-width: 767px) { .btn { min-height: 44px; } input, select { min-height: 44px; font-size: 16px; } }
</style>
