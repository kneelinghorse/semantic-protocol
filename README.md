# Semantic Protocol 🧬

**A universal protocol for understanding what data means and how to display it.**

[![npm version](https://img.shields.io/npm/v/@kneelinghorse/semantic-protocol.svg)](https://www.npmjs.com/package/@kneelinghorse/semantic-protocol)
[![npm version](https://img.shields.io/npm/v/@kneelinghorse/prisma-semantic-generator.svg)](https://www.npmjs.com/package/@kneelinghorse/prisma-semantic-generator)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green)

## 🏆 Built with Claude Code

This project was built in collaboration with Claude Code, shipping:
- **2 npm packages** in one session
- **1000+ lines** of production TypeScript  
- **0 dependencies** in the core protocol
- **∞ possibilities** for UI automation

*AI pair programming at its finest.* 🚀

## What is this?

The Semantic Protocol automatically understands what your data means and how it should be displayed. No more manual mapping from database fields to UI components.

```typescript
// Your database field
{ name: 'account_balance', type: 'decimal' }

// Semantic Protocol understands
→ semantic: 'currency' (95% confidence)
→ render: 'currency-display'
→ UI: $1,299.99
```

## 📦 Packages

### Core Protocol
```bash
npm install @kneelinghorse/semantic-protocol
```

The core pattern matching engine that identifies semantic meaning in data.

### Prisma Generator
```bash
npm install -D @kneelinghorse/prisma-semantic-generator
```

Automatically analyzes your Prisma schema and generates semantic mappings.

## 🚀 Quick Start

### 1. Add to your Prisma schema

```prisma
generator semantic {
  provider = "prisma-semantic-generator"
  output   = "../src/generated/semantics"
}

model User {
  id                String   @id
  email             String   @unique
  account_balance   Decimal
  is_premium        Boolean
  cancelled_at      DateTime?
}
```

### 2. Generate semantic mappings

```bash
npx prisma generate
```

### 3. Use in your UI

```typescript
import { UserSemantics } from '@/generated/semantics'

// Automatically knows:
// - email → email input with validation
// - account_balance → currency display
// - is_premium → premium badge
// - cancelled_at → danger indicator
```

## 🎯 Problem It Solves

Traditional UI development:
```typescript
// ❌ Thousands of manual decisions
if (field === 'email') return <EmailInput />
if (field === 'price') return <CurrencyDisplay />
if (field === 'is_cancelled') return <DangerBadge />
// ... hundreds more conditions
```

With Semantic Protocol:
```typescript
// ✅ Automatic understanding
<SemanticField field={field} value={value} />
```

## 🧠 How It Works

1. **Pattern Matching**: Analyzes field names and types
2. **Confidence Scoring**: Assigns probability to each semantic match
3. **Context Awareness**: Different rendering for list/detail/form/timeline contexts
4. **Zero Dependencies**: Pure functions, works everywhere

## 📊 Supported Semantics

- 💰 **Currency** - Prices, balances, payments
- 📧 **Email** - Email addresses
- 🕐 **Temporal** - Dates, times, timestamps
- ⭐ **Premium** - Special tiers, subscriptions
- 🔑 **Identifier** - IDs, UUIDs, keys
- 📊 **Status** - States, conditions
- 📈 **Percentage** - Rates, ratios
- 🔗 **URL** - Links, websites
- ⚠️ **Danger** - Errors, failures, cancellations
- ❌ **Cancellation** - Terminated, expired states

## 🛠 Real-World Example

```typescript
// Your Prisma schema
model Product {
  id              String   @id
  name            String
  price           Decimal
  discount_rate   Float?
  stock_quantity  Int
  is_featured     Boolean
  product_url     String?
  error_count     Int
}

// Generated semantics
{
  id: { semantic: 'identifier', confidence: 95 },
  name: { semantic: 'text', confidence: 70 },
  price: { semantic: 'currency', confidence: 95 },
  discount_rate: { semantic: 'percentage', confidence: 90 },
  stock_quantity: { semantic: 'number', confidence: 70 },
  is_featured: { semantic: 'premium', confidence: 85 },
  product_url: { semantic: 'url', confidence: 95 },
  error_count: { semantic: 'danger', confidence: 85 }
}
```

## 🌟 The Vision

Semantic Protocol isn't just a library - it's a new layer of the web stack. Imagine:

- Every ORM exposing semantic hints
- Every API including semantic metadata
- Every UI framework understanding data meaning
- Zero manual data→UI decisions

## 🤝 Contributing

This is an active experiment. We'd love your help with:

- Additional semantic patterns
- Framework integrations (React, Vue, Svelte)
- More rendering contexts
- Domain-specific semantics (healthcare, finance, etc.)

## 📚 Documentation

- [Core Protocol Documentation](./README.md)
- [Prisma Generator Guide](./packages/prisma-semantic-generator/README.md)
- [TypeScript API Reference](./docs/api.md)
- [Examples](./examples/)

## 🚦 Roadmap

- [x] Core protocol implementation
- [x] TypeScript support
- [x] Prisma generator
- [ ] React component library
- [ ] Interactive playground
- [ ] VS Code extension
- [ ] GraphQL directives
- [ ] Domain-specific packs

## 📄 License

MIT - Use it, fork it, improve it.

---

*"The future isn't more code. It's code that understands."*

Built with ❤️ and Claude Code