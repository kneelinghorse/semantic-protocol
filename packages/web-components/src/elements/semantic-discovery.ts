import { SemanticElement } from '../base/SemanticElement';
import { SemanticManifest } from '@semantic-protocol/core';

interface DiscoveryResult {
  id: string;
  element: HTMLElement;
  manifest: SemanticManifest;
  relevance: number;
}

export class SemanticDiscovery extends SemanticElement {
  static get observedAttributes() {
    return ['query', 'type', 'intent', 'tags', 'auto-refresh', 'display-mode'];
  }

  private results: DiscoveryResult[] = [];
  private refreshInterval: number | null = null;

  constructor() {
    super({
      useShadow: true,
      autoRegister: true,
      validateOnConnect: false
    });
  }

  getManifest(): SemanticManifest {
    return {
      protocol: 'semantic-ui/v2',
      element: {
        type: 'display',
        intent: 'discover-semantic-components',
        label: 'Semantic Discovery'
      },
      context: {
        flow: 'discovery',
        step: 0
      },
      metadata: {
        version: '2.0.0',
        created: new Date().toISOString(),
        tags: ['discovery', 'search', 'query']
      }
    };
  }

  render(): string {
    const displayMode = this.getAttribute('display-mode') || 'list';
    const hasResults = this.results.length > 0;

    return `
      <div class="semantic-discovery">
        <div class="discovery-header">
          <h3>Discovery Results</h3>
          <div class="discovery-controls">
            <button data-action="refresh" class="btn-refresh">
              🔄 Refresh
            </button>
            <button data-action="clear" class="btn-clear">
              ✕ Clear
            </button>
          </div>
        </div>
        
        <div class="discovery-query">
          ${this.renderQueryInfo()}
        </div>
        
        <div class="discovery-results ${displayMode}">
          ${hasResults ? this.renderResults(displayMode) : this.renderEmpty()}
        </div>
        
        <div class="discovery-footer">
          <span class="result-count">${this.results.length} components found</span>
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }

  private renderQueryInfo(): string {
    const query = this.getAttribute('query');
    const type = this.getAttribute('type');
    const intent = this.getAttribute('intent');
    const tags = this.getAttribute('tags');

    const criteria: string[] = [];
    if (query) criteria.push(`Query: "${query}"`);
    if (type) criteria.push(`Type: ${type}`);
    if (intent) criteria.push(`Intent: ${intent}`);
    if (tags) criteria.push(`Tags: ${tags}`);

    return criteria.length > 0 
      ? `<div class="query-info">${criteria.join(' • ')}</div>`
      : '<div class="query-info">No query specified</div>';
  }

  private renderResults(mode: string): string {
    if (mode === 'grid') {
      return this.results.map(result => `
        <div class="result-card" data-id="${result.id}">
          <div class="result-type">${result.manifest.element?.type || 'unknown'}</div>
          <div class="result-label">${result.manifest.element?.label || result.id}</div>
          <div class="result-intent">${result.manifest.element?.intent || 'none'}</div>
          <div class="result-relevance">
            <span class="relevance-bar" style="width: ${result.relevance}%"></span>
          </div>
        </div>
      `).join('');
    } else {
      return `
        <table class="results-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Intent</th>
              <th>Label</th>
              <th>Relevance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.results.map(result => `
              <tr data-id="${result.id}">
                <td class="id">${result.id.substring(0, 8)}...</td>
                <td class="type">${result.manifest.element?.type || 'unknown'}</td>
                <td class="intent">${result.manifest.element?.intent || 'none'}</td>
                <td class="label">${result.manifest.element?.label || '-'}</td>
                <td class="relevance">
                  <div class="relevance-indicator">
                    <span class="relevance-bar" style="width: ${result.relevance}%"></span>
                    <span class="relevance-text">${result.relevance}%</span>
                  </div>
                </td>
                <td class="actions">
                  <button data-action="inspect" data-id="${result.id}">Inspect</button>
                  <button data-action="highlight" data-id="${result.id}">Highlight</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  private renderEmpty(): string {
    return `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-message">No components discovered</div>
        <div class="empty-hint">Try adjusting your query criteria</div>
      </div>
    `;
  }

  defaultStyles(): string {
    return `
      ${super.defaultStyles()}
      
      .semantic-discovery {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        background: white;
      }
      
      .discovery-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .discovery-header h3 {
        margin: 0;
        font-size: 1.125rem;
        color: #333;
      }
      
      .discovery-controls {
        display: flex;
        gap: 8px;
      }
      
      .discovery-controls button {
        padding: 6px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
      }
      
      .discovery-controls button:hover {
        background: #f5f5f5;
        border-color: #2196F3;
      }
      
      .discovery-query {
        margin-bottom: 16px;
      }
      
      .query-info {
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 0.875rem;
        color: #666;
      }
      
      .discovery-results {
        min-height: 200px;
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 16px;
      }
      
      .discovery-results.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      
      .result-card {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 12px;
        background: white;
        transition: all 0.2s;
        cursor: pointer;
      }
      
      .result-card:hover {
        border-color: #2196F3;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .result-type {
        font-size: 0.75rem;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      
      .result-label {
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }
      
      .result-intent {
        font-size: 0.875rem;
        color: #999;
        margin-bottom: 8px;
      }
      
      .results-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .results-table th,
      .results-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .results-table th {
        background: #f5f5f5;
        font-weight: 500;
        font-size: 0.875rem;
        color: #666;
      }
      
      .results-table td {
        font-size: 0.875rem;
      }
      
      .results-table tr:hover {
        background: #f9f9f9;
      }
      
      .relevance-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .relevance-bar {
        display: block;
        height: 4px;
        background: #4CAF50;
        border-radius: 2px;
        transition: width 0.3s;
      }
      
      .relevance-text {
        font-size: 0.75rem;
        color: #666;
      }
      
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
      }
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      .empty-message {
        font-size: 1.125rem;
        color: #333;
        margin-bottom: 8px;
      }
      
      .empty-hint {
        font-size: 0.875rem;
        color: #666;
      }
      
      .discovery-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid #e0e0e0;
      }
      
      .result-count {
        font-size: 0.875rem;
        color: #666;
      }
      
      .actions button {
        padding: 4px 8px;
        margin: 0 2px;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-size: 0.75rem;
        transition: all 0.2s;
      }
      
      .actions button:hover {
        background: #2196F3;
        color: white;
        border-color: #2196F3;
      }
    `;
  }

  onConnected(): void {
    this.performDiscovery();
    this.setupAutoRefresh();
    this.setupActionHandlers();
  }

  onDisconnected(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  onAttributeChanged(name: string, oldValue: string | null, newValue: string | null): void {
    if (['query', 'type', 'intent', 'tags'].includes(name)) {
      this.performDiscovery();
    }
    
    if (name === 'auto-refresh') {
      this.setupAutoRefresh();
    }
  }

  private performDiscovery(): void {
    const provider = this.findProvider();
    if (!provider) {
      console.warn('No semantic-provider found');
      return;
    }

    const query = this.buildQuery();
    
    provider.dispatchEvent(new CustomEvent('semantic-discover', {
      detail: {
        query,
        callback: (results: any[]) => {
          this.processResults(results);
        }
      },
      bubbles: true
    }));
  }

  private buildQuery(): any {
    const query: any = {};
    
    const type = this.getAttribute('type');
    if (type) query.type = type;
    
    const intent = this.getAttribute('intent');
    if (intent) query.intent = intent;
    
    const tags = this.getAttribute('tags');
    if (tags) query.tags = tags.split(',').map(t => t.trim());
    
    const queryStr = this.getAttribute('query');
    if (queryStr) {
      try {
        Object.assign(query, JSON.parse(queryStr));
      } catch (e) {
        query.selector = queryStr;
      }
    }
    
    return query;
  }

  private processResults(results: any[]): void {
    this.results = results.map(result => ({
      ...result,
      relevance: this.calculateRelevance(result)
    }));
    
    this.results.sort((a, b) => b.relevance - a.relevance);
    
    this.updateContent();
    
    this.emit('semantic-discovery-complete', {
      query: this.buildQuery(),
      results: this.results
    });
  }

  private calculateRelevance(result: any): number {
    let score = 50;
    
    const query = this.buildQuery();
    
    if (query.type && result.manifest.element?.type === query.type) {
      score += 20;
    }
    
    if (query.intent && result.manifest.element?.intent === query.intent) {
      score += 20;
    }
    
    if (query.tags && result.manifest.metadata?.tags) {
      const matchedTags = query.tags.filter((tag: string) => 
        result.manifest.metadata.tags.includes(tag)
      );
      score += (matchedTags.length / query.tags.length) * 10;
    }
    
    return Math.min(100, Math.round(score));
  }

  private setupAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    const autoRefresh = this.getAttribute('auto-refresh');
    if (autoRefresh) {
      const interval = parseInt(autoRefresh) || 5000;
      this.refreshInterval = window.setInterval(() => {
        this.performDiscovery();
      }, interval);
    }
  }

  private setupActionHandlers(): void {
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.dataset.action === 'refresh') {
        this.refresh();
      } else if (target.dataset.action === 'clear') {
        this.clear();
      } else if (target.dataset.action === 'inspect') {
        this.inspectComponent(target.dataset.id!);
      } else if (target.dataset.action === 'highlight') {
        this.highlightComponent(target.dataset.id!);
      }
    });
  }

  private findProvider(): Element | null {
    return this.closest('semantic-provider') || 
           document.querySelector('semantic-provider');
  }

  public refresh(): void {
    this.performDiscovery();
  }

  public clear(): void {
    this.results = [];
    this.updateContent();
  }

  private inspectComponent(id: string): void {
    const result = this.results.find(r => r.id === id);
    if (result) {
      console.group(`🔍 Semantic Component: ${id}`);
      console.log('Element:', result.element);
      console.log('Manifest:', result.manifest);
      console.log('Relevance:', result.relevance);
      console.groupEnd();
      
      this.emit('semantic-inspect', { id, result });
    }
  }

  private highlightComponent(id: string): void {
    const result = this.results.find(r => r.id === id);
    if (result && result.element) {
      result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      result.element.style.outline = '2px solid #2196F3';
      result.element.style.outlineOffset = '4px';
      
      setTimeout(() => {
        result.element.style.outline = '';
        result.element.style.outlineOffset = '';
      }, 2000);
      
      this.emit('semantic-highlight', { id, element: result.element });
    }
  }

  public getResults(): DiscoveryResult[] {
    return this.results;
  }
}

customElements.define('semantic-discovery', SemanticDiscovery);