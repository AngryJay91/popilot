/**
 * User composable — Team member selection
 *
 * Stores current user in localStorage for retro/memo features.
 * Team members list is configurable per project.
 */
import { ref } from 'vue';
import { apiGet, isStaticMode } from '@/api/client';
// TODO: Replace with your team members or load dynamically from API
export const TEAM_MEMBERS = [];
const STORAGE_KEY = 'retro-user-name';
const currentUser = ref(localStorage.getItem(STORAGE_KEY) ?? null);
const dynamicMembers = ref([]);
async function loadMembers() {
    if (isStaticMode()) {
        dynamicMembers.value = [...TEAM_MEMBERS];
        return;
    }
    try {
        const { data, error } = await apiGet('/api/v2/admin/members');
        if (!error && data) {
            dynamicMembers.value = data.members.map(m => m.name);
        }
    }
    catch {
        dynamicMembers.value = [...TEAM_MEMBERS];
    }
}
export function useUser() {
    function setUser(name) {
        currentUser.value = name;
        localStorage.setItem(STORAGE_KEY, name);
    }
    function clearUser() {
        currentUser.value = null;
        localStorage.removeItem(STORAGE_KEY);
    }
    return { currentUser, setUser, clearUser, TEAM_MEMBERS, dynamicMembers, loadMembers };
}
