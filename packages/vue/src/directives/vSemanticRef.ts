import type { Directive, DirectiveBinding } from 'vue'
import type { SemanticRefDirectiveBinding, SemanticType } from '../types'

// Global registry for semantic references
const semanticRefRegistry = new Map<string, {
  element: Element
  semantic?: SemanticType
  metadata: Record<string, any>
}>()

// Event emitter for reference changes
const refEventTarget = new EventTarget()

// WeakMap to store element-specific reference data
const elementRefData = new WeakMap<Element, {
  refId: string
  semantic?: SemanticType
  cleanup: Array<() => void>
}>()

/**
 * Generate a unique reference ID
 */
const generateRefId = (): string => {
  return `semantic-ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Register a semantic reference
 */
const registerRef = (
  refId: string,
  element: Element,
  semantic?: SemanticType,
  onRegister?: (ref: string, element: Element) => void
): void => {
  // Store in registry
  semanticRefRegistry.set(refId, {
    element,
    semantic,
    metadata: {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      registeredAt: new Date().toISOString()
    }
  })
  
  // Add data attributes to element
  element.setAttribute('data-semantic-ref', refId)
  if (semantic) {
    element.setAttribute('data-semantic-ref-type', semantic)
  }
  
  // Emit registration event
  refEventTarget.dispatchEvent(new CustomEvent('semantic-ref:registered', {
    detail: { refId, element, semantic }
  }))
  
  // Call registration callback
  if (onRegister) {
    onRegister(refId, element)
  }
  
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 Semantic reference registered: ${refId}`, {
      element,
      semantic,
      totalRefs: semanticRefRegistry.size
    })
  }
}

/**
 * Unregister a semantic reference
 */
