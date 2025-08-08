import { useEffect } from 'preact/hooks';

interface KeyboardShortcuts {
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onSendRequest?: () => void;
  onToggleProxySettings?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const isEditingTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      // If focused element is an input, textarea, select, contenteditable or CodeMirror editor/content, treat as editing
      return !!target.closest('input, textarea, select, [contenteditable="true"], .cm-editor, .cm-content');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts while editing in inputs/editors
      if (isEditingTarget(document.activeElement)) {
        return;
      }

      // Ctrl/Cmd + T: New Tab
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault();
        shortcuts.onNewTab?.();
      }
      
      // Ctrl/Cmd + W: Close Tab
      if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
        event.preventDefault();
        shortcuts.onCloseTab?.();
      }
      
      // Ctrl/Cmd + Enter: Send Request
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        shortcuts.onSendRequest?.();
      }
      
      // Ctrl/Cmd + Shift + P: Toggle Proxy Settings
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        shortcuts.onToggleProxySettings?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};
