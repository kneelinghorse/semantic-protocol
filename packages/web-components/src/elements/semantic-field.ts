import { SemanticElement } from '../base/SemanticElement';
import { SemanticManifest } from '@kneelinghorse/semantic-protocol';

type FieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'select' | 'textarea';
type ValidationRule = 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max';

export class SemanticField extends SemanticElement {
  static get observedAttributes() {
    return ['type', 'name', 'label', 'value', 'required', 'disabled', 'readonly', 'error', 'hint'];
  }

  private _value: string = '';
  private _errors: string[] = [];
  private _isValid: boolean = true;

  constructor() {
    super({
      useShadow: true,
      autoRegister: true,
      validateOnConnect: true
    });
  }

  getManifest(): SemanticManifest {
    const type = this.getAttribute('type') || 'text';
    const name = this.getAttribute('name') || 'field';
    const required = this.hasAttribute('required');

    return {
      protocol: 'semantic-ui/v2',
      element: {
        type: 'input',
        intent: `collect-${type}-data`,
        label: this.getAttribute('label') || name,
        criticality: required ? 'high' : 'low'
      },
      context: {
        flow: this.getAttribute('data-flow') || 'form',
        step: parseInt(this.getAttribute('data-step') || '0'),
        prerequisites: required ? [] : ['optional']
      },
      validation: {
        rules: this.getValidationRules(),
        messages: this.getValidationMessages(),
        async: false
      },
      metadata: {
        version: '2.0.0',
        created: new Date().toISOString(),
        tags: ['field', type, name, required ? 'required' : 'optional']
      }
    };
  }

  render(): string {
    const type = this.getAttribute('type') || 'text';
    const name = this.getAttribute('name') || '';
    const label = this.getAttribute('label') || name;
    const value = this.getAttribute('value') || this._value;
    const required = this.hasAttribute('required');
    const disabled = this.hasAttribute('disabled');
    const readonly = this.hasAttribute('readonly');
    const error = this.getAttribute('error') || this._errors.join(', ');
    const hint = this.getAttribute('hint') || '';

    const fieldId = `field-${this.elementId}`;

    return `
      <div class="semantic-field ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}">
        ${label ? `
          <label for="${fieldId}" class="field-label">
            ${label}
            ${required ? '<span class="required">*</span>' : ''}
          </label>
        ` : ''}
        
        <div class="field-wrapper">
          ${this.renderInput(type, fieldId, name, value, required, disabled, readonly)}
          
          ${hint ? `<div class="field-hint">${hint}</div>` : ''}
          ${error ? `<div class="field-error" role="alert">${error}</div>` : ''}
        </div>
        
        <div class="field-meta">
          <slot name="prefix"></slot>
          <slot name="suffix"></slot>
        </div>
      </div>
    `;
  }

  private renderInput(
    type: string,
    id: string,
    name: string,
    value: string,
    required: boolean,
    disabled: boolean,
    readonly: boolean
  ): string {
    const commonAttrs = `
      id="${id}"
      name="${name}"
      ${required ? 'required' : ''}
      ${disabled ? 'disabled' : ''}
      ${readonly ? 'readonly' : ''}
      data-semantic-field="${name}"
    `;

    switch (type) {
      case 'textarea':
        return `
          <textarea ${commonAttrs} class="field-input">${value}</textarea>
        `;
      
      case 'select':
        return `
          <select ${commonAttrs} class="field-input">
            <slot name="options"></slot>
          </select>
        `;
      
      default:
        return `
          <input 
            type="${type}"
            value="${value}"
            ${commonAttrs}
            class="field-input"
          />
        `;
    }
  }

  defaultStyles(): string {
    return `
      ${super.defaultStyles()}
      
      .semantic-field {
        margin-bottom: 1.5rem;
      }
      
      .field-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
        font-size: 0.875rem;
      }
      
      .field-label .required {
        color: #e53935;
        margin-left: 0.25rem;
      }
      
      .field-wrapper {
        position: relative;
      }
      
      .field-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        background: white;
      }
      
      .field-input:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
      
      .field-input:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      .field-input[readonly] {
        background: #fafafa;
      }
      
      textarea.field-input {
        min-height: 100px;
        resize: vertical;
      }
      
      .field-hint {
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: #666;
      }
      
      .field-error {
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: #e53935;
      }
      
      .has-error .field-input {
        border-color: #e53935;
      }
      
      .has-error .field-input:focus {
        box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
      }
      
      .field-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
      }
      
      ::slotted([slot="prefix"]),
      ::slotted([slot="suffix"]) {
        font-size: 0.75rem;
        color: #666;
      }
    `;
  }

  onConnected(): void {
    this.setupInputListeners();
    this.registerWithProvider();
  }

