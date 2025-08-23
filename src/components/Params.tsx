import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CodeEditor } from './ui/code-editor';
import { Trash2, Plus, Upload, File, X } from 'lucide-react';
import { KeyValue, RequestConfig, AuthConfig, RequestBody } from '@/lib/types';

interface ParamsProps {
  request: RequestConfig;
  onRequestUpdate: (updates: Partial<RequestConfig>) => void;
  onAddKeyValue: (type: 'headers' | 'params') => void;
  onUpdateKeyValue: (type: 'headers' | 'params', id: string, updates: Partial<KeyValue>) => void;
  onRemoveKeyValue: (type: 'headers' | 'params', id: string) => void;
}

// Mover KeyValueEditor fuera del componente principal para evitar re-renders
const KeyValueEditor = ({ 
  items, 
  type, 
  placeholder,
  onUpdateKeyValue,
  onRemoveKeyValue,
  onAddKeyValue
}: { 
  items: KeyValue[]; 
  type: 'headers' | 'params'; 
  placeholder: { key: string; value: string };
  onUpdateKeyValue: (type: 'headers' | 'params', id: string, updates: Partial<KeyValue>) => void;
  onRemoveKeyValue: (type: 'headers' | 'params', id: string) => void;
  onAddKeyValue: (type: 'headers' | 'params') => void;
}) => (
  <div className="space-y-2">
    {items.map((item) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2 p-2 md:p-0"
      >
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Checkbox
            checked={item.enabled}
            onCheckedChange={(enabled: boolean) => 
              onUpdateKeyValue(type, item.id, { enabled: !!enabled })
            }
          />
          <Input
            placeholder={placeholder.key}
            value={item.key}
            onChange={(e) => onUpdateKeyValue(type, item.id, { key: e.currentTarget.value })}
            className="flex-1 md:w-48 text-sm"
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:flex-1">
          <Input
            placeholder={placeholder.value}
            value={item.value}
            onChange={(e) => onUpdateKeyValue(type, item.id, { value: e.currentTarget.value })}
            className="flex-1 text-sm"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveKeyValue(type, item.id)}
            className="text-destructive hover:text-destructive p-2"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </motion.div>
    ))}
    <Button
      variant="outline"
      size="sm"
      onClick={() => onAddKeyValue(type)}
      className="w-full md:w-auto"
    >
      <Plus size={14} className="mr-1" />
      Add {type === 'headers' ? 'Header' : 'Parameter'}
    </Button>
  </div>
);

