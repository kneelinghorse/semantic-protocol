import { ref, computed, reactive, toRefs } from 'vue'
import { semanticUtils } from '@semantic-protocol/core'
import type { 
  AnalysisResult, 
  SemanticRelationship, 
  SemanticType, 
  UseRelationshipsReturn 
} from '../types'

/**
 * Composable for analyzing and managing semantic relationships
 * Identifies patterns and connections between semantic fields
 */
export function useRelationships(): UseRelationshipsReturn {
  // Reactive state
  const state = reactive({
    relationships: [] as SemanticRelationship[]
  })
  
  /**
   * Find relationships between analysis results
   */
  const findRelationships = (results: AnalysisResult[]): SemanticRelationship[] => {
    const relationships: SemanticRelationship[] = []
    
    // Group results by semantic type for easier analysis
    const groupedBySemantic = semanticUtils.groupBySemantics(results)
    
    // Analyze temporal relationships
    const temporalFields = groupedBySemantic.temporal || []
    if (temporalFields.length > 1) {
      // Find created/updated relationships
      const createdField = temporalFields.find(f => 
        f.field.toLowerCase().includes('created') || 
        f.field.toLowerCase().includes('created_at')
      )
      const updatedField = temporalFields.find(f => 
        f.field.toLowerCase().includes('updated') || 
        f.field.toLowerCase().includes('modified') ||
        f.field.toLowerCase().includes('updated_at')
      )
      
      if (createdField && updatedField) {
        relationships.push({
          type: 'composition',
          from: updatedField.field,
          to: createdField.field,
          semantic: 'temporal',
          confidence: 90,
          metadata: {
            pattern: 'audit_trail',
            description: 'Update timestamp depends on creation timestamp'
          }
        })
      }
    }
    
    // Analyze identifier relationships
    const identifierFields = groupedBySemantic.identifier || []
    identifierFields.forEach(field => {
      if (field.field.toLowerCase().endsWith('_id') && field.field !== 'id') {
        const referencedEntity = field.field.slice(0, -3)
        relationships.push({
          type: 'association',
          from: field.field,
          to: 'id',
          semantic: 'identifier',
          confidence: 85,
          metadata: {
            pattern: 'foreign_key',
            referencedEntity,
            description: `References ${referencedEntity} entity`
          }
        })
      }
    })
    
    // Analyze currency and percentage relationships
    const currencyFields = groupedBySemantic.currency || []
    const percentageFields = groupedBySemantic.percentage || []
    
    if (currencyFields.length > 0 && percentageFields.length > 0) {
      currencyFields.forEach(currencyField => {
        percentageFields.forEach(percentageField => {
          // Look for tax, discount, or fee relationships
          if (percentageField.field.toLowerCase().includes('tax') ||
              percentageField.field.toLowerCase().includes('discount') ||
              percentageField.field.toLowerCase().includes('fee')) {
            relationships.push({
              type: 'dependency',
              from: currencyField.field,
              to: percentageField.field,
              semantic: 'currency',
              confidence: 75,
              metadata: {
                pattern: 'financial_calculation',
                description: `${currencyField.field} may be calculated using ${percentageField.field}`
              }
            })
          }
        })
      })
    }
    
    // Analyze status and premium relationships
    const statusFields = groupedBySemantic.status || []
    const premiumFields = groupedBySemantic.premium || []
    
    if (statusFields.length > 0 && premiumFields.length > 0) {
      statusFields.forEach(statusField => {
        premiumFields.forEach(premiumField => {
          relationships.push({
            type: 'dependency',
            from: statusField.field,
            to: premiumField.field,
            semantic: 'status',
            confidence: 70,
            metadata: {
              pattern: 'access_control',
              description: `${statusField.field} may depend on ${premiumField.field} tier`
            }
          })
        })
      })
    }
    
    // Analyze composition relationships (fields that belong to the same entity)
    const fieldsWithSimilarPrefixes = findFieldsWithSimilarPrefixes(results)
    fieldsWithSimilarPrefixes.forEach(group => {
      if (group.fields.length > 1) {
        const primaryField = group.fields[0]
        group.fields.slice(1).forEach(field => {
          relationships.push({
            type: 'composition',
            from: field.field,
            to: primaryField.field,
            semantic: field.bestMatch?.semantic || 'identifier',
            confidence: 60,
            metadata: {
              pattern: 'entity_composition',
              prefix: group.prefix,
              description: `Both fields belong to ${group.prefix} entity`
            }
          })
        })
      }
    })
    
    // Analyze inheritance relationships (fields with similar semantics)
    const semanticGroups = Object.values(groupedBySemantic)
    semanticGroups.forEach(group => {
      if (group.length > 2) {
        // Find potential parent-child relationships based on field names
        const parentField = group.find(f => 
          !f.field.includes('_') || 
          f.field.split('_').length === 2
        )
        
        if (parentField) {
          group.filter(f => f !== parentField).forEach(childField => {
            if (childField.field.includes(parentField.field) ||
                childField.field.startsWith(parentField.field.split('_')[0])) {
              relationships.push({
                type: 'inheritance',
                from: childField.field,
                to: parentField.field,
                semantic: parentField.bestMatch?.semantic || 'identifier',
                confidence: 65,
                metadata: {
                  pattern: 'semantic_inheritance',
                  description: `${childField.field} inherits semantic properties from ${parentField.field}`
                }
              })
            }
          })
        }
      }
    })
    
    state.relationships = relationships
    return relationships
  }
  
  /**
   * Find fields with similar prefixes (indicating entity relationships)
   */
  const findFieldsWithSimilarPrefixes = (results: AnalysisResult[]) => {
    const prefixGroups: { prefix: string; fields: AnalysisResult[] }[] = []
    const prefixMap = new Map<string, AnalysisResult[]>()
    
    results.forEach(result => {
      const parts = result.field.split('_')
      if (parts.length > 1) {
        const prefix = parts[0]
        if (!prefixMap.has(prefix)) {
          prefixMap.set(prefix, [])
        }
        prefixMap.get(prefix)!.push(result)
      }
    })
    
    prefixMap.forEach((fields, prefix) => {
      if (fields.length > 1) {
        prefixGroups.push({ prefix, fields })
      }
    })
    
    return prefixGroups
  }
  
  // Computed properties for grouped results
  const groupedResults = computed(() => {
    const results: AnalysisResult[] = []
    // This would typically come from a parent composable or prop
    // For now, return empty to maintain type compatibility
    return semanticUtils.groupBySemantics(results)
  })
  
  // Computed helpers for relationship analysis
  const relationshipsByType = computed(() => {
    return state.relationships.reduce((groups, rel) => {
      if (!groups[rel.type]) {
        groups[rel.type] = []
      }
      groups[rel.type].push(rel)
      return groups
    }, {} as Record<string, SemanticRelationship[]>)
  })
  
  const strongRelationships = computed(() => {
    return state.relationships.filter(rel => rel.confidence >= 80)
  })
  
  const relationshipPatterns = computed(() => {
    const patterns = new Map<string, number>()
    state.relationships.forEach(rel => {
      const pattern = rel.metadata?.pattern
      if (pattern) {
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1)
      }
    })
    return Object.fromEntries(patterns)
  })
  
  return {
    ...toRefs(state),
    findRelationships,
    groupedResults,
    relationshipsByType,
    strongRelationships,
    relationshipPatterns
  }
}

