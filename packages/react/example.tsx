/**
 * Example usage of Semantic Protocol React components
 * This shows how to use the components with the actual API that exists
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  SemanticProvider,
  SemanticField,
  SemanticForm,
  SemanticTable,
  SemanticDemo
} from './src';

// Example 1: Using individual SemanticField
function FieldExample() {
  return (
    <div>
      <h2>Individual Field Rendering</h2>
      
      {/* Email field - automatically renders as email link */}
      <SemanticField
        field="user_email"
        value="john@example.com"
        showDebug={true}
      />
      
      {/* Currency field - automatically formats currency */}
      <SemanticField
        field="total_amount"
        value={1234.56}
        showDebug={true}
      />
      
      {/* Status field - renders as colored badge */}
      <SemanticField
        field="order_status"
        value="completed"
        showDebug={true}
      />
    </div>
  );
}

// Example 2: Using SemanticForm for automatic form generation
function FormExample() {
  const [formData, setFormData] = React.useState({
    customer_email: 'alice@example.com',
    order_total: 299.99,
    is_premium: true,
    created_date: new Date(),
    discount_percentage: 0.15
  });

  return (
    <div>
      <h2>Automatic Form Generation</h2>
      
      <SemanticForm
        data={formData}
        onChange={(field, value) => {
          console.log(`Field ${field} changed to:`, value);
          setFormData(prev => ({ ...prev, [field]: value }));
        }}
        onSubmit={(data) => {
          console.log('Form submitted:', data);
          alert('Form submitted! Check console.');
        }}
      />
    </div>
  );
}

// Example 3: Using SemanticTable for data display
function TableExample() {
  const data = [
    {
      id: 1,
      customer_email: 'alice@example.com',
      order_total: 299.99,
      order_status: 'completed',
      is_premium: true
    },
    {
      id: 2,
      customer_email: 'bob@example.com',
      order_total: 149.50,
      order_status: 'processing',
      is_premium: false
    },
    {
      id: 3,
      customer_email: 'charlie@example.com',
      order_total: 599.00,
      order_status: 'cancelled',
      is_premium: true
    }
  ];

  return (
    <div>
      <h2>Automatic Table Rendering</h2>
      
      <SemanticTable
        data={data}
        excludeColumns={['id']}
        onRowClick={(row, index) => {
          console.log(`Clicked row ${index}:`, row);
        }}
      />
    </div>
  );
}

// Main App combining all examples
function App() {
  return (
    <SemanticProvider confidenceThreshold={70}>
      <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
        <h1>Semantic Protocol React Examples</h1>
        
        <FieldExample />
        <hr />
        
        <FormExample />
        <hr />
        
        <TableExample />
        <hr />
        
        <h2>Full Demo</h2>
        <SemanticDemo />
      </div>
    </SemanticProvider>
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);