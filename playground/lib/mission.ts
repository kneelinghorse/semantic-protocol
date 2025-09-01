/**
 * Mission Protocol - Semantic Understanding for AI Code Missions
 * 
 * Just like Semantic Protocol understands data fields,
 * Mission Protocol understands coding missions!
 */

export type MissionType = 
  | 'npm_package'
  | 'api_integration'
  | 'cli_tool'
  | 'web_app'
  | 'data_pipeline'
  | 'ui_component'
  | 'database_schema'
  | 'deployment_config'
  | 'test_suite'
  | 'documentation';

export interface MissionSemantics {
  type: MissionType;
  confidence: number;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: string;
  patterns: string[];
  deliverables: string[];
}

export class MissionProtocol {
  private patterns = {
    npm_package: {
      keywords: ['npm', 'package', 'publish', 'library', 'module', 'dist'],
      signals: ['typescript', 'build', 'bundle', 'dependencies'],
      deliverables: ['package.json', 'dist/', 'README.md', 'npm publish'],
      complexity: 'moderate' as const,
      estimatedTime: '2-4 hours'
    },
    api_integration: {
      keywords: ['api', 'integrate', 'webhook', 'rest', 'graphql', 'fetch'],
      signals: ['auth', 'token', 'rate limit', 'retry', 'error handling'],
      deliverables: ['client.ts', 'types.ts', 'error-handling', 'tests'],
      complexity: 'moderate' as const,
      estimatedTime: '3-6 hours'
    },
    cli_tool: {
      keywords: ['cli', 'command', 'terminal', 'console', 'script'],
      signals: ['args', 'flags', 'commander', 'yargs', 'stdin', 'stdout'],
      deliverables: ['bin/', 'cli.js', 'help text', 'npm link'],
      complexity: 'simple' as const,
      estimatedTime: '1-3 hours'
    },
    web_app: {
      keywords: ['app', 'website', 'frontend', 'react', 'next', 'vue'],
      signals: ['components', 'pages', 'routing', 'state', 'ui'],
      deliverables: ['pages/', 'components/', 'styles/', 'deploy'],
      complexity: 'complex' as const,
      estimatedTime: '1-3 days'
    },
    data_pipeline: {
      keywords: ['data', 'transform', 'pipeline', 'etl', 'process', 'batch'],
      signals: ['parse', 'validate', 'transform', 'aggregate', 'export'],
      deliverables: ['processor.ts', 'validators/', 'transformers/', 'output/'],
      complexity: 'moderate' as const,
      estimatedTime: '2-4 hours'
    },
    ui_component: {
      keywords: ['component', 'ui', 'button', 'form', 'modal', 'widget'],
      signals: ['props', 'state', 'style', 'event', 'render'],
      deliverables: ['Component.tsx', 'Component.stories.tsx', 'Component.test.tsx'],
      complexity: 'simple' as const,
      estimatedTime: '30m-2 hours'
    },
    database_schema: {
      keywords: ['database', 'schema', 'model', 'migration', 'prisma', 'sql'],
      signals: ['table', 'column', 'relation', 'index', 'constraint', 'foreign key'],
      deliverables: ['schema.prisma', 'migrations/', 'seed.ts', 'types.ts'],
      complexity: 'moderate' as const,
      estimatedTime: '2-4 hours'
    },
    deployment_config: {
      keywords: ['deploy', 'ci', 'cd', 'docker', 'kubernetes', 'vercel', 'aws'],
      signals: ['pipeline', 'container', 'environment', 'config', 'yaml', 'helm'],
      deliverables: ['Dockerfile', '.github/workflows/', 'docker-compose.yml', 'deploy.sh'],
      complexity: 'complex' as const,
      estimatedTime: '3-6 hours'
    },
    test_suite: {
      keywords: ['test', 'testing', 'jest', 'vitest', 'cypress', 'playwright'],
      signals: ['unit', 'integration', 'e2e', 'coverage', 'mock', 'assert'],
      deliverables: ['*.test.ts', '*.spec.ts', 'test/', '__tests__/', 'coverage/'],
      complexity: 'moderate' as const,
      estimatedTime: '2-5 hours'
    },
    documentation: {
      keywords: ['docs', 'documentation', 'readme', 'api docs', 'guide', 'tutorial'],
      signals: ['markdown', 'jsdoc', 'swagger', 'openapi', 'examples', 'usage'],
      deliverables: ['README.md', 'docs/', 'API.md', 'CONTRIBUTING.md'],
      complexity: 'simple' as const,
      estimatedTime: '1-3 hours'
    }
  };

