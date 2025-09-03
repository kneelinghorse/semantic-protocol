/**
 * Semantic Protocol Web Components
 * Framework-agnostic custom elements with Shadow DOM
 */

// Base class
export { SemanticElement } from './base/SemanticElement';

// Custom Elements
export { SemanticProvider } from './elements/semantic-provider';
export { SemanticField } from './elements/semantic-field';
export { SemanticDiscovery } from './elements/semantic-discovery';

// Framework Adapters
export {
  ReactAdapter,
  VueAdapter,
  AngularAdapter,
  SvelteAdapter,
  detectFramework,
  createFrameworkWrapper,
  registerElements,
  namingUtils
} from './framework-adapter';

// Auto-registration function
export function defineElements(prefix: string = ''): void {
  const elements = {
    'semantic-provider': SemanticProvider,
    'semantic-field': SemanticField,
    'semantic-discovery': SemanticDiscovery
  };

  Object.entries(elements).forEach(([name, Element]) => {
    const tagName = prefix + name;
    if (!customElements.get(tagName)) {
      customElements.define(tagName, Element);
    }
  });
}

// CDN auto-initialization
if (typeof window !== 'undefined') {
  // Check for auto-init attribute on script tag
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript?.hasAttribute('data-auto-init')) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => defineElements());
    } else {
      defineElements();
    }
  }
  
  // Expose to window for CDN usage
  (window as any).SemanticComponents = {
    SemanticElement,
    SemanticProvider,
    SemanticField,
    SemanticDiscovery,
    defineElements,
    adapters: {
      ReactAdapter,
      VueAdapter,
      AngularAdapter,
      SvelteAdapter
    }
  };
}

// TypeScript types
export interface SemanticComponentsGlobal {
  SemanticElement: typeof SemanticElement;
  SemanticProvider: typeof SemanticProvider;
  SemanticField: typeof SemanticField;
  SemanticDiscovery: typeof SemanticDiscovery;
  defineElements: (prefix?: string) => void;
  adapters: {
    ReactAdapter: any;
    VueAdapter: any;
    AngularAdapter: any;
    SvelteAdapter: any;
  };
}

declare global {
  interface Window {
    SemanticComponents: SemanticComponentsGlobal;
  }
  
  interface HTMLElementTagNameMap {
    'semantic-provider': SemanticProvider;
    'semantic-field': SemanticField;
    'semantic-discovery': SemanticDiscovery;
  }
}