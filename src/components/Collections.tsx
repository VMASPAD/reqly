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
  Copy
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
        <TabsList className="grid  grid-cols-2 mx-2 mt-2">
          <TabsTrigger value="collections" className="text-xs md:text-sm">Collections</TabsTrigger>
          <TabsTrigger value="environments" className="text-xs md:text-sm">Environments</TabsTrigger>
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
      </Tabs>
    </div>
  );
}

export default Collections;
