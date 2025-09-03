/**
 * Semantic Protocol - TypeScript Implementation
 * Universal meaning recognition for data with full type safety
 */

// Core Types
export type SemanticType =
  | 'cancellation'
  | 'currency'
  | 'temporal'
  | 'premium'
  | 'identifier'
  | 'status'
  | 'percentage'
  | 'email'
  | 'url'
  | 'danger';

export type RenderContext = 'list' | 'detail' | 'form' | 'timeline';

export type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'datetime'
  | 'time'
  | 'decimal'
  | 'money'
  | 'currency'
  | 'integer'
  | 'float'
  | 'object'
  | 'array';

export interface SemanticMatch {
  semantic: SemanticType;
  confidence: number;
  reason: string;
}

export interface RenderInstruction {
  component: string;
  variant?: string;
  props?: Record<string, any>;
}

export interface AnalysisResult {
  field: string;
  dataType: DataType;
  semantics: SemanticMatch[];
  bestMatch: SemanticMatch | null;
  context: RenderContext;
  renderInstruction: RenderInstruction;
  metadata: {
    allMatches: SemanticMatch[];
    confidence: number;
    reasoning: string[];
  };
}

// Simplified result type for convenience function
export interface SemanticResult {
  semantic_type: SemanticType | null;
  render_instruction: string;
  confidence: number;
}

export interface FieldDefinition {
  name: string;
  type: DataType;
  value?: any;
  nullable?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  foreignKey?: boolean;
  defaultValue?: any;
  description?: string;
}

// Semantic Rules with Type Safety
export class SemanticRules {
  private static readonly PATTERNS: Record<SemanticType, {
    keywords: string[];
    types?: DataType[];
    confidence: { keyword: number; type: number };
  }> = {
      cancellation: {
        keywords: ['cancel', 'terminate', 'expire', 'revoke', 'void', 'delete', 'abort', 'stop'],
        types: ['boolean'],
        confidence: { keyword: 95, type: 85 }
      },
      currency: {
        keywords: ['price', 'amount', 'balance', 'cost', 'fee', 'payment', 'charge', 'salary', 'revenue'],
        types: ['decimal', 'money', 'currency', 'number'],
        confidence: { keyword: 90, type: 95 }
      },
      temporal: {
        keywords: ['created', 'updated', 'modified', 'deleted', 'timestamp', 'date', 'time'],
        types: ['timestamp', 'datetime', 'date', 'time'],
        confidence: { keyword: 90, type: 95 }
      },
      premium: {
        keywords: ['premium', 'pro', 'vip', 'gold', 'platinum', 'elite', 'plus', 'tier', 'subscription'],
        types: ['boolean', 'string'],
        confidence: { keyword: 90, type: 70 }
      },
      identifier: {
        keywords: ['id', 'uid', 'uuid', 'guid', 'key', 'code', 'ref', 'reference'],
        types: ['string', 'integer'],
        confidence: { keyword: 95, type: 80 }
      },
      status: {
        keywords: ['status', 'state', 'active', 'enabled', 'visible', 'published', 'draft'],
        types: ['boolean', 'string'],
        confidence: { keyword: 95, type: 75 }
      },
      percentage: {
        keywords: ['percent', 'pct', 'rate', 'ratio', 'factor', 'discount', 'tax'],
        types: ['decimal', 'float', 'number'],
        confidence: { keyword: 95, type: 80 }
      },
      email: {
        keywords: ['email', 'mail', 'contact', 'address'],
        types: ['string'],
        confidence: { keyword: 95, type: 70 }
      },
      url: {
        keywords: ['url', 'link', 'website', 'site', 'href', 'path', 'endpoint'],
        types: ['string'],
        confidence: { keyword: 95, type: 70 }
      },
      danger: {
        keywords: ['error', 'fail', 'critical', 'severe', 'fatal', 'emergency', 'alert', 'warning'],
        types: ['boolean', 'string'],
        confidence: { keyword: 90, type: 70 }
      }
    };

