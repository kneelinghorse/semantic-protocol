const { generateManifest } = require('../utils/generators');

class DiscoveryBenchmarks {
  constructor(protocol) {
    this.protocol = protocol;
    this.results = {};
  }

  async run(options = {}) {
    console.log('\n🔍 Discovery Performance Tests');
    console.log('Target: < 20ms for complex queries\n');

    // Prepare test data
    await this.prepareTestData();

    // Run discovery benchmarks
    await this.simpleTypeQuery();
    await this.intentQuery();
    await this.contextQuery();
    await this.tagQuery();
    await this.complexMultiFieldQuery();
    await this.wildcardQuery();
    await this.negationQuery();
    await this.deepNestedQuery();
    await this.largeResultSetQuery();
    await this.cachedQuery();

    return this.results;
  }

  async prepareTestData() {
    console.log('📦 Preparing test data (10,000 components)...');
    
    this.protocol.registry.clear();
    
    const types = ['action', 'display', 'input', 'container', 'navigation'];
    const intents = ['submit', 'cancel', 'view', 'edit', 'delete', 'create', 'update', 'navigate', 'filter', 'sort'];
    const flows = ['checkout', 'registration', 'search', 'dashboard', 'profile'];
    const tags = ['primary', 'secondary', 'critical', 'optional', 'featured', 'beta', 'deprecated'];

    // Register 10,000 diverse components
    for (let i = 0; i < 10000; i++) {
      const manifest = {
        id: `component-${i}`,
        element: {
          type: types[i % types.length],
          intent: intents[i % intents.length],
          label: `Component ${i}`,
          criticality: ['low', 'medium', 'high', 'critical'][i % 4]
        },
        context: {
          flow: flows[i % flows.length],
          step: i % 10,
          nested: {
            level1: {
              value: `value-${i % 100}`,
              level2: {
                deep: i % 2 === 0 ? 'even' : 'odd'
              }
            }
          }
        },
        relationships: {
          parent: i > 0 ? `component-${i - 1}` : null,
          children: i < 9999 ? [`component-${i + 1}`] : []
        },
        tags: [
          tags[i % tags.length],
          tags[(i + 1) % tags.length]
        ]
      };

      this.protocol.register(manifest);
    }

    console.log('✅ Test data ready\n');
  }

  async simpleTypeQuery() {
    console.log('• Simple Type Query');
    
    const times = [];
    const iterations = 1000;
    const query = { type: 'action' };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.simpleType = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);
    console.log(`  Ops/sec: ${(1000 / avgTime).toFixed(0)}`);

