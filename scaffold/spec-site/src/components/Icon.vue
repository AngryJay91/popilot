<script setup lang="ts">
import {
  LayoutDashboard, FileText, MessageSquare, MessageCircle, Calendar, Trophy, Settings,
  ClipboardList, GitBranch, BarChart3, BarChart2, Users, Search, Plus, ChevronDown,
  Check, X, Edit, Pencil, Trash2, Link, Eye, Clock, Bell,
  FolderPlus, FilePlus, Moon, Sun, Home, Target, Pin, RefreshCw,
  Lock, Unlock, Bug, HelpCircle, Monitor
} from 'lucide-vue-next'

const props = defineProps<{ name: string; size?: number }>()

const iconMap: Record<string, any> = {
  dashboard: LayoutDashboard,
  document: FileText,
  memo: MessageSquare,
  calendar: Calendar,
  trophy: Trophy,
  settings: Settings,
  sprint: ClipboardList,
  branch: GitBranch,
  chart: BarChart3,
  users: Users,
  search: Search,
  plus: Plus,
  chevronDown: ChevronDown,
  check: Check,
  close: X,
  edit: Edit,
  trash: Trash2,
  link: Link,
  eye: Eye,
  clock: Clock,
  bell: Bell,
  folderPlus: FolderPlus,
  filePlus: FilePlus,
  moon: Moon,
  sun: Sun,
  home: Home,
  target: Target,
  messageCircle: MessageCircle,
  pin: Pin,
  refreshCw: RefreshCw,
  pencil: Pencil,
  lock: Lock,
  unlock: Unlock,
  bug: Bug,
  helpCircle: HelpCircle,
  monitor: Monitor,
  barChart2: BarChart2,
}

const IconComponent = iconMap[props.name]
</script>

<template>
  <component v-if="IconComponent" :is="IconComponent" :size="size || 16" />
  <span v-else>{{ name }}</span>
</template>