  analyze(request: string): MissionSemantics {
    const requestLower = request.toLowerCase();
    let bestMatch: { type: MissionType; score: number } | null = null;
    let maxScore = 0;

    // Check each mission type
    for (const [type, pattern] of Object.entries(this.patterns)) {
      let score = 0;
      
      // Check keywords (high weight) - bonus for exact word match
      for (const keyword of pattern.keywords) {
        // Exact word boundary match gets highest score
        const wordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (wordRegex.test(request)) {
          score += 15;
        } else if (requestLower.includes(keyword)) {
          // Partial match gets lower score
          score += 5;
        }
      }
      
      // Check signals (medium weight)
      for (const signal of pattern.signals) {
        if (requestLower.includes(signal)) {
          score += 5;
        }
      }
      
      // Special boost for primary intent words at the beginning
      const primaryIntentWords = {
        'write': ['test_suite', 'documentation'],
        'create': ['cli_tool', 'ui_component', 'documentation'],
        'build': ['npm_package', 'web_app', 'ui_component'],
        'design': ['database_schema', 'ui_component'],
        'deploy': ['deployment_config'],
        'integrate': ['api_integration'],
        'document': ['documentation'],
        'test': ['test_suite']
      };
      
      for (const [intentWord, types] of Object.entries(primaryIntentWords)) {
        if (requestLower.startsWith(intentWord) && types.includes(type)) {
          score += 10;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = { type: type as MissionType, score };
      }
    }

    if (!bestMatch) {
      return {
        type: 'documentation', // default fallback
        confidence: 0,
        complexity: 'simple',
        estimatedTime: 'unknown',
        patterns: [],
        deliverables: []
      };
    }

    const pattern = this.patterns[bestMatch.type];
    const confidence = Math.min(95, bestMatch.score * 5);

    return {
      type: bestMatch.type,
      confidence,
      complexity: pattern.complexity,
      estimatedTime: pattern.estimatedTime,
      patterns: pattern.signals,
      deliverables: pattern.deliverables
    };
  }

  generatePlan(semantics: MissionSemantics): string {
    const plan = [];
    
    plan.push(`## Mission Type: ${semantics.type}`);
    plan.push(`Confidence: ${semantics.confidence}%`);
    plan.push(`Complexity: ${semantics.complexity}`);
    plan.push(`Estimated Time: ${semantics.estimatedTime}`);
    plan.push('');
    plan.push('### Identified Patterns:');
    semantics.patterns.forEach(p => plan.push(`- ${p}`));
    plan.push('');
    plan.push('### Expected Deliverables:');
    semantics.deliverables.forEach(d => plan.push(`- ${d}`));
    plan.push('');
    plan.push('### Execution Strategy:');
    
    switch(semantics.type) {
      case 'npm_package':
        plan.push('1. Initialize package.json with proper metadata');
        plan.push('2. Set up TypeScript configuration');
        plan.push('3. Create source files with exports');
        plan.push('4. Add build pipeline');
        plan.push('5. Write comprehensive README');
        plan.push('6. Test locally with npm link');
        plan.push('7. Publish to npm');
        break;
      
      case 'api_integration':
        plan.push('1. Research API documentation');
        plan.push('2. Set up authentication handling');
        plan.push('3. Create type definitions');
        plan.push('4. Implement core client methods');
        plan.push('5. Add error handling and retries');
        plan.push('6. Write integration tests');
        plan.push('7. Document usage examples');
        break;
      
      case 'cli_tool':
        plan.push('1. Set up command structure');
        plan.push('2. Parse arguments and flags');
        plan.push('3. Implement core functionality');
        plan.push('4. Add help text and examples');
        plan.push('5. Handle errors gracefully');
        plan.push('6. Make it executable');
        plan.push('7. Test command variations');
        break;
      
      case 'web_app':
        plan.push('1. Set up project structure (pages, components, styles)');
        plan.push('2. Configure routing and navigation');
        plan.push('3. Implement core UI components');
        plan.push('4. Add state management');
        plan.push('5. Connect to backend/APIs');
        plan.push('6. Optimize performance');
        plan.push('7. Deploy to hosting platform');
        break;
      
      case 'data_pipeline':
        plan.push('1. Define data schema and validation rules');
        plan.push('2. Create input parsers');
        plan.push('3. Implement transformation logic');
        plan.push('4. Add data validation and error handling');
        plan.push('5. Set up output formatters');
        plan.push('6. Create batch processing capability');
        plan.push('7. Add monitoring and logging');
        break;
      
      case 'ui_component':
        plan.push('1. Define component props interface');
        plan.push('2. Build component structure');
        plan.push('3. Add styling and themes');
        plan.push('4. Implement event handlers');
        plan.push('5. Write Storybook stories');
        plan.push('6. Add unit tests');
        plan.push('7. Document usage examples');
        break;
      
      case 'database_schema':
        plan.push('1. Design entity relationships');
        plan.push('2. Define tables and columns');
        plan.push('3. Add indexes and constraints');
        plan.push('4. Create migration files');
        plan.push('5. Set up seed data');
        plan.push('6. Generate TypeScript types');
        plan.push('7. Test database operations');
        break;
      
      case 'deployment_config':
        plan.push('1. Choose deployment platform');
        plan.push('2. Create Dockerfile or build config');
        plan.push('3. Set up CI/CD pipeline');
        plan.push('4. Configure environment variables');
        plan.push('5. Add health checks and monitoring');
        plan.push('6. Set up rollback strategy');
        plan.push('7. Document deployment process');
        break;
      
      case 'test_suite':
        plan.push('1. Set up test framework and config');
        plan.push('2. Write unit tests for functions');
        plan.push('3. Add integration tests');
        plan.push('4. Create E2E test scenarios');
        plan.push('5. Set up test data and mocks');
        plan.push('6. Configure coverage reporting');
        plan.push('7. Add to CI pipeline');
        break;
      
      case 'documentation':
        plan.push('1. Create README with overview');
        plan.push('2. Add installation instructions');
        plan.push('3. Write API documentation');
        plan.push('4. Create usage examples');
        plan.push('5. Add troubleshooting guide');
        plan.push('6. Include contribution guidelines');
        plan.push('7. Generate API reference docs');
        break;
      
      default:
        plan.push('1. Analyze requirements');
        plan.push('2. Create file structure');
        plan.push('3. Implement core features');
        plan.push('4. Add tests');
        plan.push('5. Document');
        break;
    }
    
    return plan.join('\n');
  }
}

// Example usage
export function analyzeMission(request: string) {
  const protocol = new MissionProtocol();
  const semantics = protocol.analyze(request);
  const plan = protocol.generatePlan(semantics);
  
  return {
    semantics,
    plan
  };
}

// Example usage (commented for production)
/*
const examples = [
  "I need to build an npm package for semantic analysis",
  "Help me integrate with the Stripe API",
  "Create a CLI tool for file processing",
  "Build a React component library",
  "Set up a data transformation pipeline",
  "Design a database schema for an e-commerce platform",
  "Deploy my app to AWS with Docker",
  "Write comprehensive tests for my authentication module",
  "Create documentation for my REST API"
];

console.log('🚀 Mission Protocol Analysis - Enhanced Version\n');
console.log('=' .repeat(60));
examples.forEach(request => {
  console.log(`\n📝 Request: "${request}"`);
  const result = analyzeMission(request);
  console.log(`   Type: ${result.semantics.type}`);
  console.log(`   Confidence: ${result.semantics.confidence}%`);
  console.log(`   Complexity: ${result.semantics.complexity}`);
  console.log(`   Time: ${result.semantics.estimatedTime}`);
  
  if (result.semantics.confidence > 50) {
    console.log(`   ✅ High confidence - ready to execute!`);
  } else {
    console.log(`   ⚠️  Low confidence - may need clarification`);
  }
});
*/