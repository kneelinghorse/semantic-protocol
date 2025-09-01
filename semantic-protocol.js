/**
 * Semantic Protocol JS
 * Universal meaning recognition for data - JavaScript edition
 * 
 * A direct port from Python, showing how portable the protocol is.
 * No dependencies. Just pure functions that understand meaning.
 */

// ============================================================================
// CORE PROTOCOL
// ============================================================================

/**
 * The universal response format
 */
class SemanticResult {
  constructor(semanticType, renderInstruction, confidence, metadata) {
    this.semanticType = semanticType;
    this.renderInstruction = renderInstruction;
    this.confidence = confidence;
    this.metadata = metadata;
  }

  toString() {
    return `${this.semanticType} → ${this.renderInstruction} (${Math.round(this.confidence * 100)}%)`;
  }
}

/**
 * The Semantic Protocol: Teaching computers to understand meaning.
 * 
 * This is the entire protocol. ~200 lines that replace thousands of 
 * manual UI decisions.
 */
class SemanticProtocol {
  constructor() {
    // Semantic identification rules - these recognize meaning
    this.semanticRules = {
      'cancellation': (field) => this._isCancellation(field),
      'currency': (field) => this._isCurrency(field),
      'temporal': (field) => this._isTemporal(field),
      'premium': (field) => this._isPremium(field),
      'identifier': (field) => this._isIdentifier(field),
      'status': (field) => this._isStatus(field),
      'percentage': (field) => this._isPercentage(field),
      'email': (field) => this._isEmail(field),
      'url': (field) => this._isUrl(field),
      'danger': (field) => this._isDanger(field),
    };

    // Render mapping - semantic + context = instruction
    this.renderMap = {
      // Cancellation patterns
      'cancellation:list': 'badge:danger',
      'cancellation:detail': 'alert:warning',
      'cancellation:form': 'toggle:danger',
      'cancellation:timeline': 'event:critical',
      
      // Currency patterns
      'currency:list': 'text:currency-compact',
      'currency:detail': 'text:currency-full',
      'currency:form': 'input:currency',
      'currency:timeline': 'chart:financial',
      
      // Temporal patterns
      'temporal:list': 'text:relative-time',
      'temporal:detail': 'text:absolute-datetime',
      'temporal:form': 'input:datepicker',
      'temporal:timeline': 'marker:timestamp',
      
      // Premium/Special patterns
      'premium:list': 'badge:gold',
      'premium:detail': 'card:elevated',
      'premium:form': 'toggle:premium',
      
      // Status patterns
      'status:list': 'badge:status',
      'status:detail': 'card:status',
      'status:form': 'select:status',
      
      // Identifier patterns
      'identifier:list': 'text:monospace',
      'identifier:detail': 'text:copyable',
      'identifier:form': 'input:readonly',
      
      // Percentage patterns
      'percentage:list': 'progress:compact',
      'percentage:detail': 'progress:detailed',
      'percentage:form': 'slider:percentage',
      
      // Email patterns
      'email:list': 'link:email',
      'email:detail': 'link:email-full',
      'email:form': 'input:email',
      
      // URL patterns
      'url:list': 'link:external',
      'url:detail': 'link:preview',
      'url:form': 'input:url',
      
      // Danger patterns
      'danger:list': 'badge:danger',
      'danger:detail': 'alert:danger',
      'danger:form': 'warning:inline',
    };
  }

  // ========================================================================
  // SEMANTIC IDENTIFICATION RULES
  // ========================================================================

  _isCancellation(field) {
    const name = (field.name || '').toLowerCase();
    const keywords = ['cancel', 'terminate', 'expire', 'revoke', 'void', 'delete'];
    
    if (keywords.some(kw => name.includes(kw))) {
      return 0.95;
    }
    if (field.type === 'boolean' && name.includes('is_') && 
        ['inactive', 'disabled'].some(kw => name.includes(kw))) {
      return 0.85;
    }
    return 0.0;
  }

