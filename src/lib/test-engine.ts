// Test execution engine for running test scripts
import { TestScript, TestResult, RequestConfig, ResponseData, Environment } from './types';

interface PMObject {
  test: (name: string, fn: () => void) => void;
  response: {
    to: {
      have: {
        status: (code: number) => void;
        header: (key: string, value?: string) => void;
      };
    };
    json: () => any;
    text: () => string;
    headers: Map<string, string>;
    status: number;
    statusText: string;
    responseTime: number;
  };
  expect: (value: any) => ExpectObject;
  environment: {
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => void;
  };
  globals: {
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => void;
  };
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
  };
}

interface ExpectObject {
  to: {
    be: {
      below: (value: number) => void;
      above: (value: number) => void;
      equal: (value: any) => void;
    };
    have: {
      property: (key: string) => void;
    };
    include: (value: string) => void;
  };
}

export class TestEngine {
  private testResults: TestResult[] = [];
  private environment: Environment | undefined;
  private globalVariables: Record<string, string> = {};
  private currentRequest: RequestConfig | undefined;
  private currentResponse: ResponseData | undefined;
  private currentRequestId: string = '';

  constructor(environment?: Environment) {
    this.environment = environment;
  }

  setRequest(request: RequestConfig) {
    this.currentRequest = request;
  }

  setRequestId(requestId: string) {
    this.currentRequestId = requestId;
  }

  setResponse(response: ResponseData | undefined) {
    this.currentResponse = response;
  }

