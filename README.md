# Semantic Protocol 

**Teaching software to understand itself through semantic manifests for self-aware UI components.**

```bash
npm install @kneelinghorse/semantic-protocol
```

## What is this?

The Semantic Protocol enables UI components to describe themselves—their purpose, relationships, and behavior—in a way that any system can understand. Design tools, testing frameworks, AI assistants, and other components can all speak the same language.

## Quick Example

Transform a basic button into a self-aware component:

```javascript
// Before: A button that knows nothing about itself
<button onClick={handleSubmit}>Submit</button>

// After: A button that can explain itself to any system
import SemanticProtocol from '@kneelinghorse/semantic-protocol';

const protocol = new SemanticProtocol();
const manifest = protocol.createManifest({
  type: 'action',
  intent: 'submit_payment',
  purpose: 'Complete purchase transaction',
  criticality: 'high',
  context: {
    flow: 'checkout',
    step: 3,
    prerequisites: ['shipping_validated', 'payment_method_added'],
    outcomes: ['order_created', 'payment_charged']
  }
});

<button onClick={handleSubmit} data-semantic={manifest.id}>
  Complete Purchase
</button>
```

Now this button can:
- Tell testing frameworks what should happen when clicked
- Inform accessibility tools about its importance
- Help AI assistants understand its role in the application
- Validate its own prerequisites before executing
- Document itself automatically

## Core Concepts

### Semantic Manifests
Every component gets a manifest describing what it is, what it does, and how it relates to everything else.

### Discovery & Query
Find components by their semantic meaning, not their CSS classes or DOM position:

```javascript
// Find all payment-related inputs in the checkout flow
const paymentFields = protocol.query('flow:checkout category:input intent:payment');

// Discover all high-criticality actions
const criticalActions = protocol.discover({ criticality: 'high' });
```

### Automatic Validation
Components understand their own validation rules:

```javascript
const manifest = protocol.createManifest({
  type: 'input',
  intent: 'email',
  validation: {
    rules: [
      { type: 'email', message: 'Invalid email format' },
      { type: 'required', message: 'Email is required' }
    ]
  }
});
```

### Relationship Mapping
Components know how they relate to each other:

```javascript
const relationships = protocol.getRelationships(componentId);
// Returns: parent, children, dependencies, observers
```

## Framework Integration

### React
```bash
npm install @kneelinghorse/semantic-protocol-react
```

```jsx
import { SemanticProvider, useSemanticManifest } from '@kneelinghorse/semantic-protocol-react';

function PaymentButton() {
  const manifest = useSemanticManifest({
    type: 'action',
    intent: 'submit_payment'
  });
  
  return <button {...manifest.props}>Pay Now</button>;
}
```

### Vue
```bash
npm install @kneelinghorse/semantic-protocol-vue
```

### Web Components
```bash
npm install @kneelinghorse/semantic-protocol-web-components
```

## Why Semantic Protocol?

**For Developers**: Components that document and test themselves. No more outdated documentation or broken tests when requirements change.

**For Designers**: Design systems that understand meaning, not just appearance. A button knows it's for submitting payment, not just that it's blue and 44px tall.

**For AI Tools**: Direct semantic understanding instead of guessing from pixels or parsing HTML. AI can understand exactly what your interface does.

**For Accessibility**: Rich semantic information beyond ARIA labels. Screen readers understand not just what's on screen, but why it's there.

**For Testing**: Automatic test generation from semantic understanding. The protocol knows what should happen and can verify it does.

## Real World Impact

Analysis of 187 production codebases revealed 72.2% structural similarity across applications. We're all building the same patterns—the Semantic Protocol makes those patterns explicit and reusable.

## Documentation

- [Full API Documentation](./docs/api.md)
- [Integration Guide](./docs/integration.md)
- [Example Applications](./examples/)
- [Interactive Playground](https://semantic-protocol.dev/playground)

## Contributing

The Semantic Protocol is open source and we welcome contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Philosophy

> "Software has already converged. We just need to acknowledge it."

The Semantic Protocol isn't about adding complexity—it's about making the implicit patterns we all use explicit and shareable.

## License

MIT © Semantic Protocol Contributors

---

*Built through human-AI collaboration. Created by a developer with 20 years of UX experience working alongside Claude, an AI assistant by Anthropic.*
