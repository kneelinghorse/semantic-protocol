/**
 * Semantic Protocol v2.0
 * Complete exports including registry and discovery
 */

// Core protocol with analysis
export * from '../semantic-protocol';

// Import TypeScript modules and re-export
import { SemanticRegistry } from './core/registry';
// DiscoveryEngine to be implemented or imported when available

// Export registry
export { SemanticRegistry };
// DiscoveryEngine will be exported when TypeScript version is ready
// export { DiscoveryEngine };

// Create a unified protocol class that includes everything
import { SemanticProtocol as BaseProtocol } from '../semantic-protocol';

export class SemanticProtocolComplete extends BaseProtocol {
  private registry: SemanticRegistry;
  // private discovery: DiscoveryEngine; // To be added when TypeScript version ready

  constructor(confidenceThreshold?: number) {
    super(confidenceThreshold);
    this.registry = new SemanticRegistry();
    // this.discovery = new DiscoveryEngine(this.registry); // To be added
  }

  // Registry methods
  register(manifest: any) {
    return this.registry.register(null, manifest);
  }

  unregister(id: string) {
    return this.registry.unregister(id);
  }

  get(id: string) {
    return this.registry.get(id);
  }

  // Discovery methods
  find(query: any) {
    return this.registry.find(query); // Using registry directly for now
  }

  query(selector: any) {
    return this.registry.query(selector); // Using registry directly for now
  }

  // Relationship methods
  getRelationships(id: string) {
    return this.registry.getRelated(id); // Using the correct method name
  }

  // These methods need to be implemented in registry or removed
  // addRelationship(sourceId: string, targetId: string, type: string) {
  //   return this.registry.addRelationship(sourceId, targetId, type);
  // }

  // removeRelationship(sourceId: string, targetId: string) {
  //   return this.registry.removeRelationship(sourceId, targetId);
  // }

  // Validation (using existing validation if it exists)
  validateManifest(manifest: any) {
    // Basic validation for now
    if (!manifest || !manifest.id) {
      return { valid: false, errors: ['Missing required field: id'] };
    }
    if (!manifest.element || !manifest.element.type) {
      return { valid: false, errors: ['Missing required field: element.type'] };
    }
    return { valid: true, errors: [] };
  }
}

// Export the complete protocol as the default
export { SemanticProtocolComplete as SemanticProtocol };