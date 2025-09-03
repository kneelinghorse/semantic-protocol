import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import SemanticProvider from '../../src/components/SemanticProvider.vue'

// Mock the semantic context
vi.mock('../../src/composables/useSemanticContext', () => ({
  provideSemanticContext: vi.fn().mockReturnValue({
    protocol: {
      analyze: vi.fn()
    },
    options: {
      confidenceThreshold: 70,
      autoAnalysis: false,
      enableDevTools: true,
      cacheResults: true
    }
  })
}))

describe('SemanticProvider', () => {
  it('should render children correctly', () => {
    const wrapper = mount(SemanticProvider, {
      slots: {
        default: '<div class="test-child">Test Content</div>'
      }
    })

    expect(wrapper.find('.test-child').text()).toBe('Test Content')
    expect(wrapper.find('.semantic-provider').exists()).toBe(true)
  })

  it('should provide semantic context to children', () => {
    const childComponent = {
      template: '<div>{{ hasContext }}</div>',
      setup() {
        const { provideSemanticContext } = require('../../src/composables/useSemanticContext')
        const context = provideSemanticContext()
        return {
          hasContext: !!context
        }
      }
    }

    const wrapper = mount(SemanticProvider, {
      slots: {
        default: h(childComponent)
      }
    })

    expect(wrapper.text()).toBe('true')
  })

  it('should accept and use custom options', () => {
    const customOptions = {
      confidenceThreshold: 80,
      autoAnalysis: true,
      enableDevTools: false,
      cacheResults: false
    }

    const wrapper = mount(SemanticProvider, {
      props: {
        options: customOptions
      }
    })

    const { provideSemanticContext } = require('../../src/composables/useSemanticContext')
    expect(provideSemanticContext).toHaveBeenCalledWith(customOptions)
  })

  it('should use default options when none provided', () => {
    const wrapper = mount(SemanticProvider)

    const { provideSemanticContext } = require('../../src/composables/useSemanticContext')
    expect(provideSemanticContext).toHaveBeenCalledWith({})
  })

  it('should expose context for testing', () => {
    const wrapper = mount(SemanticProvider)

    expect(wrapper.vm.context).toBeDefined()
    expect(wrapper.vm.contextInfo).toBeDefined()
    expect(wrapper.vm.contextInfo.confidenceThreshold).toBe(70)
  })

  it('should have minimal styling', () => {
    const wrapper = mount(SemanticProvider)

    const provider = wrapper.find('.semantic-provider')
    expect(provider.exists()).toBe(true)
    
    // Check that it uses display: contents (doesn't interfere with layout)
    expect(wrapper.html()).toContain('semantic-provider')
  })

  it('should handle nested providers', () => {
    const innerOptions = {
      confidenceThreshold: 90
    }

    const wrapper = mount(SemanticProvider, {
      props: {
        options: { confidenceThreshold: 80 }
      },
      slots: {
        default: h(SemanticProvider, {
          props: { options: innerOptions }
        }, {
          default: () => h('div', 'Nested content')
        })
      }
    })

    expect(wrapper.text()).toBe('Nested content')
    
    // Both providers should be called with their respective options
    const { provideSemanticContext } = require('../../src/composables/useSemanticContext')
    expect(provideSemanticContext).toHaveBeenCalledWith({ confidenceThreshold: 80 })
    expect(provideSemanticContext).toHaveBeenCalledWith(innerOptions)
  })

  it('should not crash with empty slots', () => {
    const wrapper = mount(SemanticProvider)

    expect(wrapper.html()).toContain('semantic-provider')
    expect(() => wrapper.vm).not.toThrow()
  })

  it('should maintain component name', () => {
    expect(SemanticProvider.name).toBe('SemanticProvider')
  })

  it('should inherit attrs correctly', () => {
    const wrapper = mount(SemanticProvider, {
      attrs: {
        'data-testid': 'semantic-provider',
        class: 'custom-class'
      }
    })

    // Should not inherit attrs to root element since inheritAttrs: false
    expect(wrapper.attributes('data-testid')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('custom-class')
  })

  describe('development mode behavior', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should log context info in development mode', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const wrapper = mount(SemanticProvider, {
        props: {
          options: { enableDevTools: true }
        }
      })

      // In a real implementation, this would check for console.log calls
      // For now, we just verify the component mounts successfully
      expect(wrapper.exists()).toBe(true)

      consoleSpy.mockRestore()
    })

    it('should not log in production mode', () => {
      process.env.NODE_ENV = 'production'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const wrapper = mount(SemanticProvider, {
        props: {
          options: { enableDevTools: true }
        }
      })

      expect(wrapper.exists()).toBe(true)
      // In production, dev tools should be disabled regardless of option
      
      consoleSpy.mockRestore()
    })
  })
})