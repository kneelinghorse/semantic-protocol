import { generatorHandler, GeneratorOptions, DMMF } from '@prisma/generator-helper';
import { analyze } from '@kneelinghorse/semantic-protocol';
import * as fs from 'fs/promises';
import * as path from 'path';

const GENERATOR_NAME = 'prisma-semantic-generator';

export const handler = generatorHandler({
  onManifest() {
    return {
      name: GENERATOR_NAME,
      prettyName: 'Prisma Semantic Generator',
      defaultOutput: './generated/semantic',
      requiresGenerators: ['prisma-client-js']
    };
  },
  
  async onGenerate(options: GeneratorOptions) {
    const outputDir = options.generator.output?.value || './generated/semantic';
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Parse datamodel
    const datamodel = JSON.parse(JSON.stringify(options.dmmf.datamodel)) as DMMF.Datamodel;
    
    // Analyze each model
    const semanticMappings: Record<string, any> = {};
    
    for (const model of datamodel.models) {
      const modelSemantics: Record<string, any> = {};
      
      for (const field of model.fields) {
        // Convert Prisma type to semantic protocol type
        const fieldType = mapPrismaTypeToSemanticType(field.type);
        
        // Analyze the field
        const result = analyze(field.name, fieldType, {
          description: field.documentation
        });
        
        modelSemantics[field.name] = {
          semantic: result.bestMatch?.semantic || 'unknown',
          confidence: result.metadata.confidence,
          renderInstruction: result.renderInstruction,
          isRequired: field.isRequired,
          isList: field.isList,
          isId: field.isId,
          isUnique: field.isUnique,
          hasDefault: field.hasDefaultValue,
          documentation: field.documentation
        };
      }
      
      semanticMappings[model.name] = modelSemantics;
    }
    
    // Generate TypeScript file
    const tsContent = generateTypeScriptOutput(semanticMappings);
    await fs.writeFile(path.join(outputDir, 'index.ts'), tsContent);
    
    // Generate JSON file
    const jsonContent = JSON.stringify(semanticMappings, null, 2);
    await fs.writeFile(path.join(outputDir, 'semantics.json'), jsonContent);
    
    console.log(`✅ Semantic mappings generated at ${outputDir}`);
  }
});

function mapPrismaTypeToSemanticType(prismaType: string): string {
  const typeMap: Record<string, string> = {
    'String': 'string',
    'Int': 'integer',
    'Float': 'float',
    'Decimal': 'decimal',
    'Boolean': 'boolean',
    'DateTime': 'datetime',
    'Json': 'object',
    'Bytes': 'string',
    'BigInt': 'integer'
  };
  
  return typeMap[prismaType] || 'string';
}

function generateTypeScriptOutput(
  semanticMappings: Record<string, any>
): string {
  const imports = `import type { SemanticType, RenderContext } from '@kneelinghorse/semantic-protocol';

`;

  const modelInterfaces = Object.entries(semanticMappings).map(([modelName, fields]) => {
    const fieldTypes = Object.entries(fields as Record<string, any>).map(([fieldName, semantic]) => {
      return `    ${fieldName}: {
      semantic: '${semantic.semantic}' as SemanticType;
      confidence: ${semantic.confidence};
      renderInstruction: ${JSON.stringify(semantic.renderInstruction)};
      isRequired: ${semantic.isRequired};
      isList: ${semantic.isList};
      isId: ${semantic.isId};
      isUnique: ${semantic.isUnique};
      hasDefault: ${semantic.hasDefault};${semantic.documentation ? `
      documentation: "${semantic.documentation}";` : ''}
    };`;
    }).join('\n');
    
    return `export interface ${modelName}Semantics {
${fieldTypes}
}`;
  }).join('\n\n');

  const semanticExports = Object.keys(semanticMappings).map(modelName => {
    return `export const ${modelName}Semantics: ${modelName}Semantics = semantics.${modelName};`;
  }).join('\n');

  const fullSemantics = `
const semantics = ${JSON.stringify(semanticMappings, null, 2)} as const;

${semanticExports}

export default semantics;
`;

  const utilityFunctions = `
// Utility functions
export function getFieldSemantic(modelName: string, fieldName: string): any {
  return (semantics as any)[modelName]?.[fieldName];
}

export function getHighConfidenceFields(modelName: string, threshold = 90): string[] {
  const modelSemantics = (semantics as any)[modelName];
  if (!modelSemantics) return [];
  
  return Object.entries(modelSemantics)
    .filter(([_, semantic]: [string, any]) => semantic.confidence >= threshold)
    .map(([fieldName]) => fieldName);
}

export function getFieldsBySemanticType(modelName: string, semanticType: SemanticType): string[] {
  const modelSemantics = (semantics as any)[modelName];
  if (!modelSemantics) return [];
  
  return Object.entries(modelSemantics)
    .filter(([_, semantic]: [string, any]) => semantic.semantic === semanticType)
    .map(([fieldName]) => fieldName);
}

export function getRenderInstruction(
  modelName: string, 
  fieldName: string, 
  context?: RenderContext
): any {
  const field = getFieldSemantic(modelName, fieldName);
  if (!field) return null;
  
  // If context is provided, re-analyze with that context
  if (context) {
    const { analyze } = require('@kneelinghorse/semantic-protocol');
    const result = analyze(fieldName, 'string', { context });
    return result.renderInstruction;
  }
  
  return field.renderInstruction;
}
`;

  return imports + modelInterfaces + fullSemantics + utilityFunctions;
}