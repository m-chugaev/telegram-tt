import type { RefObject } from '../../../../lib/teact/teact';
import {
  useCallback,
  useEffect,
  useState,
} from '../../../../lib/teact/teact';

import type { Signal } from '../../../../util/signals';

import { requestNextMutation } from '../../../../lib/fasterdom/fasterdom';

import useLastCallback from '../../../../hooks/useLastCallback';

const DEFAULT_MAX_ENTRIES = 100;

type HistoryEntry = {
  html: string;
  timestamp: number;
  selection?: {
    path: number[];
    offset: number;
  };
};

type EditorHistory = {
  entries: HistoryEntry[];
  currentIndex: number;
  maxEntries?: number;
};

function useEditorHistory(
  inputRef: RefObject<HTMLDivElement | null>,
  getHtml: Signal<string>,
  setHtml: (html: string) => void,
) {
  const [history, setHistory] = useState<EditorHistory>({
    entries: [{
      html: getHtml(),
      timestamp: Date.now(),
    }],
    currentIndex: 0,
    maxEntries: DEFAULT_MAX_ENTRIES,
  });

  const getNodePath = (node: Node | null, root: Node | null): number[] => {
    if (!node || !root || !root.contains(node) || node === root) return [];

    const path: number[] = [];
    let current: Node | null = node;

    while (current && current !== root) {
      const parent = current.parentNode as Element;
      if (!parent || parent === root.parentNode) break;

      const index = Array.from(parent.childNodes).indexOf(current as ChildNode);
      path.unshift(index);
      current = parent;
    }

    return path;
  };

  const findNodeByPath = (root: Node | null, path: number[]): Node | undefined => {
    if (!root || !path.length) return undefined;

    let current: Node | null = root;

    for (const index of path) {
      if (!current || !current.childNodes[index]) return undefined;
      current = current.childNodes[index];
    }

    return current;
  };

  const getSelectionRange = useLastCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return undefined;

    const path = getNodePath(selection.anchorNode, inputRef.current);

    return {
      path,
      offset: selection.anchorOffset,
    };
  });

  const setSelection = useLastCallback((path: number[], offset: number) => {
    const selection = window.getSelection();
    if (!selection || !inputRef.current) return;

    const node = findNodeByPath(inputRef.current, path);
    if ((path.length === 0 || !node) && inputRef.current.lastChild) {
      const newRange = document.createRange();
      newRange.setStartAfter(inputRef.current.lastChild);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return;
    }

    if (!node) return;

    try {
      selection.setPosition(node, offset);
    } catch {
      //
    }
  });

  const setEntry = useLastCallback((entry: HistoryEntry) => {
    setHtml(entry.html);
    requestNextMutation(() => {
      if (entry.selection) {
        setSelection(entry.selection.path, entry.selection.offset);
      }
    });
  });

  const canUndo = useLastCallback(() => {
    return history.currentIndex > 0;
  });

  const canRedo = useLastCallback(() => {
    return history.currentIndex < history.entries.length - 1;
  });

  const undo = useCallback(() => {
    setHistory((prev) => {
      const lastEntry = prev.entries[prev.currentIndex];
      const currentHtml = getHtml();

      if (currentHtml !== lastEntry.html) {
        setEntry(lastEntry);

        return {
          ...prev,
          entries: [...prev.entries.slice(0, prev.currentIndex + 1), {
            html: currentHtml,
            timestamp: Date.now(),
            selection: getSelectionRange(),
          }],
        };
      }

      if (prev.currentIndex <= 0) {
        return prev;
      }

      setEntry(prev.entries[prev.currentIndex - 1]);

      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
      };
    });
  }, [getHtml, getSelectionRange, setEntry]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.currentIndex >= prev.entries.length - 1) return prev;

      setEntry(prev.entries[prev.currentIndex + 1]);

      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
      };
    });
  }, [setEntry]);

  const saveState = useLastCallback((html: string) => {
    setHistory((prev) => {
      // Prevent saving the same state twice
      const lastEntry = prev.entries[prev.currentIndex];
      if (html === lastEntry.html) return prev;
      const newEntries = prev.entries.slice(0, prev.currentIndex + 1);

      newEntries.push({
        html,
        timestamp: Date.now(),
        selection: getSelectionRange(),
      });

      // Limit the number of entries
      if (newEntries.length > prev.maxEntries!) {
        newEntries.shift();
      }

      return {
        ...prev,
        entries: newEntries,
        currentIndex: newEntries.length - 1,
      };
    });
  });

  const processKeyboardShortcuts = useCallback((e: React.KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey)) {
      return;
    }

    if (!canRedo() && !canUndo()) {
      return;
    }

    if (e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    } else if (e.key === 'y' && canRedo()) {
      e.preventDefault();
      redo();
    }
  }, [undo, redo, canUndo, canRedo]);

  const processKeyboardTriggers = useCallback((e: React.KeyboardEvent) => {
    // Space
    if (e.key === ' ') {
      saveState(getHtml());
      return;
    }

    // Delete (Backspace or Delete)
    if (e.key === 'Backspace' || e.key === 'Delete') {
      saveState(getHtml());
      return;
    }

    // Paste (Ctrl+V or Cmd+V)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      saveState(getHtml());
      return;
    }

    // Cut (Ctrl+X or Cmd+X)
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
      saveState(getHtml());
    }
  }, [getHtml, saveState]);

  const handleKeyDown = useLastCallback((e: KeyboardEvent) => {
    processKeyboardShortcuts(e as unknown as React.KeyboardEvent);
    processKeyboardTriggers(e as unknown as React.KeyboardEvent);
  });

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const clearState = useLastCallback(() => {
    setHistory({
      entries: [{
        html: '',
        timestamp: Date.now(),
      }],
      currentIndex: 0,
      maxEntries: DEFAULT_MAX_ENTRIES,
    });
  });

  return {
    currentState: history.entries[history.currentIndex],
    saveState,
    undo,
    redo,
    clearState,
    processKeyboardShortcuts,
    processKeyboardTriggers,
  };
}

export default useEditorHistory;
