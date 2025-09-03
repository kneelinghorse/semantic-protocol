const crypto = require('crypto');

class BenchmarkGenerators {
  static generateManifest(options = {}) {
    const defaults = {
      type: 'input',
      intent: 'generated component',
      label: 'Generated Component',
      hasContext: false,
      hasRelationships: false,
      hasValidation: false,
      hasMetadata: true,
      complexity: 'simple'
    };

    const config = { ...defaults, ...options };
    const id = config.id || `generated-${crypto.randomBytes(8).toString('hex')}`;

    const manifest = {
      id,
      protocol: 'semantic-ui/v2',
      element: {
        type: config.type,
        intent: config.intent,
        label: config.label
      }
    };

    if (config.criticality) {
      manifest.element.criticality = config.criticality;
    }

    if (config.hasContext) {
      manifest.context = this.generateContext(config.complexity);
    }

    if (config.hasRelationships) {
      manifest.relationships = this.generateRelationships(config.complexity);
    }

    if (config.hasValidation) {
      manifest.validation = this.generateValidation(config.complexity);
    }

    if (config.hasMetadata) {
      manifest.metadata = this.generateMetadata();
    }

    return manifest;
  }

  static generateContext(complexity = 'simple') {
    const contexts = {
      simple: {
        flow: 'main',
        step: 1
      },
      medium: {
        flow: 'checkout',
        step: 3,
        prerequisites: ['shipping', 'billing'],
        outcomes: ['success', 'failure']
      },
      complex: {
        flow: 'multi-step-wizard',
        step: 5,
        prerequisites: Array(10).fill(null).map((_, i) => `step-${i}`),
        outcomes: ['complete', 'partial', 'abandoned', 'error'],
        data: {
          sessionId: crypto.randomBytes(16).toString('hex'),
          timestamp: Date.now(),
          environment: 'production'
        }
      }
    };

    return contexts[complexity] || contexts.simple;
  }

  static generateRelationships(complexity = 'simple') {
    const relationships = {
      simple: {
        parent: 'parent-component'
      },
      medium: {
        parent: 'form-container',
        children: ['child-1', 'child-2'],
        validators: ['email-validator']
      },
      complex: {
        parent: 'root-container',
        children: Array(10).fill(null).map((_, i) => `child-${i}`),
        dependencies: Array(5).fill(null).map((_, i) => `dep-${i}`),
        validators: Array(3).fill(null).map((_, i) => `validator-${i}`),
        handlers: ['submit-handler', 'reset-handler', 'cancel-handler']
      }
    };

    return relationships[complexity] || relationships.simple;
  }

  static generateValidation(complexity = 'simple') {
    const validations = {
      simple: {
        rules: [
          { field: 'value', type: 'required' }
        ]
      },
      medium: {
        rules: [
          { field: 'email', type: 'email', message: 'Invalid email' },
          { field: 'password', type: 'minLength', value: 8 }
        ],
        async: false
      },
      complex: {
        rules: Array(10).fill(null).map((_, i) => ({
          field: `field-${i}`,
          type: ['required', 'email', 'minLength', 'maxLength', 'pattern'][i % 5],
          value: i * 2,
          message: `Validation error for field ${i}`
        })),
        messages: {
          required: 'This field is required',
          email: 'Please enter a valid email',
          minLength: 'Too short',
          maxLength: 'Too long'
        },
        async: true
      }
    };

    return validations[complexity] || validations.simple;
  }

  static generateMetadata() {
    return {
      version: '1.0.0',
      author: 'benchmark-generator',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: ['benchmark', 'generated', 'test']
    };
  }

  static generateBatch(count, options = {}) {
    const manifests = [];
    
    for (let i = 0; i < count; i++) {
      const complexity = options.complexity || 
        (i < count * 0.6 ? 'simple' : i < count * 0.9 ? 'medium' : 'complex');
      
      const type = options.type || 
        ['input', 'container', 'action', 'display', 'navigation'][i % 5];
      
      manifests.push(this.generateManifest({
        ...options,
        id: `batch-${i}`,
        type,
        intent: `batch component ${i}`,
        label: `Batch Component ${i}`,
        complexity,
        hasContext: i % 3 === 0,
        hasRelationships: i % 2 === 0,
        hasValidation: i % 4 === 0,
        criticality: ['low', 'medium', 'high', 'critical'][i % 4]
      }));
    }

    return manifests;
  }

  static generateGraph(nodes, edges) {
    const components = [];
    const edgeMap = new Map();

    // Create nodes
    for (let i = 0; i < nodes; i++) {
      components.push({
        id: `graph-node-${i}`,
        protocol: 'semantic-ui/v2',
        element: {
          type: ['container', 'input', 'action'][i % 3],
          intent: `graph node ${i}`,
          label: `Node ${i}`
        },
        relationships: {}
      });
      
      edgeMap.set(`graph-node-${i}`, []);
    }

    // Create edges
    for (let i = 0; i < edges && i < nodes * (nodes - 1); i++) {
      const from = Math.floor(Math.random() * nodes);
      const to = Math.floor(Math.random() * nodes);
      
      if (from !== to) {
        const fromId = `graph-node-${from}`;
        const toId = `graph-node-${to}`;
        
        if (!components[from].relationships.children) {
          components[from].relationships.children = [];
        }
        components[from].relationships.children.push(toId);
        
        if (!components[to].relationships.parent) {
          components[to].relationships.parent = fromId;
        }
        
        edgeMap.get(fromId).push(toId);
      }
    }

    return { components, edgeMap };
  }

