import { ref, computed, reactive, watch, toRefs, unref, type Ref } from 'vue'
import type { 
  AnalysisResult, 
  FieldDefinition, 
  RenderContext,
  UseSemanticsReturn,
  MaybeRefOrGetter
} from '../types'
import { useSemanticContext } from './useSemanticContext'

/**
 * Composable for semantic analysis of data fields
 * Provides reactive analysis capabilities with caching and error handling
 */
export function useSemantics(
  initialFields?: MaybeRefOrGetter<FieldDefinition[]>,
  initialContext?: MaybeRefOrGetter<RenderContext>
): UseSemanticsReturn {
  const { protocol, options } = useSemanticContext()
  
  // Reactive state
  const state = reactive({
    results: [] as AnalysisResult[],
    isAnalyzing: false,
    error: null as Error | null
  })
  
  // Cache for analysis results
  const cache = new Map<string, AnalysisResult>()
  
  // Helper to generate cache key
  const getCacheKey = (field: FieldDefinition, context: RenderContext): string => {
    return `${field.name}_${field.type}_${context}_${JSON.stringify(field.value)}`
  }
  
  // Core analysis function
  const analyze = (field: FieldDefinition, context: RenderContext = 'list'): AnalysisResult => {
    try {
      const cacheKey = getCacheKey(field, context)
      
      // Check cache if enabled
      if (options.cacheResults && cache.has(cacheKey)) {
        return cache.get(cacheKey)!
      }
      
      // Perform analysis
      const result = protocol.analyze(field, context)
      
      // Cache result if enabled
      if (options.cacheResults) {
        cache.set(cacheKey, result)
      }
      
      return result
    } catch (error) {
      state.error = error as Error
      throw error
    }
  }
  
  // Batch analysis function
  const analyzeSchema = (fields: FieldDefinition[], context: RenderContext = 'list'): AnalysisResult[] => {
    try {
      state.isAnalyzing = true
      state.error = null
      
      const results = fields.map(field => analyze(field, context))
      state.results = results
      
      return results
    } catch (error) {
      state.error = error as Error
      throw error
    } finally {
      state.isAnalyzing = false
    }
  }
  
  // Reactive analysis when inputs change
  if (initialFields && initialContext) {
    watch(
      [
        () => unref(initialFields),
        () => unref(initialContext)
      ],
      ([fields, context]) => {
        if (fields && context && options.autoAnalysis) {
          analyzeSchema(fields, context)
        }
      },
      { immediate: options.autoAnalysis, deep: true }
    )
  }
  
  return {
    ...toRefs(state),
    analyze,
    analyzeSchema
  }
}

/**
 * Composable for single field analysis
 * Simplified version for analyzing individual fields
 */
export function useSemanticField(
  field: MaybeRefOrGetter<FieldDefinition>,
  context: MaybeRefOrGetter<RenderContext> = 'list'
) {
  const { analyze, isAnalyzing, error } = useSemantics()
  
  const result = computed(() => {
    const fieldValue = unref(field)
    const contextValue = unref(context)
    
    if (!fieldValue) return null
    
    try {
      return analyze(fieldValue, contextValue)
    } catch (e) {
      console.warn('Semantic analysis failed:', e)
      return null
    }
  })
  
  const isHighConfidence = computed(() => {
    return result.value?.metadata.confidence >= 90
  })
  
  const bestSemantic = computed(() => {
    return result.value?.bestMatch?.semantic || null
  })
  
  const renderInstruction = computed(() => {
    return result.value?.renderInstruction || null
  })
  
  return {
    result,
    isHighConfidence,
    bestSemantic,
    renderInstruction,
    isAnalyzing,
    error
  }
}

/**
 * Composable for reactive semantic analysis with watchers
 * Automatically re-analyzes when dependencies change
 */
export function useReactiveSemantics(
  fieldsRef: Ref<FieldDefinition[]>,
  contextRef: Ref<RenderContext> = ref('list'),
  options?: {
    immediate?: boolean
    debounce?: number
  }
) {
  const { analyzeSchema, results, isAnalyzing, error } = useSemantics()
  
  // Debounced analysis function
  let debounceTimeout: NodeJS.Timeout | null = null
  const debouncedAnalyze = (fields: FieldDefinition[], context: RenderContext) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    
    debounceTimeout = setTimeout(() => {
      analyzeSchema(fields, context)
    }, options?.debounce || 300)
  }
  
  // Watch for changes
  watch(
    [fieldsRef, contextRef],
    ([fields, context]) => {
      if (fields && fields.length > 0) {
        if (options?.debounce) {
          debouncedAnalyze(fields, context)
        } else {
          analyzeSchema(fields, context)
        }
      }
    },
    { 
      immediate: options?.immediate ?? true,
      deep: true 
    }
  )
  
  // Computed helpers
  const groupedResults = computed(() => {
    return results.value.reduce((groups, result) => {
      if (result.bestMatch) {
        const semantic = result.bestMatch.semantic
        if (!groups[semantic]) {
          groups[semantic] = []
        }
        groups[semantic].push(result)
      }
      return groups
    }, {} as Record<string, AnalysisResult[]>)
  })
  
  const highConfidenceResults = computed(() => {
    return results.value.filter(result => result.metadata.confidence >= 90)
  })
  
  return {
    results,
    groupedResults,
    highConfidenceResults,
    isAnalyzing,
    error,
    analyzeSchema
  }
}