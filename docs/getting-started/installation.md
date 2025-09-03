# Installation Guide

This guide covers installing the Semantic Protocol in various environments and frameworks.

## 📦 Package Overview

The Semantic Protocol is modular - install only what you need:

| Package | Description | Size |
|---------|-------------|------|
| `@semantic-protocol/core` | Core protocol implementation | ~25KB |
| `@semantic-protocol/react` | React hooks and components | ~15KB |
| `@semantic-protocol/vue` | Vue composables and directives | ~15KB |
| `@semantic-protocol/angular` | Angular services and directives | ~18KB |
| `@semantic-protocol/web-components` | Native web components | ~20KB |
| `@semantic-protocol/cli` | Command-line tools | ~35KB |
| `@semantic-protocol/devtools` | Browser extension | ~45KB |

## 🔧 Installation Methods

### NPM (Recommended)

```bash
# Core package
npm install @semantic-protocol/core

# With framework support
npm install @semantic-protocol/core @semantic-protocol/react
```

### Yarn

```bash
# Core package
yarn add @semantic-protocol/core

# With framework support
yarn add @semantic-protocol/core @semantic-protocol/vue
```

### PNPM

```bash
# Core package
pnpm add @semantic-protocol/core

# With framework support
pnpm add @semantic-protocol/core @semantic-protocol/angular
```

### CDN

For quick prototyping or legacy applications:

```html
<!-- Core -->
<script src="https://cdn.jsdelivr.net/npm/@semantic-protocol/core@latest/dist/semantic-protocol.min.js"></script>

<!-- React -->
<script src="https://cdn.jsdelivr.net/npm/@semantic-protocol/react@latest/dist/semantic-protocol-react.min.js"></script>
```

## 🎯 Framework-Specific Setup

### React

#### 1. Install packages
```bash
npm install @semantic-protocol/core @semantic-protocol/react
```

#### 2. Setup provider
```jsx
// index.js or App.js
import { SemanticProvider } from '@semantic-protocol/react';

function App() {
  return (
    <SemanticProvider config={{
      debug: true,
      validation: { async: true }
    }}>
      {/* Your app components */}
    </SemanticProvider>
  );
}
```

#### 3. TypeScript configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@semantic-protocol/react"]
  }
}
```

### Vue 3

#### 1. Install packages
```bash
npm install @semantic-protocol/core @semantic-protocol/vue
```

#### 2. Register plugin
```javascript
// main.js
import { createApp } from 'vue';
import { SemanticProtocolPlugin } from '@semantic-protocol/vue';
import App from './App.vue';

const app = createApp(App);

app.use(SemanticProtocolPlugin, {
  debug: true,
  validation: { async: true }
});

app.mount('#app');
```

#### 3. TypeScript support
```typescript
// env.d.ts
/// <reference types="@semantic-protocol/vue" />
```

### Vue 2

#### 1. Install packages
```bash
npm install @semantic-protocol/core @semantic-protocol/vue@2
```

#### 2. Register plugin
```javascript
// main.js
import Vue from 'vue';
import { SemanticProtocolPlugin } from '@semantic-protocol/vue';

Vue.use(SemanticProtocolPlugin, {
  debug: true
});

new Vue({
  render: h => h(App)
}).$mount('#app');
```

### Angular

#### 1. Install packages
```bash
npm install @semantic-protocol/core @semantic-protocol/angular
```

#### 2. Import module
```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { SemanticProtocolModule } from '@semantic-protocol/angular';

@NgModule({
  imports: [
    SemanticProtocolModule.forRoot({
      debug: true,
      validation: { async: true }
    })
  ]
})
export class AppModule { }
```

#### 3. Configure service
```typescript
// app.component.ts
import { SemanticProtocolService } from '@semantic-protocol/angular';

export class AppComponent {
  constructor(private semantic: SemanticProtocolService) {
    // Service is ready to use
  }
}
```

### Next.js

#### 1. Install packages
```bash
npm install @semantic-protocol/core @semantic-protocol/react
```

#### 2. Create provider wrapper
```jsx
// pages/_app.js
import { SemanticProvider } from '@semantic-protocol/react';

function MyApp({ Component, pageProps }) {
  return (
    <SemanticProvider 
      config={{
        ssr: true,
        hydration: true
      }}
    >
      <Component {...pageProps} />
    </SemanticProvider>
  );
}

