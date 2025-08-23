// Storage utilities for persisting app state
import { RequestResponse, Collection, Folder, Environment, TestScript, TestResult, RequestConfig } from './types';
import { config } from './config';

const STORAGE_KEYS = {
  HISTORY: 'reqly_history',
  PROXY_CONFIG: 'reqly_proxy_config',
  TABS: 'reqly_tabs',
  COLLECTIONS: 'reqly_collections',
  FOLDERS: 'reqly_folders',
  SAVED_REQUESTS: 'reqly_saved_requests',
  ENVIRONMENTS: 'reqly_environments',
  ACTIVE_ENVIRONMENT: 'reqly_active_environment',
  TEST_SCRIPTS: 'reqly_test_scripts',
  TEST_RESULTS: 'reqly_test_results'
} as const;

export const storage = {
  // History management
  saveHistory: (history: RequestResponse[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save history to localStorage:', error);
    }
  },

  loadHistory: (): RequestResponse[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          request: {
            ...item.request,
            createdAt: new Date(item.request.createdAt)
          }
        }));
      }
    } catch (error) {
      console.warn('Failed to load history from localStorage:', error);
    }
    return [];
  },

  // Proxy configuration
  saveProxyConfig: (config: any) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROXY_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save proxy config to localStorage:', error);
    }
  },

  loadProxyConfig: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROXY_CONFIG);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load proxy config from localStorage:', error);
    }
    return config.DEFAULT_PROXY_CONFIG;
  },

  // Tabs (for recovery after refresh)
  saveTabs: (tabs: any[]) => {
    try {
      // Only save non-sensitive tab data
      const sanitizedTabs = tabs.map(tab => ({
        id: tab.id,
        name: tab.name,
        request: {
          ...tab.request,
          // Don't save sensitive auth data
          auth: { type: tab.request.auth.type }
        },
        saved: tab.saved
      }));
      localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(sanitizedTabs));
    } catch (error) {
      console.warn('Failed to save tabs to localStorage:', error);
    }
  },

  loadTabs: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TABS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((tab: any) => ({
          ...tab,
          loading: false,
          response: undefined,
          request: {
            ...tab.request,
            createdAt: new Date(tab.request.createdAt || Date.now()),
            auth: { type: 'none' }, // Reset auth for security
            headers: tab.request.headers || [],
            params: tab.request.params || [],
            body: tab.request.body || { type: 'none' },
            proxy: config.DEFAULT_PROXY_CONFIG
          }
        }));
      }
    } catch (error) {
      console.warn('Failed to load tabs from localStorage:', error);
    }
    return null;
  },

  // Collections management
  saveCollections: (collections: Collection[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
    } catch (error) {
      console.warn('Failed to save collections to localStorage:', error);
    }
  },

  loadCollections: (): Collection[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
      }
    } catch (error) {
      console.warn('Failed to load collections from localStorage:', error);
    }
    return [];
  },

  // Folders management
  saveFolders: (folders: Folder[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    } catch (error) {
      console.warn('Failed to save folders to localStorage:', error);
    }
  },

  loadFolders: (): Folder[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
      }
    } catch (error) {
      console.warn('Failed to load folders from localStorage:', error);
    }
    return [];
  },

  // Saved requests management
  saveSavedRequests: (requests: RequestConfig[]) => {
    try {
      // Don't save sensitive auth data
      const sanitizedRequests = requests.map(req => ({
        ...req,
        auth: { type: req.auth.type }
      }));
      localStorage.setItem(STORAGE_KEYS.SAVED_REQUESTS, JSON.stringify(sanitizedRequests));
    } catch (error) {
      console.warn('Failed to save requests to localStorage:', error);
    }
  },

  loadSavedRequests: (): RequestConfig[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_REQUESTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((req: any) => ({
          ...req,
          createdAt: new Date(req.createdAt),
          updatedAt: req.updatedAt ? new Date(req.updatedAt) : undefined,
          auth: { type: 'none' }, // Reset auth for security
          headers: req.headers || [],
          params: req.params || [],
          body: req.body || { type: 'none' },
          proxy: config.DEFAULT_PROXY_CONFIG
        }));
      }
    } catch (error) {
      console.warn('Failed to load saved requests from localStorage:', error);
    }
    return [];
  },

  // Environments management
  saveEnvironments: (environments: Environment[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(environments));
    } catch (error) {
      console.warn('Failed to save environments to localStorage:', error);
    }
  },

  loadEnvironments: (): Environment[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((env: any) => ({
          ...env,
          createdAt: new Date(env.createdAt),
          updatedAt: env.updatedAt ? new Date(env.updatedAt) : undefined
        }));
      }
    } catch (error) {
      console.warn('Failed to load environments from localStorage:', error);
    }
    return [];
  },

  saveActiveEnvironment: (id?: string) => {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ENVIRONMENT, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ENVIRONMENT);
      }
    } catch (error) {
      console.warn('Failed to save active environment to localStorage:', error);
    }
  },

  loadActiveEnvironment: (): string | undefined => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_ENVIRONMENT) || undefined;
    } catch (error) {
      console.warn('Failed to load active environment from localStorage:', error);
    }
    return undefined;
  },

  // Test scripts management
  saveTestScripts: (scripts: TestScript[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEST_SCRIPTS, JSON.stringify(scripts));
    } catch (error) {
      console.warn('Failed to save test scripts to localStorage:', error);
    }
  },

  loadTestScripts: (): TestScript[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEST_SCRIPTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((script: any) => ({
          ...script,
          createdAt: new Date(script.createdAt),
          updatedAt: script.updatedAt ? new Date(script.updatedAt) : undefined
        }));
      }
    } catch (error) {
      console.warn('Failed to load test scripts from localStorage:', error);
    }
    return [];
  },

  // Test results management
  saveTestResults: (results: TestResult[]) => {
    try {
      // Only keep last 200 results to avoid storage bloat
      const limitedResults = results.slice(0, 200);
      localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(limitedResults));
    } catch (error) {
      console.warn('Failed to save test results to localStorage:', error);
    }
  },

  loadTestResults: (): TestResult[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEST_RESULTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((result: any) => ({
          ...result,
          timestamp: new Date(result.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load test results from localStorage:', error);
    }
    return [];
  },

  // Clear all data
  clearAll: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};
