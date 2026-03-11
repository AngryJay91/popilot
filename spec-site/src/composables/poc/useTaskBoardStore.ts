import { ref, computed, watch } from 'vue'

// ── Types ──

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  title: string
  description: string
  assignee: string
  priority: Priority
  status: TaskStatus
  createdAt: string
}

// ── Constants ──

export const TEAM_MEMBERS = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'Todo',
  'in-progress': 'In Progress',
  'done': 'Done',
}

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done']

// ── Storage ──

const STORAGE_KEY = 'poc-taskboard'

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* corrupted */ }
  return seedTasks()
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

function seedTasks(): Task[] {
  const now = new Date().toISOString()
  return [
    { id: '1', title: 'Design login page', description: 'Create wireframes for the login flow', assignee: 'Alice', priority: 'high', status: 'todo', createdAt: now },
    { id: '2', title: 'Set up CI pipeline', description: 'Configure GitHub Actions for test + deploy', assignee: 'Bob', priority: 'medium', status: 'todo', createdAt: now },
    { id: '3', title: 'API auth middleware', description: 'Implement JWT verification middleware', assignee: 'Charlie', priority: 'critical', status: 'in-progress', createdAt: now },
    { id: '4', title: 'Write onboarding copy', description: 'Draft welcome email and tooltip text', assignee: 'Diana', priority: 'low', status: 'in-progress', createdAt: now },
    { id: '5', title: 'Fix header z-index bug', description: 'Header overlaps modal on mobile', assignee: 'Bob', priority: 'medium', status: 'done', createdAt: now },
  ]
}

// ── Singleton Store ──

const tasks = ref<Task[]>(loadTasks())
const filterAssignee = ref('')
const editingTask = ref<Task | null>(null)
const isModalOpen = ref(false)

watch(tasks, (val) => saveTasks(val), { deep: true })

const filteredTasks = computed(() => {
  if (!filterAssignee.value) return tasks.value
  return tasks.value.filter(t => t.assignee === filterAssignee.value)
})

const statusCounts = computed(() => {
  const counts: Record<TaskStatus, number> = { 'todo': 0, 'in-progress': 0, 'done': 0 }
  for (const t of filteredTasks.value) {
    counts[t.status]++
  }
  return counts
})

const uniqueAssignees = computed(() => {
  const set = new Set(tasks.value.map(t => t.assignee).filter(Boolean))
  return [...set].sort()
})

function getTasksByStatus(status: TaskStatus) {
  return computed(() => filteredTasks.value.filter(t => t.status === status))
}

function addTask(data: Omit<Task, 'id' | 'createdAt'>) {
  tasks.value.push({
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
}

function updateTask(id: string, updates: Partial<Task>) {
  const idx = tasks.value.findIndex(t => t.id === id)
  if (idx !== -1) {
    tasks.value[idx] = { ...tasks.value[idx], ...updates }
  }
}

function moveTask(id: string, newStatus: TaskStatus) {
  updateTask(id, { status: newStatus })
}

function deleteTask(id: string) {
  tasks.value = tasks.value.filter(t => t.id !== id)
}

function setFilter(assignee: string) {
  filterAssignee.value = assignee
}

function openCreateModal() {
  editingTask.value = null
  isModalOpen.value = true
}

function openEditModal(task: Task) {
  editingTask.value = { ...task }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingTask.value = null
}

export function useTaskBoardStore() {
  return {
    tasks,
    filteredTasks,
    filterAssignee,
    statusCounts,
    uniqueAssignees,
    editingTask,
    isModalOpen,
    COLUMNS,
    getTasksByStatus,
    addTask,
    updateTask,
    moveTask,
    deleteTask,
    setFilter,
    openCreateModal,
    openEditModal,
    closeModal,
  }
}
