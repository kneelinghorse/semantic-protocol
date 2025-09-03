import React, { useState } from 'react';
import { 
  SemanticProvider, 
  useSemantics, 
  useDiscovery,
  useRelationships,
  SemanticBoundary 
} from '@semantic-protocol/react';

const FormField: React.FC<{
  name: string;
  label: string;
  type: string;
  required?: boolean;
}> = ({ name, label, type, required = false }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const { semanticProps, addCapability, componentId } = useSemantics({
    manifest: {
      name: `FormField-${name}`,
      version: '1.0.0',
      purpose: `Collect ${label} input from user`,
      capabilities: ['input', 'validation', type],
      relationships: [],
      metadata: {
        fieldName: name,
        fieldType: type,
        required,
        tags: ['form-field', type, required ? 'required' : 'optional'],
      },
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setError('');
    
    if (required && !e.target.value) {
      setError(`${label} is required`);
      addCapability('has-error');
    }
  };

  return (
    <div className="form-field" {...semanticProps}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="error">
          {error}
        </span>
      )}
    </div>
  );
};

const SubmitButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  const { findComponents } = useDiscovery({
    query: {
      capabilities: ['has-error'],
    },
  });

  const { semanticProps } = useSemantics({
    manifest: {
      name: 'SubmitButton',
      version: '1.0.0',
      purpose: 'Submit form data',
      capabilities: ['submit', 'validation-aware'],
      metadata: {
        tags: ['button', 'submit', 'form-control'],
      },
    },
  });

  const handleClick = () => {
    const fieldsWithErrors = findComponents.results;
    
    if (fieldsWithErrors.length > 0) {
      console.warn('Cannot submit: Form has errors', fieldsWithErrors);
      return;
    }
    
    onClick();
  };

  return (
    <button 
      {...semanticProps}
      onClick={handleClick}
      className="submit-button"
    >
      Submit
    </button>
  );
};

const SemanticForm: React.FC = () => {
  const { semanticProps, componentId } = useSemantics({
    manifest: {
      name: 'UserRegistrationForm',
      version: '1.0.0',
      purpose: 'Collect user registration information',
      capabilities: ['form', 'validation', 'submission'],
      metadata: {
        type: 'form',
        tags: ['registration', 'user-input'],
      },
    },
  });

  const { results: formFields } = useDiscovery({
    query: {
      tags: ['form-field'],
    },
    realTime: true,
  });

  const { getChildren } = useRelationships({
    componentId,
  });

  const handleSubmit = () => {
    const fieldData = formFields.map(field => ({
      name: field.manifest.metadata?.fieldName,
      type: field.manifest.metadata?.fieldType,
      required: field.manifest.metadata?.required,
    }));

    console.log('Form submitted with fields:', fieldData);
    console.log('Form has', getChildren().length, 'child components');
  };

  return (
    <SemanticBoundary
      fallback={(error) => (
        <div className="form-error">
          <h3>Form Error</h3>
          <p>{error.message}</p>
          {error.suggestions?.map((suggestion, i) => (
            <p key={i}>{suggestion}</p>
          ))}
        </div>
      )}
    >
      <form {...semanticProps} onSubmit={(e) => e.preventDefault()}>
        <h2>User Registration</h2>
        
        <FormField 
          name="username" 
          label="Username" 
          type="text" 
          required 
        />
        
        <FormField 
          name="email" 
          label="Email" 
          type="email" 
          required 
        />
        
        <FormField 
          name="password" 
          label="Password" 
          type="password" 
          required 
        />
        
        <FormField 
          name="phone" 
          label="Phone" 
          type="tel" 
        />
        
        <SubmitButton onClick={handleSubmit} />
        
        <div className="form-info">
          <p>Discovered {formFields.length} form fields</p>
        </div>
      </form>
    </SemanticBoundary>
  );
};

const App: React.FC = () => {
  return (
    <SemanticProvider enableDevTools>
      <div className="app">
        <h1>Semantic Protocol Form Example</h1>
        <SemanticForm />
      </div>
    </SemanticProvider>
  );
};

export default App;