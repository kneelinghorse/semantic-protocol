/**
 * Pinia store integration example for Semantic Protocol
 * Demonstrates how to integrate semantic analysis with state management
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SemanticProtocol } from '@kneelinghorse/semantic-protocol'
import type { 
  AnalysisResult, 
  FieldDefinition, 
  RenderContext, 
  SemanticRelationship,
  SemanticType 
} from '../src/types'

// Store state interface
interface UserProfile {
  id: string
  email: string
  username: string
  website_url?: string
  monthly_price: number
  discount_rate: number
  is_premium: boolean
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'pending'
  account_status: 'verified' | 'pending' | 'suspended'
  created_at: string
  updated_at: string
  last_login_at?: string
}

interface SemanticAnalysisState {
  results: Map<string, AnalysisResult>
  relationships: SemanticRelationship[]
  isAnalyzing: boolean
  lastAnalyzed: Date | null
  cache: Map<string, AnalysisResult>
}

/**
 * Main semantic store for managing semantic analysis state
 */
export const useSemanticStore = defineStore('semantic', () => {
  // Core semantic protocol instance
  const protocol = new SemanticProtocol(70)
  
  // Analysis state
  const analysisState = ref<SemanticAnalysisState>({
    results: new Map(),
    relationships: [],
    isAnalyzing: false,
    lastAnalyzed: null,
    cache: new Map()
  })
  
  // Sample user data
  const users = ref<UserProfile[]>([
    {
      id: 'USR_001',
      email: 'alice@example.com',
      username: 'alice_dev',
      website_url: 'https://alice.dev',
      monthly_price: 29.99,
      discount_rate: 0.15,
      is_premium: true,
      subscription_status: 'active',
      account_status: 'verified',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-02-01T15:45:00Z',
      last_login_at: '2024-02-01T09:20:00Z'
    },
    {
      id: 'USR_002',
      email: 'bob@company.com',
      username: 'bob_user',
      website_url: 'https://bobsite.com',
      monthly_price: 19.99,
      discount_rate: 0.10,
      is_premium: false,
      subscription_status: 'active',
      account_status: 'pending',
      created_at: '2024-02-01T14:20:00Z',
      updated_at: '2024-02-01T14:25:00Z',
      last_login_at: '2024-02-01T16:10:00Z'
    },
    {
      id: 'USR_003',
      email: 'charlie@startup.io',
      username: 'charlie_founder',
      monthly_price: 49.99,
      discount_rate: 0.20,
      is_premium: true,
      subscription_status: 'cancelled',
      account_status: 'suspended',
      created_at: '2023-12-01T08:15:00Z',
      updated_at: '2024-01-15T12:30:00Z',
      last_login_at: '2024-01-10T11:45:00Z'
    }
  ])
  
  // Current context for analysis
  const currentContext = ref<RenderContext>('list')
  
  // Computed properties
  const analysisResults = computed(() => 
    Array.from(analysisState.value.results.values())
  )
  
  const resultsByField = computed(() => {
    const byField: Record<string, AnalysisResult> = {}
    analysisState.value.results.forEach((result, key) => {
      byField[key] = result
    })
    return byField
  })
  
  const resultsBySemantic = computed(() => {
    const bySemantic: Record<SemanticType, AnalysisResult[]> = {} as Record<SemanticType, AnalysisResult[]>
    
    analysisState.value.results.forEach((result) => {
      if (result.bestMatch) {
        const semantic = result.bestMatch.semantic
        if (!bySemantic[semantic]) {
          bySemantic[semantic] = []
        }
        bySemantic[semantic].push(result)
      }
    })
    
    return bySemantic
  })
  
  const highConfidenceResults = computed(() => 
    analysisResults.value.filter(result => 
      result.bestMatch && result.bestMatch.confidence >= 90
    )
  )
  
  const userFields = computed(() => {
    if (users.value.length === 0) return []
    
    const firstUser = users.value[0]
    return Object.entries(firstUser).map(([key, value]): FieldDefinition => ({
      name: key,
      type: inferDataType(value),
      value,
      nullable: value === null || value === undefined
    }))
  })
  
  // Helper to infer data type
  const inferDataType = (value: any): FieldDefinition['type'] => {
    if (value === null || value === undefined) return 'string'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'decimal'
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'datetime'
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
      return 'string'
    }
    return 'string'
  }
  
  // Actions
  const analyzeField = async (field: FieldDefinition, context: RenderContext = currentContext.value): Promise<AnalysisResult> => {
    const cacheKey = `${field.name}_${field.type}_${context}_${JSON.stringify(field.value)}`
    
    // Check cache first
    if (analysisState.value.cache.has(cacheKey)) {
      const cachedResult = analysisState.value.cache.get(cacheKey)!
      analysisState.value.results.set(field.name, cachedResult)
      return cachedResult
    }
    
    analysisState.value.isAnalyzing = true
    
    try {
      const result = protocol.analyze(field, context)
      
      // Cache the result
      analysisState.value.cache.set(cacheKey, result)
      analysisState.value.results.set(field.name, result)
      
      return result
    } finally {
      analysisState.value.isAnalyzing = false
    }
  }
  
  const analyzeSchema = async (fields: FieldDefinition[], context: RenderContext = currentContext.value): Promise<AnalysisResult[]> => {
    analysisState.value.isAnalyzing = true
    
    try {
      const results = await Promise.all(
        fields.map(field => analyzeField(field, context))
      )
      
      // Find relationships
      analysisState.value.relationships = findRelationships(results)
      analysisState.value.lastAnalyzed = new Date()
      
      return results
    } finally {
      analysisState.value.isAnalyzing = false
    }
  }
  
  const analyzeUsers = async (context: RenderContext = currentContext.value) => {
    if (userFields.value.length > 0) {
      return await analyzeSchema(userFields.value, context)
    }
    return []
  }
  
  const findRelationships = (results: AnalysisResult[]): SemanticRelationship[] => {
    const relationships: SemanticRelationship[] = []
    
    // Find temporal relationships
    const temporalFields = results.filter(r => r.bestMatch?.semantic === 'temporal')
    if (temporalFields.length > 1) {
      const createdField = temporalFields.find(f => f.field.includes('created'))
      const updatedField = temporalFields.find(f => f.field.includes('updated'))
      
      if (createdField && updatedField) {
        relationships.push({
          type: 'composition',
          from: updatedField.field,
          to: createdField.field,
          semantic: 'temporal',
          confidence: 90,
          metadata: { pattern: 'audit_trail' }
        })
      }
    }
    
    // Find currency relationships
    const currencyFields = results.filter(r => r.bestMatch?.semantic === 'currency')
    const percentageFields = results.filter(r => r.bestMatch?.semantic === 'percentage')
    
    if (currencyFields.length > 0 && percentageFields.length > 0) {
      currencyFields.forEach(currencyField => {
        percentageFields.forEach(percentageField => {
          if (percentageField.field.includes('discount') || percentageField.field.includes('rate')) {
            relationships.push({
              type: 'dependency',
              from: currencyField.field,
              to: percentageField.field,
              semantic: 'currency',
              confidence: 75,
              metadata: { pattern: 'pricing_calculation' }
            })
          }
        })
      })
    }
    
    // Find status relationships
    const statusFields = results.filter(r => r.bestMatch?.semantic === 'status')
    const premiumFields = results.filter(r => r.bestMatch?.semantic === 'premium')
    
    if (statusFields.length > 0 && premiumFields.length > 0) {
      statusFields.forEach(statusField => {
        premiumFields.forEach(premiumField => {
          relationships.push({
            type: 'dependency',
            from: statusField.field,
            to: premiumField.field,
            semantic: 'status',
            confidence: 70,
            metadata: { pattern: 'access_control' }
          })
        })
      })
    }
    
    return relationships
  }
  
  const clearCache = () => {
    analysisState.value.cache.clear()
    analysisState.value.results.clear()
    analysisState.value.relationships = []
  }
  
  const setContext = (context: RenderContext) => {
    currentContext.value = context
  }
  
  // User management actions
  const addUser = (user: UserProfile) => {
    users.value.push(user)
  }
  
  const updateUser = (userId: string, updates: Partial<UserProfile>) => {
    const userIndex = users.value.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      users.value[userIndex] = { ...users.value[userIndex], ...updates }
    }
  }
  
  const removeUser = (userId: string) => {
    const userIndex = users.value.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      users.value.splice(userIndex, 1)
    }
  }
  
  const getUserById = (userId: string) => {
    return users.value.find(u => u.id === userId)
  }
  
  const getUsersBySemantic = (semantic: SemanticType, fieldName: string) => {
    return users.value.filter(user => {
      const result = analysisState.value.results.get(fieldName)
      return result?.bestMatch?.semantic === semantic
    })
  }
  
  return {
    // State
    users,
    currentContext,
    analysisState,
    
    // Computed
    analysisResults,
    resultsByField,
    resultsBySemantic,
    highConfidenceResults,
    userFields,
    
    // Actions
    analyzeField,
    analyzeSchema,
    analyzeUsers,
    clearCache,
    setContext,
    
    // User management
    addUser,
    updateUser,
    removeUser,
    getUserById,
    getUsersBySemantic,
    
    // Utilities
    protocol
  }
})

