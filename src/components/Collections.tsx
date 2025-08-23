import { useState } from 'preact/hooks';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Folder, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Settings,
  Download,
  Copy,
  Code
} from 'lucide-react';
import { Collection, Folder as FolderType, RequestConfig, Environment } from '@/lib/types';

interface CollectionsProps {
  collections: Collection[];
  folders: FolderType[];
  savedRequests: RequestConfig[];
  environments: Environment[];
  activeEnvironmentId?: string;
  onCreateCollection: (name: string, description?: string) => void;
  onCreateFolder: (collectionId: string, name: string) => void;
  onLoadRequest: (request: RequestConfig) => void;
  onCreateEnvironment: (name: string) => void;
  onSetActiveEnvironment: (id: string) => void;
  onDeleteCollection: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteEnvironment: (id: string) => void;
  onExportCollection: (id: string) => void;
  onImportCollection: (file: File) => void;
}

function Collections({
  collections,
  folders,
  savedRequests,
  environments,
  activeEnvironmentId,
  onCreateCollection,
  onCreateFolder,
  onLoadRequest,
  onCreateEnvironment,
  onSetActiveEnvironment,
  onDeleteCollection,
  onDeleteFolder,
  onDeleteRequest,
  onDeleteEnvironment,
  onExportCollection,
  onImportCollection
}: CollectionsProps) {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showNewEnvironment, setShowNewEnvironment] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [newEnvironmentName, setNewEnvironmentName] = useState('');

  const toggleCollection = (id: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCollections(newExpanded);
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim(), newCollectionDescription.trim() || undefined);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowNewCollection(false);
    }
  };

  const handleCreateEnvironment = () => {
    if (newEnvironmentName.trim()) {
      onCreateEnvironment(newEnvironmentName.trim());
      setNewEnvironmentName('');
      setShowNewEnvironment(false);
    }
  };

  const getRequestsInFolder = (folderId: string) => {
    return savedRequests.filter(req => req.folderId === folderId);
  };

  const getRequestsInCollection = (collectionId: string) => {
    return savedRequests.filter(req => {
      const folder = folders.find(f => f.id === req.folderId);
      return folder?.collectionId === collectionId;
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-600';
      case 'POST': return 'text-blue-600';
      case 'PUT': return 'text-orange-600';
      case 'DELETE': return 'text-red-600';
      case 'PATCH': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="collections" className="flex-1 flex flex-col">
        <TabsList className="grid  grid-cols-3 mx-2 mt-2">
          <TabsTrigger value="collections" className="text-xs md:text-sm">Collections</TabsTrigger>
          <TabsTrigger value="environments" className="text-xs md:text-sm">Environments</TabsTrigger>
          <TabsTrigger value="examples" className="text-xs md:text-sm">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="flex-1 p-2 md:p-4 space-y-4">
          {/* Create Collection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Collections</h3>
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) {
                      onImportCollection(file);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="hidden"
                  id="import-collection"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-collection')?.click()}
                >
                  <Download size={14} className="mr-1" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCollection(!showNewCollection)}
                >
                  <Plus size={14} className="mr-1" />
                  New
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showNewCollection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 p-3 bg-muted/30 rounded-md"
                >
                  <Input
                    placeholder="Collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleCreateCollection}>
                      Create
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewCollection(false)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collections List */}
          <div className="space-y-2 flex-1 overflow-auto">
            {collections.map((collection) => {
              const collectionFolders = folders.filter(f => f.collectionId === collection.id);
              const collectionRequests = getRequestsInCollection(collection.id);
              const isExpanded = expandedCollections.has(collection.id);

              return (
                <Card key={collection.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                        onClick={() => toggleCollection(collection.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <Folder size={16} className="text-blue-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{collection.name}</h4>
                          {collection.description && (
                            <p className="text-xs text-muted-foreground">{collection.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {collectionRequests.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCreateFolder(collection.id, `New Folder`)}
                        >
                          <Plus size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onExportCollection(collection.id)}
                        >
                          <Download size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteCollection(collection.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <CardContent className="pt-0 space-y-2">
                          {collectionFolders.map((folder) => {
                            const folderRequests = getRequestsInFolder(folder.id);
                            return (
                              <div key={folder.id} className="ml-4 space-y-1">
                                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                  <div className="flex items-center space-x-2">
                                    <Folder size={14} className="text-gray-600" />
                                    <span className="text-sm font-medium">{folder.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {folderRequests.length}
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDeleteFolder(folder.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                                
                                {folderRequests.map((request) => (
                                  <div 
                                    key={request.id}
                                    className="ml-6 flex items-center justify-between p-2 hover:bg-muted/30 rounded cursor-pointer"
                                    onClick={() => onLoadRequest(request)}
                                  >
                                    <div className="flex items-center space-x-2 flex-1">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${getMethodColor(request.method)}`}
                                      >
                                        {request.method}
                                      </Badge>
                                      <span className="text-sm truncate">{request.name || request.url}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // TODO: Duplicate request
                                        }}
                                      >
                                        <Copy size={12} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteRequest(request.id);
                                        }}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 size={12} />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}

            {collections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Folder size={48} className="mx-auto mb-4 opacity-50" />
                <p>No collections yet</p>
                <p className="text-sm">Create your first collection to organize requests</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="environments" className="flex-1 p-2 md:p-4 space-y-4">
          {/* Create Environment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Environments</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewEnvironment(!showNewEnvironment)}
              >
                <Plus size={14} className="mr-1" />
                New
              </Button>
            </div>

            <AnimatePresence>
              {showNewEnvironment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 p-3 bg-muted/30 rounded-md"
                >
                  <Input
                    placeholder="Environment name"
                    value={newEnvironmentName}
                    onChange={(e) => setNewEnvironmentName(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateEnvironment()}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleCreateEnvironment}>
                      Create
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewEnvironment(false)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Environments List */}
          <div className="space-y-2 flex-1 overflow-auto">
            {environments.map((env) => (
              <Card 
                key={env.id} 
                className={`cursor-pointer transition-colors ${
                  env.id === activeEnvironmentId ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSetActiveEnvironment(env.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings size={16} className="text-green-600" />
                      <div>
                        <h4 className="font-medium text-sm">{env.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {(env.variables || []).length} variables
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {env.id === activeEnvironmentId && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEnvironment(env.id);
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

            {environments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Settings size={48} className="mx-auto mb-4 opacity-50" />
                <p>No environments yet</p>
                <p className="text-sm">Create environments to manage variables</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="examples" className="flex-1 p-2 md:p-4 space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Example APIs</h3>
            <p className="text-sm text-muted-foreground">
              Try these popular public APIs for testing and learning
            </p>

            {/* JSONPlaceholder Examples */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Code size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">JSONPlaceholder</h4>
                    <p className="text-xs text-muted-foreground">Free fake REST API for testing</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts', name: 'Get all posts' },
                  { method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1', name: 'Get post by ID' },
                  { method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1/comments', name: 'Get post comments' },
                  { method: 'GET', url: 'https://jsonplaceholder.typicode.com/users', name: 'Get all users' },
                  { method: 'GET', url: 'https://jsonplaceholder.typicode.com/albums', name: 'Get all albums' },
                  { method: 'GET', url: 'https://jsonplaceholder.typicode.com/photos', name: 'Get all photos' },
                  { method: 'GET', url: 'https://jsonplaceholder.typicode.com/todos', name: 'Get all todos' },
                  { method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts', name: 'Create new post' },
                  { method: 'PUT', url: 'https://jsonplaceholder.typicode.com/posts/1', name: 'Update post' },
                  { method: 'DELETE', url: 'https://jsonplaceholder.typicode.com/posts/1', name: 'Delete post' },
                ].map((example, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-muted/30 rounded cursor-pointer"
                    onClick={() => {
                      const exampleRequest: RequestConfig = {
                        id: `example_${Date.now()}_${index}`,
                        method: example.method,
                        url: example.url,
                        name: example.name,
                        headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }],
                        params: [],
                        body: {
                          type: 'json',
                          content: example.method === 'POST' ? JSON.stringify({
                            title: 'foo',
                            body: 'bar',
                            userId: 1
                          }, null, 2) : undefined,
                          files: [],
                          formData: []
                        },
                        auth: { type: 'none' },
                        proxy: { enabled: false, userProvided: false },
                        createdAt: new Date()
                      };
                      onLoadRequest(exampleRequest);
                    }}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getMethodColor(example.method)}`}
                      >
                        {example.method}
                      </Badge>
                      <span className="text-sm">{example.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {example.url}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Placehold.co Examples */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Code size={16} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Placehold.co</h4>
                    <p className="text-xs text-muted-foreground">Fast and free placeholder images</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { method: 'GET', url: 'https://placehold.co/600x400', name: 'Basic placeholder 600x400' },
                  { method: 'GET', url: 'https://placehold.co/400', name: 'Square placeholder 400x400' },
                  { method: 'GET', url: 'https://placehold.co/600x400/png', name: 'PNG format placeholder' },
                  { method: 'GET', url: 'https://placehold.co/600x400/000000/FFFFFF', name: 'Black background, white text' },
                  { method: 'GET', url: 'https://placehold.co/600x400/orange/white', name: 'Orange background, white text' },
                  { method: 'GET', url: 'https://placehold.co/600x400?text=Hello+World', name: 'Custom text placeholder' },
                  { method: 'GET', url: 'https://placehold.co/600x400?font=roboto&text=Roboto+Font', name: 'Custom font placeholder' },
                  { method: 'GET', url: 'https://placehold.co/600x400@2x.png', name: 'Retina 2x placeholder' },
                ].map((example, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-muted/30 rounded cursor-pointer"
                    onClick={() => {
                      const exampleRequest: RequestConfig = {
                        id: `example_${Date.now()}_${index}`,
                        method: example.method,
                        url: example.url,
                        name: example.name,
                        headers: [],
                        params: [],
                        body: {
                          type: 'none',
                          files: [],
                          formData: []
                        },
                        auth: { type: 'none' },
                        proxy: { enabled: false, userProvided: false },
                        createdAt: new Date()
                      };
                      onLoadRequest(exampleRequest);
                    }}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getMethodColor(example.method)}`}
                      >
                        {example.method}
                      </Badge>
                      <span className="text-sm">{example.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {example.url}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional APIs Section */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Code size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">More Examples</h4>
                    <p className="text-xs text-muted-foreground">Other useful testing APIs</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { method: 'GET', url: 'https://httpbin.org/get', name: 'HTTPBin - Test GET request' },
                  { method: 'POST', url: 'https://httpbin.org/post', name: 'HTTPBin - Test POST request' },
                  { method: 'GET', url: 'https://httpbin.org/status/200', name: 'HTTPBin - Status 200' },
                  { method: 'GET', url: 'https://httpbin.org/delay/2', name: 'HTTPBin - 2 second delay' },
                  { method: 'GET', url: 'https://api.github.com/users/octocat', name: 'GitHub API - Get user' },
                  { method: 'GET', url: 'https://dog.ceo/api/breeds/image/random', name: 'Dog API - Random dog image' },
                ].map((example, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-muted/30 rounded cursor-pointer"
                    onClick={() => {
                      const exampleRequest: RequestConfig = {
                        id: `example_${Date.now()}_${index}`,
                        method: example.method,
                        url: example.url,
                        name: example.name,
                        headers: example.method === 'POST' ? [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }] : [],
                        params: [],
                        body: {
                          type: example.method === 'POST' ? 'json' : 'none',
                          content: example.method === 'POST' ? JSON.stringify({
                            key: 'value',
                            data: 'test'
                          }, null, 2) : undefined,
                          files: [],
                          formData: []
                        },
                        auth: { type: 'none' },
                        proxy: { enabled: false, userProvided: false },
                        createdAt: new Date()
                      };
                      onLoadRequest(exampleRequest);
                    }}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getMethodColor(example.method)}`}
                      >
                        {example.method}
                      </Badge>
                      <span className="text-sm">{example.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {example.url}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Collections;
