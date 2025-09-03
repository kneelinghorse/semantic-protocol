import { SemanticElement } from '../base/SemanticElement';
import { SemanticProtocol, SemanticManifest } from '@semantic-protocol/core';

interface RegisteredComponent {
  id: string;
  element: HTMLElement;
  manifest: SemanticManifest;
  timestamp: number;
}

export class SemanticProvider extends SemanticElement {
  static get observedAttributes() {
    return ['debug', 'auto-discover', 'validation-mode'];
  }

  private registry: Map<string, RegisteredComponent> = new Map();
  private discoveryCache: Map<string, RegisteredComponent[]> = new Map();
  private relationships: Map<string, Set<string>> = new Map();

  constructor() {
    super({
      useShadow: true,
      autoRegister: false,
      validateOnConnect: false
    });
  }

  getManifest(): SemanticManifest {
    return {
      protocol: 'semantic-ui/v2',
      element: {
        type: 'container',
        intent: 'provide-semantic-context',
        label: 'Semantic Provider'
      },
      context: {
        flow: 'initialization',
        step: 0
      },
      metadata: {
        version: '2.0.0',
        created: new Date().toISOString(),
        tags: ['provider', 'context', 'registry']
      }
    };
  }

  render(): string {
    const debug = this.hasAttribute('debug');
    const componentCount = this.registry.size;
    const relationshipCount = this.relationships.size;

    return `
      <div class="semantic-provider">
        <slot></slot>
        ${debug ? `
          <div class="debug-panel">
            <h3>Semantic Provider Debug</h3>
            <div class="stats">
              <div class="stat">
                <span class="label">Components:</span>
                <span class="value">${componentCount}</span>
              </div>
              <div class="stat">
                <span class="label">Relationships:</span>
                <span class="value">${relationshipCount}</span>
              </div>
              <div class="stat">
                <span class="label">Cache Size:</span>
                <span class="value">${this.discoveryCache.size}</span>
              </div>
            </div>
            <div class="actions">
              <button data-action="clearCache">Clear Cache</button>
              <button data-action="exportRegistry">Export Registry</button>
              <button data-action="validateAll">Validate All</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  defaultStyles(): string {
    return `
      ${super.defaultStyles()}
      
      .semantic-provider {
        position: relative;
        min-height: 100%;
      }
      
      .debug-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border: 2px solid #2196F3;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
      }
      
      .debug-panel h3 {
        margin: 0 0 12px 0;
        color: #2196F3;
        font-size: 16px;
      }
      
      .stats {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .stat {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
      }
      
      .stat .label {
        color: #666;
      }
      
      .stat .value {
        font-weight: bold;
        color: #333;
      }
      
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .actions button {
        padding: 6px 12px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
      }
      
      .actions button:hover {
        background: #1976D2;
      }
    `;
  }

  onConnected(): void {
    this.setupGlobalRegistry();
    this.setupEventListeners();
    
    if (this.hasAttribute('auto-discover')) {
      this.performAutoDiscovery();
    }
  }

  onDisconnected(): void {
    this.cleanupGlobalRegistry();
  }

  private setupGlobalRegistry(): void {
    (window as any).__SEMANTIC_PROVIDER__ = this;
    (window as any).__SEMANTIC_REGISTRY__ = this.registry;
  }

  private cleanupGlobalRegistry(): void {
    delete (window as any).__SEMANTIC_PROVIDER__;
    delete (window as any).__SEMANTIC_REGISTRY__;
  }

  private setupEventListeners(): void {
    this.addEventListener('semantic-register', this.handleRegister.bind(this));
    this.addEventListener('semantic-unregister', this.handleUnregister.bind(this));
    this.addEventListener('semantic-discover', this.handleDiscover.bind(this));
    this.addEventListener('semantic-relate', this.handleRelate.bind(this));
  }

  private handleRegister(event: CustomEvent): void {
    event.stopPropagation();
    
    const { element, manifest } = event.detail;
    if (!element || !manifest) return;

    const id = element.getAttribute('data-semantic-id') || this.generateId();
    
    this.registry.set(id, {
      id,
      element,
      manifest,
      timestamp: Date.now()
    });

    this.clearDiscoveryCache();
    this.updateContent();
    
    this.emit('semantic-registered', { id, manifest });
  }

  private handleUnregister(event: CustomEvent): void {
    event.stopPropagation();
    
    const { elementId } = event.detail;
    if (!elementId) return;

    this.registry.delete(elementId);
    this.relationships.delete(elementId);
    
    this.relationships.forEach(related => {
      related.delete(elementId);
    });

    this.clearDiscoveryCache();
    this.updateContent();
    
    this.emit('semantic-unregistered', { elementId });
  }

  private handleDiscover(event: CustomEvent): void {
    event.stopPropagation();
    
    const { query, callback } = event.detail;
    if (!query) return;

    const results = this.discover(query);
    
    if (callback && typeof callback === 'function') {
      callback(results);
    }
    
    this.emit('semantic-discovered', { query, results });
  }

  private handleRelate(event: CustomEvent): void {
    event.stopPropagation();
    
    const { sourceId, targetId, type } = event.detail;
    if (!sourceId || !targetId) return;

    if (!this.relationships.has(sourceId)) {
      this.relationships.set(sourceId, new Set());
    }
    
    this.relationships.get(sourceId)!.add(targetId);
    
    this.emit('semantic-related', { sourceId, targetId, type });
  }

  public discover(query: any): RegisteredComponent[] {
    const cacheKey = JSON.stringify(query);
    
    if (this.discoveryCache.has(cacheKey)) {
      return this.discoveryCache.get(cacheKey)!;
    }

    const results: RegisteredComponent[] = [];
    
    this.registry.forEach(component => {
      if (this.matchesQuery(component, query)) {
        results.push(component);
      }
    });

    this.discoveryCache.set(cacheKey, results);
    return results;
  }

  private matchesQuery(component: RegisteredComponent, query: any): boolean {
    const { manifest } = component;
    
    if (query.type && manifest.element?.type !== query.type) {
      return false;
    }
    
    if (query.intent && manifest.element?.intent !== query.intent) {
      return false;
    }
    
    if (query.tags && Array.isArray(query.tags)) {
      const componentTags = manifest.metadata?.tags || [];
      const hasAllTags = query.tags.every((tag: string) => 
        componentTags.includes(tag)
      );
      if (!hasAllTags) return false;
    }
    
    if (query.flow && manifest.context?.flow !== query.flow) {
      return false;
    }
    
    if (query.selector) {
      try {
        if (!component.element.matches(query.selector)) {
          return false;
        }
      } catch (e) {
        return false;
      }
    }
    
    return true;
  }

  private performAutoDiscovery(): void {
    const semanticElements = document.querySelectorAll('[data-semantic-id]');
    
    semanticElements.forEach(element => {
      if (element instanceof HTMLElement && element !== this) {
        const manifest = this.extractManifestFromElement(element);
        if (manifest) {
          this.handleRegister(new CustomEvent('semantic-register', {
            detail: { element, manifest }
          }));
        }
      }
    });
  }

  private extractManifestFromElement(element: HTMLElement): SemanticManifest | null {
    const type = element.getAttribute('data-semantic-type');
    const intent = element.getAttribute('data-semantic-intent');
    
    if (!type) return null;
    
    return {
      protocol: 'semantic-ui/v2',
      element: {
        type: type as any,
        intent: intent || undefined
      },
      metadata: {
        tags: element.getAttribute('data-semantic-tags')?.split(',') || []
      }
    };
  }

  private clearCache(): void {
    this.discoveryCache.clear();
    this.updateContent();
  }

  private exportRegistry(): void {
    const data = {
      timestamp: new Date().toISOString(),
      components: Array.from(this.registry.values()).map(comp => ({
        id: comp.id,
        manifest: comp.manifest,
        timestamp: comp.timestamp
      })),
      relationships: Array.from(this.relationships.entries()).map(([source, targets]) => ({
        source,
        targets: Array.from(targets)
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `semantic-registry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async validateAll(): Promise<void> {
    const results: Array<{ id: string; valid: boolean; errors?: string[] }> = [];
    
    for (const [id, component] of this.registry) {
      const result = await this.protocol.validate(component.manifest);
      results.push({ id, ...result });
    }
    
    this.emit('semantic-validation-complete', { results });
    
    if (this.hasAttribute('debug')) {
      console.table(results);
    }
  }

  private clearDiscoveryCache(): void {
    this.discoveryCache.clear();
  }

  private generateId(): string {
    return `semantic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getRegistry(): Map<string, RegisteredComponent> {
    return this.registry;
  }

  public getRelationships(): Map<string, Set<string>> {
    return this.relationships;
  }
}

customElements.define('semantic-provider', SemanticProvider);