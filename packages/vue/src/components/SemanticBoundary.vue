<template>
  <div class="semantic-boundary">
    <div v-if="hasError" class="semantic-boundary__error">
      <div class="semantic-boundary__error-content">
        <h3 class="semantic-boundary__error-title">
          Semantic Analysis Error
        </h3>
        <p class="semantic-boundary__error-message">
          {{ errorMessage }}
        </p>
        <details v-if="showDetails" class="semantic-boundary__error-details">
          <summary>Error Details</summary>
          <pre>{{ errorStack }}</pre>
        </details>
        <div class="semantic-boundary__error-actions">
          <button 
            type="button"
            class="semantic-boundary__error-button"
            @click="retry"
          >
            Retry Analysis
          </button>
          <button 
            v-if="!showDetails"
            type="button"
            class="semantic-boundary__error-button semantic-boundary__error-button--secondary"
            @click="showDetails = true"
          >
            Show Details
          </button>
        </div>
      </div>
    </div>
    <template v-else>
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, nextTick } from 'vue'
import type { SemanticBoundaryProps } from '../types'

const props = withDefaults(defineProps<SemanticBoundaryProps>(), {
  fallback: 'Something went wrong with semantic analysis.',
  onError: undefined
})

// Error state
const error = ref<Error | null>(null)
const errorInfo = ref<string>('')
const showDetails = ref(false)
const retryCount = ref(0)

// Computed properties
const hasError = computed(() => !!error.value)

const errorMessage = computed(() => {
  if (typeof props.fallback === 'string') {
    return props.fallback
  }
  return error.value?.message || 'An unknown error occurred'
})

const errorStack = computed(() => {
  if (!error.value) return ''
  
  const stack = error.value.stack || ''
  const info = errorInfo.value
  
  return `Error: ${error.value.message}\n\n${stack}\n\nComponent Stack:\n${info}`
})

// Error capture
onErrorCaptured((err: Error, instance: any, info: string) => {
  error.value = err
  errorInfo.value = info
  showDetails.value = process.env.NODE_ENV === 'development'
  
  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err, instance, info)
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Semantic Boundary Error')
    console.error('Error:', err)
    console.log('Component instance:', instance)
    console.log('Error info:', info)
    console.groupEnd()
  }
  
  // Prevent the error from propagating
  return false
})

// Retry functionality
const retry = async () => {
  retryCount.value++
  error.value = null
  errorInfo.value = ''
  showDetails.value = false
  
  // Force re-render by waiting for next tick
  await nextTick()
  
  // If we've retried too many times, give up
  if (retryCount.value > 3) {
    error.value = new Error('Maximum retry attempts exceeded')
    return
  }
}

// Reset error when component unmounts or props change
const reset = () => {
  error.value = null
  errorInfo.value = ''
  showDetails.value = false
  retryCount.value = 0
}

// Expose methods for parent components
defineExpose({
  hasError,
  error: computed(() => error.value),
  retry,
  reset
})
</script>

<script lang="ts">
export default {
  name: 'SemanticBoundary',
  inheritAttrs: false
}
</script>

<style scoped>
.semantic-boundary {
  display: contents;
}

.semantic-boundary__error {
  padding: 1.5rem;
  margin: 1rem 0;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #991b1b;
}

.semantic-boundary__error-content {
  max-width: 100%;
}

.semantic-boundary__error-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #991b1b;
}

.semantic-boundary__error-message {
  margin: 0 0 1rem 0;
  color: #7f1d1d;
  line-height: 1.5;
}

.semantic-boundary__error-details {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 0.25rem;
}

.semantic-boundary__error-details summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.semantic-boundary__error-details pre {
  margin: 0;
  padding: 0;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.semantic-boundary__error-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.semantic-boundary__error-button {
  padding: 0.5rem 1rem;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.semantic-boundary__error-button:hover {
  background-color: #b91c1c;
}

.semantic-boundary__error-button--secondary {
  background-color: #6b7280;
}

.semantic-boundary__error-button--secondary:hover {
  background-color: #4b5563;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .semantic-boundary__error {
    background-color: #431c1c;
    border-color: #7c2d12;
    color: #fca5a5;
  }
  
  .semantic-boundary__error-title {
    color: #fca5a5;
  }
  
  .semantic-boundary__error-message {
    color: #f87171;
  }
  
  .semantic-boundary__error-details {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  .semantic-boundary__error-details pre {
    color: #d1d5db;
  }
}</style>