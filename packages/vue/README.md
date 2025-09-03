# @semantic-protocol/vue

Vue 3 integration for the Semantic Protocol - Universal meaning recognition for data with automatic UI component generation.

[![npm version](https://badge.fury.io/js/%40semantic-protocol%2Fvue.svg)](https://badge.fury.io/js/%40semantic-protocol%2Fvue)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-green.svg)](https://vuejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🧠 **Automatic semantic analysis** of data fields and structures
- 🎨 **Smart UI component selection** based on semantic meaning
- ⚡ **Vue 3 Composition API** with full TypeScript support
- 🔄 **Reactive composables** for real-time analysis
- 📡 **Automatic field discovery** from data objects
- 🔗 **Relationship mapping** between semantic fields
- 🎯 **Custom directives** for seamless integration
- 🌟 **Nuxt 3 module** with auto-imports and SSR support
- 🎪 **Pinia integration** for state management
- ✅ **Comprehensive test coverage** with Vitest

## Installation

```bash
npm install @semantic-protocol/vue
# or
yarn add @semantic-protocol/vue
# or
pnpm add @semantic-protocol/vue
```

## Quick Start

### Basic Setup

```typescript
import { createApp } from 'vue'
import { SemanticProtocol } from '@semantic-protocol/vue'
import App from './App.vue'

const app = createApp(App)

app.use(SemanticProtocol, {
  confidenceThreshold: 70,
  autoAnalysis: true,
  enableDevTools: true,
  cacheResults: true
})

app.mount('#app')
```

### Using Composables

```vue
<template>
  <div>
    <h2>User Data Analysis</h2>
    <div v-for="result in results" :key="result.field" class="analysis-result">
      <strong>{{ result.field }}:</strong>
      <span v-if="result.bestMatch" class="semantic-badge">
        {{ result.bestMatch.semantic }} ({{ result.bestMatch.confidence }}%)
      </span>
      <component 
        :is="result.renderInstruction.component"
        :variant="result.renderInstruction.variant"
        :value="userData[result.field]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSemantics, useDiscovery } from '@semantic-protocol/vue'

const userData = ref({
  id: 'USR_001',
  email: 'john@example.com',
  monthly_price: 29.99,
  created_at: '2024-01-01T10:30:00Z',
  is_premium: true
})

const { analyzeSchema, results } = useSemantics()
const { discover } = useDiscovery()

onMounted(async () => {
  // Discover field definitions from data
  const fields = discover(userData.value)
  
  // Analyze semantic meaning
  await analyzeSchema(fields, 'list')
})
</script>
```

### Using Directives

```vue
<template>
  <form class="semantic-form">
    <!-- Automatic semantic analysis and styling -->
    <input 
      v-model="email"
      v-semantics.auto="{
        field: { name: 'email', type: 'string', value: email },
        context: 'form'
      }"
      placeholder="Enter your email"
    />
    
    <input 
      v-model="price"
      v-semantics.auto="{
        field: { name: 'monthly_price', type: 'decimal', value: price },
        context: 'form'
      }"
      type="number"
      placeholder="Monthly price"
    />
    
    <!-- Semantic references for advanced queries -->
    <button 
      type="submit"
      v-semantic-ref="{ ref: 'submit-button', semantic: 'status' }"
    >
      Submit
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const price = ref(0)
</script>

<style>
/* Automatic styling based on semantic analysis */
.semantic-email {
  border-left: 3px solid #3b82f6;
}

.semantic-currency {
  text-align: right;
  font-family: monospace;
}

.semantic-confidence-high {
  box-shadow: 0 0 0 2px #10b981;
}
</style>
```

## Components

### SemanticProvider

Provides semantic context to child components:

```vue
<template>
  <SemanticProvider :options="semanticOptions">
    <MyForm />
    <MyTable />
  </SemanticProvider>
</template>

<script setup lang="ts">
const semanticOptions = {
  confidenceThreshold: 80,
  autoAnalysis: true,
  enableDevTools: true
}
</script>
```

### SemanticBoundary

Error boundary for semantic analysis:

```vue
<template>
  <SemanticBoundary 
    fallback="Analysis failed"
    @error="handleError"
  >
    <SemanticTable :data="complexData" />
  </SemanticBoundary>
</template>
```

### SemanticTeleport

Portal component with semantic filtering:

```vue
<template>
  <SemanticTeleport 
    to="#semantic-sidebar"
    :semantic-filter="['premium', 'currency']"
  >
    <PremiumFeatures />
  </SemanticTeleport>
</template>
```

## Composables

### useSemantics

Core semantic analysis functionality:

```typescript
import { useSemantics } from '@semantic-protocol/vue'

const { 
  analyze,           // Analyze single field
  analyzeSchema,     // Analyze multiple fields
  results,           // Reactive analysis results
  isAnalyzing,       // Loading state
  error             // Error state
} = useSemantics()

// Analyze a single field
const result = analyze({
  name: 'user_email',
  type: 'string',
  value: 'john@example.com'
}, 'form')

// Analyze multiple fields
const results = analyzeSchema([
  { name: 'email', type: 'string', value: 'test@example.com' },
  { name: 'price', type: 'decimal', value: 29.99 }
], 'list')
```

### useDiscovery

Automatic field discovery from data:

```typescript
import { useDiscovery } from '@semantic-protocol/vue'

const { 
  discover,          // Discover fields from object
  fields,           // Discovered field definitions
  relationships,    // Field relationships
  isDiscovering    // Loading state
} = useDiscovery()

// Discover from single object
const fields = discover({
  id: 'USR_001',
  email: 'test@example.com',
  created_at: '2024-01-01T10:30:00Z'
})

// Discover from array (schema inference)
const fields = discoverFromArray([
  { id: 1, name: 'John', active: true },
  { id: 2, name: 'Jane', active: false }
])
```

### useRelationships

Analyze relationships between semantic fields:

```typescript
import { useRelationships } from '@semantic-protocol/vue'

const { 
  findRelationships,     // Find relationships in results
  relationships,         // Discovered relationships
  groupedResults        // Results grouped by semantic type
} = useRelationships()

// Find relationships between analysis results
const relationships = findRelationships(analysisResults)

// Access relationship types: 'composition', 'association', 'dependency', 'inheritance'
relationships.forEach(rel => {
  console.log(`${rel.from} → ${rel.to} (${rel.type}, ${rel.confidence}%)`)
})
```

## Directives

### v-semantics

Automatic semantic analysis and styling:

```vue
<!-- Basic usage -->
<input v-semantics />

<!-- With explicit field definition -->
<input v-semantics="{ 
  field: { name: 'email', type: 'string', value: email },
  context: 'form',
  onAnalysis: handleAnalysis
}" />

<!-- With modifiers -->
<input v-semantics.auto.cache.lazy />
```

**Modifiers:**
- `.auto` - Automatic re-analysis on value changes
- `.cache` - Enable result caching
- `.lazy` - Debounced analysis (300ms delay)

### v-semantic-ref

Register semantic references for advanced queries:

```vue
<!-- Register with semantic type -->
<button v-semantic-ref="{ 
  ref: 'submit-btn', 
  semantic: 'status',
  onRegister: handleRegistration 
}">
  Submit
</button>

<!-- Query registered references -->
<script setup>
import { semanticRefUtils } from '@semantic-protocol/vue'

// Find all currency-related elements
const currencyElements = semanticRefUtils.findRefsBySemantic('currency')

// Find elements by custom criteria
const premiumElements = semanticRefUtils.findRefsBy(
  (element, metadata) => metadata.className?.includes('premium')
)
</script>
```

## Nuxt 3 Module

### Installation

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@semantic-protocol/vue/nuxt'
  ],
  semanticProtocol: {
    confidenceThreshold: 70,
    autoAnalysis: true,
    autoImports: true,
    globalComponents: true,
    componentPrefix: 'Semantic',
    css: ['@semantic-protocol/vue/semantic-styles.css']
  }
})
```

### Auto-imports

The Nuxt module automatically imports composables:

```vue
<!-- No import needed! -->
<script setup lang="ts">
// Auto-imported composables
const { results } = useSemantics()
const { fields } = useDiscovery()
const { relationships } = useRelationships()
</script>
```

### Global Components

Components are automatically registered:

```vue
<template>
  <!-- Available globally -->
  <SemanticProvider>
    <SemanticBoundary>
      <MySemanticForm />
    </SemanticBoundary>
  </SemanticProvider>
