<template>
  <div class="semantic-provider">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { provideSemanticContext } from '../composables/useSemanticContext'
import type { SemanticProviderProps } from '../types'

const props = withDefaults(defineProps<SemanticProviderProps>(), {
  options: () => ({})
})

// Provide semantic context to child components
const context = provideSemanticContext(props.options)

// Computed properties for debugging
const contextInfo = computed(() => ({
  confidenceThreshold: context.options.confidenceThreshold,
  autoAnalysis: context.options.autoAnalysis,
  enableDevTools: context.options.enableDevTools,
  cacheResults: context.options.cacheResults
}))

// Development mode debugging
if (process.env.NODE_ENV === 'development' && context.options.enableDevTools) {
  watchEffect(() => {
    console.group('🧠 Semantic Protocol Provider')
    console.log('Context:', contextInfo.value)
    console.log('Protocol instance:', context.protocol)
    console.groupEnd()
  })
}

// Expose context for testing
defineExpose({
  context,
  contextInfo
})
</script>

<script lang="ts">
export default {
  name: 'SemanticProvider',
  inheritAttrs: false
}
</script>

<style scoped>
.semantic-provider {
  /* Minimal styling - this is a logical component */
  display: contents;
}
</style>