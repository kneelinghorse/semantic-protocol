# API Reference

Complete API documentation for the Semantic Protocol core library and framework integrations.

## 📦 Core API

The core API provides the fundamental operations for working with semantic components.

### Quick Reference

```javascript
import { SemanticProtocol } from '@semantic-protocol/core';

const protocol = new SemanticProtocol(config);

// Component operations
protocol.register(manifest)           // Register a component
protocol.unregister(id)               // Remove a component
protocol.get(id)                      // Get component by ID
protocol.update(id, changes)          // Update component

// Discovery
protocol.query(selector)              // Find components
protocol.exists(id)                   // Check if component exists
protocol.count(selector)              // Count matching components

// Validation
protocol.validate(id, value)          // Validate component data
protocol.validateManifest(manifest)   // Validate manifest structure
protocol.addValidator(name, fn)       // Add custom validator

// Relationships
protocol.getRelationships(id)         // Get component relationships
protocol.addRelationship(from, to)    // Create relationship
protocol.removeRelationship(from, to) // Remove relationship
protocol.getRelationshipGraph(id)     // Get full graph

// Events
protocol.on(event, handler)           // Listen to events
protocol.off(event, handler)          // Remove listener
protocol.emit(event, data)            // Emit event
```

## 🔧 Constructor

### `new SemanticProtocol(config?)`

Creates a new Semantic Protocol instance.

```javascript
const protocol = new SemanticProtocol({
  // Configuration options
  version: '2.0.0',
  debug: true,
  validation: {
    async: true,
    timeout: 5000,
    strict: true
  },
  discovery: {
    cache: true,
    cacheTimeout: 60000,
    indexing: true
  },
  performance: {
    lazy: true,
    batch: true,
    throttle: 100
  }
});
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config` | `ProtocolConfig` | `{}` | Configuration object |

#### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `version` | `string` | `'2.0.0'` | Protocol version |
| `debug` | `boolean` | `false` | Enable debug logging |
| `validation.async` | `boolean` | `true` | Async validation |
| `validation.timeout` | `number` | `5000` | Validation timeout (ms) |
| `validation.strict` | `boolean` | `false` | Strict validation mode |
| `discovery.cache` | `boolean` | `true` | Enable query cache |
| `discovery.cacheTimeout` | `number` | `60000` | Cache TTL (ms) |
| `discovery.indexing` | `boolean` | `true` | Enable indexing |
| `performance.lazy` | `boolean` | `false` | Lazy loading |
| `performance.batch` | `boolean` | `false` | Batch operations |
| `performance.throttle` | `number` | `0` | Throttle delay (ms) |

## 📝 Registration Methods

### `register(manifest)`

Registers a new semantic component.

```javascript
const result = protocol.register({
  protocol: 'semantic-ui/v2',
  id: 'my-component',
  element: {
    type: 'input',
    intent: 'capture user data',
    label: 'User Input'
  }
});

// Returns
{
  success: true,
  id: 'my-component',
  timestamp: 1234567890
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `manifest` | `Manifest` | Yes | Component manifest |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `success` | `boolean` | Registration success |
| `id` | `string` | Component ID |
| `timestamp` | `number` | Registration time |
| `error` | `string` | Error message (if failed) |

### `unregister(id)`

Removes a component from the registry.

```javascript
const result = protocol.unregister('my-component');

// Returns
{
  success: true,
  removed: ['my-component'],
  relationships: 2  // Number of relationships cleaned
}
```

### `update(id, changes)`

Updates an existing component.

```javascript
const result = protocol.update('my-component', {
  element: { label: 'Updated Label' },
  metadata: { modified: Date.now() }
});
```

## 🔍 Discovery Methods

### `query(selector)`

Finds components matching the selector.

```javascript
// Find by type
const inputs = protocol.query({ 
  element: { type: 'input' } 
});

// Find by intent (regex)
const emails = protocol.query({ 
  element: { intent: /email/i } 
});

// Complex query
const critical = protocol.query({
  element: { 
    type: 'input',
    criticality: 'high'
  },
  context: { flow: 'checkout' }
});
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `QuerySelector` | Query criteria |

#### Selector Options

```typescript
interface QuerySelector {
  element?: {
    type?: ElementType | ElementType[];
    intent?: string | RegExp;
    label?: string | RegExp;
    criticality?: Criticality;
  };
  context?: {
    flow?: string;
    step?: number;
  };
  relationships?: {
    hasParent?: boolean | string;
    hasChildren?: boolean;
    hasValidators?: boolean;
  };
  metadata?: {
    tags?: string | string[];
    author?: string;
  };
}
```

### `get(id)`

Retrieves a component by ID.

```javascript
const component = protocol.get('my-component');

// Returns full component manifest
{
  id: 'my-component',
  protocol: 'semantic-ui/v2',
  element: { ... },
  context: { ... },
  relationships: { ... }
}
```

### `exists(id)`

Checks if a component exists.

```javascript
if (protocol.exists('my-component')) {
  // Component exists
}
```

### `count(selector?)`

Counts components.

```javascript
// Count all
const total = protocol.count();

// Count matching
const inputs = protocol.count({ 
  element: { type: 'input' } 
});
```

## ✅ Validation Methods

### `validate(id, value, options?)`

Validates a value against component rules.

