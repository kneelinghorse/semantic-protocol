import type { 
  SemanticType, 
  RenderContext, 
  AnalysisResult, 
  FieldDefinition, 
  SemanticProtocol as CoreSemanticProtocol 
} from '@kneelinghorse/semantic-protocol'
import type { Ref, ComputedRef, App, Plugin } from 'vue'

// Re-export core types
export type { 
  SemanticType, 
  RenderContext, 
  AnalysisResult, 
  FieldDefinition,
  SemanticMatch,
  RenderInstruction,
  DataType
} from '@kneelinghorse/semantic-protocol'

// Vue-specific types
export interface SemanticVueOptions {
  confidenceThreshold?: number
  autoAnalysis?: boolean
  enableDevTools?: boolean
  cacheResults?: boolean
}

export interface SemanticContext {
  protocol: CoreSemanticProtocol
  options: Required<SemanticVueOptions>
}

// Composable return types
export interface UseSemanticsReturn {
  analyze: (field: FieldDefinition, context?: RenderContext) => AnalysisResult
  analyzeSchema: (fields: FieldDefinition[], context?: RenderContext) => AnalysisResult[]
  results: Ref<AnalysisResult[]>
  isAnalyzing: Ref<boolean>
  error: Ref<Error | null>
}

export interface UseDiscoveryReturn {
  discover: (data: Record<string, any>) => FieldDefinition[]
  fields: Ref<FieldDefinition[]>
  relationships: Ref<SemanticRelationship[]>
  isDiscovering: Ref<boolean>
}

export interface UseRelationshipsReturn {
  findRelationships: (results: AnalysisResult[]) => SemanticRelationship[]
  relationships: Ref<SemanticRelationship[]>
  groupedResults: ComputedRef<Record<SemanticType, AnalysisResult[]>>
}

export interface SemanticRelationship {
  type: 'composition' | 'association' | 'dependency' | 'inheritance'
  from: string
  to: string
  semantic: SemanticType
  confidence: number
  metadata?: Record<string, any>
}

// Component prop types
export interface SemanticProviderProps {
  protocol?: CoreSemanticProtocol
  options?: SemanticVueOptions
}

export interface SemanticBoundaryProps {
  fallback?: string | (() => void)
  onError?: (error: Error, instance: any, info: string) => void
}

export interface SemanticTeleportProps {
  to: string
  disabled?: boolean
  semanticFilter?: SemanticType[]
}

// Directive types
export interface SemanticDirectiveBinding {
  value?: {
    field?: FieldDefinition
    context?: RenderContext
    onAnalysis?: (result: AnalysisResult) => void
  }
  modifiers?: {
    auto?: boolean
    cache?: boolean
    lazy?: boolean
  }
}

export interface SemanticRefDirectiveBinding {
  value?: {
    ref: string
    semantic?: SemanticType
    onRegister?: (ref: string, element: Element) => void
  }
}

// Plugin types
export interface SemanticProtocolPlugin extends Plugin {
  install(app: App, options?: SemanticVueOptions): void
}

// Store integration types
export interface SemanticStore {
  state: {
    results: AnalysisResult[]
    relationships: SemanticRelationship[]
    cache: Map<string, AnalysisResult>
  }
  getters: {
    resultsByField: (field: string) => AnalysisResult | undefined
    resultsBySemantic: (semantic: SemanticType) => AnalysisResult[]
    highConfidenceResults: () => AnalysisResult[]
  }
  actions: {
    analyze: (field: FieldDefinition, context?: RenderContext) => Promise<AnalysisResult>
    analyzeSchema: (fields: FieldDefinition[], context?: RenderContext) => Promise<AnalysisResult[]>
    clearCache: () => void
  }
}

// Auto-import types for better DX
export interface SemanticAutoImports {
  useSemantics: () => UseSemanticsReturn
  useDiscovery: () => UseDiscoveryReturn
  useRelationships: () => UseRelationshipsReturn
  SemanticProvider: any
  SemanticBoundary: any
  SemanticTeleport: any
}

// Event types
export type SemanticEventMap = {
  'semantic:analyzed': AnalysisResult
  'semantic:discovered': FieldDefinition[]
  'semantic:relationship-found': SemanticRelationship
  'semantic:error': Error
}

// Utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type MaybeRef<T> = T | Ref<T>
export type MaybeComputedRef<T> = T | ComputedRef<T>
export type MaybeRefOrGetter<T> = T | Ref<T> | ComputedRef<T> | (() => T)

// Component registration helpers
export type ComponentOptions = {
  global?: boolean
  prefix?: string
}

// Development types
export interface SemanticDevTools {
  inspectResults: (results: AnalysisResult[]) => void
  debugAnalysis: (field: FieldDefinition) => void
  logRelationships: (relationships: SemanticRelationship[]) => void
}