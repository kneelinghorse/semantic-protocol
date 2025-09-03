/**
 * Demo showing all restored React functionality
 */

import React, { useState } from 'react';
import {
  SemanticProvider,
  SemanticField,
  SemanticForm,
  SemanticTable,
  SemanticBoundary,
  SemanticPortal,
  useSemantics,
  useDiscovery,
  useRelationships,
  useSemanticContext
} from './src';

// Demo component using the restored hooks
const DemoComponent: React.FC = () => {
  const [formData, setFormData] = useState({
    user_name: 'John Doe',
    user_email: 'john@example.com',
    phone_number: '+1-555-0123'
  });

  // Use the semantic hooks
  const manifest = {
    id: 'demo-component',
    element: {
      type: 'form',
      intent: 'registration',
      label: 'User Registration'
    }
  };

  // Register component with semantic manifest
  const { id, isRegistered } = useSemantics(manifest);

  // Discover related components
  const { results: forms } = useDiscovery({ type: 'form' });

  // Manage relationships
  const relationships = useRelationships(id);

  const context = useSemanticContext();

  return (
    <div>
      <h2>Semantic Protocol React Demo</h2>
      
      <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
        <h3>Component Registration</h3>
        <p>Component ID: {id}</p>
        <p>Is Registered: {isRegistered ? 'Yes' : 'No'}</p>
        <p>Registry Size: {context.registry.size}</p>
      </div>

      <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
        <h3>Component Discovery</h3>
        <p>Found {forms.length} form components</p>
      </div>

      <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
        <h3>Relationships</h3>
        <p>Parent: {relationships.parent ? relationships.parent.id : 'None'}</p>
        <p>Children: {relationships.children.length}</p>
        <p>Dependencies: {relationships.dependencies.length}</p>
      </div>

      <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
        <h3>Semantic Form (Auto-generated)</h3>
        <SemanticForm
          data={formData}
          onSubmit={(data) => console.log('Form submitted:', data)}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        />
      </div>

      <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
        <h3>Semantic Portal (Cross-tree rendering)</h3>
        <SemanticPortal
          manifest={{
            id: 'portal-demo',
            element: { type: 'notification', intent: 'info' }
          }}
        >
          <div style={{ padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
            This content is rendered through a semantic portal!
          </div>
        </SemanticPortal>
      </div>
    </div>
  );
};

// Main app with error boundary
const App: React.FC = () => {
  return (
    <SemanticProvider 
      confidenceThreshold={70}
      enableDevTools={true}
      onRegistryChange={(stats) => console.log('Registry updated:', stats)}
    >
      <SemanticBoundary
        fallback={<div>Something went wrong!</div>}
        enableRecovery={true}
      >
        <DemoComponent />
      </SemanticBoundary>
    </SemanticProvider>
  );
};

export default App;