function Params({ 
  request, 
  onRequestUpdate, 
  onAddKeyValue, 
  onUpdateKeyValue, 
  onRemoveKeyValue 
}: ParamsProps) {
  
  const handleAuthUpdate = (updates: Partial<AuthConfig>) => {
    onRequestUpdate({
      auth: { ...request.auth, ...updates }
    });
  };

  const handleBodyUpdate = (updates: Partial<RequestBody>) => {
    onRequestUpdate({
      body: { ...request.body, ...updates }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="params" className="flex-1 flex flex-col">
        <TabsList className="grid  grid-cols-4 md:mx-4 mt-2">
          <TabsTrigger value="params" className="text-xs md:text-sm">Params</TabsTrigger>
          <TabsTrigger value="headers" className="text-xs md:text-sm">Headers</TabsTrigger>
          <TabsTrigger value="body" className="text-xs md:text-sm">Body</TabsTrigger>
          <TabsTrigger value="auth" className="text-xs md:text-sm">Auth</TabsTrigger>
        </TabsList>
        
        <TabsContent value="params" className="flex-1 mt-2 px-2 md:px-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Query Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <KeyValueEditor
                items={request.params}
                type="params"
                placeholder={{ key: 'Parameter name', value: 'Parameter value' }}
                onUpdateKeyValue={onUpdateKeyValue}
                onRemoveKeyValue={onRemoveKeyValue}
                onAddKeyValue={onAddKeyValue}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="headers" className="flex-1 mt-2 px-2 md:px-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Headers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <KeyValueEditor
                items={request.headers}
                type="headers"
                placeholder={{ key: 'Header name', value: 'Header value' }}
                onUpdateKeyValue={onUpdateKeyValue}
                onRemoveKeyValue={onRemoveKeyValue}
                onAddKeyValue={onAddKeyValue}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="body" className="flex-1 mt-2 px-2 md:px-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Request Body</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={request.body.type} 
                onValueChange={(type: RequestBody['type']) => handleBodyUpdate({ type })}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Body type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="form-data">Form Data</SelectItem>
                </SelectContent>
              </Select>
              
              {(request.body.type === 'text' || request.body.type === 'json') && (
                <div className="space-y-2">
                  <div className="h-40 md:h-64">
                    <CodeEditor
                      value={request.body.content || ''}
                      onChange={(content) => handleBodyUpdate({ content })}
                      language={request.body.type === 'json' ? 'json' : 'text'}
                      placeholder={request.body.type === 'json' ? '{\n  "key": "value",\n  "array": [1, 2, 3],\n  "nested": {\n    "property": "value"\n  }\n}' : 'Enter your text content here...'}
                      className="h-full"
                    />
                  </div>
                </div>
              )}
              
              {request.body.type === 'file' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop files here, or click to select
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.currentTarget.files || []);
                        handleBodyUpdate({ files: [...(request.body.files || []), ...files] });
                      }}
                      className="hidden"
                      id="file-input"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <Upload size={16} className="mr-2" />
                      Select Files
                    </Button>
                  </div>
                  
                  {request.body.files && request.body.files.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Files:</h4>
                      {request.body.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center space-x-2">
                            <File size={16} className="text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFiles = request.body.files?.filter((_, i) => i !== index) || [];
                              handleBodyUpdate({ files: newFiles });
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {request.body.type === 'form-data' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add key-value pairs and files for multipart/form-data
                  </p>
                  
                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Files:</h4>
                    <div className="border border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.currentTarget.files || []);
                          handleBodyUpdate({ files: [...(request.body.files || []), ...files] });
                        }}
                        className="hidden"
                        id="form-file-input"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('form-file-input')?.click()}
                      >
                        <Upload size={14} className="mr-2" />
                        Add Files
                      </Button>
                      
                      {request.body.files && request.body.files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {request.body.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <div className="flex items-center space-x-2">
                                <File size={14} className="text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newFiles = request.body.files?.filter((_, i) => i !== index) || [];
                                  handleBodyUpdate({ files: newFiles });
                                }}
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Form Data Key-Value Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Form Fields:</h4>
                    <KeyValueEditor
                      items={request.body.formData || []}
                      type="params"
                      placeholder={{ key: "Field name", value: "Field value" }}
                      onUpdateKeyValue={(_, id, updates) => {
                        const newFormData = (request.body.formData || []).map(item =>
                          item.id === id ? { ...item, ...updates } : item
                        );
                        handleBodyUpdate({ formData: newFormData });
                      }}
                      onRemoveKeyValue={(_, id) => {
                        const newFormData = (request.body.formData || []).filter(item => item.id !== id);
                        handleBodyUpdate({ formData: newFormData });
                      }}
                      onAddKeyValue={() => {
                        const newField = {
                          id: Math.random().toString(36).substr(2, 9),
                          key: '',
                          value: '',
                          enabled: true
                        };
                        handleBodyUpdate({ formData: [...(request.body.formData || []), newField] });
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="auth" className="flex-1 mt-2 px-2 md:px-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={request.auth.type} 
                onValueChange={(type: AuthConfig['type']) => handleAuthUpdate({ type })}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Auth type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="apikey">API Key</SelectItem>
                </SelectContent>
              </Select>
              
              {request.auth.type === 'basic' && (
                <div className="space-y-3">
                  <Input
                    placeholder="Username"
                    value={request.auth.username || ''}
                    onChange={(e) => handleAuthUpdate({ username: e.currentTarget.value })}
                    className="text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={request.auth.password || ''}
                    onChange={(e) => handleAuthUpdate({ password: e.currentTarget.value })}
                    className="text-sm"
                  />
                </div>
              )}
              
              {request.auth.type === 'bearer' && (
                <Input
                  placeholder="Bearer token"
                  value={request.auth.token || ''}
                  onChange={(e) => handleAuthUpdate({ token: e.currentTarget.value })}
                  className="text-sm"
                />
              )}
              
              {request.auth.type === 'apikey' && (
                <div className="space-y-3">
                  <Input
                    placeholder="API Key"
                    value={request.auth.apiKey || ''}
                    onChange={(e) => handleAuthUpdate({ apiKey: e.currentTarget.value })}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Header name"
                    value={request.auth.apiKeyHeader || ''}
                    onChange={(e) => handleAuthUpdate({ apiKeyHeader: e.currentTarget.value })}
                    className="text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Params;