  static generateInvalidManifest(type = 'random') {
    const invalidTypes = {
      missingProtocol: {
        element: { type: 'input', intent: 'test' }
      },
      invalidType: {
        protocol: 'semantic-ui/v2',
        element: { type: 'invalid-type', intent: 'test' }
      },
      missingType: {
        protocol: 'semantic-ui/v2',
        element: { intent: 'test' }
      },
      circularDependency: {
        id: 'circular-a',
        protocol: 'semantic-ui/v2',
        element: { type: 'container', intent: 'circular' },
        relationships: {
          dependencies: ['circular-b']
        }
      },
      orphanedRelationship: {
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'orphaned' },
        relationships: {
          parent: 'non-existent-parent',
          validators: ['non-existent-validator']
        }
      },
      invalidValidation: {
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'invalid validation' },
        validation: {
          rules: [
            { field: 'value', type: 'unknown-validation-type' }
          ]
        }
      },
      incompatibleContext: {
        protocol: 'semantic-ui/v2',
        element: { type: 'input', intent: 'incompatible' },
        context: {
          flow: 'checkout',
          step: 'not-a-number'
        }
      }
    };

    if (type === 'random') {
      const keys = Object.keys(invalidTypes);
      type = keys[Math.floor(Math.random() * keys.length)];
    }

    return invalidTypes[type] || invalidTypes.missingProtocol;
  }

  static generateLargeManifest(sizeInKB = 100) {
    const targetSize = sizeInKB * 1024;
    let currentSize = 0;
    
    const manifest = {
      id: 'large-manifest',
      protocol: 'semantic-ui/v2',
      element: {
        type: 'container',
        intent: 'large container',
        label: 'Large Container',
        description: ''
      },
      context: {
        data: []
      },
      relationships: {
        children: [],
        dependencies: [],
        validators: []
      },
      validation: {
        rules: []
      },
      metadata: {
        tags: [],
        properties: {}
      }
    };

    // Add description to reach target size
    while (currentSize < targetSize * 0.3) {
      manifest.element.description += 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
      currentSize = JSON.stringify(manifest).length;
    }

    // Add context data
    while (currentSize < targetSize * 0.5) {
      manifest.context.data.push({
        key: `data-${manifest.context.data.length}`,
        value: crypto.randomBytes(100).toString('hex')
      });
      currentSize = JSON.stringify(manifest).length;
    }

    // Add relationships
    while (currentSize < targetSize * 0.7) {
      manifest.relationships.children.push(`child-${manifest.relationships.children.length}`);
      manifest.relationships.dependencies.push(`dep-${manifest.relationships.dependencies.length}`);
      currentSize = JSON.stringify(manifest).length;
    }

    // Add validation rules
    while (currentSize < targetSize * 0.85) {
      manifest.validation.rules.push({
        field: `field-${manifest.validation.rules.length}`,
        type: 'required',
        message: `Field ${manifest.validation.rules.length} is required`
      });
      currentSize = JSON.stringify(manifest).length;
    }

    // Add metadata
    while (currentSize < targetSize) {
      manifest.metadata.tags.push(`tag-${manifest.metadata.tags.length}`);
      manifest.metadata.properties[`prop-${Object.keys(manifest.metadata.properties).length}`] = 
        crypto.randomBytes(50).toString('hex');
      currentSize = JSON.stringify(manifest).length;
    }

    return manifest;
  }

  static generateTestData(type = 'mixed', count = 100) {
    const data = {
      manifests: [],
      queries: [],
      updates: [],
      relationships: []
    };

    // Generate manifests
    data.manifests = this.generateBatch(count);

    // Generate queries
    for (let i = 0; i < count / 2; i++) {
      data.queries.push({
        element: { 
          type: ['input', 'container', 'action'][i % 3]
        }
      });
      
      data.queries.push({
        metadata: { 
          tags: `tag-${i % 10}`
        }
      });
      
      data.queries.push({
        context: {
          flow: `flow-${i % 5}`
        }
      });
    }

    // Generate updates
    for (let i = 0; i < count / 4; i++) {
      data.updates.push({
        id: `batch-${i}`,
        changes: {
          metadata: {
            modified: new Date().toISOString(),
            updateCount: i
          }
        }
      });
    }

    // Generate relationship operations
    for (let i = 0; i < count / 10; i++) {
      data.relationships.push({
        operation: 'addChild',
        parent: `batch-${i}`,
        child: `batch-${i + 1}`
      });
      
      data.relationships.push({
        operation: 'addDependency',
        from: `batch-${i * 2}`,
        to: `batch-${i * 2 + 1}`
      });
    }

    return data;
  }
}

module.exports = BenchmarkGenerators;