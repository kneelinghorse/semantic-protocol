/**
 * Framework Adapter for Semantic Web Components
 * Provides compatibility helpers for React, Vue, Angular, and other frameworks
 */

export interface FrameworkAdapter {
  name: string;
  wrapComponent: (element: typeof HTMLElement) => any;
  createRef: () => any;
  bindEvents: (element: HTMLElement, events: Record<string, Function>) => void;
}

/**
 * React Adapter
 */
export const ReactAdapter: FrameworkAdapter = {
  name: 'react',
  
  wrapComponent(CustomElement: typeof HTMLElement) {
    // Dynamic import to avoid dependency
    return (props: any) => {
      const React = (window as any).React;
      const { useRef, useEffect } = React;
      
      const ref = useRef<HTMLElement>(null);
      
      useEffect(() => {
        const element = ref.current;
        if (!element) return;
        
        // Set properties
        Object.keys(props).forEach(key => {
          if (key.startsWith('on')) {
            // Event handler
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, props[key]);
          } else if (key !== 'children' && key !== 'ref') {
            // Property or attribute
            if (key in element) {
              (element as any)[key] = props[key];
            } else {
              element.setAttribute(key, props[key]);
            }
          }
        });
        
        // Cleanup
        return () => {
          Object.keys(props).forEach(key => {
            if (key.startsWith('on')) {
              const eventName = key.slice(2).toLowerCase();
              element.removeEventListener(eventName, props[key]);
            }
          });
        };
      }, [props]);
      
      const tagName = CustomElement.name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
      
      return React.createElement(tagName, { ref }, props.children);
    };
  },
  
  createRef() {
    const React = (window as any).React;
    return React.useRef();
  },
  
  bindEvents(element: HTMLElement, events: Record<string, Function>) {
    Object.entries(events).forEach(([eventName, handler]) => {
      element.addEventListener(eventName, handler as EventListener);
    });
  }
};

/**
 * Vue 3 Adapter
 */
export const VueAdapter: FrameworkAdapter = {
  name: 'vue',
  
  wrapComponent(CustomElement: typeof HTMLElement) {
    const Vue = (window as any).Vue;
    const tagName = CustomElement.name
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    return Vue.defineComponent({
      name: CustomElement.name,
      props: {
        modelValue: [String, Number, Boolean, Object, Array],
        ...getPropsFromElement(CustomElement)
      },
      emits: ['update:modelValue', 'semantic-change'],
      
      setup(props: any, { emit, slots }: any) {
        const elementRef = Vue.ref<HTMLElement>();
        
        Vue.onMounted(() => {
          if (!elementRef.value) return;
          
          // Bind props to element
          Object.keys(props).forEach(key => {
            if (key !== 'modelValue' && props[key] !== undefined) {
              (elementRef.value as any)[key] = props[key];
            }
          });
          
          // Handle v-model
          if (props.modelValue !== undefined) {
            (elementRef.value as any).value = props.modelValue;
          }
          
          // Listen for changes
          elementRef.value.addEventListener('semantic-change', (e: any) => {
            emit('update:modelValue', e.detail.value);
            emit('semantic-change', e.detail);
          });
        });
        
        Vue.watch(() => props.modelValue, (newVal) => {
          if (elementRef.value && (elementRef.value as any).value !== newVal) {
            (elementRef.value as any).value = newVal;
          }
        });
        
        return () => Vue.h(tagName, { ref: elementRef }, slots.default?.());
      }
    });
  },
  
  createRef() {
    const Vue = (window as any).Vue;
    return Vue.ref();
  },
  
  bindEvents(element: HTMLElement, events: Record<string, Function>) {
    Object.entries(events).forEach(([eventName, handler]) => {
      element.addEventListener(eventName, handler as EventListener);
    });
  }
};

/**
 * Angular Adapter
 */
export const AngularAdapter: FrameworkAdapter = {
  name: 'angular',
  
  wrapComponent(CustomElement: typeof HTMLElement) {
    // This would typically be done with Angular's custom elements schema
    // or by creating a directive/component wrapper
    return class AngularWrapper {
      static ngComponentDef = {
        selector: CustomElement.name.toLowerCase(),
        inputs: getPropsFromElement(CustomElement),
        outputs: ['semanticChange', 'semanticInput']
      };
    };
  },
  
  createRef() {
    // Angular uses ViewChild
    return { nativeElement: null };
  },
  
  bindEvents(element: HTMLElement, events: Record<string, Function>) {
    Object.entries(events).forEach(([eventName, handler]) => {
      element.addEventListener(eventName, handler as EventListener);
    });
  }
};

