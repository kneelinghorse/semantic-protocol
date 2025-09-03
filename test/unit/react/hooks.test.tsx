import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  useSemantics, 
  useDiscovery, 
  useRelationships,
  SemanticProvider 
} from '../../../packages/react/src';

describe('React Hooks', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SemanticProvider>{children}</SemanticProvider>
  );

  beforeEach(() => {
    // Clear registry before each test
    window.__SEMANTIC_REGISTRY__ = new Map();
  });

  describe('useSemantics', () => {
    test('should register component with manifest', () => {
      const manifest = {
        element: { type: 'action', intent: 'submit' },
        context: { flow: 'checkout' }
      };

      const { result } = renderHook(
        () => useSemantics(manifest),
        { wrapper }
      );

      expect(result.current.isRegistered).toBe(true);
      expect(result.current.id).toBeDefined();
      expect(result.current.manifest).toMatchObject(manifest);
    });

    test('should update manifest when props change', () => {
      const initialManifest = {
        element: { type: 'action', intent: 'submit' }
      };

      const { result, rerender } = renderHook(
        ({ manifest }) => useSemantics(manifest),
        {
          wrapper,
          initialProps: { manifest: initialManifest }
        }
      );

      const initialId = result.current.id;

      const updatedManifest = {
        element: { type: 'action', intent: 'cancel' }
      };

      rerender({ manifest: updatedManifest });

      expect(result.current.id).toBe(initialId);
      expect(result.current.manifest.element.intent).toBe('cancel');
    });

    test('should unregister on unmount', () => {
      const manifest = {
        element: { type: 'display' }
      };

      const { result, unmount } = renderHook(
        () => useSemantics(manifest),
        { wrapper }
      );

      const componentId = result.current.id;
      expect(window.__SEMANTIC_REGISTRY__.has(componentId)).toBe(true);

      unmount();
      expect(window.__SEMANTIC_REGISTRY__.has(componentId)).toBe(false);
    });

    test('should validate manifest and report errors', () => {
      const invalidManifest = {
        // Missing required 'element' field
        context: { flow: 'checkout' }
      };

      const { result } = renderHook(
        () => useSemantics(invalidManifest as any),
        { wrapper }
      );

      expect(result.current.isRegistered).toBe(false);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0]).toContain('element');
    });

    test('should support conditional registration', () => {
      const manifest = {
        element: { type: 'action' }
      };

      const { result, rerender } = renderHook(
        ({ enabled }) => useSemantics(manifest, { enabled }),
        {
          wrapper,
          initialProps: { enabled: false }
        }
      );

      expect(result.current.isRegistered).toBe(false);

      rerender({ enabled: true });
      expect(result.current.isRegistered).toBe(true);
    });

    test('should handle lifecycle events', () => {
      const onRegister = jest.fn();
      const onUpdate = jest.fn();
      const onUnregister = jest.fn();

      const manifest = {
        element: { type: 'action', intent: 'submit' }
      };

      const { result, rerender, unmount } = renderHook(
        ({ manifest }) => useSemantics(manifest, {
          onRegister,
          onUpdate,
          onUnregister
        }),
        {
          wrapper,
          initialProps: { manifest }
        }
      );

      expect(onRegister).toHaveBeenCalledWith(result.current.id);

      const updatedManifest = {
        element: { type: 'action', intent: 'cancel' }
      };
      rerender({ manifest: updatedManifest });
      expect(onUpdate).toHaveBeenCalled();

      unmount();
      expect(onUnregister).toHaveBeenCalled();
    });
  });

  describe('useDiscovery', () => {
    beforeEach(() => {
      // Populate registry with test components
      window.__SEMANTIC_REGISTRY__.set('button-1', {
        id: 'button-1',
        element: { type: 'action', intent: 'submit' },
        context: { flow: 'checkout' }
      });
      
      window.__SEMANTIC_REGISTRY__.set('button-2', {
        id: 'button-2',
        element: { type: 'action', intent: 'cancel' },
        context: { flow: 'checkout' }
      });
      
      window.__SEMANTIC_REGISTRY__.set('form-1', {
        id: 'form-1',
        element: { type: 'input', intent: 'collect' },
        context: { flow: 'payment' }
      });
    });

    test('should discover components by query', () => {
      const { result } = renderHook(
        () => useDiscovery({ type: 'action' }),
        { wrapper }
      );

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results.map(r => r.id))
        .toEqual(['button-1', 'button-2']);
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
      expect(result.current.results[0].id).toBe('form-1');
    });

    test('should update results when registry changes', async () => {
      const { result } = renderHook(
        () => useDiscovery({ type: 'action' }),
        { wrapper }
      );

      expect(result.current.results).toHaveLength(2);

      act(() => {
        window.__SEMANTIC_REGISTRY__.set('button-3', {
          id: 'button-3',
          element: { type: 'action', intent: 'save' }
        });
        window.dispatchEvent(new CustomEvent('semantic:registered'));
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(3);
      });
    });

    test('should support complex queries', () => {
      const { result } = renderHook(
        () => useDiscovery({
          type: 'action',
          context: { flow: 'checkout' }
        }),
        { wrapper }
      );

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results.every(r => 
        r.context.flow === 'checkout'
      )).toBe(true);
    });

    test('should provide loading state', () => {
      const { result } = renderHook(
        () => useDiscovery({ type: 'action' }, { debounce: 100 }),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(false);
      // Loading state tested with async operations
    });

    test('should handle empty results', () => {
      const { result } = renderHook(
        () => useDiscovery({ type: 'non-existent' }),
        { wrapper }
      );

      expect(result.current.results).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe('useRelationships', () => {
    beforeEach(() => {
      window.__SEMANTIC_REGISTRY__.set('parent', {
        id: 'parent',
        element: { type: 'container' },
        relationships: {
          children: ['child1', 'child2'],
          triggers: ['action1']
        }
      });
      
      window.__SEMANTIC_REGISTRY__.set('child1', {
        id: 'child1',
        element: { type: 'display' },
        relationships: {
          parent: 'parent',
          siblings: ['child2']
        }
      });
      
      window.__SEMANTIC_REGISTRY__.set('child2', {
        id: 'child2',
        element: { type: 'display' },
        relationships: {
          parent: 'parent',
          siblings: ['child1']
        }
      });
    });

    test('should resolve component relationships', () => {
      const { result } = renderHook(
        () => useRelationships('parent'),
        { wrapper }
      );

      expect(result.current.relationships.children).toHaveLength(2);
      expect(result.current.relationships.children.map(c => c.id))
        .toEqual(['child1', 'child2']);
    });

    test('should update when relationships change', async () => {
      const { result, rerender } = renderHook(
        ({ id }) => useRelationships(id),
        {
          wrapper,
          initialProps: { id: 'parent' }
        }
      );

      expect(result.current.relationships.children).toHaveLength(2);

      act(() => {
        const parent = window.__SEMANTIC_REGISTRY__.get('parent');
        parent.relationships.children.push('child3');
        window.__SEMANTIC_REGISTRY__.set('child3', {
          id: 'child3',
          element: { type: 'display' }
        });
        window.dispatchEvent(new CustomEvent('semantic:updated'));
      });

      await waitFor(() => {
        expect(result.current.relationships.children).toHaveLength(3);
      });
    });

    test('should detect circular relationships', () => {
      window.__SEMANTIC_REGISTRY__.set('circular1', {
        id: 'circular1',
        relationships: { next: 'circular2' }
      });
      
      window.__SEMANTIC_REGISTRY__.set('circular2', {
        id: 'circular2',
        relationships: { next: 'circular1' }
      });

      const { result } = renderHook(
        () => useRelationships('circular1'),
        { wrapper }
      );

      expect(result.current.hasCircularDependency).toBe(true);
      expect(result.current.circularPath).toEqual(['circular1', 'circular2', 'circular1']);
    });

    test('should build relationship graph', () => {
      const { result } = renderHook(
        () => useRelationships('parent'),
        { wrapper }
      );

      expect(result.current.graph.nodes).toHaveLength(3);
      expect(result.current.graph.edges).toContainEqual({
        from: 'parent',
        to: 'child1',
        type: 'children'
      });
    });

    test('should handle non-existent component', () => {
      const { result } = renderHook(
        () => useRelationships('non-existent'),
        { wrapper }
      );

      expect(result.current.relationships).toEqual({});
      expect(result.current.error).toBe('Component not found');
    });
  });

  describe('Integration with Components', () => {
    test('should work with React components', () => {
      const SubmitButton = () => {
        const { ref, manifest } = useSemantics({
          element: { type: 'action', intent: 'submit' },
          context: { variant: 'primary' }
        });

        return (
          <button ref={ref} data-testid="submit-button">
            Submit ({manifest.element.intent})
          </button>
        );
      };

      render(
        <SemanticProvider>
          <SubmitButton />
        </SemanticProvider>
      );

      const button = screen.getByTestId('submit-button');
      expect(button).toHaveTextContent('Submit (submit)');
    });

    test('should handle dynamic updates', async () => {
      const DynamicComponent = () => {
        const [intent, setIntent] = React.useState('submit');
        const { manifest } = useSemantics({
          element: { type: 'action', intent }
        });

        return (
          <div>
            <button onClick={() => setIntent('cancel')}>
              Change Intent
            </button>
            <span data-testid="intent">{manifest.element.intent}</span>
          </div>
        );
      };

      render(
        <SemanticProvider>
          <DynamicComponent />
        </SemanticProvider>
      );

      expect(screen.getByTestId('intent')).toHaveTextContent('submit');

      fireEvent.click(screen.getByText('Change Intent'));
      
      await waitFor(() => {
        expect(screen.getByTestId('intent')).toHaveTextContent('cancel');
      });
    });
  });
});