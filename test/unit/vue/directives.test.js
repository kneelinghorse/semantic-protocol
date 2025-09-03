import { describe, test, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { 
  vSemantics,
  vSemanticRef,
  vSemanticBind,
  vSemanticContext,
  vSemanticValidate,
  SemanticPlugin
} from '../../../packages/vue/src/directives';

describe('Vue Directives', () => {
  beforeEach(() => {
    // Register directives globally for tests
    const app = {
      directive: vi.fn((name, directive) => {
        global[`v-${name}`] = directive;
      }),
      config: { globalProperties: {} }
    };
    
    app.directive('semantics', vSemantics);
    app.directive('semantic-ref', vSemanticRef);
    app.directive('semantic-bind', vSemanticBind);
    app.directive('semantic-context', vSemanticContext);
    app.directive('semantic-validate', vSemanticValidate);
  });

  describe('v-semantics', () => {
    test('should bind semantic manifest to element', () => {
      const TestComponent = defineComponent({
        template: `
          <button v-semantics="{
            id: 'test-button',
            element: { type: 'action', intent: 'submit' }
          }">
            Submit
          </button>
        `,
        directives: { semantics: vSemantics }
      });

      const wrapper = mount(TestComponent);
      const button = wrapper.find('button');

      expect(button.attributes('data-semantic-id')).toBe('test-button');
      expect(button.attributes('data-semantic-type')).toBe('action');
      expect(button.attributes('data-semantic-intent')).toBe('submit');
    });

    test('should update manifest reactively', async () => {
      const TestComponent = defineComponent({
        data() {
          return {
            intent: 'submit'
          };
        },
        template: `
          <button v-semantics="{
            id: 'dynamic-button',
            element: { type: 'action', intent }
          }">
            Button
          </button>
        `,
        directives: { semantics: vSemantics }
      });

      const wrapper = mount(TestComponent);
      const button = wrapper.find('button');

      expect(button.attributes('data-semantic-intent')).toBe('submit');

      await wrapper.setData({ intent: 'cancel' });
      await nextTick();

      expect(button.attributes('data-semantic-intent')).toBe('cancel');
    });

    test('should handle modifiers', () => {
      const TestComponent = defineComponent({
        template: `
          <div>
            <button v-semantics.primary="{
              id: 'primary-button',
              element: { type: 'action' }
            }">Primary</button>
            <button v-semantics.secondary="{
              id: 'secondary-button',
              element: { type: 'action' }
            }">Secondary</button>
          </div>
        `,
        directives: { semantics: vSemantics }
      });

      const wrapper = mount(TestComponent);
      const primaryButton = wrapper.find('[data-semantic-id="primary-button"]');
      const secondaryButton = wrapper.find('[data-semantic-id="secondary-button"]');

      expect(primaryButton.classes()).toContain('semantic-primary');
      expect(secondaryButton.classes()).toContain('semantic-secondary');
    });

    test('should merge with existing attributes', () => {
      const TestComponent = defineComponent({
        template: `
          <button 
            class="btn" 
            data-test="value"
            v-semantics="{
              id: 'merge-test',
              element: { type: 'action' }
            }">
            Button
          </button>
        `,
        directives: { semantics: vSemantics }
      });

      const wrapper = mount(TestComponent);
      const button = wrapper.find('button');

      expect(button.classes()).toContain('btn');
      expect(button.attributes('data-test')).toBe('value');
      expect(button.attributes('data-semantic-id')).toBe('merge-test');
    });

    test('should handle dynamic binding', async () => {
      const TestComponent = defineComponent({
        data() {
          return {
            manifest: {
              id: 'dynamic',
              element: { type: 'display', intent: 'info' }
            }
          };
        },
        template: '<div v-semantics="manifest">Content</div>',
        directives: { semantics: vSemantics }
      });

      const wrapper = mount(TestComponent);
      const div = wrapper.find('div');

      expect(div.attributes('data-semantic-intent')).toBe('info');

      await wrapper.setData({
        manifest: {
          id: 'dynamic',
          element: { type: 'display', intent: 'warning' }
        }
      });
      await nextTick();

      expect(div.attributes('data-semantic-intent')).toBe('warning');
    });
  });

  describe('v-semantic-ref', () => {
    test('should create semantic reference links', () => {
      const TestComponent = defineComponent({
        template: `
          <div>
            <label v-semantic-ref:for="'input-email'">Email</label>
            <input v-semantic-ref:id="'input-email'" type="email" />
          </div>
        `,
        directives: { 'semantic-ref': vSemanticRef }
      });

      const wrapper = mount(TestComponent);
      const label = wrapper.find('label');
      const input = wrapper.find('input');

      expect(label.attributes('for')).toBe('input-email');
      expect(input.attributes('id')).toBe('input-email');
      expect(label.attributes('data-semantic-ref')).toBe('input-email');
    });

    test('should handle relationship references', () => {
      const TestComponent = defineComponent({
        template: `
          <div>
            <div v-semantic-ref:parent="'container'">Parent</div>
            <div v-semantic-ref:child="'container'">Child 1</div>
            <div v-semantic-ref:child="'container'">Child 2</div>
          </div>
        `,
        directives: { 'semantic-ref': vSemanticRef }
      });

      const wrapper = mount(TestComponent);
      const parent = wrapper.find('[data-semantic-ref-parent]');
      const children = wrapper.findAll('[data-semantic-ref-child]');

      expect(parent.attributes('data-semantic-ref-parent')).toBe('container');
      expect(children).toHaveLength(2);
      children.forEach(child => {
        expect(child.attributes('data-semantic-ref-child')).toBe('container');
      });
    });

    test('should update references dynamically', async () => {
      const TestComponent = defineComponent({
        data() {
          return {
            refId: 'ref-1'
          };
        },
        template: `
          <div v-semantic-ref:target="refId">Target</div>
        `,
        directives: { 'semantic-ref': vSemanticRef }
      });

      const wrapper = mount(TestComponent);
      const div = wrapper.find('div');

      expect(div.attributes('data-semantic-ref-target')).toBe('ref-1');

      await wrapper.setData({ refId: 'ref-2' });
      await nextTick();

      expect(div.attributes('data-semantic-ref-target')).toBe('ref-2');
    });
  });

  describe('v-semantic-bind', () => {
    test('should bind semantic properties', () => {
      const TestComponent = defineComponent({
        template: `
          <button v-semantic-bind="{
            'aria-label': 'Submit form',
            'data-action': 'submit',
            disabled: false
          }">
            Submit
          </button>
        `,
        directives: { 'semantic-bind': vSemanticBind }
      });

      const wrapper = mount(TestComponent);
      const button = wrapper.find('button');

      expect(button.attributes('aria-label')).toBe('Submit form');
      expect(button.attributes('data-action')).toBe('submit');
      expect(button.attributes('disabled')).toBeUndefined();
    });

    test('should handle conditional binding', async () => {
      const TestComponent = defineComponent({
        data() {
          return {
            isDisabled: false,
            isLoading: false
          };
        },
        template: `
          <button v-semantic-bind="{
            disabled: isDisabled,
            'aria-busy': isLoading,
            'data-state': isLoading ? 'loading' : 'ready'
          }">
            Action
          </button>
        `,
        directives: { 'semantic-bind': vSemanticBind }
      });

      const wrapper = mount(TestComponent);
      const button = wrapper.find('button');

      expect(button.attributes('data-state')).toBe('ready');
      expect(button.attributes('aria-busy')).toBe('false');

      await wrapper.setData({ isLoading: true, isDisabled: true });
      await nextTick();

      expect(button.attributes('disabled')).toBeDefined();
      expect(button.attributes('aria-busy')).toBe('true');
      expect(button.attributes('data-state')).toBe('loading');
    });

    test('should bind class names semantically', () => {
      const TestComponent = defineComponent({
        data() {
          return {
            variant: 'primary',
            size: 'large'
          };
        },
        template: `
          <button v-semantic-bind:class="{
            ['btn-' + variant]: true,
            ['btn-' + size]: true,
            'btn-disabled': false
          }">
            Button
          </button>
        `,
        directives: { 'semantic-bind': vSemanticBind }
      });

      const wrapper = mount(TestComponent);
      const button = wrapper.find('button');

      expect(button.classes()).toContain('btn-primary');
      expect(button.classes()).toContain('btn-large');
      expect(button.classes()).not.toContain('btn-disabled');
    });

    test('should bind styles semantically', () => {
      const TestComponent = defineComponent({
        data() {
          return {
            color: 'blue',
            fontSize: 16
          };
        },
        template: `
          <div v-semantic-bind:style="{
            color: color,
            fontSize: fontSize + 'px',
            display: 'block'
          }">
            Styled
          </div>
        `,
        directives: { 'semantic-bind': vSemanticBind }
      });

      const wrapper = mount(TestComponent);
      const div = wrapper.find('div');

      expect(div.element.style.color).toBe('blue');
      expect(div.element.style.fontSize).toBe('16px');
      expect(div.element.style.display).toBe('block');
    });
  });

  describe('v-semantic-context', () => {
    test('should provide semantic context to children', () => {
      const ChildComponent = defineComponent({
        inject: ['semanticContext'],
        template: '<div>{{ semanticContext.theme }}</div>'
      });

      const TestComponent = defineComponent({
        components: { ChildComponent },
        template: `
          <div v-semantic-context="{ theme: 'dark', flow: 'checkout' }">
            <ChildComponent />
          </div>
        `,
        directives: { 'semantic-context': vSemanticContext }
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('dark');
    });

    test('should merge nested contexts', () => {
      const ChildComponent = defineComponent({
        inject: ['semanticContext'],
        template: '<div>{{ semanticContext.flow }}-{{ semanticContext.step }}</div>'
      });

      const TestComponent = defineComponent({
        components: { ChildComponent },
        template: `
          <div v-semantic-context="{ flow: 'checkout' }">
            <div v-semantic-context="{ step: 2 }">
              <ChildComponent />
            </div>
          </div>
        `,
        directives: { 'semantic-context': vSemanticContext }
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('checkout-2');
    });

    test('should update context reactively', async () => {
      const ChildComponent = defineComponent({
        inject: ['semanticContext'],
        template: '<div>{{ semanticContext.value }}</div>'
      });

      const TestComponent = defineComponent({
        components: { ChildComponent },
        data() {
          return {
            contextValue: 'initial'
          };
        },
        template: `
          <div v-semantic-context="{ value: contextValue }">
            <ChildComponent />
          </div>
        `,
        directives: { 'semantic-context': vSemanticContext }
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('initial');

      await wrapper.setData({ contextValue: 'updated' });
      await nextTick();

      expect(wrapper.text()).toBe('updated');
    });
  });

  describe('v-semantic-validate', () => {
    test('should validate input fields', async () => {
      const TestComponent = defineComponent({
        data() {
          return {
            email: ''
          };
        },
        template: `
          <div>
            <input 
              v-model="email"
              v-semantic-validate:email
              type="email" 
            />
            <span class="error" v-if="$refs.emailInput?.error">
              {{ $refs.emailInput.error }}
            </span>
          </div>
        `,
        directives: { 'semantic-validate': vSemanticValidate }
      });

      const wrapper = mount(TestComponent);
      const input = wrapper.find('input');

      await input.setValue('invalid-email');
      await nextTick();

      expect(input.attributes('aria-invalid')).toBe('true');
      expect(input.classes()).toContain('semantic-invalid');

      await input.setValue('valid@email.com');
      await nextTick();

      expect(input.attributes('aria-invalid')).toBe('false');
      expect(input.classes()).not.toContain('semantic-invalid');
    });

    test('should validate with custom rules', async () => {
      const TestComponent = defineComponent({
        data() {
          return {
            password: '',
            rules: {
              minLength: 8,
              requireSpecial: true,
              requireNumber: true
            }
          };
        },
        template: `
          <input 
            v-model="password"
            v-semantic-validate:password="rules"
            type="password" 
          />
        `,
        directives: { 'semantic-validate': vSemanticValidate }
      });

      const wrapper = mount(TestComponent);
      const input = wrapper.find('input');

      await input.setValue('short');
      await nextTick();
      expect(input.attributes('aria-invalid')).toBe('true');

      await input.setValue('LongEnough123!');
      await nextTick();
      expect(input.attributes('aria-invalid')).toBe('false');
    });

    test('should show validation messages', async () => {
      const TestComponent = defineComponent({
        data() {
          return {
            value: '',
            showError: false
          };
        },
        template: `
          <div>
            <input 
              v-model="value"
              v-semantic-validate:required.message="'This field is required'"
              @blur="showError = true"
            />
            <span v-if="showError" class="error-message">
              This field is required
            </span>
          </div>
        `,
        directives: { 'semantic-validate': vSemanticValidate }
      });

      const wrapper = mount(TestComponent);
      const input = wrapper.find('input');

      await input.trigger('blur');
      await nextTick();

      expect(wrapper.find('.error-message').exists()).toBe(true);

      await input.setValue('some value');
      await input.trigger('blur');
      await nextTick();

      expect(input.attributes('aria-invalid')).toBe('false');
    });

    test('should validate form groups', () => {
      const TestComponent = defineComponent({
        data() {
          return {
            form: {
              email: '',
              password: ''
            }
          };
        },
        template: `
          <form v-semantic-validate:form="{
            email: 'email',
            password: { minLength: 8 }
          }">
            <input v-model="form.email" name="email" />
            <input v-model="form.password" name="password" type="password" />
            <button type="submit">Submit</button>
          </form>
        `,
        directives: { 'semantic-validate': vSemanticValidate }
      });

      const wrapper = mount(TestComponent);
      const form = wrapper.find('form');

      expect(form.attributes('aria-invalid')).toBe('true');
      expect(form.classes()).toContain('semantic-form-invalid');
    });
  });
});