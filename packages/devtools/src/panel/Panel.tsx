import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Provider } from 'react-redux';
import { store } from './store';
import { InspectorView } from './views/InspectorView';
import { RelationshipsView } from './views/RelationshipsView';
import { DiscoveryView } from './views/DiscoveryView';
import { PerformanceView } from './views/PerformanceView';
import { CoverageView } from './views/CoverageView';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;

  --background: #1e1e1e;
  --surface: #252526;
  --border: #3c3c3c;
  --text: #cccccc;
  --text-secondary: #969696;
  --primary: #2196f3;
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;

  &.light {
    --background: #ffffff;
    --surface: #f3f3f3;
    --border: #e0e0e0;
    --text: #333333;
    --text-secondary: #666666;
  }
`;

const TabBar = styled.div`
  display: flex;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: ${props => props.active ? 'var(--background)' : 'transparent'};
  color: ${props => props.active ? 'var(--primary)' : 'var(--text)'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary)' : 'transparent'};
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: var(--background);
  }

  .badge {
    display: inline-block;
    margin-left: 4px;
    padding: 2px 6px;
    background: var(--primary);
    color: white;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
  }
`;

const ViewContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-secondary);

  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);

    &.error {
      background: var(--error);
    }
    &.warning {
      background: var(--warning);
    }
  }
`;

type TabType = 'inspector' | 'relationships' | 'discovery' | 'performance' | 'coverage';

export const Panel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inspector');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [stats, setStats] = useState({
    components: 0,
    coverage: 0,
    events: 0,
    errors: 0
  });

  useEffect(() => {
    // Load theme preference
    chrome.storage.sync.get(['theme'], (result) => {
      if (result.theme) {
        setTheme(result.theme);
      }
    });

    // Listen for updates from content script
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Request initial data
    requestSemantics();

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleMessage = (message: any) => {
    switch (message.type) {
      case 'SEMANTIC_COMPONENT:DISCOVERED':
        updateStats();
        break;
      case 'SEMANTIC_COMPONENT:REMOVED':
        updateStats();
        break;
      case 'SEMANTIC_VALIDATION:COMPLETE':
        if (message.data.errors?.length > 0) {
          setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        }
        break;
      case 'SEMANTIC_EVENT':
        setStats(prev => ({ ...prev, events: prev.events + 1 }));
        break;
    }
  };

  const requestSemantics = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SEMANTICS' }, (response) => {
          if (response) {
            setStats({
              components: response.components.length,
              coverage: response.stats.coverage,
              events: stats.events,
              errors: stats.errors
            });
          }
        });
      }
    });
  };

  const updateStats = () => {
    requestSemantics();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    chrome.storage.sync.set({ theme: newTheme });
  };

  const renderView = () => {
    switch (activeTab) {
      case 'inspector':
        return <InspectorView />;
      case 'relationships':
        return <RelationshipsView />;
      case 'discovery':
        return <DiscoveryView />;
      case 'performance':
        return <PerformanceView />;
      case 'coverage':
        return <CoverageView />;
      default:
        return null;
    }
  };

  return (
    <Provider store={store}>
      <PanelContainer className={theme}>
        <TabBar>
          <Tab
            active={activeTab === 'inspector'}
            onClick={() => setActiveTab('inspector')}
          >
            Inspector
            {stats.components > 0 && <span className="badge">{stats.components}</span>}
          </Tab>
          <Tab
            active={activeTab === 'relationships'}
            onClick={() => setActiveTab('relationships')}
          >
            Relationships
          </Tab>
          <Tab
            active={activeTab === 'discovery'}
            onClick={() => setActiveTab('discovery')}
          >
            Discovery
          </Tab>
          <Tab
            active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </Tab>
          <Tab
            active={activeTab === 'coverage'}
            onClick={() => setActiveTab('coverage')}
          >
            Coverage
            <span className="badge">{stats.coverage}%</span>
          </Tab>
        </TabBar>

        <ViewContainer>
          {renderView()}
        </ViewContainer>

        <StatusBar>
          <div className="status-item">
            <span className={`dot ${stats.errors > 0 ? 'error' : ''}`} />
            <span>
              {stats.errors > 0 ? `${stats.errors} errors` : 'No errors'}
            </span>
          </div>
          <div className="status-item">
            <span>Components: {stats.components}</span>
            <span>•</span>
            <span>Coverage: {stats.coverage}%</span>
            <span>•</span>
            <span>Events: {stats.events}</span>
          </div>
          <div className="status-item">
            <button onClick={toggleTheme} style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit',
              cursor: 'pointer',
              padding: '2px 6px'
            }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={requestSemantics} style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '2px 6px'
            }}>
              🔄
            </button>
          </div>
        </StatusBar>
      </PanelContainer>
    </Provider>
  );
};

export default Panel;