  private setupInputListeners(): void {
    const input = this.getInputElement();
    if (!input) return;

    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this._value = target.value;
      this.setAttribute('value', this._value);
      this.validate();
      this.emit('semantic-input', { value: this._value, name: this.getAttribute('name') });
    });

    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this._value = target.value;
      this.validate();
      this.emit('semantic-change', { value: this._value, name: this.getAttribute('name') });
    });

    input.addEventListener('blur', () => {
      this.validate();
      this.emit('semantic-blur', { value: this._value, name: this.getAttribute('name') });
    });

    input.addEventListener('focus', () => {
      this.emit('semantic-focus', { value: this._value, name: this.getAttribute('name') });
    });
  }

  private getInputElement(): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
    const root = this.shadow || this;
    return root.querySelector('.field-input') as any;
  }

  private registerWithProvider(): void {
    const provider = this.closest('semantic-provider') || 
                    document.querySelector('semantic-provider');
    
    if (provider) {
      provider.dispatchEvent(new CustomEvent('semantic-register', {
        detail: {
          element: this,
          manifest: this.getManifest()
        },
        bubbles: true
      }));
    }
  }

  private getValidationRules(): Array<{ type: string; params?: any }> {
    const rules: Array<{ type: string; params?: any }> = [];
    
    if (this.hasAttribute('required')) {
      rules.push({ type: 'required' });
    }
    
    const type = this.getAttribute('type');
    if (type === 'email') {
      rules.push({ type: 'email' });
    }
    
    const minLength = this.getAttribute('minlength');
    if (minLength) {
      rules.push({ type: 'minLength', params: { min: parseInt(minLength) } });
    }
    
    const maxLength = this.getAttribute('maxlength');
    if (maxLength) {
      rules.push({ type: 'maxLength', params: { max: parseInt(maxLength) } });
    }
    
    const pattern = this.getAttribute('pattern');
    if (pattern) {
      rules.push({ type: 'pattern', params: { pattern } });
    }
    
    const min = this.getAttribute('min');
    if (min) {
      rules.push({ type: 'min', params: { min: parseFloat(min) } });
    }
    
    const max = this.getAttribute('max');
    if (max) {
      rules.push({ type: 'max', params: { max: parseFloat(max) } });
    }
    
    return rules;
  }

  private getValidationMessages(): Record<string, string> {
    return {
      required: `${this.getAttribute('label') || 'This field'} is required`,
      email: 'Please enter a valid email address',
      minLength: `Minimum length is {min} characters`,
      maxLength: `Maximum length is {max} characters`,
      pattern: 'Please match the required format',
      min: `Value must be at least {min}`,
      max: `Value must be at most {max}`
    };
  }

  public validate(): boolean {
    this._errors = [];
    this._isValid = true;
    
    const rules = this.getValidationRules();
    const messages = this.getValidationMessages();
    const value = this._value;
    
    for (const rule of rules) {
      let isValid = true;
      let errorMessage = messages[rule.type] || 'Invalid value';
      
      switch (rule.type) {
        case 'required':
          isValid = !!value && value.trim().length > 0;
          break;
        
        case 'email':
          isValid = !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          break;
        
        case 'minLength':
          isValid = !value || value.length >= rule.params.min;
          errorMessage = errorMessage.replace('{min}', rule.params.min);
          break;
        
        case 'maxLength':
          isValid = !value || value.length <= rule.params.max;
          errorMessage = errorMessage.replace('{max}', rule.params.max);
          break;
        
        case 'pattern':
          isValid = !value || new RegExp(rule.params.pattern).test(value);
          break;
        
        case 'min':
          isValid = !value || parseFloat(value) >= rule.params.min;
          errorMessage = errorMessage.replace('{min}', rule.params.min);
          break;
        
        case 'max':
          isValid = !value || parseFloat(value) <= rule.params.max;
          errorMessage = errorMessage.replace('{max}', rule.params.max);
          break;
      }
      
      if (!isValid) {
        this._errors.push(errorMessage);
        this._isValid = false;
      }
    }
    
    if (this._errors.length > 0) {
      this.setAttribute('error', this._errors[0]);
    } else {
      this.removeAttribute('error');
    }
    
    this.emit('semantic-validate', { 
      valid: this._isValid, 
      errors: this._errors,
      value: this._value 
    });
    
    return this._isValid;
  }

  public getValue(): string {
    return this._value;
  }

  public setValue(value: string): void {
    this._value = value;
    this.setAttribute('value', value);
    const input = this.getInputElement();
    if (input) {
      input.value = value;
    }
  }

  public reset(): void {
    this._value = '';
    this._errors = [];
    this._isValid = true;
    this.removeAttribute('value');
    this.removeAttribute('error');
    const input = this.getInputElement();
    if (input) {
      input.value = '';
    }
  }

  public get value(): string {
    return this._value;
  }

  public set value(val: string) {
    this.setValue(val);
  }

  public get valid(): boolean {
    return this._isValid;
  }

  public get errors(): string[] {
    return this._errors;
  }
}

customElements.define('semantic-field', SemanticField);