/**
 * Svelte Adapter
 */
export const SvelteAdapter: FrameworkAdapter = {
  name: 'svelte',
  
  wrapComponent(CustomElement: typeof HTMLElement) {
    // Svelte can use web components directly
    // This is a simplified wrapper for better integration
    return {
      create() {
        return new CustomElement();
      },
      
      mount(target: HTMLElement, props: any) {
        const element = new CustomElement();
        Object.assign(element, props);
        target.appendChild(element);
        return element;
      },
      
      update(element: HTMLElement, props: any) {
        Object.assign(element, props);
      },
      
      destroy(element: HTMLElement) {
        element.remove();
      }
    };
  },
  
  createRef() {
    let element: HTMLElement | null = null;
    return {
      set(el: HTMLElement) { element = el; },
      get() { return element; }
    };
  },
  
  bindEvents(element: HTMLElement, events: Record<string, Function>) {
    Object.entries(events).forEach(([eventName, handler]) => {
      element.addEventListener(eventName, handler as EventListener);
    });
  }
};

/**
 * Helper function to extract props from custom element
 */
function getPropsFromElement(CustomElement: typeof HTMLElement): string[] {
  const props: string[] = [];
  
  // Get observed attributes if defined
  if ('observedAttributes' in CustomElement) {
    const observed = (CustomElement as any).observedAttributes;
    if (Array.isArray(observed)) {
      props.push(...observed);
    }
  }
  
  // Add common props
  props.push('value', 'name', 'disabled', 'required', 'readonly');
  
  return [...new Set(props)];
}

/**
 * Auto-detect framework and return appropriate adapter
 */
export function detectFramework(): FrameworkAdapter | null {
  const win = window as any;
  
  if (win.React) {
    return ReactAdapter;
  }
  
  if (win.Vue) {
    return VueAdapter;
  }
  
  if (win.ng) {
    return AngularAdapter;
  }
  
  if (win.__svelte) {
    return SvelteAdapter;
  }
  
  return null;
}

/**
 * Create framework-specific wrapper for a custom element
 */
export function createFrameworkWrapper(
  CustomElement: typeof HTMLElement,
  framework?: string
): any {
  let adapter: FrameworkAdapter | null;
  
  if (framework) {
    switch (framework.toLowerCase()) {
      case 'react':
        adapter = ReactAdapter;
        break;
      case 'vue':
        adapter = VueAdapter;
        break;
      case 'angular':
        adapter = AngularAdapter;
        break;
      case 'svelte':
        adapter = SvelteAdapter;
        break;
      default:
        adapter = null;
    }
  } else {
    adapter = detectFramework();
  }
  
  if (!adapter) {
    console.warn('No framework adapter found, using native custom element');
    return CustomElement;
  }
  
  return adapter.wrapComponent(CustomElement);
}

/**
 * Register custom elements with framework-specific enhancements
 */
export function registerElements(
  elements: Record<string, typeof HTMLElement>,
  options: {
    prefix?: string;
    framework?: string;
    autoWrap?: boolean;
  } = {}
): void {
  const { prefix = '', framework, autoWrap = false } = options;
  
  Object.entries(elements).forEach(([name, CustomElement]) => {
    const tagName = prefix + name
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    // Register the custom element
    if (!customElements.get(tagName)) {
      customElements.define(tagName, CustomElement);
    }
    
    // Create framework wrapper if requested
    if (autoWrap && framework) {
      const wrapper = createFrameworkWrapper(CustomElement, framework);
      (window as any)[name + 'Component'] = wrapper;
    }
  });
}

/**
 * Utility to convert between different naming conventions
 */
export const namingUtils = {
  camelToKebab(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  },
  
  kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  },
  
  kebabToPascal(str: string): string {
    const camel = this.kebabToCamel(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }
};

export default {
  ReactAdapter,
  VueAdapter,
  AngularAdapter,
  SvelteAdapter,
  detectFramework,
  createFrameworkWrapper,
  registerElements,
  namingUtils
};