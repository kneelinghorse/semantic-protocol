/**
 * useRelationships Hook
 * Manage component relationships with automatic binding and cascade updates
 */

import { useState, useEffect, useContext, useCallback } from 'react';
import { SemanticContext } from '../context/SemanticContext';
import { RelationshipType } from '@kneelinghorse/semantic-protocol';

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

export function useRelationships(
  componentId: string,
  options: UseRelationshipsOptions = {}
): {
  parent: RelationshipInfo | null;
  children: RelationshipInfo[];
  siblings: RelationshipInfo[];
  dependencies: RelationshipInfo[];
  all: RelationshipInfo[];
  addRelationship: (targetId: string, type: RelationshipType | string) => void;
  removeRelationship: (targetId: string) => void;
  getRelated: (type?: string) => any[];
  hasCircularDependency: () => boolean;
} {
  const context = useContext(SemanticContext);
  if (!context) throw new Error('useRelationships must be used within SemanticProvider');
  const { protocol } = context;
  const { 
    autoDetect = true, 
    cascadeUpdates = true, 
    validateCircular = true 
  } = options;
  
  const [relationships, setRelationships] = useState<{
    parent: RelationshipInfo | null;
    children: RelationshipInfo[];
    siblings: RelationshipInfo[];
    dependencies: RelationshipInfo[];
    all: RelationshipInfo[];
  }>({
    parent: null,
    children: [],
    siblings: [],
    dependencies: [],
    all: []
  });
  
  // Fetch relationships
  const fetchRelationships = useCallback(() => {
    try {
      const component = protocol.get(componentId);
      if (!component) return;
      
      const manifest = component.manifest || component;
      const rels = manifest.relationships || {};
      
      // Get parent
      const parent = rels.parent ? {
        id: rels.parent,
        type: 'parent-child' as RelationshipType,
        manifest: protocol.get(rels.parent)?.manifest
      } : null;
      
      // Get children
      const children = (rels.children || []).map((id: string) => ({
        id,
        type: 'parent-child' as RelationshipType,
        manifest: protocol.get(id)?.manifest
      }));
      
      // Get siblings (other children of same parent)
      let siblings: RelationshipInfo[] = [];
      if (parent) {
        const parentComponent = protocol.get(parent.id);
        if (parentComponent?.manifest?.relationships?.children) {
          siblings = parentComponent.manifest.relationships.children
            .filter((id: string) => id !== componentId)
            .map((id: string) => ({
              id,
              type: 'sibling' as string,
              manifest: protocol.get(id)?.manifest
            }));
        }
      }
      
      // Get dependencies
      const dependencies = (rels.dependencies || []).map((id: string) => ({
        id,
        type: 'dependency' as RelationshipType,
        manifest: protocol.get(id)?.manifest
      }));
      
      // Combine all relationships
      const all = [
        ...(parent ? [parent] : []),
        ...children,
        ...siblings,
        ...dependencies
      ];
      
      setRelationships({
        parent,
        children,
        siblings,
        dependencies,
        all
      });
    } catch (error) {
      console.error('[useRelationships] Failed to fetch relationships:', error);
    }
  }, [componentId, protocol]);
  
  // Initial fetch and updates
  useEffect(() => {
    fetchRelationships();
    
    // Listen for relationship changes
    const handleUpdate = (event: CustomEvent) => {
      if (cascadeUpdates) {
        fetchRelationships();
      }
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
  }, [fetchRelationships, cascadeUpdates]);
  
  // Add a new relationship
  const addRelationship = useCallback((targetId: string, type: RelationshipType | string) => {
    try {
      const component = protocol.get(componentId);
      if (!component) return;
      
      const manifest = component.manifest || component;
      const relationships = manifest.relationships || {};
      
      // Update based on type
      if (type === 'parent-child') {
        relationships.children = [...(relationships.children || []), targetId];
      } else if (type === 'dependency') {
        relationships.dependencies = [...(relationships.dependencies || []), targetId];
      }
      
      // Re-register with updated relationships
      const updated = { ...manifest, relationships };
      protocol.unregister(componentId);
      protocol.register(updated);
      
      fetchRelationships();
    } catch (error) {
      console.error('[useRelationships] Failed to add relationship:', error);
    }
  }, [componentId, protocol, fetchRelationships]);
  
  // Remove a relationship
  const removeRelationship = useCallback((targetId: string) => {
    try {
      const component = protocol.get(componentId);
      if (!component) return;
      
      const manifest = component.manifest || component;
      const relationships = manifest.relationships || {};
      
      // Remove from all relationship arrays
      if (relationships.children) {
        relationships.children = relationships.children.filter((id: string) => id !== targetId);
      }
      if (relationships.dependencies) {
        relationships.dependencies = relationships.dependencies.filter((id: string) => id !== targetId);
      }
      
      // Re-register with updated relationships
      const updated = { ...manifest, relationships };
      protocol.unregister(componentId);
      protocol.register(updated);
      
      fetchRelationships();
    } catch (error) {
      console.error('[useRelationships] Failed to remove relationship:', error);
    }
  }, [componentId, protocol, fetchRelationships]);
  
  // Get related components by type
  const getRelated = useCallback((type?: string) => {
    try {
      return protocol.getRelated(componentId, type) || [];
    } catch (error) {
      console.error('[useRelationships] Failed to get related:', error);
      return [];
    }
  }, [componentId, protocol]);
  
  // Check for circular dependencies
  const hasCircularDependency = useCallback(() => {
    if (!validateCircular) return false;
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const checkCycle = (id: string): boolean => {
      if (recursionStack.has(id)) return true;
      if (visited.has(id)) return false;
      
      visited.add(id);
      recursionStack.add(id);
      
      const component = protocol.get(id);
      const deps = component?.manifest?.relationships?.dependencies || [];
      
      for (const depId of deps) {
        if (checkCycle(depId)) return true;
      }
      
      recursionStack.delete(id);
      return false;
    };
    
    return checkCycle(componentId);
  }, [componentId, protocol, validateCircular]);
  
  return {
    ...relationships,
    addRelationship,
    removeRelationship,
    getRelated,
    hasCircularDependency
  };
}