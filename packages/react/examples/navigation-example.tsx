import React, { useState, useEffect } from 'react';
import {
  SemanticProvider,
  useSemantics,
  useDiscovery,
  useRelationships,
  SemanticBoundary,
} from '@semantic-protocol/react';

interface Route {
  path: string;
  label: string;
  icon?: string;
  requiresAuth?: boolean;
  roles?: string[];
}

const NavItem: React.FC<{
  route: Route;
  isActive: boolean;
  onClick: (path: string) => void;
  depth?: number;
}> = ({ route, isActive, onClick, depth = 0 }) => {
  const { semanticProps, addCapability, removeCapability } = useSemantics({
    manifest: {
      name: `NavItem-${route.path}`,
      version: '1.0.0',
      purpose: `Navigate to ${route.label}`,
      capabilities: ['navigation', isActive ? 'active' : 'inactive'],
      relationships: depth > 0 ? [{
        type: 'child-of' as any,
        targetId: 'main-nav',
      }] : [],
      metadata: {
        type: 'nav-item',
        path: route.path,
        label: route.label,
        depth,
        requiresAuth: route.requiresAuth,
        roles: route.roles,
        tags: ['navigation', 'menu-item', isActive ? 'active' : 'inactive'],
      },
    },
  });

  useEffect(() => {
    if (isActive) {
      addCapability('active');
      removeCapability('inactive');
    } else {
      addCapability('inactive');
      removeCapability('active');
    }
  }, [isActive, addCapability, removeCapability]);

  return (
    <li 
      {...semanticProps}
      className={`nav-item ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: `${depth * 20}px` }}
    >
      <a
        href={route.path}
        onClick={(e) => {
          e.preventDefault();
          onClick(route.path);
        }}
        aria-current={isActive ? 'page' : undefined}
      >
        {route.icon && <span className="icon">{route.icon}</span>}
        {route.label}
      </a>
    </li>
  );
};

const Breadcrumb: React.FC<{
  path: string;
  onNavigate: (path: string) => void;
}> = ({ path, onNavigate }) => {
  const pathParts = path.split('/').filter(Boolean);
  
  const { semanticProps } = useSemantics({
    manifest: {
      name: 'Breadcrumb',
      version: '1.0.0',
      purpose: 'Show current navigation path',
      capabilities: ['navigation', 'path-display'],
      metadata: {
        type: 'breadcrumb',
        currentPath: path,
        depth: pathParts.length,
        tags: ['navigation', 'breadcrumb'],
      },
    },
  });

  return (
    <nav {...semanticProps} aria-label="Breadcrumb">
      <ol className="breadcrumb">
        <li>
          <a href="/" onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}>
            Home
          </a>
        </li>
        {pathParts.map((part, index) => {
          const partPath = '/' + pathParts.slice(0, index + 1).join('/');
          const isLast = index === pathParts.length - 1;
          
          return (
            <li key={partPath}>
              {isLast ? (
                <span aria-current="page">{part}</span>
              ) : (
                <a
                  href={partPath}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(partPath);
                  }}
                >
                  {part}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const NavigationMenu: React.FC<{
  routes: Route[];
  currentPath: string;
  onNavigate: (path: string) => void;
  userRole?: string;
}> = ({ routes, currentPath, onNavigate, userRole = 'user' }) => {
  const { semanticProps, componentId } = useSemantics({
    manifest: {
      name: 'MainNavigation',
      version: '1.0.0',
      purpose: 'Primary navigation menu',
      capabilities: ['navigation', 'routing', 'access-control'],
      metadata: {
        type: 'navigation',
        id: 'main-nav',
        userRole,
        tags: ['navigation', 'menu', 'primary'],
      },
    },
  });

  const { results: activeItems } = useDiscovery({
    query: {
      capabilities: ['active'],
      metadata: { type: 'nav-item' },
    },
    realTime: true,
  });

  const { getChildren, getRelationshipGraph } = useRelationships({
    componentId,
  });

  const filterRoutesByRole = (routes: Route[]): Route[] => {
    return routes.filter(route => {
      if (!route.requiresAuth) return true;
      if (!route.roles) return true;
      return route.roles.includes(userRole);
    });
  };

  const accessibleRoutes = filterRoutesByRole(routes);

  useEffect(() => {
    console.log('Navigation graph:', getRelationshipGraph());
    console.log('Active navigation items:', activeItems.length);
    console.log('Navigation children:', getChildren().length);
  }, [activeItems, getChildren, getRelationshipGraph]);

  return (
    <nav {...semanticProps} className="main-navigation">
      <ul>
        {accessibleRoutes.map(route => (
          <NavItem
            key={route.path}
            route={route}
            isActive={currentPath === route.path}
            onClick={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
};

const RouteGuard: React.FC<{
  path: string;
  requiresAuth: boolean;
  allowedRoles?: string[];
  userRole?: string;
  isAuthenticated: boolean;
  children: React.ReactNode;
}> = ({ path, requiresAuth, allowedRoles, userRole, isAuthenticated, children }) => {
  const { semanticProps } = useSemantics({
    manifest: {
      name: `RouteGuard-${path}`,
      version: '1.0.0',
      purpose: 'Protect route access based on authentication and roles',
      capabilities: ['access-control', 'routing'],
      metadata: {
        type: 'route-guard',
        path,
        requiresAuth,
        allowedRoles,
        userRole,
        isAuthenticated,
        tags: ['security', 'routing', 'guard'],
      },
    },
  });

  const hasAccess = () => {
    if (!requiresAuth) return true;
    if (!isAuthenticated) return false;
    if (!allowedRoles) return true;
    return userRole ? allowedRoles.includes(userRole) : false;
  };

  if (!hasAccess()) {
    return (
      <div {...semanticProps} className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        {!isAuthenticated && <p>Please log in to continue.</p>}
      </div>
    );
  }

  return <div {...semanticProps}>{children}</div>;
};

const NavigationApp: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');

  const routes: Route[] = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊', requiresAuth: true },
    { path: '/profile', label: 'Profile', icon: '👤', requiresAuth: true },
    { path: '/settings', label: 'Settings', icon: '⚙️', requiresAuth: true },
    { path: '/admin', label: 'Admin', icon: '🔐', requiresAuth: true, roles: ['admin'] },
    { path: '/about', label: 'About', icon: 'ℹ️' },
    { path: '/contact', label: 'Contact', icon: '📧' },
  ];

  const { results: allNavItems } = useDiscovery({
    query: {
      metadata: { type: 'nav-item' },
    },
  });

  const { results: protectedRoutes } = useDiscovery({
    query: {
      metadata: { 
        type: 'route-guard',
        requiresAuth: true,
      },
    },
  });

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    console.log(`Navigating to: ${path}`);
  };

  const getCurrentRoute = () => {
    return routes.find(r => r.path === currentPath);
  };

  const currentRoute = getCurrentRoute();

  return (
    <SemanticBoundary>
      <div className="navigation-app">
        <header>
          <h1>Semantic Navigation Example</h1>
          <div className="auth-controls">
            <button onClick={() => setIsAuthenticated(!isAuthenticated)}>
              {isAuthenticated ? 'Logout' : 'Login'}
            </button>
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              disabled={!isAuthenticated}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </header>

        <div className="navigation-container">
          <aside>
            <NavigationMenu
              routes={routes}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              userRole={userRole}
            />
          </aside>

          <main>
            <Breadcrumb 
              path={currentPath} 
              onNavigate={handleNavigate}
            />

            <RouteGuard
              path={currentPath}
              requiresAuth={currentRoute?.requiresAuth || false}
              allowedRoles={currentRoute?.roles}
              userRole={userRole}
              isAuthenticated={isAuthenticated}
            >
              <div className="page-content">
                <h2>{currentRoute?.label || 'Page Not Found'}</h2>
                <p>Current path: {currentPath}</p>
                <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                <p>Role: {userRole}</p>
              </div>
            </RouteGuard>

            <div className="navigation-info">
              <h3>Navigation Discovery</h3>
              <p>Total nav items: {allNavItems.length}</p>
              <p>Protected routes: {protectedRoutes.length}</p>
            </div>
          </main>
        </div>
      </div>
    </SemanticBoundary>
  );
};

const App: React.FC = () => {
  return (
    <SemanticProvider enableDevTools>
      <NavigationApp />
    </SemanticProvider>
  );
};

export default App;