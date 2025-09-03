import { inject, provide, type InjectionKey } from 'vue'
import { SemanticProtocol } from '@kneelinghorse/semantic-protocol'
import type { SemanticContext, SemanticVueOptions } from '../types'

// Context injection key
export const SEMANTIC_CONTEXT_KEY: InjectionKey<SemanticContext> = Symbol('semantic-context')

// Default options
const defaultOptions: Required<SemanticVueOptions> = {
  confidenceThreshold: 70,
  autoAnalysis: false,
  enableDevTools: process.env.NODE_ENV === 'development',
  cacheResults: true
}

/**
 * Provide semantic context to child components
 */
export function provideSemanticContext(options: SemanticVueOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options }
  const protocol = new SemanticProtocol(mergedOptions.confidenceThreshold)
  
  const context: SemanticContext = {
    protocol,
    options: mergedOptions
  }
  
  provide(SEMANTIC_CONTEXT_KEY, context)
  
  return context
}

/**
 * Use semantic context from parent provider
 */
export function useSemanticContext(): SemanticContext {
  const context = inject(SEMANTIC_CONTEXT_KEY)
  
  if (!context) {
    // Create a default context if none provided
    const protocol = new SemanticProtocol(defaultOptions.confidenceThreshold)
    return {
      protocol,
      options: defaultOptions
    }
  }
  
  return context
}

/**
 * Check if semantic context is available
 */
export function hasSemanticContext(): boolean {
  return !!inject(SEMANTIC_CONTEXT_KEY, null)
}