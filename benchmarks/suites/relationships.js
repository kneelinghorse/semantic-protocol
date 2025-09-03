const { Suite } = require('benchmark');

class RelationshipBenchmarks {
  constructor(protocol) {
    this.protocol = protocol;
    this.suite = new Suite();
    this.components = [];
    this.graphs = {
      simple: null,
      complex: null,
      deep: null,
      wide: null
    };
  }

  async setup() {
    // Clear any existing components
    this.protocol.clear();

    // Create simple parent-child relationship graph
    this.graphs.simple = this.createSimpleGraph();

    // Create complex multi-relationship graph
    this.graphs.complex = this.createComplexGraph();

    // Create deep hierarchy (10 levels)
    this.graphs.deep = this.createDeepGraph(10);

    // Create wide graph (100 siblings)
    this.graphs.wide = this.createWideGraph(100);

    // Register all components
    await this.registerGraphs();
  }

  createSimpleGraph() {
    return [
      {
        id: 'parent-1',
        protocol: 'semantic-ui/v2',
        element: { type: 'container', intent: 'parent container' },
        relationships: {
          children: ['child-1', 'child-2']
        }
      },
      {
        id: 'child-1',
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'first child' },
        relationships: {
          parent: 'parent-1',
          validators: ['validator-1']
        }
      },
      {
        id: 'child-2',
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'second child' },
        relationships: {
          parent: 'parent-1',
          dependencies: ['child-1']
        }
      },
      {
        id: 'validator-1',
        protocol: 'semantic-ui/v2',
        element: { type: 'action', intent: 'validate input' }
      }
    ];
  }

  createComplexGraph() {
    const components = [];
    
    // Create form container
    components.push({
      id: 'form-container',
      protocol: 'semantic-ui/v2',
      element: { type: 'container', intent: 'complex form' },
      relationships: {
        children: ['section-1', 'section-2', 'section-3'],
        handlers: ['submit-handler', 'reset-handler']
      }
    });

    // Create sections
    for (let i = 1; i <= 3; i++) {
      components.push({
        id: `section-${i}`,
        protocol: 'semantic-ui/v2',
        element: { type: 'container', intent: `section ${i}` },
        relationships: {
          parent: 'form-container',
          children: [`field-${i}-1`, `field-${i}-2`, `field-${i}-3`],
          validators: [`section-validator-${i}`]
        }
      });

      // Create fields for each section
      for (let j = 1; j <= 3; j++) {
        components.push({
          id: `field-${i}-${j}`,
          protocol: 'semantic-ui/v2',
          element: { type: 'input', intent: `field ${i}-${j}` },
          relationships: {
            parent: `section-${i}`,
            validators: [`field-validator-${i}-${j}`],
            dependencies: j > 1 ? [`field-${i}-${j-1}`] : []
          }
        });

        // Create field validator
        components.push({
          id: `field-validator-${i}-${j}`,
          protocol: 'semantic-ui/v2',
          element: { type: 'action', intent: `validate field ${i}-${j}` }
        });
      }

      // Create section validator
      components.push({
        id: `section-validator-${i}`,
        protocol: 'semantic-ui/v2',
        element: { type: 'action', intent: `validate section ${i}` },
        relationships: {
          dependencies: [`field-${i}-1`, `field-${i}-2`, `field-${i}-3`]
        }
      });
    }

    // Create handlers
    components.push({
      id: 'submit-handler',
      protocol: 'semantic-ui/v2',
      element: { type: 'action', intent: 'submit form' },
      relationships: {
        dependencies: ['section-1', 'section-2', 'section-3']
      }
    });

    components.push({
      id: 'reset-handler',
      protocol: 'semantic-ui/v2',
      element: { type: 'action', intent: 'reset form' }
    });

    return components;
  }

  createDeepGraph(depth) {
    const components = [];
    
    for (let i = 0; i < depth; i++) {
      const component = {
        id: `level-${i}`,
        protocol: 'semantic-ui/v2',
        element: { 
          type: i === depth - 1 ? 'input' : 'container',
          intent: `level ${i} component`
        },
        relationships: {}
      };

      if (i > 0) {
        component.relationships.parent = `level-${i - 1}`;
      }
      
      if (i < depth - 1) {
        component.relationships.children = [`level-${i + 1}`];
      }

      // Add some cross-level dependencies
      if (i > 1) {
        component.relationships.dependencies = [`level-${i - 2}`];
      }

      components.push(component);
    }

    return components;
  }

  createWideGraph(width) {
    const components = [];
    
    // Create parent container
    components.push({
      id: 'wide-parent',
      protocol: 'semantic-ui/v2',
      element: { type: 'container', intent: 'wide parent' },
      relationships: {
        children: Array(width).fill(null).map((_, i) => `wide-child-${i}`)
      }
    });

    // Create all children
    for (let i = 0; i < width; i++) {
      components.push({
        id: `wide-child-${i}`,
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: `child ${i}` },
        relationships: {
          parent: 'wide-parent',
          // Create dependency chain
          dependencies: i > 0 ? [`wide-child-${i - 1}`] : [],
          // Every 10th child has a validator
          validators: i % 10 === 0 ? [`validator-${i}`] : []
        }
      });

      // Create validators for every 10th child
      if (i % 10 === 0) {
        components.push({
          id: `validator-${i}`,
          protocol: 'semantic-ui/v2',
          element: { type: 'action', intent: `validate child ${i}` }
        });
      }
    }

    return components;
  }

  async registerGraphs() {
    // Register all graph components
    [...this.graphs.simple, ...this.graphs.complex, ...this.graphs.deep, ...this.graphs.wide]
      .forEach(component => {
        this.protocol.register(component);
      });
  }

  async run(options = {}) {
    await this.setup();

    const results = {
      tests: {},
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      totalOps: 0
    };

    // Test 1: Parent-child traversal
    await this.runTest('Parent-Child Traversal', () => {
      return this.protocol.getChildren('parent-1');
    }, results);

    // Test 2: Get all descendants
    await this.runTest('Get All Descendants', () => {
      return this.protocol.getDescendants('form-container');
    }, results);

    // Test 3: Get all ancestors
    await this.runTest('Get All Ancestors', () => {
      return this.protocol.getAncestors('field-2-2');
    }, results);

    // Test 4: Dependency resolution
    await this.runTest('Dependency Resolution', () => {
      return this.protocol.resolveDependencies('submit-handler');
    }, results);

    // Test 5: Full graph traversal
    await this.runTest('Full Graph Traversal', () => {
      return this.protocol.getRelationshipGraph('form-container');
    }, results);

    // Test 6: Deep hierarchy traversal
    await this.runTest('Deep Hierarchy Traversal', () => {
      return this.protocol.getDescendants('level-0');
    }, results);

    // Test 7: Wide graph traversal
    await this.runTest('Wide Graph Traversal', () => {
      return this.protocol.getChildren('wide-parent');
    }, results);

    // Test 8: Circular dependency detection
    await this.runTest('Circular Dependency Detection', () => {
      // Create circular dependency
      const comp1 = {
        id: 'circular-1',
        protocol: 'semantic-ui/v2',
        element: { type: 'container', intent: 'circular 1' },
        relationships: { dependencies: ['circular-2'] }
      };
      
      const comp2 = {
        id: 'circular-2',
        protocol: 'semantic-ui/v2',
        element: { type: 'container', intent: 'circular 2' },
        relationships: { dependencies: ['circular-3'] }
      };
      
      const comp3 = {
        id: 'circular-3',
        protocol: 'semantic-ui/v2',
        element: { type: 'container', intent: 'circular 3' },
        relationships: { dependencies: ['circular-1'] }
      };

      this.protocol.register(comp1);
      this.protocol.register(comp2);
      this.protocol.register(comp3);

      return this.protocol.detectCircularDependencies();
    }, results);

    // Test 9: Orphan detection
    await this.runTest('Orphan Detection', () => {
      // Create orphan component
      const orphan = {
        id: 'orphan-component',
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'orphaned input' },
        relationships: {
          parent: 'non-existent-parent'
        }
      };

      this.protocol.register(orphan);
      return this.protocol.detectOrphans();
    }, results);

    // Test 10: Relationship integrity check
    await this.runTest('Relationship Integrity', () => {
      return this.protocol.validateRelationshipIntegrity();
    }, results);

    // Test 11: Bidirectional relationship sync
    await this.runTest('Bidirectional Sync', () => {
      const parent = {
        id: 'bi-parent',
        protocol: 'semantic-ui/v2',
        element: { type: 'container', intent: 'bidirectional parent' },
        relationships: { children: ['bi-child'] }
      };

      const child = {
        id: 'bi-child',
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'bidirectional child' }
      };

      this.protocol.register(parent);
      this.protocol.register(child);
      
      // Check if child automatically gets parent relationship
      const childComponent = this.protocol.get('bi-child');
      return childComponent.relationships?.parent === 'bi-parent';
    }, results);

    // Test 12: Cascading updates
    await this.runTest('Cascading Updates', () => {
      // Update parent and check if children are notified
      this.protocol.update('form-container', {
        context: { theme: 'dark' }
      });

      const child = this.protocol.get('section-1');
      return child.context?.theme === 'dark';
    }, results);

    // Test 13: Relationship queries
    await this.runTest('Relationship Queries', () => {
      return this.protocol.query({
        relationships: {
          hasParent: 'form-container'
        }
      });
    }, results);

    // Test 14: Path finding
    await this.runTest('Path Finding', () => {
      return this.protocol.findPath('field-1-1', 'field-3-3');
    }, results);

    // Test 15: Relationship statistics
    await this.runTest('Relationship Stats', () => {
      return this.protocol.getRelationshipStats();
    }, results);

    // Calculate aggregate metrics
    const times = Object.values(results.tests).map(t => t.time);
    results.avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    results.minTime = Math.min(...times);
    results.maxTime = Math.max(...times);
    results.totalOps = Object.values(results.tests).reduce((sum, t) => sum + (t.ops || 0), 0);

    if (options.verbose) {
      this.printResults(results);
    }

    return results;
  }

  async runTest(name, fn, results) {
    try {
      const start = performance.now();
      const result = await fn();
      const time = performance.now() - start;

      results.tests[name] = {
        time,
        ops: Math.round(1000 / time),
        result
      };
    } catch (error) {
      results.tests[name] = {
        time: 0,
        ops: 0,
        error: error.message
      };
    }
  }

  printResults(results) {
    console.log('\n🔗 Relationship Benchmark Results:');
    console.log('─'.repeat(50));
    
    Object.entries(results.tests).forEach(([name, result]) => {
      const time = `${result.time.toFixed(2)}ms`;
      const ops = result.ops ? `${result.ops} ops/s` : '';
      console.log(`• ${name}: ${time} ${ops}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    console.log('─'.repeat(50));
    console.log(`Average: ${results.avgTime.toFixed(2)}ms`);
    console.log(`Min: ${results.minTime.toFixed(2)}ms`);
    console.log(`Max: ${results.maxTime.toFixed(2)}ms`);
  }
}

module.exports = RelationshipBenchmarks;