import React, { useMemo, forwardRef } from 'react';
import { SemanticProtocol, FieldDefinition, RenderContext, AnalysisResult, DataType } from '@kneelinghorse/semantic-protocol';

export interface SemanticFieldProps {
  /** Field name to analyze */
  field: string | FieldDefinition;
  /** Field value to display/edit */
  value?: any;
  /** Rendering context */
  context?: RenderContext;
  /** Custom confidence threshold */
  confidenceThreshold?: number;
  /** Override semantic type */
  semanticType?: string;
  /** Custom render instruction */
  renderInstruction?: any;
  /** Additional props to pass to the rendered component */
  componentProps?: Record<string, any>;
  /** Fallback component if semantic analysis fails */
  fallback?: React.ComponentType<any>;
  /** Error boundary for semantic analysis failures */
  onError?: (error: Error, analysis: AnalysisResult | null) => void;
  /** Custom styling */
  className?: string;
  /** Custom styling for the field wrapper */
  wrapperClassName?: string;
  /** Show semantic debugging info in dev mode */
  showDebug?: boolean;
}

/**
 * SemanticField - Automatically renders the right UI component based on semantic analysis
 * 
 * This component is the heart of the Semantic Protocol React integration.
 * It analyzes field names and types to automatically choose the best UI component.
 */
export const SemanticField = forwardRef<HTMLDivElement, SemanticFieldProps>(({
  field,
  value,
  context = 'list',
  confidenceThreshold = 70,
  semanticType,
  renderInstruction: customRenderInstruction,
  componentProps = {},
  fallback: FallbackComponent,
  onError,
  className = '',
  wrapperClassName = '',
  showDebug = false,
  ...rest
}, ref) => {
  // Create protocol instance
  const protocol = useMemo(() => {
    return new SemanticProtocol(confidenceThreshold);
  }, [confidenceThreshold]);

  // Analyze the field
  const analysis = useMemo(() => {
    try {
      if (typeof field === 'string') {
        // Simple string field name - infer type from value
        const fieldDef: FieldDefinition = {
          name: field,
          type: inferDataType(value),
          value
        };
        return protocol.analyze(fieldDef, context);
      } else {
        // Full field definition
        return protocol.analyze(field, context);
      }
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      if (onError) {
        onError(error as Error, null);
      }
      return null;
    }
  }, [field, value, context, protocol, onError]);

  // Use custom render instruction if provided, otherwise use analysis result
  const renderInstruction = customRenderInstruction || analysis?.renderInstruction;

  // Render the appropriate component based on semantic analysis
  const renderedComponent = useMemo(() => {
    if (!renderInstruction) {
      return FallbackComponent ? <FallbackComponent value={value} /> : <span>{String(value ?? '')}</span>;
    }

    const { component, variant, props = {} } = renderInstruction;
    const allProps = { ...props, ...componentProps, value };

    try {
      switch (component) {
        case 'badge':
          return <SemanticBadge variant={variant} {...allProps} />;
        
        case 'text':
          return <SemanticText variant={variant} {...allProps} />;
        
        case 'input':
          return <SemanticInput variant={variant} {...allProps} />;
        
        case 'toggle':
          return <SemanticToggle variant={variant} {...allProps} />;
        
        case 'alert':
          return <SemanticAlert variant={variant} {...allProps} />;
        
        case 'progress':
          return <SemanticProgress variant={variant} {...allProps} />;
        
        case 'link':
          return <SemanticLink variant={variant} {...allProps} />;
        
        case 'datepicker':
          return <SemanticDatePicker {...allProps} />;
        
        case 'indicator':
          return <SemanticIndicator variant={variant} {...allProps} />;
        
        case 'select':
          return <SemanticSelect variant={variant} {...allProps} />;
        
        case 'slider':
          return <SemanticSlider {...allProps} />;
        
        case 'metric':
          return <SemanticMetric variant={variant} {...allProps} />;
        
        case 'card':
          return <SemanticCard variant={variant} {...allProps} />;
        
        case 'event':
          return <SemanticEvent variant={variant} {...allProps} />;
        
        case 'state-change':
          return <SemanticStateChange {...allProps} />;
        
        case 'contact':
          return <SemanticContact {...allProps} />;
        
        case 'reference':
          return <SemanticReference variant={variant} {...allProps} />;
        
        default:
          console.warn(`Unknown semantic component: ${component}`);
          return <span {...allProps}>{String(value ?? '')}</span>;
      }
    } catch (error) {
      console.error(`Failed to render semantic component ${component}:`, error);
      if (onError) {
        onError(error as Error, analysis);
      }
      return FallbackComponent ? <FallbackComponent value={value} /> : <span>{String(value ?? '')}</span>;
    }
  }, [renderInstruction, componentProps, value, FallbackComponent, onError, analysis]);

  // Debug information (only shown when explicitly enabled)
  const showDebugInfo = showDebug && analysis;

  return (
    <div 
      ref={ref}
      className={`semantic-field ${className}`}
      data-semantic-field={typeof field === 'string' ? field : field.name}
      data-semantic-type={analysis?.bestMatch?.semantic}
      data-semantic-confidence={analysis?.bestMatch?.confidence}
      data-render-component={renderInstruction?.component}
      data-render-variant={renderInstruction?.variant}
      {...rest}
    >
      <div className={`semantic-field-wrapper ${wrapperClassName}`}>
        {renderedComponent}
      </div>
      
      {showDebugInfo && (
        <div className="semantic-debug" style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
          <div>🎯 {analysis.bestMatch?.semantic} ({analysis.bestMatch?.confidence}%)</div>
          <div>🔧 {renderInstruction.component}:{renderInstruction.variant || 'default'}</div>
          <div>📊 {analysis.semantics.length} semantic matches</div>
        </div>
      )}
    </div>
  );
});

