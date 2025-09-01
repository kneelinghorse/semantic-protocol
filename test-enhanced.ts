import { analyzeMission } from './mission-protocol';

// Test specific scenarios
const testCases = [
  { request: "Write tests for authentication", expected: "test_suite" },
  { request: "Create API documentation", expected: "documentation" },
  { request: "Build comprehensive test suite", expected: "test_suite" },
  { request: "Document the REST API endpoints", expected: "documentation" }
];

console.log('Testing specific mission detection:\n');
testCases.forEach(test => {
  const result = analyzeMission(test.request);
  const passed = result.semantics.type === test.expected;
  console.log(`${passed ? '✅' : '❌'} "${test.request}"`);
  console.log(`   Expected: ${test.expected}, Got: ${result.semantics.type} (${result.semantics.confidence}%)\n`);
});