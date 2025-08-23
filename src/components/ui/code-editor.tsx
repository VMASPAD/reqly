import { useEffect } from 'preact/hooks';
import MonacoEditor from 'react-monaco-editor';
import monaco from '../../monaco-setup';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'json' | 'javascript' | 'text';
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  onEditorMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

export function CodeEditor({ 
  value, 
  onChange, 
  language = 'text', 
  readOnly = false,
  className = '',
  placeholder: _placeholder, // Note: Monaco Editor doesn't support placeholder directly
  onEditorMount
}: CodeEditorProps) {
  useEffect(() => {
    // Configure JavaScript/TypeScript language features FIRST
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
      lib: ['ES2020', 'DOM']
    });

    // Clear existing extra libs to avoid conflicts
    const extraLibs = monaco.languages.typescript.javascriptDefaults.getExtraLibs();
    Object.keys(extraLibs).forEach((uri) => {
      if (uri.includes('postman-api')) {
        delete extraLibs[uri];
      }
    });

    // Add Postman API type definitions with more comprehensive types
    const postmanTypes = `
declare namespace pm {
  interface TestFunction {
    (description: string, testFunction: () => void): void;
  }
  
  interface ExpectInterface {
    (actual: any): {
      to: {
        have: {
          status(code: number): void;
          property(prop: string): void;
          header(name: string): void;
          jsonBody(path?: string): any;
        };
        be: {
          below(value: number): void;
          above(value: number): void;
          oneOf(values: any[]): void;
          ok: void;
          success: void;
          clientError: void;
          serverError: void;
          error: void;
          redirection: void;
        };
        include(value: string): void;
        equal(value: any): void;
        eql(value: any): void;
      };
    };
  }

  interface ResponseInterface {
    to: {
      have: {
        status(code: number): void;
        header(name: string): void;
        jsonBody(path?: string): any;
      };
      be: {
        ok: boolean;
        success: boolean;
        clientError: boolean;
        serverError: boolean;
        error: boolean;
        redirection: boolean;
      };
    };
    json(): any;
    text(): string;
    headers: {
      get(name: string): string | undefined;
      has(name: string): boolean;
    };
    responseTime: number;
    code: number;
    status: string;
    responseSize: number;
  }

  interface RequestInterface {
    url: string;
    method: string;
    headers: {
      add(header: { key: string; value: string }): void;
      upsert(header: { key: string; value: string }): void;
      remove(key: string): void;
      get(key: string): string | undefined;
    };
    body: {
      mode: string;
      raw: string;
      urlencoded: any;
      formdata: any;
    };
  }

  interface VariableScope {
    get(key: string): string | undefined;
    set(key: string, value: string | number): void;
    unset(key: string): void;
    clear(): void;
  }

  const test: TestFunction;
  const expect: ExpectInterface;
  const response: ResponseInterface;
  const request: RequestInterface;
  const environment: VariableScope;
  const globals: VariableScope;
  const variables: VariableScope;
  const collectionVariables: VariableScope & {
    set(key: string, value: string): void;
    unset(key: string): void;
  };
  const iterationData: {
    get(key: string): string | undefined;
  };
  
  function sendRequest(request: any, callback: (err: any, response: any) => void): void;
}

declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};

declare function setTimeout(callback: () => void, delay: number): number;
declare function clearTimeout(id: number): void;
declare function setInterval(callback: () => void, delay: number): number;
declare function clearInterval(id: number): void;

// Global pm object
declare const pm: typeof pm;
`;

    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      postmanTypes,
      'file:///postman-api.d.ts'
    );

    // Configure JSON language features
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true,
      schemaValidation: 'error',
      schemaRequest: 'error',
      trailingCommas: 'error',
      comments: 'error'
    });

    // Configure dark theme with CSS variables
    monaco.editor.defineTheme('reqly-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // JSON tokens
        { token: 'string.key.json', foreground: '9CDCFE' },
        { token: 'string.value.json', foreground: 'CE9178' },
        { token: 'number.json', foreground: 'B5CEA8' },
        { token: 'keyword.json', foreground: '569CD6' },
        // JavaScript tokens
        { token: 'keyword.js', foreground: '569CD6' },
        { token: 'string.js', foreground: 'CE9178' },
        { token: 'number.js', foreground: 'B5CEA8' },
        { token: 'comment.js', foreground: '6A9955' },
        { token: 'identifier.js', foreground: '9CDCFE' },
        { token: 'delimiter.js', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': oklchToHex('oklch(0.2189 0.0046 196.8245)'),
        'editor.foreground': oklchToHex('oklch(0.9694 0.0011 197.1386)'),
        'editorLineNumber.foreground': oklchToHex('oklch(0.7308 0.0102 196.9333)'),
        'editor.selectionBackground': oklchToHex('oklch(0.3878 0.0092 196.7793)'),
        'editor.inactiveSelectionBackground': oklchToHex('oklch(0.2820 0.0043 196.9123)'),
        'editorError.foreground': oklchToHex('oklch(0.6955 0.2707 328.0110)'),
        'editorWarning.foreground': oklchToHex('oklch(0.6874 0.1572 48.7036)'),
        'editorInfo.foreground': oklchToHex('oklch(0.8352 0.1831 127.2810)'),
      }
    });
    
    monaco.editor.setTheme('reqly-dark');
  }, []);

  // Helper function to convert OKLCH to hex (simplified)
  function oklchToHex(oklchColor: string): string {
    // This is a simplified conversion - in production you'd want a proper OKLCH to hex converter
    const colorMap: { [key: string]: string } = {
      'oklch(0.2189 0.0046 196.8245)': '#1a1a1a',
      'oklch(0.9694 0.0011 197.1386)': '#f5f5f5',
      'oklch(0.7308 0.0102 196.9333)': '#9ca3af',
      'oklch(0.3878 0.0092 196.7793)': '#374151',
      'oklch(0.2820 0.0043 196.9123)': '#1f2937',
      'oklch(0.6955 0.2707 328.0110)': '#ef4444',
      'oklch(0.6874 0.1572 48.7036)': '#f59e0b',
      'oklch(0.8352 0.1831 127.2810)': '#10b981',
    };
    return colorMap[oklchColor] || '#1a1a1a';
  }

  const handleChange = (newValue: string) => {
    if (onChange && !readOnly) {
      onChange(newValue);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Llamar al callback externo si existe
    if (onEditorMount) {
      onEditorMount(editor);
    }

    // Enable command palette
    editor.addAction({
      id: 'open-command-palette',
      label: 'Command Palette',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP],
      run: () => {
        editor.trigger('keyboard', 'editor.action.quickCommand', null);
      }
    });

    // Force validation and IntelliSense on mount
    if (language === 'json') {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, 'json', []);
        // Trigger validation
        setTimeout(() => {
          editor.trigger('editor', 'editor.action.formatDocument', {});
        }, 100);
      }
    }

    // Configure JavaScript/TypeScript features and force IntelliSense
    if (language === 'javascript') {
      const model = editor.getModel();
      if (model) {
        // Set the model language explicitly
        monaco.editor.setModelLanguage(model, 'javascript');
        
        // Force IntelliSense to be available
        setTimeout(() => {
          editor.trigger('editor', 'editor.action.triggerSuggest', {});
        }, 200);

        // Listen for content changes to refresh IntelliSense
        model.onDidChangeContent(() => {
          setTimeout(() => {
            // This helps refresh the language service
            const position = editor.getPosition();
            if (position) {
              editor.setPosition(position);
            }
          }, 100);
        });
      }
    }
  };

  return (
    <div className={className}>
      <MonacoEditor
        monaco={monaco as any} 
        width="100%"
        height="100%"
        language={language === 'json' ? 'json' : language === 'javascript' ? 'javascript' : 'plaintext'}
        theme="reqly-dark"
        value={value}
        onChange={handleChange}
        editorDidMount={handleEditorDidMount}
        options={{
          readOnly: readOnly,
          automaticLayout: true,
          fontSize: 14,
          fontFamily: 'var(--font-mono), JetBrains Mono, Consolas, Monaco, monospace',
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          // Enhanced IntelliSense and error detection
          quickSuggestions: {
            other: 'on',
            comments: 'on',
            strings: 'on'
          },
          quickSuggestionsDelay: 100,
          parameterHints: { 
            enabled: true,
            cycle: true
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'allDocuments',
          suggestSelection: 'first',
          // Enhanced IntelliSense settings
          hover: { enabled: true },
          lightbulb: { enabled: true },
          codeActionsOnSave: {},
          // Error detection and validation
          showUnused: true,
          showDeprecated: true,
          // Enhanced diagnostics
          renderValidationDecorations: 'on',
          // Basic editing features
          multiCursorModifier: 'ctrlCmd',
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: 'full',
          // Bracket matching
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          // Find and replace
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'always'
          },
          // Ensure suggestions are shown
          suggest: {
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true
          }
        }}
      />
    </div>
  );
}