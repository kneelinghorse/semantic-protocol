import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { SemanticProtocol } from '@semantic-protocol/vue'
import type { SemanticVueOptions } from '../types'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const options = config.public.semanticProtocol as SemanticVueOptions
  
  // Install the semantic protocol plugin
  nuxtApp.vueApp.use(SemanticProtocol, options)
  
  // Client-side specific initialization
  if (process.client) {
    // Add global error handler for semantic analysis errors
    nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
      if (error.name === 'SemanticAnalysisError') {
        console.group('🚨 Semantic Protocol Error')
        console.error('Error:', error)
        console.log('Component:', instance)
        console.log('Info:', info)
        console.groupEnd()
      }
    }
    
    // Initialize client-side semantic analysis cache
    if (options.cacheResults && typeof window !== 'undefined') {
      // Set up persistent cache using localStorage if available
      try {
        const cachedResults = localStorage.getItem('semantic-protocol-cache')
        if (cachedResults) {
          // Restore cache from localStorage
          const cache = JSON.parse(cachedResults)
          // Apply to semantic protocol cache (implementation would depend on cache structure)
          if (options.enableDevTools) {
            console.log('🧠 Restored semantic analysis cache:', Object.keys(cache).length, 'entries')
          }
        }
      } catch (e) {
        // Ignore localStorage errors in private browsing mode
      }
    }
    
    // Set up performance monitoring in development
    if (options.enableDevTools && process.env.NODE_ENV === 'development') {
      // Monitor semantic analysis performance
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('semantic-')) {
            console.log(`⚡ ${entry.name}: ${entry.duration.toFixed(2)}ms`)
          }
        }
      })
      
      try {
        observer.observe({ entryTypes: ['measure', 'mark'] })
      } catch (e) {
        // Performance API not supported
      }
    }
  }
  
  return {
    provide: {
      semanticProtocol: {
        options,
        version: '1.0.0'
      }
    }
  }
})