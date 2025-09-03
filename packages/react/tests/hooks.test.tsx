import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SemanticProvider, useSemantics, useDiscovery, useRelationships } from '../src';
import { SemanticProtocol } from '@kneelinghorse/semantic-protocol';

describe('useSemantics Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SemanticProvider>{children}</SemanticProvider>
  );

  it('should register component with manifest', () => {
    const manifest = {
      name: 'TestComponent',
      version: '1.0.0',
      purpose: 'Testing semantic registration',
      capabilities: ['test'],
    };

    const { result } = renderHook(
      () => useSemantics({ manifest }),
      { wrapper }
    );

    expect(result.current.componentId).toBeDefined();
    expect(result.current.manifest).toEqual(manifest);
    expect(result.current.isRegistered).toBe(true);
  });

  it('should generate semantic props', () => {
    const manifest = {
      name: 'TestComponent',
      version: '1.0.0',
      purpose: 'Testing',
    };

    const { result } = renderHook(
      () => useSemantics({ manifest }),
      { wrapper }
    );

    expect(result.current.semanticProps).toHaveProperty('data-semantic-id');
    expect(result.current.semanticProps).toHaveProperty('data-semantic-name', 'TestComponent');
    expect(result.current.semanticProps).toHaveProperty('data-semantic-version', '1.0.0');
  });

  it('should update manifest', () => {
    const initialManifest = {
      name: 'TestComponent',
      version: '1.0.0',
      purpose: 'Initial purpose',
      capabilities: ['initial'],
    };

    const { result } = renderHook(
      () => useSemantics({ manifest: initialManifest }),
      { wrapper }
    );

    act(() => {
      result.current.updateManifest({
        purpose: 'Updated purpose',
        capabilities: ['updated'],
      });
    });

    expect(result.current.manifest.purpose).toBe('Updated purpose');
    expect(result.current.manifest.capabilities).toEqual(['updated']);
  });

  it('should add and remove capabilities', () => {
    const manifest = {
      name: 'TestComponent',
      version: '1.0.0',
      capabilities: ['initial'],
    };

    const { result } = renderHook(
      () => useSemantics({ manifest }),
      { wrapper }
    );

    act(() => {
      result.current.addCapability('new-capability');
    });

    expect(result.current.manifest.capabilities).toContain('new-capability');
    expect(result.current.manifest.capabilities).toContain('initial');

    act(() => {
      result.current.removeCapability('initial');
    });

    expect(result.current.manifest.capabilities).not.toContain('initial');
    expect(result.current.manifest.capabilities).toContain('new-capability');
  });

  it('should validate manifest when validateOnMount is true', async () => {
    const manifest = {
      name: 'TestComponent',
      version: '1.0.0',
      purpose: 'Testing validation',
    };

    const { result } = renderHook(
      () => useSemantics({ manifest, validateOnMount: true }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validate).toBeDefined();
    });

    const isValid = await result.current.validate();
    expect(typeof isValid).toBe('boolean');
  });

  it('should handle manual registration', () => {
    const manifest = {
      name: 'TestComponent',
      version: '1.0.0',
    };

    const { result } = renderHook(
      () => useSemantics({ manifest, autoRegister: false }),
      { wrapper }
    );

    expect(result.current.isRegistered).toBe(false);

    act(() => {
      result.current.register();
    });

    expect(result.current.isRegistered).toBe(true);

    act(() => {
      result.current.unregister();
    });

    expect(result.current.isRegistered).toBe(false);
  });
});

