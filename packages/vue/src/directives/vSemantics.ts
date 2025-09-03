import type { Directive, DirectiveBinding } from 'vue'
import { SemanticProtocol } from '@kneelinghorse/semantic-protocol'
import type { SemanticDirectiveBinding, FieldDefinition, AnalysisResult } from '../types'

// Global protocol instance for directive
let globalProtocol: SemanticProtocol | null = null

// Cache for analysis results
const directiveCache = new Map<string, AnalysisResult>()

// WeakMap to store element-specific data
const elementData = new WeakMap<Element, {
  field?: FieldDefinition
  result?: AnalysisResult
  observer?: MutationObserver
}>()

/**
 * Generate a cache key for the analysis
 */
const getCacheKey = (field: FieldDefinition, context: string): string => {
  return `${field.name}_${field.type}_${context}_${JSON.stringify(field.value)}`
}

/**
 * Extract field information from element
 */
const extractFieldFromElement = (el: Element): FieldDefinition | null => {
  // Try to get field info from data attributes
  const fieldName = el.getAttribute('data-field') || 
                   el.getAttribute('name') || 
                   el.id || 
                   el.className.split(' ')[0] || 
                   'unknown'
  
  // Determine field type based on element
  let fieldType: string = 'string'
  
  if (el instanceof HTMLInputElement) {
    switch (el.type) {
      case 'number':
      case 'range':
        fieldType = Number.isInteger(parseFloat(el.value)) ? 'integer' : 'float'
        break
      case 'email':
        fieldType = 'string' // Type stays string, but semantic will be email
        break
      case 'url':
        fieldType = 'string' // Type stays string, but semantic will be url
        break
      case 'date':
        fieldType = 'date'
        break
      case 'datetime-local':
        fieldType = 'datetime'
        break
      case 'time':
        fieldType = 'time'
        break
      case 'checkbox':
      case 'radio':
        fieldType = 'boolean'
        break
      default:
        fieldType = 'string'
    }
  } else if (el instanceof HTMLTextAreaElement) {
    fieldType = 'string'
  } else if (el instanceof HTMLSelectElement) {
    fieldType = 'string'
  }
  
  // Get current value
  let value: any = null
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    value = el.value
  } else if (el instanceof HTMLSelectElement) {
    value = el.value
  } else {
    value = el.textContent || el.getAttribute('value')
  }
  
  return {
    name: fieldName,
    type: fieldType as any,
    value
  }
}

/**
 * Apply semantic styling and attributes to element
 */
const applySemanticStyling = (el: Element, result: AnalysisResult): void => {
  // Add semantic data attributes
  if (result.bestMatch) {
    el.setAttribute('data-semantic', result.bestMatch.semantic)
    el.setAttribute('data-confidence', result.bestMatch.confidence.toString())
  }
  
  // Add CSS classes for semantic types
  el.classList.remove(
    'semantic-cancellation', 'semantic-currency', 'semantic-temporal',
    'semantic-premium', 'semantic-identifier', 'semantic-status',
    'semantic-percentage', 'semantic-email', 'semantic-url', 'semantic-danger'
  )
  
  if (result.bestMatch) {
    el.classList.add(`semantic-${result.bestMatch.semantic}`)
    
    // Add confidence level class
    const confidenceLevel = result.bestMatch.confidence >= 90 ? 'high' :
                           result.bestMatch.confidence >= 70 ? 'medium' : 'low'
    el.classList.add(`semantic-confidence-${confidenceLevel}`)
  }
  
  // Add render instruction attributes
  if (result.renderInstruction) {
    el.setAttribute('data-render-component', result.renderInstruction.component)
    if (result.renderInstruction.variant) {
      el.setAttribute('data-render-variant', result.renderInstruction.variant)
    }
  }
}

/**
 * Perform semantic analysis on element
 */
