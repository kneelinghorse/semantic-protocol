const { Suite } = require('benchmark');
const { SemanticProtocol } = require('../packages/core/src');
const RegistrationBenchmarks = require('./suites/registration');
const DiscoveryBenchmarks = require('./suites/discovery');
const ValidationBenchmarks = require('./suites/validation');
const RelationshipBenchmarks = require('./suites/relationships');
const MemoryBenchmarks = require('./suites/memory');
const StressBenchmarks = require('./suites/stress');
const { BenchmarkReporter } = require('./utils/reporter');
const { generateCharts } = require('./utils/charts');

/**
 * Semantic Protocol Performance Benchmark Suite
 * 
 * Performance Targets (from protocol_spec.json):
 * - Registration: < 5ms per component
 * - Discovery: < 20ms for complex queries
 * - Validation: < 10ms per manifest
 * - Relationship Resolution: < 15ms for full graph
 */

class BenchmarkRunner {
  constructor(options = {}) {
    this.options = {
      verbose: true,
      generateReports: true,
      saveResults: true,
      runStressTests: false,
      ...options
    };
    
    this.protocol = new SemanticProtocol();
    this.reporter = new BenchmarkReporter();
    this.results = {};
  }

  async runAll() {
    console.log('🚀 Starting Semantic Protocol Performance Benchmarks\n');
    console.log('Performance Targets:');
    console.log('  • Registration: < 5ms per component');
    console.log('  • Discovery: < 20ms for complex queries');
    console.log('  • Validation: < 10ms per manifest');
    console.log('  • Relationship Resolution: < 15ms for full graph\n');

    const startTime = Date.now();

    // Run benchmark suites
    await this.runSuite('Registration', RegistrationBenchmarks);
    await this.runSuite('Discovery', DiscoveryBenchmarks);
    await this.runSuite('Validation', ValidationBenchmarks);
    await this.runSuite('Relationships', RelationshipBenchmarks);
    await this.runSuite('Memory', MemoryBenchmarks);

    if (this.options.runStressTests) {
      await this.runSuite('Stress', StressBenchmarks);
    }

    const totalTime = Date.now() - startTime;

    // Generate reports
    if (this.options.generateReports) {
      await this.generateReports();
    }

    // Print summary
    this.printSummary(totalTime);

    return this.results;
  }

  async runSuite(name, SuiteClass) {
    console.log(`\n📊 Running ${name} Benchmarks...`);
    console.log('─'.repeat(50));

    const suite = new SuiteClass(this.protocol);
    const results = await suite.run(this.options);

    this.results[name.toLowerCase()] = results;

    // Check against targets
    this.checkTargets(name, results);

    return results;
  }

  checkTargets(suiteName, results) {
    const targets = {
      Registration: { metric: 'avgTime', target: 5, unit: 'ms' },
      Discovery: { metric: 'avgTime', target: 20, unit: 'ms' },
      Validation: { metric: 'avgTime', target: 10, unit: 'ms' },
      Relationships: { metric: 'avgTime', target: 15, unit: 'ms' }
    };

    const target = targets[suiteName];
    if (!target) return;

    const value = results[target.metric];
    const passed = value <= target.target;

    if (passed) {
      console.log(`✅ ${suiteName}: ${value.toFixed(2)}${target.unit} (Target: <${target.target}${target.unit})`);
    } else {
      console.log(`❌ ${suiteName}: ${value.toFixed(2)}${target.unit} (Target: <${target.target}${target.unit}) - FAILED`);
    }
  }

  async generateReports() {
    console.log('\n📈 Generating Reports...');

    // Generate detailed report
    const report = this.reporter.generate(this.results);
    await this.reporter.save(report, 'benchmarks/reports/benchmark-report.json');

    // Generate charts
    if (this.options.generateCharts) {
      await generateCharts(this.results, 'benchmarks/reports/charts');
    }

    // Generate markdown summary
    const markdown = this.reporter.generateMarkdown(this.results);
    await this.reporter.save(markdown, 'benchmarks/reports/BENCHMARK_RESULTS.md');

    console.log('✅ Reports generated in benchmarks/reports/');
  }

