// Utility functions for semantic protocol Vue integration

import type { AnalysisResult, SemanticType, FieldDefinition } from '../types'
import { semanticUtils as coreUtils } from '@semantic-protocol/core'

/**
 * Vue-specific semantic utilities
 */
export const semanticVueUtils = {
  /**
   * Generate CSS classes from analysis result
   */
  generateClasses: (result: AnalysisResult): string[] => {
    const classes: string[] = []
    
    if (result.bestMatch) {
      classes.push(`semantic-${result.bestMatch.semantic}`)
      
      const confidenceLevel = result.bestMatch.confidence >= 90 ? 'high' :
                             result.bestMatch.confidence >= 70 ? 'medium' : 'low'
      classes.push(`semantic-confidence-${confidenceLevel}`)
    }
    
    if (result.renderInstruction.variant) {
      classes.push(`semantic-variant-${result.renderInstruction.variant}`)
    }
    
    return classes
  },
  
  /**
   * Generate data attributes from analysis result
   */
  generateDataAttributes: (result: AnalysisResult): Record<string, string> => {
    const attrs: Record<string, string> = {}
    
    if (result.bestMatch) {
      attrs['data-semantic'] = result.bestMatch.semantic
      attrs['data-confidence'] = result.bestMatch.confidence.toString()
    }
    
    attrs['data-render-component'] = result.renderInstruction.component
    
    if (result.renderInstruction.variant) {
      attrs['data-render-variant'] = result.renderInstruction.variant
    }
    
    return attrs
  },
  
  /**
   * Create Vue reactive field definition from object
   */
  createReactiveField: (name: string, value: any): FieldDefinition => {
    const type = inferVueDataType(value)
    
    return {
      name,
      type,
      value,
      nullable: value === null || value === undefined
    }
  },
  
  /**
   * Extract field definitions from Vue component props
   */
  extractFieldsFromProps: (props: Record<string, any>): FieldDefinition[] => {
    return Object.entries(props).map(([name, value]) => 
      semanticVueUtils.createReactiveField(name, value)
    )
  },
  
  /**
   * Format semantic value for display
   */
  formatSemanticValue: (value: any, semantic: SemanticType): string => {
    switch (semantic) {
      case 'currency':
        if (typeof value === 'number') {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value)
        }
        return String(value)
        
      case 'percentage':
        if (typeof value === 'number') {
          return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }).format(value)
        }
        return String(value)
        
      case 'temporal':
        if (value instanceof Date) {
          return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
          }).format(value)
        }
        if (typeof value === 'string') {
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            return new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }).format(date)
          }
        }
        return String(value)
        
      case 'email':
        return String(value).toLowerCase()
        
      case 'url':
        return String(value)
        
      case 'identifier':
        return String(value).toUpperCase()
        
      default:
        return String(value)
    }
  }
}

/**
 * Infer Vue-compatible data type from value
 */
function inferVueDataType(value: any): FieldDefinition['type'] {
  if (value === null || value === undefined) {
    return 'string'
  }
  
  if (typeof value === 'boolean') {
    return 'boolean'
  }
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'float'
  }
  
  if (typeof value === 'string') {
    // Check for date patterns
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'date'
    }
    
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return 'datetime'
    }
    
    return 'string'
  }
  
  if (value instanceof Date) {
    return 'datetime'
  }
  
  if (Array.isArray(value)) {
    return 'array'
  }
  
  if (typeof value === 'object') {
    return 'object'
  }
  
  return 'string'
}

// Re-export core utilities
export const semanticUtils = coreUtils

// Export type guards
export const isSemanticResult = (obj: any): obj is AnalysisResult => {
  return obj && 
         typeof obj === 'object' &&
         'field' in obj &&
         'dataType' in obj &&
         'semantics' in obj &&
         'bestMatch' in obj &&
         'renderInstruction' in obj
}

export const hasSemanticMatch = (result: AnalysisResult): boolean => {
  return result.bestMatch !== null && result.bestMatch.confidence > 0
}

export const isHighConfidence = (result: AnalysisResult): boolean => {
  return result.bestMatch !== null && result.bestMatch.confidence >= 90
}