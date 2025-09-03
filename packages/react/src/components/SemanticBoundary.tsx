/**
 * SemanticBoundary Component
 * Error boundary with semantic context and recovery suggestions
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SemanticProtocol } from '@kneelinghorse/semantic-protocol';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo, semanticContext?: any) => void;
  enableRecovery?: boolean;
  semanticId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  semanticContext: any;
  recoverySuggestions: string[];
}

export class SemanticBoundary extends Component<Props, State> {
  private protocol: SemanticProtocol;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      semanticContext: null,
      recoverySuggestions: []
    };
    this.protocol = new SemanticProtocol();
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }
  
  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Gather semantic context
    const semanticContext = this.gatherSemanticContext();
    const recoverySuggestions = this.generateRecoverySuggestions(error, semanticContext);
    
    this.setState({
      error,
      errorInfo,
      semanticContext,
      recoverySuggestions
    });
    
    // Call error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, semanticContext);
    }
    
    // Log semantic error report
    this.logSemanticError(error, errorInfo, semanticContext);
  }
  
  gatherSemanticContext(): any {
    const context: any = {
      timestamp: new Date().toISOString(),
      semanticId: this.props.semanticId,
      registeredComponents: []
    };
    
    // Try to gather registered components
    try {
      if (this.props.semanticId) {
        const component = this.protocol.get(this.props.semanticId);
        if (component) {
          context.failedComponent = component;
          
          // Get related components
          const related = this.protocol.getRelated?.(this.props.semanticId, 'all') || [];
          context.relatedComponents = related;
        }
      }
    } catch (err) {
      context.contextGatheringError = err;
    }
    
    return context;
  }
  
  generateRecoverySuggestions(error: Error, semanticContext: any): string[] {
    const suggestions: string[] = [];
    
    // Analyze error message for common patterns
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('undefined') || errorMessage.includes('null')) {
      suggestions.push('Check that all required props are being passed');
      suggestions.push('Verify data is loaded before rendering');
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      suggestions.push('Check network connectivity');
      suggestions.push('Verify API endpoints are correct');
      suggestions.push('Check for CORS issues');
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      suggestions.push('Verify user authentication');
      suggestions.push('Check user permissions');
    }
    
    if (errorMessage.includes('timeout')) {
      suggestions.push('Increase timeout duration');
      suggestions.push('Check server response times');
    }
    
    // Semantic-specific suggestions
    if (semanticContext?.failedComponent) {
      const type = semanticContext.failedComponent.manifest?.element?.type;
      if (type === 'form') {
        suggestions.push('Verify form validation rules');
        suggestions.push('Check form field requirements');
      } else if (type === 'table') {
        suggestions.push('Verify data structure matches table columns');
        suggestions.push('Check for missing required columns');
      }
    }
    
    // Add generic suggestion if no specific ones found
    if (suggestions.length === 0) {
      suggestions.push('Check the browser console for more details');
      suggestions.push('Try refreshing the page');
      suggestions.push('Contact support if the issue persists');
    }
    
    return suggestions;
  }
  
  logSemanticError(error: Error, errorInfo: ErrorInfo, semanticContext: any) {
    const report = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      semanticContext,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };
    
    console.error('[SemanticBoundary] Error Report:', report);
    
    // Emit error event for monitoring tools
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('semantic:error', { detail: report }));
    }
  }
  
  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      semanticContext: null,
      recoverySuggestions: []
    });
  };
  
  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.state.errorInfo!);
      }
      
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0'
        }}>
          <h2 style={{ color: '#c92a2a', marginTop: 0 }}>Something went wrong</h2>
          
          <details style={{ marginBottom: '15px', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Error Details
            </summary>
            <pre style={{
              backgroundColor: '#fff',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.message}
            </pre>
          </details>
          
          {this.state.recoverySuggestions.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
                Recovery Suggestions:
              </h3>
              <ul style={{ marginLeft: '20px' }}>
                {this.state.recoverySuggestions.map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {this.state.semanticContext?.failedComponent && (
            <details style={{ marginBottom: '15px', cursor: 'pointer' }}>
              <summary style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                Semantic Context
              </summary>
              <pre style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '11px'
              }}>
                {JSON.stringify(this.state.semanticContext, null, 2)}
              </pre>
            </details>
          )}
          
          {this.props.enableRecovery && (
            <button
              onClick={this.retry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#087f5b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}