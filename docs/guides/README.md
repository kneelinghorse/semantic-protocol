# Integration Guides

Learn how to integrate the Semantic Protocol with your favorite framework or tool.

## 📚 Available Guides

### Frontend Frameworks

#### [React Integration](./react.md)
Complete guide for using Semantic Protocol with React, including hooks, components, and best practices.

#### [Vue Integration](./vue.md)
Learn how to use Semantic Protocol with Vue 2 and Vue 3, including composables and directives.

#### [Angular Integration](./angular.md)
Integrate Semantic Protocol with Angular using services, directives, and dependency injection.

#### [Web Components](./web-components.md)
Use Semantic Protocol with native Web Components for framework-agnostic implementations.

### Development Tools

#### [Prisma Generator](./prisma.md)
Automatically generate semantic manifests from your Prisma schema for database-driven components.

#### [CLI Tools](./cli.md)
Command-line utilities for generating, validating, and managing semantic components.

#### [VS Code Extension](./vscode-extension.md)
Enhanced development experience with IntelliSense, validation, and code generation.

#### [Browser DevTools](./devtools.md)
Debug and inspect semantic components directly in your browser.

## 🚀 Quick Integration

### React Quick Start

```jsx
import { SemanticProvider, useSemanticProtocol } from '@semantic-protocol/react';

function App() {
  return (
    <SemanticProvider>
      <MyComponent />
    </SemanticProvider>
  );
}

function MyComponent() {
  const { register, query } = useSemanticProtocol();
  // Use protocol methods
}
```

### Vue Quick Start

```vue
<template>
  <div>{{ components }}</div>
</template>

<script setup>
import { useSemanticProtocol } from '@semantic-protocol/vue';

const { register, query } = useSemanticProtocol();
const components = query({ element: { type: 'input' } });
</script>
```

### Angular Quick Start

```typescript
import { SemanticProtocolService } from '@semantic-protocol/angular';

@Component({
  selector: 'app-component',
  template: '...'
})
export class AppComponent {
  constructor(private semantic: SemanticProtocolService) {
    // Use service methods
  }
}
```

## 🎯 Choosing the Right Integration

### Framework Comparison

| Framework | Package | Size | Best For |
|-----------|---------|------|----------|
| React | `@semantic-protocol/react` | ~15KB | Modern React apps with hooks |
| Vue 3 | `@semantic-protocol/vue` | ~15KB | Composition API apps |
| Vue 2 | `@semantic-protocol/vue@2` | ~18KB | Legacy Vue apps |
| Angular | `@semantic-protocol/angular` | ~18KB | Enterprise Angular apps |
| Web Components | `@semantic-protocol/web-components` | ~20KB | Framework-agnostic |

### Feature Support Matrix

| Feature | React | Vue | Angular | Web Components |
|---------|-------|-----|---------|----------------|
| Hooks/Composables | ✅ | ✅ | ✅ | ❌ |
| Components | ✅ | ✅ | ✅ | ✅ |
| Directives | ❌ | ✅ | ✅ | ❌ |
| SSR Support | ✅ | ✅ | ✅ | ⚠️ |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| Dev Tools | ✅ | ✅ | ✅ | ✅ |

## 🔧 Common Integration Patterns

### Provider Pattern

Most frameworks use a provider pattern to make the protocol available:

```jsx
// React
<SemanticProvider config={config}>
  <App />
</SemanticProvider>

// Vue
app.use(SemanticProtocolPlugin, config)

// Angular
SemanticProtocolModule.forRoot(config)
```

### Hooks/Composables Pattern

Access protocol methods through framework-specific hooks:

```javascript
// React Hook
const { register, query, validate } = useSemanticProtocol();

// Vue Composable  
const { register, query, validate } = useSemanticProtocol();

// Angular Service
constructor(private semantic: SemanticProtocolService) {}
```

### Component Registration Pattern

Register components in lifecycle methods:

```javascript
// React
useEffect(() => {
  register(manifest);
}, []);

// Vue
onMounted(() => {
  register(manifest);
});

// Angular
ngOnInit() {
  this.semantic.register(manifest);
}
```

## 🎨 Custom Integrations

### Creating Your Own Integration

If your framework isn't supported, you can create a custom integration:

```javascript
import { SemanticProtocol } from '@semantic-protocol/core';

// 1. Create protocol instance
const protocol = new SemanticProtocol(config);

// 2. Make it available to your framework
export function useSemanticProtocol() {
  return protocol;
}

// 3. Handle lifecycle
function cleanup() {
  protocol.clear();
}
```

### Integration Requirements

Your custom integration should:
1. **Initialize** - Create and configure protocol instance
2. **Provide** - Make protocol available to components
3. **Lifecycle** - Handle component mount/unmount
4. **Cleanup** - Remove components when needed
5. **TypeScript** - Provide type definitions

## 🚦 Migration Between Frameworks

### Shared Manifests

Manifests are framework-agnostic and can be shared:

```javascript
// shared/manifests.js
export const emailInput = {
  protocol: 'semantic-ui/v2',
  element: {
    type: 'input',
    intent: 'capture email'
  }
};

// React component
import { emailInput } from './shared/manifests';
register(emailInput);

// Vue component
import { emailInput } from './shared/manifests';
register(emailInput);
```

### Cross-Framework Communication

Components can communicate across frameworks:

```javascript
// React component emits
protocol.emit('user:login', { userId: 123 });

// Vue component listens
protocol.on('user:login', (data) => {
  console.log('User logged in:', data.userId);
});
```

## 📚 Integration Resources

### Tutorials
- [Building a React App](../examples/react-app.md)
- [Vue 3 Composition API](../examples/vue-composition.md)
- [Angular Enterprise App](../examples/angular-enterprise.md)

### Examples
- [React Examples](https://github.com/semantic-protocol/examples/tree/main/react)
- [Vue Examples](https://github.com/semantic-protocol/examples/tree/main/vue)
- [Angular Examples](https://github.com/semantic-protocol/examples/tree/main/angular)

### Support
- [Discord Community](https://discord.gg/semantic-protocol)
- [GitHub Discussions](https://github.com/semantic-protocol/core/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/semantic-protocol)

## 🔍 Next Steps

Choose your framework guide:

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 30px;">
  <a href="./react.md" style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-decoration: none;">
    <h3>React</h3>
    <p>Hooks, components, and patterns</p>
  </a>
  
  <a href="./vue.md" style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-decoration: none;">
    <h3>Vue</h3>
    <p>Composables and directives</p>
  </a>
  
  <a href="./angular.md" style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-decoration: none;">
    <h3>Angular</h3>
    <p>Services and dependency injection</p>
  </a>
  
  <a href="./web-components.md" style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-decoration: none;">
    <h3>Web Components</h3>
    <p>Framework-agnostic components</p>
  </a>
</div>

---

<div align="center">
  <strong>Need help choosing?</strong><br>
  <a href="../getting-started/quick-start.md">See Quick Start Guide →</a>
</div>