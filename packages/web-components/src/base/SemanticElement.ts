import { SemanticProtocol, SemanticManifest, ValidationResult } from '@kneelinghorse/semantic-protocol';

export interface SemanticElementConfig {
  useShadow?: boolean;
  styles?: string;
  autoRegister?: boolean;
  validateOnConnect?: boolean;
}

export abstract class SemanticElement extends HTMLElement {
  protected protocol: SemanticProtocol;
  protected manifest: SemanticManifest | null = null;
  protected shadow: ShadowRoot | null = null;
  protected config: SemanticElementConfig;
  private _isRegistered = false;
  private _elementId: string;
  private _observers: Map<string, MutationObserver> = new Map();

  constructor(config: SemanticElementConfig = {}) {
    super();
    
    this.config = {
      useShadow: true,
      autoRegister: true,
      validateOnConnect: true,
      ...config
    };

    this.protocol = new SemanticProtocol();
    this._elementId = this.generateElementId();

    if (this.config.useShadow) {
      this.shadow = this.attachShadow({ mode: 'open' });
    }
  }

  abstract getManifest(): SemanticManifest;
  abstract render(): string;

  connectedCallback(): void {
    this.manifest = this.getManifest();
    
    if (this.config.validateOnConnect) {
      this.validateManifest();
    }

    if (this.config.autoRegister) {
      this.register();
    }

    this.setupAttributes();
    this.updateContent();
    this.setupObservers();
    this.onConnected();
  }

  disconnectedCallback(): void {
    if (this._isRegistered) {
      this.unregister();
    }
    
    this._observers.forEach(observer => observer.disconnect());
    this._observers.clear();
    
    this.onDisconnected();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    
    this.onAttributeChanged(name, oldValue, newValue);
    
    if (this.shouldRerender(name, oldValue, newValue)) {
      this.updateContent();
    }
  }

  protected onConnected(): void {}
  protected onDisconnected(): void {}
  protected onAttributeChanged(name: string, oldValue: string | null, newValue: string | null): void {}
  protected shouldRerender(name: string, oldValue: string | null, newValue: string | null): boolean {
    return true;
  }

  protected updateContent(): void {
    const content = this.render();
    const styles = this.getStyles();
    
    const template = `
      ${styles ? `<style>${styles}</style>` : ''}
      ${content}
    `;

    if (this.shadow) {
      this.shadow.innerHTML = template;
    } else {
      this.innerHTML = template;
    }

    this.setupEventListeners();
  }

  protected getStyles(): string {
    return this.config.styles || this.defaultStyles();
  }

  protected defaultStyles(): string {
    return `
      :host {
        display: block;
        box-sizing: border-box;
      }
      
      :host([hidden]) {
        display: none;
      }
      
      * {
        box-sizing: inherit;
      }
    `;
  }

  protected setupAttributes(): void {
    this.setAttribute('data-semantic-id', this._elementId);
    
    if (this.manifest) {
      this.setAttribute('data-semantic-type', this.manifest.element?.type || 'unknown');
      this.setAttribute('data-semantic-intent', this.manifest.element?.intent || '');
    }
  }

  protected setupEventListeners(): void {
    const root = this.shadow || this;
    
    root.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');
      if (action && typeof (this as any)[action] === 'function') {
        element.addEventListener('click', (e) => {
          (this as any)[action](e);
        });
      }
    });
  }

  protected setupObservers(): void {
    if (this.hasAttribute('data-observe-children')) {
      const observer = new MutationObserver((mutations) => {
        this.onChildrenChanged(mutations);
      });
      
      observer.observe(this, {
        childList: true,
        subtree: true
      });
      
      this._observers.set('children', observer);
    }
  }

  protected onChildrenChanged(mutations: MutationRecord[]): void {
    this.updateContent();
  }

  protected async validateManifest(): Promise<ValidationResult> {
    if (!this.manifest) {
      return { valid: false, errors: ['No manifest defined'] };
    }

    try {
      const result = await this.protocol.validate(this.manifest);
      
      if (!result.valid && process.env.NODE_ENV === 'development') {
        console.warn(`[${this.tagName}] Validation failed:`, result.errors);
      }
      
      return result;
    } catch (error) {
      console.error(`[${this.tagName}] Validation error:`, error);
      return { valid: false, errors: [(error as Error).message] };
    }
  }

  protected register(): void {
    if (this._isRegistered || !this.manifest) return;
    
    try {
      this.protocol.register(this.manifest);
      this._isRegistered = true;
      
      this.dispatchEvent(new CustomEvent('semantic-registered', {
        detail: { manifest: this.manifest, elementId: this._elementId },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error(`[${this.tagName}] Registration failed:`, error);
    }
  }

  protected unregister(): void {
    if (!this._isRegistered) return;
    
    this._isRegistered = false;
    
    this.dispatchEvent(new CustomEvent('semantic-unregistered', {
      detail: { elementId: this._elementId },
      bubbles: true,
      composed: true
    }));
  }

  protected emit(eventName: string, detail: any = {}): void {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  protected query(selector: string): Element | null {
    const root = this.shadow || this;
    return root.querySelector(selector);
  }

  protected queryAll(selector: string): NodeListOf<Element> {
    const root = this.shadow || this;
    return root.querySelectorAll(selector);
  }

  protected getSlotContent(slotName?: string): Element[] {
    if (!this.shadow) return [];
    
    const slot = slotName 
      ? this.shadow.querySelector(`slot[name="${slotName}"]`) as HTMLSlotElement
      : this.shadow.querySelector('slot') as HTMLSlotElement;
    
    return slot ? Array.from(slot.assignedElements()) : [];
  }

  private generateElementId(): string {
    return `semantic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  get elementId(): string {
    return this._elementId;
  }

  get isRegistered(): boolean {
    return this._isRegistered;
  }

  get semanticManifest(): SemanticManifest | null {
    return this.manifest;
  }
}