  static analyze(field: FieldDefinition): SemanticMatch[] {
    const matches: SemanticMatch[] = [];
    const fieldLower = field.name.toLowerCase();

    for (const [semantic, rules] of Object.entries(this.PATTERNS) as [SemanticType, typeof this.PATTERNS[SemanticType]][]) {
      let confidence = 0;
      const reasons: string[] = [];

      // Check keywords
      for (const keyword of rules.keywords) {
        if (fieldLower.includes(keyword)) {
          confidence = Math.max(confidence, rules.confidence.keyword);
          reasons.push(`Field name contains '${keyword}'`);
          break;
        }
      }

      // Check suffixes
      if (fieldLower.endsWith('_at') && semantic === 'temporal') {
        confidence = Math.max(confidence, 90);
        reasons.push("Field ends with '_at' (temporal pattern)");
      }
      if (fieldLower.endsWith('_id') && semantic === 'identifier') {
        confidence = Math.max(confidence, 90);
        reasons.push("Field ends with '_id' (identifier pattern)");
      }
      if (fieldLower.endsWith('_rate') && semantic === 'percentage') {
        confidence = Math.max(confidence, 85);
        reasons.push("Field ends with '_rate' (percentage pattern)");
      }

      // Check data type
      if (rules.types && rules.types.includes(field.type)) {
        confidence = Math.max(confidence, rules.confidence.type);
        reasons.push(`Data type '${field.type}' matches semantic`);
      }

      // Check value patterns
      if (field.value !== undefined) {
        if (semantic === 'email' && typeof field.value === 'string' && field.value.includes('@')) {
          confidence = Math.max(confidence, 90);
          reasons.push("Value contains '@' (email pattern)");
        }
        if (semantic === 'url' && typeof field.value === 'string' &&
            (field.value.startsWith('http://') || field.value.startsWith('https://'))) {
          confidence = Math.max(confidence, 90);
          reasons.push('Value starts with http(s):// (URL pattern)');
        }
        if (semantic === 'percentage' && typeof field.value === 'number' &&
            field.value >= 0 && field.value <= 1) {
          confidence = Math.max(confidence, 70);
          reasons.push('Value between 0-1 (percentage pattern)');
        }
      }

      if (confidence > 0) {
        matches.push({
          semantic,
          confidence,
          reason: reasons.join('; ')
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }
}

// Render Mapping with Type Safety
export class RenderMap {
  private static readonly MAPPINGS: Record<SemanticType, Record<RenderContext, RenderInstruction>> = {
    cancellation: {
      list: { component: 'badge', variant: 'danger', props: { size: 'sm' } },
      detail: { component: 'alert', variant: 'warning' },
      form: { component: 'toggle', variant: 'danger' },
      timeline: { component: 'event', variant: 'critical' }
    },
    currency: {
      list: { component: 'text', variant: 'currency-compact', props: { precision: 0 } },
      detail: { component: 'text', variant: 'currency-full', props: { precision: 2 } },
      form: { component: 'input', variant: 'currency', props: { symbol: '$' } },
      timeline: { component: 'metric', variant: 'financial' }
    },
    temporal: {
      list: { component: 'text', variant: 'date-relative' },
      detail: { component: 'text', variant: 'datetime-full' },
      form: { component: 'datepicker', props: { showTime: true } },
      timeline: { component: 'timestamp', variant: 'absolute' }
    },
    premium: {
      list: { component: 'badge', variant: 'premium', props: { icon: 'star' } },
      detail: { component: 'card', variant: 'premium-highlight' },
      form: { component: 'toggle', variant: 'premium' },
      timeline: { component: 'event', variant: 'upgrade' }
    },
    identifier: {
      list: { component: 'text', variant: 'mono-compact' },
      detail: { component: 'text', variant: 'mono', props: { copyable: true } },
      form: { component: 'input', variant: 'readonly' },
      timeline: { component: 'reference', variant: 'identifier' }
    },
    status: {
      list: { component: 'badge', variant: 'status' },
      detail: { component: 'indicator', variant: 'status' },
      form: { component: 'select', variant: 'status' },
      timeline: { component: 'state-change' }
    },
    percentage: {
      list: { component: 'progress', variant: 'compact' },
      detail: { component: 'progress', variant: 'detailed' },
      form: { component: 'slider', props: { min: 0, max: 100 } },
      timeline: { component: 'metric', variant: 'percentage' }
    },
    email: {
      list: { component: 'link', variant: 'email', props: { truncate: true } },
      detail: { component: 'link', variant: 'email' },
      form: { component: 'input', variant: 'email' },
      timeline: { component: 'contact' }
    },
    url: {
      list: { component: 'link', variant: 'external', props: { truncate: true } },
      detail: { component: 'link', variant: 'external', props: { showIcon: true } },
      form: { component: 'input', variant: 'url' },
      timeline: { component: 'link', variant: 'reference' }
    },
    danger: {
      list: { component: 'badge', variant: 'danger' },
      detail: { component: 'alert', variant: 'danger' },
      form: { component: 'toggle', variant: 'danger' },
      timeline: { component: 'event', variant: 'error' }
    }
  };

  static getRenderInstruction(semantic: SemanticType, context: RenderContext): RenderInstruction {
    return this.MAPPINGS[semantic][context];
  }

  static getDefault(dataType: DataType, context: RenderContext): RenderInstruction {
    const defaults: Record<DataType, Record<RenderContext, RenderInstruction>> = {
      string: {
        list: { component: 'text' },
        detail: { component: 'text' },
        form: { component: 'input', variant: 'text' },
        timeline: { component: 'text' }
      },
      number: {
        list: { component: 'text', variant: 'number' },
        detail: { component: 'text', variant: 'number' },
        form: { component: 'input', variant: 'number' },
        timeline: { component: 'metric' }
      },
      boolean: {
        list: { component: 'badge', variant: 'boolean' },
        detail: { component: 'indicator' },
        form: { component: 'toggle' },
        timeline: { component: 'state' }
      },
      date: {
        list: { component: 'text', variant: 'date' },
        detail: { component: 'text', variant: 'date' },
        form: { component: 'datepicker' },
        timeline: { component: 'timestamp' }
      }
      // ... other types follow similar pattern
    } as Record<DataType, Record<RenderContext, RenderInstruction>>;

    return defaults[dataType]?.[context] || { component: 'text' };
  }
}

// Main Semantic Protocol Class
export class SemanticProtocol {
  private confidenceThreshold: number;

  constructor(confidenceThreshold: number = 70) {
    this.confidenceThreshold = confidenceThreshold;
  }

  analyze(field: FieldDefinition, context: RenderContext = 'list'): AnalysisResult {
    const semantics = SemanticRules.analyze(field);
    const bestMatch = semantics.find(s => s.confidence >= this.confidenceThreshold) || null;

    const renderInstruction = bestMatch
      ? RenderMap.getRenderInstruction(bestMatch.semantic, context)
      : RenderMap.getDefault(field.type, context);

    return {
      field: field.name,
      dataType: field.type,
      semantics: semantics.filter(s => s.confidence >= this.confidenceThreshold),
      bestMatch,
      context,
      renderInstruction,
      metadata: {
        allMatches: semantics,
        confidence: bestMatch?.confidence || 0,
        reasoning: semantics.map(s => s.reason)
      }
    };
  }

  analyzeSchema(fields: FieldDefinition[], context: RenderContext = 'list'): AnalysisResult[] {
    return fields.map(field => this.analyze(field, context));
  }

  // Type-safe builder pattern for field definitions
  static field(name: string): FieldBuilder {
    return new FieldBuilder(name);
  }
}

// Fluent Builder for Type-Safe Field Creation
export class FieldBuilder {
  private field: FieldDefinition;

  constructor(name: string) {
    this.field = { name, type: 'string' };
  }

  type(type: DataType): this {
    this.field.type = type;
    return this;
  }

  value(value: any): this {
    this.field.value = value;
    return this;
  }

  nullable(nullable: boolean = true): this {
    this.field.nullable = nullable;
    return this;
  }

  unique(unique: boolean = true): this {
    this.field.unique = unique;
    return this;
  }

  primaryKey(pk: boolean = true): this {
    this.field.primaryKey = pk;
    return this;
  }

  description(desc: string): this {
    this.field.description = desc;
    return this;
  }

  build(): FieldDefinition {
    return this.field;
  }
}

// Utility functions for common patterns
export const semanticUtils = {
  isHighConfidence: (result: AnalysisResult): boolean => {
    return result.metadata.confidence >= 90;
  },

  hasSemantic: (result: AnalysisResult, semantic: SemanticType): boolean => {
    return result.semantics.some(s => s.semantic === semantic);
  },

  getBestSemantic: (result: AnalysisResult): SemanticType | null => {
    return result.bestMatch?.semantic || null;
  },

  groupBySemantics: (results: AnalysisResult[]): Record<SemanticType, AnalysisResult[]> => {
    const grouped = {} as Record<SemanticType, AnalysisResult[]>;

    for (const result of results) {
      if (result.bestMatch) {
        const semantic = result.bestMatch.semantic;
        if (!grouped[semantic]) {
          grouped[semantic] = [];
        }
        grouped[semantic].push(result);
      }
    }

    return grouped;
  }
};

// Create default instance for convenience functions
const defaultAnalyzer = new SemanticProtocol();

// Convenience function for simple analysis
export function analyze(
  name: string,
  type: DataType | string,
  options?: { context?: RenderContext; description?: string }
): AnalysisResult {
  const field: FieldDefinition = {
    name,
    type: type as DataType,
    description: options?.description
  };
  return defaultAnalyzer.analyze(field, options?.context || 'list');
}

// Re-export the class as both named and default
export { SemanticProtocol as SemanticAnalyzer };

// Export everything for consumption
export default SemanticProtocol;
