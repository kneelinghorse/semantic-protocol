/**
 * Semantic Protocol v2.0
 * Main entry point with full functionality
 */

// Export base types from semantic-protocol.ts
export {
  SemanticType,
  RenderContext,
  DataType,
  SemanticMatch,
  RenderInstruction,
  AnalysisResult,
  SemanticResult,
  FieldDefinition,
  SemanticRules
} from './semantic-protocol';

// Import the base protocol and registry
import { SemanticProtocol as BaseProtocol } from './semantic-protocol';
import { SemanticRegistry, ComponentEntry } from './src/core/registry';

// Re-export ComponentEntry for type usage
export type { ComponentEntry } from './src/core/registry';

// Create enhanced protocol class with registry support
export class SemanticProtocol extends BaseProtocol {
  private registry: SemanticRegistry;
  
  constructor(confidenceThreshold?: number) {
    super(confidenceThreshold);
    this.registry = new SemanticRegistry();
  }

  // Registry methods
  register(manifest: any) {
    return this.registry.register(null, manifest);
  }

  unregister(id: string) {
    return this.registry.unregister(id);
  }

  get(id: string): ComponentEntry | null {
    return this.registry.get(id) || null;
  }

  // Discovery methods
  find(query: any): ComponentEntry[] {
    return this.registry.find(query);
  }

  query(selector: any): ComponentEntry[] {
    return this.registry.query(selector);
  }

  // Relationship methods
  getRelationships(id: string): ComponentEntry[] {
    return this.registry.getRelated(id);
  }

  getRelated(id: string, type?: string): ComponentEntry[] {
    return this.registry.getRelated(id, type);
  }

  // Validation
  validateManifest(manifest: any) {
    if (!manifest || !manifest.id) {
      return { valid: false, errors: ['Missing required field: id'] };
    }
    if (!manifest.element || !manifest.element.type) {
      return { valid: false, errors: ['Missing required field: element.type'] };
    }
    return { valid: true, errors: [] };
  }
}

// Export SemanticManifest type for compatibility
export interface SemanticManifest {
  id: string;
  element: {
    type: string;
    intent?: string;
    label?: string;
    criticality?: string;
  };
  context?: any;
  relationships?: {
    parent?: string;
    children?: string[];
    dependencies?: string[];
    validators?: string[];
    handlers?: string[];
  };
  validation?: any;
  metadata?: any;
}

// Export RelationshipType for compatibility
export type RelationshipType = 
  | 'parent-child'
  | 'dependency'
  | 'validation'
  | 'handler'
  | 'observer';

// Export a default instance for convenience
export default new SemanticProtocol();