</template>
```

## Pinia Integration

### State Management

```typescript
// stores/semantic.ts
import { defineStore } from 'pinia'
import { useSemanticStore } from '@semantic-protocol/vue/examples/SemanticStore'

export const useAppSemanticStore = defineStore('appSemantic', () => {
  const semanticStore = useSemanticStore()
  
  return {
    ...semanticStore,
    // Add custom methods
    analyzeUserProfile: async (profile: UserProfile) => {
      const fields = Object.entries(profile).map(([key, value]) => ({
        name: key,
        type: inferType(value),
        value
      }))
      
      return await semanticStore.analyzeSchema(fields, 'detail')
    }
  }
})
```

### Form Validation

```typescript
// stores/semanticForm.ts
import { useSemanticFormStore } from '@semantic-protocol/vue/examples/SemanticStore'

export const useFormStore = defineStore('form', () => {
  const { 
    formData, 
    formErrors, 
    validateField, 
    validateForm, 
    submitForm 
  } = useSemanticFormStore()
  
  return {
    formData,
    formErrors,
    validateField,
    validateForm,
    submitForm
  }
})
```

## Advanced Usage

### Custom Semantic Types

```typescript
// Extend the core protocol with custom types
import { SemanticProtocol } from '@semantic-protocol/core'

const customProtocol = new SemanticProtocol(70)

