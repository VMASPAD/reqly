import { useState } from 'preact/hooks';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { Environment, KeyValue } from '@/lib/types';

interface EnvironmentEditorProps {
  environment: Environment;
  onUpdateEnvironment: (env: Environment) => void;
  onClose: () => void;
}

function EnvironmentEditor({ environment, onUpdateEnvironment, onClose }: EnvironmentEditorProps) {
  const [envName, setEnvName] = useState(environment.name);
  const [variables, setVariables] = useState<KeyValue[]>(environment.variables);
  const [showValues, setShowValues] = useState<Set<string>>(new Set());

  const addVariable = () => {
    const newVar: KeyValue = {
      id: Math.random().toString(36).substr(2, 9),
      key: '',
      value: '',
      enabled: true
    };
    setVariables([...variables, newVar]);
  };

  const updateVariable = (id: string, updates: Partial<KeyValue>) => {
    setVariables(vars => vars.map(v => 
      v.id === id ? { ...v, ...updates } : v
    ));
  };

  const removeVariable = (id: string) => {
    setVariables(vars => vars.filter(v => v.id !== id));
  };

  const toggleShowValue = (id: string) => {
    const newShowValues = new Set(showValues);
    if (newShowValues.has(id)) {
      newShowValues.delete(id);
    } else {
      newShowValues.add(id);
    }
    setShowValues(newShowValues);
  };

  const handleSave = () => {
    const updatedEnv: Environment = {
      ...environment,
      name: envName.trim(),
      variables: variables.filter(v => v.key.trim()),
      updatedAt: new Date()
    };
    onUpdateEnvironment(updatedEnv);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings size={20} className="text-green-600" />
              <CardTitle>Edit Environment</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 overflow-auto">
          {/* Environment Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Environment Name</label>
            <Input
              value={envName}
              onChange={(e) => setEnvName(e.currentTarget.value)}
              placeholder="Environment name"
            />
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Variables</label>
              <Button variant="outline" size="sm" onClick={addVariable}>
                <Plus size={14} className="mr-1" />
                Add Variable
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-auto">
              {variables.map((variable) => (
                <motion.div
                  key={variable.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 p-2 border rounded"
                >
                  <Checkbox
                    checked={variable.enabled}
                    onCheckedChange={(enabled: boolean) => 
                      updateVariable(variable.id, { enabled: !!enabled })
                    }
                  />
                  <Input
                    placeholder="Variable name"
                    value={variable.key}
                    onChange={(e) => updateVariable(variable.id, { key: e.currentTarget.value })}
                    className="flex-1"
                  />
                  <div className="flex-1 relative">
                    <Input
                      type={showValues.has(variable.id) ? 'text' : 'password'}
                      placeholder="Variable value"
                      value={variable.value}
                      onChange={(e) => updateVariable(variable.id, { value: e.currentTarget.value })}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => toggleShowValue(variable.id)}
                    >
                      {showValues.has(variable.id) ? (
                        <EyeOff size={12} />
                      ) : (
                        <Eye size={12} />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariable(variable.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </motion.div>
              ))}

              {variables.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No variables yet</p>
                  <p className="text-xs">Add variables to use in your requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Usage Info */}
          <div className="bg-muted/30 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">How to use variables:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• In URLs: <code className="bg-muted px-1 rounded">{'{{variableName}}'}</code></p>
              <p>• In headers: <code className="bg-muted px-1 rounded">{'{{apiKey}}'}</code></p>
              <p>• In body: <code className="bg-muted px-1 rounded">{'{{baseUrl}}/api/users'}</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default EnvironmentEditor;
