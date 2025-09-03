import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  SemanticProvider, 
  SemanticBoundary, 
  SemanticPortal,
  SemanticError 
} from '../src';

describe('SemanticProvider', () => {
  it('should provide semantic context to children', () => {
    const TestComponent = () => {
      const context = React.useContext(SemanticContext);
      return <div>{context ? 'Context provided' : 'No context'}</div>;
    };

    const { getByText } = render(
      <SemanticProvider>
        <TestComponent />
      </SemanticProvider>
    );

    expect(getByText('Context provided')).toBeInTheDocument();
  });

  it('should initialize with custom protocol', () => {
    const customProtocol = new SemanticProtocol();
    
    const TestComponent = () => {
      const { protocol } = useSemanticContext();
      return <div>{protocol === customProtocol ? 'Custom' : 'Default'}</div>;
    };

    const { getByText } = render(
      <SemanticProvider protocol={customProtocol}>
        <TestComponent />
      </SemanticProvider>
    );

    expect(getByText('Custom')).toBeInTheDocument();
  });

  it('should enable dev tools when specified', () => {
    render(
      <SemanticProvider enableDevTools>
        <div>Test</div>
      </SemanticProvider>
    );

    expect(window.__SEMANTIC_DEVTOOLS__).toBeDefined();
  });

  it('should handle errors with onError callback', () => {
    const onError = jest.fn();
    const error = new Error('Test error');

    const ThrowError = () => {
      throw error;
    };

    render(
      <SemanticProvider onError={onError}>
        <SemanticBoundary>
          <ThrowError />
        </SemanticBoundary>
      </SemanticProvider>
    );

    waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });
});

describe('SemanticBoundary', () => {
  it('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error message');
    };

    const { getByText } = render(
      <SemanticProvider>
        <SemanticBoundary>
          <ThrowError />
        </SemanticBoundary>
      </SemanticProvider>
    );

    expect(getByText(/Test error message/)).toBeInTheDocument();
    expect(getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('should use custom fallback component', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const CustomFallback = ({ error }: { error: SemanticError }) => (
      <div>Custom error: {error.message}</div>
    );

    const { getByText } = render(
      <SemanticProvider>
        <SemanticBoundary fallback={(error) => <CustomFallback error={error} />}>
          <ThrowError />
        </SemanticBoundary>
      </SemanticProvider>
    );

    expect(getByText(/Custom error: Test error/)).toBeInTheDocument();
  });

  it('should display suggestions for semantic errors', () => {
    const ThrowError = () => {
      throw new SemanticError(
        'Semantic validation failed',
        'test-component',
        undefined,
        ['Check manifest configuration', 'Verify relationships']
      );
    };

    const { getByText } = render(
      <SemanticProvider>
        <SemanticBoundary>
          <ThrowError />
        </SemanticBoundary>
      </SemanticProvider>
    );

    expect(getByText(/Check manifest configuration/)).toBeInTheDocument();
    expect(getByText(/Verify relationships/)).toBeInTheDocument();
  });

  it('should reset error boundary', () => {
    let shouldThrow = true;

    const ConditionalError = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    const { getByText, rerender } = render(
      <SemanticProvider>
        <SemanticBoundary>
          <ConditionalError />
        </SemanticBoundary>
      </SemanticProvider>
    );

    expect(getByText(/Test error/)).toBeInTheDocument();

    const resetButton = getByText('Try Again');
    shouldThrow = false;
    
    fireEvent.click(resetButton);

    waitFor(() => {
      expect(getByText('No error')).toBeInTheDocument();
    });
  });

  it('should reset on resetKeys change', () => {
    let resetKey = 'key1';
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { rerender } = render(
      <SemanticProvider>
        <SemanticBoundary resetKeys={[resetKey]}>
          <ThrowError />
        </SemanticBoundary>
      </SemanticProvider>
    );

    resetKey = 'key2';

    rerender(
      <SemanticProvider>
        <SemanticBoundary resetKeys={[resetKey]}>
          <div>Reset successful</div>
        </SemanticBoundary>
      </SemanticProvider>
    );

    waitFor(() => {
      expect(screen.getByText('Reset successful')).toBeInTheDocument();
    });
  });

  it('should call onError callback', () => {
    const onError = jest.fn();
    
    const ThrowError = () => {
      throw new SemanticError('Test error', 'test-id');
    };

    render(
      <SemanticProvider>
        <SemanticBoundary onError={onError}>
          <ThrowError />
        </SemanticBoundary>
      </SemanticProvider>
    );

    waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          componentId: 'test-id',
        }),
        expect.any(Object)
      );
    });
  });
});

