const v8 = require('v8');

class MemoryBenchmarks {
  constructor(protocol) {
    this.protocol = protocol;
    this.initialMemory = null;
    this.snapshots = [];
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    const heap = v8.getHeapStatistics();
    
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      heapSizeLimit: heap.heap_size_limit,
      totalPhysicalSize: heap.total_physical_size,
      totalAvailableSize: heap.total_available_size,
      usedHeapSize: heap.used_heap_size,
      mallocedMemory: heap.malloced_memory
    };
  }

  formatBytes(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  async setup() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Record initial memory state
    this.initialMemory = this.getMemoryUsage();
    this.protocol.clear();
  }

  async run(options = {}) {
    await this.setup();

    const results = {
      tests: {},
      initialMemory: this.initialMemory,
      finalMemory: null,
      peakMemory: null,
      leaks: [],
      heapUsed: 0,
      external: 0
    };

    // Test 1: Memory usage for single component
    await this.runTest('Single Component Memory', async () => {
      const before = this.getMemoryUsage();
      
      this.protocol.register({
        id: 'memory-test-1',
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'test memory' }
      });
      
      const after = this.getMemoryUsage();
      return {
        used: after.heapUsed - before.heapUsed,
        external: after.external - before.external
      };
    }, results);

    // Test 2: Memory usage for 1000 components
    await this.runTest('1000 Components Memory', async () => {
      const before = this.getMemoryUsage();
      
      for (let i = 0; i < 1000; i++) {
        this.protocol.register({
          id: `bulk-component-${i}`,
          protocol: 'semantic-ui/v2',
          element: { 
            type: ['input', 'container', 'action'][i % 3],
            intent: `component ${i}`,
            label: `Component Label ${i}`
          },
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag-${i}`, `category-${i % 10}`]
          }
        });
      }
      
      const after = this.getMemoryUsage();
      return {
        used: after.heapUsed - before.heapUsed,
        external: after.external - before.external,
        perComponent: (after.heapUsed - before.heapUsed) / 1000
      };
    }, results);

    // Test 3: Memory usage for complex relationships
    await this.runTest('Complex Relationships Memory', async () => {
      const before = this.getMemoryUsage();
      
      // Create interconnected components
      const components = [];
      for (let i = 0; i < 100; i++) {
        components.push({
          id: `related-${i}`,
          protocol: 'semantic-ui/v2',
          element: { type: 'container', intent: `container ${i}` },
          relationships: {
            children: Array(10).fill(null).map((_, j) => `related-${i}-child-${j}`),
            dependencies: i > 0 ? [`related-${i-1}`] : [],
            validators: [`validator-${i}`],
            handlers: [`handler-${i}`]
          }
        });
      }
      
      components.forEach(c => this.protocol.register(c));
      
      const after = this.getMemoryUsage();
      return {
        used: after.heapUsed - before.heapUsed,
        external: after.external - before.external
      };
    }, results);

    // Test 4: Memory usage for query cache
    await this.runTest('Query Cache Memory', async () => {
      const before = this.getMemoryUsage();
      
      // Perform many different queries to populate cache
      for (let i = 0; i < 500; i++) {
        this.protocol.query({
          element: { type: ['input', 'container', 'action'][i % 3] }
        });
        
        this.protocol.query({
          metadata: { tags: `tag-${i}` }
        });
        
        this.protocol.query({
          element: { intent: `component ${i}` }
        });
      }
      
      const after = this.getMemoryUsage();
      return {
        used: after.heapUsed - before.heapUsed,
        cacheSize: this.protocol.getCacheSize ? this.protocol.getCacheSize() : 'N/A'
      };
    }, results);

    // Test 5: Memory leak detection - registration/unregistration
    await this.runTest('Registration Memory Leak', async () => {
      const iterations = 100;
      const samples = [];
      
      for (let i = 0; i < iterations; i++) {
        // Register components
        for (let j = 0; j < 10; j++) {
          this.protocol.register({
            id: `leak-test-${i}-${j}`,
            protocol: 'semantic-ui/v2',
            element: { type: 'input', intent: 'leak test' }
          });
        }
        
        // Unregister components
        for (let j = 0; j < 10; j++) {
          this.protocol.unregister(`leak-test-${i}-${j}`);
        }
        
        // Sample memory every 10 iterations
        if (i % 10 === 0) {
          if (global.gc) global.gc();
          samples.push(this.getMemoryUsage().heapUsed);
        }
      }
      
      // Check if memory is growing
      const isLeaking = samples.length > 2 && 
        samples[samples.length - 1] > samples[0] * 1.5;
      
      return {
        samples,
        isLeaking,
        growth: samples.length > 1 ? 
          ((samples[samples.length - 1] - samples[0]) / samples[0] * 100).toFixed(2) + '%' : 
          'N/A'
      };
    }, results);

    // Test 6: Memory usage for large manifests
    await this.runTest('Large Manifest Memory', async () => {
      const before = this.getMemoryUsage();
      
      const largeManifest = {
        id: 'large-manifest',
        protocol: 'semantic-ui/v2',
        element: {
          type: 'container',
          intent: 'large container',
          label: 'Large Container',
          description: 'A'.repeat(10000), // 10KB description
          metadata: {}
        },
        context: {
          data: Array(1000).fill(null).map((_, i) => ({
            key: `key-${i}`,
            value: `value-${i}`.repeat(100)
          }))
        }
      };
      
      this.protocol.register(largeManifest);
      
      const after = this.getMemoryUsage();
      return {
        used: after.heapUsed - before.heapUsed,
        external: after.external - before.external
      };
    }, results);

    // Test 7: Memory fragmentation
    await this.runTest('Memory Fragmentation', async () => {
      const before = this.getMemoryUsage();
      
      // Create and delete many components randomly
      const ids = [];
      for (let i = 0; i < 500; i++) {
        const id = `frag-${i}`;
        ids.push(id);
        this.protocol.register({
          id,
          protocol: 'semantic-ui/v2',
          element: { type: 'input', intent: `fragment ${i}` }
        });
      }
      
      // Delete every other component
      for (let i = 0; i < ids.length; i += 2) {
        this.protocol.unregister(ids[i]);
      }
      
      // Add more components
      for (let i = 500; i < 750; i++) {
        this.protocol.register({
          id: `frag-new-${i}`,
          protocol: 'semantic-ui/v2',
          element: { type: 'input', intent: `new fragment ${i}` }
        });
      }
      
      const after = this.getMemoryUsage();
      const heap = v8.getHeapStatistics();
      
      return {
        used: after.heapUsed - before.heapUsed,
        fragmentation: heap.does_zap_garbage || 0,
        totalPhysicalSize: heap.total_physical_size,
        totalAvailableSize: heap.total_available_size
      };
    }, results);

    // Test 8: WeakMap/WeakSet usage
    await this.runTest('Weak References', async () => {
      const before = this.getMemoryUsage();
      
      // Test if protocol uses weak references appropriately
      const components = [];
      for (let i = 0; i < 100; i++) {
        const comp = {
          id: `weak-${i}`,
          protocol: 'semantic-ui/v2',
          element: { type: 'input', intent: 'weak reference test' }
        };
        components.push(comp);
        this.protocol.register(comp);
      }
      
      // Clear strong references
      components.length = 0;
      
      // Force GC if available
      if (global.gc) {
        global.gc();
      }
      
      const after = this.getMemoryUsage();
      return {
        used: after.heapUsed - before.heapUsed,
        collected: before.heapUsed > after.heapUsed
      };
    }, results);

    // Test 9: Index memory overhead
    await this.runTest('Index Memory Overhead', async () => {
      const before = this.getMemoryUsage();
      
      // Create components with many indexed fields
      for (let i = 0; i < 200; i++) {
        this.protocol.register({
          id: `indexed-${i}`,
          protocol: 'semantic-ui/v2',
          element: {
            type: ['input', 'container', 'action', 'display', 'navigation'][i % 5],
            intent: `intent-${i}`,
            label: `Label ${i}`,
            criticality: ['low', 'medium', 'high', 'critical'][i % 4]
          },
          context: {
            flow: `flow-${i % 10}`,
            step: i,
            category: `category-${i % 20}`
          },
          metadata: {
            tags: Array(10).fill(null).map((_, j) => `tag-${i}-${j}`),
            author: `author-${i % 5}`,
            version: `${(i % 3) + 1}.0.0`
          }
        });
      }
      
      const after = this.getMemoryUsage();
      const indexSize = this.protocol.getIndexSize ? this.protocol.getIndexSize() : 'N/A';
      
      return {
        used: after.heapUsed - before.heapUsed,
        indexSize,
        perComponent: (after.heapUsed - before.heapUsed) / 200
      };
    }, results);

    // Test 10: Memory cleanup
    await this.runTest('Memory Cleanup', async () => {
      const before = this.getMemoryUsage();
      
      // Clear everything
      this.protocol.clear();
      
      // Force GC if available
      if (global.gc) {
        global.gc();
      }
      
      const after = this.getMemoryUsage();
      
      return {
        freedMemory: before.heapUsed - after.heapUsed,
        currentUsage: after.heapUsed,
        isClean: after.heapUsed <= this.initialMemory.heapUsed * 1.1
      };
    }, results);

    // Calculate final metrics
    results.finalMemory = this.getMemoryUsage();
    results.heapUsed = results.finalMemory.heapUsed;
    results.external = results.finalMemory.external;
    
    // Find peak memory usage
    const allSamples = Object.values(results.tests)
      .filter(t => t.result && t.result.used)
      .map(t => t.result.used);
    
    if (allSamples.length > 0) {
      results.peakMemory = Math.max(...allSamples);
    }

    // Check for memory leaks
    Object.entries(results.tests).forEach(([name, test]) => {
      if (test.result && test.result.isLeaking) {
        results.leaks.push(name);
      }
    });

    if (options.verbose) {
      this.printResults(results);
    }

    return results;
  }

  async runTest(name, fn, results) {
    try {
      const result = await fn();
      results.tests[name] = {
        result,
        passed: !result.isLeaking
      };
    } catch (error) {
      results.tests[name] = {
        error: error.message,
        passed: false
      };
    }
  }

  printResults(results) {
    console.log('\n💾 Memory Benchmark Results:');
    console.log('─'.repeat(50));
    
    console.log('Initial Memory:', this.formatBytes(results.initialMemory.heapUsed));
    console.log('Final Memory:', this.formatBytes(results.finalMemory.heapUsed));
    console.log('Peak Memory:', results.peakMemory ? this.formatBytes(results.peakMemory) : 'N/A');
    console.log('─'.repeat(50));
    
    Object.entries(results.tests).forEach(([name, test]) => {
      console.log(`\n${name}:`);
      if (test.error) {
        console.log(`  Error: ${test.error}`);
      } else if (test.result) {
        Object.entries(test.result).forEach(([key, value]) => {
          if (typeof value === 'number' && key.includes('used')) {
            console.log(`  ${key}: ${this.formatBytes(value)}`);
          } else if (key === 'samples') {
            console.log(`  ${key}: ${value.length} samples taken`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        });
      }
    });
    
    if (results.leaks.length > 0) {
      console.log('\n⚠️ Potential memory leaks detected:');
      results.leaks.forEach(leak => console.log(`  • ${leak}`));
    } else {
      console.log('\n✅ No memory leaks detected');
    }
  }
}

module.exports = MemoryBenchmarks;