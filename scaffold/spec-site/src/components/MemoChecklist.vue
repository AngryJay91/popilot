<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/composables/useTurso'

interface CheckItem { id: number; content: string; assignee: string | null; is_done: number; sort_order: number }

const props = defineProps<{ memoId: number; members?: string[] }>()
const items = ref<CheckItem[]>([])
const newContent = ref('')

async function load() {
  const { data } = await apiGet<{ items: CheckItem[] }>(`/api/v2/memos/${props.memoId}/checklist`)
  items.value = data?.items || []
}

const progress = computed(() => {
  const total = items.value.length
  const done = items.value.filter(i => i.is_done).length
  return { done, total, percent: total ? Math.round(done / total * 100) : 0 }
})

async function addItem() {
  if (!newContent.value.trim()) return
  await apiPost(`/api/v2/memos/${props.memoId}/checklist`, { content: newContent.value.trim() })
  newContent.value = ''
  await load()
}

async function toggleDone(item: CheckItem) {
  await apiPatch(`/api/v2/memos/checklist/${item.id}`, { is_done: item.is_done ? 0 : 1 })
  item.is_done = item.is_done ? 0 : 1
}

async function setAssignee(item: CheckItem, assignee: string) {
  await apiPatch(`/api/v2/memos/checklist/${item.id}`, { assignee })
  item.assignee = assignee
}

async function removeItem(id: number) {
  await apiDelete(`/api/v2/memos/checklist/${id}`)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="memo-checklist">
    <div class="cl-header">
      <span class="cl-title">Checklist</span>
      <span class="cl-progress">{{ progress.done }}/{{ progress.total }} ({{ progress.percent }}%)</span>
    </div>
    <div class="cl-progress-bar"><div class="cl-progress-fill" :style="{ width: progress.percent + '%' }" /></div>

    <div v-for="item in items" :key="item.id" class="cl-item" :class="{ done: item.is_done }">
      <input type="checkbox" :checked="!!item.is_done" @change="toggleDone(item)" />
      <span class="cl-content">{{ item.content }}</span>
      <select class="cl-assignee" :value="item.assignee || ''" @change="setAssignee(item, ($event.target as HTMLSelectElement).value)">
        <option value="">Assignee</option>
        <option v-for="m in (members || [])" :key="m" :value="m">{{ m }}</option>
      </select>
      <button class="cl-remove" @click="removeItem(item.id)">✕</button>
    </div>

    <div class="cl-add">
      <input v-model="newContent" class="cl-input" placeholder="Add item..." @keyup.enter="addItem" />
      <button class="btn btn--xs btn--primary" @click="addItem">Add</button>
    </div>
  </div>
</template>

<style scoped>
.memo-checklist { margin: 12px 0; padding: 12px; background: #fafafa; border-radius: 8px; }
.cl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.cl-title { font-size: 13px; font-weight: 600; }
.cl-progress { font-size: 11px; color: #6b7280; }
.cl-progress-bar { height: 4px; background: #e5e7eb; border-radius: 2px; margin-bottom: 8px; }
.cl-progress-fill { height: 100%; background: #22c55e; border-radius: 2px; transition: width 0.2s; }
.cl-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
.cl-item.done .cl-content { text-decoration: line-through; color: #9ca3af; }
.cl-content { flex: 1; }
.cl-assignee { border: 1px solid #e5e7eb; border-radius: 4px; padding: 1px 4px; font-size: 11px; }
.cl-remove { border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 12px; }
.cl-remove:hover { color: #ef4444; }
.cl-add { display: flex; gap: 4px; margin-top: 8px; }
.cl-input { flex: 1; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 8px; font-size: 12px; }
@media (max-width: 767px) { .btn { min-height: 44px; } input, select { min-height: 44px; font-size: 16px; } }
</style>
