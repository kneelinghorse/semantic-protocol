import { MissionProtocol, analyzeMission, MissionType } from './mission-protocol';

interface TestCase {
  request: string;
  expectedType: MissionType;
  minConfidence: number;
}

const testCases: TestCase[] = [
  // NPM Package tests
  { request: "Build an npm package for data validation", expectedType: 'npm_package', minConfidence: 70 },
  { request: "Create a TypeScript library for React hooks", expectedType: 'npm_package', minConfidence: 60 },
  
  // API Integration tests
  { request: "Integrate with Stripe payment gateway", expectedType: 'api_integration', minConfidence: 80 },
  { request: "Connect to OpenAI API for chat completions", expectedType: 'api_integration', minConfidence: 70 },
  
  // CLI Tool tests
  { request: "Create a command-line tool for file conversion", expectedType: 'cli_tool', minConfidence: 70 },
  { request: "Build a CLI for database migrations", expectedType: 'cli_tool', minConfidence: 50 },
  
  // Web App tests
  { request: "Build a Next.js dashboard application", expectedType: 'web_app', minConfidence: 70 },
  { request: "Create a React app with routing and state management", expectedType: 'web_app', minConfidence: 60 },
  
  // Data Pipeline tests
  { request: "Set up ETL pipeline for CSV processing", expectedType: 'data_pipeline', minConfidence: 70 },
  { request: "Build data transformation workflow", expectedType: 'data_pipeline', minConfidence: 80 },
  
  // UI Component tests
  { request: "Create a reusable button component", expectedType: 'ui_component', minConfidence: 70 },
  { request: "Build a modal dialog with animations", expectedType: 'ui_component', minConfidence: 60 },
  
  // Database Schema tests
  { request: "Design database schema for blog platform", expectedType: 'database_schema', minConfidence: 80 },
  { request: "Create Prisma models for user authentication", expectedType: 'database_schema', minConfidence: 60 },
  
  // Deployment Config tests
  { request: "Deploy application to AWS with Docker", expectedType: 'deployment_config', minConfidence: 80 },
  { request: "Set up CI/CD pipeline with GitHub Actions", expectedType: 'deployment_config', minConfidence: 60 },
  
  // Test Suite tests
  { request: "Write unit tests for authentication module", expectedType: 'test_suite', minConfidence: 60 },
  { request: "Create E2E tests with Playwright", expectedType: 'test_suite', minConfidence: 50 },
  
  // Documentation tests
  { request: "Document the REST API endpoints", expectedType: 'documentation', minConfidence: 60 },
  { request: "Create comprehensive README with examples", expectedType: 'documentation', minConfidence: 50 },
];

function runTests() {
  const protocol = new MissionProtocol();
  let passed = 0;
  let failed = 0;
  
  console.log('🧪 Mission Protocol Test Suite\n');
  console.log('=' .repeat(60));
  
  const results: Array<{
    test: TestCase;
    result: ReturnType<typeof analyzeMission>;
    passed: boolean;
  }> = [];
  
  for (const testCase of testCases) {
    const result = analyzeMission(testCase.request);
    const typeMatch = result.semantics.type === testCase.expectedType;
    const confidenceMatch = result.semantics.confidence >= testCase.minConfidence;
    const testPassed = typeMatch && confidenceMatch;
    
    results.push({ test: testCase, result, passed: testPassed });
    
    if (testPassed) {
      passed++;
    } else {
      failed++;
    }
  }
  
  // Group results by mission type
  const groupedResults = results.reduce((acc, r) => {
    const type = r.test.expectedType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {} as Record<MissionType, typeof results>);
  
  // Display results grouped by type
  for (const [type, typeResults] of Object.entries(groupedResults)) {
    console.log(`\n📦 ${type.toUpperCase().replace('_', ' ')}`);
    console.log('-'.repeat(40));
    
    for (const { test, result, passed } of typeResults) {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} "${test.request}"`);
      
      if (!passed) {
        console.log(`   Expected: ${test.expectedType} (≥${test.minConfidence}%)`);
        console.log(`   Got: ${result.semantics.type} (${result.semantics.confidence}%)`);
      } else {
        console.log(`   Detected correctly with ${result.semantics.confidence}% confidence`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log(`   Total Tests: ${testCases.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
  
  // Performance metrics
  console.log('\n📈 Performance Insights');
  const avgConfidence = results.reduce((sum, r) => sum + r.result.semantics.confidence, 0) / results.length;
  console.log(`   Average Confidence: ${Math.round(avgConfidence)}%`);
  
  const highConfidence = results.filter(r => r.result.semantics.confidence >= 80).length;
  console.log(`   High Confidence (≥80%): ${highConfidence}/${testCases.length}`);
  
  const correctType = results.filter(r => r.result.semantics.type === r.test.expectedType).length;
  console.log(`   Type Accuracy: ${Math.round((correctType / testCases.length) * 100)}%`);
}

// Run the test suite
runTests();