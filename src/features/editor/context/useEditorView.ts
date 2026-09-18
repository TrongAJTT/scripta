import { useContext } from 'react';
import { EditorViewContext } from './EditorViewContextInstance';
import type { EditorViewContextType } from './EditorViewContextInstance';

export function useEditorView(): EditorViewContextType {
  const ctx = useContext(EditorViewContext);
  if (!ctx) {
    throw new Error('useEditorView must be used within an EditorViewProvider');
  }
  return ctx;
}