SemanticField.displayName = 'SemanticField';

// Helper function to infer data type from value
function inferDataType(value: any): DataType {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
}

// Semantic Component Implementations
// These are basic implementations - in a real app, you'd want more sophisticated components

const SemanticBadge: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <span 
    className={`semantic-badge semantic-badge-${variant || 'default'}`}
    {...props}
  >
    {String(value ?? '')}
  </span>
);

const SemanticText: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <span 
    className={`semantic-text semantic-text-${variant || 'default'}`}
    {...props}
  >
    {String(value ?? '')}
  </span>
);

const SemanticInput: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <input 
    type={variant === 'email' ? 'email' : variant === 'number' ? 'number' : 'text'}
    className={`semantic-input semantic-input-${variant || 'default'}`}
    defaultValue={value}
    {...props}
  />
);

const SemanticToggle: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <input 
    type="checkbox"
    className={`semantic-toggle semantic-toggle-${variant || 'default'}`}
    defaultChecked={Boolean(value)}
    {...props}
  />
);

const SemanticAlert: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <div 
    className={`semantic-alert semantic-alert-${variant || 'default'}`}
    role="alert"
    {...props}
  >
    {String(value ?? '')}
  </div>
);

const SemanticProgress: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <div className={`semantic-progress semantic-progress-${variant || 'default'}`}>
    <div 
      className="semantic-progress-bar"
      style={{ width: `${Math.min(100, Math.max(0, Number(value) * 100))}%` }}
      {...props}
    />
  </div>
);

const SemanticLink: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => {
  if (variant === 'email') {
    return (
      <a 
        href={`mailto:${value}`}
        className="semantic-link semantic-link-email"
        {...props}
      >
        {String(value ?? '')}
      </a>
    );
  }
  
  return (
    <a 
      href={value}
      className="semantic-link semantic-link-external"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {String(value ?? '')}
    </a>
  );
};

const SemanticDatePicker: React.FC<{ value?: any; [key: string]: any }> = ({ value, ...props }) => (
  <input 
    type="date"
    className="semantic-datepicker"
    defaultValue={value instanceof Date ? value.toISOString().split('T')[0] : value}
    {...props}
  />
);

const SemanticIndicator: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <div 
    className={`semantic-indicator semantic-indicator-${variant || 'default'}`}
    {...props}
  >
    {String(value ?? '')}
  </div>
);

const SemanticSelect: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <select 
    className={`semantic-select semantic-select-${variant || 'default'}`}
    defaultValue={value}
    {...props}
  >
    <option value="">Select...</option>
  </select>
);

const SemanticSlider: React.FC<{ value?: any; min?: number; max?: number; [key: string]: any }> = ({ 
  value, 
  min = 0, 
  max = 100, 
  ...props 
}) => (
  <input 
    type="range"
    className="semantic-slider"
    min={min}
    max={max}
    defaultValue={value}
    {...props}
  />
);

const SemanticMetric: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <div 
    className={`semantic-metric semantic-metric-${variant || 'default'}`}
    {...props}
  >
    {String(value ?? '')}
  </div>
);

const SemanticCard: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <div 
    className={`semantic-card semantic-card-${variant || 'default'}`}
    {...props}
  >
    {String(value ?? '')}
  </div>
);

const SemanticEvent: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <div 
    className={`semantic-event semantic-event-${variant || 'default'}`}
    {...props}
  >
    {String(value ?? '')}
  </div>
);

const SemanticStateChange: React.FC<{ value?: any; [key: string]: any }> = ({ value, ...props }) => (
  <div 
    className="semantic-state-change"
    {...props}
  >
    {String(value ?? '')}
  </div>
);

const SemanticContact: React.FC<{ value?: any; [key: string]: any }> = ({ value, ...props }) => (
  <div 
    className="semantic-contact"
    {...props}
  >
    {String(value ?? '')}
  </div>
);

const SemanticReference: React.FC<{ variant?: string; value?: any; [key: string]: any }> = ({ variant, value, ...props }) => (
  <div 
    className={`semantic-reference semantic-reference-${variant || 'default'}`}
    {...props}
  >
    {String(value ?? '')}
  </div>
);
