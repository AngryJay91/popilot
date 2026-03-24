<script setup lang="ts">
import { computed } from 'vue'
import type { PmStory } from '@/composables/usePmStore'
import { getTasksForStory, STORY_STATUS_LABELS, PRIORITY_LABELS } from '@/composables/usePmStore'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  story: PmStory
}>()

const emit = defineEmits<{ select: [story: PmStory]; updated: [] }>()

const storyTasks = computed(() => getTasksForStory(props.story.id))
const doneCount = computed(() => storyTasks.value.filter(t => t.status === 'done').length)
</script>

<template>
  <div
    class="story-card"
    :class="{ 'story-done': story.status === 'done' }"
    @click="emit('select', story)"
  >
    <div class="story-header">
      <div class="story-top-row">
        <StatusBadge :label="STORY_STATUS_LABELS[story.status]" type="status" :value="story.status" />
        <StatusBadge :label="PRIORITY_LABELS[story.priority]" type="priority" :value="story.priority" />
        <span class="story-area">{{ story.area }}</span>
        <span v-if="story.storyPoints" class="story-points">{{ story.storyPoints }}pt</span>
      </div>
      <div class="story-title">{{ story.title }}</div>
      <div class="story-bottom">
        <span v-if="story.assignee" class="story-assignee">{{ story.assignee }}</span>
        <span v-if="storyTasks.length > 0" class="story-task-count">{{ doneCount }}/{{ storyTasks.length }} tasks</span>
        <span v-if="story.relatedPrs?.length" class="story-pr-badge" title="PRs linked">{{ story.relatedPrs.length }} PR</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.story-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-color: #cbd5e1;
}
.story-done { opacity: 0.6; }
.story-header { display: flex; flex-direction: column; gap: 6px; }
.story-top-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.story-area { font-size: 10px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 1px 6px; border-radius: 3px; }
.story-points { font-size: 10px; font-weight: 600; color: #3b82f6; margin-left: auto; }
.story-title { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; }
.story-bottom { display: flex; align-items: center; gap: 8px; }
.story-assignee { font-size: 11px; color: #64748b; }
.story-task-count { font-size: 10px; color: #94a3b8; margin-left: auto; }
.story-pr-badge { font-size: 11px; color: #3b82f6; }
@media (max-width: 767px) {
  .story-card { padding: 8px 10px; }
  .story-title { font-size: 12px; }
}
</style>
