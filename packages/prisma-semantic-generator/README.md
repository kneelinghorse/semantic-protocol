# Prisma Semantic Generator

[![npm version](https://img.shields.io/npm/v/@kneelinghorse/prisma-semantic-generator.svg)](https://www.npmjs.com/package/@kneelinghorse/prisma-semantic-generator)
[![npm downloads](https://img.shields.io/npm/dm/@kneelinghorse/prisma-semantic-generator.svg)](https://www.npmjs.com/package/@kneelinghorse/prisma-semantic-generator)
[![MIT license](https://img.shields.io/npm/l/@kneelinghorse/prisma-semantic-generator.svg)](https://github.com/semantic-protocol/semantic-protocol/blob/main/LICENSE)

Automatically analyze your Prisma schema and generate semantic mappings for every field. Know what your data means and how it should be displayed - automatically.

## What is this?

This Prisma generator analyzes your database schema and identifies the semantic meaning of each field:
- `email` fields → recognized as "email" semantic
- `account_balance` → recognized as "currency" 
- `is_cancelled` → recognized as "cancellation"
- `created_at` → recognized as "temporal"
- And many more patterns...

Each field gets:
- **Semantic type** (what the data means)
- **Confidence score** (how certain the detection is)
- **Render instructions** (how it should be displayed)
- **Field metadata** (required, unique, etc.)

## Installation

```bash
npm install --save-dev @kneelinghorse/prisma-semantic-generator
npm install @kneelinghorse/semantic-protocol
```

## Quick Start

### 1. Add to your Prisma schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

generator semantic {
  provider = "prisma-semantic-generator"
  output   = "./generated/semantic"
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  account_balance Decimal
  is_premium      Boolean
  cancelled_at    DateTime?
  created_at      DateTime @default(now())
}
```

### 2. Generate semantic mappings

```bash
npx prisma generate
```

### 3. Use in your application

```typescript
import { UserSemantics } from './generated/semantic';
import { getFieldSemantic, getHighConfidenceFields } from './generated/semantic';

// Access semantic information for each field
console.log(UserSemantics.email);
// {
//   semantic: 'email',
//   confidence: 95,
//   renderInstruction: { component: 'link', variant: 'email' },
//   isRequired: true,
//   isUnique: true
// }

// Get fields by semantic type
const currencyFields = getFieldsBySemanticType('User', 'currency');
// ['account_balance']

// Get high confidence detections
const confidentFields = getHighConfidenceFields('User', 90);
// ['id', 'email', 'account_balance', 'is_premium', 'cancelled_at', 'created_at']
```

## Generated Output

The generator creates two files:

### `semantics.json`
Raw semantic mappings in JSON format for easy consumption by any tool.

### `index.ts`
TypeScript interfaces and utilities with full type safety:

```typescript
export interface UserSemantics {
  email: {
    semantic: 'email' as SemanticType;
    confidence: 95;
    renderInstruction: { component: 'link', variant: 'email' };
    isRequired: true;
    isUnique: true;
    // ... more metadata
  };
  account_balance: {
    semantic: 'currency' as SemanticType;
    confidence: 95;
    renderInstruction: { component: 'text', variant: 'currency-full' };
    // ...
  };
  // ... all other fields
}
```

## Semantic Types

Currently recognizes these semantic patterns:

- **cancellation** - Termination, expiration, deletion patterns
- **currency** - Money, prices, financial amounts
- **temporal** - Dates, times, timestamps
- **premium** - Special tiers, elevated status
- **identifier** - IDs, UUIDs, keys
- **status** - States, conditions, phases
- **percentage** - Rates, ratios, percentages
- **email** - Email addresses
- **url** - Web links, URLs
- **danger** - Errors, warnings, critical states

## Real-World Example

Given this Prisma schema:

```prisma
model Order {
  id              String   @id
  order_number    String   @unique
  
  // Financial fields
  subtotal        Decimal
  tax_amount      Decimal
  total_amount    Decimal
  
  // Status fields
  order_status    String
  payment_status  String
  
  // Temporal fields
  ordered_at      DateTime @default(now())
  shipped_at      DateTime?
  cancelled_at    DateTime?
  
  // Cancellation
  is_cancelled    Boolean  @default(false)
}
```

The generator produces:

```typescript
// Automatic UI component selection
const field = OrderSemantics.total_amount;
if (field.semantic === 'currency') {
  return <CurrencyDisplay value={order.total_amount} />;
}

// Automatic form generation
const formFields = Object.entries(OrderSemantics).map(([name, semantic]) => {
  switch(semantic.renderInstruction.component) {
    case 'input':
      return <Input type={semantic.renderInstruction.variant} />;
    case 'select':
      return <Select options={getOptionsFor(name)} />;
    // ...
  }
});

// Automatic danger detection
const dangerFields = getFieldsBySemanticType('Order', 'cancellation');
if (dangerFields.some(field => order[field])) {
  showWarning('This order has been cancelled');
}
```

## CLI Usage

### Initialize in existing project

```bash
npx prisma-semantic init
```

This adds the generator block to your `schema.prisma`.

### Generate mappings

```bash
npx prisma generate
```

## Use with React

Combine with `@kneelinghorse/semantic-react` (coming soon) for automatic component selection:

```tsx
import { SemanticField } from '@kneelinghorse/semantic-react';
import { OrderSemantics } from './generated/semantic';

function OrderDetails({ order }) {
  return (
    <div>
      {Object.keys(OrderSemantics).map(field => (
        <SemanticField 
          key={field}
          semantic={OrderSemantics[field]}
          value={order[field]}
        />
      ))}
    </div>
  );
}
```

## Configuration

The generator uses sensible defaults, but you can customize the output path:

```prisma
generator semantic {
  provider = "prisma-semantic-generator"
  output   = "../src/generated/semantic"  // Custom output directory
}
```

## How It Works

1. **Parses your Prisma schema** using Prisma's DMMF (Data Model Meta Format)
2. **Analyzes each field** using the Semantic Protocol pattern matching
3. **Generates TypeScript types** with full type safety
4. **Exports utility functions** for runtime access

## Why Use This?

- **Zero manual mapping** - Automatic semantic detection
- **Type-safe** - Full TypeScript support
- **Framework agnostic** - Use with any UI framework
- **Confidence scores** - Know how certain the detection is
- **Render instructions** - Know how to display each field
- **Tiny runtime** - Uses `@kneelinghorse/semantic-protocol` (< 5KB)

## Contributing

We welcome contributions! The semantic patterns are constantly improving.

## License

MIT

## See Also

- [@kneelinghorse/semantic-protocol](https://www.npmjs.com/package/@kneelinghorse/semantic-protocol) - Core semantic engine
- [Semantic Protocol Documentation](https://github.com/semantic-protocol/semantic-protocol) - Full documentation

---

*Stop manually mapping database fields to UI components. Let semantics do it for you.*