import { ref } from 'vue'

// TODO: Replace with your team members
export const TEAM_MEMBERS = ['Member1', 'Member2', 'Member3'] as const
export type TeamMember = (typeof TEAM_MEMBERS)[number]

const STORAGE_KEY = 'retro-user-name'

const currentUser = ref<TeamMember | null>(
  (localStorage.getItem(STORAGE_KEY) as TeamMember | null) ?? null,
)

export function useUser() {
  function setUser(name: TeamMember) {
    currentUser.value = name
    localStorage.setItem(STORAGE_KEY, name)
  }

  function clearUser() {
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { currentUser, setUser, clearUser, TEAM_MEMBERS }
}
