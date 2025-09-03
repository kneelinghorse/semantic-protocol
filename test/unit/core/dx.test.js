const { DXTools, PerformanceMonitor, DebugVisualizer, ErrorFormatter } = require('../../../packages/core/src/dx');

describe('Developer Experience Tools', () => {
  describe('PerformanceMonitor', () => {
    let monitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
      monitor.clear();
    });

    test('should track operation performance', () => {
      const operation = monitor.startOperation('register');
      
      // Simulate some work
      const data = Array(1000).fill(0).map((_, i) => i * 2);
      
      operation.end();
      
      const metrics = monitor.getMetrics('register');
      expect(metrics).toHaveProperty('count', 1);
      expect(metrics).toHaveProperty('totalTime');
      expect(metrics).toHaveProperty('avgTime');
      expect(metrics.avgTime).toBeGreaterThan(0);
    });

    test('should calculate average performance over multiple operations', () => {
      for (let i = 0; i < 10; i++) {
        const op = monitor.startOperation('query');
        // Simulate varying work
        const delay = Math.random() * 10;
        const start = performance.now();
        while (performance.now() - start < delay) {
          // Busy wait
        }
        op.end();
      }
      
      const metrics = monitor.getMetrics('query');
      expect(metrics.count).toBe(10);
      expect(metrics.avgTime).toBeGreaterThan(0);
      expect(metrics.avgTime).toBeLessThan(metrics.maxTime);
    });

    test('should track memory usage', () => {
      const initialMemory = monitor.getMemoryUsage();
      
      // Allocate some memory
      const bigArray = Array(100000).fill({ data: 'test' });
      
      const finalMemory = monitor.getMemoryUsage();
      expect(finalMemory.heapUsed).toBeGreaterThan(initialMemory.heapUsed);
    });

    test('should identify performance bottlenecks', () => {
      // Fast operations
      for (let i = 0; i < 100; i++) {
        const op = monitor.startOperation('fast');
        op.end();
      }
      
      // Slow operations
      for (let i = 0; i < 10; i++) {
        const op = monitor.startOperation('slow');
        const start = performance.now();
        while (performance.now() - start < 50) {
          // Simulate slow operation
        }
        op.end();
      }
      
      const bottlenecks = monitor.getBottlenecks();
      expect(bottlenecks[0].operation).toBe('slow');
      expect(bottlenecks[0].avgTime).toBeGreaterThan(40);
    });

    test('should generate performance report', () => {
      monitor.startOperation('register').end();
      monitor.startOperation('query').end();
      monitor.startOperation('update').end();
      
      const report = monitor.generateReport();
      
      expect(report).toContain('Performance Report');
      expect(report).toContain('register');
      expect(report).toContain('query');
      expect(report).toContain('update');
      expect(report).toContain('Memory Usage');
    });

    test('should export metrics as JSON', () => {
      monitor.startOperation('test').end();
      
      const json = monitor.exportMetrics();
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveProperty('operations');
      expect(parsed).toHaveProperty('memory');
      expect(parsed).toHaveProperty('timestamp');
    });
  });

  describe('DebugVisualizer', () => {
    let visualizer;

    beforeEach(() => {
      visualizer = new DebugVisualizer();
    });

    test('should generate component tree visualization', () => {
      const components = [
        {
          id: 'root',
          element: { type: 'container' },
          relationships: { children: ['child1', 'child2'] }
        },
        {
          id: 'child1',
          element: { type: 'display' },
          relationships: { parent: 'root' }
        },
        {
          id: 'child2',
          element: { type: 'action' },
          relationships: { parent: 'root' }
        }
      ];
      
      const tree = visualizer.generateTree(components);
      
      expect(tree).toContain('root');
      expect(tree).toContain('├── child1');
      expect(tree).toContain('└── child2');
    });

    test('should visualize manifest structure', () => {
      const manifest = {
        id: 'complex-component',
        element: {
          type: 'container',
          intent: 'layout'
        },
        context: {
          flow: 'checkout',
          step: 2,
          nested: {
            deep: {
              value: 'test'
            }
          }
        },
        tags: ['primary', 'critical']
      };
      
      const visualization = visualizer.visualizeManifest(manifest);
      
      expect(visualization).toContain('complex-component');
      expect(visualization).toContain('type: container');
      expect(visualization).toContain('intent: layout');
      expect(visualization).toContain('flow: checkout');
      expect(visualization).toContain('tags:');
    });

    test('should generate relationship graph', () => {
      const relationships = [
        { from: 'A', to: 'B', type: 'parent' },
        { from: 'B', to: 'C', type: 'triggers' },
        { from: 'C', to: 'A', type: 'updates' }
      ];
      
      const graph = visualizer.generateRelationshipGraph(relationships);
      
      expect(graph).toContain('A --[parent]--> B');
      expect(graph).toContain('B --[triggers]--> C');
      expect(graph).toContain('C --[updates]--> A');
    });

    test('should highlight circular dependencies', () => {
      const components = [
        {
          id: 'A',
          extends: 'B'
        },
        {
          id: 'B',
          extends: 'C'
        },
        {
          id: 'C',
          extends: 'A'
        }
      ];
      
      const visualization = visualizer.detectCircularDependencies(components);
      
      expect(visualization).toContain('Circular dependency detected');
      expect(visualization).toContain('A → B → C → A');
    });

    test('should generate debug state snapshot', () => {
      const state = {
        registry: { size: 42, components: ['comp1', 'comp2'] },
        cache: { hits: 100, misses: 10, size: '2.3MB' },
        performance: { avgQueryTime: '12ms', operations: 500 }
      };
      
      const snapshot = visualizer.generateSnapshot(state);
      
      expect(snapshot).toContain('Registry: 42 components');
      expect(snapshot).toContain('Cache: 100 hits, 10 misses');
      expect(snapshot).toContain('Performance: 12ms avg query');
    });

    test('should export visualization as HTML', () => {
      const data = {
        components: [{ id: 'test', element: { type: 'display' } }],
        relationships: []
      };
      
      const html = visualizer.exportAsHTML(data);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<svg');
      expect(html).toContain('test');
    });
  });

  describe('ErrorFormatter', () => {
    let formatter;

    beforeEach(() => {
      formatter = new ErrorFormatter();
    });

    test('should format validation errors', () => {
      const errors = [
        {
          field: 'element.type',
          message: 'Invalid type value',
          expected: 'string',
          received: 'number'
        },
        {
          field: 'id',
          message: 'Required field missing'
        }
      ];
      
      const formatted = formatter.formatValidationErrors(errors);
      
      expect(formatted).toContain('Validation Errors:');
      expect(formatted).toContain('element.type');
      expect(formatted).toContain('Invalid type value');
      expect(formatted).toContain('Expected: string, Received: number');
    });

    test('should format runtime errors with stack trace', () => {
      const error = new Error('Component not found: missing-component');
      error.stack = `Error: Component not found: missing-component
        at Registry.get (registry.js:42:15)
        at DiscoveryEngine.find (discovery.js:78:20)`;
      
      const formatted = formatter.formatRuntimeError(error);
      
      expect(formatted).toContain('Runtime Error:');
      expect(formatted).toContain('Component not found: missing-component');
      expect(formatted).toContain('Stack Trace:');
      expect(formatted).toContain('registry.js:42');
    });

    test('should provide helpful suggestions for common errors', () => {
      const error = {
        type: 'DUPLICATE_ID',
        id: 'button-submit',
        message: 'Component with ID already exists'
      };
      
      const formatted = formatter.formatWithSuggestions(error);
      
      expect(formatted).toContain('Component with ID already exists');
      expect(formatted).toContain('Suggestions:');
      expect(formatted).toContain('Use a unique ID');
      expect(formatted).toContain('Check for duplicate registrations');
    });

    test('should format circular dependency errors', () => {
      const error = {
        type: 'CIRCULAR_DEPENDENCY',
        path: ['comp1', 'comp2', 'comp3', 'comp1']
      };
      
      const formatted = formatter.formatCircularDependency(error);
      
      expect(formatted).toContain('Circular Dependency Detected');
      expect(formatted).toContain('comp1 → comp2 → comp3 → comp1');
      expect(formatted).toContain('Break the cycle');
    });

    test('should generate error report', () => {
      const errors = [
        { type: 'VALIDATION', count: 5 },
        { type: 'RUNTIME', count: 2 },
        { type: 'PERFORMANCE', count: 1 }
      ];
      
      const report = formatter.generateErrorReport(errors);
      
      expect(report).toContain('Error Summary');
      expect(report).toContain('Validation Errors: 5');
      expect(report).toContain('Runtime Errors: 2');
      expect(report).toContain('Performance Issues: 1');
      expect(report).toContain('Total: 8');
    });

    test('should export errors as structured JSON', () => {
      const errors = [
        {
          timestamp: Date.now(),
          type: 'VALIDATION',
          field: 'element.type',
          message: 'Invalid type'
        }
      ];
      
      const json = formatter.exportErrors(errors);
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveProperty('errors');
      expect(parsed.errors[0]).toHaveProperty('timestamp');
      expect(parsed.errors[0]).toHaveProperty('type', 'VALIDATION');
    });
  });

  describe('DXTools Integration', () => {
    let dx;

    beforeEach(() => {
      dx = new DXTools();
    });

    test('should initialize all tools', () => {
      expect(dx.monitor).toBeDefined();
      expect(dx.visualizer).toBeDefined();
      expect(dx.formatter).toBeDefined();
    });

    test('should enable/disable debug mode', () => {
      expect(dx.isDebugMode()).toBe(false);
      
      dx.enableDebug();
      expect(dx.isDebugMode()).toBe(true);
      
      dx.disableDebug();
      expect(dx.isDebugMode()).toBe(false);
    });

    test('should intercept and log operations in debug mode', () => {
      const logs = [];
      dx.onLog((log) => logs.push(log));
      
      dx.enableDebug();
      dx.logOperation('register', { id: 'test-component' });
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('register');
      expect(logs[0]).toContain('test-component');
    });

    test('should generate comprehensive debug report', () => {
      // Simulate some operations
      const op1 = dx.monitor.startOperation('register');
      op1.end();
      
      const op2 = dx.monitor.startOperation('query');
      op2.end();
      
      dx.formatter.logError({
        type: 'VALIDATION',
        message: 'Test error'
      });
      
      const report = dx.generateDebugReport();
      
      expect(report).toContain('Debug Report');
      expect(report).toContain('Performance Metrics');
      expect(report).toContain('register');
      expect(report).toContain('query');
      expect(report).toContain('Errors');
    });

    test('should export telemetry data', () => {
      dx.monitor.startOperation('test').end();
      
      const telemetry = dx.exportTelemetry();
      
      expect(telemetry).toHaveProperty('performance');
      expect(telemetry).toHaveProperty('errors');
      expect(telemetry).toHaveProperty('timestamp');
      expect(telemetry).toHaveProperty('version');
    });

    test('should provide development helpers', () => {
      const helpers = dx.getHelpers();
      
      expect(helpers).toHaveProperty('validateManifest');
      expect(helpers).toHaveProperty('analyzePerformance');
      expect(helpers).toHaveProperty('debugComponent');
      expect(helpers).toHaveProperty('inspectRelationships');
    });
  });
});