const unregisterRef = (refId: string): void => {
  const refData = semanticRefRegistry.get(refId)
  if (refData) {
    // Remove data attributes
    refData.element.removeAttribute('data-semantic-ref')
    refData.element.removeAttribute('data-semantic-ref-type')
    
    // Remove from registry
    semanticRefRegistry.delete(refId)
    
    // Emit unregistration event
    refEventTarget.dispatchEvent(new CustomEvent('semantic-ref:unregistered', {
      detail: { refId, element: refData.element, semantic: refData.semantic }
    }))
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 Semantic reference unregistered: ${refId}`, {
        totalRefs: semanticRefRegistry.size
      })
    }
  }
}

/**
 * Find references by semantic type
 */
const findRefsBySemantic = (semantic: SemanticType): Element[] => {
  const elements: Element[] = []
  
  semanticRefRegistry.forEach((refData) => {
    if (refData.semantic === semantic) {
      elements.push(refData.element)
    }
  })
  
  return elements
}

/**
 * Find references by custom criteria
 */
const findRefsBy = (predicate: (element: Element, metadata: Record<string, any>) => boolean): Element[] => {
  const elements: Element[] = []
  
  semanticRefRegistry.forEach((refData) => {
    if (predicate(refData.element, refData.metadata)) {
      elements.push(refData.element)
    }
  })
  
  return elements
}

/**
 * Set up element observation for automatic updates
 */
const setupElementObservation = (element: Element, refId: string): (() => void) => {
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false
    
    mutations.forEach((mutation) => {
      // Watch for class or data attribute changes that might affect semantics
      if (mutation.type === 'attributes' && 
          (mutation.attributeName?.startsWith('data-') ||
           mutation.attributeName === 'class' ||
           mutation.attributeName === 'id')) {
        shouldUpdate = true
      }
    })
    
    if (shouldUpdate) {
      // Update registry metadata
      const refData = semanticRefRegistry.get(refId)
      if (refData) {
        refData.metadata = {
          ...refData.metadata,
          tagName: element.tagName.toLowerCase(),
          id: element.id,
          className: element.className,
          lastUpdated: new Date().toISOString()
        }
        
        // Emit update event
        refEventTarget.dispatchEvent(new CustomEvent('semantic-ref:updated', {
          detail: { refId, element, metadata: refData.metadata }
        }))
      }
    }
  })
  
  observer.observe(element, {
    attributes: true,
    attributeFilter: ['class', 'id', 'data-semantic', 'data-field']
  })
  
  return () => observer.disconnect()
}

/**
 * v-semantic-ref directive implementation
 */
export const vSemanticRef: Directive<Element, SemanticRefDirectiveBinding['value']> = {
  mounted(el, binding) {
    // Get reference ID from binding or generate one
    const refId = binding.value?.ref || generateRefId()
    const semantic = binding.value?.semantic
    const onRegister = binding.value?.onRegister
    
    // Register the reference
    registerRef(refId, el, semantic, onRegister)
    
    // Set up element observation
    const cleanup: Array<() => void> = []
    cleanup.push(setupElementObservation(el, refId))
    
    // Store reference data for cleanup
    elementRefData.set(el, {
      refId,
      semantic,
      cleanup
    })
    
    // Development mode logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 v-semantic-ref mounted:', {
        refId,
        element: el,
        semantic,
        binding: binding.value
      })
    }
  },
  
  updated(el, binding) {
    const refData = elementRefData.get(el)
    if (!refData) return
    
    // Check if semantic type changed
    const newSemantic = binding.value?.semantic
    if (newSemantic !== refData.semantic) {
      // Update registry
      const registryData = semanticRefRegistry.get(refData.refId)
      if (registryData) {
        registryData.semantic = newSemantic
        
        // Update element attribute
        if (newSemantic) {
          el.setAttribute('data-semantic-ref-type', newSemantic)
        } else {
          el.removeAttribute('data-semantic-ref-type')
        }
        
        // Emit update event
        refEventTarget.dispatchEvent(new CustomEvent('semantic-ref:semantic-changed', {
          detail: { 
            refId: refData.refId, 
            element: el, 
            oldSemantic: refData.semantic,
            newSemantic 
          }
        }))
        
        // Update stored data
        refData.semantic = newSemantic
      }
    }
  },
  
  beforeUnmount(el) {
    const refData = elementRefData.get(el)
    if (refData) {
      // Unregister the reference
      unregisterRef(refData.refId)
      
      // Clean up observers and listeners
      refData.cleanup.forEach(cleanup => cleanup())
      
      // Remove from element data
      elementRefData.delete(el)
    }
  }
}

// Export utility functions for advanced usage
export const semanticRefUtils = {
  /**
   * Get all registered semantic references
   */
  getAllRefs: (): Map<string, { element: Element; semantic?: SemanticType; metadata: Record<string, any> }> => {
    return new Map(semanticRefRegistry)
  },
  
  /**
   * Get reference by ID
   */
  getRef: (refId: string) => {
    return semanticRefRegistry.get(refId) || null
  },
  
  /**
   * Find references by semantic type
   */
  findRefsBySemantic,
  
  /**
   * Find references by custom criteria
   */
  findRefsBy,
  
  /**
   * Get reference ID for element
   */
  getRefId: (element: Element): string | null => {
    const refData = elementRefData.get(element)
    return refData?.refId || null
  },
  
  /**
   * Listen to reference events
   */
  onRefEvent: (
    event: 'registered' | 'unregistered' | 'updated' | 'semantic-changed',
    listener: (detail: any) => void
  ): () => void => {
    const eventName = `semantic-ref:${event}`
    const handler = (e: Event) => listener((e as CustomEvent).detail)
    
    refEventTarget.addEventListener(eventName, handler)
    
    return () => refEventTarget.removeEventListener(eventName, handler)
  },
  
  /**
   * Clear all references (useful for testing)
   */
  clearAllRefs: () => {
    const refIds = Array.from(semanticRefRegistry.keys())
    refIds.forEach(unregisterRef)
  },
  
  /**
   * Get references count by semantic type
   */
  getRefCountBySemantic: (): Record<SemanticType, number> => {
    const counts = {} as Record<SemanticType, number>
    
    semanticRefRegistry.forEach((refData) => {
      if (refData.semantic) {
        counts[refData.semantic] = (counts[refData.semantic] || 0) + 1
      }
    })
    
    return counts
  },
  
  /**
   * Find related references (elements with similar semantics)
   */
  findRelatedRefs: (element: Element): Element[] => {
    const refData = elementRefData.get(element)
    if (!refData?.semantic) return []
    
    return findRefsBySemantic(refData.semantic).filter(el => el !== element)
  }
}