  _isCurrency(field) {
    const name = (field.name || '').toLowerCase();
    const type = (field.type || '').toLowerCase();
    
    const currencyWords = ['price', 'amount', 'balance', 'cost', 'fee', 'payment', 'salary', 'revenue'];
    
    if (['decimal', 'money', 'currency'].includes(type)) {
      return 0.95;
    }
    if (currencyWords.some(word => name.includes(word))) {
      return 0.90;
    }
    if (['float', 'double', 'number'].includes(type) && 
        ['usd', 'eur', 'gbp'].some(word => name.includes(word))) {
      return 0.85;
    }
    return 0.0;
  }

  _isTemporal(field) {
    const name = (field.name || '').toLowerCase();
    const type = (field.type || '').toLowerCase();
    
    if (['timestamp', 'datetime', 'date', 'time'].includes(type)) {
      return 0.95;
    }
    if (name.endsWith('_at') || name.endsWith('_on')) {
      return 0.90;
    }
    if (['created', 'updated', 'modified', 'deleted', 'last_', 'next_'].some(word => name.includes(word))) {
      return 0.85;
    }
    return 0.0;
  }

  _isPremium(field) {
    const name = (field.name || '').toLowerCase();
    
    const premiumWords = ['premium', 'pro', 'vip', 'gold', 'platinum', 'elite', 'plus'];
    
    if (premiumWords.some(word => name.includes(word))) {
      return 0.90;
    }
    if (name.includes('tier') && ['premium', 'pro', 'gold'].includes(field.value)) {
      return 0.85;
    }
    return 0.0;
  }

  _isIdentifier(field) {
    const name = (field.name || '').toLowerCase();
    
    if (['id', 'uid', 'uuid', 'guid'].includes(name)) {
      return 0.95;
    }
    if (name.endsWith('_id') || name.endsWith('_key')) {
      return 0.90;
    }
    if (name.includes('identifier') || name.includes('reference')) {
      return 0.85;
    }
    return 0.0;
  }

  _isStatus(field) {
    const name = (field.name || '').toLowerCase();
    
    if (name.includes('status') || name.includes('state')) {
      return 0.95;
    }
    if (['active', 'enabled', 'visible', 'published'].includes(name)) {
      return 0.85;
    }
    if (field.type === 'enum' && ['type', 'kind', 'category'].includes(name)) {
      return 0.80;
    }
    return 0.0;
  }

  _isPercentage(field) {
    const name = (field.name || '').toLowerCase();
    const value = field.value;
    
    if (name.includes('percent') || name.includes('pct') || name.endsWith('_rate')) {
      return 0.95;
    }
    if (name.includes('ratio') || name.includes('factor')) {
      return 0.85;
    }
    if (typeof value === 'number' && value >= 0 && value <= 1) {
      return 0.70;
    }
    return 0.0;
  }

