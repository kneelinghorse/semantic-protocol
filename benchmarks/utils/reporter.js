const fs = require('fs').promises;
const path = require('path');

class BenchmarkReporter {
  constructor(options = {}) {
    this.options = {
      outputDir: 'benchmarks/reports',
      format: 'json',
      includeRawData: false,
      ...options
    };
  }

  async generate(results) {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.getEnvironment(),
      summary: this.generateSummary(results),
      details: this.generateDetails(results),
      performance: this.analyzePerformance(results),
      recommendations: this.generateRecommendations(results)
    };

    if (this.options.includeRawData) {
      report.rawData = results;
    }

    return report;
  }

  getEnvironment() {
    return {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      memory: Math.round(require('os').totalmem() / 1024 / 1024 / 1024) + 'GB',
      uptime: process.uptime()
    };
  }

  generateSummary(results) {
    const summary = {
      totalSuites: Object.keys(results).length,
      passedTargets: 0,
      failedTargets: 0,
      averagePerformance: {},
      status: 'unknown'
    };

    // Check performance targets
    const targets = {
      registration: { target: 5, actual: results.registration?.avgTime },
      discovery: { target: 20, actual: results.discovery?.avgTime },
      validation: { target: 10, actual: results.validation?.avgTime },
      relationships: { target: 15, actual: results.relationships?.avgTime }
    };

    Object.entries(targets).forEach(([name, data]) => {
      if (data.actual !== undefined) {
        const passed = data.actual <= data.target;
        if (passed) {
          summary.passedTargets++;
        } else {
          summary.failedTargets++;
        }
        summary.averagePerformance[name] = {
          target: data.target,
          actual: parseFloat(data.actual.toFixed(2)),
          passed,
          delta: parseFloat((data.actual - data.target).toFixed(2))
        };
      }
    });

    // Determine overall status
    const totalTargets = summary.passedTargets + summary.failedTargets;
    if (totalTargets === 0) {
      summary.status = 'no-data';
    } else if (summary.failedTargets === 0) {
      summary.status = 'excellent';
    } else if (summary.passedTargets / totalTargets >= 0.75) {
      summary.status = 'good';
    } else if (summary.passedTargets / totalTargets >= 0.5) {
      summary.status = 'fair';
    } else {
      summary.status = 'poor';
    }

    return summary;
  }

  generateDetails(results) {
    const details = {};

    Object.entries(results).forEach(([suite, data]) => {
      details[suite] = {
        avgTime: data.avgTime,
        minTime: data.minTime,
        maxTime: data.maxTime,
        tests: {}
      };

      if (data.tests) {
        Object.entries(data.tests).forEach(([test, result]) => {
          details[suite].tests[test] = {
            time: result.time,
            ops: result.ops,
            passed: result.passed !== false,
            error: result.error
          };
        });
      }

      // Add suite-specific metrics
      if (suite === 'memory' && data.heapUsed) {
        details[suite].memoryMetrics = {
          heapUsed: data.heapUsed,
          external: data.external,
          leaks: data.leaks || []
        };
      }

      if (suite === 'stress' && data.maxThroughput) {
        details[suite].stressMetrics = {
          maxThroughput: data.maxThroughput,
          breakingPoint: data.breakingPoint
        };
      }
    });

    return details;
  }

  analyzePerformance(results) {
    const analysis = {
      bottlenecks: [],
      strengths: [],
      trends: {},
      outliers: []
    };

    // Identify bottlenecks
    Object.entries(results).forEach(([suite, data]) => {
      if (data.avgTime) {
        const target = this.getTargetForSuite(suite);
        if (target && data.avgTime > target * 1.5) {
          analysis.bottlenecks.push({
            suite,
            severity: 'high',
            impact: `${((data.avgTime / target - 1) * 100).toFixed(0)}% over target`,
            recommendation: this.getRecommendationForBottleneck(suite, data)
          });
        } else if (target && data.avgTime > target) {
          analysis.bottlenecks.push({
            suite,
            severity: 'medium',
            impact: `${((data.avgTime / target - 1) * 100).toFixed(0)}% over target`,
            recommendation: this.getRecommendationForBottleneck(suite, data)
          });
        }
      }
    });

    // Identify strengths
    Object.entries(results).forEach(([suite, data]) => {
      if (data.avgTime) {
        const target = this.getTargetForSuite(suite);
        if (target && data.avgTime < target * 0.5) {
          analysis.strengths.push({
            suite,
            performance: `${((1 - data.avgTime / target) * 100).toFixed(0)}% better than target`
          });
        }
      }
    });

    // Identify outliers
    Object.entries(results).forEach(([suite, data]) => {
      if (data.tests) {
        Object.entries(data.tests).forEach(([test, result]) => {
          if (result.time && data.avgTime) {
            const deviation = Math.abs(result.time - data.avgTime) / data.avgTime;
            if (deviation > 2) {
              analysis.outliers.push({
                suite,
                test,
                time: result.time,
                deviation: `${(deviation * 100).toFixed(0)}% from average`
              });
            }
          }
        });
      }
    });

    return analysis;
  }

  getTargetForSuite(suite) {
    const targets = {
      registration: 5,
      discovery: 20,
      validation: 10,
      relationships: 15
    };
    return targets[suite];
  }

  getRecommendationForBottleneck(suite, data) {
    const recommendations = {
      registration: 'Consider optimizing the registration index or implementing batch registration',
      discovery: 'Implement more aggressive caching or optimize query algorithms',
      validation: 'Review validation rules and consider async validation for complex rules',
      relationships: 'Optimize graph traversal algorithms or implement relationship caching'
    };
    return recommendations[suite] || 'Review and optimize the implementation';
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Performance recommendations
    const performance = this.analyzePerformance(results);
    
    if (performance.bottlenecks.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Address Performance Bottlenecks',
        description: `Found ${performance.bottlenecks.length} performance bottlenecks that need attention`,
        actions: performance.bottlenecks.map(b => b.recommendation)
      });
    }

    // Memory recommendations
    if (results.memory) {
      if (results.memory.leaks && results.memory.leaks.length > 0) {
        recommendations.push({
          priority: 'critical',
          category: 'memory',
          title: 'Fix Memory Leaks',
          description: `Detected ${results.memory.leaks.length} potential memory leaks`,
          actions: [
            'Review component lifecycle management',
            'Ensure proper cleanup in unregister operations',
            'Check for circular references'
          ]
        });
      }

      const heapUsedMB = results.memory.heapUsed / 1024 / 1024;
      if (heapUsedMB > 100) {
        recommendations.push({
          priority: 'medium',
          category: 'memory',
          title: 'Optimize Memory Usage',
          description: `Heap usage is ${heapUsedMB.toFixed(0)}MB`,
          actions: [
            'Implement memory pooling for frequently created objects',
            'Use WeakMap/WeakSet for appropriate references',
            'Consider lazy loading for large data structures'
          ]
        });
      }
    }

    // Stress test recommendations
    if (results.stress) {
      if (results.stress.breakingPoint && results.stress.breakingPoint < 5000) {
        recommendations.push({
          priority: 'high',
          category: 'scalability',
          title: 'Improve System Scalability',
          description: `System breaks at ${results.stress.breakingPoint} operations`,
          actions: [
            'Implement connection pooling',
            'Add request throttling',
            'Consider horizontal scaling strategies'
          ]
        });
      }
    }

    // Cache recommendations
    if (results.discovery && results.discovery.avgTime > 10) {
      recommendations.push({
        priority: 'medium',
        category: 'caching',
        title: 'Optimize Cache Strategy',
        description: 'Discovery operations could benefit from better caching',
        actions: [
          'Implement LRU cache with appropriate size limits',
          'Add cache warming for common queries',
          'Consider distributed caching for scale'
        ]
      });
    }

    return recommendations;
  }

  generateMarkdown(results) {
    const report = this.generate(results);
    let markdown = '# Semantic Protocol Benchmark Report\n\n';
    
    markdown += `Generated: ${report.timestamp}\n\n`;
    
    // Environment
    markdown += '## Environment\n\n';
    markdown += `- Node: ${report.environment.node}\n`;
    markdown += `- Platform: ${report.environment.platform}\n`;
    markdown += `- CPUs: ${report.environment.cpus}\n`;
    markdown += `- Memory: ${report.environment.memory}\n\n`;
    
    // Summary
    markdown += '## Summary\n\n';
    markdown += `- **Status**: ${report.summary.status.toUpperCase()}\n`;
    markdown += `- **Passed Targets**: ${report.summary.passedTargets}\n`;
    markdown += `- **Failed Targets**: ${report.summary.failedTargets}\n\n`;
    
    // Performance Targets
    markdown += '## Performance Targets\n\n';
    markdown += '| Suite | Target (ms) | Actual (ms) | Status | Delta |\n';
    markdown += '|-------|-------------|-------------|--------|-------|\n';
    
    Object.entries(report.summary.averagePerformance).forEach(([suite, data]) => {
      const status = data.passed ? '✅ PASS' : '❌ FAIL';
      const delta = data.delta > 0 ? `+${data.delta}` : data.delta;
      markdown += `| ${suite} | ${data.target} | ${data.actual} | ${status} | ${delta}ms |\n`;
    });
    
    markdown += '\n';
    
    // Detailed Results
    markdown += '## Detailed Results\n\n';
    
    Object.entries(report.details).forEach(([suite, data]) => {
      markdown += `### ${suite.charAt(0).toUpperCase() + suite.slice(1)} Suite\n\n`;
      
      if (data.avgTime !== undefined) {
        markdown += `- Average Time: ${data.avgTime.toFixed(2)}ms\n`;
        markdown += `- Min Time: ${data.minTime.toFixed(2)}ms\n`;
        markdown += `- Max Time: ${data.maxTime.toFixed(2)}ms\n\n`;
      }
      
      if (data.memoryMetrics) {
        markdown += '**Memory Metrics:**\n';
        markdown += `- Heap Used: ${(data.memoryMetrics.heapUsed / 1024 / 1024).toFixed(2)}MB\n`;
        markdown += `- External: ${(data.memoryMetrics.external / 1024 / 1024).toFixed(2)}MB\n`;
        if (data.memoryMetrics.leaks.length > 0) {
          markdown += `- ⚠️ Potential Leaks: ${data.memoryMetrics.leaks.join(', ')}\n`;
        }
        markdown += '\n';
      }
      
      if (data.stressMetrics) {
        markdown += '**Stress Metrics:**\n';
        markdown += `- Max Throughput: ${data.stressMetrics.maxThroughput} ops/s\n`;
        markdown += `- Breaking Point: ${data.stressMetrics.breakingPoint || 'Not reached'}\n\n`;
      }
    });
    
    // Recommendations
    if (report.recommendations.length > 0) {
      markdown += '## Recommendations\n\n';
      
      report.recommendations.forEach(rec => {
        const priorityEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢'
        };
        
        markdown += `### ${priorityEmoji[rec.priority] || '⚪'} ${rec.title}\n\n`;
        markdown += `**Priority**: ${rec.priority}\n`;
        markdown += `**Category**: ${rec.category}\n\n`;
        markdown += `${rec.description}\n\n`;
        
        if (rec.actions && rec.actions.length > 0) {
          markdown += '**Actions**:\n';
          rec.actions.forEach(action => {
            markdown += `- ${action}\n`;
          });
          markdown += '\n';
        }
      });
    }
    
    return markdown;
  }

  async save(data, filepath) {
    const dir = path.dirname(filepath);
    await fs.mkdir(dir, { recursive: true });
    
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await fs.writeFile(filepath, content, 'utf-8');
  }

  async saveHTML(results, filepath) {
    const report = await this.generate(results);
    const html = this.generateHTML(report);
    await this.save(html, filepath);
  }

  generateHTML(report) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Semantic Protocol Benchmark Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
    h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .status { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
    .status.excellent { background: #4caf50; color: white; }
    .status.good { background: #8bc34a; color: white; }
    .status.fair { background: #ff9800; color: white; }
    .status.poor { background: #f44336; color: white; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #f5f5f5; }
    .pass { color: #4caf50; }
    .fail { color: #f44336; }
    .recommendation { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .priority-critical { border-left: 4px solid #f44336; }
    .priority-high { border-left: 4px solid #ff9800; }
    .priority-medium { border-left: 4px solid #ffc107; }
    .priority-low { border-left: 4px solid #4caf50; }
  </style>
</head>
<body>
  <h1>Semantic Protocol Benchmark Report</h1>
  <p>Generated: ${report.timestamp}</p>
  
  <h2>Summary</h2>
  <p>Status: <span class="status ${report.summary.status}">${report.summary.status.toUpperCase()}</span></p>
  <p>Passed Targets: ${report.summary.passedTargets} | Failed Targets: ${report.summary.failedTargets}</p>
  
  <h2>Performance Targets</h2>
  <table>
    <tr>
      <th>Suite</th>
      <th>Target (ms)</th>
      <th>Actual (ms)</th>
      <th>Status</th>
      <th>Delta</th>
    </tr>
    ${Object.entries(report.summary.averagePerformance).map(([suite, data]) => `
    <tr>
      <td>${suite}</td>
      <td>${data.target}</td>
      <td>${data.actual}</td>
      <td class="${data.passed ? 'pass' : 'fail'}">${data.passed ? '✅ PASS' : '❌ FAIL'}</td>
      <td>${data.delta > 0 ? '+' : ''}${data.delta}ms</td>
    </tr>
    `).join('')}
  </table>
  
  ${report.recommendations.length > 0 ? `
  <h2>Recommendations</h2>
  ${report.recommendations.map(rec => `
  <div class="recommendation priority-${rec.priority}">
    <h3>${rec.title}</h3>
    <p><strong>Priority:</strong> ${rec.priority} | <strong>Category:</strong> ${rec.category}</p>
    <p>${rec.description}</p>
    ${rec.actions ? `
    <ul>
      ${rec.actions.map(action => `<li>${action}</li>`).join('')}
    </ul>
    ` : ''}
  </div>
  `).join('')}
  ` : ''}
</body>
</html>`;
  }
}

module.exports = { BenchmarkReporter };