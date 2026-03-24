<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet } from '@/api/client'

interface MemberItem { id: number; display_name: string }

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const members = ref<MemberItem[]>([])

function toggle(name: string) {
  const current = new Set(props.modelValue)
  if (current.has(name)) current.delete(name)
  else current.add(name)
  emit('update:modelValue', [...current])
}

onMounted(async () => {
  const { data } = await apiGet<{ members: MemberItem[] }>('/api/v2/admin/members')
  if (data?.members) members.value = data.members.filter(m => (m as any).is_active)
})
</script>

<template>
  <div class="member-select">
    <label v-for="m in members" :key="m.id"
      class="member-tag" :class="{ selected: modelValue.includes(m.display_name) }"
      @click="toggle(m.display_name)">
      {{ m.display_name }}
    </label>
  </div>
</template>

<style scoped>
.member-select { display: flex; flex-wrap: wrap; gap: 6px; }
.member-tag {
  padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;
  border: 1px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.02);
  transition: all 0.15s; user-select: none;
}
.member-tag.selected { background: var(--primary); color: #fff; border-color: var(--primary); }
</style>
