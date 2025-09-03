import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { SemanticProtocol } from '@kneelinghorse/semantic-protocol';

export interface SemanticContextValue {
  protocol: SemanticProtocol;
  confidenceThreshold: number;
  registry: {
    size: number;
    stats: any;
  };
  devMode: boolean;
}

export interface SemanticProviderProps {
  children: React.ReactNode;
  confidenceThreshold?: number;
  enableDevTools?: boolean;
  onRegistryChange?: (stats: any) => void;
}

const SemanticContext = createContext<SemanticContextValue | null>(null);

export { SemanticContext };

export const useSemanticContext = (): SemanticContextValue => {
  const context = useContext(SemanticContext);
  if (!context) {
    throw new Error('useSemanticContext must be used within a SemanticProvider');
  }
  return context;
};

export const SemanticProvider: React.FC<SemanticProviderProps> = ({
  children,
  confidenceThreshold = 70,
  enableDevTools = process.env['NODE_ENV'] === 'development',
  onRegistryChange
}) => {
  const protocol = useMemo(
    () => new SemanticProtocol(confidenceThreshold),
    [confidenceThreshold]
  );
  
  const [registryStats, setRegistryStats] = useState({
    size: 0,
    stats: {}
  });
  
  // Monitor registry changes
  useEffect(() => {
    const updateStats = () => {
      try {
        // Get registry stats if available
        const stats = (protocol as any).registry?.getStats?.() || {
          totalComponents: 0,
          byType: {},
          byCategory: {},
          byIntent: {}
        };
        
        const newStats = {
          size: stats.totalComponents || 0,
          stats
        };
        
        setRegistryStats(newStats);
        
        if (onRegistryChange) {
          onRegistryChange(newStats);
        }
      } catch (error) {
        console.error('[SemanticProvider] Failed to update registry stats:', error);
      }
    };
    
    // Initial stats
    updateStats();
    
    // Listen for registry changes
    const handleRegistryChange = () => {
      updateStats();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('semantic:component:registered', handleRegistryChange);
      window.addEventListener('semantic:component:unregistered', handleRegistryChange);
      
      // Update stats periodically in dev mode
      let interval: NodeJS.Timeout;
      if (enableDevTools) {
        interval = setInterval(updateStats, 2000);
      }
      
      return () => {
        window.removeEventListener('semantic:component:registered', handleRegistryChange);
        window.removeEventListener('semantic:component:unregistered', handleRegistryChange);
        if (interval) {
          clearInterval(interval);
        }
      };
    }
    return undefined;
  }, [protocol, enableDevTools, onRegistryChange]);
  
  // Setup dev tools integration
  useEffect(() => {
    if (enableDevTools && typeof window !== 'undefined') {
      // Expose protocol to dev tools
      (window as any).__SEMANTIC_PROTOCOL__ = protocol;
      (window as any).__SEMANTIC_REGISTRY_STATS__ = registryStats;
      
      // Add dev tools hook
      if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('[SemanticProvider] Dev tools integration enabled');
      }
      
      return () => {
        delete (window as any).__SEMANTIC_PROTOCOL__;
        delete (window as any).__SEMANTIC_REGISTRY_STATS__;
      };
    }
    return undefined;
  }, [protocol, registryStats, enableDevTools]);

  const value: SemanticContextValue = {
    protocol,
    confidenceThreshold,
    registry: registryStats,
    devMode: enableDevTools
  };

  return (
    <SemanticContext.Provider value={value}>
      {children}
    </SemanticContext.Provider>
  );
};