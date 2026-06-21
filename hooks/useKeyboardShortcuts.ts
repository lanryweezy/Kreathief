import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
  /** If true, action fires on keyup (for held-key shortcuts like space-to-pan) */
  onKeyUp?: boolean;
  /** Context: only fire when editor is active, etc. */
  context?: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  context?: string;
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

function matchShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
  const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatches = shortcut.alt ? event.altKey : !event.altKey;

  if (!keyMatches || !ctrlMatches || !shiftMatches || !altMatches) return false;

  // Platform-specific: on Mac, require meta for Ctrl shortcuts; on others require ctrl
  if (shortcut.ctrl) {
    if (isMac() && !event.metaKey) return false;
    if (!isMac() && !event.ctrlKey) return false;
  }

  return true;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true, context }: UseKeyboardShortcutsProps) => {
  const activeKeysRef = useRef(new Set<string>());

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.defaultPrevented || !enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Avoid repeated firings from key repeat
      const keyId = `${event.key}:${event.ctrlKey}:${event.shiftKey}:${event.altKey}:${event.metaKey}`;
      if (activeKeysRef.current.has(keyId)) return;
      activeKeysRef.current.add(keyId);

      for (const shortcut of shortcuts) {
        if (shortcut.context && shortcut.context !== context) continue;
        if (shortcut.onKeyUp) continue; // Skip keyup-only shortcuts

        if (matchShortcut(event, shortcut)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled, context]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const keyId = `${event.key}:${event.ctrlKey}:${event.shiftKey}:${event.altKey}:${event.metaKey}`;
      activeKeysRef.current.delete(keyId);

      // Fire keyup-only shortcuts
      for (const shortcut of shortcuts) {
        if (shortcut.context && shortcut.context !== context) continue;
        if (!shortcut.onKeyUp) continue;

        if (matchShortcut(event, shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled, context]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      activeKeysRef.current.clear();
    };
  }, [handleKeyDown, handleKeyUp]);
};

// Detect platform for display formatting
const _isMac = isMac();

export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  if (shortcut.ctrl) {
    parts.push(_isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(_isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(_isMac ? '⌥' : 'Alt');
  }
  parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  return parts.join(_isMac ? '' : '+');
};

// Detect conflicts between shortcuts
export function detectConflicts(shortcuts: KeyboardShortcut[]): Array<{ a: KeyboardShortcut; b: KeyboardShortcut }> {
  const conflicts: Array<{ a: KeyboardShortcut; b: KeyboardShortcut }> = [];
  for (let i = 0; i < shortcuts.length; i++) {
    for (let j = i + 1; j < shortcuts.length; j++) {
      const a = shortcuts[i];
      const b = shortcuts[j];
      if (
        a.key.toLowerCase() === b.key.toLowerCase() &&
        (a.ctrl || false) === (b.ctrl || false) &&
        (a.shift || false) === (b.shift || false) &&
        (a.alt || false) === (b.alt || false) &&
        (!a.context || !b.context || a.context === b.context)
      ) {
        conflicts.push({ a, b });
      }
    }
  }
  return conflicts;
}
