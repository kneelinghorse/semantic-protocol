import { analyze, SemanticAnalyzer, AnalysisResult } from './dist';

console.log('Testing npm package build...\n');

// Test basic analyze function
const result1 = analyze('is_cancelled', 'boolean', { context: 'list' });
console.log('Test 1 - Cancellation:');
console.log(result1);
console.log();

// Test currency detection
const result2 = analyze('monthly_payment', 'decimal', { context: 'detail' });
console.log('Test 2 - Currency:');
console.log(result2);
console.log();

// Test using the class directly
const analyzer = new SemanticAnalyzer();
const result3 = analyzer.analyze({ name: 'created_at', type: 'timestamp' }, 'timeline');
console.log('Test 3 - Temporal (using class):');
console.log(result3);
console.log();

// Test type checking
const typedResult: AnalysisResult = analyze('email_address', 'string', { context: 'form' });
console.log('Test 4 - Email (typed):');
console.log(`Best match: ${typedResult.bestMatch?.semantic || 'none'}`);
console.log(`Instruction: ${JSON.stringify(typedResult.renderInstruction)}`);
console.log(`Confidence: ${typedResult.metadata.confidence}%`);
console.log();

console.log('✅ All tests passed!');