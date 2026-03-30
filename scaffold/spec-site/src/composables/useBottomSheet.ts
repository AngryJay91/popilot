import { ref, computed, type Ref } from 'vue'

export type SheetState = 'peek' | 'half' | 'full'

const PEEK_HEIGHT = 48
const HALF_RATIO = 0.5
const FULL_RATIO = 0.85
const VELOCITY_THRESHOLD = 0.5 // px/ms

export function useBottomSheet() {
  const state: Ref<SheetState> = ref('peek')
  const dragging = ref(false)
  const dragOffset = ref(0)

  let startY = 0
  let startTime = 0
  let startTranslateY = 0

  function getTranslateY(s: SheetState): number {
    const vh = window.innerHeight
    const sheetHeight = vh * FULL_RATIO
    switch (s) {
      case 'peek': return sheetHeight - PEEK_HEIGHT
      case 'half': return sheetHeight - vh * HALF_RATIO
      case 'full': return 0
    }
  }

  const translateY = computed(() => {
    const base = getTranslateY(state.value)
    return dragging.value ? base + dragOffset.value : base
  })

  function tap() {
    const order: SheetState[] = ['peek', 'half', 'full']
    const idx = order.indexOf(state.value)
    state.value = order[(idx + 1) % order.length]
  }

  function onPointerDown(e: PointerEvent) {
    dragging.value = true
    dragOffset.value = 0
    startY = e.clientY
    startTime = Date.now()
    startTranslateY = getTranslateY(state.value)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging.value) return
    const dy = e.clientY - startY
    const sheetHeight = window.innerHeight * FULL_RATIO
    dragOffset.value = Math.max(-startTranslateY, Math.min(dy, sheetHeight - PEEK_HEIGHT - startTranslateY))
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging.value) return
    dragging.value = false

    const dy = e.clientY - startY
    const dt = Date.now() - startTime
    const velocity = dy / Math.max(dt, 1)

    if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
      if (velocity > 0) {
        state.value = state.value === 'full' ? 'half' : 'peek'
      } else {
        state.value = state.value === 'peek' ? 'half' : 'full'
      }
    } else {
      const currentTranslate = startTranslateY + dragOffset.value
      const sheetHeight = window.innerHeight * FULL_RATIO
      const peekT = sheetHeight - PEEK_HEIGHT
      const halfT = sheetHeight - window.innerHeight * HALF_RATIO
      const fullT = 0

      const distances = [
        { state: 'peek' as SheetState, d: Math.abs(currentTranslate - peekT) },
        { state: 'half' as SheetState, d: Math.abs(currentTranslate - halfT) },
        { state: 'full' as SheetState, d: Math.abs(currentTranslate - fullT) },
      ]
      distances.sort((a, b) => a.d - b.d)
      state.value = distances[0].state
    }

    dragOffset.value = 0
  }

  function setState(s: SheetState) {
    state.value = s
  }

  return {
    state,
    dragging,
    translateY,
    tap,
    setState,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
