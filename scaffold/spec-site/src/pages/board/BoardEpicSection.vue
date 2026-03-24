<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PmEpic, PmStory } from '@/composables/usePmStore'
import BoardStoryCard from './BoardStoryCard.vue'

const props = defineProps<{
  epic: PmEpic | null
  stories: PmStory[]
}>()

const emit = defineEmits<{ updated: []; selectStory: [story: PmStory] }>()

const collapsed = ref(false)

const doneStories = computed(() => props.stories.filter(s => s.status === 'done').length)
</script>

<template>
  <div class="epic-section">
    <div class="epic-header" @click="collapsed = !collapsed">
      <span class="collapse-icon">{{ collapsed ? '&#9654;' : '&#9660;' }}</span>
      <span class="epic-label">{{ epic ? epic.title : 'Unassigned' }}</span>
      <span class="epic-story-count">{{ doneStories }}/{{ stories.length }} stories</span>
    </div>

    <div v-if="!collapsed" class="epic-stories">
      <div v-if="stories.length === 0" class="no-stories">
        No stories -- add them from the admin page
      </div>
      <div v-else class="stories-grid">
        <BoardStoryCard
          v-for="story in stories"
          :key="story.id"
          :story="story"
          @select="(s) => emit('selectStory', s)"
          @updated="emit('updated')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.epic-section { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff; }
.epic-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #f8fafc; cursor: pointer; user-select: none; transition: background 0.1s; }
.epic-header:hover { background: #f1f5f9; }
.collapse-icon { font-size: 10px; color: #94a3b8; width: 14px; text-align: center; }
.epic-label { font-size: 14px; font-weight: 600; color: #1e293b; }
.epic-story-count { font-size: 11px; color: #94a3b8; margin-left: auto; }
.epic-stories { padding: 12px 16px 16px; }
.no-stories { text-align: center; padding: 20px; color: #94a3b8; font-size: 13px; }
.stories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
@media (max-width: 767px) { .stories-grid { grid-template-columns: 1fr; } }
</style>
