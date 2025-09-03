# 🧬 Semantic Protocol React

**Self-aware UI components that automatically understand your data and render the right interface.**

[![npm version](https://img.shields.io/npm/v/@kneelinghorse/semantic-protocol-react.svg)](https://www.npmjs.com/package/@kneelinghorse/semantic-protocol-react)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)

## 🚀 What is this?

The Semantic Protocol React package brings the power of automatic UI generation to React applications. Instead of manually mapping database fields to UI components, your components automatically understand what data means and render the appropriate interface.

```tsx
// ❌ Before: Manual component selection
if (field === 'email') return <EmailInput />
if (field === 'price') return <CurrencyDisplay />
if (field === 'is_cancelled') return <DangerBadge />

// ✅ After: Automatic understanding
<SemanticField field="user_email" value="john@example.com" />
<SemanticField field="total_price" value={1299.99} />
<SemanticField field="subscription_cancelled_at" value={new Date()} />
```

## ✨ Features

- **🎯 Automatic Component Selection** - Fields automatically render the right UI component
- **🧠 Semantic Intelligence** - Understands field names, types, and values
- **📝 Auto-Generated Forms** - Complete forms from field definitions
- **📊 Smart Data Tables** - Tables with semantic-aware columns
- **🎣 Powerful Hooks** - Real-time semantic analysis with state management
- **🎨 Context-Aware Rendering** - Different UIs for list/detail/form/timeline
- **⚡ Zero Dependencies** - Lightweight and fast
- **🔒 Full TypeScript** - Complete type safety

## 🚀 Quick Start

### Installation

```bash
npm install @kneelinghorse/semantic-protocol-react @kneelinghorse/semantic-protocol
```

### Basic Usage

```tsx
import { SemanticField, SemanticProvider } from '@kneelinghorse/semantic-protocol-react';

function App() {
  return (
    <SemanticProvider>
      <div>
        {/* Automatically renders as email input */}
        <SemanticField field="user_email" value="john@example.com" context="form" />
        
        {/* Automatically renders as currency display */}
        <SemanticField field="total_price" value={1299.99} context="detail" />
        
        {/* Automatically renders as status badge */}
        <SemanticField field="is_premium" value={true} context="list" />
      </div>
    </SemanticProvider>
  );
}
```

## 🎯 Core Components

### SemanticField

The heart of the system - automatically renders the right component for any field.

```tsx
<SemanticField
  field="account_balance"
  value={1299.99}
  context="detail"
  showDebug={true}
/>
```

**Features:**
- Automatic component selection based on semantic analysis
- Context-aware rendering (list/detail/form/timeline)
- Built-in error handling and fallbacks
- Debug mode for development
- Custom component overrides

### SemanticForm

Automatically generates complete forms from field definitions.

```tsx
const fields = [
  { name: 'email', type: 'string', description: 'User email' },
  { name: 'is_premium', type: 'boolean', description: 'Premium status' },
  { name: 'account_balance', type: 'decimal', description: 'Balance' }
];

<SemanticForm
  fields={fields}
  onSubmit={handleSubmit}
  layout="grid"
  groupBySemantic={true}
  showLabels={true}
  showDescriptions={true}
/>
```

**Features:**
- Automatic form generation from field definitions
- Semantic grouping of related fields
- Built-in validation and error handling
- Custom field renderers
- Multiple layout options (grid, stack, auto)

### SemanticTable

Smart data tables with semantic-aware columns.

```tsx
<SemanticTable
  fields={fields}
  data={userData}
  context="list"
  sortable={true}
  filterable={true}
  paginated={true}
  selectable={true}
  onRowClick={handleRowClick}
/>
```

**Features:**
- Automatic column rendering based on semantic analysis
- Built-in sorting, filtering, and pagination
- Row selection and bulk actions
- Custom column renderers
- Responsive design

## 🎣 Powerful Hooks

### useSemanticField

Real-time semantic analysis with state management.

```tsx
const emailField = useSemanticField({
  field: 'email',
  value: 'user@example.com',
  context: 'form',
  validation: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  realTime: true
});

// Access semantic analysis
console.log(emailField.semanticType); // 'email'
console.log(emailField.confidence); // 95
console.log(emailField.isValid); // true
console.log(emailField.validationErrors); // []

// Update value
emailField.setValue('new@email.com');
```

**Features:**
- Real-time semantic analysis
- Built-in validation
- Error handling and state management
- Utility functions for common operations
- Debounced or real-time updates

### useSemantics

Core semantic analysis hook.

```tsx
const { analyze, analyzeSchema, isAnalyzing, error } = useSemantics();

const result = analyze({
  name: 'price',
  type: 'decimal',
  value: 99.99
}, 'detail');
```

## 🎨 Context-Aware Rendering

Different rendering contexts produce different UIs:

```tsx
// List context - compact display
<SemanticField field="price" value={99.99} context="list" />
// Renders: $99.99

// Detail context - full display
<SemanticField field="price" value={99.99} context="detail" />
// Renders: $99.99 USD

// Form context - input field
<SemanticField field="price" value={99.99} context="form" />
// Renders: <input type="number" value="99.99" />

// Timeline context - metric display
<SemanticField field="price" value={99.99} context="timeline" />
// Renders: <div class="metric">$99.99</div>
```

## 🔧 Customization

### Custom Field Renderers

```tsx
const customRenderer = (field, analysis, props) => {
  if (field.name === 'subscription_tier') {
    return (
      <select value={props.value} onChange={props.onChange}>
        <option value="basic">Basic</option>
        <option value="premium">Premium</option>
        <option value="enterprise">Enterprise</option>
      </select>
    );
  }
  
  // Default rendering
  return <SemanticField field={field} {...props} />;
};

<SemanticForm
  fields={fields}
  renderField={customRenderer}
/>
```

### Custom Component Props

```tsx
<SemanticField
  field="email"
  value="user@example.com"
  componentProps={{
    placeholder: "Enter your email",
    className: "custom-email-input",
    "data-testid": "email-field"
  }}
/>
```

## 📊 Supported Semantic Types

The protocol automatically recognizes and renders:

- **💰 Currency** - Prices, balances, payments
- **📧 Email** - Email addresses with validation
- **🕐 Temporal** - Dates, times, timestamps
- **⭐ Premium** - Special tiers, subscriptions
- **🔑 Identifier** - IDs, UUIDs, keys
- **📊 Status** - States, conditions
- **📈 Percentage** - Rates, ratios
- **🔗 URL** - Links, websites
- **⚠️ Danger** - Errors, failures
- **❌ Cancellation** - Terminated states

## 🎮 Interactive Demo

See it in action with the built-in demo component:

```tsx
import { SemanticDemo } from '@kneelinghorse/semantic-protocol-react';

function App() {
  return <SemanticDemo />;
}
```

The demo showcases:
- Individual semantic fields
- Auto-generated forms
- Semantic data tables
- Real-time hooks

## 🏗️ Architecture

```
SemanticProvider (Context)
├── SemanticField (Individual fields)
├── SemanticForm (Auto-generated forms)
├── SemanticTable (Data tables)
└── Hooks (useSemanticField, useSemantics)
```

## 🚀 Performance

- **Zero runtime dependencies** - Lightweight bundle
- **Memoized analysis** - Prevents unnecessary re-renders
- **Debounced updates** - Configurable performance tuning
- **Lazy evaluation** - Analysis only when needed

## 🔒 Type Safety

Full TypeScript support with comprehensive types:

```tsx
import type { 
  SemanticFieldProps, 
  SemanticFormProps, 
  SemanticTableProps,
  UseSemanticFieldOptions 
} from '@kneelinghorse/semantic-protocol-react';
```

## 🌟 Advanced Features

### Semantic Grouping

Automatically group form fields by semantic type:

```tsx
<SemanticForm
  fields={fields}
  groupBySemantic={true}
  // Groups: Currency, Email, Status, etc.
/>
```

### Bulk Operations

Handle multiple selected items in tables:

```tsx
<SemanticTable
  fields={fields}
  data={data}
  selectable={true}
  bulkActions={
    <button onClick={() => deleteSelected(selectedRows)}>
      Delete Selected ({selectedRows.length})
    </button>
  }
/>
```

### Custom Validation

Extend validation with custom rules:

```tsx
const customValidation = (values) => {
  const errors = {};
  
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords must match';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

<SemanticForm
  fields={fields}
  onValidate={customValidation}
/>
```

## 🤝 Contributing

This is an active experiment. We'd love your help with:

- Additional semantic patterns
- More UI components
- Framework integrations
- Performance optimizations
- Documentation improvements

## 📚 Examples

### Complete User Management

```tsx
import { SemanticForm, SemanticTable, SemanticField } from '@kneelinghorse/semantic-protocol-react';

function UserManagement() {
  const userFields = [
    { name: 'id', type: 'string', primaryKey: true },
    { name: 'email', type: 'string', unique: true },
    { name: 'is_premium', type: 'boolean' },
    { name: 'subscription_price', type: 'decimal' },
    { name: 'created_at', type: 'timestamp' }
  ];
  
  return (
    <div>
      <h2>Create User</h2>
      <SemanticForm
        fields={userFields}
        onSubmit={handleCreateUser}
        context="form"
      />
      
      <h2>Users</h2>
      <SemanticTable
        fields={userFields}
        data={users}
        context="list"
        sortable={true}
        filterable={true}
      />
    </div>
  );
}
```

### E-commerce Product Display

```tsx
function ProductCard({ product }) {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      
      {/* Automatically renders as currency */}
      <SemanticField
        field="price"
        value={product.price}
        context="detail"
      />
      
      {/* Automatically renders as status badge */}
      <SemanticField
        field="is_featured"
        value={product.is_featured}
        context="list"
      />
      
      {/* Automatically renders as percentage */}
      <SemanticField
        field="discount_rate"
        value={product.discount_rate}
        context="detail"
      />
    </div>
  );
}
```

## 🎯 Roadmap

- [x] Core semantic field rendering
- [x] Auto-generated forms
- [x] Semantic data tables
- [x] Real-time hooks
- [x] TypeScript support
- [ ] Advanced validation rules
- [ ] Custom semantic types
- [ ] Performance monitoring
- [ ] Accessibility improvements
- [ ] More UI components

## 📄 License

MIT - Use it, fork it, improve it.

---

*"The future isn't more code. It's code that understands."*

Built with ❤️ and Claude Code