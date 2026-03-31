import { LayoutDashboard, FileText, MessageSquare, MessageCircle, Calendar, Trophy, Settings, ClipboardList, GitBranch, BarChart3, BarChart2, Users, Search, Plus, ChevronDown, Check, X, Edit, Pencil, Trash2, Link, Eye, Clock, Bell, FolderPlus, FilePlus, Moon, Sun, Home, Target, Pin, RefreshCw, Lock, Unlock, Bug, HelpCircle, Monitor } from 'lucide-vue-next';
const props = defineProps();
const iconMap = {
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
};
const IconComponent = iconMap[props.name];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.IconComponent) {
    const __VLS_0 = ((__VLS_ctx.IconComponent));
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        size: (__VLS_ctx.size || 16),
    }));
    const __VLS_2 = __VLS_1({
        size: (__VLS_ctx.size || 16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_4 = {};
    var __VLS_3;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.name);
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            IconComponent: IconComponent,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
