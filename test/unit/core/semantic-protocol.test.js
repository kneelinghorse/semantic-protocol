const { SemanticProtocol, Manifest, Registry, Validator } = require('../../../packages/core/src');

describe('SemanticProtocol Core', () => {
  let protocol;
  
  beforeEach(() => {
    protocol = new SemanticProtocol();
    protocol.registry.clear();
  });

  describe('Manifest Creation and Validation', () => {
    test('should create valid manifest with required fields', () => {
      const manifest = new Manifest({
        id: 'test-component',
        element: {
          type: 'action',
          intent: 'submit'
        }
      });

      expect(manifest.id).toBe('test-component');
      expect(manifest.element.type).toBe('action');
      expect(manifest.element.intent).toBe('submit');
    });

    test('should validate manifest structure', () => {
      const valid = {
        id: 'button-1',
        element: { type: 'action', intent: 'submit' },
        context: { flow: 'checkout' }
      };

      const invalid = {
        id: 'button-2',
        // Missing required 'element' field
      };

      expect(Validator.validate(valid).valid).toBe(true);
      expect(Validator.validate(invalid).valid).toBe(false);
    });

    test('should support inheritance and composition', () => {
      const base = new Manifest({
        id: 'base',
        element: { type: 'action' },
        context: { theme: 'dark' }
      });

      const extended = new Manifest({
        id: 'extended',
        extends: 'base',
        element: { intent: 'submit' },
        context: { flow: 'payment' }
      });

      protocol.registry.register(base);
      const resolved = protocol.resolveManifest(extended);
      
      expect(resolved.element.type).toBe('action');
      expect(resolved.element.intent).toBe('submit');
      expect(resolved.context.theme).toBe('dark');
      expect(resolved.context.flow).toBe('payment');
    });

    test('should detect circular inheritance', () => {
      const manifest1 = new Manifest({
        id: 'comp1',
        extends: 'comp2',
        element: { type: 'display' }
      });

      const manifest2 = new Manifest({
        id: 'comp2',
        extends: 'comp1',
        element: { type: 'display' }
      });

      protocol.registry.register(manifest1);
      protocol.registry.register(manifest2);

      expect(() => {
        protocol.resolveManifest(manifest1);
      }).toThrow('Circular inheritance detected');
    });

    test('should support version compatibility', () => {
      const v1Manifest = new Manifest({
        version: '1.0.0',
        id: 'v1-component',
        element: { type: 'action' }
      });

      const v2Manifest = new Manifest({
        version: '2.0.0',
        id: 'v2-component',
        element: { type: 'action', intent: 'submit' }
      });

      expect(protocol.isCompatible(v1Manifest, '1.x')).toBe(true);
      expect(protocol.isCompatible(v2Manifest, '1.x')).toBe(false);
      expect(protocol.isCompatible(v2Manifest, '>=2.0.0')).toBe(true);
    });

    test('should compute manifest differences', () => {
      const original = new Manifest({
        id: 'comp',
        element: { type: 'action', intent: 'submit' },
        context: { flow: 'checkout' }
      });

      const modified = new Manifest({
        id: 'comp',
        element: { type: 'action', intent: 'cancel' },
        context: { flow: 'checkout', step: 2 }
      });

      const diff = protocol.diff(original, modified);
      
      expect(diff.changes).toContainEqual({
        path: 'element.intent',
        old: 'submit',
        new: 'cancel'
      });
      expect(diff.changes).toContainEqual({
        path: 'context.step',
        old: undefined,
        new: 2
      });
    });
  });

  describe('Component Registration', () => {
    test('should register component with manifest', () => {
      const manifest = new Manifest({
        id: 'button-submit',
        element: { type: 'action', intent: 'submit' }
      });

      const result = protocol.register(manifest);
      
      expect(result.success).toBe(true);
      expect(protocol.registry.get('button-submit')).toEqual(manifest);
    });

    test('should handle duplicate registration', () => {
      const manifest = new Manifest({
        id: 'duplicate',
        element: { type: 'display' }
      });

      protocol.register(manifest);
      const result = protocol.register(manifest, { allowOverride: false });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });

    test('should update existing registration', () => {
      const original = new Manifest({
        id: 'updatable',
        element: { type: 'action', intent: 'submit' }
      });

      const updated = new Manifest({
        id: 'updatable',
        element: { type: 'action', intent: 'cancel' }
      });

      protocol.register(original);
      protocol.update('updatable', updated);
      
      const retrieved = protocol.registry.get('updatable');
      expect(retrieved.element.intent).toBe('cancel');
    });

    test('should unregister component', () => {
      const manifest = new Manifest({
        id: 'removable',
        element: { type: 'display' }
      });

      protocol.register(manifest);
      expect(protocol.registry.has('removable')).toBe(true);
      
      protocol.unregister('removable');
      expect(protocol.registry.has('removable')).toBe(false);
    });

    test('should batch register multiple components', () => {
      const manifests = [
        new Manifest({ id: 'comp1', element: { type: 'action' } }),
        new Manifest({ id: 'comp2', element: { type: 'display' } }),
        new Manifest({ id: 'comp3', element: { type: 'input' } })
      ];

      const results = protocol.registerBatch(manifests);
      
      expect(results.every(r => r.success)).toBe(true);
      expect(protocol.registry.size).toBe(3);
    });
  });

  describe('Performance', () => {
    test('should register 1000 components in under 5ms each', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        protocol.register(new Manifest({
          id: `perf-component-${i}`,
          element: { type: 'action', intent: `action-${i}` }
        }));
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;
      
      expect(avgTime).toBeLessThan(5);
    });

    test('should validate deeply nested manifest quickly', () => {
      const deepManifest = {
        id: 'deep',
        element: { type: 'container' },
        context: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    data: 'deep value'
                  }
                }
              }
            }
          }
        }
      };

      const startTime = performance.now();
      const result = Validator.validate(deepManifest);
      const endTime = performance.now();
      
      expect(result.valid).toBe(true);
      expect(endTime - startTime).toBeLessThan(10);
    });
  });

  describe('Error Handling', () => {
    test('should provide helpful error messages', () => {
      const invalidManifest = {
        element: { type: 123 } // Invalid type
      };

      const result = Validator.validate(invalidManifest);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('type');
      expect(result.errors[0].path).toBe('element.type');
    });

    test('should handle null and undefined gracefully', () => {
      expect(() => protocol.register(null)).toThrow('Invalid manifest');
      expect(() => protocol.register(undefined)).toThrow('Invalid manifest');
      expect(protocol.registry.get('non-existent')).toBeUndefined();
    });

    test('should validate required fields', () => {
      const incomplete = { element: {} };
      const result = Validator.validate(incomplete);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'id',
          message: expect.stringContaining('required')
        })
      );
    });
  });
});