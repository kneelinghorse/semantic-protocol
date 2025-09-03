# Getting Started with Semantic Protocol

Welcome! This guide will help you get up and running with the Semantic Protocol in just a few minutes.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** 14.0 or higher
- **npm** or **yarn** package manager
- Basic knowledge of JavaScript/TypeScript
- Familiarity with your chosen framework (React, Vue, Angular, etc.)

## 🚀 Quick Installation

### Core Package

```bash
# Using npm
npm install @semantic-protocol/core

# Using yarn
yarn add @semantic-protocol/core
```

### Framework-Specific Packages

Choose the package for your framework:

```bash
# React
npm install @semantic-protocol/react

# Vue
npm install @semantic-protocol/vue

# Angular
npm install @semantic-protocol/angular

# Web Components
npm install @semantic-protocol/web-components
```

## 📖 Guide Contents

1. **[Installation](./installation.md)** - Detailed installation instructions
2. **[Quick Start](./quick-start.md)** - Build your first semantic app
3. **[First Component](./first-component.md)** - Create a semantic component
4. **[Basic Examples](./basic-examples.md)** - Common use cases

## ⚡ 5-Minute Quick Start

Here's the fastest way to see the Semantic Protocol in action:

### 1. Install Dependencies

```bash
npm install @semantic-protocol/core @semantic-protocol/react
```

### 2. Create Your First Semantic Component

```jsx
// App.jsx
import React from 'react';
import { SemanticProvider, useSemanticProtocol } from '@semantic-protocol/react';

function EmailInput() {
  const { register, validate } = useSemanticProtocol();

  React.useEffect(() => {
    register({
      id: 'email-input',
      protocol: 'semantic-ui/v2',
      element: {
        type: 'input',
        intent: 'capture user email',
        label: 'Email Address'
      },
      validation: {
        rules: [
          { type: 'required', message: 'Email is required' },
          { type: 'email', message: 'Invalid email format' }
        ]
      }
    });
  }, []);

  const handleChange = async (e) => {
    const result = await validate('email-input', e.target.value);
    console.log('Validation result:', result);
  };

  return (
    <input
      type="email"
      placeholder="Enter your email"
      onChange={handleChange}
    />
  );
}

function App() {
  return (
    <SemanticProvider>
      <div>
        <h1>Semantic Protocol Demo</h1>
        <EmailInput />
      </div>
    </SemanticProvider>
  );
}

export default App;
```

### 3. Run Your App

```bash
npm start
```

That's it! You now have a semantic component that:
- ✅ Self-describes its purpose
- ✅ Validates input automatically
- ✅ Can be discovered by semantic queries
- ✅ Integrates with your React app

## 🎯 What You'll Learn

By following this guide, you'll understand how to:

### Basic Concepts
- Register semantic components
- Define component intent and purpose
- Set up validation rules
- Query components semantically

### Advanced Features
- Create component relationships
- Implement context-aware behavior
- Build multi-step flows
- Optimize performance

### Best Practices
- Structure semantic manifests
- Handle validation errors
- Manage component lifecycle
- Debug semantic components

## 🏗️ Project Structure

A typical Semantic Protocol project looks like this:

```
my-app/
├── src/
│   ├── components/
│   │   ├── semantic/       # Semantic component definitions
│   │   │   ├── forms/
│   │   │   ├── navigation/
│   │   │   └── display/
│   │   └── ui/             # UI component implementations
│   ├── protocols/          # Protocol configurations
│   │   ├── manifests/
│   │   └── validators/
│   ├── hooks/              # Custom semantic hooks
│   └── App.js
├── package.json
└── semantic.config.js      # Protocol configuration
```

## 🔍 Core Concepts Preview

The Semantic Protocol revolves around these key concepts:

### 1. **Manifest** - Component description
```javascript
{
  protocol: 'semantic-ui/v2',
  element: {
    type: 'input',
    intent: 'capture data',
    label: 'User Input'
  }
}
```

### 2. **Registration** - Making components discoverable
```javascript
protocol.register(manifest);
```

### 3. **Discovery** - Finding components
```javascript
const inputs = protocol.query({ 
  element: { type: 'input' } 
});
```

### 4. **Validation** - Ensuring data integrity
```javascript
const result = await protocol.validate(id, value);
```

## 🛠️ Development Tools

### VS Code Extension
Install our VS Code extension for:
- IntelliSense for semantic manifests
- Validation and error checking
- Quick fixes and refactoring

```bash
code --install-extension semantic-protocol.vscode
```

### Browser DevTools
Debug semantic components in the browser:
- Component inspector
- Relationship visualizer
- Performance profiler

### CLI Tools
Command-line utilities for development:

```bash
# Install globally
npm install -g @semantic-protocol/cli

# Generate components
semantic generate component --type input --name email

# Validate manifests
semantic validate ./src/manifests

# Analyze relationships
semantic analyze --graph
```

## 📚 Next Steps

Now that you have a basic understanding:

1. **[Deep Dive into Installation](./installation.md)** - Platform-specific setup
2. **[Follow the Quick Start](./quick-start.md)** - Build a complete example
3. **[Learn Core Concepts](../core-concepts/README.md)** - Understand the protocol
4. **[Explore Examples](../examples/README.md)** - See real implementations

## 🆘 Getting Help

If you run into issues:

- Check the [Troubleshooting Guide](../reference/troubleshooting.md)
- Search [existing issues](https://github.com/semantic-protocol/core/issues)
- Ask in our [Discord community](https://discord.gg/semantic-protocol)
- Review the [FAQ](../reference/faq.md)

## 💡 Tips for Success

1. **Start Small**: Begin with simple components before complex relationships
2. **Use TypeScript**: Get better IDE support and type safety
3. **Follow Conventions**: Use consistent naming and structure
4. **Test Early**: Validate your manifests as you build
5. **Join the Community**: Learn from others' experiences

---

<div align="center">
  <strong>Ready to dive deeper?</strong><br>
  <a href="./installation.md">Continue to Installation →</a>
</div>