/**
 * Composable for advanced relationship analysis
 * Provides more sophisticated relationship detection algorithms
 */
export function useAdvancedRelationships() {
  const { findRelationships, relationships } = useRelationships()
  
  /**
   * Analyze temporal sequences in data
   */
  const analyzeTemporalSequence = (results: AnalysisResult[]): SemanticRelationship[] => {
    const temporalFields = results.filter(r => r.bestMatch?.semantic === 'temporal')
    const sequenceRelationships: SemanticRelationship[] = []
    
    // Common temporal sequences
    const sequences = [
      ['created_at', 'updated_at'],
      ['start_date', 'end_date'],
      ['published_at', 'archived_at'],
      ['opened_at', 'closed_at']
    ]
    
    sequences.forEach(sequence => {
      const sequenceFields = sequence.map(fieldName => 
        temporalFields.find(f => f.field.toLowerCase().includes(fieldName.toLowerCase()))
      ).filter(Boolean) as AnalysisResult[]
      
      if (sequenceFields.length === 2) {
        sequenceRelationships.push({
          type: 'composition',
          from: sequenceFields[1].field,
          to: sequenceFields[0].field,
          semantic: 'temporal',
          confidence: 95,
          metadata: {
            pattern: 'temporal_sequence',
            sequence: sequence.join(' -> '),
            description: `${sequenceFields[1].field} occurs after ${sequenceFields[0].field}`
          }
        })
      }
    })
    
    return sequenceRelationships
  }
  
  /**
   * Detect hierarchical relationships
   */
  const detectHierarchy = (results: AnalysisResult[]): SemanticRelationship[] => {
    const hierarchicalRelationships: SemanticRelationship[] = []
    
    // Look for parent/child patterns
    const parentFields = results.filter(r => 
      r.field.toLowerCase().includes('parent') ||
      r.field.toLowerCase().includes('root') ||
      r.field.toLowerCase().includes('top')
    )
    
    const childFields = results.filter(r =>
      r.field.toLowerCase().includes('child') ||
      r.field.toLowerCase().includes('sub') ||
      r.field.toLowerCase().includes('nested')
    )
    
    parentFields.forEach(parent => {
      childFields.forEach(child => {
        hierarchicalRelationships.push({
          type: 'inheritance',
          from: child.field,
          to: parent.field,
          semantic: parent.bestMatch?.semantic || 'identifier',
          confidence: 80,
          metadata: {
            pattern: 'hierarchy',
            description: `${child.field} is a child of ${parent.field}`
          }
        })
      })
    })
    
    return hierarchicalRelationships
  }
  
  return {
    relationships,
    analyzeTemporalSequence,
    detectHierarchy,
    findRelationships
  }
}