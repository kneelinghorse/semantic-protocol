import { useState, useEffect, useMemo } from 'react';
import { SemanticProtocol, FieldDefinition, RenderContext, AnalysisResult, DataType } from '@kneelinghorse/semantic-protocol';

export interface UseSemanticFieldOptions {
  /** Field definition to analyze */
  field: FieldDefinition | string;
  /** Field value */
  value?: any;
  /** Rendering context */
  context?: RenderContext;
  /** Custom confidence threshold */
  confidenceThreshold?: number;
  /** Error handling */
  onError?: (error: Error) => void;
}

export interface UseSemanticFieldReturn {
  /** Current field value */
  value: any;
  /** Set field value */
  setValue: (value: any) => void;
  /** Semantic analysis result */
  analysis: AnalysisResult | null;
  /** Render instruction */
  renderInstruction: AnalysisResult['renderInstruction'] | null;
  /** Semantic type */
  semanticType: string | null;
  /** Field is loading */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook for semantic field analysis and rendering
 */
export function useSemanticField(options: UseSemanticFieldOptions): UseSemanticFieldReturn {
  const {
    field,
    value: initialValue,
    context = 'list',
    confidenceThreshold = 70,
    onError
  } = options;

  const [value, setValue] = useState(initialValue);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create protocol instance
  const protocol = useMemo(() => {
    return new SemanticProtocol(confidenceThreshold);
  }, [confidenceThreshold]);

  // Perform semantic analysis
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      let fieldDef: FieldDefinition;
      
      if (typeof field === 'string') {
        // Create field definition from string
        fieldDef = {
          name: field,
          type: inferDataType(value),
          value
        };
      } else {
        // Use provided field definition
        fieldDef = {
          ...field,
          value: value !== undefined ? value : field.value
        };
      }

      // Analyze the field
      const result = protocol.analyze(fieldDef, context);
      setAnalysis(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [field, value, context, protocol, onError]);

  return {
    value,
    setValue,
    analysis,
    renderInstruction: analysis?.renderInstruction || null,
    semanticType: analysis?.bestMatch?.semantic || null,
    isLoading,
    error
  };
}

// Helper function to infer data type from value
function inferDataType(value: any): DataType {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'integer';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
}