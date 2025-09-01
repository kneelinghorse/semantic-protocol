/**
 * Semantic Protocol TypeScript - Test & Examples
 * Demonstrates type safety and advanced features
 */

import SemanticProtocol, { 
  FieldDefinition, 
  SemanticType, 
  RenderContext,
  semanticUtils 
} from './semantic-protocol';

// Example 1: Type-safe field creation with builder pattern
console.log("=== Type-Safe Field Creation ===");

const userIdField = SemanticProtocol.field('user_id')
  .type('string')
  .primaryKey()
  .unique()
  .description('Unique user identifier')
  .build();

const protocol = new SemanticProtocol();
const userIdAnalysis = protocol.analyze(userIdField);
console.log(`Field: ${userIdAnalysis.field}`);
console.log(`Best Match: ${userIdAnalysis.bestMatch?.semantic} (${userIdAnalysis.bestMatch?.confidence}%)`);
console.log(`Render: ${userIdAnalysis.renderInstruction.component}`);

// Example 2: Analyzing a complete schema (like from Prisma)
console.log("\n=== Schema Analysis ===");

const userSchema: FieldDefinition[] = [
  { name: 'id', type: 'string' },
  { name: 'email', type: 'string' },
  { name: 'is_premium', type: 'boolean' },
  { name: 'account_balance', type: 'decimal' },
  { name: 'created_at', type: 'timestamp' },
  { name: 'cancellation_date', type: 'date' },
  { name: 'profile_url', type: 'string' },
  { name: 'success_rate', type: 'float', value: 0.95 },
  { name: 'error_count', type: 'integer' },
  { name: 'subscription_tier', type: 'string' }
];

const schemaResults = protocol.analyzeSchema(userSchema, 'list');

// Group by semantic types
const grouped = semanticUtils.groupBySemantics(schemaResults);
console.log("\nFields grouped by semantic type:");
for (const [semantic, results] of Object.entries(grouped)) {
  console.log(`\n${semantic}:`);
  results.forEach(r => {
    console.log(`  - ${r.field}: ${r.renderInstruction.component}:${r.renderInstruction.variant || 'default'}`);
  });
}

// Example 3: Different contexts produce different render instructions
console.log("\n=== Context-Aware Rendering ===");

const priceField: FieldDefinition = { 
  name: 'total_price', 
  type: 'decimal', 
  value: 1299.99 
};

const contexts: RenderContext[] = ['list', 'detail', 'form', 'timeline'];
contexts.forEach(context => {
  const result = protocol.analyze(priceField, context);
  const instr = result.renderInstruction;
  console.log(`${context}: ${instr.component}:${instr.variant} ${JSON.stringify(instr.props || {})}`);
});

// Example 4: Confidence thresholds and filtering
console.log("\n=== Confidence Filtering ===");

const ambiguousField: FieldDefinition = { 
  name: 'status_code',  // Could be status OR identifier
  type: 'string' 
};

const ambiguousAnalysis = protocol.analyze(ambiguousField);
console.log(`Field: ${ambiguousField.name}`);
console.log("All matches:");
ambiguousAnalysis.metadata.allMatches.forEach(match => {
  console.log(`  - ${match.semantic}: ${match.confidence}% - ${match.reason}`);
});
console.log(`Best match (>70%): ${ambiguousAnalysis.bestMatch?.semantic || 'none'}`);

// Example 5: High confidence detection
console.log("\n=== High Confidence Fields ===");

const highConfidenceFields = schemaResults.filter(semanticUtils.isHighConfidence);
console.log("Fields with 90%+ confidence:");
highConfidenceFields.forEach(result => {
  console.log(`  - ${result.field}: ${result.bestMatch?.semantic} (${result.metadata.confidence}%)`);
});

// Example 6: Complex type inference
console.log("\n=== Complex Pattern Matching ===");

const complexFields: FieldDefinition[] = [
  { name: 'payment_failed', type: 'boolean' },  // Both 'payment' (currency) and 'failed' (danger)
  { name: 'premium_price', type: 'decimal' },   // Both 'premium' and 'price' (currency)
  { name: 'error_rate_percentage', type: 'float' }, // danger + percentage
  { name: 'subscription_cancelled_at', type: 'timestamp' } // Multiple semantics
];

