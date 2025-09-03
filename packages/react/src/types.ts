import { SemanticProtocol, FieldDefinition, RenderContext, AnalysisResult, SemanticManifest, RelationshipType } from '@kneelinghorse/semantic-protocol';
import { ReactNode } from 'react';

// Context types
export interface SemanticContextValue {
  protocol: SemanticProtocol;
  confidenceThreshold: number;
  registry: {
    size: number;
    stats: any;
  };
  devMode: boolean;
}

// Provider types
export interface SemanticProviderProps {
  children: ReactNode;
  confidenceThreshold?: number;
  enableDevTools?: boolean;
  onRegistryChange?: (stats: any) => void;
}

// Component props types
export interface SemanticFieldProps {
  field: string | FieldDefinition;
  value?: any;
  context?: RenderContext;
  confidenceThreshold?: number;
  semanticType?: string;
  renderInstruction?: any;
  componentProps?: Record<string, any>;
  fallback?: React.ComponentType<any>;
  onError?: (error: Error, analysis: AnalysisResult | null) => void;
  className?: string;
  wrapperClassName?: string;
  showDebug?: boolean;
}

export interface SemanticFormProps {
  data: Record<string, any>;
  fields?: string[];
  excludeFields?: string[];
  confidenceThreshold?: number;
  onSubmit?: (data: Record<string, any>) => void;
  onChange?: (field: string, value: any) => void;
  customRenderers?: Record<string, React.ComponentType<any>>;
  formProps?: React.FormHTMLAttributes<HTMLFormElement>;
  showDebug?: boolean;
}

export interface SemanticTableProps {
  data: Record<string, any>[];
  columns?: string[];
  excludeColumns?: string[];
  confidenceThreshold?: number;
  onRowClick?: (row: Record<string, any>, index: number) => void;
  customRenderers?: Record<string, React.ComponentType<any>>;
  showDebug?: boolean;
  tableProps?: React.TableHTMLAttributes<HTMLTableElement>;
}

// Hook types
export interface UseSemanticFieldOptions {
  field: FieldDefinition | string;
  value?: any;
  context?: RenderContext;
  confidenceThreshold?: number;
  onError?: (error: Error) => void;
}

export interface UseSemanticFieldReturn {
  value: any;
  setValue: (value: any) => void;
  analysis: AnalysisResult | null;
  renderInstruction: AnalysisResult['renderInstruction'] | null;
  semanticType: string | null;
  isLoading: boolean;
  error: Error | null;
}

// useSemantics hook types
export interface UseSemanticsOptions {
  autoRegister?: boolean;
  updateOnChange?: boolean;
  debug?: boolean;
}

// useDiscovery hook types
export interface DiscoveryQuery {
  type?: string;
  intent?: string;
  category?: string;
  flow?: string;
  [key: string]: any;
}

export interface UseDiscoveryOptions {
  realtime?: boolean;
  cache?: boolean;
  debounce?: number;
}

export interface DiscoveryResult {
  manifest: SemanticManifest;
  component?: any;
  registered: number;
}

// useRelationships hook types
export interface UseRelationshipsOptions {
  autoDetect?: boolean;
  cascadeUpdates?: boolean;
  validateCircular?: boolean;
}

export interface RelationshipInfo {
  id: string;
  type: RelationshipType | string;
  manifest?: any;
}

// SemanticPortal types
export interface SemanticPortalProps {
  children: ReactNode;
  targetId?: string;
  targetSelector?: string;
  manifest: SemanticManifest;
  preserveRelationships?: boolean;
  bridgeContext?: boolean;
  className?: string;
  style?: React.CSSProperties;
}