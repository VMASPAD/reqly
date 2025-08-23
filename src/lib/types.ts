// Tipos para la aplicación Reqly

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | string;

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'apikey';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
}

export interface ProxyConfig {
  enabled: boolean;
  url?: string;
  userProvided: boolean;
}

export interface RequestBody {
  type: 'none' | 'text' | 'json' | 'file' | 'form-data';
  content?: string;
  files?: File[];
  formData?: KeyValue[];
}

export interface RequestConfig {
  id: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body: RequestBody;
  auth: AuthConfig;
  proxy: ProxyConfig;
  name?: string;
  description?: string;
  folderId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  collectionId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValue[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TestScript {
  id: string;
  name: string;
  code: string;
  type: 'pre-request' | 'test';
  requestId?: string;
  collectionId?: string;
  createdAt: Date;
}

export interface TestResult {
  id: string;
  testName: string;
  passed: boolean;
  message?: string;
  duration: number;
  timestamp: Date;
  requestId: string;
  response?: ResponseData;
  request?: RequestConfig;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export interface RequestResponse {
  request: RequestConfig;
  response?: ResponseData;
  error?: string;
  timestamp: Date;
}

export interface TabState {
  id: string;
  name: string;
  request: RequestConfig;
  response?: ResponseData;
  loading: boolean;
  saved: boolean;
}

export interface AppState {
  tabs: TabState[];
  activeTabId: string;
  history: RequestResponse[];
  proxyConfig: ProxyConfig;
  collections: Collection[];
  folders: Folder[];
  savedRequests: RequestConfig[];
  environments: Environment[];
  activeEnvironmentId?: string;
  testScripts: TestScript[];
  testResults: TestResult[];
}