complexFields.forEach(field => {
  const result = protocol.analyze(field);
  console.log(`\n${field.name}:`);
  console.log(`  Type: ${field.type}`);
  console.log(`  Matches: ${result.semantics.map(s => `${s.semantic}(${s.confidence}%)`).join(', ')}`);
  console.log(`  Winner: ${result.bestMatch?.semantic || 'none'}`);
  console.log(`  Render: ${result.renderInstruction.component}`);
});

// Example 7: TypeScript compile-time benefits
console.log("\n=== TypeScript Benefits ===");

// This would cause TypeScript compilation errors:
// const invalidField = SemanticProtocol.field('test')
//   .type('invalid_type')  // TS Error: Type '"invalid_type"' is not assignable to type 'DataType'
//   .build();

// const badContext = protocol.analyze(priceField, 'invalid'); // TS Error: not assignable to 'RenderContext'

// Type inference works perfectly:
const inferredResult = protocol.analyze({ name: 'user_email', type: 'string' });
// TypeScript knows inferredResult.bestMatch is SemanticMatch | null
// TypeScript knows inferredResult.renderInstruction.component is string

console.log("Type safety prevents errors at compile time!");

// Example 8: Integration with React components (type definitions)
console.log("\n=== React Integration (Type Definitions) ===");

// This is how you'd use it in React with full type safety:
type SemanticComponentProps = {
  field: FieldDefinition;
  context: RenderContext;
  value: any;
};

// React component would consume the semantic protocol:
function describeReactUsage() {
  const componentMap = {
    'badge': 'BadgeComponent',
    'text': 'TextComponent',
    'input': 'InputComponent',
    'toggle': 'ToggleComponent',
    'alert': 'AlertComponent',
    'progress': 'ProgressComponent',
    'link': 'LinkComponent',
    'datepicker': 'DatePickerComponent',
    'indicator': 'IndicatorComponent',
    'select': 'SelectComponent',
    'slider': 'SliderComponent'
  };

  console.log("React usage pattern:");
  console.log(`
  const SemanticField: React.FC<SemanticComponentProps> = ({ field, context, value }) => {
    const analysis = protocol.analyze(field, context);
    const { component, variant, props } = analysis.renderInstruction;
    
    // TypeScript ensures component is a valid key
    const Component = componentMap[component];
    
    return <Component variant={variant} {...props} value={value} />;
  };`);
}

describeReactUsage();

// Example 9: Custom semantic extensions
console.log("\n=== Extensibility Pattern ===");

// Show how users could extend with domain-specific semantics
class HealthcareSemanticProtocol extends SemanticProtocol {
  // In a real implementation, you'd override analyze() to add:
  // - 'diagnosis', 'symptom', 'medication', 'vital_sign', 'patient_id', etc.
}

console.log("Domain-specific extensions possible through inheritance");

// Example 10: Performance metrics
console.log("\n=== Performance ===");

const startTime = performance.now();
const largeSchema: FieldDefinition[] = Array.from({ length: 1000 }, (_, i) => ({
  name: `field_${i}_${['price', 'id', 'created_at', 'status', 'email'][i % 5]}`,
  type: ['string', 'number', 'boolean', 'timestamp', 'decimal'][i % 5] as any
}));

const largeResults = protocol.analyzeSchema(largeSchema);
const endTime = performance.now();

console.log(`Analyzed ${largeSchema.length} fields in ${(endTime - startTime).toFixed(2)}ms`);
console.log(`Average: ${((endTime - startTime) / largeSchema.length).toFixed(3)}ms per field`);

// Summary statistics
const semanticCounts = largeResults.reduce((acc, result) => {
  if (result.bestMatch) {
    acc[result.bestMatch.semantic] = (acc[result.bestMatch.semantic] || 0) + 1;
  }
  return acc;
}, {} as Record<string, number>);

console.log("\nSemantic distribution in large schema:");
Object.entries(semanticCounts).forEach(([semantic, count]) => {
  console.log(`  ${semantic}: ${count} fields`);
});