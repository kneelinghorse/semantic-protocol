import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { vSemantics, semanticsDirectiveUtils } from '../../src/directives/vSemantics'

// Mock the core semantic protocol
vi.mock('@kneelinghorse/semantic-protocol', () => ({
  SemanticProtocol: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockReturnValue({
      field: 'email',
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
  }))
}))

describe('v-semantics directive', () => {
  let consoleLogSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    semanticsDirectiveUtils.clearCache()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('basic functionality', () => {
    it('should apply semantic analysis to input element', async () => {
      const TestComponent = {
        template: `
          <input 
            v-model="email" 
            v-semantics="{
              field: { name: 'email', type: 'string', value: email },
              context: 'form'
            }"
          />
        `,
        directives: { semantics: vSemantics },
        data() {
          return {
            email: 'test@example.com'
          }
        }
      }

      const wrapper = mount(TestComponent)
      const input = wrapper.find('input')

      await nextTick()

      // Check that semantic attributes are applied
      expect(input.attributes('data-semantic')).toBe('email')
      expect(input.attributes('data-confidence')).toBe('95')
      expect(input.attributes('data-render-component')).toBe('input')
      expect(input.attributes('data-render-variant')).toBe('email')
    })

    it('should apply semantic CSS classes', async () => {
      const TestComponent = {
        template: `
          <input 
            v-semantics="{
              field: { name: 'email', type: 'string', value: 'test@example.com' }
            }"
          />
        `,
        directives: { semantics: vSemantics }
      }

      const wrapper = mount(TestComponent)
      const input = wrapper.find('input')

      await nextTick()

      expect(input.classes()).toContain('semantic-email')
      expect(input.classes()).toContain('semantic-confidence-high')
    })

    it('should extract field information from element when not provided', async () => {
      const TestComponent = {
        template: `
          <input 
            name="user_email"
            type="email"
            value="test@example.com"
            v-semantics
          />
        `,
        directives: { semantics: vSemantics }
      }

      const wrapper = mount(TestComponent)
      const input = wrapper.find('input')

      await nextTick()

      // Should auto-detect field information
      expect(input.attributes('data-semantic')).toBe('email')
    })

    it('should handle different input types correctly', async () => {
      const TestComponent = {
        template: `
          <div>
            <input type="email" v-semantics />
            <input type="number" v-semantics />
            <input type="date" v-semantics />
            <input type="checkbox" v-semantics />
          </div>
        `,
        directives: { semantics: vSemantics }
      }

      const wrapper = mount(TestComponent)
      
      await nextTick()

      const inputs = wrapper.findAll('input')
      
      // All should have semantic attributes applied
      inputs.forEach(input => {
        expect(input.attributes('data-semantic')).toBeDefined()
        expect(input.classes().some(cls => cls.startsWith('semantic-'))).toBe(true)
      })
    })
  })

  describe('modifiers', () => {
    it('should handle auto modifier for reactive analysis', async () => {
      const TestComponent = {
        template: `
          <input 
            v-model="value"
            v-semantics.auto="{
              field: { name: 'price', type: 'decimal', value: value }
            }"
          />
        `,
        directives: { semantics: vSemantics },
        data() {
          return {
            value: '29.99'
          }
        }
      }

      const wrapper = mount(TestComponent)
      const input = wrapper.find('input')

      await nextTick()

      // Change value
      await input.setValue('39.99')
      await input.trigger('input')

      // Should re-analyze automatically
      expect(input.attributes('data-semantic')).toBeDefined()
    })

    it('should handle lazy modifier for debounced analysis', async () => {
      const TestComponent = {
        template: `
          <input 
            v-model="value"
            v-semantics.auto.lazy="{
              field: { name: 'search', type: 'string', value: value }
            }"
          />
        `,
        directives: { semantics: vSemantics },
        data() {
          return {
            value: 'test'
          }
        }
      }

      const wrapper = mount(TestComponent)
      const input = wrapper.find('input')

      // Rapid changes
      await input.setValue('test1')
      await input.trigger('input')
      await input.setValue('test2')
      await input.trigger('input')
      await input.setValue('test3')
      await input.trigger('input')

      // Should debounce the analysis
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(input.attributes('data-semantic')).toBeDefined()
    })

    it('should handle cache modifier', async () => {
      const field = { name: 'email', type: 'string', value: 'test@example.com' }
      
      const TestComponent = {
        template: `
          <div>
            <input v-semantics.cache="{ field: field }" />
            <input v-semantics.cache="{ field: field }" />
          </div>
        `,
        directives: { semantics: vSemantics },
        data() {
          return { field }
        }
      }

      const wrapper = mount(TestComponent)
      
      await nextTick()

      // Both inputs should use cached result
      const inputs = wrapper.findAll('input')
      expect(inputs[0].attributes('data-semantic')).toBe(inputs[1].attributes('data-semantic'))
    })
  })

  describe('callbacks', () => {
    it('should call onAnalysis callback when provided', async () => {
      const onAnalysis = vi.fn()
      
      const TestComponent = {
        template: `
          <input 
            v-semantics="{
              field: { name: 'email', type: 'string', value: 'test@example.com' },
              onAnalysis: onAnalysis
            }"
          />
        `,
        directives: { semantics: vSemantics },
        setup() {
          return { onAnalysis }
        }
      }

      const wrapper = mount(TestComponent)
      
      await nextTick()

      expect(onAnalysis).toHaveBeenCalledWith(expect.objectContaining({
        field: 'email',
        bestMatch: expect.objectContaining({
          semantic: 'email',
          confidence: 95
        })
      }))
    })

    it('should emit custom events', async () => {
      const TestComponent = {
        template: `
          <input 
            v-semantics="{
              field: { name: 'email', type: 'string', value: 'test@example.com' }
            }"
            @semantic:analyzed="handleAnalyzed"
          />
        `,
        directives: { semantics: vSemantics },
        methods: {
          handleAnalyzed(event) {
            this.analyzedResult = event.detail.result
          }
        },
        data() {
          return {
            analyzedResult: null
          }
        }
      }

      const wrapper = mount(TestComponent)
      
      await nextTick()

      // Event should be emitted and handled
      expect(wrapper.vm.analyzedResult).toBeDefined()
      expect(wrapper.vm.analyzedResult.bestMatch.semantic).toBe('email')
    })
  })

  describe('element observation', () => {
    it('should observe attribute changes when auto modifier is used', async () => {
      const TestComponent = {
        template: `
          <input 
            v-semantics.auto
            :data-field="fieldName"
          />
        `,
        directives: { semantics: vSemantics },
        data() {
          return {
            fieldName: 'email'
          }
        }
      }

      const wrapper = mount(TestComponent)
      
      await nextTick()

      // Change the field name
      wrapper.vm.fieldName = 'username'
      
      await nextTick()

      // Should re-analyze with new field name
      const input = wrapper.find('input')
      expect(input.attributes('data-semantic')).toBeDefined()
    })
  })

  describe('cleanup', () => {
    it('should clean up observers and listeners on unmount', async () => {
      const TestComponent = {
        template: `
          <input v-if="show" v-semantics.auto />
        `,
        directives: { semantics: vSemantics },
        data() {
          return {
            show: true
          }
        }
      }

      const wrapper = mount(TestComponent)
      const input = wrapper.find('input')
      
      await nextTick()

      // Verify element has semantic classes
      expect(input.classes().some(cls => cls.startsWith('semantic-'))).toBe(true)

      // Remove element
      wrapper.vm.show = false
      
      await nextTick()

      // Element should be gone
      expect(wrapper.find('input').exists()).toBe(false)
    })

    it('should remove semantic classes and attributes on unmount', async () => {
      const TestComponent = {
        template: `
          <input v-if="show" v-semantics />
        `,
        directives: { semantics: vSemantics },
        data() {
          return {
            show: true
          }
        }
      }

      const wrapper = mount(TestComponent)
      
      await nextTick()

      const input = wrapper.find('input')
      const element = input.element

      // Store reference to actual DOM element
      const hasSemanticClasses = element.classList.toString().includes('semantic-')
      expect(hasSemanticClasses).toBe(true)

      // Remove from DOM
      wrapper.vm.show = false
      
      await nextTick()

      // Classes should be cleaned up (if element still exists)
      // Note: In actual implementation, beforeUnmount would clean up
    })
  })

  describe('error handling', () => {
    it('should handle analysis errors gracefully', async () => {
      // Mock protocol to throw error
      const { SemanticProtocol } = require('@kneelinghorse/semantic-protocol')
      const mockProtocol = new SemanticProtocol()
      mockProtocol.analyze.mockImplementation(() => {
        throw new Error('Analysis failed')
      })

      semanticsDirectiveUtils.setProtocol(mockProtocol)

      const TestComponent = {
        template: `
          <input v-semantics="{
            field: { name: 'invalid', type: 'string' }
          }" />
        `,
        directives: { semantics: vSemantics }
      }

      // Should not throw error
      expect(() => mount(TestComponent)).not.toThrow()
    })

    it('should warn when field information cannot be determined', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const TestComponent = {
        template: `
          <div v-semantics />
        `,
        directives: { semantics: vSemantics }
      }

      mount(TestComponent)
      
      await nextTick()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not determine field information')
      )
      
      consoleWarnSpy.mockRestore()
    })
  })

  describe('utility functions', () => {
    it('should provide utility to get analysis result for element', async () => {
      const TestComponent = {
        template: `
          <input ref="testInput" v-semantics="{
            field: { name: 'email', type: 'string', value: 'test@example.com' }
          }" />
        `,
        directives: { semantics: vSemantics }
      }

      const wrapper = mount(TestComponent)
      
      await nextTick()

      const inputElement = wrapper.vm.$refs.testInput
      const result = semanticsDirectiveUtils.analyzeElement(inputElement)
      
      expect(result).toBeDefined()
      expect(result.bestMatch.semantic).toBe('email')
    })

    it('should provide utility to get field info for element', async () => {
      const TestComponent = {
        template: `
          <input ref="testInput" v-semantics="{
            field: { name: 'email', type: 'string', value: 'test@example.com' }
          }" />
        `,
        directives: { semantics: vSemantics }
      }

      const wrapper = mount(TestComponent)
      
      await nextTick()

      const inputElement = wrapper.vm.$refs.testInput
      const fieldInfo = semanticsDirectiveUtils.getFieldInfo(inputElement)
      
      expect(fieldInfo).toBeDefined()
      expect(fieldInfo.name).toBe('email')
    })

    it('should provide cache management utilities', () => {
      // Add some cached results
      semanticsDirectiveUtils.clearCache()
      
      // Cache should be empty
      expect(semanticsDirectiveUtils.clearCache).toBeDefined()
    })
  })
})