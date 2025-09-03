import { renderHook, act, waitFor } from '@testing-library/react';
import { SemanticProvider } from '../../../packages/react/src/components';
import { 
  useSemantics, 
  useDiscovery, 
  useRelationships,
  useSemanticState,
  useSemanticEffect
} from '../../../packages/react/src/hooks';

describe('React Hooks', () => {
  const wrapper = ({ children }) => (
    <SemanticProvider>{children}</SemanticProvider>
  );

  describe('useSemantics', () => {
    test('should register component with manifest', () => {
      const manifest = {
        id: 'test-component',
        element: { type: 'action', intent: 'submit' }
      };

      const { result } = renderHook(
        () => useSemantics(manifest),
        { wrapper }
      );

      expect(result.current.isRegistered).toBe(true);
      expect(result.current.id).toBe('test-component');
    });

    test('should update manifest when props change', () => {
      const initialManifest = {
        id: 'dynamic-component',
        element: { type: 'action', intent: 'submit' }
      };

      const { result, rerender } = renderHook(
        ({ manifest }) => useSemantics(manifest),
        { 
          wrapper,
          initialProps: { manifest: initialManifest }
        }
      );

      expect(result.current.manifest.element.intent).toBe('submit');

      const updatedManifest = {
        id: 'dynamic-component',
        element: { type: 'action', intent: 'cancel' }
      };

      rerender({ manifest: updatedManifest });

      expect(result.current.manifest.element.intent).toBe('cancel');
    });

    test('should handle component unmounting', () => {
      const manifest = {
        id: 'unmount-test',
        element: { type: 'display' }
      };

      const { result, unmount } = renderHook(
        () => useSemantics(manifest),
        { wrapper }
      );

      expect(result.current.isRegistered).toBe(true);

      unmount();

      // Component should be unregistered after unmount
      const { result: searchResult } = renderHook(
        () => useDiscovery({ id: 'unmount-test' }),
        { wrapper }
      );

      expect(searchResult.current.results).toHaveLength(0);
    });

    test('should merge context from provider', () => {
      const providerContext = { theme: 'dark', flow: 'checkout' };
      const componentContext = { step: 2 };

      const customWrapper = ({ children }) => (
        <SemanticProvider context={providerContext}>
          {children}
        </SemanticProvider>
      );

      const manifest = {
        id: 'context-test',
        element: { type: 'action' },
        context: componentContext
      };

      const { result } = renderHook(
        () => useSemantics(manifest),
        { wrapper: customWrapper }
      );

      expect(result.current.manifest.context).toEqual({
        theme: 'dark',
        flow: 'checkout',
        step: 2
      });
    });

    test('should handle async registration', async () => {
      const manifest = {
        id: 'async-component',
        element: { type: 'input' },
        async: true
      };

      const { result } = renderHook(
        () => useSemantics(manifest),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isRegistered).toBe(true);
      });
    });

    test('should handle registration errors', () => {
      const invalidManifest = {
        // Missing required fields
        element: {}
      };

      const { result } = renderHook(
        () => useSemantics(invalidManifest),
        { wrapper }
      );

      expect(result.current.error).toBeDefined();
      expect(result.current.error.message).toContain('Invalid manifest');
      expect(result.current.isRegistered).toBe(false);
    });
  });

  describe('useDiscovery', () => {
    beforeEach(() => {
      // Pre-populate some test components
      const TestWrapper = ({ children }) => (
        <SemanticProvider>
          <ComponentWithManifest 
            id="button-1" 
            type="action" 
            intent="submit" 
            tags={['primary']} 
          />
          <ComponentWithManifest 
            id="button-2" 
            type="action" 
            intent="cancel" 
            tags={['secondary']} 
          />
          <ComponentWithManifest 
            id="input-1" 
            type="input" 
            intent="collect" 
          />
          {children}
        </SemanticProvider>
      );

      function ComponentWithManifest({ id, type, intent, tags }) {
        useSemantics({
          id,
          element: { type, intent },
          tags
        });
        return null;
      }
    });

    test('should discover components by type', () => {
      const { result } = renderHook(
        () => useDiscovery({ type: 'action' }),
        { wrapper }
      );

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results.map(r => r.id)).toContain('button-1');
      expect(result.current.results.map(r => r.id)).toContain('button-2');
    });

    test('should discover components by intent', () => {
      const { result } = renderHook(
        () => useDiscovery({ intent: 'submit' }),
        { wrapper }
      );

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].id).toBe('button-1');
    });

    test('should discover components by tags', () => {
      const { result } = renderHook(
        () => useDiscovery({ tags: ['primary'] }),
        { wrapper }
      );

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].id).toBe('button-1');
    });

    test('should update results when query changes', () => {
      const { result, rerender } = renderHook(
        ({ query }) => useDiscovery(query),
        { 
          wrapper,
          initialProps: { query: { type: 'action' } }
        }
      );

      expect(result.current.results).toHaveLength(2);

      rerender({ query: { type: 'input' } });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].element.type).toBe('input');
    });

    test('should handle real-time updates', async () => {
      const { result } = renderHook(
        () => useDiscovery({ type: 'display' }),
        { wrapper }
      );

      expect(result.current.results).toHaveLength(0);

      // Simulate adding a new component
      act(() => {
        const { result: newComponent } = renderHook(
          () => useSemantics({
            id: 'new-display',
            element: { type: 'display' }
          }),
          { wrapper }
        );
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
        expect(result.current.results[0].id).toBe('new-display');
      });
    });

    test('should support complex queries', () => {
      const { result } = renderHook(
        () => useDiscovery({
          type: 'action',
          tags: ['primary']
        }),
        { wrapper }
      );

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].id).toBe('button-1');
    });

    test('should handle empty results', () => {
      const { result } = renderHook(
        () => useDiscovery({ type: 'non-existent' }),
        { wrapper }
      );

      expect(result.current.results).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useRelationships', () => {
    beforeEach(() => {
      // Set up components with relationships
      const TestWrapper = ({ children }) => (
        <SemanticProvider>
          <ParentComponent />
          <ChildComponent1 />
          <ChildComponent2 />
          {children}
        </SemanticProvider>
      );

      function ParentComponent() {
        useSemantics({
          id: 'parent',
          element: { type: 'container' },
          relationships: {
            children: ['child1', 'child2']
          }
        });
        return null;
      }

      function ChildComponent1() {
        useSemantics({
          id: 'child1',
          element: { type: 'display' },
          relationships: {
            parent: 'parent',
            siblings: ['child2']
          }
        });
        return null;
      }

      function ChildComponent2() {
        useSemantics({
          id: 'child2',
          element: { type: 'action' },
          relationships: {
            parent: 'parent',
            siblings: ['child1']
          }
        });
        return null;
      }
    });

    test('should resolve parent relationships', () => {
      const { result } = renderHook(
        () => useRelationships('child1', 'parent'),
        { wrapper }
      );

      expect(result.current.related).toHaveLength(1);
      expect(result.current.related[0].id).toBe('parent');
    });

    test('should resolve child relationships', () => {
      const { result } = renderHook(
        () => useRelationships('parent', 'children'),
        { wrapper }
      );

      expect(result.current.related).toHaveLength(2);
      expect(result.current.related.map(r => r.id)).toContain('child1');
      expect(result.current.related.map(r => r.id)).toContain('child2');
    });

    test('should resolve sibling relationships', () => {
      const { result } = renderHook(
        () => useRelationships('child1', 'siblings'),
        { wrapper }
      );

      expect(result.current.related).toHaveLength(1);
      expect(result.current.related[0].id).toBe('child2');
    });

    test('should update when relationships change', async () => {
      const { result } = renderHook(
        () => useRelationships('parent', 'children'),
        { wrapper }
      );

      expect(result.current.related).toHaveLength(2);

      // Add a new child
      act(() => {
        const { result: newChild } = renderHook(
          () => useSemantics({
            id: 'child3',
            element: { type: 'input' },
            relationships: { parent: 'parent' }
          }),
          { wrapper }
        );
      });

      await waitFor(() => {
        expect(result.current.related).toHaveLength(3);
        expect(result.current.related.map(r => r.id)).toContain('child3');
      });
    });

    test('should handle circular relationships', () => {
      const CircularWrapper = ({ children }) => (
        <SemanticProvider>
          <ComponentA />
          <ComponentB />
          {children}
        </SemanticProvider>
      );

      function ComponentA() {
        useSemantics({
          id: 'comp-a',
          element: { type: 'display' },
          relationships: { next: 'comp-b' }
        });
        return null;
      }

      function ComponentB() {
        useSemantics({
          id: 'comp-b',
          element: { type: 'display' },
          relationships: { next: 'comp-a' }
        });
        return null;
      }

      const { result } = renderHook(
        () => useRelationships('comp-a', 'next', { detectCircular: true }),
        { wrapper: CircularWrapper }
      );

      expect(result.current.hasCircular).toBe(true);
      expect(result.current.circularPath).toEqual(['comp-a', 'comp-b', 'comp-a']);
    });

    test('should build relationship graph', () => {
      const { result } = renderHook(
        () => useRelationships(null, null, { buildGraph: true }),
        { wrapper }
      );

      expect(result.current.graph).toBeDefined();
      expect(result.current.graph.nodes).toHaveLength(3);
      expect(result.current.graph.edges).toContainEqual(
        expect.objectContaining({
          from: 'parent',
          to: 'child1',
          type: 'children'
        })
      );
    });
  });

  describe('useSemanticState', () => {
    test('should manage semantic state', () => {
      const { result } = renderHook(
        () => useSemanticState({
          value: '',
          validation: 'required'
        }),
        { wrapper }
      );

      expect(result.current.state.value).toBe('');
      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.setState({ value: 'test' });
      });

      expect(result.current.state.value).toBe('test');
      expect(result.current.isValid).toBe(true);
    });

    test('should validate state changes', () => {
      const { result } = renderHook(
        () => useSemanticState({
          email: '',
          validation: {
            email: 'email'
          }
        }),
        { wrapper }
      );

      expect(result.current.errors).toHaveLength(1);

      act(() => {
        result.current.setState({ email: 'invalid-email' });
      });

      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0]).toContain('valid email');

      act(() => {
        result.current.setState({ email: 'valid@email.com' });
      });

      expect(result.current.errors).toHaveLength(0);
      expect(result.current.isValid).toBe(true);
    });

    test('should sync state with semantic context', () => {
      const { result } = renderHook(
        () => useSemanticState({
          theme: 'light'
        }, { syncWithContext: true }),
        { wrapper }
      );

      expect(result.current.state.theme).toBe('light');

      // Simulate context change
      act(() => {
        result.current.updateContext({ theme: 'dark' });
      });

      expect(result.current.state.theme).toBe('dark');
    });
  });

  describe('useSemanticEffect', () => {
    test('should trigger effects based on semantic changes', () => {
      const effect = jest.fn();

      const { result } = renderHook(
        () => useSemanticEffect(effect, { type: 'action' }),
        { wrapper }
      );

      // Effect should trigger when matching component is added
      act(() => {
        const { result: newComponent } = renderHook(
          () => useSemantics({
            id: 'trigger-component',
            element: { type: 'action' }
          }),
          { wrapper }
        );
      });

      expect(effect).toHaveBeenCalled();
    });

    test('should cleanup effects on unmount', () => {
      const cleanup = jest.fn();
      const effect = jest.fn(() => cleanup);

      const { unmount } = renderHook(
        () => useSemanticEffect(effect, { id: 'test' }),
        { wrapper }
      );

      unmount();

      expect(cleanup).toHaveBeenCalled();
    });

    test('should debounce rapid changes', async () => {
      const effect = jest.fn();

      renderHook(
        () => useSemanticEffect(effect, { type: 'input' }, { debounce: 100 }),
        { wrapper }
      );

      // Trigger multiple rapid changes
      for (let i = 0; i < 5; i++) {
        act(() => {
          const { result } = renderHook(
            () => useSemantics({
              id: `rapid-${i}`,
              element: { type: 'input' }
            }),
            { wrapper }
          );
        });
      }

      // Effect should only be called once after debounce
      await waitFor(() => {
        expect(effect).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });
  });
});