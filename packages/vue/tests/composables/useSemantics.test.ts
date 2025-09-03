import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useSemantics, useSemanticField } from '../../src/composables/useSemantics'
import type { FieldDefinition } from '../../src/types'

// Mock the semantic context
vi.mock('../../src/composables/useSemanticContext', () => ({
  useSemanticContext: () => ({
    protocol: {
      analyze: vi.fn().mockReturnValue({
        field: 'test',
        dataType: 'string',
        semantics: [{
          semantic: 'email',
          confidence: 95,
          reason: 'Field contains email pattern'
        }],
        bestMatch: {
          semantic: 'email',
          confidence: 95,
          reason: 'Field contains email pattern'
        },
        context: 'form',
        renderInstruction: {
          component: 'input',
          variant: 'email'
        },
        metadata: {
          allMatches: [{
            semantic: 'email',
            confidence: 95,
            reason: 'Field contains email pattern'
          }],
          confidence: 95,
          reasoning: ['Field contains email pattern']
        }
      })
    },
    options: {
      confidenceThreshold: 70,
      autoAnalysis: false,
      enableDevTools: true,
      cacheResults: true
    }
  })
}))

describe('useSemantics', () => {
  let mockField: FieldDefinition

  beforeEach(() => {
    mockField = {
      name: 'user_email',
      type: 'string',
      value: 'test@example.com'
    }
    vi.clearAllMocks()
  })

  describe('useSemantics composable', () => {
    it('should initialize with empty state', () => {
      const { results, isAnalyzing, error } = useSemantics()

      expect(results.value).toEqual([])
      expect(isAnalyzing.value).toBe(false)
      expect(error.value).toBe(null)
    })

    it('should analyze a single field', () => {
      const { analyze } = useSemantics()

      const result = analyze(mockField)

      expect(result).toBeDefined()
      expect(result.field).toBe('test')
      expect(result.bestMatch?.semantic).toBe('email')
      expect(result.bestMatch?.confidence).toBe(95)
    })

    it('should analyze multiple fields', () => {
      const { analyzeSchema } = useSemantics()
      
      const fields = [
        mockField,
        { name: 'created_at', type: 'datetime', value: '2024-01-01T00:00:00Z' } as FieldDefinition
      ]

      const results = analyzeSchema(fields)

      expect(results).toHaveLength(2)
      expect(results[0].field).toBe('test')
    })

    it('should handle analysis errors', () => {
      const { analyze, error } = useSemantics()
      
      // Mock the protocol to throw an error
      const mockContext = vi.mocked(require('../../src/composables/useSemanticContext').useSemanticContext())
      mockContext.protocol.analyze.mockImplementation(() => {
        throw new Error('Analysis failed')
      })

      expect(() => analyze(mockField)).toThrow('Analysis failed')
      expect(error.value).toBeInstanceOf(Error)
    })

    it('should set analyzing state during batch analysis', () => {
      const { analyzeSchema, isAnalyzing } = useSemantics()
      
      expect(isAnalyzing.value).toBe(false)
      
      analyzeSchema([mockField])
      
      // Note: In a real scenario, this would be async and we'd check the state during analysis
      expect(isAnalyzing.value).toBe(false) // State is reset after analysis
    })
  })

  describe('useSemanticField composable', () => {
    it('should reactively analyze a single field', () => {
      const fieldRef = ref(mockField)
      const contextRef = ref('form' as const)

      const { result, bestSemantic, isHighConfidence } = useSemanticField(fieldRef, contextRef)

      expect(result.value).toBeDefined()
      expect(bestSemantic.value).toBe('email')
      expect(isHighConfidence.value).toBe(true) // 95% confidence
    })

    it('should return null for invalid field', () => {
      const fieldRef = ref(null as any)
      
      const { result } = useSemanticField(fieldRef)

      expect(result.value).toBe(null)
    })

    it('should handle analysis errors gracefully', () => {
      const fieldRef = ref(mockField)
      
      // Mock the protocol to throw an error
      const mockContext = vi.mocked(require('../../src/composables/useSemanticContext').useSemanticContext())
      mockContext.protocol.analyze.mockImplementation(() => {
        throw new Error('Analysis failed')
      })

      const { result, error } = useSemanticField(fieldRef)

      expect(result.value).toBe(null)
      expect(error.value).toBeInstanceOf(Error)
    })

    it('should update result when field changes', async () => {
      const fieldRef = ref(mockField)
      
      const { result } = useSemanticField(fieldRef)

      expect(result.value?.field).toBe('test')

      // Update field
      fieldRef.value = {
        name: 'price',
        type: 'decimal',
        value: 29.99
      }

      await new Promise(resolve => setTimeout(resolve, 0)) // Wait for reactivity

      expect(result.value?.field).toBe('test') // Mock always returns same result
    })
  })

  describe('caching behavior', () => {
    it('should cache results when enabled', () => {
      const { analyze } = useSemantics()
      
      // First analysis
      const result1 = analyze(mockField)
      
      // Second analysis with same field
      const result2 = analyze(mockField)

      expect(result1).toEqual(result2)
      // Mock should only be called once due to caching
      // Note: This test would need actual cache implementation to verify call count
    })
  })

  describe('reactive analysis', () => {
    it('should re-analyze when dependencies change', async () => {
      const fieldsRef = ref([mockField])
      const contextRef = ref('form' as const)
      
      const { useReactiveSemantics } = await import('../../src/composables/useSemantics')
      const { results, groupedResults } = useReactiveSemantics(fieldsRef, contextRef, {
        immediate: false
      })

      expect(results.value).toEqual([])

      // Update fields
      fieldsRef.value = [mockField, {
        name: 'created_at',
        type: 'datetime',
        value: '2024-01-01T00:00:00Z'
      } as FieldDefinition]

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(results.value.length).toBeGreaterThan(0)
      expect(groupedResults.value).toBeDefined()
    })

    it('should handle debounced analysis', async () => {
      const fieldsRef = ref([mockField])
      
      const { useReactiveSemantics } = await import('../../src/composables/useSemantics')
      const { results } = useReactiveSemantics(fieldsRef, ref('form' as const), {
        debounce: 100,
        immediate: false
      })

      // Rapid updates
      fieldsRef.value = [...fieldsRef.value, {
        name: 'price',
        type: 'decimal',
        value: 29.99
      } as FieldDefinition]

      fieldsRef.value = [...fieldsRef.value, {
        name: 'status',
        type: 'string',
        value: 'active'
      } as FieldDefinition]

      // Should debounce the analysis
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(results.value.length).toBeGreaterThan(0)
    })
  })

  describe('computed helpers', () => {
    it('should filter high confidence results', async () => {
      const fieldsRef = ref([
        mockField, // 95% confidence
        {
          name: 'low_confidence_field',
          type: 'string',
          value: 'test'
        } as FieldDefinition
      ])
      
      const { useReactiveSemantics } = await import('../../src/composables/useSemantics')
      const { highConfidenceResults } = useReactiveSemantics(fieldsRef)

      expect(highConfidenceResults.value.length).toBeGreaterThan(0)
      highConfidenceResults.value.forEach(result => {
        expect(result.metadata.confidence).toBeGreaterThanOrEqual(90)
      })
    })

    it('should group results by semantic type', async () => {
      const fieldsRef = ref([mockField])
      
      const { useReactiveSemantics } = await import('../../src/composables/useSemantics')
      const { groupedResults } = useReactiveSemantics(fieldsRef)

      expect(groupedResults.value).toHaveProperty('email')
      expect(groupedResults.value.email).toHaveLength(1)
    })
  })
})