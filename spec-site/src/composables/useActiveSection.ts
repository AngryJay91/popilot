import { ref, provide, inject, nextTick } from 'vue'
import type { InjectionKey, Ref } from 'vue'

interface ActiveSectionCtx {
  activeSection: Ref<string | null>
  setActiveSection: (id: string) => void
  clearActiveSection: () => void
}

const ActiveSectionKey: InjectionKey<ActiveSectionCtx> = Symbol('activeSection')

export function provideActiveSection() {
  const activeSection = ref<string | null>(null)

  function setActiveSection(id: string) {
    activeSection.value = id

    nextTick(() => {
      // Highlight mockup area
      document.querySelectorAll('[data-area]').forEach(el =>
        el.classList.remove('area-active')
      )
      const mockupArea = document.querySelector(`[data-area="${id}"]`)
      if (mockupArea) {
        mockupArea.classList.add('area-active')
        mockupArea.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      // Scroll spec panel
      const specEl = document.getElementById(`spec-section-${id}`)
      if (specEl) {
        const body = document.getElementById('spec-body')
        if (body) body.scrollTop = 0
      }
    })
  }

  function clearActiveSection() {
    activeSection.value = null
    document.querySelectorAll('[data-area]').forEach(el =>
      el.classList.remove('area-active')
    )
  }

  provide(ActiveSectionKey, { activeSection, setActiveSection, clearActiveSection })
  return { activeSection, setActiveSection, clearActiveSection }
}

export function useActiveSection() {
  const ctx = inject(ActiveSectionKey)
  if (!ctx) throw new Error('useActiveSection requires SplitPaneLayout ancestor')
  return ctx
}
