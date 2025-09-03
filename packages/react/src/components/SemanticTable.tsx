import React, { useMemo } from 'react';
import { SemanticProtocol, FieldDefinition } from '@kneelinghorse/semantic-protocol';
import { SemanticField } from './SemanticField';

export interface SemanticTableProps {
  /** Array of data objects to display */
  data: Record<string, any>[];
  /** Columns to display (if not provided, all fields are shown) */
  columns?: string[];
  /** Columns to exclude */
  excludeColumns?: string[];
  /** Confidence threshold for semantic analysis */
  confidenceThreshold?: number;
  /** Row click handler */
  onRowClick?: (row: Record<string, any>, index: number) => void;
  /** Custom column renderers */
  customRenderers?: Record<string, React.ComponentType<any>>;
  /** Show debug information */
  showDebug?: boolean;
  /** Additional table props */
  tableProps?: React.TableHTMLAttributes<HTMLTableElement>;
}

/**
 * SemanticTable - Automatically renders table with appropriate UI components based on semantic analysis
 */
export const SemanticTable: React.FC<SemanticTableProps> = ({
  data,
  columns,
  excludeColumns = [],
  confidenceThreshold = 70,
  onRowClick,
  customRenderers = {},
  showDebug = false,
  tableProps = {}
}) => {
  // Determine which columns to render
  const columnsToRender = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const firstRow = data[0];
    if (!firstRow) return [];
    
    const allColumns = Object.keys(firstRow);
    let selectedColumns = columns || allColumns;
    
    // Filter out excluded columns
    return selectedColumns.filter(col => !excludeColumns.includes(col));
  }, [data, columns, excludeColumns]);

  // Create protocol instance for analysis
  const protocol = useMemo(() => {
    return new SemanticProtocol(confidenceThreshold);
  }, [confidenceThreshold]);

  // Analyze column types based on first few rows
  const columnAnalysis = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const analysis: Record<string, any> = {};
    const sampleSize = Math.min(5, data.length);
    
    columnsToRender.forEach(column => {
      // Sample values from first few rows
      const sampleValues = data.slice(0, sampleSize).map(row => row[column]);
      const nonNullValue = sampleValues.find(v => v != null);
      
      // Create field definition for analysis
      const fieldDef: FieldDefinition = {
        name: column,
        type: inferDataType(nonNullValue),
        value: nonNullValue
      };
      
      // Analyze the field
      try {
        analysis[column] = protocol.analyze(fieldDef, 'list');
      } catch (error) {
        console.warn(`Failed to analyze column ${column}:`, error);
      }
    });
    
    return analysis;
  }, [data, columnsToRender, protocol]);

  if (!data || data.length === 0) {
    return (
      <div className="semantic-table-empty">
        No data to display
      </div>
    );
  }

  return (
    <table {...tableProps} className={`semantic-table ${tableProps.className || ''}`}>
      <thead className="semantic-table-header">
        <tr>
          {columnsToRender.map(column => (
            <th key={column} className="semantic-table-header-cell">
              {formatColumnName(column)}
            </th>
          ))}
        </tr>
      </thead>
      
      <tbody className="semantic-table-body">
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className="semantic-table-row"
            onClick={() => onRowClick && onRowClick(row, rowIndex)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columnsToRender.map(column => {
              const CustomRenderer = customRenderers[column];
              const value = row[column];
              
              return (
                <td key={column} className="semantic-table-cell">
                  {CustomRenderer ? (
                    <CustomRenderer value={value} row={row} column={column} />
                  ) : (
                    <SemanticField
                      field={{
                        name: column,
                        type: inferDataType(value),
                        value
                      }}
                      value={value}
                      context="list"
                      confidenceThreshold={confidenceThreshold}
                      showDebug={showDebug}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Helper function to format column names for display
function formatColumnName(name: string): string {
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