// Use with Vue components
app.use(SemanticProtocol, {
  protocol: customProtocol,
  confidenceThreshold: 80
})
```

### Performance Optimization

```typescript
// Reactive analysis with debouncing
const { results } = useReactiveSemantics(
  fieldsRef, 
  contextRef, 
  {
    immediate: false,
    debounce: 500  // 500ms debounce
  }
)

// Batch analysis for better performance
const results = await analyzeSchema(largeFieldArray, 'list')
```

### Custom Styling

```css
/* Semantic-aware CSS */
.semantic-currency {
  color: #059669;
  font-family: monospace;
  text-align: right;
}

.semantic-temporal {
  color: #7c3aed;
  font-size: 0.875rem;
}

.semantic-premium {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Confidence levels */
.semantic-confidence-high {
  border-left: 4px solid #10b981;
}

.semantic-confidence-medium {
  border-left: 4px solid #f59e0b;
}

.semantic-confidence-low {
  border-left: 4px solid #ef4444;
}
```

## Examples

Check out the comprehensive examples:

- **[SemanticForm.vue](./examples/SemanticForm.vue)** - Form with automatic semantic analysis
- **[SemanticTable.vue](./examples/SemanticTable.vue)** - Data table with semantic column analysis
- **[SemanticDashboard.vue](./examples/SemanticDashboard.vue)** - Complete dashboard with Pinia integration

## API Reference

### Types

```typescript
interface SemanticVueOptions {
  confidenceThreshold?: number    // Default: 70
  autoAnalysis?: boolean         // Default: false  
  enableDevTools?: boolean       // Default: true in dev
  cacheResults?: boolean         // Default: true
}

interface AnalysisResult {
  field: string
  dataType: DataType
  semantics: SemanticMatch[]
  bestMatch: SemanticMatch | null
  context: RenderContext
  renderInstruction: RenderInstruction
  metadata: AnalysisMetadata
}

interface SemanticRelationship {
  type: 'composition' | 'association' | 'dependency' | 'inheritance'
  from: string
  to: string
  semantic: SemanticType
  confidence: number
  metadata?: Record<string, any>
}
```

### Utilities

```typescript
import { semanticVueUtils } from '@semantic-protocol/vue'

// Generate CSS classes from analysis
const classes = semanticVueUtils.generateClasses(analysisResult)

// Generate data attributes
const attrs = semanticVueUtils.generateDataAttributes(analysisResult)

// Format values by semantic type
const formatted = semanticVueUtils.formatSemanticValue(29.99, 'currency')
// Returns: "$29.99"

// Create reactive field definitions
const field = semanticVueUtils.createReactiveField('email', 'test@example.com')
```

## Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## License

MIT © [Semantic Protocol Contributors](https://github.com/semantic-protocol)

## Changelog

### v1.0.0

- Initial release
- Vue 3 Composition API support
- Full TypeScript integration
- Nuxt 3 module
- Comprehensive test coverage
- Pinia state management integration
- Custom directives and components
- Automatic field discovery and analysis
- Relationship mapping
- Examples and documentation

---

For more information, visit the [Semantic Protocol Documentation](https://github.com/semantic-protocol/semantic-protocol) or check out the [live examples](./examples/).