<template>
  <Teleport :to="computedTarget" :disabled="computedDisabled">
    <div 
      v-if="shouldRender" 
      class="semantic-teleport"
      :data-semantic-types="semanticTypesString"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, useSlots, ref, watch } from 'vue'
import type { SemanticTeleportProps, SemanticType } from '../types'
import { useSemanticContext } from '../composables/useSemanticContext'

const props = withDefaults(defineProps<SemanticTeleportProps>(), {
  to: 'body',
  disabled: false,
  semanticFilter: () => []
})

const slots = useSlots()
const { options } = useSemanticContext()

// Reactive state
const isClientSide = ref(false)

// Computed properties
const computedTarget = computed(() => {
  // Handle dynamic target resolution
  if (typeof props.to === 'string') {
    // Check if it's a CSS selector or element ID
    if (props.to.startsWith('#') || props.to.startsWith('.') || props.to.includes('[')) {
      return props.to
    }
    // Default to element ID if not a selector
    return `#${props.to}`
  }
  return props.to
})

const computedDisabled = computed(() => {
  // Disable on server-side rendering unless explicitly enabled
  return props.disabled || (!isClientSide.value && typeof window === 'undefined')
})

const semanticTypesString = computed(() => {
  return props.semanticFilter?.join(',') || ''
})

const shouldRender = computed(() => {
  // Check if we have content to render
  if (!slots.default) {
    return false
  }
  
  // If no semantic filter is applied, always render
  if (!props.semanticFilter || props.semanticFilter.length === 0) {
    return true
  }
  
  // In a real implementation, this would check if the slot content
  // contains components/elements with the specified semantic types
  // For now, we'll always render if filters are provided
  return true
})

// Client-side hydration check
if (typeof window !== 'undefined') {
  isClientSide.value = true
}

// Watch for target element existence
const targetExists = ref(true)

watch(
  () => computedTarget.value,
  (newTarget) => {
    if (typeof window !== 'undefined' && typeof newTarget === 'string') {
      // Check if target element exists
      const element = document.querySelector(newTarget)
      targetExists.value = !!element
      
      if (!element && process.env.NODE_ENV === 'development') {
        console.warn(`SemanticTeleport: Target element "${newTarget}" not found`)
      }
    }
  },
  { immediate: true }
)

// Development warnings
if (process.env.NODE_ENV === 'development' && options.enableDevTools) {
  watch(
    [computedTarget, shouldRender, targetExists],
    ([target, render, exists]) => {
      console.group('🌀 Semantic Teleport')
      console.log('Target:', target)
      console.log('Should render:', render)
      console.log('Target exists:', exists)
      console.log('Semantic filter:', props.semanticFilter)
      console.groupEnd()
    }
  )
}

// Expose for testing
defineExpose({
  computedTarget,
  computedDisabled,
  shouldRender,
  targetExists,
  isClientSide
})
</script>

<script lang="ts">
export default {
  name: 'SemanticTeleport',
  inheritAttrs: false
}
</script>

<style scoped>
.semantic-teleport {
  /* Minimal container styling */
  display: contents;
}

/* Global styles that will be applied when teleported */
:global(.semantic-teleport) {
  /* Semantic-aware positioning */
  position: relative;
}

:global(.semantic-teleport[data-semantic-types*="danger"]) {
  /* Danger-semantic teleports might need special z-index */
  z-index: 9999;
}

:global(.semantic-teleport[data-semantic-types*="premium"]) {
  /* Premium content might need elevated styling */
  z-index: 999;
}
</style>