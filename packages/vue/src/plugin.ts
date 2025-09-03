import type { App, Plugin } from 'vue'
import type { SemanticVueOptions, SemanticProtocolPlugin } from './types'
import { provideSemanticContext } from './composables/useSemanticContext'

// Import components
import SemanticProvider from './components/SemanticProvider.vue'
import SemanticBoundary from './components/SemanticBoundary.vue'
import SemanticTeleport from './components/SemanticTeleport.vue'

// Import directives
import { vSemantics } from './directives/vSemantics'
import { vSemanticRef } from './directives/vSemanticRef'

/**
 * Vue 3 plugin for Semantic Protocol
 */
const SemanticProtocolVuePlugin: SemanticProtocolPlugin = {
  install(app: App, options: SemanticVueOptions = {}) {
    // Provide global semantic context
    provideSemanticContext(options)
    
    // Register components globally
    app.component('SemanticProvider', SemanticProvider)
    app.component('SemanticBoundary', SemanticBoundary)
    app.component('SemanticTeleport', SemanticTeleport)
    
    // Register directives
    app.directive('semantics', vSemantics)
    app.directive('semantic-ref', vSemanticRef)
    
    // Add global properties for Options API support
    app.config.globalProperties.$semanticProtocol = {
      options,
      version: '1.0.0'
    }
    
    // Development mode enhancements
    if (process.env.NODE_ENV === 'development' && options.enableDevTools) {
      console.log('🧠 Semantic Protocol Vue plugin installed', {
        version: '1.0.0',
        options
      })
      
      // Add global error handler for semantic errors
      const originalErrorHandler = app.config.errorHandler
      app.config.errorHandler = (error, instance, info) => {
        if (error.name?.includes('Semantic') || info?.includes('semantic')) {
          console.group('🚨 Semantic Protocol Error')
          console.error('Error:', error)
          console.log('Component:', instance)
          console.log('Info:', info)
          console.groupEnd()
        }
        
        // Call original error handler if it exists
        if (originalErrorHandler) {
          originalErrorHandler(error, instance, info)
        }
      }
    }
  }
}

export default SemanticProtocolVuePlugin