describe('useDiscovery Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SemanticProvider>{children}</SemanticProvider>
  );

  beforeEach(() => {
    // Register some test components
    const { result: component1 } = renderHook(
      () => useSemantics({
        manifest: {
          name: 'Component1',
          version: '1.0.0',
          capabilities: ['capability1', 'shared'],
          metadata: { tags: ['tag1', 'shared'] },
        },
      }),
      { wrapper }
    );

    const { result: component2 } = renderHook(
      () => useSemantics({
        manifest: {
          name: 'Component2',
          version: '1.0.0',
          capabilities: ['capability2', 'shared'],
          metadata: { tags: ['tag2', 'shared'] },
        },
      }),
      { wrapper }
    );
  });

  it('should discover components by capability', async () => {
    const { result } = renderHook(
      () => useDiscovery({
        query: { capabilities: ['shared'] },
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    const sharedComponents = result.current.findByCapability('shared');
    expect(sharedComponents.length).toBeGreaterThan(0);
  });

  it('should discover components by tag', async () => {
    const { result } = renderHook(
      () => useDiscovery({
        query: { tags: ['shared'] },
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    const taggedComponents = result.current.findByTag('shared');
    expect(taggedComponents.length).toBeGreaterThan(0);
  });

  it('should group components by type', async () => {
    const { result } = renderHook(
      () => useDiscovery({
        query: {},
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    const grouped = result.current.groupByType();
    expect(typeof grouped).toBe('object');
  });

  it('should sort components by relevance', async () => {
    const { result } = renderHook(
      () => useDiscovery({
        query: {},
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    const sorted = result.current.sortByRelevance({
      capabilities: ['shared'],
      tags: ['shared'],
    });

    expect(Array.isArray(sorted)).toBe(true);
  });

  it('should refresh discovery results', async () => {
    const { result } = renderHook(
      () => useDiscovery({
        query: { capabilities: ['shared'] },
        cache: true,
      }),
      { wrapper }
    );

    const initialCount = result.current.count;

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useRelationships Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SemanticProvider>{children}</SemanticProvider>
  );

  it('should manage component relationships', () => {
    const { result: parentResult } = renderHook(
      () => useSemantics({
        manifest: {
          name: 'ParentComponent',
          version: '1.0.0',
        },
      }),
      { wrapper }
    );

    const parentId = parentResult.current.componentId;

    const { result } = renderHook(
      () => useRelationships({ componentId: parentId }),
      { wrapper }
    );

    act(() => {
      result.current.addRelationship('child-1', 'parent-of' as any, { order: 1 });
      result.current.addRelationship('child-2', 'parent-of' as any, { order: 2 });
    });

    expect(result.current.relationships.length).toBe(2);
    expect(result.current.hasRelationship('child-1')).toBe(true);
    expect(result.current.hasRelationship('child-2')).toBe(true);
  });

  it('should get relationships by type', () => {
    const { result: componentResult } = renderHook(
      () => useSemantics({
        manifest: {
          name: 'TestComponent',
          version: '1.0.0',
        },
      }),
      { wrapper }
    );

    const componentId = componentResult.current.componentId;

    const { result } = renderHook(
      () => useRelationships({ componentId }),
      { wrapper }
    );

    act(() => {
      result.current.addRelationship('parent-1', 'child-of' as any);
      result.current.addRelationship('child-1', 'parent-of' as any);
      result.current.addRelationship('dep-1', 'depends-on' as any);
    });

    const parentRelationships = result.current.getRelationshipsByType('child-of' as any);
    const childRelationships = result.current.getRelationshipsByType('parent-of' as any);
    const dependencies = result.current.getRelationshipsByType('depends-on' as any);

    expect(parentRelationships.length).toBe(1);
    expect(childRelationships.length).toBe(1);
    expect(dependencies.length).toBe(1);
  });

  it('should remove relationships', () => {
    const { result: componentResult } = renderHook(
      () => useSemantics({
        manifest: {
          name: 'TestComponent',
          version: '1.0.0',
        },
      }),
      { wrapper }
    );

    const componentId = componentResult.current.componentId;

    const { result } = renderHook(
      () => useRelationships({ componentId }),
      { wrapper }
    );

    act(() => {
      result.current.addRelationship('target-1', 'depends-on' as any);
      result.current.addRelationship('target-2', 'depends-on' as any);
    });

    expect(result.current.relationships.length).toBe(2);

    act(() => {
      result.current.removeRelationship('target-1');
    });

    expect(result.current.relationships.length).toBe(1);
    expect(result.current.hasRelationship('target-1')).toBe(false);
    expect(result.current.hasRelationship('target-2')).toBe(true);
  });

  it('should get relationship graph', () => {
    const { result: componentResult } = renderHook(
      () => useSemantics({
        manifest: {
          name: 'TestComponent',
          version: '1.0.0',
        },
      }),
      { wrapper }
    );

    const componentId = componentResult.current.componentId;

    const { result } = renderHook(
      () => useRelationships({ componentId }),
      { wrapper }
    );

    act(() => {
      result.current.addRelationship('node-1', 'depends-on' as any);
      result.current.addRelationship('node-2', 'parent-of' as any);
    });

    const graph = result.current.getRelationshipGraph();

    expect(graph.nodes).toContain(componentId);
    expect(graph.nodes).toContain('node-1');
    expect(graph.nodes).toContain('node-2');
    expect(graph.edges.length).toBe(2);
  });

  it('should traverse relationships', () => {
    const { result: componentResult } = renderHook(
      () => useSemantics({
        manifest: {
          name: 'TestComponent',
          version: '1.0.0',
        },
      }),
      { wrapper }
    );

    const componentId = componentResult.current.componentId;

    const { result } = renderHook(
      () => useRelationships({ componentId }),
      { wrapper }
    );

    act(() => {
      result.current.addRelationship('level-1', 'depends-on' as any);
    });

    const traversed = result.current.traverseRelationships(componentId, 'depends-on' as any, 2);

    expect(Array.isArray(traversed)).toBe(true);
  });
});