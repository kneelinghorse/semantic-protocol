<template>
  <div class="semantic-dashboard">
    <h1>Semantic Protocol Dashboard</h1>
    <p class="dashboard-description">
      Comprehensive example demonstrating Pinia store integration with semantic analysis.
      This dashboard shows real-time semantic insights and data management.
    </p>
    
    <SemanticProvider :options="semanticOptions">
      <SemanticBoundary>
        <div class="dashboard-grid">
          <!-- Insights Panel -->
          <div class="insights-panel panel">
            <h2>📊 Semantic Insights</h2>
            <div class="metrics">
              <div class="metric">
                <span class="metric-value">{{ insights.totalFields }}</span>
                <span class="metric-label">Total Fields</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ insights.analyzedFields }}</span>
                <span class="metric-label">Analyzed</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ insights.highConfidenceFields }}</span>
                <span class="metric-label">High Confidence</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ insights.relationshipsFound }}</span>
                <span class="metric-label">Relationships</span>
              </div>
            </div>
            
            <div class="coverage-bar">
              <div class="coverage-label">Semantic Coverage</div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${insights.semanticCoverage}%` }"
                ></div>
              </div>
              <div class="coverage-percentage">{{ insights.semanticCoverage.toFixed(1) }}%</div>
            </div>
            
            <div v-if="insights.mostCommonSemantic" class="most-common">
              <strong>Most Common Semantic:</strong> 
              <span class="semantic-badge" :class="`semantic-${insights.mostCommonSemantic}`">
                {{ insights.mostCommonSemantic }}
              </span>
            </div>
            
            <div class="confidence-distribution">
              <h3>Confidence Distribution</h3>
              <div class="confidence-bars">
                <div class="confidence-bar">
                  <span class="confidence-label">High (≥90%)</span>
                  <div class="bar high" :style="{ width: getConfidenceWidth('high') + '%' }">
                    {{ insights.confidenceDistribution.high }}
                  </div>
                </div>
                <div class="confidence-bar">
                  <span class="confidence-label">Medium (70-89%)</span>
                  <div class="bar medium" :style="{ width: getConfidenceWidth('medium') + '%' }">
                    {{ insights.confidenceDistribution.medium }}
                  </div>
                </div>
                <div class="confidence-bar">
                  <span class="confidence-label">Low (<70%)</span>
                  <div class="bar low" :style="{ width: getConfidenceWidth('low') + '%' }">
                    {{ insights.confidenceDistribution.low }}
                  </div>
                </div>
                <div class="confidence-bar">
                  <span class="confidence-label">None</span>
                  <div class="bar none" :style="{ width: getConfidenceWidth('none') + '%' }">
                    {{ insights.confidenceDistribution.none }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Analysis Controls -->
          <div class="controls-panel panel">
            <h2>🎛️ Analysis Controls</h2>
            
            <div class="control-group">
              <label>Context:</label>
              <select v-model="currentContext" @change="analyzeWithNewContext">
                <option value="list">List View</option>
                <option value="detail">Detail View</option>
                <option value="form">Form View</option>
                <option value="timeline">Timeline View</option>
              </select>
            </div>
            
            <div class="control-actions">
              <button 
                @click="analyzeUsers" 
                :disabled="isAnalyzing"
                class="btn btn-primary"
              >
                {{ isAnalyzing ? 'Analyzing...' : 'Analyze Users' }}
              </button>
              
              <button 
                @click="clearCache" 
                class="btn btn-secondary"
              >
                Clear Cache
              </button>
            </div>
            
            <div class="cache-info">
              <p>Cache Size: {{ analysisState.cache.size }} entries</p>
              <p v-if="analysisState.lastAnalyzed">
                Last Analyzed: {{ formatDate(analysisState.lastAnalyzed) }}
              </p>
            </div>
          </div>
          
          <!-- User Management -->
          <div class="users-panel panel">
            <h2>👥 User Management</h2>
            
            <div class="user-actions">
              <button @click="showAddUserForm = true" class="btn btn-primary">
                Add User
              </button>
              <span class="user-count">{{ users.length }} users</span>
            </div>
            
            <div class="users-list">
              <div 
                v-for="user in users" 
                :key="user.id"
                class="user-card"
                :class="{ 'is-premium': user.is_premium }"
              >
                <div class="user-header">
                  <span class="user-id" v-semantic-ref="{ ref: user.id, semantic: 'identifier' }">
                    {{ user.id }}
                  </span>
                  <span class="user-status" :class="`status-${user.subscription_status}`">
                    {{ user.subscription_status }}
                  </span>
                </div>
                
                <div class="user-details">
                  <p>
                    <strong>Email:</strong> 
                    <a :href="`mailto:${user.email}`" v-semantic-ref="{ semantic: 'email' }">
                      {{ user.email }}
                    </a>
                  </p>
                  
                  <p v-if="user.website_url">
                    <strong>Website:</strong> 
                    <a :href="user.website_url" target="_blank" v-semantic-ref="{ semantic: 'url' }">
                      {{ user.website_url }}
                    </a>
                  </p>
                  
                  <p>
                    <strong>Price:</strong> 
                    <span v-semantic-ref="{ semantic: 'currency' }">
                      ${{ user.monthly_price.toFixed(2) }}/month
                    </span>
                  </p>
                  
                  <p v-if="user.discount_rate > 0">
                    <strong>Discount:</strong> 
                    <span v-semantic-ref="{ semantic: 'percentage' }">
                      {{ (user.discount_rate * 100).toFixed(0) }}%
                    </span>
                  </p>
                </div>
                
                <div class="user-actions-card">
                  <button @click="editUser(user)" class="btn btn-small">Edit</button>
                  <button @click="removeUser(user.id)" class="btn btn-small btn-danger">Remove</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Analysis Results -->
          <div class="results-panel panel">
            <h2>🔬 Analysis Results</h2>
            
            <div v-if="analysisResults.length === 0" class="no-results">
              No analysis results. Click "Analyze Users" to start.
            </div>
            
            <div v-else class="results-grid">
              <div 
                v-for="result in analysisResults" 
                :key="result.field"
                class="result-card"
                :class="`confidence-${getConfidenceLevel(result)}`"
              >
                <h4>{{ formatFieldName(result.field) }}</h4>
                
                <div class="result-details">
                  <p><strong>Type:</strong> {{ result.dataType }}</p>
                  <p v-if="result.bestMatch">
                    <strong>Semantic:</strong> 
                    <span class="semantic-badge" :class="`semantic-${result.bestMatch.semantic}`">
                      {{ result.bestMatch.semantic }}
                    </span>
                    ({{ result.bestMatch.confidence }}%)
                  </p>
                  <p><strong>Component:</strong> {{ result.renderInstruction.component }}</p>
                  <p v-if="result.renderInstruction.variant">
                    <strong>Variant:</strong> {{ result.renderInstruction.variant }}
                  </p>
                </div>
                
                <div class="confidence-meter">
                  <div 
                    class="confidence-fill" 
                    :class="getConfidenceClass(result)"
                    :style="{ width: (result.bestMatch?.confidence || 0) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Relationships -->
          <div class="relationships-panel panel">
            <h2>🔗 Relationships</h2>
            
            <div v-if="analysisState.relationships.length === 0" class="no-relationships">
              No relationships discovered.
            </div>
            
            <div v-else class="relationships-list">
              <div 
                v-for="relationship in analysisState.relationships" 
                :key="`${relationship.from}-${relationship.to}`"
                class="relationship-card"
                :class="`relationship-${relationship.type}`"
              >
                <div class="relationship-visual">
                  <span class="from-field">{{ formatFieldName(relationship.from) }}</span>
                  <span class="relationship-arrow">→</span>
                  <span class="to-field">{{ formatFieldName(relationship.to) }}</span>
                </div>
                
                <div class="relationship-meta">
                  <span class="relationship-type">{{ relationship.type }}</span>
                  <span class="relationship-confidence">{{ relationship.confidence }}%</span>
                </div>
                
                <p v-if="relationship.metadata?.description" class="relationship-description">
                  {{ relationship.metadata.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SemanticBoundary>
    </SemanticProvider>
    
    <!-- Add User Modal -->
    <div v-if="showAddUserForm" class="modal-overlay" @click="showAddUserForm = false">
      <div class="modal" @click.stop>
        <h3>Add New User</h3>
        <form @submit.prevent="handleAddUser">
          <div class="form-group">
            <label>Email:</label>
            <input 
              v-model="newUser.email" 
              type="email" 
              required
              v-semantics="{ field: { name: 'email', type: 'string' } }"
            />
          </div>
          
          <div class="form-group">
            <label>Username:</label>
            <input 
              v-model="newUser.username" 
              type="text" 
              required
              v-semantics="{ field: { name: 'username', type: 'string' } }"
            />
          </div>
          
          <div class="form-group">
            <label>Monthly Price:</label>
            <input 
              v-model.number="newUser.monthly_price" 
              type="number" 
              step="0.01"
              required
              v-semantics="{ field: { name: 'monthly_price', type: 'decimal' } }"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Add User</button>
            <button type="button" class="btn btn-secondary" @click="showAddUserForm = false">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  useSemanticStore, 
  useSemanticInsightsStore,
  useSemanticFormStore 
} from './SemanticStore'
import { SemanticProvider, SemanticBoundary } from '../src/components'
import type { UserProfile, AnalysisResult, RenderContext } from './SemanticStore'

// Stores
const semanticStore = useSemanticStore()
const insightsStore = useSemanticInsightsStore()

// Store state
const { 
  users, 
  currentContext, 
  analysisState, 
  analysisResults 
} = storeToRefs(semanticStore)

const { insights } = storeToRefs(insightsStore)

// Local state
const showAddUserForm = ref(false)
const newUser = ref<Partial<UserProfile>>({
  email: '',
  username: '',
  monthly_price: 0,
  discount_rate: 0,
  is_premium: false,
  subscription_status: 'active',
  account_status: 'pending'
})

const isAnalyzing = computed(() => analysisState.value.isAnalyzing)

// Semantic options for provider
const semanticOptions = {
  confidenceThreshold: 70,
  autoAnalysis: true,
  enableDevTools: true,
  cacheResults: true
}

// Methods
const analyzeUsers = async () => {
  await semanticStore.analyzeUsers(currentContext.value)
}

const analyzeWithNewContext = async () => {
  semanticStore.setContext(currentContext.value)
  await analyzeUsers()
}

const clearCache = () => {
  semanticStore.clearCache()
}

const formatDate = (date: Date): string => {
  return date.toLocaleString()
}

const formatFieldName = (fieldName: string): string => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getConfidenceLevel = (result: AnalysisResult): string => {
  if (!result.bestMatch) return 'none'
  
  const confidence = result.bestMatch.confidence
  if (confidence >= 90) return 'high'
  if (confidence >= 70) return 'medium'
  return 'low'
}

const getConfidenceClass = (result: AnalysisResult): string => {
  return `confidence-${getConfidenceLevel(result)}`
}

const getConfidenceWidth = (level: keyof typeof insights.value.confidenceDistribution): number => {
  const total = Object.values(insights.value.confidenceDistribution).reduce((sum, count) => sum + count, 0)
  if (total === 0) return 0
  return (insights.value.confidenceDistribution[level] / total) * 100
}

const handleAddUser = async () => {
  if (newUser.value.email && newUser.value.username && newUser.value.monthly_price) {
    const user: UserProfile = {
      ...newUser.value,
      id: `USR_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as UserProfile
    
    semanticStore.addUser(user)
    
    // Reset form
    newUser.value = {
      email: '',
      username: '',
      monthly_price: 0,
      discount_rate: 0,
      is_premium: false,
      subscription_status: 'active',
      account_status: 'pending'
    }
    
    showAddUserForm.value = false
    
    // Re-analyze with new user
    await analyzeUsers()
  }
}

