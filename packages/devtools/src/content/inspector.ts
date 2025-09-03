/**
 * Content Script - Semantic Inspector
 * Injects semantic inspection capabilities into the page
 */

import { SemanticProtocol } from '@kneelinghorse/semantic-protocol';

interface SemanticComponent {
  id: string;
  element: HTMLElement;
  manifest: any;
  relationships: string[];
  performance: {
    registrationTime: number;
    lastValidation: number;
    renderCount: number;
  };
}

class SemanticInspector {
  private protocol = new SemanticProtocol();
  private components = new Map<string, SemanticComponent>();
  private observer: MutationObserver | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private overlayEnabled = false;
  private selectedElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Inject global inspector
    this.injectGlobalInspector();
    
    // Start observing DOM changes
    this.startObserving();
    
    // Listen for messages from extension
    this.setupMessageListener();
    
    // Scan existing elements
    this.scanForSemantics();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    console.log('🔍 Semantic Protocol Inspector initialized');
  }

  private injectGlobalInspector() {
    // Inject inspector API into page context
    const script = document.createElement('script');
    script.textContent = `
      window.__SEMANTIC_INSPECTOR__ = {
        version: '2.0.0',
        components: new Map(),
        events: [],
        
        register(id, manifest, element) {
          this.components.set(id, { manifest, element, timestamp: Date.now() });
          this.emit('component:registered', { id, manifest });
        },
        
        unregister(id) {
          this.components.delete(id);
          this.emit('component:unregistered', { id });
        },
        
        validate(manifest) {
          const start = performance.now();
          // Validation logic here
          const duration = performance.now() - start;
          this.emit('validation:complete', { manifest, duration });
          return { valid: true, duration };
        },
        
        discover(query) {
          const start = performance.now();
          const results = [];
          this.components.forEach((comp, id) => {
            if (this.matchesQuery(comp.manifest, query)) {
              results.push({ id, ...comp });
            }
          });
          const duration = performance.now() - start;
          this.emit('discovery:complete', { query, results, duration });
          return results;
        },
        
        matchesQuery(manifest, query) {
          // Query matching logic
          if (query.type && manifest.element?.type !== query.type) return false;
          if (query.intent && manifest.element?.intent !== query.intent) return false;
          return true;
        },
        
        emit(event, data) {
          this.events.push({ event, data, timestamp: Date.now() });
          window.postMessage({ 
            type: 'SEMANTIC_EVENT', 
            event, 
            data 
          }, '*');
        },
        
        getStats() {
          return {
            componentCount: this.components.size,
            eventCount: this.events.length,
            coverage: this.calculateCoverage()
          };
        },
        
        calculateCoverage() {
          const allElements = document.querySelectorAll('*').length;
          const semanticElements = this.components.size;
          return (semanticElements / allElements * 100).toFixed(2) + '%';
        }
      };
    `;
    document.documentElement.appendChild(script);
    script.remove();
  }

  private startObserving() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check added nodes for semantic components
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.checkElement(node);
          }
        });
        
        // Check removed nodes
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const semanticId = node.getAttribute('data-semantic-id');
            if (semanticId) {
              this.components.delete(semanticId);
              this.notifyExtension('component:removed', { id: semanticId });
            }
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-semantic-id', 'data-semantic-type']
    });
  }

  private setupMessageListener() {
    // Listen for messages from extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'GET_SEMANTICS':
          sendResponse(this.getAllSemantics());
          break;
          
        case 'INSPECT_ELEMENT':
          this.inspectElement(message.selector);
          sendResponse({ success: true });
          break;
          
        case 'TOGGLE_OVERLAY':
          this.toggleOverlay();
          sendResponse({ overlayEnabled: this.overlayEnabled });
          break;
          
        case 'VALIDATE_ALL':
          const results = this.validateAll();
          sendResponse(results);
          break;
          
        case 'GET_RELATIONSHIPS':
          const relationships = this.getRelationships();
          sendResponse(relationships);
          break;
          
        case 'GET_PERFORMANCE':
          const performance = this.getPerformanceMetrics();
          sendResponse(performance);
          break;
          
        case 'EXPORT_DATA':
          const exportData = this.exportData();
          sendResponse(exportData);
          break;
      }
      
      return true; // Keep message channel open for async response
    });

    // Listen for messages from injected script
    window.addEventListener('message', (event) => {
      if (event.data.type === 'SEMANTIC_EVENT') {
        this.notifyExtension('semantic:event', event.data);
      }
    });
  }

  private scanForSemantics() {
    const semanticElements = document.querySelectorAll('[data-semantic-id], [data-semantic-type]');
    
    semanticElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.checkElement(element);
      }
    });

    // Also check for React/Vue components
    this.scanFrameworkComponents();
  }

  private checkElement(element: HTMLElement) {
    const semanticId = element.getAttribute('data-semantic-id') || this.generateId();
    const semanticType = element.getAttribute('data-semantic-type');
    const semanticIntent = element.getAttribute('data-semantic-intent');

    if (semanticType || this.hasFrameworkSemantics(element)) {
      const manifest = this.extractManifest(element);
      
      if (manifest) {
        const component: SemanticComponent = {
          id: semanticId,
          element,
          manifest,
          relationships: this.extractRelationships(element),
          performance: {
            registrationTime: Date.now(),
            lastValidation: 0,
            renderCount: 0
          }
        };

        this.components.set(semanticId, component);
        
        // Add visual indicator if overlay is enabled
        if (this.overlayEnabled) {
          this.addOverlay(element, manifest);
        }

        this.notifyExtension('component:discovered', {
          id: semanticId,
          manifest,
          path: this.getElementPath(element)
        });
      }
    }
  }

  private extractManifest(element: HTMLElement): any {
    // Try to get manifest from various sources
    
    // 1. Data attributes
    const dataManifest = {
      element: {
        type: element.getAttribute('data-semantic-type'),
        intent: element.getAttribute('data-semantic-intent'),
        label: element.getAttribute('data-semantic-label')
      },
      metadata: {
        id: element.getAttribute('data-semantic-id'),
        tags: element.getAttribute('data-semantic-tags')?.split(',')
      }
    };

    // 2. React fiber
    if ((element as any)._reactInternalFiber) {
      const fiber = (element as any)._reactInternalFiber;
      if (fiber.memoizedProps?.semanticManifest) {
        return fiber.memoizedProps.semanticManifest;
      }
    }

    // 3. Vue instance
    if ((element as any).__vue__) {
      const instance = (element as any).__vue__;
      if (instance.$data?.manifest) {
        return instance.$data.manifest;
      }
    }

    // 4. Check global registry
    const semanticId = element.getAttribute('data-semantic-id');
    if (semanticId && (window as any).__SEMANTIC_INSPECTOR__) {
      const inspector = (window as any).__SEMANTIC_INSPECTOR__;
      const component = inspector.components.get(semanticId);
      if (component) {
        return component.manifest;
      }
    }

    return dataManifest.element.type ? dataManifest : null;
  }

  private hasFrameworkSemantics(element: HTMLElement): boolean {
    return !!(
      (element as any)._reactInternalFiber?.memoizedProps?.semanticManifest ||
      (element as any).__vue__?.$data?.manifest ||
      element.getAttribute('data-semantic-id')
    );
  }

  private scanFrameworkComponents() {
    // Scan React components
    if ((window as any).React && (window as any).ReactDOM) {
      // Implementation would traverse React fiber tree
    }

    // Scan Vue components
    if ((window as any).Vue) {
      // Implementation would traverse Vue component tree
    }
  }

  private extractRelationships(element: HTMLElement): string[] {
    const relationships: string[] = [];
    
    // Parent relationship
    const parent = element.parentElement;
    if (parent) {
      const parentId = parent.getAttribute('data-semantic-id');
      if (parentId) {
        relationships.push(`parent:${parentId}`);
      }
    }

    // Children relationships
    const children = element.querySelectorAll('[data-semantic-id]');
    children.forEach((child) => {
      const childId = child.getAttribute('data-semantic-id');
      if (childId) {
        relationships.push(`child:${childId}`);
      }
    });

    return relationships;
  }

  private toggleOverlay() {
    this.overlayEnabled = !this.overlayEnabled;
    
    if (this.overlayEnabled) {
      this.components.forEach((component) => {
        this.addOverlay(component.element, component.manifest);
      });
    } else {
      this.removeAllOverlays();
    }
  }

  private addOverlay(element: HTMLElement, manifest: any) {
    // Remove existing overlay if any
    const existingOverlay = element.querySelector('.semantic-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'semantic-overlay';
    overlay.innerHTML = `
      <div class="semantic-badge">
        <span class="type">${manifest.element?.type || 'unknown'}</span>
        <span class="intent">${manifest.element?.intent || ''}</span>
      </div>
    `;

    // Style the overlay
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      background: rgba(33, 150, 243, 0.9);
      color: white;
      padding: 2px 6px;
      font-size: 11px;
      border-radius: 0 0 0 3px;
      pointer-events: none;
      z-index: 10000;
      font-family: monospace;
    `;

    element.style.position = 'relative';
    element.appendChild(overlay);
  }

  private removeAllOverlays() {
    document.querySelectorAll('.semantic-overlay').forEach((overlay) => {
      overlay.remove();
    });
  }

  private validateAll(): any[] {
    const results: any[] = [];
    
    this.components.forEach((component) => {
      const start = performance.now();
      const validation = this.protocol.validate(component.manifest);
      const duration = performance.now() - start;
      
      results.push({
        id: component.id,
        valid: validation.valid,
        errors: validation.errors,
        duration
      });
      
      component.performance.lastValidation = Date.now();
    });

    return results;
  }

  private getRelationships(): any {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    this.components.forEach((component, id) => {
      nodes.push({
        id,
        label: component.manifest.element?.type || 'unknown',
        type: component.manifest.element?.type
      });
      
      component.relationships.forEach((rel) => {
        const [type, targetId] = rel.split(':');
        edges.push({
          source: id,
          target: targetId,
          type
        });
      });
    });

    return { nodes, edges };
  }

  private setupPerformanceMonitoring() {
    if (!window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('semantic')) {
          this.notifyExtension('performance:entry', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure', 'mark'] });
  }

  private getPerformanceMetrics(): any {
    const metrics = {
      componentCount: this.components.size,
      totalRegistrationTime: 0,
      averageValidationTime: 0,
      memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
    };

    let totalValidationTime = 0;
    let validationCount = 0;

    this.components.forEach((component) => {
      metrics.totalRegistrationTime += component.performance.registrationTime;
      if (component.performance.lastValidation) {
        validationCount++;
      }
    });

    if (validationCount > 0) {
      metrics.averageValidationTime = totalValidationTime / validationCount;
    }

    return metrics;
  }

  private getAllSemantics(): any {
    const components: any[] = [];
    
    this.components.forEach((component, id) => {
      components.push({
        id,
        manifest: component.manifest,
        path: this.getElementPath(component.element),
        relationships: component.relationships,
        performance: component.performance
      });
    });

    return {
      components,
      stats: {
        total: components.length,
        byType: this.groupByType(components),
        coverage: this.calculateCoverage()
      }
    };
  }

  private groupByType(components: any[]): Record<string, number> {
    const byType: Record<string, number> = {};
    
    components.forEach((comp) => {
      const type = comp.manifest.element?.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    return byType;
  }

  private calculateCoverage(): number {
    const allElements = document.querySelectorAll('*').length;
    const semanticElements = this.components.size;
    return Math.round((semanticElements / allElements) * 100);
  }

  private inspectElement(selector: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return;

    this.selectedElement = element;
    
    // Highlight element
    element.style.outline = '2px solid #2196F3';
    element.style.outlineOffset = '2px';
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 2000);
  }

  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${current.className.split(' ')[0]}`;
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  private exportData(): any {
    return {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      components: Array.from(this.components.entries()).map(([id, comp]) => ({
        id,
        manifest: comp.manifest,
        relationships: comp.relationships,
        performance: comp.performance
      })),
      stats: {
        total: this.components.size,
        coverage: this.calculateCoverage(),
        byType: this.groupByType(Array.from(this.components.values()))
      }
    };
  }

  private notifyExtension(type: string, data: any) {
    chrome.runtime.sendMessage({
      type: `SEMANTIC_${type.toUpperCase()}`,
      data,
      timestamp: Date.now()
    });
  }

  private generateId(): string {
    return `semantic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize inspector when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SemanticInspector();
  });
} else {
  new SemanticInspector();
}