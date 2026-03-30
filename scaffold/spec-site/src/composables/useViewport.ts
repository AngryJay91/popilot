import { ref, provide, inject, readonly, type Ref } from 'vue'

export type ViewportMode = 'desktop' | 'mobile'

const VIEWPORT_KEY = '__viewport_mode__'

const _mode = ref<ViewportMode>('desktop')

export function provideViewport() {
  provide(VIEWPORT_KEY, _mode)

  function toggle() {
    _mode.value = _mode.value === 'desktop' ? 'mobile' : 'desktop'
  }

  function setMode(m: ViewportMode) {
    _mode.value = m
  }

  return { mode: readonly(_mode), toggle, setMode }
}

export function useViewport() {
  const mode = inject<Ref<ViewportMode>>(VIEWPORT_KEY, _mode)
  return { mode: readonly(mode) }
}
