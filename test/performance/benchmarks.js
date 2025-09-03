const Benchmark = require('benchmark');
const { SemanticProtocol, Registry, DiscoveryEngine } = require('../../packages/core/src');

const suite = new Benchmark.Suite();

// Test data generation
function generateManifests(count) {
  const manifests = [];
  for (let i = 0; i < count; i++) {
    manifests.push({
      id: `component-${i}`,
      element: {
        type: ['action', 'display', 'input', 'container'][i % 4],
        intent: `intent-${i % 10}`
      },
      context: {
        flow: `flow-${i % 5}`,
        step: i % 10,
        level: i % 3
      },
      tags: i % 2 === 0 ? ['even', 'test'] : ['odd', 'test'],
      relationships: {
        parent: i > 0 ? `component-${Math.floor(i / 2)}` : null,
        children: i < count / 2 ? [`component-${i * 2}`, `component-${i * 2 + 1}`] : []
      }
    });
  }
  return manifests;
}

// Performance benchmarks
suite
  .add('Component Registration (Single)', function() {
    const protocol = new SemanticProtocol();
    protocol.register({
      id: 'test-component',
      element: { type: 'action', intent: 'submit' }
    });
  })
  
  .add('Component Registration (Batch 100)', function() {
    const protocol = new SemanticProtocol();
    const manifests = generateManifests(100);
    protocol.registerBatch(manifests);
  })
  
  .add('Component Registration (Batch 1000)', function() {
    const protocol = new SemanticProtocol();
    const manifests = generateManifests(1000);
    protocol.registerBatch(manifests);
  })
  
  .add('Simple Query (type)', {
    setup: function() {
      const protocol = new SemanticProtocol();
      const manifests = generateManifests(1000);
      manifests.forEach(m => protocol.registry.set(m.id, m));
      this.discovery = new DiscoveryEngine(protocol.registry);
    },
    fn: function() {
      this.discovery.find({ type: 'action' });
    }
  })
  
  .add('Complex Query (multiple conditions)', {
    setup: function() {
      const protocol = new SemanticProtocol();
      const manifests = generateManifests(1000);
      manifests.forEach(m => protocol.registry.set(m.id, m));
      this.discovery = new DiscoveryEngine(protocol.registry);
    },
    fn: function() {
      this.discovery.find({
        type: 'action',
        context: { flow: 'flow-2', step: 5 },
        tags: ['even']
      });
    }
  })
  
  .add('Wildcard Query', {
    setup: function() {
      const protocol = new SemanticProtocol();
      const manifests = generateManifests(1000);
      manifests.forEach(m => protocol.registry.set(m.id, m));
      this.discovery = new DiscoveryEngine(protocol.registry);
    },
    fn: function() {
      this.discovery.find({ id: 'component-1*' });
    }
  })
  
  .add('Relationship Resolution (Direct)', {
    setup: function() {
      const protocol = new SemanticProtocol();
      const manifests = generateManifests(1000);
      manifests.forEach(m => protocol.registry.set(m.id, m));
      this.discovery = new DiscoveryEngine(protocol.registry);
    },
    fn: function() {
      const component = protocol.registry.get('component-500');
      this.discovery.resolveRelationships(component, 'children');
    }
  })
  
  .add('Relationship Graph Building', {
    setup: function() {
      const protocol = new SemanticProtocol();
      const manifests = generateManifests(100);
      manifests.forEach(m => protocol.registry.set(m.id, m));
      this.discovery = new DiscoveryEngine(protocol.registry);
    },
    fn: function() {
      this.discovery.buildRelationshipGraph();
    }
  })
  
  .add('Manifest Validation (Simple)', function() {
    const protocol = new SemanticProtocol();
    protocol.validate({
      id: 'test',
      element: { type: 'action', intent: 'submit' }
    });
  })
  
  .add('Manifest Validation (Complex)', function() {
    const protocol = new SemanticProtocol();
    protocol.validate({
      id: 'complex',
      element: { type: 'container', intent: 'group' },
      context: {
        level1: {
          level2: {
            level3: {
              data: 'nested',
              array: [1, 2, 3, 4, 5]
            }
          }
        }
      },
      relationships: {
        parent: 'parent-id',
        children: ['child1', 'child2', 'child3'],
        triggers: ['action1', 'action2']
      },
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    });
  })
  
  .add('Manifest Diff Computation', {
    setup: function() {
      this.original = {
        id: 'diff-test',
        element: { type: 'action', intent: 'submit' },
        context: { flow: 'checkout', step: 1 },
        tags: ['primary', 'critical']
      };
      this.modified = {
        id: 'diff-test',
        element: { type: 'action', intent: 'cancel' },
        context: { flow: 'checkout', step: 2, newField: 'value' },
        tags: ['secondary', 'critical']
      };
    },
    fn: function() {
      const protocol = new SemanticProtocol();
      protocol.diff(this.original, this.modified);
    }
  })
  
  .add('Cache Hit Performance', {
    setup: function() {
      const protocol = new SemanticProtocol();
      const manifests = generateManifests(1000);
      manifests.forEach(m => protocol.registry.set(m.id, m));
      this.discovery = new DiscoveryEngine(protocol.registry);
      // Warm up cache
      this.discovery.find({ type: 'action' });
    },
    fn: function() {
      this.discovery.find({ type: 'action' });
    }
  })
  
  .add('Memory Usage (1000 components)', {
    setup: function() {
      if (global.gc) global.gc();
      this.initialMemory = process.memoryUsage().heapUsed;
    },
    fn: function() {
      const protocol = new SemanticProtocol();
      const manifests = generateManifests(1000);
      manifests.forEach(m => protocol.registry.set(m.id, m));
      
      if (global.gc) global.gc();
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsed = (finalMemory - this.initialMemory) / 1024 / 1024;
      
      if (memoryUsed > 10) {
        throw new Error(`Memory usage exceeded limit: ${memoryUsed.toFixed(2)}MB`);
      }
    }
  })
  
  // Event listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
    
    // Check performance baselines
    const benchmark = event.target;
    const opsPerSec = benchmark.hz;
    const msPerOp = 1000 / opsPerSec;
    
    // Define performance thresholds
    const thresholds = {
      'Component Registration (Single)': 5, // < 5ms
      'Simple Query (type)': 20, // < 20ms
      'Complex Query (multiple conditions)': 30, // < 30ms
      'Manifest Validation (Simple)': 10, // < 10ms
      'Relationship Resolution (Direct)': 15, // < 15ms
    };
    
    const threshold = thresholds[benchmark.name];
    if (threshold && msPerOp > threshold) {
      console.warn(`⚠️  ${benchmark.name} exceeded threshold: ${msPerOp.toFixed(2)}ms > ${threshold}ms`);
    } else if (threshold) {
      console.log(`✅ ${benchmark.name} within threshold: ${msPerOp.toFixed(2)}ms < ${threshold}ms`);
    }
  })
  .on('complete', function() {
    console.log('\n📊 Benchmark Results Summary:');
    console.log('Fastest is ' + this.filter('fastest').map('name'));
    
    // Generate performance report
    const report = {
      timestamp: new Date().toISOString(),
      results: this.map(benchmark => ({
        name: benchmark.name,
        opsPerSecond: Math.round(benchmark.hz),
        msPerOperation: (1000 / benchmark.hz).toFixed(3),
        relativeMoe: benchmark.stats.rme.toFixed(2) + '%',
        samples: benchmark.stats.sample.length
      }))
    };
    
    console.log('\n📈 Detailed Performance Report:');
    console.table(report.results);
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync(
      './test/performance/benchmark-results.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n💾 Results saved to benchmark-results.json');
  })
  .run({ async: true });

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.startTime = null;
  }
  
  start(label) {
    this.startTime = performance.now();
    this.currentLabel = label;
  }
  
  end() {
    if (!this.startTime) return;
    
    const duration = performance.now() - this.startTime;
    this.metrics.push({
      label: this.currentLabel,
      duration,
      timestamp: new Date().toISOString()
    });
    
    this.startTime = null;
    return duration;
  }
  
  getReport() {
    const report = {
      totalMetrics: this.metrics.length,
      averageDuration: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
      minDuration: Math.min(...this.metrics.map(m => m.duration)),
      maxDuration: Math.max(...this.metrics.map(m => m.duration)),
      metrics: this.metrics
    };
    
    return report;
  }
  
  reset() {
    this.metrics = [];
    this.startTime = null;
  }
}

module.exports = { PerformanceMonitor };