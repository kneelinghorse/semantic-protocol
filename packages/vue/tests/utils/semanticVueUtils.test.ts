import { describe, it, expect } from 'vitest'
import { semanticVueUtils } from '../../src/utils'
import type { AnalysisResult } from '../../src/types'

describe('semanticVueUtils', () => {
  const mockAnalysisResult: AnalysisResult = {
    field: 'user_email',
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
      variant: 'email',
      props: { type: 'email' }
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
  }

  describe('generateClasses', () => {
    it('should generate semantic CSS classes', () => {
      const classes = semanticVueUtils.generateClasses(mockAnalysisResult)

      expect(classes).toContain('semantic-email')
      expect(classes).toContain('semantic-confidence-high')
      expect(classes).toContain('semantic-variant-email')
    })

    it('should handle medium confidence', () => {
      const mediumConfidenceResult = {
        ...mockAnalysisResult,
        bestMatch: {
          ...mockAnalysisResult.bestMatch!,
          confidence: 75
        }
      }

      const classes = semanticVueUtils.generateClasses(mediumConfidenceResult)

      expect(classes).toContain('semantic-confidence-medium')
    })

    it('should handle low confidence', () => {
      const lowConfidenceResult = {
        ...mockAnalysisResult,
        bestMatch: {
          ...mockAnalysisResult.bestMatch!,
          confidence: 65
        }
      }

      const classes = semanticVueUtils.generateClasses(lowConfidenceResult)

      expect(classes).toContain('semantic-confidence-low')
    })

    it('should handle no semantic match', () => {
      const noMatchResult = {
        ...mockAnalysisResult,
        bestMatch: null
      }

      const classes = semanticVueUtils.generateClasses(noMatchResult)

      expect(classes).toHaveLength(0)
    })

    it('should handle no variant', () => {
      const noVariantResult = {
        ...mockAnalysisResult,
        renderInstruction: {
          component: 'input'
        }
      }

      const classes = semanticVueUtils.generateClasses(noVariantResult)

      expect(classes).toContain('semantic-email')
      expect(classes).toContain('semantic-confidence-high')
      expect(classes).not.toContain('semantic-variant-')
    })
  })

  describe('generateDataAttributes', () => {
    it('should generate data attributes from analysis result', () => {
      const attrs = semanticVueUtils.generateDataAttributes(mockAnalysisResult)

      expect(attrs).toEqual({
        'data-semantic': 'email',
        'data-confidence': '95',
        'data-render-component': 'input',
        'data-render-variant': 'email'
      })
    })

    it('should handle no semantic match', () => {
      const noMatchResult = {
        ...mockAnalysisResult,
        bestMatch: null
      }

      const attrs = semanticVueUtils.generateDataAttributes(noMatchResult)

      expect(attrs).toEqual({
        'data-render-component': 'input'
      })
    })

    it('should handle no variant', () => {
      const noVariantResult = {
        ...mockAnalysisResult,
        renderInstruction: {
          component: 'input'
        }
      }

      const attrs = semanticVueUtils.generateDataAttributes(noVariantResult)

      expect(attrs).toEqual({
        'data-semantic': 'email',
        'data-confidence': '95',
        'data-render-component': 'input'
      })
    })
  })

  describe('createReactiveField', () => {
    it('should create field definition from name and value', () => {
      const field = semanticVueUtils.createReactiveField('user_email', 'test@example.com')

      expect(field).toEqual({
        name: 'user_email',
        type: 'string',
        value: 'test@example.com',
        nullable: false
      })
    })

    it('should handle null values', () => {
      const field = semanticVueUtils.createReactiveField('description', null)

      expect(field.nullable).toBe(true)
      expect(field.type).toBe('string')
    })

    it('should infer numeric types', () => {
      const intField = semanticVueUtils.createReactiveField('count', 42)
      expect(intField.type).toBe('integer')

      const floatField = semanticVueUtils.createReactiveField('price', 29.99)
      expect(floatField.type).toBe('float')
    })

    it('should infer boolean type', () => {
      const field = semanticVueUtils.createReactiveField('is_active', true)

      expect(field.type).toBe('boolean')
    })

    it('should infer date types', () => {
      const dateField = semanticVueUtils.createReactiveField('birthday', '1990-05-15')
      expect(dateField.type).toBe('date')

      const datetimeField = semanticVueUtils.createReactiveField('created_at', '2024-01-01T10:30:00Z')
      expect(datetimeField.type).toBe('datetime')

      const dateObjectField = semanticVueUtils.createReactiveField('now', new Date())
      expect(dateObjectField.type).toBe('datetime')
    })
  })

  describe('extractFieldsFromProps', () => {
    it('should extract field definitions from Vue props', () => {
      const props = {
        userId: 'USR_001',
        email: 'test@example.com',
        isActive: true,
        price: 29.99,
        createdAt: '2024-01-01T10:30:00Z'
      }

      const fields = semanticVueUtils.extractFieldsFromProps(props)

      expect(fields).toHaveLength(5)

      const emailField = fields.find(f => f.name === 'email')
      expect(emailField?.type).toBe('string')
      expect(emailField?.value).toBe('test@example.com')

      const priceField = fields.find(f => f.name === 'price')
      expect(priceField?.type).toBe('float')

      const activeField = fields.find(f => f.name === 'isActive')
      expect(activeField?.type).toBe('boolean')
    })
  })

  describe('formatSemanticValue', () => {
    it('should format currency values', () => {
      const formatted = semanticVueUtils.formatSemanticValue(29.99, 'currency')
      expect(formatted).toBe('$29.99')

      const formattedString = semanticVueUtils.formatSemanticValue('29.99', 'currency')
      expect(formattedString).toBe('29.99')
    })

    it('should format percentage values', () => {
      const formatted = semanticVueUtils.formatSemanticValue(0.15, 'percentage')
      expect(formatted).toBe('15%')

      const formattedString = semanticVueUtils.formatSemanticValue('0.15', 'percentage')
      expect(formattedString).toBe('0.15')
    })

    it('should format temporal values', () => {
      const date = new Date('2024-01-01T10:30:00Z')
      const formatted = semanticVueUtils.formatSemanticValue(date, 'temporal')
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('2024')

      const dateString = '2024-01-01T10:30:00Z'
      const formattedString = semanticVueUtils.formatSemanticValue(dateString, 'temporal')
      expect(formattedString).toContain('2024')

      const invalidDate = 'invalid-date'
      const formattedInvalid = semanticVueUtils.formatSemanticValue(invalidDate, 'temporal')
      expect(formattedInvalid).toBe('invalid-date')
    })

    it('should format email values', () => {
      const formatted = semanticVueUtils.formatSemanticValue('TEST@EXAMPLE.COM', 'email')
      expect(formatted).toBe('test@example.com')
    })

    it('should format URL values', () => {
      const url = 'https://example.com'
      const formatted = semanticVueUtils.formatSemanticValue(url, 'url')
      expect(formatted).toBe(url)
    })

    it('should format identifier values', () => {
      const formatted = semanticVueUtils.formatSemanticValue('usr_001', 'identifier')
      expect(formatted).toBe('USR_001')
    })

    it('should handle unknown semantic types', () => {
      const formatted = semanticVueUtils.formatSemanticValue('test', 'unknown' as any)
      expect(formatted).toBe('test')
    })

    it('should handle null and undefined values', () => {
      const formattedNull = semanticVueUtils.formatSemanticValue(null, 'currency')
      expect(formattedNull).toBe('null')

      const formattedUndefined = semanticVueUtils.formatSemanticValue(undefined, 'currency')
      expect(formattedUndefined).toBe('undefined')
    })
  })

  describe('type inference', () => {
    it('should infer data types correctly', () => {
      // Test various value types and their inferred types
      const testCases = [
        { value: 'hello', expected: 'string' },
        { value: 42, expected: 'integer' },
        { value: 3.14, expected: 'float' },
        { value: true, expected: 'boolean' },
        { value: false, expected: 'boolean' },
        { value: '2024-01-01', expected: 'date' },
        { value: '2024-01-01T10:30:00Z', expected: 'datetime' },
        { value: new Date(), expected: 'datetime' },
        { value: ['a', 'b'], expected: 'array' },
        { value: { a: 1 }, expected: 'object' },
        { value: null, expected: 'string' },
        { value: undefined, expected: 'string' }
      ]

      testCases.forEach(({ value, expected }) => {
        const field = semanticVueUtils.createReactiveField('test', value)
        expect(field.type).toBe(expected)
      })
    })
  })
})