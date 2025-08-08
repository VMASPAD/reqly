import { useRef, useEffect } from 'preact/hooks';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'json' | 'text';
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function CodeEditor({ 
  value, 
  onChange, 
  language = 'text', 
  readOnly = false, 
  placeholder = '',
  className = ''
}: CodeEditorProps) {
  const editor = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>();

  useEffect(() => {
    if (!editor.current) return;

    const extensions = [
      basicSetup,
      EditorView.theme({
        '&': {
          fontSize: '14px',
          fontFamily: 'var(--font-mono)',
          height: '100%',
        },
        '.cm-content': {
          padding: '16px',
          minHeight: '100%',
          color: 'var(--color-foreground)',
          backgroundColor: 'transparent',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-editor': {
          height: '100%',
          backgroundColor: 'transparent',
          border: 'none',
        },
        '.cm-scroller': {
          backgroundColor: 'transparent',
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--color-muted)',
          color: 'var(--color-muted-foreground)',
          border: 'none',
          borderRight: '1px solid var(--color-border)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accent-foreground)',
        },
        '.cm-activeLine': {
          backgroundColor: 'var(--color-accent)/10',
        },
        '.cm-selectionBackground': {
          backgroundColor: 'var(--color-primary)/20',
        },
        '.cm-cursor': {
          borderColor: 'var(--color-foreground)',
        },
        '.cm-placeholder': {
          color: 'var(--color-muted-foreground)',
          fontStyle: 'italic',
        },
        '.cm-lineNumbers': {
          color: 'var(--color-muted-foreground)',
        },
        '.cm-lineNumbers .cm-gutterElement': {
          color: 'var(--color-muted-foreground)',
        },
        // Scroll improvements
        '.cm-scroller::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '.cm-scroller::-webkit-scrollbar-track': {
          backgroundColor: 'var(--color-muted)',
        },
        '.cm-scroller::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--color-border)',
          borderRadius: '4px',
        },
        '.cm-scroller::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'var(--color-muted-foreground)',
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange && !readOnly) {
          onChange(update.state.doc.toString());
        }
      }),
    ];

    // Add language support
    if (language === 'json') {
      extensions.push(json());
    }

    // Make read-only if specified
    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    // Add placeholder support
    if (placeholder) {
      extensions.push(EditorView.theme({
        '.cm-placeholder': {
          color: 'var(--color-muted-foreground)',
          fontStyle: 'italic',
        }
      }));
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    view.current = new EditorView({
      state,
      parent: editor.current,
    });

    return () => {
      view.current?.destroy();
    };
  }, [language, readOnly, placeholder]);

  // Update content when value changes
  useEffect(() => {
    if (view.current && view.current.state.doc.toString() !== value) {
      view.current.dispatch({
        changes: {
          from: 0,
          to: view.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return <div ref={editor} className={`code-editor ${className}`} />;
}
