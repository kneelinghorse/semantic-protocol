<template>
  <div class="semantic-form-example">
    <h2>Semantic Form Example</h2>
    <p class="description">
      This form demonstrates automatic semantic analysis and styling of form fields.
      Fields are analyzed in real-time and styled based on their semantic meaning.
    </p>
    
    <SemanticBoundary>
      <form @submit.prevent="handleSubmit" class="semantic-form">
        <div class="form-grid">
          <!-- User Information Section -->
          <fieldset class="form-section">
            <legend>User Information</legend>
            
            <div class="form-group">
              <label for="user-id">User ID</label>
              <input
                id="user-id"
                v-model="formData.id"
                v-semantics.auto="{ 
                  field: { name: 'id', type: 'string', value: formData.id },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('id', result)
                }"
                type="text"
                readonly
                data-field="id"
              />
            </div>
            
            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                v-model="formData.email"
                v-semantics.auto="{ 
                  field: { name: 'email', type: 'string', value: formData.email },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('email', result)
                }"
                type="email"
                placeholder="user@example.com"
                data-field="email"
                required
              />
              <span v-if="analysisResults.email" class="field-analysis">
                Semantic: {{ analysisResults.email.bestMatch?.semantic }} 
                ({{ analysisResults.email.bestMatch?.confidence }}% confidence)
              </span>
            </div>
            
            <div class="form-group">
              <label for="website">Website URL</label>
              <input
                id="website"
                v-model="formData.website_url"
                v-semantics.auto="{ 
                  field: { name: 'website_url', type: 'string', value: formData.website_url },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('website_url', result)
                }"
                type="url"
                placeholder="https://example.com"
                data-field="website_url"
              />
            </div>
          </fieldset>
          
          <!-- Subscription Information Section -->
          <fieldset class="form-section">
            <legend>Subscription Details</legend>
            
            <div class="form-group">
              <label for="subscription-price">Monthly Price</label>
              <input
                id="subscription-price"
                v-model.number="formData.monthly_price"
                v-semantics.auto="{ 
                  field: { name: 'monthly_price', type: 'decimal', value: formData.monthly_price },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('monthly_price', result)
                }"
                type="number"
                step="0.01"
                min="0"
                placeholder="29.99"
                data-field="monthly_price"
              />
            </div>
            
            <div class="form-group">
              <label for="discount-rate">Discount Rate</label>
              <input
                id="discount-rate"
                v-model.number="formData.discount_rate"
                v-semantics.auto="{ 
                  field: { name: 'discount_rate', type: 'decimal', value: formData.discount_rate },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('discount_rate', result)
                }"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.15"
                data-field="discount_rate"
              />
              <small>Enter as decimal (e.g., 0.15 for 15%)</small>
            </div>
            
            <div class="form-group">
              <label for="premium-status">Premium Status</label>
              <select
                id="premium-status"
                v-model="formData.is_premium"
                v-semantics.auto="{ 
                  field: { name: 'is_premium', type: 'boolean', value: formData.is_premium },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('is_premium', result)
                }"
                data-field="is_premium"
              >
                <option value="false">Standard</option>
                <option value="true">Premium</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="account-status">Account Status</label>
              <select
                id="account-status"
                v-model="formData.status"
                v-semantics.auto="{ 
                  field: { name: 'status', type: 'string', value: formData.status },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('status', result)
                }"
                data-field="status"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </fieldset>
          
          <!-- Temporal Information Section -->
          <fieldset class="form-section">
            <legend>Timeline</legend>
            
            <div class="form-group">
              <label for="created-date">Created Date</label>
              <input
                id="created-date"
                v-model="formData.created_at"
                v-semantics.auto="{ 
                  field: { name: 'created_at', type: 'datetime', value: formData.created_at },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('created_at', result)
                }"
                type="datetime-local"
                data-field="created_at"
                readonly
              />
            </div>
            
            <div class="form-group">
              <label for="last-updated">Last Updated</label>
              <input
                id="last-updated"
                v-model="formData.updated_at"
                v-semantics.auto="{ 
                  field: { name: 'updated_at', type: 'datetime', value: formData.updated_at },
                  context: 'form',
                  onAnalysis: (result) => handleAnalysis('updated_at', result)
                }"
                type="datetime-local"
                data-field="updated_at"
                readonly
              />
            </div>
          </fieldset>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            Save Changes
          </button>
          <button type="button" class="btn btn-secondary" @click="resetForm">
            Reset Form
          </button>
        </div>
      </form>
    </SemanticBoundary>
    
    <!-- Analysis Results Panel -->
    <div v-if="showAnalysis" class="analysis-panel">
      <h3>Semantic Analysis Results</h3>
      <div class="analysis-grid">
        <div 
          v-for="(result, field) in analysisResults" 
          :key="field"
          class="analysis-item"
          :class="`confidence-${getConfidenceLevel(result)}`"
        >
          <h4>{{ field }}</h4>
          <div class="analysis-details">
            <p><strong>Type:</strong> {{ result.dataType }}</p>
            <p v-if="result.bestMatch">
              <strong>Semantic:</strong> {{ result.bestMatch.semantic }} 
              ({{ result.bestMatch.confidence }}% confidence)
            </p>
            <p><strong>Render:</strong> {{ result.renderInstruction.component }}</p>
            <p v-if="result.renderInstruction.variant">
              <strong>Variant:</strong> {{ result.renderInstruction.variant }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Form Data Preview -->
    <div class="data-preview">
      <h3>Current Form Data</h3>
      <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { AnalysisResult } from '../src/types'
import { SemanticBoundary } from '../src/components'

// Form data
const formData = reactive({
  id: 'USR_12345',
  email: 'john.doe@example.com',
  website_url: 'https://johndoe.dev',
  monthly_price: 29.99,
  discount_rate: 0.15,
  is_premium: 'true',
  status: 'active',
  created_at: '2024-01-15T10:30:00',
  updated_at: new Date().toISOString().slice(0, 16)
})

// Analysis results storage
const analysisResults = ref<Record<string, AnalysisResult>>({})
const showAnalysis = ref(true)

// Handle semantic analysis results
const handleAnalysis = (fieldName: string, result: AnalysisResult) => {
  analysisResults.value[fieldName] = result
  
  // Log analysis in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`🧠 Analyzed field "${fieldName}":`, result)
  }
}

