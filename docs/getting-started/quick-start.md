# Quick Start Guide

Build a complete semantic form with validation in 10 minutes!

## 🎯 What We're Building

We'll create a user registration form that:
- Self-describes its components semantically
- Validates input in real-time
- Shows component relationships
- Demonstrates discovery capabilities

![Semantic Form Demo](../assets/quick-start-demo.png)

## 📋 Prerequisites

Make sure you've completed the [installation](./installation.md):

```bash
npm install @semantic-protocol/core @semantic-protocol/react
```

## 🚀 Step 1: Basic Setup

### Create the App Structure

```jsx
// App.js
import React from 'react';
import { SemanticProvider } from '@semantic-protocol/react';
import RegistrationForm from './RegistrationForm';

function App() {
  return (
    <SemanticProvider config={{ debug: true }}>
      <div className="app">
        <h1>Semantic Registration Form</h1>
        <RegistrationForm />
      </div>
    </SemanticProvider>
  );
}

export default App;
```

## 📝 Step 2: Create Semantic Components

### Registration Form Component

```jsx
// RegistrationForm.js
import React, { useState, useEffect } from 'react';
import { useSemanticProtocol } from '@semantic-protocol/react';

function RegistrationForm() {
  const { register, validate, query, getRelationships } = useSemanticProtocol();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});

  // Register form container
  useEffect(() => {
    register({
      id: 'registration-form',
      protocol: 'semantic-ui/v2',
      element: {
        type: 'container',
        intent: 'user registration',
        label: 'Registration Form',
        criticality: 'high'
      },
      context: {
        flow: 'onboarding',
        step: 1
      },
      relationships: {
        children: ['email-input', 'password-input', 'confirm-password', 'terms-checkbox'],
        handlers: ['submit-handler']
      }
    });

    // Register email input
    register({
      id: 'email-input',
      protocol: 'semantic-ui/v2',
      element: {
        type: 'input',
        intent: 'capture user email',
        label: 'Email Address',
        criticality: 'high'
      },
      relationships: {
        parent: 'registration-form',
        validators: ['email-validator']
      },
      validation: {
        rules: [
          { type: 'required', message: 'Email is required' },
          { type: 'email', message: 'Please enter a valid email' }
        ]
      }
    });

    // Register password input
    register({
      id: 'password-input',
      protocol: 'semantic-ui/v2',
      element: {
        type: 'input',
        intent: 'capture user password',
        label: 'Password',
        criticality: 'critical'
      },
      relationships: {
        parent: 'registration-form',
        validators: ['password-validator']
      },
      validation: {
        rules: [
          { type: 'required', message: 'Password is required' },
          { type: 'minLength', value: 8, message: 'Password must be at least 8 characters' },
          { type: 'pattern', value: /(?=.*[A-Z])(?=.*[0-9])/, message: 'Password must contain uppercase and number' }
        ]
      }
    });

    // Register confirm password
    register({
      id: 'confirm-password',
      protocol: 'semantic-ui/v2',
      element: {
        type: 'input',
        intent: 'confirm user password',
        label: 'Confirm Password',
        criticality: 'high'
      },
      relationships: {
        parent: 'registration-form',
        dependencies: ['password-input'],
        validators: ['password-match-validator']
      },
      validation: {
        rules: [
          { type: 'required', message: 'Please confirm your password' },
          { type: 'match', field: 'password-input', message: 'Passwords do not match' }
        ]
      }
    });

    // Register terms checkbox
    register({
      id: 'terms-checkbox',
      protocol: 'semantic-ui/v2',
      element: {
        type: 'input',
        intent: 'accept terms and conditions',
        label: 'Accept Terms',
        criticality: 'high'
      },
      relationships: {
        parent: 'registration-form'
      },
      validation: {
        rules: [
          { type: 'required', value: true, message: 'You must accept the terms' }
        ]
      }
    });

    // Register submit handler
    register({
      id: 'submit-handler',
      protocol: 'semantic-ui/v2',
      element: {
        type: 'action',
        intent: 'submit registration',
        label: 'Register'
      },
      relationships: {
        parent: 'registration-form',
        dependencies: ['email-input', 'password-input', 'confirm-password', 'terms-checkbox']
      }
    });
  }, [register]);

  // Handle input changes with validation
  const handleChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate the field
    const fieldMap = {
      email: 'email-input',
      password: 'password-input',
      confirmPassword: 'confirm-password',
      acceptTerms: 'terms-checkbox'
    };

    const result = await validate(fieldMap[field], value);
    
    setErrors(prev => ({
      ...prev,
      [field]: result.valid ? null : result.errors[0]?.message
    }));

    // If changing password, revalidate confirm password
    if (field === 'password' && formData.confirmPassword) {
      const confirmResult = await validate('confirm-password', formData.confirmPassword);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmResult.valid ? null : confirmResult.errors[0]?.message
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const validationPromises = [
      validate('email-input', formData.email),
      validate('password-input', formData.password),
      validate('confirm-password', formData.confirmPassword),
      validate('terms-checkbox', formData.acceptTerms)
    ];

    const results = await Promise.all(validationPromises);
    const newErrors = {};
    
    ['email', 'password', 'confirmPassword', 'acceptTerms'].forEach((field, index) => {
      if (!results[index].valid) {
        newErrors[field] = results[index].errors[0]?.message;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted successfully!', formData);
      alert('Registration successful!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          className={errors.password ? 'error' : ''}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          className={errors.confirmPassword ? 'error' : ''}
        />
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => handleChange('acceptTerms', e.target.checked)}
          />
          I accept the terms and conditions
        </label>
        {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
      </div>

      <button type="submit" className="submit-button">
        Register
      </button>
    </form>
  );
}

export default RegistrationForm;
```

