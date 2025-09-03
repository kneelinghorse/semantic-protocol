<template>
  <div class="semantic-table-example">
    <h2>Semantic Table Example</h2>
    <p class="description">
      This table demonstrates automatic semantic analysis and rendering of tabular data.
      Columns are automatically analyzed and styled based on their semantic meaning.
    </p>
    
    <div class="controls">
      <button @click="analyzeData" class="btn btn-primary">
        {{ isAnalyzing ? 'Analyzing...' : 'Analyze Data' }}
      </button>
      <button @click="toggleAnalysisView" class="btn btn-secondary">
        {{ showAnalysis ? 'Hide' : 'Show' }} Analysis
      </button>
      <label class="context-selector">
        Context:
        <select v-model="renderContext" @change="reanalyzeData">
          <option value="list">List View</option>
          <option value="detail">Detail View</option>
          <option value="form">Form View</option>
        </select>
      </label>
    </div>
    
    <SemanticBoundary>
      <div class="table-container">
        <table class="semantic-table" :class="`context-${renderContext}`">
          <thead>
            <tr>
              <th 
                v-for="(result, index) in columnResults" 
                :key="result.field"
                :class="getColumnClasses(result)"
                :data-semantic="result.bestMatch?.semantic"
                :data-confidence="result.bestMatch?.confidence"
                v-semantic-ref="{ ref: `col-${index}`, semantic: result.bestMatch?.semantic }"
              >
                <div class="column-header">
                  <span class="column-title">{{ formatColumnTitle(result.field) }}</span>
                  <span 
                    v-if="showAnalysis && result.bestMatch" 
                    class="semantic-badge"
                    :class="`semantic-${result.bestMatch.semantic}`"
                  >
                    {{ result.bestMatch.semantic }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(row, rowIndex) in tableData" 
              :key="rowIndex"
              class="table-row"
            >
              <td 
                v-for="(result, colIndex) in columnResults" 
                :key="`${rowIndex}-${result.field}`"
                :class="getCellClasses(result)"
                :data-semantic="result.bestMatch?.semantic"
                v-semantic-ref="{ ref: `cell-${rowIndex}-${colIndex}`, semantic: result.bestMatch?.semantic }"
              >
                <component
                  :is="getCellComponent(result)"
                  :value="row[result.field]"
                  :semantic="result.bestMatch?.semantic"
                  :render-instruction="result.renderInstruction"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SemanticBoundary>
    
    <!-- Analysis Results Panel -->
    <div v-if="showAnalysis" class="analysis-panel">
      <h3>Column Analysis Results</h3>
      <div class="column-analysis">
        <div 
          v-for="result in columnResults" 
          :key="result.field"
          class="column-item"
          :class="`confidence-${getConfidenceLevel(result)}`"
        >
          <h4>{{ result.field }}</h4>
          <div class="column-details">
            <p><strong>Type:</strong> {{ result.dataType }}</p>
            <p v-if="result.bestMatch">
              <strong>Semantic:</strong> {{ result.bestMatch.semantic }} 
              ({{ result.bestMatch.confidence }}% confidence)
            </p>
            <p><strong>Component:</strong> {{ result.renderInstruction.component }}</p>
            <p v-if="result.renderInstruction.variant">
              <strong>Variant:</strong> {{ result.renderInstruction.variant }}
            </p>
            <p><strong>Context:</strong> {{ result.context }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Relationships Analysis -->
    <div v-if="showAnalysis && relationships.length > 0" class="relationships-panel">
      <h3>Discovered Relationships</h3>
      <div class="relationships-list">
        <div 
          v-for="relationship in relationships" 
          :key="`${relationship.from}-${relationship.to}`"
          class="relationship-item"
        >
          <div class="relationship-visual">
            <span class="from-field">{{ relationship.from }}</span>
            <span class="relationship-arrow">→</span>
            <span class="to-field">{{ relationship.to }}</span>
          </div>
          <div class="relationship-details">
            <span class="relationship-type">{{ relationship.type }}</span>
            <span class="relationship-confidence">{{ relationship.confidence }}%</span>
            <span v-if="relationship.metadata?.pattern" class="relationship-pattern">
              {{ relationship.metadata.pattern }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { AnalysisResult, RenderContext, SemanticRelationship } from '../src/types'
import { useSemantics, useDiscovery, useRelationships } from '../src/composables'
import { SemanticBoundary } from '../src/components'
import { semanticVueUtils } from '../src/utils'

// Sample data
const sampleData = ref([
  {
    id: 'USR_001',
    email: 'alice@example.com',
    website_url: 'https://alice.dev',
    monthly_price: 29.99,
    annual_price: 299.99,
    discount_rate: 0.15,
    tax_rate: 0.08,
    is_premium: true,
    subscription_status: 'active',
    account_status: 'verified',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-02-01T15:45:00Z',
    last_login_at: '2024-02-01T09:20:00Z'
  },
  {
    id: 'USR_002',
    email: 'bob@company.com',
    website_url: 'https://bobsite.com',
    monthly_price: 19.99,
    annual_price: 199.99,
    discount_rate: 0.10,
    tax_rate: 0.08,
    is_premium: false,
    subscription_status: 'active',
    account_status: 'pending',
    created_at: '2024-02-01T14:20:00Z',
    updated_at: '2024-02-01T14:25:00Z',
    last_login_at: '2024-02-01T16:10:00Z'
  },
  {
    id: 'USR_003',
    email: 'charlie@startup.io',
    website_url: null,
    monthly_price: 49.99,
    annual_price: 499.99,
    discount_rate: 0.20,
    tax_rate: 0.08,
    is_premium: true,
    subscription_status: 'cancelled',
    account_status: 'inactive',
    created_at: '2023-12-01T08:15:00Z',
    updated_at: '2024-01-15T12:30:00Z',
    last_login_at: '2024-01-10T11:45:00Z'
  }
])

// Composables
const { analyzeSchema, results, isAnalyzing } = useSemantics()
const { discover } = useDiscovery()
const { findRelationships } = useRelationships()

// Reactive state
const tableData = computed(() => sampleData.value)
const renderContext = ref<RenderContext>('list')
const showAnalysis = ref(true)
const columnResults = ref<AnalysisResult[]>([])
const relationships = ref<SemanticRelationship[]>([])

// Analyze data
const analyzeData = async () => {
  if (tableData.value.length === 0) return
  
  // Discover field definitions from the first row
  const fields = discover(tableData.value[0])
  
  // Analyze the schema
  const analysisResults = analyzeSchema(fields, renderContext.value)
  columnResults.value = analysisResults
  
  // Find relationships
  relationships.value = findRelationships(analysisResults)
}

const reanalyzeData = () => {
  if (columnResults.value.length > 0) {
    analyzeData()
  }
}

// UI helpers
const formatColumnTitle = (fieldName: string): string => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getColumnClasses = (result: AnalysisResult): string[] => {
  const classes = ['column-header']
  if (result.bestMatch) {
    classes.push(`semantic-${result.bestMatch.semantic}`)
    classes.push(`confidence-${getConfidenceLevel(result)}`)
  }
  return classes
}

const getCellClasses = (result: AnalysisResult): string[] => {
  return semanticVueUtils.generateClasses(result)
}

const getCellComponent = (result: AnalysisResult) => {
  // Return appropriate cell component based on semantic analysis
  if (result.bestMatch?.semantic === 'currency') {
    return CurrencyCell
  } else if (result.bestMatch?.semantic === 'temporal') {
    return TemporalCell
  } else if (result.bestMatch?.semantic === 'email') {
    return EmailCell
  } else if (result.bestMatch?.semantic === 'url') {
    return UrlCell
  } else if (result.bestMatch?.semantic === 'status') {
    return StatusCell
  } else if (result.bestMatch?.semantic === 'percentage') {
    return PercentageCell
  } else if (result.bestMatch?.semantic === 'premium') {
    return PremiumCell
  }
  return DefaultCell
}

const getConfidenceLevel = (result: AnalysisResult): string => {
  if (!result.bestMatch) return 'none'
  
  const confidence = result.bestMatch.confidence
  if (confidence >= 90) return 'high'
  if (confidence >= 70) return 'medium'
  return 'low'
}

const toggleAnalysisView = () => {
  showAnalysis.value = !showAnalysis.value
}

// Initialize
onMounted(() => {
  analyzeData()
})
</script>

<!-- Cell Components -->
<script lang="ts">
import { defineComponent } from 'vue'

const DefaultCell = defineComponent({
  props: ['value', 'semantic', 'renderInstruction'],
  template: `<span>{{ value }}</span>`
})

const CurrencyCell = defineComponent({
  props: ['value', 'semantic', 'renderInstruction'],
  computed: {
    formattedValue() {
      return typeof this.value === 'number' 
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.value)
        : String(this.value)
    }
  },
  template: `<span class="currency-value">{{ formattedValue }}</span>`
})

const TemporalCell = defineComponent({
  props: ['value', 'semantic', 'renderInstruction'],
  computed: {
    formattedValue() {
      if (!this.value) return '-'
      const date = new Date(this.value)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },
  template: `<time class="temporal-value" :datetime="value">{{ formattedValue }}</time>`
})

const EmailCell = defineComponent({
  props: ['value', 'semantic', 'renderInstruction'],
  template: `<a class="email-value" :href="'mailto:' + value">{{ value }}</a>`
})

const UrlCell = defineComponent({
  props: ['value', 'semantic', 'renderInstruction'],
  template: `
    <a v-if="value" class="url-value" :href="value" target="_blank" rel="noopener">
      {{ value }}
    </a>
    <span v-else>-</span>
  `
})

const StatusCell = defineComponent({
  props: ['value', 'semantic', 'renderInstruction'],
  computed: {
    statusClass() {
      return `status-${this.value}`
    }
  },
  template: `<span class="status-badge" :class="statusClass">{{ value }}</span>`
})

const PercentageCell = defineComponent({
  props: ['value', 'semantic', 'renderInstruction'],
  computed: {
    formattedValue() {
      return typeof this.value === 'number' 
        ? new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(this.value)
        : String(this.value)
    }
  },
  template: `<span class="percentage-value">{{ formattedValue }}</span>`
})

const PremiumCell = defineComponent({
  props: ['value', 'semantic', 'renderInstruction'],
  template: `
    <span class="premium-badge" :class="{ 'is-premium': value }">
      {{ value ? '⭐ Premium' : 'Standard' }}
    </span>
  `
})
</script>

<style scoped>
.semantic-table-example {
  max-width: 1400px;
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

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
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

.context-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.context-selector select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
}

.table-container {
  overflow-x: auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.semantic-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.semantic-table th,
.semantic-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.semantic-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column-title {
  flex: 1;
}

.semantic-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Semantic type styling */
.semantic-currency {
  text-align: right;
}

.semantic-temporal {
  white-space: nowrap;
}

.semantic-email,
.semantic-url {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.semantic-status,
.semantic-premium {
  text-align: center;
}

.semantic-percentage {
  text-align: center;
}

.semantic-identifier {
  font-family: monospace;
  font-size: 0.75rem;
}

/* Cell component styling */
.currency-value {
  font-weight: 600;
  color: #059669;
}

.temporal-value {
  color: #7c3aed;
  font-size: 0.8125rem;
}

.email-value,
.url-value {
  color: #2563eb;
  text-decoration: none;
}

.email-value:hover,
.url-value:hover {
  text-decoration: underline;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-active {
  background-color: #d1fae5;
  color: #065f46;
}

.status-inactive,
.status-cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-verified {
  background-color: #dbeafe;
  color: #1e40af;
}

.percentage-value {
  color: #dc2626;
  font-weight: 600;
}

.premium-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #f3f4f6;
  color: #374151;
}

.premium-badge.is-premium {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

/* Confidence levels */
.confidence-high th {
  background-color: #ecfdf5;
  border-left: 4px solid #10b981;
}

.confidence-medium th {
  background-color: #fffbeb;
  border-left: 4px solid #f59e0b;
}

.confidence-low th {
  background-color: #fef2f2;
  border-left: 4px solid #ef4444;
}

/* Analysis panels */
.analysis-panel,
.relationships-panel {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.analysis-panel h3,
.relationships-panel h3 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.column-analysis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.column-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  border-left-width: 4px;
}

.column-item.confidence-high {
  border-left-color: #10b981;
}

.column-item.confidence-medium {
  border-left-color: #f59e0b;
}

.column-item.confidence-low {
  border-left-color: #ef4444;
}

.column-item h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #374151;
}

.column-details p {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.relationship-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.relationship-visual {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.relationship-arrow {
  color: #6b7280;
}

.relationship-details {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.relationship-type {
  font-weight: 500;
  color: #3b82f6;
}

.relationship-confidence {
  color: #059669;
  font-weight: 500;
}

.relationship-pattern {
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .column-analysis {
    grid-template-columns: 1fr;
  }
  
  .relationship-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .relationship-details {
    justify-content: space-between;
  }
}
</style>