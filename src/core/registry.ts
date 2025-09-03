/**
 * Semantic Registry v2.0
 * Component discovery and relationship management
 */

export interface SemanticManifest {
  id: string;
  element: {
    type: string;
    intent?: string;
    label?: string;
    criticality?: string;
  };
  context?: {
    flow?: string;
    [key: string]: any;
  };
  semantics?: {
    category?: string;
    [key: string]: any;
  };
  relationships?: {
    parent?: string;
    children?: string[];
    dependencies?: string[];
    validators?: string[];
    handlers?: string[];
    observers?: string[];
  };
  validation?: any;
  metadata?: {
    description?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface ComponentEntry {
  component: any;
  manifest: SemanticManifest;
  registered: number;
}

interface QueryOperator {
  operator: 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'in';
  value: any;
}

interface QueryValue {
  [key: string]: any | QueryOperator;
}

export class SemanticRegistry {
  private components: Map<string, ComponentEntry>;
  private indexes: {
    byType: Map<string, Set<string>>;
    byIntent: Map<string, Set<string>>;
    byCategory: Map<string, Set<string>>;
    byFlow: Map<string, Set<string>>;
    byTag: Map<string, Set<string>>;
  };
  private queryCache: Map<string, ComponentEntry[]>;
  private maxCacheSize: number;

  constructor() {
    this.components = new Map();
    this.indexes = {
      byType: new Map(),
      byIntent: new Map(),
      byCategory: new Map(),
      byFlow: new Map(),
      byTag: new Map()
    };
    this.queryCache = new Map();
    this.maxCacheSize = 1000;
  }

  /**
   * Register a component with its manifest
   */
  register(component: any, manifest: SemanticManifest): string {
    // Validate manifest
    if (!manifest || !manifest.id) {
      throw new Error('Invalid manifest: missing ID');
    }

    // Store component
    this.components.set(manifest.id, {
      component,
      manifest,
      registered: Date.now()
    });

    // Update indexes for fast lookup
    this._updateIndexes(manifest);

    // Broadcast registration event
    this._broadcast('component:registered', { manifest });

    return manifest.id;
  }

  /**
   * Unregister a component
   */
  unregister(componentId: string): boolean {
    const entry = this.components.get(componentId);
    if (!entry) return false;

    // Remove from indexes
    this._removeFromIndexes(entry.manifest);

    // Remove component
    this.components.delete(componentId);

    // Clear related cache entries
    this._clearCache(componentId);

    // Broadcast unregistration
    this._broadcast('component:unregistered', { id: componentId });

    return true;
  }

  /**
   * Find components by semantic query
   */
  find(query: QueryValue): ComponentEntry[] {
    // Check cache first
    const cacheKey = JSON.stringify(query);
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    const results: ComponentEntry[] = [];
    
    // Use indexes for efficient lookup
    if (query.type && this.indexes.byType.has(query.type as string)) {
      const candidates = this.indexes.byType.get(query.type as string)!;
      results.push(...this._filterByQuery(candidates, query));
    } else if (query.intent && this.indexes.byIntent.has(query.intent as string)) {
      const candidates = this.indexes.byIntent.get(query.intent as string)!;
      results.push(...this._filterByQuery(candidates, query));
    } else if (query.category && this.indexes.byCategory.has(query.category as string)) {
      const candidates = this.indexes.byCategory.get(query.category as string)!;
      results.push(...this._filterByQuery(candidates, query));
    } else {
      // Full scan if no index matches
      for (const [, entry] of this.components) {
        if (this._matchesQuery(entry.manifest, query)) {
          results.push(entry);
        }
      }
    }

    // Cache the result
    this._cacheResult(cacheKey, results);

    return results;
  }

  /**
   * Find a single component
   */
  findOne(query: QueryValue): ComponentEntry | null {
    const results = this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get component by ID
   */
  get(componentId: string): ComponentEntry | undefined {
    return this.components.get(componentId);
  }

  /**
   * Get all components
   */
  getAll(): ComponentEntry[] {
    return Array.from(this.components.values());
  }

  /**
   * Query components using semantic selector syntax
   */
  query(selector: string): ComponentEntry[] {
    const ast = this._parseSelector(selector);
    return this._executeQuery(ast);
  }

  /**
   * Get components related to another component
   */
  getRelated(componentId: string, relationshipType: string = 'all'): ComponentEntry[] {
    const entry = this.components.get(componentId);
    if (!entry) return [];

    const related: ComponentEntry[] = [];
    const manifest = entry.manifest;

    switch (relationshipType) {
      case 'parent':
        if (manifest.relationships?.parent) {
          const parent = this.components.get(manifest.relationships.parent);
          if (parent) related.push(parent);
        }
        break;

      case 'children':
        for (const childId of manifest.relationships?.children || []) {
          const child = this.components.get(childId);
          if (child) related.push(child);
        }
        break;

      case 'siblings':
        if (manifest.relationships?.parent) {
          const parent = this.components.get(manifest.relationships.parent);
          if (parent) {
            for (const siblingId of parent.manifest.relationships?.children || []) {
              if (siblingId !== componentId) {
                const sibling = this.components.get(siblingId);
                if (sibling) related.push(sibling);
              }
            }
          }
        }
        break;

      case 'dependencies':
        for (const depId of manifest.relationships?.dependencies || []) {
          const dep = this.components.get(depId);
          if (dep) related.push(dep);
        }
        break;

      case 'observers':
        for (const observerId of manifest.relationships?.observers || []) {
          const observer = this.components.get(observerId);
          if (observer) related.push(observer);
        }
        break;

      case 'all':
        // Get all related components
        related.push(...this.getRelated(componentId, 'parent'));
        related.push(...this.getRelated(componentId, 'children'));
        related.push(...this.getRelated(componentId, 'siblings'));
        related.push(...this.getRelated(componentId, 'dependencies'));
        related.push(...this.getRelated(componentId, 'observers'));
        break;
    }

    return related;
  }

  /**
   * Build a relationship graph
   */
  buildGraph(rootId: string | null = null) {
    const graph = {
      nodes: [] as any[],
      edges: [] as any[]
    };

    const processedIds = new Set<string>();

    const addNode = (entry: ComponentEntry) => {
      if (processedIds.has(entry.manifest.id)) return;
      processedIds.add(entry.manifest.id);

      graph.nodes.push({
        id: entry.manifest.id,
        type: entry.manifest.element.type,
        label: entry.manifest.metadata?.description || entry.manifest.element.type,
        data: entry.manifest
      });

      // Add edges for relationships
      const manifest = entry.manifest;
      
      if (manifest.relationships?.parent) {
        graph.edges.push({
          from: entry.manifest.id,
          to: manifest.relationships.parent,
          type: 'parent'
        });
      }

      for (const childId of manifest.relationships?.children || []) {
        graph.edges.push({
          from: entry.manifest.id,
          to: childId,
          type: 'child'
        });
      }

      for (const depId of manifest.relationships?.dependencies || []) {
        graph.edges.push({
          from: entry.manifest.id,
          to: depId,
          type: 'dependency'
        });
      }
    };

    if (rootId) {
      // Build graph from specific root
      const root = this.components.get(rootId);
      if (root) {
        const traverse = (entry: ComponentEntry) => {
          addNode(entry);
          for (const related of this.getRelated(entry.manifest.id, 'all')) {
            if (!processedIds.has(related.manifest.id)) {
              traverse(related);
            }
          }
        };
        traverse(root);
      }
    } else {
      // Build complete graph
      for (const entry of this.components.values()) {
        addNode(entry);
      }
    }

    return graph;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const stats = {
      totalComponents: this.components.size,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byIntent: {} as Record<string, number>,
      relationships: {
        parent_child: 0,
        dependencies: 0,
        observers: 0
      },
      cacheSize: this.queryCache.size
    };

    // Count by type
    for (const [type, ids] of this.indexes.byType) {
      stats.byType[type] = ids.size;
    }

    // Count by category
    for (const [category, ids] of this.indexes.byCategory) {
      stats.byCategory[category] = ids.size;
    }

    // Count by intent
    for (const [intent, ids] of this.indexes.byIntent) {
      stats.byIntent[intent] = ids.size;
    }

    // Count relationships
    for (const entry of this.components.values()) {
      const manifest = entry.manifest;
      if (manifest.relationships?.parent) stats.relationships.parent_child++;
      stats.relationships.dependencies += (manifest.relationships?.dependencies || []).length;
      stats.relationships.observers += (manifest.relationships?.observers || []).length;
    }

    return stats;
  }

  // Private helper methods

  private _updateIndexes(manifest: SemanticManifest): void {
    // Index by type
    if (manifest.element?.type) {
      if (!this.indexes.byType.has(manifest.element.type)) {
        this.indexes.byType.set(manifest.element.type, new Set());
      }
      this.indexes.byType.get(manifest.element.type)!.add(manifest.id);
    }

    // Index by intent
    if (manifest.element?.intent) {
      if (!this.indexes.byIntent.has(manifest.element.intent)) {
        this.indexes.byIntent.set(manifest.element.intent, new Set());
      }
      this.indexes.byIntent.get(manifest.element.intent)!.add(manifest.id);
    }

    // Index by category
    if (manifest.semantics?.category) {
      if (!this.indexes.byCategory.has(manifest.semantics.category)) {
        this.indexes.byCategory.set(manifest.semantics.category, new Set());
      }
      this.indexes.byCategory.get(manifest.semantics.category)!.add(manifest.id);
    }

    // Index by flow
    if (manifest.context?.flow) {
      if (!this.indexes.byFlow.has(manifest.context.flow)) {
        this.indexes.byFlow.set(manifest.context.flow, new Set());
      }
      this.indexes.byFlow.get(manifest.context.flow)!.add(manifest.id);
    }

    // Index by tags
    for (const tag of manifest.metadata?.tags || []) {
      if (!this.indexes.byTag.has(tag)) {
        this.indexes.byTag.set(tag, new Set());
      }
      this.indexes.byTag.get(tag)!.add(manifest.id);
    }
  }

  private _removeFromIndexes(manifest: SemanticManifest): void {
    // Remove from all indexes
    if (manifest.element?.type) {
      this.indexes.byType.get(manifest.element.type)?.delete(manifest.id);
    }
    if (manifest.element?.intent) {
      this.indexes.byIntent.get(manifest.element.intent)?.delete(manifest.id);
    }
    if (manifest.semantics?.category) {
      this.indexes.byCategory.get(manifest.semantics.category)?.delete(manifest.id);
    }
    if (manifest.context?.flow) {
      this.indexes.byFlow.get(manifest.context.flow)?.delete(manifest.id);
    }
    for (const tag of manifest.metadata?.tags || []) {
      this.indexes.byTag.get(tag)?.delete(manifest.id);
    }
  }

  private _filterByQuery(candidateIds: Set<string>, query: QueryValue): ComponentEntry[] {
    const results: ComponentEntry[] = [];
    for (const id of candidateIds) {
      const entry = this.components.get(id);
      if (entry && this._matchesQuery(entry.manifest, query)) {
        results.push(entry);
      }
    }
    return results;
  }

  private _matchesQuery(manifest: SemanticManifest, query: QueryValue): boolean {
    for (const [key, value] of Object.entries(query)) {
      const manifestValue = this._getNestedValue(manifest, key);
      
      // Support different matching operators
      if (typeof value === 'object' && value !== null && 'operator' in value) {
        const op = value as QueryOperator;
        switch (op.operator) {
          case 'contains':
            if (!manifestValue?.includes(op.value)) return false;
            break;
          case 'startsWith':
            if (!manifestValue?.startsWith(op.value)) return false;
            break;
          case 'endsWith':
            if (!manifestValue?.endsWith(op.value)) return false;
            break;
          case 'gt':
            if (!(manifestValue > op.value)) return false;
            break;
          case 'lt':
            if (!(manifestValue < op.value)) return false;
            break;
          case 'in':
            if (!op.value.includes(manifestValue)) return false;
            break;
          default:
            if (manifestValue !== op.value) return false;
        }
      } else {
        // Exact match
        if (manifestValue !== value) return false;
      }
    }
    return true;
  }

  private _getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private _cacheResult(key: string, result: ComponentEntry[]): void {
    // LRU cache implementation
    if (this.queryCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey !== undefined) {
        this.queryCache.delete(firstKey);
      }
    }
    this.queryCache.set(key, result);
  }

  private _clearCache(componentId: string | null = null): void {
    if (componentId) {
      // Clear cache entries related to this component
      for (const [key, results] of this.queryCache) {
        if (results.some(r => r.manifest.id === componentId)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      // Clear entire cache
      this.queryCache.clear();
    }
  }

  private _parseSelector(selector: string): any {
    // Simple selector parser (can be enhanced)
    return {
      type: 'selector',
      value: selector,
      parts: selector.split(' ').map(part => ({
        type: 'simple',
        value: part
      }))
    };
  }

  private _executeQuery(ast: any): ComponentEntry[] {
    // Execute parsed query
    const results: ComponentEntry[] = [];
    
    for (const part of ast.parts) {
      // Parse each part and find matching components
      const matches = this._findBySimpleSelector(part.value);
      results.push(...matches);
    }
    
    return results;
  }

  private _findBySimpleSelector(selector: string): ComponentEntry[] {
    // Parse simple selector like "button[type=submit]"
    const match = selector.match(/^([^\[]+)(?:\[([^\]]+)\])?$/);
    if (!match) return [];
    
    const [, type, attributes] = match;
    const query: QueryValue = { 'element.type': type };
    
    if (attributes) {
      const [key, value] = attributes.split('=');
      query[key] = value.replace(/["']/g, '');
    }
    
    return this.find(query);
  }

  private _broadcast(event: string, data: any): void {
    // Emit event for observers
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const customEvent = new CustomEvent(`semantic:${event}`, { detail: data });
      window.dispatchEvent(customEvent);
    }
  }
}

export default SemanticRegistry;