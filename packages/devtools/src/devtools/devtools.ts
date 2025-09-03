/**
 * DevTools Extension Entry Point
 * Creates the Semantic Protocol panel in Chrome DevTools
 */

// Create the Semantic Protocol panel
chrome.devtools.panels.create(
  'Semantic',
  'public/icon-16.png',
  'panel.html',
  (panel) => {
    console.log('Semantic Protocol DevTools panel created');

    // Add sidebar to Elements panel
    chrome.devtools.panels.elements.createSidebarPane(
      'Semantic Manifest',
      (sidebar) => {
        // Update sidebar when element selection changes
        chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
          updateSidebar(sidebar);
        });

        // Initial update
        updateSidebar(sidebar);
      }
    );
  }
);

// Update sidebar with semantic information
function updateSidebar(sidebar: chrome.devtools.panels.ExtensionSidebarPane) {
  // Evaluate in the context of the inspected page
  chrome.devtools.inspectedWindow.eval(
    `(() => {
      const element = $0; // Currently selected element
      if (!element) return null;

      // Look for semantic data
      const semanticId = element.getAttribute('data-semantic-id');
      const semanticType = element.getAttribute('data-semantic-type');
      const semanticIntent = element.getAttribute('data-semantic-intent');

      // Check for React/Vue semantics
      let manifest = null;
      
      // React
      if (element._reactInternalFiber) {
        const fiber = element._reactInternalFiber;
        if (fiber.memoizedProps && fiber.memoizedProps.semanticManifest) {
          manifest = fiber.memoizedProps.semanticManifest;
        }
      }
      
      // Vue
      if (element.__vue__) {
        const instance = element.__vue__;
        if (instance.$data && instance.$data.manifest) {
          manifest = instance.$data.manifest;
        }
      }

      // Check global registry
      if (window.__SEMANTIC_REGISTRY__) {
        const registry = window.__SEMANTIC_REGISTRY__;
        if (semanticId && registry.has(semanticId)) {
          manifest = registry.get(semanticId).manifest;
        }
      }

      return {
        elementInfo: {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          semanticId,
          semanticType,
          semanticIntent
        },
        manifest,
        hasSemantics: !!(manifest || semanticId || semanticType)
      };
    })()`,
    (result: any, error) => {
      if (error) {
        sidebar.setObject({
          error: 'Failed to inspect element',
          details: error.toString()
        });
        return;
      }

      if (!result) {
        sidebar.setObject({
          message: 'No element selected'
        });
        return;
      }

      if (!result.hasSemantics) {
        sidebar.setPage('no-semantics.html');
        return;
      }

      // Display semantic information
      sidebar.setObject({
        'Element': result.elementInfo,
        'Manifest': result.manifest || 'No manifest found',
        'Actions': {
          'validate': '→ Validate',
          'edit': '→ Edit Manifest',
          'relationships': '→ View Relationships',
          'generate': '→ Generate Tests'
        }
      });
    }
  );
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEMANTIC_UPDATE') {
    // Notify panel of updates
    chrome.runtime.sendMessage({
      type: 'PANEL_UPDATE',
      data: message.data
    });
  }
});

// Add context menu items
chrome.devtools.inspectedWindow.eval(
  `chrome.runtime.sendMessage({ type: 'INIT_CONTEXT_MENU' })`,
  () => {}
);