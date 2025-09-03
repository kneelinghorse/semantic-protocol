import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { SemanticProtocol } from '@semantic-protocol/vue'
import type { SemanticVueOptions } from '../types'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const options = config.public.semanticProtocol as SemanticVueOptions
  
  // Install the semantic protocol plugin with SSR-safe options
  const ssrOptions: SemanticVueOptions = {
    ...options,
    // Disable auto-analysis on server to prevent hydration issues
    autoAnalysis: false,
    // Disable dev tools on server
    enableDevTools: false,
    // Enable caching for better SSR performance
    cacheResults: true
  }
  
  nuxtApp.vueApp.use(SemanticProtocol, ssrOptions)
  
  // Server-side specific initialization
  if (process.server) {
    // Pre-warm common semantic patterns for better SSR performance
    const commonPatterns = [
      { name: 'id', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'price', type: 'decimal' },
      { name: 'status', type: 'string' },
      { name: 'active', type: 'boolean' }
    ]
    
    // Pre-analyze common patterns to warm up the cache
    const protocol = new SemanticProtocol(options.confidenceThreshold)
    commonPatterns.forEach(pattern => {
      try {
        protocol.analyze(pattern as any)
      } catch (e) {
        // Ignore pre-warming errors
      }
    })
    
    // Add semantic data to SSR context for hydration
    nuxtApp.ssrContext = nuxtApp.ssrContext || {}
    nuxtApp.ssrContext.semanticProtocol = {
      preWarmedPatterns: commonPatterns.length,
      serverRendered: true,
      timestamp: new Date().toISOString()
    }
  }
  
  return {
    provide: {
      semanticProtocol: {
        options: ssrOptions,
        version: '1.0.0',
        ssr: true
      }
    }
  }
})