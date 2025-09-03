const { Suite } = require('benchmark');
const { generateManifest, generateInvalidManifest } = require('../utils/generators');

class ValidationBenchmarks {
  constructor(protocol) {
    this.protocol = protocol;
    this.suite = new Suite();
    this.manifests = {
      simple: null,
      complex: null,
      nested: null,
      invalid: null,
      large: null
    };
  }

  async setup() {
    // Generate test manifests
    this.manifests.simple = {
      protocol: 'semantic-ui/v2',
      element: {
        type: 'input',
        intent: 'capture user email',
        label: 'Email Address'
      }
    };

    this.manifests.complex = {
      protocol: 'semantic-ui/v2',
      element: {
        type: 'container',
        intent: 'payment form',
        label: 'Payment Details',
        criticality: 'critical'
      },
      context: {
        flow: 'checkout',
        step: 3,
        prerequisites: ['shipping-address', 'billing-address'],
        outcomes: ['payment-success', 'payment-failure']
      },
      relationships: {
        children: ['card-number', 'expiry', 'cvv'],
        validators: ['luhn-validator', 'expiry-validator'],
        handlers: ['payment-processor']
      },
      validation: {
        rules: [
          { field: 'cardNumber', type: 'luhn', message: 'Invalid card number' },
          { field: 'expiry', type: 'future-date', message: 'Card expired' },
          { field: 'cvv', type: 'regex', pattern: '^\\d{3,4}$', message: 'Invalid CVV' }
        ],
        async: true
      },
      metadata: {
        version: '1.0.0',
        author: 'system',
        created: new Date().toISOString(),
        tags: ['payment', 'critical', 'pci']
      }
    };

    this.manifests.nested = this.generateNestedManifest(5);
    this.manifests.invalid = {
      protocol: 'invalid-protocol',
      element: {
        type: 'unknown-type',
        intent: null
      },
      relationships: {
        parent: 'non-existent-id',
        children: ['orphan-1', 'orphan-2']
      }
    };
    this.manifests.large = this.generateLargeManifest();
  }

  generateNestedManifest(depth) {
    const manifest = {
      protocol: 'semantic-ui/v2',
      element: {
        type: 'container',
        intent: `level-0`,
        label: 'Root Container'
      },
      relationships: {
        children: []
      }
    };

    let current = manifest;
    for (let i = 1; i <= depth; i++) {
      const child = {
        id: `level-${i}`,
        protocol: 'semantic-ui/v2',
        element: {
          type: i === depth ? 'input' : 'container',
          intent: `nested level ${i}`,
          label: `Level ${i}`
        }
      };
      
      if (i < depth) {
        child.relationships = { children: [] };
      }
      
      current.relationships.children.push(child);
      if (i < depth) {
        current = child;
      }
    }

    return manifest;
  }

  generateLargeManifest() {
    return {
      protocol: 'semantic-ui/v2',
      element: {
        type: 'container',
        intent: 'large form',
        label: 'Complex Form',
        criticality: 'high'
      },
      context: {
        flow: 'registration',
        step: 1,
        prerequisites: Array(50).fill(null).map((_, i) => `prereq-${i}`),
        outcomes: Array(20).fill(null).map((_, i) => `outcome-${i}`)
      },
      relationships: {
        children: Array(100).fill(null).map((_, i) => `child-${i}`),
        validators: Array(30).fill(null).map((_, i) => `validator-${i}`),
        handlers: Array(10).fill(null).map((_, i) => `handler-${i}`)
      },
      validation: {
        rules: Array(50).fill(null).map((_, i) => ({
          field: `field-${i}`,
          type: 'required',
          message: `Field ${i} is required`
        })),
        async: true
      },
      metadata: {
        version: '1.0.0',
        author: 'benchmark',
        created: new Date().toISOString(),
        tags: Array(20).fill(null).map((_, i) => `tag-${i}`)
      }
    };
  }

