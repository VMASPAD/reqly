import { useState } from 'preact/hooks';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { CodeEditor } from './ui/code-editor';
import { Play, Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
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
                    language="text"
                    className="h-full"
                    placeholder="// Write your test code here"
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
                    language="text"
                    className="h-full"
                    placeholder="// Write your pre-request code here"
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
            {summary && (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={summary.percentage === 100 ? "default" : summary.percentage > 50 ? "secondary" : "destructive"}
                >
                  {summary.passed}/{summary.total} ({summary.percentage}%)
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {requestResults.map((result) => (
              <Card key={`${result.id}_${result.timestamp.getTime()}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
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
                    </div>
                  </div>
                  {result.message && (
                    <p className={`text-xs ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {result.message}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}

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