```javascript
const result = await protocol.validate('email-input', 'user@example.com');

// Returns
{
  valid: true,
  value: 'user@example.com',
  errors: [],
  warnings: []
}

// With errors
{
  valid: false,
  value: 'invalid',
  errors: [
    { rule: 'email', message: 'Invalid email format' }
  ]
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Component ID |
| `value` | `any` | Value to validate |
| `options` | `ValidationOptions` | Validation options |

### `validateManifest(manifest)`

Validates a manifest structure.

```javascript
const result = protocol.validateManifest(manifest);

if (!result.valid) {
  console.error('Invalid manifest:', result.errors);
}
```

### `addValidator(name, validator)`

Adds a custom validation rule.

```javascript
protocol.addValidator('phone', (value, options) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(value);
});

// Use in manifest
{
  validation: {
    rules: [
      { type: 'phone', message: 'Invalid phone number' }
    ]
  }
}
```

## 🔗 Relationship Methods

### `getRelationships(id)`

Gets all relationships for a component.

```javascript
const relationships = protocol.getRelationships('my-component');

// Returns
{
  parent: 'parent-id',
  children: ['child-1', 'child-2'],
  dependencies: ['dep-1'],
  validators: ['validator-1'],
  handlers: ['handler-1']
}
```

### `addRelationship(fromId, toId, type)`

Creates a relationship between components.

```javascript
protocol.addRelationship('parent', 'child', 'parent-child');
protocol.addRelationship('input', 'validator', 'validation');
```

### `removeRelationship(fromId, toId, type)`

Removes a relationship.

```javascript
protocol.removeRelationship('parent', 'child', 'parent-child');
```

### `getRelationshipGraph(id, depth?)`

Gets the relationship graph for a component.

```javascript
const graph = protocol.getRelationshipGraph('root', 3);

// Returns
{
  id: 'root',
  children: [
    {
      id: 'child-1',
      children: [...]
    }
  ],
  dependencies: [...],
  validators: [...]
}
```

## 📡 Event Methods

### `on(event, handler)`

Listens to protocol events.

```javascript
protocol.on('component:registered', (data) => {
  console.log('New component:', data.id);
});

protocol.on('validation:failed', (data) => {
  console.error('Validation error:', data.errors);
});
```

#### Available Events

| Event | Description | Data |
|-------|-------------|------|
| `component:registered` | Component registered | `{ id, manifest }` |
| `component:updated` | Component updated | `{ id, changes }` |
| `component:removed` | Component removed | `{ id }` |
| `validation:start` | Validation started | `{ id, value }` |
| `validation:success` | Validation passed | `{ id, value }` |
| `validation:failed` | Validation failed | `{ id, errors }` |
| `query:executed` | Query executed | `{ selector, results }` |
| `relationship:created` | Relationship created | `{ from, to, type }` |
| `relationship:removed` | Relationship removed | `{ from, to, type }` |

### `off(event, handler)`

Removes an event listener.

```javascript
const handler = (data) => console.log(data);
protocol.on('component:registered', handler);
// Later...
protocol.off('component:registered', handler);
```

### `emit(event, data)`

Emits a custom event.

```javascript
protocol.emit('custom:event', { 
  message: 'Something happened' 
});
```

## 🔧 Utility Methods

### `clear()`

Removes all components.

```javascript
protocol.clear();
```

### `getStats()`

Gets protocol statistics.

```javascript
const stats = protocol.getStats();

// Returns
{
  componentCount: 42,
  queryCount: 156,
  cacheHits: 89,
  cacheMisses: 67,
  avgQueryTime: 2.3,
  avgValidationTime: 1.2
}
```

### `export()`

Exports all components.

```javascript
const data = protocol.export();
// Save to file or database
```

### `import(data)`

Imports components.

```javascript
const data = loadFromFile();
protocol.import(data);
```

## 🎣 React Hooks

### `useSemanticProtocol()`

Access protocol instance in React components.

```javascript
import { useSemanticProtocol } from '@semantic-protocol/react';

function MyComponent() {
  const { register, query, validate } = useSemanticProtocol();
  
  // Use protocol methods
}
```

### `useSemanticComponent(id)`

Hook for individual component.

```javascript
const { component, validate, update } = useSemanticComponent('my-input');
```

### `useSemanticQuery(selector)`

Hook for reactive queries.

```javascript
const inputs = useSemanticQuery({ element: { type: 'input' } });
// Re-renders when matching components change
```

## 🔄 Vue Composables

### `useSemanticProtocol()`

Access protocol in Vue components.

```javascript
import { useSemanticProtocol } from '@semantic-protocol/vue';

export default {
  setup() {
    const { register, query, validate } = useSemanticProtocol();
    
    // Use protocol methods
    return { ... };
  }
}
```

## 📐 Angular Services

### `SemanticProtocolService`

Injectable service for Angular.

```typescript
import { SemanticProtocolService } from '@semantic-protocol/angular';

@Component({...})
export class MyComponent {
  constructor(private semantic: SemanticProtocolService) {}
  
  ngOnInit() {
    this.semantic.register({...});
  }
}
```

## 🔍 TypeScript Types

See [TypeScript Reference](../reference/typescript.md) for complete type definitions.

## 📚 More Resources

- [Core API Examples](./core.md)
- [Validation API](./validation.md)
- [Relationship API](./relationships.md)
- [Event API](./events.md)
- [Framework Integration](../guides/README.md)

---

<div align="center">
  <strong>Need framework-specific APIs?</strong><br>
  <a href="../guides/README.md">View Integration Guides →</a>
</div>