  printSummary(totalTime) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BENCHMARK SUMMARY');
    console.log('='.repeat(60));

    // Performance targets check
    const targets = [
      { name: 'Registration', value: this.results.registration?.avgTime, target: 5 },
      { name: 'Discovery', value: this.results.discovery?.avgTime, target: 20 },
      { name: 'Validation', value: this.results.validation?.avgTime, target: 10 },
      { name: 'Relationships', value: this.results.relationships?.avgTime, target: 15 }
    ];

    let passedCount = 0;
    targets.forEach(({ name, value, target }) => {
      if (value) {
        const passed = value <= target;
        passedCount += passed ? 1 : 0;
        const icon = passed ? '✅' : '❌';
        const status = passed ? 'PASS' : 'FAIL';
        console.log(`${icon} ${name}: ${value.toFixed(2)}ms (Target: <${target}ms) - ${status}`);
      }
    });

    // Memory usage
    if (this.results.memory) {
      console.log(`\n💾 Memory Usage:`);
      console.log(`   • Heap Used: ${(this.results.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   • External: ${(this.results.memory.external / 1024 / 1024).toFixed(2)}MB`);
    }

    // Overall score
    const score = (passedCount / targets.length) * 100;
    console.log(`\n🎯 Overall Score: ${score.toFixed(0)}% (${passedCount}/${targets.length} targets met)`);
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
  }

  async runContinuous(interval = 60000) {
    console.log(`🔄 Starting continuous benchmarking (interval: ${interval / 1000}s)`);
    
    const run = async () => {
      const results = await this.runAll();
      
      // Store timestamped results
      const timestamp = new Date().toISOString();
      await this.reporter.save(
        { timestamp, results },
        `benchmarks/reports/continuous/${timestamp.replace(/:/g, '-')}.json`
      );
    };

    // Run immediately
    await run();

    // Schedule periodic runs
    setInterval(run, interval);
  }

  async compare(baselineFile) {
    const baseline = require(baselineFile);
    const current = await this.runAll();

    console.log('\n📊 Performance Comparison');
    console.log('='.repeat(60));

    Object.keys(current).forEach(suite => {
      const baseValue = baseline[suite]?.avgTime;
      const currValue = current[suite]?.avgTime;

      if (baseValue && currValue) {
        const diff = ((currValue - baseValue) / baseValue) * 100;
        const icon = diff <= 0 ? '✅' : diff > 10 ? '❌' : '⚠️';
        const trend = diff > 0 ? 'slower' : 'faster';
        
        console.log(`${icon} ${suite}: ${Math.abs(diff).toFixed(1)}% ${trend}`);
        console.log(`   Baseline: ${baseValue.toFixed(2)}ms → Current: ${currValue.toFixed(2)}ms`);
      }
    });
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new BenchmarkRunner({
    verbose: !args.includes('--quiet'),
    generateReports: !args.includes('--no-reports'),
    runStressTests: args.includes('--stress'),
    generateCharts: args.includes('--charts')
  });

  if (args.includes('--continuous')) {
    const interval = parseInt(args[args.indexOf('--continuous') + 1]) || 60000;
    runner.runContinuous(interval);
  } else if (args.includes('--compare')) {
    const baseline = args[args.indexOf('--compare') + 1];
    runner.compare(baseline).catch(console.error);
  } else {
    runner.runAll()
      .then(results => {
        if (args.includes('--json')) {
          console.log(JSON.stringify(results, null, 2));
        }
        process.exit(0);
      })
      .catch(error => {
        console.error('Benchmark failed:', error);
        process.exit(1);
      });
  }
}

module.exports = BenchmarkRunner;