describe('SemanticPortal', () => {
  beforeEach(() => {
    // Create portal target in document
    const target = document.createElement('div');
    target.id = 'portal-target';
    document.body.appendChild(target);
  });

  afterEach(() => {
    const target = document.getElementById('portal-target');
    if (target) {
      document.body.removeChild(target);
    }
  });

  it('should render content in target element', async () => {
    render(
      <SemanticProvider>
        <div>
          <div id="source">Source container</div>
          <SemanticPortal targetId="portal-target">
            <div>Portal content</div>
          </SemanticPortal>
        </div>
      </SemanticProvider>
    );

    await waitFor(() => {
      const portalTarget = document.getElementById('portal-target');
      expect(portalTarget?.textContent).toContain('Portal content');
    });
  });

  it('should preserve context when specified', async () => {
    const TestComponent = () => {
      const context = useSemanticContext();
      return <div>{context ? 'Has context' : 'No context'}</div>;
    };

    render(
      <SemanticProvider>
        <SemanticPortal targetId="portal-target" preserveContext={true}>
          <TestComponent />
        </SemanticPortal>
      </SemanticProvider>
    );

    await waitFor(() => {
      const portalTarget = document.getElementById('portal-target');
      expect(portalTarget?.textContent).toContain('Has context');
    });
  });

  it('should not render if target not found', () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <SemanticProvider>
        <SemanticPortal targetId="non-existent">
          <div>Portal content</div>
        </SemanticPortal>
      </SemanticProvider>
    );

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Target element with id "non-existent" not found')
    );

    consoleWarn.mockRestore();
  });

  it('should handle target element removal', async () => {
    render(
      <SemanticProvider>
        <SemanticPortal targetId="portal-target">
          <div>Portal content</div>
        </SemanticPortal>
      </SemanticProvider>
    );

    await waitFor(() => {
      const portalTarget = document.getElementById('portal-target');
      expect(portalTarget?.textContent).toContain('Portal content');
    });

    // Remove target element
    const target = document.getElementById('portal-target');
    if (target) {
      document.body.removeChild(target);
    }

    await waitFor(() => {
      const portalTarget = document.getElementById('portal-target');
      expect(portalTarget).toBeNull();
    });
  });

  it('should set portal attributes', async () => {
    render(
      <SemanticProvider>
        <SemanticPortal 
          targetId="portal-target"
          relationship="renders-in"
          metadata={{ customProp: 'value' }}
        >
          <div>Portal content</div>
        </SemanticPortal>
      </SemanticProvider>
    );

    await waitFor(() => {
      const portalTarget = document.getElementById('portal-target');
      const portalElement = portalTarget?.querySelector('[data-semantic-portal]');
      
      expect(portalElement).toHaveAttribute('data-semantic-portal');
      expect(portalElement).toHaveAttribute('data-semantic-portal-target', 'portal-target');
      expect(portalElement).toHaveAttribute('data-semantic-portal-relationship', 'renders-in');
    });
  });

  it('should find target by semantic id', async () => {
    // Create element with semantic id
    const semanticTarget = document.createElement('div');
    semanticTarget.setAttribute('data-semantic-id', 'semantic-target');
    document.body.appendChild(semanticTarget);

    render(
      <SemanticProvider>
        <SemanticPortal targetId="semantic-target">
          <div>Portal content</div>
        </SemanticPortal>
      </SemanticProvider>
    );

    await waitFor(() => {
      expect(semanticTarget.textContent).toContain('Portal content');
    });

    document.body.removeChild(semanticTarget);
  });
});