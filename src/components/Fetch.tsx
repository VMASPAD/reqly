import { useState, useEffect } from 'preact/hooks';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Send, Plus, X, Settings, Save, Edit3 } from 'lucide-react';
import { RequestConfig, HttpMethod, TabState, Collection, Folder, Environment, ResponseData } from '@/lib/types';
import { useHttpRequest } from '@/lib/http';
import { useKeyboardShortcuts } from '@/lib/keyboard';
import Ai from './Ai';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

interface FetchProps {
  activeTab: TabState;
  onTabUpdate: (tabId: string, updates: Partial<TabState>) => void;
  onRequestUpdate: (tabId: string, updates: Partial<RequestConfig>) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  tabs: TabState[];
  activeTabId: string;
  onSetActiveTab: (tabId: string) => void;
  proxyConfig: any;
  onProxyConfigChange: (config: any) => void;
  onAddToHistory: (requestResponse: any) => void;
  collections: Collection[];
  folders: Folder[];
  onSaveRequest: (request: RequestConfig, folderId?: string) => string;
  environments: Environment[];
  activeEnvironment?: Environment;
}

const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

function Fetch({ 
  activeTab, 
  onTabUpdate, 
  onRequestUpdate, 
  onAddTab, 
  onCloseTab,
  tabs,
  activeTabId,
  onSetActiveTab,
  proxyConfig,
  onProxyConfigChange,
  onAddToHistory,
  collections,
  folders,
  onSaveRequest,
  environments,
  activeEnvironment
}: FetchProps) {
  const [showProxySettings, setShowProxySettings] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [requestName, setRequestName] = useState('');
  const [customMethodMode, setCustomMethodMode] = useState(false);
  const [customMethod, setCustomMethod] = useState('');
  const { executeRequest } = useHttpRequest();

  // Detect if current method is custom
  useEffect(() => {
    if (activeTab?.request.method) {
      const isCustom = !httpMethods.includes(activeTab.request.method as any);
      setCustomMethodMode(isCustom);
      if (isCustom) {
        setCustomMethod(activeTab.request.method);
      }
    }
  }, [activeTab?.request.method]);

  const handleSendRequest = async () => {
    if (!activeTab || !activeTab.request.url.trim()) return;

    onTabUpdate(activeTab.id, { loading: true });

    try {
      const response = await executeRequest(activeTab.request, proxyConfig, activeEnvironment);
      
      onTabUpdate(activeTab.id, { 
        response, 
        loading: false,
        name: activeTab.request.url.split('/').pop() || 'Request'
      });

      // Add to history (always add, regardless of status code)
      onAddToHistory({
        request: activeTab.request,
        response,
        timestamp: new Date()
      });
    } catch (error) {
      // Create an error response to display
      const errorResponse: ResponseData = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: error instanceof Error ? error.message : 'Request failed',
        time: 0,
        size: 0
      };
      
      onTabUpdate(activeTab.id, { 
        response: errorResponse,
        loading: false 
      });
      
      // Add error to history with error response
      onAddToHistory({
        request: activeTab.request,
        response: errorResponse,
        timestamp: new Date()
      });
    }
  };

  const handleMethodChange = (method: HttpMethod) => {
    if (method === '__custom__') {
      toggleCustomMethod();
      return;
    }
    
    onRequestUpdate(activeTab.id, { method });
    if (!httpMethods.includes(method as any)) {
      setCustomMethodMode(true);
      setCustomMethod(method);
    } else {
      setCustomMethodMode(false);
      setCustomMethod('');
    }
  };

  const handleCustomMethodChange = (method: string) => {
    const upperMethod = method.toUpperCase();
    setCustomMethod(upperMethod);
    onRequestUpdate(activeTab.id, { method: upperMethod });
  };

  const toggleCustomMethod = () => {
    if (customMethodMode) {
      // Volver a método predeterminado
      setCustomMethodMode(false);
      setCustomMethod('');
      onRequestUpdate(activeTab.id, { method: 'GET' });
    } else {
      // Cambiar a método personalizado
      setCustomMethodMode(true);
      setCustomMethod(activeTab?.request.method || 'GET');
    }
  };

  const handleUrlChange = (url: string) => {
    onRequestUpdate(activeTab.id, { url });
  };

  const handleSaveRequest = () => {
    if (!activeTab || !activeTab.request.url.trim()) return;
    
    const requestToSave = {
      ...activeTab.request,
      name: requestName || activeTab.request.url.split('/').pop() || 'Untitled Request'
    };
    
    const folderId = selectedFolderId === 'no-folder' ? undefined : selectedFolderId;
    onSaveRequest(requestToSave, folderId);
    setShowSaveDialog(false);
    setRequestName('');
    setSelectedFolderId('');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTab: onAddTab,
    onCloseTab: () => {
      if (tabs.length > 1) {
        onCloseTab(activeTabId);
      }
    },
    onSendRequest: handleSendRequest,
    onToggleProxySettings: () => setShowProxySettings(!showProxySettings)
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b bg-background"
    >
      {/* Tab Bar */}
      <ScrollArea className="flex flex-row items-center border-b px-2 md:px-4 py-2">
        <ScrollBar orientation="horizontal" />

        <div className="flex items-center space-x-1 flex-1">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`
                flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1.5 rounded-t-lg border-t border-l border-r text-xs md:text-sm whitespace-nowrap
                ${tab.id === activeTabId 
                  ? 'bg-background border-border -mb-px' 
                  : 'bg-muted/50 border-transparent hover:bg-muted'
                }
              `}
            >
              <button 
                onClick={() => onSetActiveTab(tab.id)}
                className="flex-1 text-left truncate max-w-[80px] md:max-w-[120px]"
              >
                {tab.name || 'New Request'}
                {tab.loading && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="ml-1 inline-block"
                  >
                    ⟳
                  </motion.span>
                )}
              </button>
              {tabs.length > 1 && (
                <button
                  onClick={() => onCloseTab(tab.id)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </motion.div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddTab}
            className="ml-1 md:ml-2 p-1 md:p-2"
          >
            <Plus size={14} />
          </Button>
        </div>
        
        
        {/* Environment Indicator */}
        {activeEnvironment && (
          <div className="hidden md:flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <span className="text-green-600">●</span>
            <span className="ml-1">{activeEnvironment.name}</span>
          </div>
        )}
      </ScrollArea>

      {/* Request Bar */}
      <div className="p-2 md:p-4">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <div className="flex w-full md:w-40">
            {customMethodMode ? (
              <div className="flex w-full">
                <Input
                  value={customMethod}
                  onChange={(e) => handleCustomMethodChange(e.currentTarget.value)}
                  placeholder="CUSTOM"
                  className="w-full md:w-28 text-center font-medium text-purple-600 border-r-0 rounded-r-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCustomMethod}
                  className="px-2 border-l-0 rounded-l-none"
                  title="Switch to standard methods"
                >
                  <Edit3 size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex w-full">
                <Select value={activeTab?.request.method} onValueChange={handleMethodChange}>
                  <SelectTrigger className="w-full md:w-28 border-r-0 rounded-r-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {httpMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        <span className={`font-medium ${
                          method === 'GET' ? 'text-green-600' :
                          method === 'POST' ? 'text-blue-600' :
                          method === 'PUT' ? 'text-orange-600' :
                          method === 'DELETE' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {method}
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="border-t">
                      <span className="font-medium text-purple-600">+ Custom Method</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCustomMethod}
                  className="px-2 border-l-0 rounded-l-none"
                  title="Use custom method"
                >
                  <Edit3 size={14} />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 flex-1">
            <Input
              placeholder="Enter request URL..."
              value={activeTab?.request.url || ''}
              onChange={(e) => handleUrlChange(e.currentTarget.value)}
              className="flex-1 text-sm"
            />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowProxySettings(!showProxySettings)}
          className="p-1 md:p-2"
        >
          <Settings size={14} />
        </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
              disabled={!activeTab?.request.url.trim()}
              size="sm"
              className="px-3"
            >
              <Save size={14} />
            </Button>
            
            <Button 
              onClick={handleSendRequest}
              disabled={!activeTab?.request.url.trim() || activeTab?.loading}
              className="px-4 md:px-6"
              size="sm"
            >
              {activeTab?.loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="flex items-center"
                >
                  ⟳
                </motion.div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Send size={14} className="hidden md:block" />
                  <span className="text-xs md:text-sm">Send</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Proxy Settings */}
      {showProxySettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Ai 
            proxyConfig={proxyConfig} 
            onProxyConfigChange={onProxyConfigChange}
          />
        </motion.div>
      )}

      {/* Save Request Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-lg p-6 w-96 max-w-90vw"
              onClick={(e: Event) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Save Request</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Request Name</label>
                  <Input
                    placeholder="Enter request name..."
                    value={requestName}
                    onChange={(e) => setRequestName(e.currentTarget.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Folder (Optional)</label>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-folder">No folder</SelectItem>
                      {folders.map((folder) => {
                        const collection = collections.find(c => c.id === folder.collectionId);
                        return (
                          <SelectItem key={folder.id} value={folder.id}>
                            {collection?.name} / {folder.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                {environments && environments.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Variables available: {environments
                      .flatMap(env => env.variables || [])
                      .filter(v => v.key)
                      .map(v => v.key)
                      .join(', ')}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRequest}
                  disabled={!requestName.trim()}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Fetch;
