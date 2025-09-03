# @semantic-protocol/web-components

Framework-agnostic Web Components for the Semantic Protocol with Shadow DOM encapsulation.

## Features

- 🎯 **Native Web Components** - Works with any framework or vanilla JavaScript
- 🔒 **Shadow DOM** - Encapsulated styles and DOM structure  
- 🌐 **Cross-Framework** - React, Vue, Angular, Svelte adapters included
- 📦 **CDN Ready** - Use via CDN or npm package
- 🎨 **Customizable** - Override styles and extend functionality
- ♿ **Accessible** - ARIA compliant with keyboard navigation
- 📱 **Responsive** - Mobile-first responsive design
- 🚀 **Lightweight** - ~15KB gzipped with zero dependencies

## Installation

### NPM
```bash
npm install @semantic-protocol/web-components
```

### CDN
```html
<!-- Auto-initializing version -->
<script src="https://unpkg.com/@semantic-protocol/web-components/dist/semantic-components.auto.js"></script>

<!-- Manual initialization -->
<script src="https://unpkg.com/@semantic-protocol/web-components/dist/semantic-components.umd.js"></script>
<script>
  SemanticComponents.defineElements();
</script>
```

## Quick Start

### Vanilla JavaScript
```html
<semantic-provider debug="true">
  <semantic-field
    type="email"
    name="email"
    label="Email Address"
    required
  ></semantic-field>
  
  <semantic-discovery
    type="input"
    display-mode="grid"
  ></semantic-discovery>
</semantic-provider>

<script type="module">
  import '@semantic-protocol/web-components';
  
  const field = document.querySelector('semantic-field');
  field.addEventListener('semantic-change', (e) => {
    console.log('Value:', e.detail.value);
  });
</script>
```

### React
```jsx
import '@semantic-protocol/web-components';

function App() {
  return (
    <semantic-provider>
      <semantic-field
        type="email"
        name="email"
        label="Email"
        required
        onSemanticChange={(e) => console.log(e.detail.value)}
      />
    </semantic-provider>
  );
}
```

### Vue 3
```vue
<template>
  <semantic-provider>
    <semantic-field
      v-model="email"
      type="email"
      name="email"
      label="Email"
      :required="true"
      @semantic-change="handleChange"
    />
  </semantic-provider>
</template>

<script setup>
import '@semantic-protocol/web-components';
import { ref } from 'vue';

const email = ref('');
const handleChange = (e) => console.log(e.detail.value);
</script>
```

## Components

### `<semantic-provider>`

Root component that provides semantic context and registry.

```html
<semantic-provider 
  debug="true"
  auto-discover="true"
  validation-mode="strict"
>
  <!-- Child components -->
</semantic-provider>
```

**Attributes:**
- `debug` - Show debug panel with registry info
- `auto-discover` - Auto-discover existing semantic elements
- `validation-mode` - Validation strictness: `strict`, `loose`, `none`

**Methods:**
- `discover(query)` - Find components by semantic query
- `getRegistry()` - Get all registered components
- `getRelationships()` - Get component relationships

### `<semantic-field>`

Form field with built-in validation and semantic awareness.

```html
<semantic-field
  type="email"
  name="email"
  label="Email Address"
  value="user@example.com"
  required
  disabled
  readonly
  error="Invalid email"
  hint="Enter your email"
  minlength="5"
  maxlength="100"
  pattern=".*@.*"
></semantic-field>
```

**Attributes:**
- `type` - Field type: `text`, `email`, `password`, `number`, `tel`, `url`, `date`, `textarea`, `select`
- `name` - Field name for form submission
- `label` - Field label text
- `value` - Field value
- `required` - Required field flag
- `disabled` - Disabled state
- `readonly` - Read-only state
- `error` - Error message to display
- `hint` - Helper text
- Validation: `minlength`, `maxlength`, `min`, `max`, `pattern`

**Methods:**
- `validate()` - Validate field and return boolean
- `getValue()` - Get current value
- `setValue(value)` - Set field value
- `reset()` - Reset field to initial state

**Properties:**
- `value` - Current value
- `valid` - Validation state
- `errors` - Array of validation errors

**Events:**
- `semantic-input` - Fired on input
- `semantic-change` - Fired on change
- `semantic-blur` - Fired on blur
- `semantic-focus` - Fired on focus
- `semantic-validate` - Fired after validation

### `<semantic-discovery>`

Component discovery and visualization.

```html
<semantic-discovery
  query='{"type": "input"}'
  type="input"
  intent="collect-data"
  tags="form,registration"
  display-mode="grid"
  auto-refresh="5000"
></semantic-discovery>
```

**Attributes:**
- `query` - JSON query string or selector
- `type` - Filter by element type
- `intent` - Filter by element intent
- `tags` - Comma-separated tags to filter
- `display-mode` - Display mode: `list`, `grid`
- `auto-refresh` - Auto-refresh interval in milliseconds

**Methods:**
- `refresh()` - Refresh discovery results
- `clear()` - Clear results
- `getResults()` - Get current results array

**Events:**
- `semantic-discovery-complete` - Fired when discovery completes
- `semantic-inspect` - Fired when inspecting a component
- `semantic-highlight` - Fired when highlighting a component

## Framework Adapters

### React Wrapper
```jsx
import { createFrameworkWrapper } from '@semantic-protocol/web-components';
import { SemanticField } from '@semantic-protocol/web-components';

const SemanticFieldReact = createFrameworkWrapper(SemanticField, 'react');

function Form() {
  const [value, setValue] = useState('');
  
  return (
    <SemanticFieldReact
      type="email"
      value={value}
      onChange={(e) => setValue(e.detail.value)}
    />
  );
}
```

### Vue Wrapper
```javascript
import { createFrameworkWrapper } from '@semantic-protocol/web-components';
import { SemanticField } from '@semantic-protocol/web-components';

export default {
  components: {
    SemanticField: createFrameworkWrapper(SemanticField, 'vue')
  }
};
```

## Styling

### CSS Custom Properties
```css
semantic-field {
  --field-border-color: #ddd;
  --field-focus-color: #2196F3;
  --field-error-color: #e53935;
  --field-border-radius: 4px;
  --field-padding: 0.75rem;
}
```

### Override Shadow DOM Styles
```javascript
class CustomField extends SemanticField {
  defaultStyles() {
    return `
      ${super.defaultStyles()}
      .field-input {
        background: #f0f0f0;
      }
    `;
  }
}
```

## TypeScript Support

```typescript
import {
  SemanticProvider,
  SemanticField,
  SemanticDiscovery,
  SemanticElement
} from '@semantic-protocol/web-components';

// Type-safe element queries
const field = document.querySelector<SemanticField>('semantic-field');
if (field) {
  const value: string = field.value;
  const valid: boolean = field.valid;
  const errors: string[] = field.errors;
}

// Extend for custom elements
class CustomElement extends SemanticElement {
  getManifest(): SemanticManifest {
    return {
      protocol: 'semantic-ui/v2',
      element: { type: 'custom' }
    };
  }
  
  render(): string {
    return '<div>Custom content</div>';
  }
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Polyfills available for older browsers via [@webcomponents/webcomponentsjs](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs).

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Links

- [Documentation](https://semantic-protocol.org/web-components)
- [GitHub](https://github.com/semantic-protocol/web-components)
- [NPM](https://www.npmjs.com/package/@semantic-protocol/web-components)