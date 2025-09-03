/**
 * Developer Experience Utilities for Semantic Protocol
 * Performance monitoring, debugging, and visualization tools
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = process.env.NODE_ENV !== 'production';
    this.thresholds = {
      validation: 10,      // ms
      discovery: 20,       // ms
      registration: 5,     // ms
      relationship: 15     // ms
    };
  }

  start(operation) {
    if (!this.enabled) return;
    
    this.metrics.set(operation, {
      startTime: performance.now(),
      startMemory: process.memoryUsage?.() || {}
    });
  }

  end(operation, metadata = {}) {
    if (!this.enabled) return null;
    
    const metric = this.metrics.get(operation);
    if (!metric) return null;
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    const endMemory = process.memoryUsage?.() || {};
    
    const result = {
      operation,
      duration,
      memoryDelta: {
        heapUsed: (endMemory.heapUsed || 0) - (metric.startMemory.heapUsed || 0),
        external: (endMemory.external || 0) - (metric.startMemory.external || 0)
      },
      ...metadata,
      timestamp: new Date().toISOString(),
      warning: duration > (this.thresholds[operation] || 50)
    };
    
    if (result.warning) {
      console.warn(`⚠️ Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
    }
    
    this.metrics.delete(operation);
    this.logMetric(result);
    
    return result;
  }

  logMetric(metric) {
    // In development, log to console
    if (this.enabled && process.env.SEMANTIC_DEBUG === 'true') {
      console.log('[Semantic Performance]', metric);
    }
    
    // Hook for external monitoring tools
    if (global.semanticProtocolMonitor) {
      global.semanticProtocolMonitor(metric);
    }
  }

  getStats() {
    return {
      activeOperations: Array.from(this.metrics.keys()),
      enabled: this.enabled,
      thresholds: this.thresholds
    };
  }
}

class DebugVisualizer {
  constructor(registry) {
    this.registry = registry;
    this.graphData = null;
  }

  /**
   * Generate a visual representation of semantic relationships
   */
  generateGraph(options = {}) {
    const {
      format = 'mermaid',
      includeContext = true,
      maxDepth = 3,
      rootComponent = null
    } = options;

    if (format === 'mermaid') {
      return this.generateMermaidGraph(rootComponent, maxDepth, includeContext);
    } else if (format === 'json') {
      return this.generateJSONGraph(rootComponent, maxDepth, includeContext);
    } else if (format === 'dot') {
      return this.generateDotGraph(rootComponent, maxDepth, includeContext);
    }
    
    throw new Error(`Unsupported format: ${format}`);
  }

  generateMermaidGraph(rootId, maxDepth, includeContext) {
    const visited = new Set();
    const lines = ['graph TD'];
    
    const traverse = (componentId, depth = 0) => {
      if (depth > maxDepth || visited.has(componentId)) return;
      visited.add(componentId);
      
      const component = this.registry.get(componentId);
      if (!component) return;
      
      const manifest = component.manifest;
      const label = `${componentId}[${manifest.element.type || 'unknown'}]`;
      
      // Add node with styling based on type
      const style = this.getNodeStyle(manifest.element.type);
      lines.push(`  ${componentId}${label}:::${style}`);
      
      // Add relationships
      if (manifest.relationships) {
        Object.entries(manifest.relationships).forEach(([type, targetId]) => {
          if (!visited.has(targetId)) {
            lines.push(`  ${componentId} -->|${type}| ${targetId}`);
            traverse(targetId, depth + 1);
          }
        });
      }
      
      // Add context if requested
      if (includeContext && manifest.context) {
        const contextId = `ctx_${componentId}`;
        lines.push(`  ${contextId}((${JSON.stringify(manifest.context).substring(0, 30)}...))`);
        lines.push(`  ${componentId} -.->|context| ${contextId}`);
      }
    };

    // Start traversal
    if (rootId) {
      traverse(rootId);
    } else {
      // Traverse all root components
      this.registry.list().forEach(component => {
        if (!this.hasIncomingRelationships(component.id)) {
          traverse(component.id);
        }
      });
    }

    // Add styles
    lines.push('');
    lines.push('classDef action fill:#e1f5fe,stroke:#01579b,stroke-width:2px;');
    lines.push('classDef display fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;');
    lines.push('classDef input fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;');
    lines.push('classDef container fill:#fff3e0,stroke:#e65100,stroke-width:2px;');
    
    return lines.join('\n');
  }

  generateJSONGraph(rootId, maxDepth, includeContext) {
    const visited = new Set();
    const nodes = [];
    const edges = [];
    
    const traverse = (componentId, depth = 0) => {
      if (depth > maxDepth || visited.has(componentId)) return;
      visited.add(componentId);
      
      const component = this.registry.get(componentId);
      if (!component) return;
      
      const manifest = component.manifest;
      
      // Add node
      nodes.push({
        id: componentId,
        type: manifest.element?.type || 'unknown',
        label: manifest.element?.label || componentId,
        metadata: includeContext ? manifest : { element: manifest.element },
        depth
      });
      
      // Add edges for relationships
      if (manifest.relationships) {
        Object.entries(manifest.relationships).forEach(([type, targetId]) => {
          edges.push({
            source: componentId,
            target: targetId,
            type,
            label: type
          });
          
          if (!visited.has(targetId)) {
            traverse(targetId, depth + 1);
          }
        });
      }
    };

    // Start traversal
    if (rootId) {
      traverse(rootId);
    } else {
      this.registry.list().forEach(component => {
        if (!this.hasIncomingRelationships(component.id)) {
          traverse(component.id);
        }
      });
    }
    
    return { nodes, edges, metadata: { maxDepth, includeContext } };
  }

  generateDotGraph(rootId, maxDepth, includeContext) {
    const visited = new Set();
    const lines = ['digraph SemanticRelationships {'];
    lines.push('  rankdir=TB;');
    lines.push('  node [shape=box, style=rounded];');
    
    const traverse = (componentId, depth = 0) => {
      if (depth > maxDepth || visited.has(componentId)) return;
      visited.add(componentId);
      
      const component = this.registry.get(componentId);
      if (!component) return;
      
      const manifest = component.manifest;
      const color = this.getNodeColor(manifest.element?.type);
      
      // Add node
      lines.push(`  "${componentId}" [label="${componentId}\\n${manifest.element?.type || 'unknown'}", fillcolor="${color}", style="filled,rounded"];`);
      
      // Add relationships
      if (manifest.relationships) {
        Object.entries(manifest.relationships).forEach(([type, targetId]) => {
          lines.push(`  "${componentId}" -> "${targetId}" [label="${type}"];`);
          
          if (!visited.has(targetId)) {
            traverse(targetId, depth + 1);
          }
        });
      }
    };

    // Start traversal
    if (rootId) {
      traverse(rootId);
    } else {
      this.registry.list().forEach(component => {
        if (!this.hasIncomingRelationships(component.id)) {
          traverse(component.id);
        }
      });
    }
    
    lines.push('}');
    return lines.join('\n');
  }

  hasIncomingRelationships(componentId) {
    return this.registry.list().some(component => {
      const relationships = component.manifest?.relationships || {};
      return Object.values(relationships).includes(componentId);
    });
  }

  getNodeStyle(type) {
    const styles = {
      action: 'action',
      display: 'display',
      input: 'input',
      container: 'container'
    };
    return styles[type] || 'default';
  }

  getNodeColor(type) {
    const colors = {
      action: '#e1f5fe',
      display: '#f3e5f5',
      input: '#e8f5e9',
      container: '#fff3e0'
    };
    return colors[type] || '#ffffff';
  }

  /**
   * Validate semantic relationships and find issues
   */
  validateRelationships() {
    const issues = [];
    const components = this.registry.list();
    
    components.forEach(component => {
      const manifest = component.manifest;
      
      // Check for orphaned relationships
      if (manifest.relationships) {
        Object.entries(manifest.relationships).forEach(([type, targetId]) => {
          if (!this.registry.get(targetId)) {
            issues.push({
              type: 'orphaned_relationship',
              componentId: component.id,
              relationshipType: type,
              targetId,
              message: `Component "${component.id}" has relationship to non-existent component "${targetId}"`
            });
          }
        });
      }
      
      // Check for circular dependencies
      const visited = new Set();
      const stack = new Set();
      
      const hasCycle = (id) => {
        if (stack.has(id)) return true;
        if (visited.has(id)) return false;
        
        visited.add(id);
        stack.add(id);
        
        const comp = this.registry.get(id);
        if (comp?.manifest?.relationships) {
          const deps = Object.values(comp.manifest.relationships);
          for (const depId of deps) {
            if (hasCycle(depId)) return true;
          }
        }
        
        stack.delete(id);
        return false;
      };
      
      if (hasCycle(component.id)) {
        issues.push({
          type: 'circular_dependency',
          componentId: component.id,
          message: `Component "${component.id}" is part of a circular dependency chain`
        });
      }
    });
    
    return issues;
  }

  /**
   * Generate a semantic coverage report
   */
  generateCoverageReport() {
    const components = this.registry.list();
    const report = {
      total: components.length,
      byType: {},
      withRelationships: 0,
      withContext: 0,
      withValidation: 0,
      completeness: {},
      issues: this.validateRelationships()
    };
    
    components.forEach(component => {
      const manifest = component.manifest;
      
      // Count by type
      const type = manifest.element?.type || 'unknown';
      report.byType[type] = (report.byType[type] || 0) + 1;
      
      // Count features
      if (manifest.relationships && Object.keys(manifest.relationships).length > 0) {
        report.withRelationships++;
      }
      if (manifest.context && Object.keys(manifest.context).length > 0) {
        report.withContext++;
      }
      if (manifest.validation && Object.keys(manifest.validation).length > 0) {
        report.withValidation++;
      }
      
      // Calculate completeness score
      const score = this.calculateCompleteness(manifest);
      const bracket = Math.floor(score / 20) * 20; // 0-20, 20-40, etc.
      const key = `${bracket}-${bracket + 20}%`;
      report.completeness[key] = (report.completeness[key] || 0) + 1;
    });
    
    // Calculate percentages
    report.percentages = {
      withRelationships: ((report.withRelationships / report.total) * 100).toFixed(1),
      withContext: ((report.withContext / report.total) * 100).toFixed(1),
      withValidation: ((report.withValidation / report.total) * 100).toFixed(1)
    };
    
    return report;
  }

  calculateCompleteness(manifest) {
    let score = 0;
    const weights = {
      element: 20,
      context: 20,
      relationships: 20,
      validation: 20,
      metadata: 20
    };
    
    Object.entries(weights).forEach(([key, weight]) => {
      if (manifest[key] && Object.keys(manifest[key]).length > 0) {
        score += weight;
      }
    });
    
    return score;
  }
}

// Export utilities
module.exports = {
  PerformanceMonitor,
  DebugVisualizer
};
