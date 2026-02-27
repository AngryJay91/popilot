<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import SplitPaneLayout from '@/layouts/SplitPaneLayout.vue'
import ScenarioSwitcher from '@/components/ScenarioSwitcher.vue'
import VersionBadge from '@/components/VersionBadge.vue'
import MockupShell from '@/components/MockupShell.vue'
import PolicyFallback from '@/pages/shared/PolicyFallback.vue'
import NoContentPlaceholder from '@/pages/shared/NoContentPlaceholder.vue'
import { provideScenario } from '@/composables/useScenario'
import { useScenarioStore } from '@/composables/useScenarioStore'
import { useUser } from '@/composables/useUser'
import { getWireframe } from '@/data/wireframeRegistry'
import { featurePages } from '@/data/navigation'
import type { Scenario } from '@/data/types'

const route = useRoute()
const { currentUser } = useUser()

const pageId = computed(() => (route.params.pageId as string) || '')
const sprint = computed(() => (route.params.sprint as string) || '')

const wireframeConfig = computed(() => getWireframe(pageId.value, sprint.value))
const hasWireframe = computed(() => !!wireframeConfig.value)

const featurePage = computed(() => featurePages.find(p => p.id === pageId.value))

const fallbackEpicId = computed(() => {
  if (hasWireframe.value) return null
  return featurePage.value?.epicMap[sprint.value] ?? null
})

const renderMode = computed<'wireframe' | 'policy' | 'empty'>(() => {
  if (hasWireframe.value) return 'wireframe'
  if (fallbackEpicId.value) return 'policy'
  return 'empty'
})

// Turso custom scenario store
const store = useScenarioStore(pageId.value, sprint.value)
const storeRef = ref(store)

const initialConfig = wireframeConfig.value
const { scenarios, activeScenarioId, setScenario, updateScenarios } = provideScenario(
  initialConfig?.scenarios ?? [],
  initialConfig?.defaultScenarioId ?? '',
)

async function mergeCustomScenarios() {
  const config = getWireframe(pageId.value, sprint.value)
  const baseScenarios: Scenario<any>[] = config?.scenarios ?? []
  const custom = await storeRef.value.loadCustomScenarios()
  updateScenarios([...baseScenarios, ...custom], config?.defaultScenarioId ?? '')
}

async function handleDuplicate(sourceId: string) {
  const source = scenarios.value.find(s => s.id === sourceId)
  if (!source) return
  const label = `${source.label} (copy)`
  await storeRef.value.duplicateScenario(source, label, currentUser.value ?? 'unknown')
  await mergeCustomScenarios()
}

async function handleDeleteCustom(scenarioId: string) {
  await storeRef.value.deleteScenario(scenarioId)
  await mergeCustomScenarios()
}

watch([pageId, sprint], () => {
  const newStore = useScenarioStore(pageId.value, sprint.value)
  storeRef.value = newStore
  mergeCustomScenarios()
})

onMounted(() => {
  mergeCustomScenarios()
})

const showScenarioSwitcher = computed(() =>
  hasWireframe.value && (wireframeConfig.value?.scenarios.length ?? 0) > 0
)
</script>

<template>
  <div class="wireframe-shell">
    <!-- Wireframe mode -->
    <SplitPaneLayout
      v-if="renderMode === 'wireframe'"
      :spec-areas="wireframeConfig!.specAreas"
      :title="wireframeConfig!.specTitle"
    >
      <template #mockup>
        <div v-if="showScenarioSwitcher" class="mockup-toolbar">
          <ScenarioSwitcher
            :scenarios="scenarios"
            :active-id="activeScenarioId"
            @change="setScenario"
            @duplicate="handleDuplicate"
            @delete-custom="handleDeleteCustom"
          />
          <div class="mockup-version">
            <VersionBadge :version="wireframeConfig!.version" />
          </div>
        </div>
        <MockupShell>
          <component :is="wireframeConfig!.mockup" :key="`${pageId}-${sprint}`" />
        </MockupShell>
      </template>

      <template #spec>
        <component :is="wireframeConfig!.specPanel" :key="`${pageId}-${sprint}`" />
      </template>
    </SplitPaneLayout>

    <!-- Policy fallback -->
    <PolicyFallback
      v-else-if="renderMode === 'policy'"
      :sprint="sprint"
      :epic-id="fallbackEpicId!"
      :page-label="featurePage?.label ?? pageId"
    />

    <!-- No content -->
    <NoContentPlaceholder
      v-else
      :page-id="pageId"
      :sprint="sprint"
    />
  </div>
</template>

<style scoped>
.wireframe-shell { height: 100%; }
.mockup-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
}
.mockup-version {
  background: #fff;
  padding: 6px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}
</style>
