import { useState, useCallback, useEffect } from 'preact/hooks';
import { 
  AppState, 
  TabState, 
  RequestConfig, 
  RequestResponse,
  KeyValue,
  ProxyConfig,
  Collection,
  Folder,
  Environment,
  TestScript,
  TestResult
} from './types';
import { storage } from './storage';
import { config } from './config';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultRequest = (): RequestConfig => ({
  id: generateId(),
  method: 'GET',
  url: '',
  headers: [],
  params: [],
  body: { type: 'none', files: [], formData: [] },
  auth: { type: 'none' },
  proxy: config.DEFAULT_PROXY_CONFIG,
  createdAt: new Date()
});

const createDefaultTab = (name: string = 'New Request'): TabState => ({
  id: generateId(),
  name,
  request: createDefaultRequest(),
  loading: false,
  saved: false
});

export const useAppState = () => {
  const [state, setState] = useState<AppState>(() => {
    // Try to load saved data
    const savedHistory = storage.loadHistory();
    const savedProxyConfig = storage.loadProxyConfig();
    const savedTabs = storage.loadTabs();
    const savedCollections = storage.loadCollections();
    const savedFolders = storage.loadFolders();
    const savedRequests = storage.loadSavedRequests();
    const savedEnvironments = storage.loadEnvironments();
    const activeEnvironmentId = storage.loadActiveEnvironment();
    const savedTestScripts = storage.loadTestScripts();
    const savedTestResults = storage.loadTestResults();
    
    if (savedTabs && savedTabs.length > 0) {
      return {
        tabs: savedTabs,
        activeTabId: savedTabs[0].id,
        history: savedHistory,
        proxyConfig: savedProxyConfig,
        collections: savedCollections,
        folders: savedFolders,
        savedRequests: savedRequests,
        environments: savedEnvironments,
        activeEnvironmentId,
        testScripts: savedTestScripts,
        testResults: savedTestResults
      };
    }
    
    // Default state
    const initialTab = createDefaultTab();
    return {
      tabs: [initialTab],
      activeTabId: initialTab.id,
      history: savedHistory,
      proxyConfig: savedProxyConfig,
      collections: savedCollections,
      folders: savedFolders,
      savedRequests: savedRequests,
      environments: savedEnvironments,
      activeEnvironmentId,
      testScripts: savedTestScripts,
      testResults: savedTestResults
    };
  });

  // Auto-save to localStorage when state changes
  useEffect(() => {
    storage.saveHistory(state.history);
    storage.saveProxyConfig(state.proxyConfig);
    storage.saveTabs(state.tabs);
    storage.saveCollections(state.collections);
    storage.saveFolders(state.folders);
    storage.saveSavedRequests(state.savedRequests);
    storage.saveEnvironments(state.environments);
    storage.saveActiveEnvironment(state.activeEnvironmentId);
    storage.saveTestScripts(state.testScripts);
    storage.saveTestResults(state.testResults);
  }, [
    state.history, 
    state.proxyConfig, 
    state.tabs, 
    state.collections, 
    state.folders, 
    state.savedRequests, 
    state.environments, 
    state.activeEnvironmentId, 
    state.testScripts, 
    state.testResults
  ]);

  // Tab management
  const addTab = useCallback(() => {
    const newTab = createDefaultTab();
    setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id
    }));
    return newTab.id;
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setState(prev => {
      const newTabs = prev.tabs.filter(tab => tab.id !== tabId);
      if (newTabs.length === 0) {
        const newTab = createDefaultTab();
        return {
          ...prev,
          tabs: [newTab],
          activeTabId: newTab.id
        };
      }
      
      const newActiveId = prev.activeTabId === tabId 
        ? newTabs[Math.max(0, prev.tabs.findIndex(t => t.id === tabId) - 1)].id
        : prev.activeTabId;
      
      return {
        ...prev,
        tabs: newTabs,
        activeTabId: newActiveId
      };
    });
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setState(prev => ({
      ...prev,
      activeTabId: tabId
    }));
  }, []);

  const updateTab = useCallback((tabId: string, updates: Partial<TabState>) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    }));
  }, []);

  // Request management
  const updateRequest = useCallback((tabId: string, updates: Partial<RequestConfig>) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === tabId 
          ? { 
              ...tab, 
              request: { ...tab.request, ...updates },
              saved: false
            }
          : tab
      )
    }));
  }, []);

  const addKeyValue = useCallback((tabId: string, type: 'headers' | 'params') => {
    const newItem: KeyValue = {
      id: generateId(),
      key: '',
      value: '',
      enabled: true
    };

    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === tabId
          ? {
              ...tab,
              request: {
                ...tab.request,
                [type]: [...tab.request[type], newItem]
              },
              saved: false
            }
          : tab
      )
    }));
  }, []);

  const updateKeyValue = useCallback((
    tabId: string, 
    type: 'headers' | 'params', 
    id: string, 
    updates: Partial<KeyValue>
  ) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === tabId
          ? {
              ...tab,
              request: {
                ...tab.request,
                [type]: tab.request[type].map(item => 
                  item.id === id ? { ...item, ...updates } : item
                )
              },
              saved: false
            }
          : tab
      )
    }));
  }, []);

  const removeKeyValue = useCallback((tabId: string, type: 'headers' | 'params', id: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === tabId
          ? {
              ...tab,
              request: {
                ...tab.request,
                [type]: tab.request[type].filter(item => item.id !== id)
              },
              saved: false
            }
          : tab
      )
    }));
  }, []);

  // History management
  const addToHistory = useCallback((requestResponse: RequestResponse) => {
    setState(prev => ({
      ...prev,
      history: [requestResponse, ...prev.history.slice(0, 99)] // Keep last 100 items
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: []
    }));
  }, []);

  // Proxy management
  const updateProxyConfig = useCallback((config: ProxyConfig) => {
    setState(prev => ({
      ...prev,
      proxyConfig: config
    }));
  }, []);

  // Get current active tab
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);

  // Collections management
  const createCollection = useCallback((name: string, description?: string) => {
    const newCollection: Collection = {
      id: generateId(),
      name,
      description,
      createdAt: new Date()
    };
    setState(prev => ({
      ...prev,
      collections: [...prev.collections, newCollection]
    }));
    return newCollection.id;
  }, []);

  const createFolder = useCallback((collectionId: string, name: string) => {
    const newFolder: Folder = {
      id: generateId(),
      name,
      collectionId,
      createdAt: new Date()
    };
    setState(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder]
    }));
    return newFolder.id;
  }, []);

  const saveRequest = useCallback((request: RequestConfig, folderId?: string) => {
    const savedRequest: RequestConfig = {
      ...request,
      id: generateId(),
      folderId,
      updatedAt: new Date()
    };
    setState(prev => ({
      ...prev,
      savedRequests: [...prev.savedRequests, savedRequest]
    }));
    return savedRequest.id;
  }, []);

  // Environments management
  const createEnvironment = useCallback((name: string) => {
    const newEnv: Environment = {
      id: generateId(),
      name,
      variables: [],
      createdAt: new Date()
    };
    setState(prev => ({
      ...prev,
      environments: [...prev.environments, newEnv]
    }));
    return newEnv.id;
  }, []);

  const updateEnvironment = useCallback((env: Environment) => {
    setState(prev => ({
      ...prev,
      environments: prev.environments.map(e => 
        e.id === env.id ? env : e
      )
    }));
  }, []);

  const setActiveEnvironment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activeEnvironmentId: id
    }));
  }, []);

  // Test management
  const createTestScript = useCallback((script: TestScript) => {
    setState(prev => ({
      ...prev,
      testScripts: [...prev.testScripts, script]
    }));
  }, []);

  const updateTestScript = useCallback((script: TestScript) => {
    setState(prev => ({
      ...prev,
      testScripts: prev.testScripts.map(s => 
        s.id === script.id ? script : s
      )
    }));
  }, []);

  const addTestResult = useCallback((result: TestResult) => {
    setState(prev => ({
      ...prev,
      testResults: [result, ...prev.testResults.slice(0, 199)] // Keep last 200 results
    }));
  }, []);

  // Delete functions
  const deleteCollection = useCallback((id: string) => {
    setState(prev => {
      const foldersToDelete = prev.folders.filter(f => f.collectionId === id);
      
      return {
        ...prev,
        collections: prev.collections.filter(c => c.id !== id),
        folders: prev.folders.filter(f => f.collectionId !== id),
        savedRequests: prev.savedRequests.filter(r => 
          !foldersToDelete.some(f => f.id === r.folderId)
        )
      };
    });
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      folders: prev.folders.filter(f => f.id !== id),
      savedRequests: prev.savedRequests.filter(r => r.folderId !== id)
    }));
  }, []);

  const deleteRequest = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      savedRequests: prev.savedRequests.filter(r => r.id !== id)
    }));
  }, []);

  const deleteEnvironment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      environments: prev.environments.filter(e => e.id !== id),
      activeEnvironmentId: prev.activeEnvironmentId === id ? undefined : prev.activeEnvironmentId
    }));
  }, []);

  const deleteTestScript = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      testScripts: prev.testScripts.filter(s => s.id !== id)
    }));
  }, []);

  return {
    state,
    activeTab,
    addTab,
    closeTab,
    setActiveTab,
    updateTab,
    updateRequest,
    addKeyValue,
    updateKeyValue,
    removeKeyValue,
    addToHistory,
    clearHistory,
    updateProxyConfig,
    // Collections
    createCollection,
    createFolder,
    saveRequest,
    deleteCollection,
    deleteFolder,
    deleteRequest,
    // Environments
    createEnvironment,
    updateEnvironment,
    setActiveEnvironment,
    deleteEnvironment,
    // Testing
    createTestScript,
    updateTestScript,
    addTestResult,
    deleteTestScript
  };
};