    return this.results.simpleType;
  }

  async intentQuery() {
    console.log('\n• Intent Query');
    
    const times = [];
    const iterations = 1000;
    const query = { intent: 'submit' };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.intent = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);

    return this.results.intent;
  }

  async contextQuery() {
    console.log('\n• Context Query');
    
    const times = [];
    const iterations = 500;
    const query = { 
      context: { 
        flow: 'checkout',
        step: 3
      }
    };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.context = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);

    return this.results.context;
  }

  async tagQuery() {
    console.log('\n• Tag Query');
    
    const times = [];
    const iterations = 1000;
    const query = { tags: ['primary', 'critical'] };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.tags = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);

    return this.results.tags;
  }

  async complexMultiFieldQuery() {
    console.log('\n• Complex Multi-field Query');
    
    const times = [];
    const iterations = 500;
    const query = {
      type: 'action',
      intent: 'submit',
      context: {
        flow: 'checkout'
      },
      tags: ['primary'],
      criticality: 'high'
    };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.complex = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);
    console.log(`  Target: < 20ms`);
    console.log(`  Status: ${avgTime < 20 ? '✅ PASS' : '❌ FAIL'}`);

    return this.results.complex;
  }

  async wildcardQuery() {
    console.log('\n• Wildcard Query');
    
    const times = [];
    const iterations = 500;
    const query = { id: 'component-1*' }; // Match component-1, component-10, component-100, etc.

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.wildcard = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);

    return this.results.wildcard;
  }

  async negationQuery() {
    console.log('\n• Negation Query');
    
    const times = [];
    const iterations = 500;
    const query = { 
      type: '!display',  // All except display
      intent: '!cancel'   // All except cancel
    };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.negation = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);

    return this.results.negation;
  }

  async deepNestedQuery() {
    console.log('\n• Deep Nested Context Query');
    
    const times = [];
    const iterations = 300;
    const query = {
      context: {
        nested: {
          level1: {
            level2: {
              deep: 'even'
            }
          }
        }
      }
    };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.deepNested = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);

    return this.results.deepNested;
  }

  async largeResultSetQuery() {
    console.log('\n• Large Result Set Query');
    
    const times = [];
    const iterations = 100;
    // Query that returns many results
    const query = { 
      type: ['action', 'display', 'input'] // Should match ~60% of components
    };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const results = this.protocol.discovery.find(query);
      const end = performance.now();

      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const resultCount = this.protocol.discovery.find(query).length;

    this.results.largeResultSet = {
      avgTime,
      iterations,
      resultCount,
      opsPerSecond: 1000 / avgTime
    };

    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Results: ${resultCount} components`);

    return this.results.largeResultSet;
  }

  async cachedQuery() {
    console.log('\n• Cached Query Performance');
    
    const query = { type: 'action', intent: 'submit' };
    
    // First query (cache miss)
    const firstTimes = [];
    for (let i = 0; i < 100; i++) {
      // Clear cache
      this.protocol.discovery.clearCache();
      
      const start = performance.now();
      this.protocol.discovery.find(query);
      const end = performance.now();
      
      firstTimes.push(end - start);
    }

    // Subsequent queries (cache hit)
    const cachedTimes = [];
    // Warm up cache
    this.protocol.discovery.find(query);
    
    for (let i = 0; i < 1000; i++) {
      const start = performance.now();
      this.protocol.discovery.find(query);
      const end = performance.now();
      
      cachedTimes.push(end - start);
    }

    const avgFirstTime = firstTimes.reduce((a, b) => a + b) / firstTimes.length;
    const avgCachedTime = cachedTimes.reduce((a, b) => a + b) / cachedTimes.length;
    const cacheSpeedup = avgFirstTime / avgCachedTime;

    this.results.cached = {
      avgFirstTime,
      avgCachedTime,
      cacheSpeedup,
      opsPerSecondCached: 1000 / avgCachedTime
    };

    console.log(`  First query: ${avgFirstTime.toFixed(3)}ms`);
    console.log(`  Cached query: ${avgCachedTime.toFixed(3)}ms`);
    console.log(`  Speedup: ${cacheSpeedup.toFixed(1)}x`);

    // Calculate overall results
    this.calculateOverallResults();

    return this.results.cached;
  }

  calculateOverallResults() {
    const scenarios = ['simpleType', 'intent', 'context', 'tags', 'complex', 
                      'wildcard', 'negation', 'deepNested', 'largeResultSet'];
    const avgTimes = scenarios
      .filter(s => this.results[s])
      .map(s => this.results[s].avgTime);

    this.results.avgTime = avgTimes.reduce((a, b) => a + b) / avgTimes.length;
    this.results.maxTime = Math.max(...avgTimes);
    this.results.minTime = Math.min(...avgTimes);
    this.results.complexQueryTime = this.results.complex?.avgTime;
    this.results.target = 20; // Target: < 20ms for complex queries
    this.results.passed = this.results.complexQueryTime < 20;

    console.log('\n📊 Discovery Summary:');
    console.log(`  Overall Average: ${this.results.avgTime.toFixed(3)}ms`);
    console.log(`  Complex Query: ${this.results.complexQueryTime.toFixed(3)}ms`);
    console.log(`  Target: < 20ms (complex queries)`);
    console.log(`  Status: ${this.results.passed ? '✅ PASS' : '❌ FAIL'}`);
  }
}

module.exports = DiscoveryBenchmarks;