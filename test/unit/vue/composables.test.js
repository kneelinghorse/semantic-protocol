import { describe, test, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { 
  useSemantics,
  useDiscovery,
  useRelationships,
  useSemanticState,
  useSemanticEffect,
  SemanticPlugin
} from '../../../packages/vue/src';

describe('Vue Composables', () => {
  beforeEach(() => {
    // Install the plugin globally for tests
    const app = { 
      use: (plugin) => plugin.install(app),
      config: { globalProperties: {} },
      provide: vi.fn()
    };
    SemanticPlugin.install(app);
  });

  describe('useSemantics', () => {
    test('should register component with reactive manifest', () => {
      const TestComponent = defineComponent({
        setup() {
          const { manifest, isRegistered } = useSemantics({
            id: 'test-component',
            element: { type: 'action', intent: 'submit' }
          });

          return { manifest, isRegistered };
        },
        template: '<div>{{ isRegistered ? "Registered" : "Not Registered" }}</div>'
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('Registered');
      expect(wrapper.vm.manifest.id).toBe('test-component');
    });

    test('should update manifest reactively', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { manifest, updateManifest } = useSemantics({
            id: 'reactive-component',
            element: { type: 'action', intent: 'submit' }
          });

          const changeIntent = () => {
            updateManifest({
              element: { type: 'action', intent: 'cancel' }
            });
          };

          return { manifest, changeIntent };
        },
        template: '<div @click="changeIntent">{{ manifest.element.intent }}</div>'
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('submit');

      await wrapper.trigger('click');
      await nextTick();

      expect(wrapper.text()).toBe('cancel');
    });

    test('should handle computed manifests', () => {
      const TestComponent = defineComponent({
        props: {
          intent: String
        },
        setup(props) {
          const computedManifest = computed(() => ({
            id: 'computed-component',
            element: { type: 'action', intent: props.intent || 'default' }
          }));

          const { manifest } = useSemantics(computedManifest);

          return { manifest };
        },
        template: '<div>{{ manifest.element.intent }}</div>'
      });

      const wrapper = mount(TestComponent, {
        props: { intent: 'submit' }
      });

      expect(wrapper.text()).toBe('submit');

      wrapper.setProps({ intent: 'cancel' });
      expect(wrapper.text()).toBe('cancel');
    });

    test('should cleanup on unmount', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { isRegistered, unregister } = useSemantics({
            id: 'cleanup-test',
            element: { type: 'display' }
          });

          onUnmounted(() => {
            unregister();
          });

          return { isRegistered };
        },
        template: '<div>{{ isRegistered }}</div>'
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.vm.isRegistered).toBe(true);

      wrapper.unmount();
      // Component should be unregistered after unmount
    });

    test('should merge provider context', () => {
      const TestComponent = defineComponent({
        setup() {
          const { manifest } = useSemantics({
            id: 'context-test',
            element: { type: 'action' },
            context: { step: 2 }
          });

          return { manifest };
        },
        template: '<div>{{ manifest.context }}</div>'
      });

      const wrapper = mount(TestComponent, {
        global: {
          provide: {
            semanticContext: { theme: 'dark', flow: 'checkout' }
          }
        }
      });

      expect(wrapper.vm.manifest.context).toEqual({
        theme: 'dark',
        flow: 'checkout',
        step: 2
      });
    });

    test('should handle validation errors', () => {
      const TestComponent = defineComponent({
        setup() {
          const { error, isValid } = useSemantics({
            // Invalid manifest - missing required fields
            element: {}
          });

          return { error, isValid };
        },
        template: '<div>{{ isValid ? "Valid" : error.message }}</div>'
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.vm.isValid).toBe(false);
      expect(wrapper.text()).toContain('Invalid manifest');
    });
  });

  describe('useDiscovery', () => {
    test('should discover components reactively', async () => {
      const TestComponent = defineComponent({
        setup() {
          // Register some components first
          useSemantics({
            id: 'button-1',
            element: { type: 'action', intent: 'submit' }
          });
          useSemantics({
            id: 'button-2',
            element: { type: 'action', intent: 'cancel' }
          });

          const { results } = useDiscovery({ type: 'action' });

          return { results };
        },
        template: '<div>Found: {{ results.length }}</div>'
      });

      const wrapper = mount(TestComponent);
      await nextTick();

      expect(wrapper.text()).toBe('Found: 2');
    });

    test('should update results when query changes', async () => {
      const TestComponent = defineComponent({
        setup() {
          // Register test components
          useSemantics({
            id: 'action-comp',
            element: { type: 'action' }
          });
          useSemantics({
            id: 'display-comp',
            element: { type: 'display' }
          });

          const query = ref({ type: 'action' });
          const { results } = useDiscovery(query);

          const switchQuery = () => {
            query.value = { type: 'display' };
          };

          return { results, switchQuery };
        },
        template: `
          <div>
            <span>Count: {{ results.length }}</span>
            <button @click="switchQuery">Switch</button>
          </div>
        `
      });

      const wrapper = mount(TestComponent);
      await nextTick();

      expect(wrapper.find('span').text()).toBe('Count: 1');

      await wrapper.find('button').trigger('click');
      await nextTick();

      expect(wrapper.find('span').text()).toBe('Count: 1');
    });

    test('should support computed queries', () => {
      const TestComponent = defineComponent({
        props: {
          searchType: String
        },
        setup(props) {
          useSemantics({
            id: 'test-action',
            element: { type: 'action' }
          });
          useSemantics({
            id: 'test-display',
            element: { type: 'display' }
          });

          const query = computed(() => ({
            type: props.searchType
          }));

          const { results } = useDiscovery(query);

          return { results };
        },
        template: '<div>{{ results.length }}</div>'
      });

      const wrapper = mount(TestComponent, {
        props: { searchType: 'action' }
      });

      expect(wrapper.text()).toBe('1');

      wrapper.setProps({ searchType: 'display' });
      expect(wrapper.text()).toBe('1');
    });

    test('should handle loading state', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { results, loading } = useDiscovery(
            { type: 'async' },
            { async: true }
          );

          return { results, loading };
        },
        template: '<div>{{ loading ? "Loading..." : `Found ${results.length}` }}</div>'
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('Loading...');

      await nextTick();
      expect(wrapper.text()).toContain('Found');
    });
  });

  describe('useRelationships', () => {
    test('should resolve relationships reactively', async () => {
      const TestComponent = defineComponent({
        setup() {
          // Set up related components
          useSemantics({
            id: 'parent',
            element: { type: 'container' },
            relationships: { children: ['child1', 'child2'] }
          });
          useSemantics({
            id: 'child1',
            element: { type: 'display' },
            relationships: { parent: 'parent' }
          });
          useSemantics({
            id: 'child2',
            element: { type: 'action' },
            relationships: { parent: 'parent' }
          });

          const { related } = useRelationships('parent', 'children');

          return { related };
        },
        template: '<div>Children: {{ related.length }}</div>'
      });

      const wrapper = mount(TestComponent);
      await nextTick();

      expect(wrapper.text()).toBe('Children: 2');
    });

    test('should watch for relationship changes', async () => {
      const TestComponent = defineComponent({
        setup() {
          const parentId = ref('parent1');
          
          useSemantics({
            id: 'parent1',
            element: { type: 'container' },
            relationships: { children: ['child1'] }
          });
          useSemantics({
            id: 'parent2',
            element: { type: 'container' },
            relationships: { children: ['child2', 'child3'] }
          });

          const { related } = useRelationships(parentId, 'children');

          const switchParent = () => {
            parentId.value = 'parent2';
          };

          return { related, switchParent };
        },
        template: `
          <div>
            <span>Count: {{ related.length }}</span>
            <button @click="switchParent">Switch</button>
          </div>
        `
      });

      const wrapper = mount(TestComponent);
      await nextTick();

      expect(wrapper.find('span').text()).toBe('Count: 1');

      await wrapper.find('button').trigger('click');
      await nextTick();

      expect(wrapper.find('span').text()).toBe('Count: 2');
    });

    test('should build relationship graph', () => {
      const TestComponent = defineComponent({
        setup() {
          useSemantics({
            id: 'node1',
            element: { type: 'display' },
            relationships: { next: 'node2' }
          });
          useSemantics({
            id: 'node2',
            element: { type: 'display' },
            relationships: { next: 'node3', prev: 'node1' }
          });
          useSemantics({
            id: 'node3',
            element: { type: 'display' },
            relationships: { prev: 'node2' }
          });

          const { graph } = useRelationships(null, null, { buildGraph: true });

          return { graph };
        },
        template: '<div>Nodes: {{ graph.nodes.length }}, Edges: {{ graph.edges.length }}</div>'
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toContain('Nodes: 3');
      expect(wrapper.text()).toContain('Edges:');
    });
  });

  describe('useSemanticState', () => {
    test('should manage semantic state reactively', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { state, setState } = useSemanticState({
            count: 0,
            message: 'Hello'
          });

          const increment = () => {
            setState({ count: state.value.count + 1 });
          };

          return { state, increment };
        },
        template: `
          <div>
            <span>{{ state.count }}</span>
            <button @click="increment">+</button>
          </div>
        `
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.find('span').text()).toBe('0');

      await wrapper.find('button').trigger('click');
      await nextTick();

      expect(wrapper.find('span').text()).toBe('1');
    });

    test('should validate state changes', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { state, setState, errors, isValid } = useSemanticState({
            email: '',
            validation: {
              email: 'email'
            }
          });

          const updateEmail = (value) => {
            setState({ email: value });
          };

          return { state, updateEmail, errors, isValid };
        },
        template: `
          <div>
            <input :value="state.email" @input="updateEmail($event.target.value)" />
            <span v-if="!isValid">{{ errors[0] }}</span>
            <span v-else>Valid</span>
          </div>
        `
      });

      const wrapper = mount(TestComponent);
      const input = wrapper.find('input');

      expect(wrapper.text()).toContain('required');

      await input.setValue('invalid-email');
      await nextTick();
      expect(wrapper.text()).toContain('valid email');

      await input.setValue('valid@email.com');
      await nextTick();
      expect(wrapper.text()).toContain('Valid');
    });

    test('should sync with semantic context', () => {
      const TestComponent = defineComponent({
        setup() {
          const { state, syncWithContext } = useSemanticState(
            { theme: 'light' },
            { syncWithContext: true }
          );

          provide('semanticContext', { theme: 'dark' });
          syncWithContext();

          return { state };
        },
        template: '<div>{{ state.theme }}</div>'
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('dark');
    });
  });

  describe('useSemanticEffect', () => {
    test('should trigger effects on semantic changes', async () => {
      const effect = vi.fn();

      const TestComponent = defineComponent({
        setup() {
          useSemanticEffect(effect, { type: 'action' });

          // Register a matching component
          useSemantics({
            id: 'trigger',
            element: { type: 'action' }
          });

          return {};
        },
        template: '<div>Test</div>'
      });

      mount(TestComponent);
      await nextTick();

      expect(effect).toHaveBeenCalled();
    });

    test('should cleanup on unmount', () => {
      const cleanup = vi.fn();
      const effect = vi.fn(() => cleanup);

      const TestComponent = defineComponent({
        setup() {
          useSemanticEffect(effect, { id: 'test' });
          return {};
        },
        template: '<div>Test</div>'
      });

      const wrapper = mount(TestComponent);
      wrapper.unmount();

      expect(cleanup).toHaveBeenCalled();
    });

    test('should debounce rapid changes', async () => {
      const effect = vi.fn();

      const TestComponent = defineComponent({
        setup() {
          useSemanticEffect(effect, { type: 'rapid' }, { debounce: 100 });

          // Trigger multiple rapid changes
          for (let i = 0; i < 5; i++) {
            useSemantics({
              id: `rapid-${i}`,
              element: { type: 'rapid' }
            });
          }

          return {};
        },
        template: '<div>Test</div>'
      });

      mount(TestComponent);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should only be called once after debounce
      expect(effect).toHaveBeenCalledTimes(1);
    });

    test('should watch specific properties', async () => {
      const effect = vi.fn();

      const TestComponent = defineComponent({
        setup() {
          const { manifest, updateManifest } = useSemantics({
            id: 'watcher',
            element: { type: 'display', intent: 'info' }
          });

          useSemanticEffect(
            effect,
            { id: 'watcher' },
            { watch: ['element.intent'] }
          );

          const changeIntent = () => {
            updateManifest({
              element: { type: 'display', intent: 'warning' }
            });
          };

          return { changeIntent };
        },
        template: '<button @click="changeIntent">Change</button>'
      });

      const wrapper = mount(TestComponent);
      
      await wrapper.find('button').trigger('click');
      await nextTick();

      expect(effect).toHaveBeenCalled();
    });
  });
});