  _isEmail(field) {
    const name = (field.name || '').toLowerCase();
    const value = field.value || '';
    
    if (name.includes('email') || name.includes('mail')) {
      return 0.95;
    }
    if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
      return 0.90;
    }
    return 0.0;
  }

  _isUrl(field) {
    const name = (field.name || '').toLowerCase();
    const value = field.value || '';
    
    if (name.includes('url') || name.includes('link') || name.includes('website')) {
      return 0.95;
    }
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('www'))) {
      return 0.90;
    }
    return 0.0;
  }

  _isDanger(field) {
    const name = (field.name || '').toLowerCase();
    
    const dangerWords = ['error', 'fail', 'critical', 'severe', 'fatal', 'emergency', 'breach'];
    
    if (dangerWords.some(word => name.includes(word))) {
      return 0.90;
    }
    if (field.type === 'boolean' && name.includes('is_') && 
        ['blocked', 'banned', 'suspended'].some(word => name.includes(word))) {
      return 0.85;
    }
    return 0.0;
  }

  // ========================================================================
  // CORE PROTOCOL METHODS
  // ========================================================================

  analyze(fieldName, fieldType = 'string', fieldValue = null, context = 'list') {
    /**
     * The main protocol method: analyze a field and return semantic understanding.
     * 
     * This single method replaces thousands of manual UI decisions.
     */
    const field = {
      name: fieldName,
      type: fieldType,
      value: fieldValue
    };
    
    // Find the best semantic match
    let bestSemantic = 'default';
    let bestConfidence = 0.0;
    
    for (const [semanticType, ruleFunc] of Object.entries(this.semanticRules)) {
      const confidence = ruleFunc(field);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestSemantic = semanticType;
      }
    }
    
    // Get render instruction
    const renderKey = `${bestSemantic}:${context}`;
    const renderInstruction = this.renderMap[renderKey] || 'text:plain';
    
    // Build metadata
    const metadata = {
      field: fieldName,
      type: fieldType,
      context: context,
      allMatches: {}
    };
    
    // Include all semantic matches for transparency
    for (const [semanticType, ruleFunc] of Object.entries(this.semanticRules)) {
      const conf = ruleFunc(field);
      if (conf > 0) {
        metadata.allMatches[semanticType] = conf;
      }
    }
    
    return new SemanticResult(
      bestSemantic,
      renderInstruction,
      bestConfidence > 0 ? bestConfidence : 1.0,
      metadata
    );
  }

  batchAnalyze(fields, context = 'list') {
    /**
     * Analyze multiple fields at once
     */
    const results = {};
    
    for (const field of fields) {
      let name, type, value;
      
      if (typeof field === 'object' && field !== null) {
        name = field.name || 'unknown';
        type = field.type || 'string';
        value = field.value;
      } else {
        name = String(field);
        type = 'string';
        value = null;
      }
      
      results[name] = this.analyze(name, type, value, context);
    }
    
    return results;
  }

  getSupportedSemantics() {
    /**
     * List all supported semantic types
     */
    return Object.keys(this.semanticRules);
  }

  getSupportedContexts() {
    /**
     * List all supported rendering contexts
     */
    const contexts = new Set();
    for (const key of Object.keys(this.renderMap)) {
      const context = key.split(':')[1];
      contexts.add(context);
    }
    return Array.from(contexts).sort();
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

// Global instance for simple usage
const protocol = new SemanticProtocol();

function analyze(fieldName, fieldType = 'string', fieldValue = null, context = 'list') {
  /**
   * Quick analysis using the global protocol instance
   */
  return protocol.analyze(fieldName, fieldType, fieldValue, context);
}

function identify(fieldName, fieldType = 'string') {
  /**
   * Just get the semantic type
   */
  const result = protocol.analyze(fieldName, fieldType);
  return result.semanticType;
}

function render(fieldName, fieldType = 'string', context = 'list') {
  /**
   * Just get the render instruction
   */
  const result = protocol.analyze(fieldName, fieldType, null, context);
  return result.renderInstruction;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SemanticProtocol,
    SemanticResult,
    analyze,
    identify,
    render,
    protocol
  };
}

// ES6 Modules
if (typeof exports !== 'undefined') {
  exports.SemanticProtocol = SemanticProtocol;
  exports.SemanticResult = SemanticResult;
  exports.analyze = analyze;
  exports.identify = identify;
  exports.render = render;
  exports.protocol = protocol;
}

// Browser global
if (typeof window !== 'undefined') {
  window.SemanticProtocol = {
    SemanticProtocol,
    SemanticResult,
    analyze,
    identify,
    render,
    protocol
  };
}

// ============================================================================
// SELF-TEST
// ============================================================================

// Only run if this is the main module (Node.js)
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🧬 Semantic Protocol JS v0.1.0');
  console.log('='.repeat(60));
  
  const testFields = [
    ['is_cancelled', 'boolean', null, 'list'],
    ['is_cancelled', 'boolean', null, 'detail'],
    ['total_price', 'decimal', 99.99, 'list'],
    ['created_at', 'timestamp', null, 'list'],
    ['user_id', 'uuid', null, 'detail'],
    ['subscription_status', 'enum', null, 'form'],
    ['email_address', 'string', 'user@example.com', 'list'],
    ['completion_rate', 'float', 0.85, 'detail'],
    ['is_premium', 'boolean', true, 'list'],
    ['error_count', 'integer', 5, 'list'],
  ];
  
  console.log('\nSemantic Analysis Results:');
  console.log('-'.repeat(60));
  
  for (const [fieldName, fieldType, value, context] of testFields) {
    const result = analyze(fieldName, fieldType, value, context);
    const output = `${fieldName.padEnd(20)} (${context.padEnd(8)}) → ${result}`;
    console.log(output);
  }
  
  console.log('\n✨ JavaScript port complete! Same logic, different syntax.');
}
