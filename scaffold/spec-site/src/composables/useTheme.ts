/**
 * Theme composable — light/dark/system theme toggle.
 *
 * Applies data-theme attribute to document root.
 * Persists selection in localStorage.
 */
import { ref, watchEffect } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'light')

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function applyTheme() {
  let effective: 'light' | 'dark'
  if (theme.value === 'system') {
    effective = mediaQuery.matches ? 'dark' : 'light'
  } else {
    effective = theme.value
  }
  document.documentElement.setAttribute('data-theme', effective)
  localStorage.setItem('theme', theme.value)
}

mediaQuery.addEventListener('change', applyTheme)
watchEffect(applyTheme)

export function useTheme() {
  function toggle() {
    const order: ThemeMode[] = ['light', 'dark', 'system']
    const idx = order.indexOf(theme.value)
    theme.value = order[(idx + 1) % order.length]
  }

  return { theme, toggle }
}
