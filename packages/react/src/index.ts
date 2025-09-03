/**
 * Semantic Protocol React Integration
 * Main entry point for React hooks and components
 */

// Core Components
export { SemanticField } from './components/SemanticField';
export { SemanticForm } from './components/SemanticForm';
export { SemanticTable } from './components/SemanticTable';
export { SemanticDemo } from './components/SemanticDemo';
export { SemanticBoundary } from './components/SemanticBoundary';
export { SemanticPortal } from './components/SemanticPortal';

// Context and Provider
export { SemanticProvider, useSemanticContext, SemanticContext } from './context/SemanticContext';

// Hooks
export { useSemanticField } from './hooks/useSemanticField';
export { useSemantics } from './hooks/useSemantics';
export { useDiscovery } from './hooks/useDiscovery';
export { useRelationships } from './hooks/useRelationships';

// Types
export type {
  SemanticContextValue,
  SemanticProviderProps,
  SemanticFieldProps,
  SemanticFormProps,
  SemanticTableProps,
  UseSemanticFieldOptions,
  UseSemanticFieldReturn,
  UseSemanticsOptions,
  UseDiscoveryOptions,
  DiscoveryQuery,
  DiscoveryResult,
  UseRelationshipsOptions,
  RelationshipInfo,
  SemanticPortalProps
} from './types';
