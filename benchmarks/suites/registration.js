const { Suite } = require('benchmark');
const { generateManifest } = require('../utils/generators');

class RegistrationBenchmarks {
  constructor(protocol) {
    this.protocol = protocol;
    this.suite = new Suite('Registration');
    this.results = {};
  }

  async run(options = {}) {
    console.log('\n🔧 Registration Performance Tests');
    console.log('Target: < 5ms per component\n');

    // Clear registry before benchmarks
    this.protocol.registry.clear();

    // Run different registration scenarios
    await this.singleRegistration();
    await this.batchRegistration();
    await this.complexManifestRegistration();
    await this.updateRegistration();
    await this.concurrentRegistration();
    await this.registrationWithValidation();
    await this.registrationWithInheritance();

    return this.results;
  }

  async singleRegistration() {
    console.log('• Single Component Registration');
    
    const times = [];
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const manifest = generateManifest({
        id: `single-${i}`,
        type: 'action',
        intent: 'submit'
      });

      const start = performance.now();
      this.protocol.register(manifest);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    this.results.single = {
      avgTime,
      maxTime,
      minTime,
      iterations,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Min/Max: ${minTime.toFixed(3)}ms / ${maxTime.toFixed(3)}ms`);
    console.log(`  Ops/sec: ${(1000 / avgTime).toFixed(0)}`);
    
    return this.results.single;
  }

  async batchRegistration() {
    console.log('\n• Batch Registration (100 components)');
    
    const times = [];
    const batchSize = 100;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const manifests = [];
      for (let j = 0; j < batchSize; j++) {
        manifests.push(generateManifest({
          id: `batch-${i}-${j}`,
          type: ['action', 'display', 'input'][j % 3],
          intent: `intent-${j % 10}`
        }));
      }

      const start = performance.now();
      this.protocol.registerBatch(manifests);
      const end = performance.now();

      times.push(end - start);
      
      // Clear for next iteration
      manifests.forEach(m => this.protocol.unregister(m.id));
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const avgPerComponent = avgTime / batchSize;

    this.results.batch = {
      avgTime,
      avgPerComponent,
      batchSize,
      iterations,
      opsPerSecond: 1000 / avgPerComponent
    };

    console.log(`  Total Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Per Component: ${avgPerComponent.toFixed(3)}ms`);
    console.log(`  Ops/sec: ${(1000 / avgPerComponent).toFixed(0)}`);

    return this.results.batch;
  }

  async complexManifestRegistration() {
    console.log('\n• Complex Manifest Registration');
    
    const times = [];
    const iterations = 500;

    for (let i = 0; i < iterations; i++) {
      const manifest = generateManifest({
        id: `complex-${i}`,
        type: 'container',
        intent: 'layout',
        // Add deep nesting
        context: {
          flow: 'checkout',
          step: i % 5,
          nested: {
            level1: {
              level2: {
                level3: {
                  data: `value-${i}`
                }
              }
            }
          }
        },
        // Add relationships
        relationships: {
          parent: i > 0 ? `complex-${i - 1}` : null,
          children: [`child-${i}-1`, `child-${i}-2`],
          dependencies: [`dep-${i}-1`, `dep-${i}-2`, `dep-${i}-3`]
        },
        // Add validation rules
        validation: {
          rules: [
            { type: 'required', field: 'input' },
            { type: 'min', field: 'count', value: 0 },
            { type: 'max', field: 'count', value: 100 }
          ],
          async: true
        },
        // Add metadata
        metadata: {
          version: '1.0.0',
          tags: ['complex', 'nested', 'validated'],
          custom: {
            field1: 'value1',
            field2: 'value2'
          }
        }
      });

      const start = performance.now();
      this.protocol.register(manifest);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;

    this.results.complex = {
      avgTime,
      iterations,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Ops/sec: ${(1000 / avgTime).toFixed(0)}`);

    return this.results.complex;
  }

