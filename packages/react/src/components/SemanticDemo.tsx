import React, { useState } from 'react';
import { SemanticField } from './SemanticField';
import { SemanticForm } from './SemanticForm';
import { SemanticTable } from './SemanticTable';

/**
 * SemanticDemo - Demo component showing all semantic components in action
 */
export const SemanticDemo: React.FC = () => {
  // Sample data for demonstration
  const [formData, setFormData] = useState({
    user_email: 'john@example.com',
    is_active: true,
    created_at: new Date('2024-01-15'),
    total_amount: 1234.56,
    status: 'active',
    completion_percentage: 0.75,
    website_url: 'https://example.com',
    cancellation_requested: false
  });

  const tableData = [
    {
      id: 1,
      customer_email: 'alice@example.com',
      order_total: 299.99,
      order_status: 'completed',
      created_date: new Date('2024-01-10'),
      is_premium: true,
      discount_percentage: 0.15
    },
    {
      id: 2,
      customer_email: 'bob@example.com',
      order_total: 149.50,
      order_status: 'processing',
      created_date: new Date('2024-01-12'),
      is_premium: false,
      discount_percentage: 0.05
    },
    {
      id: 3,
      customer_email: 'charlie@example.com',
      order_total: 599.00,
      order_status: 'cancelled',
      created_date: new Date('2024-01-14'),
      is_premium: true,
      discount_percentage: 0.20
    }
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>Semantic Protocol React Demo</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>Individual Semantic Fields</h2>
        <p>Each field is automatically rendered based on semantic analysis:</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
          <div>
            <strong>Email Field:</strong>
            <SemanticField
              field="user_email"
              value={formData.user_email}
              showDebug={true}
            />
          </div>
          
          <div>
            <strong>Currency Field:</strong>
            <SemanticField
              field="total_amount"
              value={formData.total_amount}
              showDebug={true}
            />
          </div>
          
          <div>
            <strong>Status Field:</strong>
            <SemanticField
              field="status"
              value={formData.status}
              showDebug={true}
            />
          </div>
          
          <div>
            <strong>Percentage Field:</strong>
            <SemanticField
              field="completion_percentage"
              value={formData.completion_percentage}
              showDebug={true}
            />
          </div>
          
          <div>
            <strong>Boolean Field:</strong>
            <SemanticField
              field="is_active"
              value={formData.is_active}
              showDebug={true}
            />
          </div>
          
          <div>
            <strong>Date Field:</strong>
            <SemanticField
              field="created_at"
              value={formData.created_at}
              showDebug={true}
            />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Semantic Form</h2>
        <p>Automatically generates form fields based on data structure:</p>
        
        <SemanticForm
          data={formData}
          excludeFields={['id']}
          onChange={(field, value) => {
            console.log(`Field ${field} changed to:`, value);
            setFormData(prev => ({ ...prev, [field]: value }));
          }}
          onSubmit={(data) => {
            console.log('Form submitted:', data);
            alert('Form submitted! Check console for data.');
          }}
          showDebug={false}
        />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Semantic Table</h2>
        <p>Automatically renders table cells with appropriate components:</p>
        
        <SemanticTable
          data={tableData}
          excludeColumns={['id']}
          onRowClick={(row, index) => {
            console.log(`Clicked row ${index}:`, row);
            alert(`Clicked on order from ${row['customer_email']}`);
          }}
          showDebug={false}
        />
      </section>

      <section>
        <h2>How It Works</h2>
        <ul>
          <li>The Semantic Protocol analyzes field names and data types</li>
          <li>It determines the semantic meaning (email, currency, status, etc.)</li>
          <li>Based on the context (form, list, detail), it chooses the right UI component</li>
          <li>No manual configuration needed - it just works!</li>
        </ul>
        
        <h3>Recognized Semantic Types:</h3>
        <ul>
          <li><strong>Email:</strong> Renders as email link or input</li>
          <li><strong>Currency:</strong> Formats with currency symbol</li>
          <li><strong>Percentage:</strong> Shows as progress bar or percentage</li>
          <li><strong>Status:</strong> Displays as badge with appropriate color</li>
          <li><strong>Temporal:</strong> Formats dates and timestamps</li>
          <li><strong>URL:</strong> Creates clickable links</li>
          <li><strong>Boolean:</strong> Shows as toggle or checkbox</li>
          <li><strong>Danger:</strong> Highlights with warning styles</li>
        </ul>
      </section>
    </div>
  );
};

export default SemanticDemo;