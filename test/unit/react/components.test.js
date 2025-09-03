import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { 
  SemanticProvider,
  SemanticBoundary,
  SemanticPortal,
  SemanticComponent,
  SemanticGroup
} from '../../../packages/react/src/components';
import { useSemantics } from '../../../packages/react/src/hooks';

describe('React Components', () => {
  describe('SemanticProvider', () => {
    test('should provide semantic context to children', () => {
      const TestComponent = () => {
        const { protocol } = useSemantics({
          id: 'test',
          element: { type: 'display' }
        });
        return <div>{protocol ? 'Has Protocol' : 'No Protocol'}</div>;
      };

      render(
        <SemanticProvider>
          <TestComponent />
        </SemanticProvider>
      );

      expect(screen.getByText('Has Protocol')).toBeInTheDocument();
    });

    test('should merge provider context with component context', () => {
      const TestComponent = () => {
        const { manifest } = useSemantics({
          id: 'test',
          element: { type: 'action' },
          context: { step: 2 }
        });
        return (
          <div>
            Theme: {manifest.context.theme}
            Step: {manifest.context.step}
          </div>
        );
      };

      render(
        <SemanticProvider context={{ theme: 'dark', flow: 'checkout' }}>
          <TestComponent />
        </SemanticProvider>
      );

      expect(screen.getByText(/Theme: dark/)).toBeInTheDocument();
      expect(screen.getByText(/Step: 2/)).toBeInTheDocument();
    });

    test('should handle nested providers', () => {
      const TestComponent = () => {
        const { manifest } = useSemantics({
          id: 'nested',
          element: { type: 'display' }
        });
        return <div>Flow: {manifest.context.flow}</div>;
      };

      render(
        <SemanticProvider context={{ flow: 'outer' }}>
          <SemanticProvider context={{ flow: 'inner' }}>
            <TestComponent />
          </SemanticProvider>
        </SemanticProvider>
      );

      expect(screen.getByText('Flow: inner')).toBeInTheDocument();
    });

    test('should provide discovery and registry access', () => {
      const TestComponent = () => {
        const { discovery, registry } = useSemantics({
          id: 'test',
          element: { type: 'display' }
        });
        
        const components = discovery.find({ type: 'display' });
        
        return (
          <div>
            Registry Size: {registry.size}
            Found: {components.length}
          </div>
        );
      };

      render(
        <SemanticProvider>
          <TestComponent />
        </SemanticProvider>
      );

      expect(screen.getByText(/Registry Size: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Found: 1/)).toBeInTheDocument();
    });

    test('should handle provider configuration', () => {
      const config = {
        debug: true,
        cache: { enabled: true, ttl: 5000 },
        validation: { strict: true }
      };

      const TestComponent = () => {
        const { config: activeConfig } = useSemantics({
          id: 'test',
          element: { type: 'display' }
        });
        return <div>Debug: {activeConfig.debug ? 'On' : 'Off'}</div>;
      };

      render(
        <SemanticProvider config={config}>
          <TestComponent />
        </SemanticProvider>
      );

      expect(screen.getByText('Debug: On')).toBeInTheDocument();
    });

    test('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useSemantics({ id: 'test', element: { type: 'display' } });
        return null;
      };

      // Suppress console.error for this test
      const spy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<TestComponent />)).toThrow(
        'useSemantics must be used within a SemanticProvider'
      );
      
      spy.mockRestore();
    });
  });

  describe('SemanticBoundary', () => {
    test('should catch and display semantic errors', () => {
      const ThrowingComponent = () => {
        throw new Error('Semantic validation failed');
      };

      render(
        <SemanticProvider>
          <SemanticBoundary>
            <ThrowingComponent />
          </SemanticBoundary>
        </SemanticProvider>
      );

      expect(screen.getByText(/Semantic Error/)).toBeInTheDocument();
      expect(screen.getByText(/Semantic validation failed/)).toBeInTheDocument();
    });

    test('should render fallback component on error', () => {
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };

      const Fallback = ({ error }) => (
        <div>Custom Error: {error.message}</div>
      );

      render(
        <SemanticProvider>
          <SemanticBoundary fallback={Fallback}>
            <ThrowingComponent />
          </SemanticBoundary>
        </SemanticProvider>
      );

      expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
    });

    test('should reset error state', () => {
      let shouldThrow = true;
      
      const ConditionalComponent = () => {
        if (shouldThrow) {
          throw new Error('Conditional error');
        }
        return <div>Success</div>;
      };

      const { rerender } = render(
        <SemanticProvider>
          <SemanticBoundary>
            <ConditionalComponent />
          </SemanticBoundary>
        </SemanticProvider>
      );

      expect(screen.getByText(/Conditional error/)).toBeInTheDocument();

      // Click reset button
      const resetButton = screen.getByText('Reset');
      shouldThrow = false;
      fireEvent.click(resetButton);

      rerender(
        <SemanticProvider>
          <SemanticBoundary>
            <ConditionalComponent />
          </SemanticBoundary>
        </SemanticProvider>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    test('should log errors in development', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const ThrowingComponent = () => {
        throw new Error('Dev error');
      };

      render(
        <SemanticProvider>
          <SemanticBoundary>
            <ThrowingComponent />
          </SemanticBoundary>
        </SemanticProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SemanticBoundary caught error'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should isolate errors to boundary scope', () => {
      const ThrowingComponent = () => {
        throw new Error('Isolated error');
      };

      const SafeComponent = () => <div>Safe Component</div>;

      render(
        <SemanticProvider>
          <div>
            <SemanticBoundary>
              <ThrowingComponent />
            </SemanticBoundary>
            <SafeComponent />
          </div>
        </SemanticProvider>
      );

      expect(screen.getByText(/Isolated error/)).toBeInTheDocument();
      expect(screen.getByText('Safe Component')).toBeInTheDocument();
    });
  });

  describe('SemanticPortal', () => {
    test('should render content in portal', () => {
      render(
        <SemanticProvider>
          <div id="app">
            <SemanticPortal>
              <div>Portal Content</div>
            </SemanticPortal>
          </div>
        </SemanticProvider>
      );

      const portalContent = document.querySelector('[data-semantic-portal]');
      expect(portalContent).toBeInTheDocument();
      expect(portalContent).toHaveTextContent('Portal Content');
    });

    test('should maintain semantic context in portal', () => {
      const PortalChild = () => {
        const { manifest } = useSemantics({
          id: 'portal-child',
          element: { type: 'modal' }
        });
        return <div>Context: {manifest.context.flow}</div>;
      };

      render(
        <SemanticProvider context={{ flow: 'checkout' }}>
          <SemanticPortal>
            <PortalChild />
          </SemanticPortal>
        </SemanticProvider>
      );

      expect(screen.getByText('Context: checkout')).toBeInTheDocument();
    });

    test('should handle portal with custom container', () => {
      const container = document.createElement('div');
      container.id = 'custom-portal-root';
      document.body.appendChild(container);

      render(
        <SemanticProvider>
          <SemanticPortal container={container}>
            <div>Custom Portal</div>
          </SemanticPortal>
        </SemanticProvider>
      );

      expect(container).toHaveTextContent('Custom Portal');

      document.body.removeChild(container);
    });

    test('should cleanup portal on unmount', () => {
      const { unmount } = render(
        <SemanticProvider>
          <SemanticPortal>
            <div>Temporary Portal</div>
          </SemanticPortal>
        </SemanticProvider>
      );

      const portal = document.querySelector('[data-semantic-portal]');
      expect(portal).toBeInTheDocument();

      unmount();

      const portalAfterUnmount = document.querySelector('[data-semantic-portal]');
      expect(portalAfterUnmount).not.toBeInTheDocument();
    });

    test('should handle multiple portals', () => {
      render(
        <SemanticProvider>
          <SemanticPortal id="portal-1">
            <div>Portal 1</div>
          </SemanticPortal>
          <SemanticPortal id="portal-2">
            <div>Portal 2</div>
          </SemanticPortal>
        </SemanticProvider>
      );

      const portals = document.querySelectorAll('[data-semantic-portal]');
      expect(portals).toHaveLength(2);
      expect(portals[0]).toHaveTextContent('Portal 1');
      expect(portals[1]).toHaveTextContent('Portal 2');
    });
  });

  describe('SemanticComponent', () => {
    test('should render with semantic manifest', () => {
      const manifest = {
        id: 'semantic-button',
        element: { type: 'action', intent: 'submit' },
        tags: ['primary']
      };

      render(
        <SemanticProvider>
          <SemanticComponent manifest={manifest}>
            <button>Submit</button>
          </SemanticComponent>
        </SemanticProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-semantic-id', 'semantic-button');
      expect(button).toHaveAttribute('data-semantic-type', 'action');
      expect(button).toHaveAttribute('data-semantic-intent', 'submit');
    });

    test('should apply semantic props to children', () => {
      const manifest = {
        id: 'input-field',
        element: { type: 'input', intent: 'collect' },
        props: {
          'aria-label': 'Email address',
          'aria-required': 'true'
        }
      };

      render(
        <SemanticProvider>
          <SemanticComponent manifest={manifest}>
            <input type="email" />
          </SemanticComponent>
        </SemanticProvider>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Email address');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    test('should handle component updates', async () => {
      const { rerender } = render(
        <SemanticProvider>
          <SemanticComponent 
            manifest={{
              id: 'dynamic',
              element: { type: 'display', intent: 'info' }
            }}
          >
            <div>Content</div>
          </SemanticComponent>
        </SemanticProvider>
      );

      let element = screen.getByText('Content').parentElement;
      expect(element).toHaveAttribute('data-semantic-intent', 'info');

      rerender(
        <SemanticProvider>
          <SemanticComponent 
            manifest={{
              id: 'dynamic',
              element: { type: 'display', intent: 'warning' }
            }}
          >
            <div>Content</div>
          </SemanticComponent>
        </SemanticProvider>
      );

      element = screen.getByText('Content').parentElement;
      expect(element).toHaveAttribute('data-semantic-intent', 'warning');
    });

    test('should forward refs correctly', () => {
      const ref = React.createRef();

      render(
        <SemanticProvider>
          <SemanticComponent 
            ref={ref}
            manifest={{
              id: 'ref-test',
              element: { type: 'input' }
            }}
          >
            <input />
          </SemanticComponent>
        </SemanticProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('SemanticGroup', () => {
    test('should group multiple semantic components', () => {
      render(
        <SemanticProvider>
          <SemanticGroup
            manifest={{
              id: 'form-group',
              element: { type: 'container', intent: 'group' },
              context: { form: 'signup' }
            }}
          >
            <SemanticComponent 
              manifest={{
                id: 'email',
                element: { type: 'input' }
              }}
            >
              <input type="email" />
            </SemanticComponent>
            <SemanticComponent 
              manifest={{
                id: 'password',
                element: { type: 'input' }
              }}
            >
              <input type="password" />
            </SemanticComponent>
          </SemanticGroup>
        </SemanticProvider>
      );

      const group = document.querySelector('[data-semantic-id="form-group"]');
      expect(group).toBeInTheDocument();
      expect(group.querySelectorAll('input')).toHaveLength(2);
    });

    test('should propagate group context to children', () => {
      const ChildComponent = () => {
        const { manifest } = useSemantics({
          id: 'child',
          element: { type: 'display' }
        });
        return <div>Form: {manifest.context.form}</div>;
      };

      render(
        <SemanticProvider>
          <SemanticGroup
            manifest={{
              id: 'group',
              element: { type: 'container' },
              context: { form: 'checkout' }
            }}
          >
            <ChildComponent />
          </SemanticGroup>
        </SemanticProvider>
      );

      expect(screen.getByText('Form: checkout')).toBeInTheDocument();
    });

    test('should handle nested groups', () => {
      render(
        <SemanticProvider>
          <SemanticGroup
            manifest={{
              id: 'outer-group',
              element: { type: 'container' },
              context: { level: 'outer' }
            }}
          >
            <SemanticGroup
              manifest={{
                id: 'inner-group',
                element: { type: 'container' },
                context: { level: 'inner' }
              }}
            >
              <div>Nested Content</div>
            </SemanticGroup>
          </SemanticGroup>
        </SemanticProvider>
      );

      const outerGroup = document.querySelector('[data-semantic-id="outer-group"]');
      const innerGroup = document.querySelector('[data-semantic-id="inner-group"]');
      
      expect(outerGroup).toBeInTheDocument();
      expect(innerGroup).toBeInTheDocument();
      expect(outerGroup).toContainElement(innerGroup);
    });
  });
});