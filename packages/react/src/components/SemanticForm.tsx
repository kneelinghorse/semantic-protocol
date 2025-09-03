import React, { useMemo } from 'react';
import { SemanticProtocol, FieldDefinition, RenderContext } from '@kneelinghorse/semantic-protocol';
import { SemanticField } from './SemanticField';

export interface SemanticFormProps {
  /** Data object to analyze and render */
  data: Record<string, any>;
  /** Fields to include (if not provided, all fields are included) */
  fields?: string[];
  /** Fields to exclude */
  excludeFields?: string[];
  /** Confidence threshold for semantic analysis */
  confidenceThreshold?: number;
  /** Form submission handler */
  onSubmit?: (data: Record<string, any>) => void;
  /** Field change handler */
  onChange?: (field: string, value: any) => void;
  /** Custom field renderers */
  customRenderers?: Record<string, React.ComponentType<any>>;
  /** Additional form props */
  formProps?: React.FormHTMLAttributes<HTMLFormElement>;
  /** Show debug information */
  showDebug?: boolean;
}

/**
 * SemanticForm - Automatically generates form fields based on semantic analysis
 */
export const SemanticForm: React.FC<SemanticFormProps> = ({
  data,
  fields,
  excludeFields = [],
  confidenceThreshold = 70,
  onSubmit,
  onChange,
  customRenderers = {},
  formProps = {},
  showDebug = false
}) => {
  // Determine which fields to render
  const fieldsToRender = useMemo(() => {
    const dataFields = Object.keys(data);
    let selectedFields = fields || dataFields;
    
    // Filter out excluded fields
    return selectedFields.filter(field => !excludeFields.includes(field));
  }, [data, fields, excludeFields]);

  // Create field definitions for semantic analysis
  const fieldDefinitions = useMemo(() => {
    return fieldsToRender.map(fieldName => ({
      name: fieldName,
      type: inferDataType(data[fieldName]),
      value: data[fieldName]
    } as FieldDefinition));
  }, [fieldsToRender, data]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      // Collect current form data
      const formData = { ...data };
      onSubmit(formData);
    }
  };

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  return (
    <form onSubmit={handleSubmit} {...formProps} className={`semantic-form ${formProps.className || ''}`}>
      {fieldDefinitions.map((fieldDef) => {
        const CustomRenderer = customRenderers[fieldDef.name];
        
        if (CustomRenderer) {
          return (
            <div key={fieldDef.name} className="semantic-form-field">
              <CustomRenderer 
                field={fieldDef}
                value={fieldDef.value}
                onChange={(value: any) => handleFieldChange(fieldDef.name, value)}
              />
            </div>
          );
        }

        return (
          <div key={fieldDef.name} className="semantic-form-field">
            <label htmlFor={fieldDef.name} className="semantic-form-label">
              {formatFieldName(fieldDef.name)}
            </label>
            <SemanticField
              field={fieldDef}
              value={fieldDef.value}
              context="form"
              confidenceThreshold={confidenceThreshold}
              showDebug={showDebug}
              componentProps={{
                id: fieldDef.name,
                name: fieldDef.name,
                onChange: (e: any) => {
                  const value = e?.target?.value !== undefined ? e.target.value : e;
                  handleFieldChange(fieldDef.name, value);
                }
              }}
            />
          </div>
        );
      })}
      
      <div className="semantic-form-actions">
        <button type="submit" className="semantic-form-submit">
          Submit
        </button>
      </div>
    </form>
  );
};

// Helper function to format field names for display
function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Helper function to infer data type from value
function inferDataType(value: any): 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
}