  async run(options = {}) {
    await this.setup();

    const results = {
      tests: {},
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      totalOps: 0,
      failed: []
    };

    // Test 1: Simple manifest validation
    await this.runTest('Simple Manifest', () => {
      return this.protocol.validate(this.manifests.simple);
    }, results);

    // Test 2: Complex manifest validation
    await this.runTest('Complex Manifest', () => {
      return this.protocol.validate(this.manifests.complex);
    }, results);

    // Test 3: Nested manifest validation
    await this.runTest('Nested Manifest', () => {
      return this.protocol.validate(this.manifests.nested);
    }, results);

    // Test 4: Invalid manifest validation
    await this.runTest('Invalid Manifest', () => {
      try {
        this.protocol.validate(this.manifests.invalid);
        return false;
      } catch (error) {
        return true; // Should throw error
      }
    }, results);

    // Test 5: Large manifest validation
    await this.runTest('Large Manifest', () => {
      return this.protocol.validate(this.manifests.large);
    }, results);

    // Test 6: Schema validation
    await this.runTest('Schema Validation', () => {
      return this.protocol.validateSchema(this.manifests.complex);
    }, results);

    // Test 7: Required fields validation
    await this.runTest('Required Fields', () => {
      const manifest = { ...this.manifests.simple };
      delete manifest.element.type;
      try {
        this.protocol.validate(manifest);
        return false;
      } catch {
        return true;
      }
    }, results);

    // Test 8: Type validation
    await this.runTest('Type Validation', () => {
      const validTypes = ['action', 'display', 'input', 'container', 'navigation'];
      return validTypes.every(type => {
        const manifest = {
          protocol: 'semantic-ui/v2',
          element: { type, intent: 'test' }
        };
        return this.protocol.validate(manifest);
      });
    }, results);

    // Test 9: Relationship integrity
    await this.runTest('Relationship Integrity', () => {
      return this.protocol.validateRelationships(this.manifests.complex);
    }, results);

    // Test 10: Circular dependency check
    await this.runTest('Circular Dependency', () => {
      const manifest = {
        protocol: 'semantic-ui/v2',
        id: 'component-a',
        element: { type: 'container', intent: 'test' },
        relationships: {
          dependencies: ['component-b']
        }
      };
      
      const manifest2 = {
        protocol: 'semantic-ui/v2',
        id: 'component-b',
        element: { type: 'container', intent: 'test' },
        relationships: {
          dependencies: ['component-a']
        }
      };

      try {
        this.protocol.register(manifest);
        this.protocol.register(manifest2);
        return !this.protocol.hasCircularDependency('component-a');
      } catch {
        return true;
      }
    }, results);

    // Test 11: Context consistency
    await this.runTest('Context Consistency', () => {
      const parent = {
        protocol: 'semantic-ui/v2',
        element: { type: 'container', intent: 'parent' },
        context: { flow: 'checkout', step: 1 }
      };
      
      const child = {
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'child' },
        context: { flow: 'checkout', step: 2 }
      };

      return this.protocol.validateContextConsistency(parent, child);
    }, results);

    // Test 12: Async validation
    await this.runTest('Async Validation', async () => {
      const manifest = {
        ...this.manifests.complex,
        validation: {
          ...this.manifests.complex.validation,
          async: true
        }
      };
      
      return await this.protocol.validateAsync(manifest);
    }, results);

    // Test 13: Batch validation
    await this.runTest('Batch Validation', () => {
      const manifests = [
        this.manifests.simple,
        this.manifests.complex,
        this.manifests.nested
      ];
      
      const results = this.protocol.validateBatch(manifests);
      return results.every(r => r.valid);
    }, results);

    // Test 14: Custom validation rules
    await this.runTest('Custom Rules', () => {
      this.protocol.addValidationRule('custom-email', (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      });

      const manifest = {
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'email' },
        validation: {
          rules: [{ type: 'custom-email', field: 'value' }]
        }
      };

      return this.protocol.validate(manifest);
    }, results);

    // Test 15: Performance under load
    await this.runTest('Validation Under Load', () => {
      const manifests = Array(100).fill(null).map(() => ({
        protocol: 'semantic-ui/v2',
        element: {
          type: ['input', 'container', 'action'][Math.floor(Math.random() * 3)],
          intent: `component-${Math.random()}`,
          label: 'Test Component'
        }
      }));

      const start = Date.now();
      manifests.forEach(m => this.protocol.validate(m));
      return Date.now() - start < 1000; // Should complete within 1 second
    }, results);

    // Calculate aggregate metrics
    const times = Object.values(results.tests).map(t => t.time).filter(t => t > 0);
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
        passed: result !== false
      };

      if (result === false) {
        results.failed.push(name);
      }
    } catch (error) {
      results.tests[name] = {
        time: 0,
        ops: 0,
        passed: false,
        error: error.message
      };
      results.failed.push(name);
    }
  }

  printResults(results) {
    console.log('\n📋 Validation Benchmark Results:');
    console.log('─'.repeat(50));
    
    Object.entries(results.tests).forEach(([name, result]) => {
      const icon = result.passed ? '✅' : '❌';
      const time = result.time ? `${result.time.toFixed(2)}ms` : 'N/A';
      const ops = result.ops ? `${result.ops} ops/s` : '';
      console.log(`${icon} ${name}: ${time} ${ops}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('─'.repeat(50));
    console.log(`Average: ${results.avgTime.toFixed(2)}ms`);
    console.log(`Min: ${results.minTime.toFixed(2)}ms`);
    console.log(`Max: ${results.maxTime.toFixed(2)}ms`);
    
    if (results.failed.length > 0) {
      console.log(`\n⚠️ Failed tests: ${results.failed.join(', ')}`);
    }
  }
}

module.exports = ValidationBenchmarks;