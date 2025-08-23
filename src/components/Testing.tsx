import { useState } from 'preact/hooks';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { CodeEditor } from './ui/code-editor';
import { Play, Plus, Trash2, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { TestScript, TestResult, RequestConfig } from '@/lib/types';

interface TestingProps {
  request: RequestConfig;
  testScripts: TestScript[];
  testResults: TestResult[];
  onCreateTest: (script: TestScript) => void;
  onUpdateTest: (script: TestScript) => void;
  onDeleteTest: (id: string) => void;
  onRunTests: (requestId: string) => Promise<void>;
}

function Testing({
  request,
  testScripts,
  testResults,
  onCreateTest,
  onUpdateTest,
  onDeleteTest,
  onRunTests
}: TestingProps) {
  const [activeScript, setActiveScript] = useState<TestScript | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [newTestCode] = useState(`// Example test script
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response has correct content type", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// Access response body
const responseJson = pm.response.json();

pm.test("Response body has required fields", function () {
    pm.expect(responseJson).to.have.property("id");
    pm.expect(responseJson).to.have.property("name");
});`);

  const [preRequestCode] = useState(`// Pre-request script example
// Set dynamic variables
pm.globals.set("timestamp", Date.now());
pm.globals.set("randomId", Math.floor(Math.random() * 1000));

// Log information
console.log("Running pre-request script for:", pm.request.url);

// Set authentication header dynamically
const token = pm.environment.get("authToken");
if (token) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + token
    });
}`);

  const preRequestScripts = testScripts.filter(s => s.type === 'pre-request' && s.requestId === request.id);
  const testScriptsList = testScripts.filter(s => s.type === 'test' && s.requestId === request.id);
  const requestResults = testResults.filter(r => r.requestId === request.id);

  const createNewTest = () => {
    const newScript: TestScript = {
      id: `${request.id}_test_${Date.now()}`,
      name: `Test ${testScriptsList.length + 1}`,
      code: newTestCode,
      type: 'test',
      requestId: request.id,
      createdAt: new Date()
    };
    onCreateTest(newScript);
    setActiveScript(newScript);
  };

  const createPreRequestScript = () => {
    const newScript: TestScript = {
      id: `${request.id}_prereq_${Date.now()}`,
      name: 'Pre-request Script',
      code: preRequestCode,
      type: 'pre-request',
      requestId: request.id,
      createdAt: new Date()
    };
    onCreateTest(newScript);
    setActiveScript(newScript);
  };

  const saveActiveScript = () => {
    if (activeScript) {
      onUpdateTest(activeScript);
      setActiveScript(null);
    }
  };

  const getTestResultIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle size={16} className="text-green-600" />
    ) : (
      <XCircle size={16} className="text-red-600" />
    );
  };

  const getTestSummary = () => {
    if (requestResults.length === 0) return null;
    const passed = requestResults.filter(r => r.passed).length;
    const total = requestResults.length;
    return { passed, total, percentage: Math.round((passed / total) * 100) };
  };

  const toggleResultExpansion = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const formatJsonResponse = (response: any) => {
    try {
      if (typeof response === 'string') {
        return JSON.stringify(JSON.parse(response), null, 2);
      }
      return JSON.stringify(response, null, 2);
    } catch {
      return response;
    }
  };

  const summary = getTestSummary();

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="tests" className="flex-1 flex flex-col">
        <TabsList className="grid  grid-cols-3 mx-2 mt-2">
          <TabsTrigger value="tests" className="text-xs md:text-sm">Tests</TabsTrigger>
          <TabsTrigger value="pre-request" className="text-xs md:text-sm">Pre-request</TabsTrigger>
          <TabsTrigger value="results" className="text-xs md:text-sm">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="flex-1 p-2 md:p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Test Scripts</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={createNewTest}
              >
                <Plus size={14} className="mr-1" />
                New Test
              </Button>
              <Button
                size="sm"
                onClick={() => onRunTests(request.id)}
                disabled={testScriptsList.length === 0}
              >
                <Play size={14} className="mr-1" />
                Run Tests
              </Button>
            </div>
          </div>

          {activeScript && activeScript.type === 'test' ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Test: {activeScript.name}</CardTitle>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={saveActiveScript}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => setActiveScript(null)}>Cancel</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <CodeEditor
                    value={activeScript.code}
                    onChange={(code) => setActiveScript({ ...activeScript, code })}
                    language="javascript"
                    className="h-full" 
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {testScriptsList.map((script) => (
                <Card key={script.id} className="cursor-pointer" onClick={() => setActiveScript(script)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{script.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Created {script.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Test</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTest(script.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {testScriptsList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Play size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No test scripts yet</p>
                  <p className="text-sm">Create tests to validate your API responses</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pre-request" className="flex-1 p-2 md:p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pre-request Scripts</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={createPreRequestScript}
              disabled={preRequestScripts.length > 0}
            >
              <Plus size={14} className="mr-1" />
              New Script
            </Button>
          </div>

          {activeScript && activeScript.type === 'pre-request' ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Pre-request Script</CardTitle>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={saveActiveScript}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => setActiveScript(null)}>Cancel</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <CodeEditor
                    value={activeScript.code}
                    onChange={(code) => setActiveScript({ ...activeScript, code })}
                    language="javascript"
                    className="h-full" 
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {preRequestScripts.map((script) => (
                <Card key={script.id} className="cursor-pointer" onClick={() => setActiveScript(script)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{script.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Created {script.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Pre-request</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTest(script.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {preRequestScripts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No pre-request script yet</p>
                  <p className="text-sm">Add scripts to run before sending requests</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="flex-1 p-2 md:p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="flex items-center space-x-2">
              {requestResults.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (expandedResults.size === requestResults.length) {
                      setExpandedResults(new Set());
                    } else {
                      setExpandedResults(new Set(requestResults.map(r => r.id)));
                    }
                  }}
                >
                  {expandedResults.size === requestResults.length ? 'Collapse All' : 'Expand All'}
                </Button>
              )}
              {summary && (
                <Badge 
                  variant={summary.percentage === 100 ? "default" : summary.percentage > 50 ? "secondary" : "destructive"}
                >
                  {summary.passed}/{summary.total} ({summary.percentage}%)
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {requestResults.map((result) => {
              const isExpanded = expandedResults.has(result.id);
              const resultKey = `${result.id}_${result.timestamp.getTime()}`;
              
              return (
                <Card key={resultKey}>
                  <CardHeader className="pb-2">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleResultExpansion(result.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={16} className="text-muted-foreground" />
                        )}
                        {getTestResultIcon(result.passed)}
                        <h4 className="font-medium text-sm">{result.testName}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {result.duration}ms
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                        {result.response && (
                          <Badge variant="secondary" className="text-xs">
                            {result.response.status}
                          </Badge>
                        )}
                        {(result.response || result.request) && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Details
                          </Badge>
                        )}
                      </div>
                    </div>
                    {result.message && (
                      <p className={`text-xs ml-6 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {result.message}
                      </p>
                    )}
                    
                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        {/* Request Details */}
                        {result.request && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold flex items-center">
                              <Eye size={14} className="mr-1" />
                              Request Details
                            </h5>
                            <div className="bg-muted/30 rounded p-3 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {result.request.method}
                                </Badge>
                                <span className="text-sm font-mono">{result.request.url}</span>
                              </div>
                              {result.request.headers.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium mb-1">Headers:</p>
                                  <div className="space-y-1">
                                    {result.request.headers
                                      .filter(h => h.enabled && h.key && h.value)
                                      .map((header, idx) => (
                                      <div key={idx} className="text-xs font-mono text-muted-foreground">
                                        {header.key}: {header.value}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {result.request.body?.content && (
                                <div>
                                  <p className="text-xs font-medium mb-1">Body:</p>
                                  <div className="max-h-32 overflow-y-auto">
                                    <CodeEditor
                                      value={formatJsonResponse(result.request.body.content)}
                                      language="json"
                                      readOnly={true}
                                      className="h-24"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Response Details */}
                        {result.response && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold flex items-center">
                              <Eye size={14} className="mr-1" />
                              Response Details
                            </h5>
                            <div className="bg-muted/30 rounded p-3 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={result.response.status >= 200 && result.response.status < 300 ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {result.response.status} {result.response.statusText}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.response.time}ms
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(result.response.size / 1024 * 100) / 100} KB
                                </Badge>
                              </div>
                              
                              {/* Response Headers */}
                              {Object.keys(result.response.headers).length > 0 && (
                                <div>
                                  <p className="text-xs font-medium mb-1">Headers:</p>
                                  <div className="max-h-24 overflow-y-auto space-y-1">
                                    {Object.entries(result.response.headers).map(([key, value]) => (
                                      <div key={key} className="text-xs font-mono text-muted-foreground">
                                        {key}: {value}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Response Body */}
                              {result.response.body && (
                                <div>
                                  <p className="text-xs font-medium mb-1">Body:</p>
                                  <div className="max-h-48 overflow-y-auto">
                                    <CodeEditor
                                      value={formatJsonResponse(result.response.body)}
                                      language={result.response.headers['content-type']?.includes('json') ? 'json' : 'text'}
                                      readOnly={true}
                                      className="h-32"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {!result.response && !result.request && (
                          <div className="bg-muted/30 rounded p-3 text-center text-muted-foreground text-sm">
                            No additional details available for this test result
                          </div>
                        )}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              );
            })}

            {requestResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No test results yet</p>
                <p className="text-sm">Run tests to see results here</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Testing;
