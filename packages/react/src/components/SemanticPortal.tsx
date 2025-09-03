/**
 * SemanticPortal Component
 * Cross-tree semantic relationships with portal rendering and context bridging
 */

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSemantics } from '../hooks/useSemantics';
import { useRelationships } from '../hooks/useRelationships';
import { SemanticManifest } from '@kneelinghorse/semantic-protocol';

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

export const SemanticPortal: React.FC<SemanticPortalProps> = ({
  children,
  targetId,
  targetSelector,
  manifest,
  preserveRelationships = true,
  bridgeContext = true,
  className,
  style
}) => {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Register this portal component
  const { id, isRegistered } = useSemantics(manifest, {
    autoRegister: true,
    debug: false
  });
  
  // Manage relationships if component is registered
  const relationships = useRelationships(id, {
    autoDetect: preserveRelationships,
    cascadeUpdates: true
  });
  
  // Find or create portal target
  useEffect(() => {
    let target: HTMLElement | null = null;
    
    if (targetId) {
      target = document.getElementById(targetId);
    } else if (targetSelector) {
      target = document.querySelector(targetSelector);
    }
    
    // Create default portal root if no target found
    if (!target) {
      const existingRoot = document.getElementById('semantic-portal-root');
      if (existingRoot) {
        target = existingRoot;
      } else {
        target = document.createElement('div');
        target.id = 'semantic-portal-root';
        target.style.position = 'absolute';
        target.style.top = '0';
        target.style.left = '0';
        target.style.width = '0';
        target.style.height = '0';
        target.style.overflow = 'visible';
        target.style.pointerEvents = 'none';
        document.body.appendChild(target);
      }
    }
    
    setPortalTarget(target);
    setIsReady(true);
    
    return () => {
      // Clean up created portal root if it's empty
      if (target?.id === 'semantic-portal-root' && 
          target.childNodes.length === 0 && 
          target.parentNode) {
        target.parentNode.removeChild(target);
      }
    };
  }, [targetId, targetSelector]);
  
  // Create container for portal content
  useEffect(() => {
    if (!portalTarget || !isReady) return;
    
    const container = document.createElement('div');
    container.className = 'semantic-portal-container';
    if (className) {
      container.className += ` ${className}`;
    }
    
    // Apply styles
    if (style) {
      Object.assign(container.style, style);
    }
    
    // Set data attributes for semantic identification
    container.setAttribute('data-semantic-id', id);
    container.setAttribute('data-semantic-type', manifest.element.type);
    if (manifest.element.intent) {
      container.setAttribute('data-semantic-intent', manifest.element.intent);
    }
    
    containerRef.current = container;
    portalTarget.appendChild(container);
    
    return () => {
      if (containerRef.current && portalTarget.contains(containerRef.current)) {
        portalTarget.removeChild(containerRef.current);
      }
    };
  }, [portalTarget, isReady, id, manifest, className, style]);
  
  // Bridge context between portal and parent
  useEffect(() => {
    if (!bridgeContext || !containerRef.current) return;
    
    const bridgeEvent = (eventName: string) => {
      const handler = (event: Event) => {
        // Re-dispatch event in original tree location
        const bridgedEvent = new CustomEvent(`semantic:bridged:${eventName}`, {
          detail: {
            originalEvent: event,
            portalId: id,
            manifest
          },
          bubbles: true,
          cancelable: true
        });
        
        // Dispatch from a placeholder in the original tree
        const placeholder = document.querySelector(`[data-semantic-portal-placeholder="${id}"]`);
        if (placeholder) {
          placeholder.dispatchEvent(bridgedEvent);
        }
      };
      
      containerRef.current?.addEventListener(eventName, handler);
      return () => containerRef.current?.removeEventListener(eventName, handler);
    };
    
    // Bridge common events
    const cleanups = [
      bridgeEvent('click'),
      bridgeEvent('focus'),
      bridgeEvent('blur'),
      bridgeEvent('change'),
      bridgeEvent('input')
    ];
    
    return () => {
      cleanups.forEach(cleanup => cleanup?.());
    };
  }, [bridgeContext, id, manifest]);
  
  // Preserve relationships across portal boundary
  useEffect(() => {
    if (!preserveRelationships || !isRegistered) return;
    
    // Find parent in original tree
    const findOriginalParent = () => {
      const placeholder = document.querySelector(`[data-semantic-portal-placeholder="${id}"]`);
      if (placeholder) {
        let parent = placeholder.parentElement;
        while (parent) {
          const parentId = parent.getAttribute('data-semantic-id');
          if (parentId) {
            return parentId;
          }
          parent = parent.parentElement;
        }
      }
      return null;
    };
    
    const originalParentId = findOriginalParent();
    if (originalParentId && !relationships.parent) {
      relationships.addRelationship(originalParentId, 'parent-child');
    }
  }, [preserveRelationships, isRegistered, id, relationships]);
  
  // Render placeholder in original location
  const placeholder = (
    <div
      data-semantic-portal-placeholder={id}
      style={{ display: 'none' }}
      aria-hidden="true"
    />
  );
  
  // Render portal content
  if (!isReady || !containerRef.current) {
    return placeholder;
  }
  
  return (
    <>
      {placeholder}
      {createPortal(children, containerRef.current)}
    </>
  );
};