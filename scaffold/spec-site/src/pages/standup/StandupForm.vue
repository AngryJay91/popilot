<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  existing?: { doneText: string | null; planText: string | null; blockers: string | null } | null
}>()

const emit = defineEmits<{
  (e: 'save', data: { doneText: string | null; planText: string | null; blockers: string | null }): void
}>()

const doneText = ref('')
const planText = ref('')
const blockers = ref('')
const isEditing = ref(false)

onMounted(() => {
  if (props.existing) {
    doneText.value = props.existing.doneText ?? ''
    planText.value = props.existing.planText ?? ''
    blockers.value = props.existing.blockers ?? ''
  }
})

function save() {
  emit('save', { doneText: doneText.value || null, planText: planText.value || null, blockers: blockers.value || null })
  isEditing.value = false
}
</script>

<template>
  <div class="standup-form">
    <h3 v-if="existing && !isEditing">Your standup is submitted</h3>
    <div v-if="existing && !isEditing" class="submitted-preview">
      <div v-if="existing.doneText" class="preview-section"><span class="preview-label">Done:</span> {{ existing.doneText }}</div>
      <div v-if="existing.planText" class="preview-section"><span class="preview-label">Plan:</span> {{ existing.planText }}</div>
      <div v-if="existing.blockers" class="preview-section"><span class="preview-label">Blockers:</span> {{ existing.blockers }}</div>
      <button class="btn btn--sm" @click="isEditing = true">Edit</button>
    </div>
    <div v-if="!existing || isEditing" class="form-fields">
      <h3>Write Your Standup</h3>
      <div class="field"><label>What did you do yesterday?</label><textarea v-model="doneText" rows="3" placeholder="Completed tasks..." /></div>
      <div class="field"><label>What will you do today?</label><textarea v-model="planText" rows="3" placeholder="Planned tasks..." /></div>
      <div class="field"><label>Any blockers?</label><textarea v-model="blockers" rows="2" placeholder="Blockers (if any)..." /></div>
      <div class="form-actions">
        <button class="btn btn--primary" @click="save">Save</button>
        <button v-if="isEditing" class="btn" @click="isEditing = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.standup-form { background: var(--card-bg, #fff); border: 1px solid var(--border-light, #e2e8f0); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
h3 { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.submitted-preview { display: flex; flex-direction: column; gap: 6px; }
.preview-section { font-size: 13px; color: var(--text-secondary); }
.preview-label { font-weight: 600; color: var(--text-primary); margin-right: 4px; }
.form-fields { display: flex; flex-direction: column; gap: 12px; }
.field label { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block; }
.field textarea { width: 100%; padding: 8px 12px; border: 1px solid var(--border-light, #e2e8f0); border-radius: 8px; font-size: 13px; font-family: inherit; resize: vertical; box-sizing: border-box; }
.field textarea:focus { outline: none; border-color: #3b82f6; }
.form-actions { display: flex; gap: 8px; }
.btn { padding: 8px 16px; border: 1px solid var(--border-light, #e2e8f0); border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; background: var(--card-bg, #fff); color: var(--text-secondary); transition: all 0.15s; }
.btn:hover { background: #f1f5f9; }
.btn--primary { background: #1e293b; color: #fff; border-color: #1e293b; }
.btn--sm { padding: 4px 10px; font-size: 11px; margin-top: 8px; }
</style>