// Get confidence level for styling
const getConfidenceLevel = (result: AnalysisResult): string => {
  if (!result.bestMatch) return 'none'
  
  const confidence = result.bestMatch.confidence
  if (confidence >= 90) return 'high'
  if (confidence >= 70) return 'medium'
  return 'low'
}

// Form handlers
const handleSubmit = () => {
  console.log('Form submitted:', formData)
  
  // Show analysis results
  console.log('Semantic analysis results:', analysisResults.value)
  
  alert('Form submitted! Check console for details.')
}

const resetForm = () => {
  Object.assign(formData, {
    id: 'USR_12345',
    email: '',
    website_url: '',
    monthly_price: 0,
    discount_rate: 0,
    is_premium: 'false',
    status: 'active',
    created_at: '2024-01-15T10:30:00',
    updated_at: new Date().toISOString().slice(0, 16)
  })
  
  analysisResults.value = {}
}
</script>

<style scoped>
.semantic-form-example {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.description {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
}

.semantic-form {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.form-section {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 1.5rem;
}

.form-section legend {
  font-weight: 600;
  color: #374151;
  padding: 0 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group small {
  display: block;
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.field-analysis {
  display: block;
  font-size: 0.75rem;
  color: #6366f1;
  margin-top: 0.25rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.analysis-panel {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.analysis-panel h3 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.analysis-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  border-left-width: 4px;
}

.analysis-item.confidence-high {
  border-left-color: #10b981;
}

.analysis-item.confidence-medium {
  border-left-color: #f59e0b;
}

.analysis-item.confidence-low {
  border-left-color: #ef4444;
}

.analysis-item.confidence-none {
  border-left-color: #6b7280;
}

.analysis-item h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #374151;
}

.analysis-details p {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.data-preview {
  background: #1f2937;
  border-radius: 0.5rem;
  padding: 1.5rem;
  color: #f3f4f6;
}

.data-preview h3 {
  margin: 0 0 1rem 0;
  color: #f3f4f6;
}

.data-preview pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .semantic-form-example {
    color: #f3f4f6;
  }
  
  .semantic-form {
    background: #1f2937;
    border-color: #374151;
  }
  
  .form-section {
    border-color: #4b5563;
  }
  
  .form-section legend,
  .form-group label {
    color: #f3f4f6;
  }
  
  .form-group input,
  .form-group select {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }
  
  .analysis-panel {
    background: #374151;
    border-color: #4b5563;
  }
  
  .analysis-panel h3 {
    color: #f3f4f6;
  }
  
  .analysis-item {
    background: #1f2937;
    border-color: #4b5563;
  }
}</style>