export default MyApp;
```

#### 3. Server-side configuration
```javascript
// next.config.js
module.exports = {
  transpilePackages: ['@semantic-protocol/core', '@semantic-protocol/react']
};
```

### Vanilla JavaScript

#### 1. Install or include via CDN
```bash
npm install @semantic-protocol/core
```

#### 2. Initialize
```javascript
import { SemanticProtocol } from '@semantic-protocol/core';

const protocol = new SemanticProtocol({
  debug: true,
  validation: { async: true }
});

// Register components
protocol.register({
  protocol: 'semantic-ui/v2',
  element: {
    type: 'input',
    intent: 'user input'
  }
});
```

## 🛠️ Development Tools

### VS Code Extension

```bash
# Install from marketplace
code --install-extension semantic-protocol.vscode

# Or search for "Semantic Protocol" in VS Code
```

Features:
- Syntax highlighting
- IntelliSense
- Validation
- Quick fixes

### Browser DevTools

#### Chrome/Edge
1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Semantic Protocol DevTools"
3. Click "Add to Chrome"

#### Firefox
1. Visit [Firefox Add-ons](https://addons.mozilla.org)
2. Search for "Semantic Protocol DevTools"
3. Click "Add to Firefox"

### CLI Tools

```bash
# Global installation
npm install -g @semantic-protocol/cli

# Verify installation
semantic --version

# Get help
semantic --help
```

## 🔍 Configuration

### Basic Configuration

```javascript
// semantic.config.js
module.exports = {
  // Protocol version
  version: '2.0.0',
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
  
  // Validation settings
  validation: {
    async: true,
    timeout: 5000,
    strict: true
  },
  
  // Discovery settings
  discovery: {
    cache: true,
    cacheTimeout: 60000,
    indexing: true
  },
  
  // Performance settings
  performance: {
    lazy: true,
    batch: true,
    throttle: 100
  }
};
```

### Environment Variables

```bash
# .env
SEMANTIC_PROTOCOL_DEBUG=true
SEMANTIC_PROTOCOL_VERSION=2.0.0
SEMANTIC_PROTOCOL_CACHE=true
SEMANTIC_PROTOCOL_VALIDATION_TIMEOUT=5000
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@semantic-protocol/core"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## 📱 Platform-Specific Notes

### React Native

```bash
npm install @semantic-protocol/core @semantic-protocol/react-native
```

Additional setup:
```bash
# iOS
cd ios && pod install

# Android - no additional steps needed
```

### Electron

```javascript
// main.js (main process)
const { SemanticProtocolMain } = require('@semantic-protocol/electron');

SemanticProtocolMain.initialize();

// renderer.js (renderer process)
const { SemanticProtocol } = require('@semantic-protocol/core');
```

### Web Workers

```javascript
// worker.js
importScripts('https://cdn.jsdelivr.net/npm/@semantic-protocol/core@latest/dist/semantic-protocol.worker.min.js');

const protocol = new SemanticProtocol();
```

## 🔄 Migration from v1.x

If upgrading from version 1.x:

```bash
# Install migration tool
npm install -g @semantic-protocol/migrate

# Run migration
semantic-migrate --from 1.x --to 2.0

# Review changes
semantic-migrate --dry-run
```

See [Migration Guide](../reference/migration.md) for details.

## ✅ Verify Installation

Run this script to verify your installation:

```javascript
// verify-installation.js
const { SemanticProtocol } = require('@semantic-protocol/core');

const protocol = new SemanticProtocol();

// Test registration
const result = protocol.register({
  protocol: 'semantic-ui/v2',
  element: {
    type: 'input',
    intent: 'test'
  }
});

console.log('Installation verified:', result.success);
console.log('Version:', protocol.version);
```

Run:
```bash
node verify-installation.js
```

## 🐛 Troubleshooting

### Common Issues

#### Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript errors
```bash
# Install type definitions
npm install --save-dev @types/node
```

#### Build errors
```bash
# Check Node version
node --version  # Should be 14.0+

# Update dependencies
npm update
```

### Getting Help

- Check [Troubleshooting Guide](../reference/troubleshooting.md)
- Search [GitHub Issues](https://github.com/semantic-protocol/core/issues)
- Ask in [Discord](https://discord.gg/semantic-protocol)

## 📊 System Requirements

### Minimum Requirements
- Node.js 14.0+
- npm 6.0+ or yarn 1.22+
- 50MB free disk space

### Recommended
- Node.js 18.0+
- npm 8.0+ or yarn 3.0+
- 100MB free disk space
- TypeScript 4.5+

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

<div align="center">
  <strong>Installation complete?</strong><br>
  <a href="./quick-start.md">Continue to Quick Start →</a>
</div>