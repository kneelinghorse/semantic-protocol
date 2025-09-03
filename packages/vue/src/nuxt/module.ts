import { defineNuxtModule, addPlugin, createResolver, addImports, addComponent } from '@nuxt/kit'
import type { SemanticVueOptions } from '../types'

export interface NuxtSemanticProtocolOptions extends SemanticVueOptions {
  /**
   * Auto-import composables
   * @default true
   */
  autoImports?: boolean
  
  /**
   * Auto-register components globally
   * @default true
   */
  globalComponents?: boolean
  
  /**
   * Component prefix for global registration
   * @default 'Semantic'
   */
  componentPrefix?: string
  
  /**
   * CSS file to include semantic styles
   */
  css?: string | string[]
  
  /**
   * Development mode specific options
   */
  dev?: {
    /**
     * Show detailed logs in development
     * @default true
     */
    verbose?: boolean
    
    /**
     * Enable Vue DevTools integration
     * @default true
     */
    devtools?: boolean
  }
}

export default defineNuxtModule<NuxtSemanticProtocolOptions>({
  meta: {
    name: '@semantic-protocol/vue',
    configKey: 'semanticProtocol',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    confidenceThreshold: 70,
    autoAnalysis: false,
    enableDevTools: true,
    cacheResults: true,
    autoImports: true,
    globalComponents: true,
    componentPrefix: 'Semantic',
    dev: {
      verbose: true,
      devtools: true
    }
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    
    // Add plugin
    addPlugin({
      src: resolve('./plugin.client.ts'),
      mode: 'client'
    })
    
    addPlugin({
      src: resolve('./plugin.server.ts'),
      mode: 'server'
    })
    
    // Auto-import composables
    if (options.autoImports) {
      addImports([
        {
          name: 'useSemantics',
          from: '@semantic-protocol/vue'
        },
        {
          name: 'useSemanticField',
          from: '@semantic-protocol/vue'
        },
        {
          name: 'useReactiveSemantics',
          from: '@semantic-protocol/vue'
        },
        {
          name: 'useDiscovery',
          from: '@semantic-protocol/vue'
        },
        {
          name: 'useReactiveDiscovery',
          from: '@semantic-protocol/vue'
        },
        {
          name: 'useRelationships',
          from: '@semantic-protocol/vue'
        },
        {
          name: 'useAdvancedRelationships',
          from: '@semantic-protocol/vue'
        },
        {
          name: 'useSemanticContext',
          from: '@semantic-protocol/vue'
        }
      ])
    }
    
    // Auto-register components globally
    if (options.globalComponents) {
      const prefix = options.componentPrefix || 'Semantic'
      
      addComponent({
        name: `${prefix}Provider`,
        filePath: '@semantic-protocol/vue'
      })
      
      addComponent({
        name: `${prefix}Boundary`,
        filePath: '@semantic-protocol/vue'
      })
      
      addComponent({
        name: `${prefix}Teleport`,
        filePath: '@semantic-protocol/vue'
      })
    }
    
    // Add CSS if specified
    if (options.css) {
      const cssFiles = Array.isArray(options.css) ? options.css : [options.css]
      cssFiles.forEach(css => {
        nuxt.options.css.push(css)
      })
    }
    
    // Add default semantic CSS
    nuxt.options.css.push(resolve('./semantic-styles.css'))
    
    // Development mode enhancements
    if (nuxt.options.dev && options.dev?.verbose) {
      // Add development middleware for semantic analysis debugging
      nuxt.options.nitro = nuxt.options.nitro || {}
      nuxt.options.nitro.experimental = nuxt.options.nitro.experimental || {}
    }
    
    // Add TypeScript declarations
    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ types: '@semantic-protocol/vue' })
    })
    
    // Runtime config for client-side access
    nuxt.options.runtimeConfig.public.semanticProtocol = {
      confidenceThreshold: options.confidenceThreshold,
      autoAnalysis: options.autoAnalysis,
      enableDevTools: options.enableDevTools && nuxt.options.dev,
      cacheResults: options.cacheResults
    }
    
    // Add build optimizations
    nuxt.options.build = nuxt.options.build || {}
    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    nuxt.options.build.transpile.push('@semantic-protocol/vue')
    
    // Development tools integration
    if (nuxt.options.dev && options.dev?.devtools) {
      // Add devtools integration (future feature)
      nuxt.hook('devtools:customTabs', (tabs) => {
        tabs.push({
          name: 'semantic-protocol',
          title: 'Semantic Protocol',
          icon: 'carbon:cognitive',
          view: {
            type: 'iframe',
            src: '/__semantic_devtools'
          }
        })
      })
    }
    
    // Hook for extending webpack/vite configuration
    nuxt.hook('vite:extendConfig', (config) => {
      config.define = config.define || {}
      config.define.__SEMANTIC_PROTOCOL_OPTIONS__ = JSON.stringify(options)
    })
    
    // Log module setup in development
    if (nuxt.options.dev && options.dev?.verbose) {
      console.log('🧠 Semantic Protocol module initialized with options:', {
        confidenceThreshold: options.confidenceThreshold,
        autoAnalysis: options.autoAnalysis,
        enableDevTools: options.enableDevTools,
        cacheResults: options.cacheResults,
        autoImports: options.autoImports,
        globalComponents: options.globalComponents,
        componentPrefix: options.componentPrefix
      })
    }
  }
})