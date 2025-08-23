import { useState } from 'preact/hooks';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Fetch from "./components/Fetch";
import Historial from "./components/Historial";
import Params from "./components/Params";
import Response from "./components/Response";
import Collections from "./components/Collections";
import Testing from "./components/Testing";
import { UpdateNotification } from "./components/UpdateNotification";
import { useAppState } from "./lib/hooks";
import { useToast } from "./lib/toast";
import { runTestsForRequest } from "./lib/test-engine";
import { TestResult } from "./lib/types";

function App() {
  const [mobileView, setMobileView] = useState<'collections' | 'params' | 'response' | 'history' | 'tests' | 'examples'>('params');
  
  const {
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
    setActiveEnvironment,
    deleteEnvironment,
    // Testing
    createTestScript,
    updateTestScript,
    addTestResult,
    deleteTestScript
  } = useAppState();

  const { ToastContainer } = useToast();

  const handleLoadFromHistory = (historyItem: any) => {
    // Create a new tab with the historical request
    const newTabId = addTab();
    updateRequest(newTabId, historyItem.request);
    if (historyItem.response) {
      updateTab(newTabId, { 
        response: historyItem.response,
        name: historyItem.request.url.split('/').pop() || 'Request'
      });
    }
  };

  const handleLoadRequest = (request: any) => {
    // Create a new tab with the saved request
    const newTabId = addTab();
    updateRequest(newTabId, request);
    updateTab(newTabId, { 
      name: request.name || request.url.split('/').pop() || 'Request'
    });
  };

  const handleExportCollection = (id: string) => {
    const collection = state.collections.find(c => c.id === id);
    if (!collection) return;

    const collectionFolders = state.folders.filter(f => f.collectionId === id);
    const collectionRequests = state.savedRequests.filter(r => 
      collectionFolders.some(f => f.id === r.folderId)
    );

    const exportData = {
      collection,
      folders: collectionFolders,
      requests: collectionRequests
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCollection = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Create new collection
        const collectionId = createCollection(data.collection.name, data.collection.description);
        
        // Import folders
        const folderMapping: { [oldId: string]: string } = {};
        for (const folder of data.folders) {
          const newFolderId = createFolder(collectionId, folder.name);
          folderMapping[folder.id] = newFolderId;
        }
        
        // Import requests
        for (const request of data.requests) {
          saveRequest(request, folderMapping[request.folderId!]);
        }
      } catch (error) {
        console.error('Failed to import collection:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleRunTests = async (requestId: string) => {
    if (!activeTab) return;
    
    try {
      // Get the current active environment
      const activeEnvironment = state.environments.find(env => env.id === state.activeEnvironmentId);
      
      // Run tests for the request (even if response is undefined or has error status)
      const testResults = await runTestsForRequest(
        requestId,
        activeTab.request,
        activeTab.response, // This might be undefined, but the test engine should handle it
        state.testScripts,
        activeEnvironment
      );
      
      // Add results to state
      for (const result of testResults) {
        addTestResult(result);
      }
      
      console.log('Test results:', testResults);
    } catch (error) {
      console.error('Failed to run tests:', error);
      
      // Even if test execution fails, try to add an error result
      const errorResult: TestResult = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        testName: 'Test Execution Error',
        passed: false,
        message: error instanceof Error ? error.message : 'Failed to execute tests',
        duration: 0,
        timestamp: new Date(),
        requestId: requestId
      };
      
      addTestResult(errorResult);
    }
  };

  if (!activeTab) {
    return <div>Loading...</div>;
  }
  console.log(activeTab.request);
  return (
    <main className="flex flex-col h-screen bg-background max-md:mt-12">
      <Fetch 
        activeTab={activeTab}
        onTabUpdate={updateTab}
        onRequestUpdate={updateRequest}
        onAddTab={addTab}
        onCloseTab={closeTab}
        tabs={state.tabs}
        activeTabId={state.activeTabId}
        onSetActiveTab={setActiveTab}
        proxyConfig={state.proxyConfig}
        onProxyConfigChange={updateProxyConfig}
        onAddToHistory={addToHistory}
        collections={state.collections}
        folders={state.folders}
        onSaveRequest={saveRequest}
        environments={state.environments}
        activeEnvironment={state.environments.find(env => env.id === state.activeEnvironmentId)}
      />
      
      {/* Desktop Layout */}
      <div className="min-md:hidden min-lg:block hidden flex-1">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 rounded-lg border md:min-w-[450px]"
        >
          <ResizablePanel defaultSize={20} minSize={15}>
            <Collections 
              collections={state.collections}
              folders={state.folders}
              savedRequests={state.savedRequests}
              environments={state.environments}
              activeEnvironmentId={state.activeEnvironmentId}
              onCreateCollection={createCollection}
              onCreateFolder={createFolder}
              onLoadRequest={handleLoadRequest}
              onCreateEnvironment={createEnvironment}
              onSetActiveEnvironment={setActiveEnvironment}
              onDeleteCollection={deleteCollection}
              onDeleteFolder={deleteFolder}
              onDeleteRequest={deleteRequest}
              onDeleteEnvironment={deleteEnvironment}
              onExportCollection={handleExportCollection}
              onImportCollection={handleImportCollection}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={20} minSize={15}>
            <Historial 
              history={state.history}
              onClearHistory={clearHistory}
              onLoadFromHistory={handleLoadFromHistory}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={30} minSize={20}>
            <Tabs defaultValue="params" className="h-full flex flex-col">
              <TabsList className="grid  grid-cols-2 mx-2 mt-2">
                <TabsTrigger value="params" className="text-xs">Params</TabsTrigger>
                <TabsTrigger value="tests" className="text-xs">Tests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="params" className="flex-1">
                <Params 
                  request={activeTab.request}
                  onRequestUpdate={(updates) => updateRequest(activeTab.id, updates)}
                  onAddKeyValue={(type) => addKeyValue(activeTab.id, type)}
                  onUpdateKeyValue={(type, id, updates) => updateKeyValue(activeTab.id, type, id, updates)}
                  onRemoveKeyValue={(type, id) => removeKeyValue(activeTab.id, type, id)}
                />
              </TabsContent>
              
              <TabsContent value="tests" className="flex-1">
                <Testing 
                  request={activeTab.request}
                  testScripts={state.testScripts}
                  testResults={state.testResults}
                  onCreateTest={createTestScript}
                  onUpdateTest={updateTestScript}
                  onDeleteTest={deleteTestScript}
                  onRunTests={handleRunTests}
                />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={30} minSize={25}>
            <Response 
              response={activeTab.response}
              request={activeTab.request}
              loading={activeTab.loading}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Layout */}
      <div className="flex-1 min-lg:hidden max-md:block">
        <Tabs value={mobileView} onValueChange={(value: string) => setMobileView(value as 'collections' | 'params' | 'response' | 'history' | 'tests' | 'examples')} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-6 mx-2 mt-2">
            <TabsTrigger value="collections" className="text-xs">Collections</TabsTrigger>
            <TabsTrigger value="examples" className="text-xs">Examples</TabsTrigger>
            <TabsTrigger value="params" className="text-xs">Config</TabsTrigger>
            <TabsTrigger value="response" className="text-xs">Response</TabsTrigger>
            <TabsTrigger value="tests" className="text-xs">Tests</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="collections" className="flex-1 mt-2">
            <Collections 
              collections={state.collections}
              folders={state.folders}
              savedRequests={state.savedRequests}
              environments={state.environments}
              activeEnvironmentId={state.activeEnvironmentId}
              onCreateCollection={createCollection}
              onCreateFolder={createFolder}
              onLoadRequest={handleLoadRequest}
              onCreateEnvironment={createEnvironment}
              onSetActiveEnvironment={setActiveEnvironment}
              onDeleteCollection={deleteCollection}
              onDeleteFolder={deleteFolder}
              onDeleteRequest={deleteRequest}
              onDeleteEnvironment={deleteEnvironment}
              onExportCollection={handleExportCollection}
              onImportCollection={handleImportCollection}
            />
          </TabsContent>
          
          <TabsContent value="examples" className="flex-1 mt-2">
            <Collections 
              collections={state.collections}
              folders={state.folders}
              savedRequests={state.savedRequests}
              environments={state.environments}
              activeEnvironmentId={state.activeEnvironmentId}
              onCreateCollection={createCollection}
              onCreateFolder={createFolder}
              onLoadRequest={handleLoadRequest}
              onCreateEnvironment={createEnvironment}
              onSetActiveEnvironment={setActiveEnvironment}
              onDeleteCollection={deleteCollection}
              onDeleteFolder={deleteFolder}
              onDeleteRequest={deleteRequest}
              onDeleteEnvironment={deleteEnvironment}
              onExportCollection={handleExportCollection}
              onImportCollection={handleImportCollection}
            />
          </TabsContent>
          
          <TabsContent value="params" className="flex-1 mt-2">
            <Params 
              request={activeTab.request}
              onRequestUpdate={(updates) => updateRequest(activeTab.id, updates)}
              onAddKeyValue={(type) => addKeyValue(activeTab.id, type)}
              onUpdateKeyValue={(type, id, updates) => updateKeyValue(activeTab.id, type, id, updates)}
              onRemoveKeyValue={(type, id) => removeKeyValue(activeTab.id, type, id)}
            />
          </TabsContent>
          
          <TabsContent value="response" className="flex-1 mt-2">
            <Response 
              response={activeTab.response}
              request={activeTab.request}
              loading={activeTab.loading}
            />
          </TabsContent>
          
          <TabsContent value="tests" className="flex-1 mt-2">
            <Testing 
              request={activeTab.request}
              testScripts={state.testScripts}
              testResults={state.testResults}
              onCreateTest={createTestScript}
              onUpdateTest={updateTestScript}
              onDeleteTest={deleteTestScript}
              onRunTests={handleRunTests}
            />
          </TabsContent>
          
          <TabsContent value="history" className="flex-1 mt-2">
            <Historial 
              history={state.history}
              onClearHistory={clearHistory}
              onLoadFromHistory={handleLoadFromHistory}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <ToastContainer />
      <UpdateNotification />
    </main>
  );
}

export default App;
