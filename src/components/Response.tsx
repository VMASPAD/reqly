import { useState, useRef } from 'preact/hooks';
import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CodeEditor } from './ui/code-editor';
import { Copy, Eye, FileText, Search, Command } from 'lucide-react';
import { ResponseData, RequestConfig } from '@/lib/types';
import { toast } from 'sonner';

interface ResponseProps {
  response?: ResponseData;
  request?: RequestConfig;
  loading: boolean;
}

function Response({ response, request, loading }: ResponseProps) {
  const [activeView, setActiveView] = useState<'pretty' | 'raw'>('pretty');
  const editorRef = useRef<any>(null);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) { toast.success('Success'); return 'bg-green-500'; }
    if (status >= 300 && status < 400) { toast.dismiss('Fetch 300 Redirect'); return 'bg-yellow-500'; }
    if (status >= 400 && status < 500) { toast.error('Fetch 400 Client Error'); return 'bg-orange-500'; }
    if (status >= 1000) { toast.info('Fetch 1000 Informational'); return 'bg-sky-500'; }
    if (status >= 500) { toast.caller('Fetch 500 Server Error'); return 'bg-red-500'; }
    return 'bg-gray-500';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSearchCommand = () => {
    // Si hay un editor de Monaco activo, usar su función de búsqueda
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'actions.find', null);
    } else {
      // Fallback: simular Ctrl+F para búsqueda del navegador
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    }
  };

  const handleCommandPalette = () => {
    // Si hay un editor de Monaco activo, usar su paleta de comandos
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.quickCommand', null);
    } else {
      // Fallback: simular Ctrl+Shift+P
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    }
  };

  const renderPrettyContent = () => {
    if (!response || !response.body) return <div className="p-4 text-muted-foreground">No content to display</div>;
    
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
    
    // HTML Preview
    if (contentType.includes('text/html')) {
      return (
        <iframe
          srcDoc={response.body}
          className="w-full h-64 md:h-full border-0 bg-white rounded"
          title="HTML Preview"
          sandbox="allow-same-origin"
        />
      );
    }
    
    // JSON Pretty Print
    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(response.body);
        const formattedJson = JSON.stringify(parsed, null, 2);
        return (
          <div className="h-[43rem] overflow-hidden">
            <CodeEditor
              value={formattedJson}
              language="json"
              readOnly={true}
              className="h-full"
              onEditorMount={(editor) => {
                editorRef.current = editor;
              }}
            />
          </div>
        );
      } catch {
        return (
          <div className="h-full overflow-auto">
            <pre className="text-sm font-mono p-4 whitespace-pre-wrap">
              {response.body}
            </pre>
          </div>
        );
      }
    }
    
    // XML Pretty Print
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      return (
        <div className="h-full overflow-hidden">
          <CodeEditor
            value={response.body}
            language="text"
            readOnly={true}
            className="h-full"
            onEditorMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>
      );
    }
    
    // Image Preview
    if (contentType.includes('image/')) {
      console.log(response.body)
      // Usar directamente la URL de la petición para mostrar la imagen
      // Esto funciona mejor que intentar procesar el blob
      return (
        <div className="h-full flex items-center justify-center p-4 bg-checkerboard">
          <img 
            src={response.body} // response.body contiene la URL original
            alt="Response content" 
            className="max-w-full max-h-full object-contain shadow-lg"
            crossOrigin="anonymous"
            onError={(e) => {
              console.log('Error loading image from URL:', response.body);
              // Si falla la carga, mostrar mensaje de error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="text-center text-muted-foreground">
                  <p>Unable to display image</p>
                  <p class="text-sm mt-2">URL: ${response.body}</p>
                  <p class="text-xs mt-1">This might be due to CORS restrictions</p>
                </div>
              `;
            }}
          />
        </div>
      );
    }
    
    // Default text content
    return (
      <div className="h-full overflow-hidden">
        <CodeEditor
          value={response.body}
          language="text"
          readOnly={true}
          className="h-full"
          onEditorMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    );
  };

  const renderRawContent = () => {
    if (!response) return <div className="p-4 text-muted-foreground">No content to display</div>;
    
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
    
    // Para imágenes, mostrar la información de la petición y headers
    if (contentType.includes('image/')) {
      const rawResponse = `HTTP/1.1 ${response.status} ${response.statusText}\n${Object.entries(response.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')}\n\n[Image Content]\nImage URL: ${response.body}\nContent-Type: ${contentType}`;
      
      return (
        <div className="h-full overflow-hidden">
          <CodeEditor
            value={rawResponse}
            language="text"
            readOnly={true}
            className="h-full"
          />
        </div>
      );
    }
    
    // Para otros tipos, mostrar el contenido completo
    const rawResponse = `HTTP/1.1 ${response.status} ${response.statusText}\n${Object.entries(response.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')}\n\n${response.body}`;
    
    return (
      <div className="h-full overflow-hidden">
        <CodeEditor
          value={rawResponse}
          language="text"
          readOnly={true}
          className="h-full"
          onEditorMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-2xl"
        >
          ⟳
        </motion.div>
        <span className="ml-2 text-muted-foreground">Sending request...</span>
      </div>
    );
  }

  // Mostrar mensaje solo si realmente no hay respuesta (null/undefined)
  // pero siempre renderizar la respuesta del servidor, incluso si es un error
  if (!response && !loading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No response yet</p>
          <p className="text-sm">Send a request to see the response here</p>
          <p className="text-xs mt-2 opacity-70">
            Server responses (including errors) will be displayed here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col ">
      {/* Response Status Bar */}
      <div className="border-b bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${response ? getStatusColor(response.status) : 'bg-gray-500'}`} />
              <span className="font-mono text-sm font-medium">
                {response ? `${response.status} ${response.statusText}` : 'No Status'}
              </span>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {response ? `${response.time}ms` : '0ms'}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              {response ? formatBytes(response.size) : '0 B'}
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchCommand}
              className="w-full md:w-auto"
              title="Search in response content (Ctrl+F)"
            >
              <Search size={14} className="mr-1" />
              <span className="text-xs md:text-sm">Search</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCommandPalette}
              className="w-full md:w-auto"
              title="Open command palette (Ctrl+Shift+P)"
            >
              <Command size={14} className="mr-1" />
              <span className="text-xs md:text-sm">Commands</span>
            </Button>
            <Button
              variant={activeView === 'pretty' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('pretty')}
              className="w-full md:w-auto"
            >
              <Eye size={14} className="mr-1" />
              <span className="text-xs md:text-sm">Preview</span>
            </Button>
            <Button
              variant={activeView === 'raw' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('raw')}
              className="w-full md:w-auto"
            >
              <FileText size={14} className="mr-1" />
              <span className="text-xs md:text-sm">Raw</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Response Content */}
      <div className="flex-1">
        <Tabs defaultValue="body" className="h-full flex flex-col p-2 md:p-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="body" className="text-xs md:text-sm">Response</TabsTrigger>
            <TabsTrigger value="headers" className="text-xs md:text-sm">Headers</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs md:text-sm">Request</TabsTrigger>
          </TabsList>
          
          <TabsContent value="body" className="flex-1 p-2 md:p-4">
            <Card className="h-full">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
                <CardTitle className="text-base md:text-lg">
                  {activeView === 'pretty' ? 'Response Preview' : 'Raw Response'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    response ? (
                      activeView === 'pretty' 
                        ? response.body || ''
                        : `HTTP/1.1 ${response.status} ${response.statusText}\n${Object.entries(response.headers)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('\n')}\n\n${response.body}`
                    ) : 'No response content'
                  )}
                >
                  <Copy size={14} />
                  Copy
                </Button>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                {activeView === 'pretty' ? renderPrettyContent() : renderRawContent()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="headers" className="flex-1 p-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Response Headers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {response && response.headers ? Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex items-start space-x-4 py-2 border-b">
                      <span className="font-medium text-sm min-w-0 flex-1">{key}:</span>
                      <span className="text-sm text-muted-foreground min-w-0 flex-2 font-mono">
                        {value}
                      </span>
                    </div>
                  )) : (
                    <div className="text-muted-foreground p-4 text-center">
                      No headers available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 p-4">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Request Preview</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(request, null, 2))}
                >
                  <Copy size={14} />
                  Copy
                </Button>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <CodeEditor
                  value={JSON.stringify(request, null, 2)}
                  language="json"
                  readOnly={true}
                  className="h-full"
                  onEditorMount={(editor) => {
                    editorRef.current = editor;
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Response;
