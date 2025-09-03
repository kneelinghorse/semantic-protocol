import { ref, reactive, computed, watch, toRefs, unref } from 'vue'
import type { 
  FieldDefinition, 
  DataType, 
  UseDiscoveryReturn, 
  SemanticRelationship,
  MaybeRefOrGetter
} from '../types'
import { useSemanticContext } from './useSemanticContext'

/**
 * Composable for automatic field discovery from data objects
 * Analyzes data structures to extract field definitions and relationships
 */
export function useDiscovery(): UseDiscoveryReturn {
  const { options } = useSemanticContext()
  
  // Reactive state
  const state = reactive({
    fields: [] as FieldDefinition[],
    relationships: [] as SemanticRelationship[],
    isDiscovering: false
  })
  
  /**
   * Infer data type from value
   */
  const inferDataType = (value: any): DataType => {
    if (value === null || value === undefined) {
      return 'string' // Default for null/undefined
    }
    
    if (typeof value === 'boolean') {
      return 'boolean'
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float'
    }
    
    if (typeof value === 'string') {
      // Check for specific string patterns
      if (value.includes('@') && value.includes('.')) {
        return 'string' // Could be email, but type stays string
      }
      
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return 'string' // Could be URL, but type stays string
      }
      
      // Check for date patterns
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(value)) {
        return 'date'
      }
      
      // Check for datetime patterns
      const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      if (datetimeRegex.test(value)) {
        return 'datetime'
      }
      
      // Check for timestamp patterns
      const timestampRegex = /^\d{10}$|^\d{13}$/
      if (timestampRegex.test(value)) {
        return 'timestamp'
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
    
    return 'string' // Fallback
  }
  
  /**
   * Discover field definitions from a data object
   */
  const discover = (data: Record<string, any>): FieldDefinition[] => {
    try {
      state.isDiscovering = true
      
      const fields: FieldDefinition[] = []
      const discoveredRelationships: SemanticRelationship[] = []
      
      for (const [key, value] of Object.entries(data)) {
        const field: FieldDefinition = {
          name: key,
          type: inferDataType(value),
          value,
          nullable: value === null || value === undefined
        }
        
        // Add additional metadata based on key patterns
        if (key.toLowerCase().includes('id') || key.toLowerCase().endsWith('_id')) {
          field.unique = true
          if (key === 'id' || key === 'uuid' || key === 'guid') {
            field.primaryKey = true
          }
        }
        
        // Detect foreign key relationships
        if (key.toLowerCase().endsWith('_id') && key !== 'id') {
          const referencedTable = key.slice(0, -3) // Remove '_id'
          discoveredRelationships.push({
            type: 'association',
            from: key,
            to: referencedTable,
            semantic: 'identifier' as any,
            confidence: 80,
            metadata: { 
              foreignKey: true,
              referencedTable 
            }
          })
          field.foreignKey = true
        }
        
        fields.push(field)
      }
      
      state.fields = fields
      state.relationships = discoveredRelationships
      
      return fields
    } finally {
      state.isDiscovering = false
    }
  }
  
  /**
   * Discover fields from array of objects (schema inference)
   */
  const discoverFromArray = (data: Record<string, any>[]): FieldDefinition[] => {
    if (!data.length) return []
    
    const fieldMap = new Map<string, FieldDefinition>()
    
    // Analyze all objects to build comprehensive schema
    data.forEach((item, index) => {
      const itemFields = discover(item)
      
      itemFields.forEach(field => {
        if (fieldMap.has(field.name)) {
          const existing = fieldMap.get(field.name)!
          
          // Update nullable if any value is null
          if (field.nullable) {
            existing.nullable = true
          }
          
          // Update unique if consistently unique
          if (index === 0) {
            existing.unique = field.unique
          } else if (existing.unique && !field.unique) {
            existing.unique = false
          }
          
          // Check for type consistency
          if (existing.type !== field.type) {
            // Handle type conflicts (e.g., sometimes number, sometimes string)
            if ((existing.type === 'integer' && field.type === 'float') ||
                (existing.type === 'float' && field.type === 'integer')) {
              existing.type = 'number'
            } else if (existing.type !== 'string') {
              existing.type = 'string' // Fallback to string for mixed types
            }
          }
        } else {
          fieldMap.set(field.name, { ...field })
        }
      })
    })
    
    const fields = Array.from(fieldMap.values())
    state.fields = fields
    return fields
  }
  
  return {
    ...toRefs(state),
    discover,
    discoverFromArray
  }
}

/**
 * Composable for reactive field discovery
 * Automatically discovers fields when data changes
 */
export function useReactiveDiscovery(
  dataRef: MaybeRefOrGetter<Record<string, any> | Record<string, any>[]>,
  options?: {
    immediate?: boolean
    debounce?: number
  }
) {
  const { discover, discoverFromArray, fields, relationships, isDiscovering } = useDiscovery()
  
  // Debounced discovery function
  let debounceTimeout: NodeJS.Timeout | null = null
  const debouncedDiscover = (data: any) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    
    debounceTimeout = setTimeout(() => {
      if (Array.isArray(data)) {
        discoverFromArray(data)
      } else {
        discover(data)
      }
    }, options?.debounce || 300)
  }
  
  // Watch for data changes
  watch(
    () => unref(dataRef),
    (data) => {
      if (data) {
        if (options?.debounce) {
          debouncedDiscover(data)
        } else if (Array.isArray(data)) {
          discoverFromArray(data)
        } else {
          discover(data)
        }
      }
    },
    { 
      immediate: options?.immediate ?? true,
      deep: true 
    }
  )
  
  // Computed helpers
  const fieldsByType = computed(() => {
    return fields.value.reduce((groups, field) => {
      if (!groups[field.type]) {
        groups[field.type] = []
      }
      groups[field.type].push(field)
      return groups
    }, {} as Record<DataType, FieldDefinition[]>)
  })
  
  const uniqueFields = computed(() => {
    return fields.value.filter(field => field.unique)
  })
  
  const nullableFields = computed(() => {
    return fields.value.filter(field => field.nullable)
  })
  
  const primaryKeys = computed(() => {
    return fields.value.filter(field => field.primaryKey)
  })
  
  const foreignKeys = computed(() => {
    return fields.value.filter(field => field.foreignKey)
  })
  
  return {
    fields,
    relationships,
    fieldsByType,
    uniqueFields,
    nullableFields,
    primaryKeys,
    foreignKeys,
    isDiscovering,
    discover,
    discoverFromArray
  }
}