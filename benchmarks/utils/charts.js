const fs = require('fs').promises;
const path = require('path');

class ChartGenerator {
  static async generateCharts(results, outputDir) {
    await fs.mkdir(outputDir, { recursive: true });

    // Generate performance comparison chart
    await this.generatePerformanceChart(results, path.join(outputDir, 'performance.html'));

    // Generate memory usage chart
    if (results.memory) {
      await this.generateMemoryChart(results.memory, path.join(outputDir, 'memory.html'));
    }

    // Generate throughput chart
    if (results.stress) {
      await this.generateThroughputChart(results.stress, path.join(outputDir, 'throughput.html'));
    }

    // Generate timeline chart for continuous benchmarks
    await this.generateTimelineChart(results, path.join(outputDir, 'timeline.html'));

    console.log(`✅ Charts generated in ${outputDir}`);
  }

  static async generatePerformanceChart(results, filepath) {
    const targets = {
      registration: 5,
      discovery: 20,
      validation: 10,
      relationships: 15
    };

    const chartData = Object.entries(targets).map(([suite, target]) => ({
      suite,
      target,
      actual: results[suite]?.avgTime || 0
    }));

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Performance Comparison</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Performance vs Targets</h1>
    <canvas id="performanceChart"></canvas>
  </div>
  
  <script>
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const data = ${JSON.stringify(chartData)};
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.suite),
        datasets: [
          {
            label: 'Target (ms)',
            data: data.map(d => d.target),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Actual (ms)',
            data: data.map(d => d.actual),
            backgroundColor: data.map(d => 
              d.actual <= d.target ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'
            ),
            borderColor: data.map(d => 
              d.actual <= d.target ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'
            ),
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Performance Benchmark Results'
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Time (ms)'
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;

    await fs.writeFile(filepath, html);
  }

  static async generateMemoryChart(memoryResults, filepath) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Memory Usage Analysis</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Memory Usage Breakdown</h1>
    <canvas id="memoryChart"></canvas>
  </div>
  
  <script>
    const ctx = document.getElementById('memoryChart').getContext('2d');
    const memoryData = {
      heapUsed: ${memoryResults.heapUsed / 1024 / 1024},
      external: ${memoryResults.external / 1024 / 1024}
    };
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Heap Used', 'External'],
        datasets: [{
          data: [memoryData.heapUsed, memoryData.external],
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Memory Usage (MB)'
          },
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed.toFixed(2) + ' MB';
              }
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;

    await fs.writeFile(filepath, html);
  }

  static async generateThroughputChart(stressResults, filepath) {
    const tests = Object.entries(stressResults.tests || {})
      .filter(([_, test]) => test.result?.throughput || test.result?.opsPerSecond)
      .map(([name, test]) => ({
        name,
        throughput: test.result.throughput || test.result.opsPerSecond || 0
      }));

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Throughput Analysis</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Throughput Performance</h1>
    <canvas id="throughputChart"></canvas>
  </div>
  
  <script>
    const ctx = document.getElementById('throughputChart').getContext('2d');
    const data = ${JSON.stringify(tests)};
    
    new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Operations per Second',
          data: data.map(d => d.throughput),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: 'Stress Test Throughput'
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Operations/Second'
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;

    await fs.writeFile(filepath, html);
  }

  static async generateTimelineChart(results, filepath) {
    // This would be used for continuous benchmarking over time
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Performance Timeline</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/date-fns@2/index.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Performance Over Time</h1>
    <canvas id="timelineChart"></canvas>
  </div>
  
  <script>
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    // Sample timeline data - would be populated from continuous benchmarks
    const timelineData = [
      { x: new Date().toISOString(), registration: ${results.registration?.avgTime || 5}, discovery: ${results.discovery?.avgTime || 20} },
    ];
    
    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Registration',
            data: timelineData.map(d => ({ x: d.x, y: d.registration })),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
          },
          {
            label: 'Discovery',
            data: timelineData.map(d => ({ x: d.x, y: d.discovery })),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Performance Trends'
          },
          legend: {
            display: true
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'hour'
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Time (ms)'
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;

    await fs.writeFile(filepath, html);
  }

  static async generateComparisonChart(baseline, current, filepath) {
    const suites = ['registration', 'discovery', 'validation', 'relationships'];
    const comparison = suites.map(suite => ({
      suite,
      baseline: baseline[suite]?.avgTime || 0,
      current: current[suite]?.avgTime || 0,
      improvement: baseline[suite] && current[suite] ? 
        ((baseline[suite].avgTime - current[suite].avgTime) / baseline[suite].avgTime * 100).toFixed(1) : 0
    }));

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Benchmark Comparison</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { color: #333; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; padding: 10px; }
    .improvement { color: #4caf50; }
    .regression { color: #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Baseline vs Current Performance</h1>
    
    <div class="stats">
      ${comparison.map(c => `
      <div class="stat">
        <h3>${c.suite}</h3>
        <p class="${c.improvement > 0 ? 'improvement' : 'regression'}">
          ${c.improvement > 0 ? '↑' : '↓'} ${Math.abs(c.improvement)}%
        </p>
      </div>
      `).join('')}
    </div>
    
    <canvas id="comparisonChart"></canvas>
  </div>
  
  <script>
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const data = ${JSON.stringify(comparison)};
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.suite),
        datasets: [
          {
            label: 'Baseline (ms)',
            data: data.map(d => d.baseline),
            backgroundColor: 'rgba(158, 158, 158, 0.5)',
            borderColor: 'rgba(158, 158, 158, 1)',
            borderWidth: 1
          },
          {
            label: 'Current (ms)',
            data: data.map(d => d.current),
            backgroundColor: data.map(d => 
              d.current < d.baseline ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'
            ),
            borderColor: data.map(d => 
              d.current < d.baseline ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'
            ),
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Performance Comparison'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Time (ms)'
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;

    await fs.writeFile(filepath, html);
  }
}

module.exports = { generateCharts: ChartGenerator.generateCharts.bind(ChartGenerator) };