/**
 * Specialized store for form semantic analysis
 */
export const useSemanticFormStore = defineStore('semanticForm', () => {
  const mainStore = useSemanticStore()
  
  // Form-specific state
  const formData = ref<Partial<UserProfile>>({})
  const formErrors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)
  
  // Form validation based on semantic analysis
  const validateField = (fieldName: string, value: any): string | null => {
    const result = mainStore.resultsByField[fieldName]
    if (!result) return null
    
    const semantic = result.bestMatch?.semantic
    
    switch (semantic) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format'
        }
        break
      case 'url':
        if (value && !/^https?:\/\/.+/.test(value)) {
          return 'Invalid URL format'
        }
        break
      case 'currency':
        if (value && (isNaN(value) || value < 0)) {
          return 'Invalid currency amount'
        }
        break
      case 'percentage':
        if (value && (isNaN(value) || value < 0 || value > 1)) {
          return 'Percentage must be between 0 and 1'
        }
        break
    }
    
    return null
  }
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    Object.entries(formData.value).forEach(([fieldName, value]) => {
      const error = validateField(fieldName, value)
      if (error) {
        errors[fieldName] = error
      }
    })
    
    formErrors.value = errors
    return Object.keys(errors).length === 0
  }
  
  const submitForm = async (): Promise<boolean> => {
    isSubmitting.value = true
    
    try {
      if (!validateForm()) {
        return false
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Add to main store
      if (formData.value.id) {
        mainStore.updateUser(formData.value.id, formData.value)
      } else {
        const newUser: UserProfile = {
          ...formData.value,
          id: `USR_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as UserProfile
        
        mainStore.addUser(newUser)
      }
      
      return true
    } finally {
      isSubmitting.value = false
    }
  }
  
  const resetForm = () => {
    formData.value = {}
    formErrors.value = {}
  }
  
  return {
    formData,
    formErrors,
    isSubmitting,
    validateField,
    validateForm,
    submitForm,
    resetForm
  }
})

/**
 * Store for managing semantic relationships and insights
 */
export const useSemanticInsightsStore = defineStore('semanticInsights', () => {
  const mainStore = useSemanticStore()
  
  const insights = computed(() => {
    const results = mainStore.analysisResults
    const relationships = mainStore.analysisState.relationships
    
    return {
      totalFields: results.length,
      analyzedFields: results.filter(r => r.bestMatch).length,
      highConfidenceFields: results.filter(r => r.bestMatch && r.bestMatch.confidence >= 90).length,
      relationshipsFound: relationships.length,
      semanticCoverage: results.length > 0 ? (results.filter(r => r.bestMatch).length / results.length) * 100 : 0,
      mostCommonSemantic: getMostCommonSemantic(results),
      confidenceDistribution: getConfidenceDistribution(results)
    }
  })
  
  const getMostCommonSemantic = (results: AnalysisResult[]): SemanticType | null => {
    const counts = new Map<SemanticType, number>()
    
    results.forEach(result => {
      if (result.bestMatch) {
        const semantic = result.bestMatch.semantic
        counts.set(semantic, (counts.get(semantic) || 0) + 1)
      }
    })
    
    let maxCount = 0
    let mostCommon: SemanticType | null = null
    
    counts.forEach((count, semantic) => {
      if (count > maxCount) {
        maxCount = count
        mostCommon = semantic
      }
    })
    
    return mostCommon
  }
  
  const getConfidenceDistribution = (results: AnalysisResult[]) => {
    const distribution = { high: 0, medium: 0, low: 0, none: 0 }
    
    results.forEach(result => {
      if (!result.bestMatch) {
        distribution.none++
      } else {
        const confidence = result.bestMatch.confidence
        if (confidence >= 90) distribution.high++
        else if (confidence >= 70) distribution.medium++
        else distribution.low++
      }
    })
    
    return distribution
  }
  
  return {
    insights,
    getMostCommonSemantic,
    getConfidenceDistribution
  }
})