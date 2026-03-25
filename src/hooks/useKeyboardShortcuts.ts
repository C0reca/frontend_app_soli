import { useEffect } from 'react';

interface KeyboardShortcutCallbacks {
  onSearch?: () => void;
  onNew?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onNew }: KeyboardShortcutCallbacks) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Ctrl+K / Cmd+K → Pesquisa global
      if (isMod && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        onSearch?.();
        return;
      }

      // Ctrl+N / Cmd+N → Nova ação
      if (isMod && e.key === 'n') {
        e.preventDefault();
        e.stopPropagation();
        onNew?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onNew]);
}