const analyzeElement = (
  el: Element, 
  binding: DirectiveBinding<SemanticDirectiveBinding['value']>
): void => {
  // Get or create protocol instance
  if (!globalProtocol) {
    globalProtocol = new SemanticProtocol()
  }
  
  // Get field definition from binding or extract from element
  const field = binding.value?.field || extractFieldFromElement(el)
  if (!field) {
    console.warn('v-semantics: Could not determine field information', el)
    return
  }
  
  // Get context from binding
  const context = binding.value?.context || 'form'
  
  // Check cache if enabled
  const cacheKey = getCacheKey(field, context)
  const useCache = binding.modifiers?.cache !== false
  
  let result: AnalysisResult
  
  if (useCache && directiveCache.has(cacheKey)) {
    result = directiveCache.get(cacheKey)!
  } else {
    // Perform analysis
    result = globalProtocol.analyze(field, context)
    
    // Cache result
    if (useCache) {
      directiveCache.set(cacheKey, result)
    }
  }
  
  // Store data for element
  const data = elementData.get(el) || {}
  data.field = field
  data.result = result
  elementData.set(el, data)
  
  // Apply semantic styling
  applySemanticStyling(el, result)
  
  // Call analysis callback if provided
  if (binding.value?.onAnalysis) {
    binding.value.onAnalysis(result)
  }
  
  // Emit custom event
  el.dispatchEvent(new CustomEvent('semantic:analyzed', {
    detail: { field, result },
    bubbles: true
  }))
}

/**
 * Set up automatic re-analysis on value changes
 */
const setupAutoAnalysis = (el: Element, binding: DirectiveBinding): void => {
  const data = elementData.get(el) || {}
  
  // Clean up existing observer
  if (data.observer) {
    data.observer.disconnect()
  }
  
  // Set up mutation observer for value changes
  const observer = new MutationObserver((mutations) => {
    let shouldReanalyze = false
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'value' || mutation.attributeName === 'data-field')) {
        shouldReanalyze = true
      }
    })
    
    if (shouldReanalyze) {
      analyzeElement(el, binding)
    }
  })
  
  // Observe attribute changes
  observer.observe(el, {
    attributes: true,
    attributeFilter: ['value', 'data-field']
  })
  
  // Also listen for input events
  const handleInput = () => {
    if (binding.modifiers?.lazy) {
      // Debounce for lazy mode
      clearTimeout((el as any).__semanticTimeout)
      ;(el as any).__semanticTimeout = setTimeout(() => {
        analyzeElement(el, binding)
      }, 300)
    } else {
      analyzeElement(el, binding)
    }
  }
  
  el.addEventListener('input', handleInput)
  el.addEventListener('change', handleInput)
  
  // Store observer and cleanup function
  data.observer = observer
  elementData.set(el, data)
}

/**
 * v-semantics directive implementation
 */
export const vSemantics: Directive<Element, SemanticDirectiveBinding['value']> = {
  mounted(el, binding) {
    // Perform initial analysis
    analyzeElement(el, binding)
    
    // Set up auto-analysis if enabled
    if (binding.modifiers?.auto) {
      setupAutoAnalysis(el, binding)
    }
    
    // Development mode logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🧠 v-semantics mounted on:', el, binding.value)
    }
  },
  
  updated(el, binding, vnode, prevVnode) {
    // Re-analyze if binding value changed
    if (binding.value !== binding.oldValue) {
      analyzeElement(el, binding)
    }
  },
  
  beforeUnmount(el) {
    // Clean up
    const data = elementData.get(el)
    if (data?.observer) {
      data.observer.disconnect()
    }
    
    // Remove event listeners
    const handleInput = (el as any).__semanticInputHandler
    if (handleInput) {
      el.removeEventListener('input', handleInput)
      el.removeEventListener('change', handleInput)
    }
    
    // Clear timeout
    if ((el as any).__semanticTimeout) {
      clearTimeout((el as any).__semanticTimeout)
    }
    
    // Remove from WeakMap
    elementData.delete(el)
    
    // Remove semantic classes and attributes
    el.classList.remove(
      'semantic-cancellation', 'semantic-currency', 'semantic-temporal',
      'semantic-premium', 'semantic-identifier', 'semantic-status',
      'semantic-percentage', 'semantic-email', 'semantic-url', 'semantic-danger',
      'semantic-confidence-high', 'semantic-confidence-medium', 'semantic-confidence-low'
    )
    
    el.removeAttribute('data-semantic')
    el.removeAttribute('data-confidence')
    el.removeAttribute('data-render-component')
    el.removeAttribute('data-render-variant')
  }
}

// Export utility functions for advanced usage
export const semanticsDirectiveUtils = {
  analyzeElement: (el: Element) => {
    const data = elementData.get(el)
    return data?.result || null
  },
  
  getFieldInfo: (el: Element) => {
    const data = elementData.get(el)
    return data?.field || null
  },
  
  clearCache: () => {
    directiveCache.clear()
  },
  
  setProtocol: (protocol: SemanticProtocol) => {
    globalProtocol = protocol
  }
}