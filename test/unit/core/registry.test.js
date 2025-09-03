const { Registry, DiscoveryEngine } = require('../../../packages/core/src');

describe('Registry and Discovery', () => {
  let registry;
  let discovery;

  beforeEach(() => {
    registry = new Registry();
    discovery = new DiscoveryEngine(registry);
  });

  describe('Registry Operations', () => {
    test('should store and retrieve components', () => {
      const manifest = {
        id: 'test-component',
        element: { type: 'action', intent: 'submit' }
      };

      registry.set('test-component', manifest);
      const retrieved = registry.get('test-component');
      
      expect(retrieved).toEqual(manifest);
    });

    test('should check component existence', () => {
      registry.set('exists', { id: 'exists', element: { type: 'display' } });
      
      expect(registry.has('exists')).toBe(true);
      expect(registry.has('not-exists')).toBe(false);
    });

    test('should clear all components', () => {
      registry.set('comp1', { id: 'comp1' });
      registry.set('comp2', { id: 'comp2' });
      
      expect(registry.size).toBe(2);
      registry.clear();
      expect(registry.size).toBe(0);
    });

    test('should iterate over components', () => {
      const components = [
        { id: 'comp1', element: { type: 'action' } },
        { id: 'comp2', element: { type: 'display' } },
        { id: 'comp3', element: { type: 'input' } }
      ];

      components.forEach(c => registry.set(c.id, c));
      
      const collected = [];
      registry.forEach((manifest, id) => {
        collected.push({ id, type: manifest.element.type });
      });
      
      expect(collected).toHaveLength(3);
      expect(collected).toContainEqual({ id: 'comp1', type: 'action' });
    });

    test('should maintain insertion order', () => {
      registry.set('third', { id: 'third' });
      registry.set('first', { id: 'first' });
      registry.set('second', { id: 'second' });
      
      const keys = Array.from(registry.keys());
      expect(keys).toEqual(['third', 'first', 'second']);
    });
  });

  describe('Discovery Queries', () => {
    beforeEach(() => {
      // Populate registry with test data
      registry.set('button-submit', {
        id: 'button-submit',
        element: { type: 'action', intent: 'submit' },
        context: { flow: 'checkout', step: 3 },
        tags: ['primary', 'critical']
      });
      
      registry.set('button-cancel', {
        id: 'button-cancel',
        element: { type: 'action', intent: 'cancel' },
        context: { flow: 'checkout', step: 3 },
        tags: ['secondary']
      });
      
      registry.set('form-payment', {
        id: 'form-payment',
        element: { type: 'input', intent: 'collect' },
        context: { flow: 'payment', validation: 'required' },
        tags: ['critical', 'secure']
      });
      
      registry.set('heading-main', {
        id: 'heading-main',
        element: { type: 'display', intent: 'title' },
        context: { level: 1 }
      });
    });

    test('should find components by type', () => {
      const results = discovery.find({ type: 'action' });
      
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id)).toContain('button-submit');
      expect(results.map(r => r.id)).toContain('button-cancel');
    });

    test('should find components by intent', () => {
      const results = discovery.find({ intent: 'submit' });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('button-submit');
    });

    test('should find components by context', () => {
      const results = discovery.find({
        context: { flow: 'checkout' }
      });
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.context.flow === 'checkout')).toBe(true);
    });

    test('should find components by tags', () => {
      const results = discovery.find({
        tags: ['critical']
      });
      
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id)).toContain('button-submit');
      expect(results.map(r => r.id)).toContain('form-payment');
    });

    test('should support complex queries', () => {
      const results = discovery.find({
        type: 'action',
        context: { step: 3 },
        tags: ['primary']
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('button-submit');
    });

    test('should support wildcard queries', () => {
      const results = discovery.find({
        id: 'button-*'
      });
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.id.startsWith('button-'))).toBe(true);
    });

    test('should support NOT queries', () => {
      const results = discovery.find({
        type: '!display'
      });
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.element.type !== 'display')).toBe(true);
    });

    test('should support OR queries', () => {
      const results = discovery.find({
        intent: ['submit', 'cancel']
      });
      
      expect(results).toHaveLength(2);
      expect(results.map(r => r.element.intent))
        .toEqual(expect.arrayContaining(['submit', 'cancel']));
    });

    test('should return empty array for no matches', () => {
      const results = discovery.find({
        type: 'non-existent'
      });
      
      expect(results).toEqual([]);
    });

    test('should cache query results', () => {
      const query = { type: 'action' };
      
      const startTime1 = performance.now();
      const results1 = discovery.find(query);
      const time1 = performance.now() - startTime1;
      
      const startTime2 = performance.now();
      const results2 = discovery.find(query);
      const time2 = performance.now() - startTime2;
      
      expect(results1).toEqual(results2);
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('Relationship Resolution', () => {
    beforeEach(() => {
      registry.set('parent', {
        id: 'parent',
        element: { type: 'container' },
        relationships: {
          children: ['child1', 'child2'],
          triggers: ['action1']
        }
      });
      
      registry.set('child1', {
        id: 'child1',
        element: { type: 'display' },
        relationships: {
          parent: 'parent',
          siblings: ['child2']
        }
      });
      
      registry.set('child2', {
        id: 'child2',
        element: { type: 'display' },
        relationships: {
          parent: 'parent',
          siblings: ['child1']
        }
      });
      
      registry.set('action1', {
        id: 'action1',
        element: { type: 'action' },
        relationships: {
          triggeredBy: 'parent'
        }
      });
    });

    test('should resolve parent-child relationships', () => {
      const parent = registry.get('parent');
      const children = discovery.resolveRelationships(parent, 'children');
      
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toEqual(['child1', 'child2']);
    });

    test('should resolve bidirectional relationships', () => {
      const child1 = registry.get('child1');
      const parent = discovery.resolveRelationships(child1, 'parent')[0];
      
      expect(parent.id).toBe('parent');
      expect(parent.relationships.children).toContain('child1');
    });

    test('should detect circular relationships', () => {
      registry.set('circular1', {
        id: 'circular1',
        relationships: { next: 'circular2' }
      });
      
      registry.set('circular2', {
        id: 'circular2',
        relationships: { next: 'circular1' }
      });
      
      const component = registry.get('circular1');
      const path = discovery.detectCircularRelationships(component);
      
      expect(path).toEqual(['circular1', 'circular2', 'circular1']);
    });

    test('should build relationship graph', () => {
      const graph = discovery.buildRelationshipGraph();
      
      expect(graph.nodes).toHaveLength(4);
      expect(graph.edges).toContainEqual({
        from: 'parent',
        to: 'child1',
        type: 'children'
      });
    });
  });

  describe('Performance', () => {
    test('should handle large registries efficiently', () => {
      // Populate with 10000 components
      for (let i = 0; i < 10000; i++) {
        registry.set(`component-${i}`, {
          id: `component-${i}`,
          element: {
            type: i % 3 === 0 ? 'action' : i % 3 === 1 ? 'display' : 'input',
            intent: `intent-${i % 10}`
          },
          tags: i % 2 === 0 ? ['even'] : ['odd']
        });
      }
      
      const startTime = performance.now();
      const results = discovery.find({ type: 'action' });
      const queryTime = performance.now() - startTime;
      
      expect(results.length).toBeGreaterThan(3000);
      expect(queryTime).toBeLessThan(50); // Should query in under 50ms
    });

    test('should optimize repeated queries', () => {
      for (let i = 0; i < 1000; i++) {
        registry.set(`comp-${i}`, {
          id: `comp-${i}`,
          element: { type: 'action' }
        });
      }
      
      const query = { type: 'action' };
      
      // Warm up cache
      discovery.find(query);
      
      const times = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        discovery.find(query);
        times.push(performance.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      expect(avgTime).toBeLessThan(1); // Cached queries under 1ms
    });
  });
});