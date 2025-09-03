const cluster = require('cluster');
const os = require('os');

class StressBenchmarks {
  constructor(protocol) {
    this.protocol = protocol;
    this.results = {
      tests: {},
      errors: [],
      performance: {}
    };
  }

  async run(options = {}) {
    console.log('\n🔥 Starting Stress Tests...');
    console.log('─'.repeat(50));

    const results = {
      tests: {},
      totalTime: 0,
      errors: [],
      maxThroughput: 0,
      breakingPoint: null,
      concurrency: {
        maxConcurrent: 0,
        avgResponseTime: 0
      }
    };

    // Test 1: High volume registration
    await this.runTest('High Volume Registration', async () => {
      const count = 10000;
      const start = Date.now();
      const errors = [];

      for (let i = 0; i < count; i++) {
        try {
          this.protocol.register({
            id: `stress-component-${i}`,
            protocol: 'semantic-ui/v2',
            element: {
              type: ['input', 'container', 'action', 'display', 'navigation'][i % 5],
              intent: `stress test ${i}`,
              label: `Component ${i}`,
              criticality: ['low', 'medium', 'high', 'critical'][i % 4]
            },
            context: {
              flow: `flow-${i % 100}`,
              step: i % 10,
              data: { index: i, timestamp: Date.now() }
            },
            relationships: {
              parent: i > 0 ? `stress-component-${i - 1}` : null,
              dependencies: i > 10 ? [`stress-component-${i - 10}`] : []
            },
            metadata: {
              version: '1.0.0',
              tags: Array(5).fill(null).map((_, j) => `tag-${i}-${j}`)
            }
          });
        } catch (error) {
          errors.push({ index: i, error: error.message });
        }
      }

      const elapsed = Date.now() - start;
      return {
        count,
        elapsed,
        throughput: Math.round((count / elapsed) * 1000),
        errors: errors.length,
        errorRate: (errors.length / count * 100).toFixed(2) + '%'
      };
    }, results);

    // Test 2: Concurrent queries
    await this.runTest('Concurrent Queries', async () => {
      const queries = [
        { element: { type: 'input' } },
        { element: { type: 'container' } },
        { element: { criticality: 'critical' } },
        { context: { flow: 'flow-50' } },
        { metadata: { tags: 'tag-100-0' } },
        { relationships: { hasParent: true } },
        { element: { intent: /stress test/ } }
      ];

      const iterations = 1000;
      const start = Date.now();
      const queryResults = [];

      // Run queries concurrently
      const promises = [];
      for (let i = 0; i < iterations; i++) {
        const query = queries[i % queries.length];
        promises.push(
          this.protocol.query(query)
            .then(results => ({ success: true, count: results.length }))
            .catch(error => ({ success: false, error: error.message }))
        );
      }

      const outcomes = await Promise.all(promises);
      const elapsed = Date.now() - start;

      const successful = outcomes.filter(o => o.success).length;
      const failed = outcomes.filter(o => !o.success).length;

      return {
        iterations,
        elapsed,
        queriesPerSecond: Math.round((iterations / elapsed) * 1000),
        successful,
        failed,
        successRate: (successful / iterations * 100).toFixed(2) + '%'
      };
    }, results);

    // Test 3: Deep relationship traversal under load
    await this.runTest('Deep Traversal Under Load', async () => {
      // Create deep hierarchy
      const depth = 100;
      for (let i = 0; i < depth; i++) {
        this.protocol.register({
          id: `deep-stress-${i}`,
          protocol: 'semantic-ui/v2',
          element: { type: 'container', intent: `deep level ${i}` },
          relationships: {
            parent: i > 0 ? `deep-stress-${i - 1}` : null,
            children: i < depth - 1 ? [`deep-stress-${i + 1}`] : []
          }
        });
      }

      const iterations = 100;
      const start = Date.now();
      const traversalTimes = [];

      for (let i = 0; i < iterations; i++) {
        const traversalStart = performance.now();
        const descendants = this.protocol.getDescendants('deep-stress-0');
        traversalTimes.push(performance.now() - traversalStart);
      }

      const elapsed = Date.now() - start;
      const avgTraversal = traversalTimes.reduce((a, b) => a + b, 0) / traversalTimes.length;
      const maxTraversal = Math.max(...traversalTimes);
      const minTraversal = Math.min(...traversalTimes);

      return {
        depth,
        iterations,
        elapsed,
        avgTraversal: avgTraversal.toFixed(2) + 'ms',
        maxTraversal: maxTraversal.toFixed(2) + 'ms',
        minTraversal: minTraversal.toFixed(2) + 'ms',
        throughput: Math.round((iterations / elapsed) * 1000)
      };
    }, results);

    // Test 4: Rapid updates
    await this.runTest('Rapid Updates', async () => {
      const componentIds = [];
      const updateCount = 5000;

      // Create initial components
      for (let i = 0; i < 100; i++) {
        const id = `update-stress-${i}`;
        componentIds.push(id);
        this.protocol.register({
          id,
          protocol: 'semantic-ui/v2',
          element: { type: 'input', intent: 'update test' },
          metadata: { updateCount: 0 }
        });
      }

      const start = Date.now();
      const errors = [];

      for (let i = 0; i < updateCount; i++) {
        const id = componentIds[i % componentIds.length];
        try {
          this.protocol.update(id, {
            metadata: { 
              updateCount: i,
              timestamp: Date.now(),
              data: `update-${i}`
            }
          });
        } catch (error) {
          errors.push({ update: i, error: error.message });
        }
      }

      const elapsed = Date.now() - start;

      return {
        updateCount,
        elapsed,
        updatesPerSecond: Math.round((updateCount / elapsed) * 1000),
        errors: errors.length,
        errorRate: (errors.length / updateCount * 100).toFixed(2) + '%'
      };
    }, results);

    // Test 5: Cache stress
    await this.runTest('Cache Stress', async () => {
      const uniqueQueries = 1000;
      const totalQueries = 10000;
      const queries = [];

      // Generate unique queries
      for (let i = 0; i < uniqueQueries; i++) {
        queries.push({
          element: {
            type: ['input', 'container', 'action'][i % 3],
            intent: `cache test ${i}`
          },
          metadata: {
            tags: `stress-tag-${i}`
          }
        });
      }

      const start = Date.now();
      const cacheHits = [];
      const cacheMisses = [];

      for (let i = 0; i < totalQueries; i++) {
        const query = queries[i % uniqueQueries];
        const isCached = i >= uniqueQueries; // After first round, should be cached
        
        const queryStart = performance.now();
        const results = this.protocol.query(query);
        const queryTime = performance.now() - queryStart;

        if (isCached && queryTime < 1) {
          cacheHits.push(queryTime);
        } else {
          cacheMisses.push(queryTime);
        }
      }

      const elapsed = Date.now() - start;
      const hitRate = (cacheHits.length / (totalQueries - uniqueQueries)) * 100;

      return {
        uniqueQueries,
        totalQueries,
        elapsed,
        cacheHitRate: hitRate.toFixed(2) + '%',
        avgHitTime: cacheHits.length > 0 ? 
          (cacheHits.reduce((a, b) => a + b, 0) / cacheHits.length).toFixed(2) + 'ms' : 
          'N/A',
        avgMissTime: cacheMisses.length > 0 ?
          (cacheMisses.reduce((a, b) => a + b, 0) / cacheMisses.length).toFixed(2) + 'ms' :
          'N/A'
      };
    }, results);

    // Test 6: Mixed operations stress
    await this.runTest('Mixed Operations', async () => {
      const operations = 10000;
      const start = Date.now();
      const stats = {
        register: 0,
        query: 0,
        update: 0,
        delete: 0,
        traverse: 0,
        errors: []
      };

      for (let i = 0; i < operations; i++) {
        const op = i % 5;
        
        try {
          switch (op) {
            case 0: // Register
              this.protocol.register({
                id: `mixed-${i}`,
                protocol: 'semantic-ui/v2',
                element: { type: 'input', intent: `mixed ${i}` }
              });
              stats.register++;
              break;
              
            case 1: // Query
              this.protocol.query({ element: { type: 'input' } });
              stats.query++;
              break;
              
            case 2: // Update
              if (i > 5) {
                this.protocol.update(`mixed-${i - 5}`, {
                  metadata: { updated: true }
                });
                stats.update++;
              }
              break;
              
            case 3: // Delete
              if (i > 10) {
                this.protocol.unregister(`mixed-${i - 10}`);
                stats.delete++;
              }
              break;
              
            case 4: // Traverse
              if (i > 0) {
                this.protocol.getRelationships(`mixed-${i - 1}`);
                stats.traverse++;
              }
              break;
          }
        } catch (error) {
          stats.errors.push({ operation: op, index: i, error: error.message });
        }
      }

      const elapsed = Date.now() - start;

      return {
        operations,
        elapsed,
        opsPerSecond: Math.round((operations / elapsed) * 1000),
        breakdown: {
          register: stats.register,
          query: stats.query,
          update: stats.update,
          delete: stats.delete,
          traverse: stats.traverse
        },
        errors: stats.errors.length,
        errorRate: (stats.errors.length / operations * 100).toFixed(2) + '%'
      };
    }, results);

    // Test 7: Memory pressure
    await this.runTest('Memory Pressure', async () => {
      const largeComponents = [];
      const maxComponents = 1000;
      let componentCount = 0;
      let memoryError = null;

      const initialMemory = process.memoryUsage().heapUsed;

      try {
        for (let i = 0; i < maxComponents; i++) {
          const largeData = Array(10000).fill(null).map((_, j) => ({
            key: `key-${i}-${j}`,
            value: 'x'.repeat(100)
          }));

          this.protocol.register({
            id: `memory-pressure-${i}`,
            protocol: 'semantic-ui/v2',
            element: { 
              type: 'container',
              intent: 'memory test',
              data: largeData
            }
          });

          componentCount++;

          // Check memory usage
          const currentMemory = process.memoryUsage().heapUsed;
          if (currentMemory > initialMemory * 10) {
            throw new Error('Memory limit exceeded');
          }
        }
      } catch (error) {
        memoryError = error.message;
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      return {
        componentCount,
        memoryGrowth: (memoryGrowth / 1024 / 1024).toFixed(2) + ' MB',
        avgMemoryPerComponent: (memoryGrowth / componentCount / 1024).toFixed(2) + ' KB',
        memoryError,
        completed: componentCount === maxComponents
      };
    }, results);

    // Test 8: Breaking point detection
    await this.runTest('Breaking Point', async () => {
      let throughput = [];
      let breakingPoint = null;
      let load = 100;

      while (!breakingPoint && load <= 10000) {
        const start = Date.now();
        const errors = [];

        // Apply load
        for (let i = 0; i < load; i++) {
          try {
            this.protocol.register({
              id: `breaking-${load}-${i}`,
              protocol: 'semantic-ui/v2',
              element: { type: 'input', intent: `breaking ${i}` }
            });
          } catch (error) {
            errors.push(error);
          }
        }

        const elapsed = Date.now() - start;
        const currentThroughput = load / (elapsed / 1000);
        throughput.push({ load, throughput: currentThroughput, errors: errors.length });

        // Check if performance is degrading
        if (throughput.length > 2) {
          const recent = throughput.slice(-2);
          if (recent[1].throughput < recent[0].throughput * 0.5 || errors.length > load * 0.1) {
            breakingPoint = load;
          }
        }

        // Clean up for next iteration
        for (let i = 0; i < load; i++) {
          try {
            this.protocol.unregister(`breaking-${load}-${i}`);
          } catch {}
        }

        load *= 2;
      }

      const maxThroughput = Math.max(...throughput.map(t => t.throughput));

      return {
        breakingPoint: breakingPoint || 'Not reached',
        maxThroughput: Math.round(maxThroughput),
        samples: throughput.length,
        degradationPoint: breakingPoint ? 
          `${breakingPoint} operations` : 
          'System remained stable'
      };
    }, results);

    // Calculate summary metrics
    results.totalTime = Object.values(results.tests)
      .reduce((sum, test) => sum + (test.result?.elapsed || 0), 0);

    const throughputs = Object.values(results.tests)
      .map(t => t.result?.throughput || t.result?.opsPerSecond || 0)
      .filter(t => t > 0);
    
    if (throughputs.length > 0) {
      results.maxThroughput = Math.max(...throughputs);
    }

    if (options.verbose) {
      this.printResults(results);
    }

    return results;
  }

  async runTest(name, fn, results) {
    console.log(`\n🔨 ${name}...`);
    
    try {
      const result = await fn();
      results.tests[name] = {
        result,
        passed: !result.memoryError && (result.errors === 0 || result.errors < 10)
      };
      
      // Print immediate feedback
      if (result.elapsed) {
        console.log(`  ⏱️  Time: ${(result.elapsed / 1000).toFixed(2)}s`);
      }
      if (result.throughput) {
        console.log(`  📊 Throughput: ${result.throughput} ops/s`);
      }
      if (result.errors !== undefined) {
        console.log(`  ${result.errors === 0 ? '✅' : '⚠️'} Errors: ${result.errors}`);
      }
    } catch (error) {
      results.tests[name] = {
        error: error.message,
        passed: false
      };
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  printResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('🔥 STRESS TEST SUMMARY');
    console.log('='.repeat(60));

    Object.entries(results.tests).forEach(([name, test]) => {
      console.log(`\n${name}:`);
      
      if (test.error) {
        console.log(`  ❌ Failed: ${test.error}`);
      } else if (test.result) {
        Object.entries(test.result).forEach(([key, value]) => {
          if (typeof value === 'object' && !Array.isArray(value)) {
            console.log(`  ${key}:`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              console.log(`    ${subKey}: ${subValue}`);
            });
          } else if (!['errors', 'samples'].includes(key)) {
            console.log(`  ${key}: ${value}`);
          }
        });
      }
    });

    console.log('\n' + '─'.repeat(60));
    console.log(`Total Test Time: ${(results.totalTime / 1000).toFixed(2)}s`);
    console.log(`Max Throughput: ${results.maxThroughput} ops/s`);
    
    const passedTests = Object.values(results.tests).filter(t => t.passed).length;
    const totalTests = Object.keys(results.tests).length;
    const passRate = (passedTests / totalTests * 100).toFixed(0);
    
    console.log(`Tests Passed: ${passedTests}/${totalTests} (${passRate}%)`);
    console.log('='.repeat(60));
  }
}

module.exports = StressBenchmarks;