  private createPMObject(): PMObject {
    const testResults = this.testResults;
    const currentRequest = this.currentRequest;
    const currentResponse = this.currentResponse;
    const environment = this.environment;
    const globalVariables = this.globalVariables;

    return {
      test: (name: string, fn: () => void) => {
        const startTime = Date.now();
        try {
          fn();
          const duration = Date.now() - startTime;
          testResults.push({
            id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            testName: name,
            passed: true,
            duration,
            timestamp: new Date(),
            requestId: this.currentRequestId
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          testResults.push({
            id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            testName: name,
            passed: false,
            message: error instanceof Error ? error.message : 'Test failed',
            duration,
            timestamp: new Date(),
            requestId: this.currentRequestId
          });
        }
      },

      response: {
        to: {
          have: {
            status: (code: number) => {
              if (!currentResponse) {
                throw new Error(`No response available to check status`);
              }
              if (currentResponse.status !== code) {
                throw new Error(`Expected status ${code}, got ${currentResponse.status}`);
              }
            },
            header: (key: string, value?: string) => {
              if (!currentResponse) {
                throw new Error(`No response available to check headers`);
              }
              const headerValue = currentResponse.headers[key.toLowerCase()];
              if (!headerValue) {
                throw new Error(`Header '${key}' not found`);
              }
              if (value !== undefined && headerValue !== value) {
                throw new Error(`Header '${key}' expected '${value}', got '${headerValue}'`);
              }
            }
          }
        },
        json: () => {
          if (!currentResponse) {
            throw new Error(`No response available to parse as JSON`);
          }
          try {
            return JSON.parse(currentResponse.body || '{}');
          } catch {
            throw new Error('Response body is not valid JSON');
          }
        },
        text: () => currentResponse?.body || '',
        headers: new Map(Object.entries(currentResponse?.headers || {})),
        status: currentResponse?.status || 0,
        statusText: currentResponse?.statusText || '',
        responseTime: currentResponse?.time || 0
      },

      expect: (value: any) => ({
        to: {
          be: {
            below: (threshold: number) => {
              if (typeof value !== 'number' || value >= threshold) {
                throw new Error(`Expected ${value} to be below ${threshold}`);
              }
            },
            above: (threshold: number) => {
              if (typeof value !== 'number' || value <= threshold) {
                throw new Error(`Expected ${value} to be above ${threshold}`);
              }
            },
            equal: (expected: any) => {
              if (value !== expected) {
                throw new Error(`Expected ${value} to equal ${expected}`);
              }
            }
          },
          have: {
            property: (key: string) => {
              if (typeof value !== 'object' || value === null || !(key in value)) {
                throw new Error(`Expected object to have property '${key}'`);
              }
            }
          },
          include: (substring: string) => {
            if (typeof value !== 'string' || !value.includes(substring)) {
              throw new Error(`Expected '${value}' to include '${substring}'`);
            }
          }
        }
      }),

      environment: {
        get: (key: string) => {
          const variable = environment?.variables.find(v => v.key === key && v.enabled);
          return variable?.value;
        },
        set: (key: string, value: string) => {
          // This would update the environment in a real implementation
          console.log(`Environment variable set: ${key} = ${value}`);
        }
      },

      globals: {
        get: (key: string) => globalVariables[key],
        set: (key: string, value: string) => {
          globalVariables[key] = value;
        }
      },

      request: {
        url: currentRequest?.url || '',
        method: currentRequest?.method || 'GET',
        headers: currentRequest?.headers.reduce((acc, h) => {
          if (h.enabled && h.key) {
            acc[h.key] = h.value;
          }
          return acc;
        }, {} as Record<string, string>) || {}
      }
    };
  }

  async executeScript(script: TestScript): Promise<TestResult[]> {
    this.testResults = [];
    
    try {
      // Create PM object
      const pm = this.createPMObject();
      
      // Make pm available globally for the script
      (globalThis as any).pm = pm;
      
      // Execute the script
      const scriptFunction = new Function('pm', script.code);
      await scriptFunction(pm);
      
      return this.testResults;
    } catch (error) {
      // If there's a general execution error, create a failed test result
      const errorResult: TestResult = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        testName: 'Script Execution',
        passed: false,
        message: error instanceof Error ? error.message : 'Script execution failed',
        duration: 0,
        timestamp: new Date(),
        requestId: this.currentRequestId
      };
      
      return [errorResult];
    } finally {
      // Clean up global pm object
      delete (globalThis as any).pm;
    }
  }

  async executePreRequestScript(script: TestScript, request: RequestConfig): Promise<RequestConfig> {
    try {
      const pm = this.createPMObject();
      
      // Create a mutable copy of the request
      let modifiedRequest = { ...request };
      
      // Extend pm object for pre-request scripts
      const preRequestPM = {
        ...pm,
        request: {
          ...pm.request,
          headers: {
            add: (header: { key: string; value: string }) => {
              modifiedRequest.headers = [
                ...modifiedRequest.headers,
                { id: `header_${Date.now()}`, key: header.key, value: header.value, enabled: true }
              ];
            },
            upsert: (header: { key: string; value: string }) => {
              const existingIndex = modifiedRequest.headers.findIndex(h => h.key === header.key);
              if (existingIndex >= 0) {
                modifiedRequest.headers[existingIndex].value = header.value;
              } else {
                modifiedRequest.headers.push({
                  id: `header_${Date.now()}`,
                  key: header.key,
                  value: header.value,
                  enabled: true
                });
              }
            }
          }
        }
      };
      
      (globalThis as any).pm = preRequestPM;
      
      const scriptFunction = new Function('pm', script.code);
      await scriptFunction(preRequestPM);
      
      return modifiedRequest;
    } catch (error) {
      console.error('Pre-request script error:', error);
      return request; // Return original request if script fails
    } finally {
      delete (globalThis as any).pm;
    }
  }
}

export async function runTestsForRequest(
  requestId: string,
  request: RequestConfig,
  response: ResponseData | undefined,
  testScripts: TestScript[],
  environment?: Environment
): Promise<TestResult[]> {
  const engine = new TestEngine(environment);
  engine.setRequest(request);
  engine.setRequestId(requestId);
  
  // Always set the response, even if it's undefined
  engine.setResponse(response);
  
  const relevantScripts = testScripts.filter(
    script => script.type === 'test' && script.requestId === requestId
  );
  
  // If no response and no test scripts, return empty results
  if (!response && relevantScripts.length === 0) {
    return [];
  }
  
  const allResults: TestResult[] = [];
  
  for (const script of relevantScripts) {
    const results = await engine.executeScript(script);
    allResults.push(...results.map(result => ({
      ...result,
      requestId: requestId,
      scriptId: script.id,
      response: response,
      request: request
    } as TestResult & { scriptId: string })));
  }
  
  return allResults;
}

export async function runPreRequestScripts(
  requestId: string,
  request: RequestConfig,
  testScripts: TestScript[],
  environment?: Environment
): Promise<RequestConfig> {
  const engine = new TestEngine(environment);
  
  const preRequestScripts = testScripts.filter(
    script => script.type === 'pre-request' && script.requestId === requestId
  );
  
  let modifiedRequest = request;
  
  for (const script of preRequestScripts) {
    modifiedRequest = await engine.executePreRequestScript(script, modifiedRequest);
  }
  
  return modifiedRequest;
}
