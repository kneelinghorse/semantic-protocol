/**
 * useDiscovery Hook
 * Find components by semantic query with real-time updates
 */

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { SemanticContext } from '../context/SemanticContext';
import { SemanticManifest } from '@kneelinghorse/semantic-protocol';

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

export function useDiscovery(
  query: DiscoveryQuery | string,
  options: UseDiscoveryOptions = {}
): {
  results: DiscoveryResult[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  findOne: () => DiscoveryResult | null;
} {
  const context = useContext(SemanticContext);
  if (!context) throw new Error('useDiscovery must be used within SemanticProvider');
  const { protocol } = context;
  const { realtime = true, cache = true, debounce = 100 } = options;
  
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<string, DiscoveryResult[]>>(new Map());
  
  const executeQuery = useCallback(() => {
    const cacheKey = typeof query === 'string' ? query : JSON.stringify(query);
    
    // Check cache
    if (cache && cacheRef.current.has(cacheKey)) {
      setResults(cacheRef.current.get(cacheKey) || []);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const queryResults = typeof query === 'string' 
        ? protocol.query(query)
        : protocol.find(query);
      
      const formattedResults: DiscoveryResult[] = Array.isArray(queryResults) 
        ? queryResults 
        : [];
      
      setResults(formattedResults);
      
      // Update cache
      if (cache) {
        cacheRef.current.set(cacheKey, formattedResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Discovery failed'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, protocol, cache]);
  
  // Debounced query execution
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      executeQuery();
    }, debounce);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [executeQuery, debounce]);
  
  // Real-time updates listener
  useEffect(() => {
    if (!realtime) return;
    
    const handleUpdate = (event: CustomEvent) => {
      // Re-execute query when registry changes
      executeQuery();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('semantic:component:registered', handleUpdate as any);
      window.addEventListener('semantic:component:unregistered', handleUpdate as any);
      
      return () => {
        window.removeEventListener('semantic:component:registered', handleUpdate as any);
        window.removeEventListener('semantic:component:unregistered', handleUpdate as any);
      };
    }
    return undefined;
  }, [realtime, executeQuery]);
  
  const refresh = useCallback(() => {
    // Clear cache for this query
    const cacheKey = typeof query === 'string' ? query : JSON.stringify(query);
    cacheRef.current.delete(cacheKey);
    executeQuery();
  }, [query, executeQuery]);
  
  const findOne = useCallback((): DiscoveryResult | null => {
    return results.length > 0 ? results[0] || null : null;
  }, [results]);
  
  return {
    results,
    loading,
    error,
    refresh,
    findOne
  };
}