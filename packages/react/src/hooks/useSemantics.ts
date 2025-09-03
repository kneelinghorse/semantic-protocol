/**
 * useSemantics Hook
 * Attach semantic manifest to components with auto-registration
 */

import { useEffect, useRef, useContext } from 'react';
import { SemanticContext } from '../context/SemanticContext';
import { SemanticManifest } from '@kneelinghorse/semantic-protocol';

export interface UseSemanticsOptions {
  autoRegister?: boolean;
  updateOnChange?: boolean;
  debug?: boolean;
}

export function useSemantics(
  manifest: SemanticManifest,
  options: UseSemanticsOptions = {}
): {
  id: string;
  isRegistered: boolean;
  update: (updates: Partial<SemanticManifest>) => void;
  unregister: () => void;
} {
  const context = useContext(SemanticContext);
  if (!context) throw new Error('useSemantics must be used within SemanticProvider');
  const { protocol } = context;
  const { autoRegister = true, updateOnChange = true, debug = false } = options;
  
  const isRegisteredRef = useRef(false);
  const manifestRef = useRef(manifest);
  
  // Auto-registration on mount
  useEffect(() => {
    if (autoRegister && !isRegisteredRef.current) {
      const id = protocol.register(manifest);
      if (id) {
        isRegisteredRef.current = true;
        if (debug) {
          console.log(`[useSemantics] Registered component: ${id}`);
        }
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (isRegisteredRef.current && manifest.id) {
        protocol.unregister(manifest.id);
        isRegisteredRef.current = false;
        if (debug) {
          console.log(`[useSemantics] Unregistered component: ${manifest.id}`);
        }
      }
    };
  }, [autoRegister, protocol, manifest.id, debug]);
  
  // Update on manifest changes
  useEffect(() => {
    if (updateOnChange && isRegisteredRef.current && manifest.id) {
      // Unregister old and register new
      protocol.unregister(manifest.id);
      const newId = protocol.register(manifest);
      if (debug && newId) {
        console.log(`[useSemantics] Updated component: ${newId}`);
      }
    }
    manifestRef.current = manifest;
  }, [updateOnChange, protocol, manifest, debug]);
  
  const update = (updates: Partial<SemanticManifest>) => {
    const updatedManifest = { ...manifestRef.current, ...updates };
    if (manifest.id) {
      protocol.unregister(manifest.id);
      protocol.register(updatedManifest);
      manifestRef.current = updatedManifest;
    }
  };
  
  const unregister = () => {
    if (manifest.id && isRegisteredRef.current) {
      protocol.unregister(manifest.id);
      isRegisteredRef.current = false;
    }
  };
  
  return {
    id: manifest.id,
    isRegistered: isRegisteredRef.current,
    update,
    unregister
  };
}