## 🎨 Step 3: Add Styles

```css
/* App.css */
.app {
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.registration-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input[type="email"],
.form-group input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-group input.error {
  border-color: #f44336;
}

.error-message {
  color: #f44336;
  font-size: 14px;
  margin-top: 5px;
  display: block;
}

.checkbox label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  margin-right: 8px;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-button:hover {
  background: #45a049;
}
```

## 🔍 Step 4: Add Discovery Features

### Component Inspector

```jsx
// ComponentInspector.js
import React, { useState } from 'react';
import { useSemanticProtocol } from '@semantic-protocol/react';

function ComponentInspector() {
  const { query, getRelationships, get } = useSemanticProtocol();
  const [queryResult, setQueryResult] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Query examples
  const runQuery = (queryObj) => {
    const results = query(queryObj);
    setQueryResult(results);
  };

  const inspectComponent = (id) => {
    const component = get(id);
    const relationships = getRelationships(id);
    setSelectedComponent({ ...component, relationships });
  };

  return (
    <div className="inspector">
      <h2>Component Inspector</h2>
      
      <div className="query-section">
        <h3>Run Queries</h3>
        <button onClick={() => runQuery({ element: { type: 'input' } })}>
          Find all inputs
        </button>
        <button onClick={() => runQuery({ element: { criticality: 'high' } })}>
          Find critical components
        </button>
        <button onClick={() => runQuery({ context: { flow: 'onboarding' } })}>
          Find onboarding components
        </button>
      </div>

      {queryResult.length > 0 && (
        <div className="results">
          <h3>Query Results ({queryResult.length})</h3>
          <ul>
            {queryResult.map(component => (
              <li key={component.id} onClick={() => inspectComponent(component.id)}>
                {component.id} - {component.element.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedComponent && (
        <div className="component-details">
          <h3>Component Details</h3>
          <pre>{JSON.stringify(selectedComponent, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default ComponentInspector;
```

## 🧪 Step 5: Test Your Implementation

### Run the Application

```bash
npm start
```

### Test Scenarios

1. **Empty Form Submission**
   - Click Register without filling any fields
   - Should see validation errors for all required fields

2. **Invalid Email**
   - Enter "notanemail" in email field
   - Should see "Please enter a valid email"

3. **Weak Password**
   - Enter "pass" in password field
   - Should see "Password must be at least 8 characters"

4. **Password Mismatch**
   - Enter different passwords
   - Should see "Passwords do not match"

5. **Successful Registration**
   - Fill all fields correctly
   - Check terms checkbox
   - Should see success message

## 📊 Step 6: Explore Advanced Features

### Add Relationship Visualization

```jsx
// RelationshipGraph.js
import React, { useEffect, useState } from 'react';
import { useSemanticProtocol } from '@semantic-protocol/react';

function RelationshipGraph() {
  const { getRelationshipGraph } = useSemanticProtocol();
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    const formGraph = getRelationshipGraph('registration-form');
    setGraph(formGraph);
  }, []);

  return (
    <div className="relationship-graph">
      <h2>Component Relationships</h2>
      <pre>{JSON.stringify(graph, null, 2)}</pre>
    </div>
  );
}
```

### Add Performance Metrics

```jsx
// PerformanceMonitor.js
import React, { useState, useEffect } from 'react';
import { useSemanticProtocol } from '@semantic-protocol/react';

function PerformanceMonitor() {
  const { getStats } = useSemanticProtocol();
  const [stats, setStats] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-monitor">
      <h3>Performance Metrics</h3>
      <ul>
        <li>Components: {stats.componentCount}</li>
        <li>Queries: {stats.queryCount}</li>
        <li>Cache Hits: {stats.cacheHits}</li>
        <li>Avg Query Time: {stats.avgQueryTime}ms</li>
      </ul>
    </div>
  );
}
```

## ✅ Complete Example

Find the complete working example at:
- [CodeSandbox](https://codesandbox.io/s/semantic-protocol-quick-start)
- [GitHub](https://github.com/semantic-protocol/examples/tree/main/quick-start)

## 🎉 Congratulations!

You've successfully:
- ✅ Created semantic components
- ✅ Implemented validation
- ✅ Set up relationships
- ✅ Used discovery features
- ✅ Built a working form

## 📚 What's Next?

### Learn More
- [First Component Tutorial](./first-component.md) - Deep dive into component creation
- [Core Concepts](../core-concepts/README.md) - Understand the protocol
- [API Reference](../api/README.md) - Complete API documentation

### Try These Challenges
1. Add a username field with availability checking
2. Implement a multi-step registration wizard
3. Add field-level help text based on semantic metadata
4. Create a component that adapts based on user preferences

### Join the Community
- Share your implementation
- Get feedback from experts
- Learn from other developers

---

<div align="center">
  <strong>Ready for more?</strong><br>
  <a href="./first-component.md">Learn Component Creation →</a>
</div>