const editUser = (user: UserProfile) => {
  // In a real app, this would open an edit form
  console.log('Edit user:', user)
}

const removeUser = (userId: string) => {
  if (confirm('Are you sure you want to remove this user?')) {
    semanticStore.removeUser(userId)
  }
}

// Initialize
onMounted(() => {
  analyzeUsers()
})
</script>

<style scoped>
.semantic-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.dashboard-description {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.panel h2 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.25rem;
  font-weight: 600;
}

/* Insights Panel */
.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.metric-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
}

.metric-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.coverage-bar {
  margin-bottom: 1rem;
}

.coverage-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.progress-bar {
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.coverage-percentage {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.most-common {
  margin-bottom: 1rem;
  color: #374151;
}

.confidence-distribution h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #374151;
}

.confidence-bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.confidence-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.confidence-label {
  min-width: 120px;
  font-size: 0.875rem;
  color: #6b7280;
}

.bar {
  flex: 1;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 30px;
  color: white;
}

.bar.high { background-color: #10b981; }
.bar.medium { background-color: #f59e0b; }
.bar.low { background-color: #ef4444; }
.bar.none { background-color: #6b7280; }

/* Controls Panel */
.control-group {
  margin-bottom: 1rem;
}

.control-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.control-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.control-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
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

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-danger {
  background-color: #dc2626;
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.cache-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.cache-info p {
  margin: 0.25rem 0;
}

/* Users Panel */
.user-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.user-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
}

.user-card.is-premium {
  border-left: 4px solid #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.user-id {
  font-family: monospace;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}

.user-status {
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

.user-details {
  margin-bottom: 0.75rem;
}

.user-details p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.user-actions-card {
  display: flex;
  gap: 0.5rem;
}

/* Results Panel */
.no-results {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.result-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  border-left-width: 4px;
}

.result-card.confidence-high {
  border-left-color: #10b981;
}

.result-card.confidence-medium {
  border-left-color: #f59e0b;
}

.result-card.confidence-low {
  border-left-color: #ef4444;
}

.result-card.confidence-none {
  border-left-color: #6b7280;
}

.result-card h4 {
  margin: 0 0 0.75rem 0;
  color: #374151;
}

.result-details p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.confidence-meter {
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.75rem;
}

.confidence-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.confidence-fill.confidence-high {
  background-color: #10b981;
}

.confidence-fill.confidence-medium {
  background-color: #f59e0b;
}

.confidence-fill.confidence-low {
  background-color: #ef4444;
}

.confidence-fill.confidence-none {
  background-color: #6b7280;
}

/* Relationships Panel */
.no-relationships {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.relationship-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
}

.relationship-visual {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.relationship-arrow {
  color: #6b7280;
  font-size: 1.25rem;
}

.relationship-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.relationship-type {
  background-color: #3b82f6;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.relationship-confidence {
  color: #059669;
  font-weight: 500;
}

.relationship-description {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

/* Semantic badges */
.semantic-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.semantic-currency { background-color: #d1fae5; color: #065f46; }
.semantic-temporal { background-color: #ede9fe; color: #5b21b6; }
.semantic-premium { background-color: #fef3c7; color: #92400e; }
.semantic-identifier { background-color: #f3f4f6; color: #374151; }
.semantic-status { background-color: #dbeafe; color: #1e40af; }
.semantic-percentage { background-color: #fee2e2; color: #991b1b; }
.semantic-email { background-color: #dbeafe; color: #1e40af; }
.semantic-url { background-color: #dbeafe; color: #1e40af; }
.semantic-danger { background-color: #fee2e2; color: #991b1b; }

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: #374151;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .user-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .relationship-visual {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .relationship-arrow {
    transform: rotate(90deg);
  }
}
</style>