  async updateRegistration() {
    console.log('\n• Update Existing Registration');
    
    // Pre-register components
    for (let i = 0; i < 1000; i++) {
      this.protocol.register(generateManifest({
        id: `update-${i}`,
        type: 'action',
        intent: 'initial'
      }));
    }

    const times = [];
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const updatedManifest = generateManifest({
        id: `update-${i}`,
        type: 'action',
        intent: 'updated',
        context: { version: 2 }
      });

      const start = performance.now();
      this.protocol.update(`update-${i}`, updatedManifest);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;

    this.results.update = {
      avgTime,
      iterations,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Ops/sec: ${(1000 / avgTime).toFixed(0)}`);

    return this.results.update;
  }

  async concurrentRegistration() {
    console.log('\n• Concurrent Registration (simulated)');
    
    const concurrentOps = 10;
    const opsPerThread = 100;
    
    const start = performance.now();
    
    const promises = [];
    for (let thread = 0; thread < concurrentOps; thread++) {
      promises.push(
        new Promise(resolve => {
          setTimeout(() => {
            for (let i = 0; i < opsPerThread; i++) {
              this.protocol.register(generateManifest({
                id: `concurrent-${thread}-${i}`,
                type: 'action'
              }));
            }
            resolve();
          }, 0);
        })
      );
    }

    await Promise.all(promises);
    const end = performance.now();

    const totalTime = end - start;
    const totalOps = concurrentOps * opsPerThread;
    const avgTime = totalTime / totalOps;

    this.results.concurrent = {
      totalTime,
      avgTime,
      totalOps,
      concurrentOps,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Total Time: ${totalTime.toFixed(3)}ms`);
    console.log(`  Average per op: ${avgTime.toFixed(3)}ms`);
    console.log(`  Total ops: ${totalOps}`);

    return this.results.concurrent;
  }

  async registrationWithValidation() {
    console.log('\n• Registration with Validation');
    
    const times = [];
    const iterations = 500;

    for (let i = 0; i < iterations; i++) {
      const manifest = generateManifest({
        id: `validated-${i}`,
        type: 'input',
        validation: {
          rules: [
            { type: 'required' },
            { type: 'email' },
            { type: 'minLength', value: 5 }
          ]
        }
      });

      const start = performance.now();
      this.protocol.register(manifest, { validate: true });
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;

    this.results.validated = {
      avgTime,
      iterations,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Ops/sec: ${(1000 / avgTime).toFixed(0)}`);

    return this.results.validated;
  }

  async registrationWithInheritance() {
    console.log('\n• Registration with Inheritance');
    
    // Register base components
    this.protocol.register(generateManifest({
      id: 'base-action',
      type: 'action',
      context: { theme: 'default' }
    }));

    this.protocol.register(generateManifest({
      id: 'base-input',
      type: 'input',
      validation: { rules: [{ type: 'required' }] }
    }));

    const times = [];
    const iterations = 500;

    for (let i = 0; i < iterations; i++) {
      const manifest = generateManifest({
        id: `inherited-${i}`,
        extends: i % 2 === 0 ? 'base-action' : 'base-input',
        context: { customField: `value-${i}` }
      });

      const start = performance.now();
      this.protocol.register(manifest);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;

    this.results.inheritance = {
      avgTime,
      iterations,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Ops/sec: ${(1000 / avgTime).toFixed(0)}`);

    // Calculate overall results
    this.calculateOverallResults();

    return this.results.inheritance;
  }

  calculateOverallResults() {
    const scenarios = ['single', 'batch', 'complex', 'update', 'concurrent', 'validated', 'inheritance'];
    const avgTimes = scenarios
      .filter(s => this.results[s])
      .map(s => this.results[s].avgTime || this.results[s].avgPerComponent);

    this.results.avgTime = avgTimes.reduce((a, b) => a + b) / avgTimes.length;
    this.results.maxTime = Math.max(...avgTimes);
    this.results.minTime = Math.min(...avgTimes);
    this.results.target = 5; // Target: < 5ms
    this.results.passed = this.results.avgTime < 5;

    console.log('\n📊 Registration Summary:');
    console.log(`  Overall Average: ${this.results.avgTime.toFixed(3)}ms`);
    console.log(`  Target: < 5ms`);
    console.log(`  Status: ${this.results.passed ? '✅ PASS' : '❌ FAIL'}`);
  }
}

module.exports = RegistrationBenchmarks;