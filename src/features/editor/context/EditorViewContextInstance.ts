import { createContext } from 'react';
import type { RefObject } from 'react';
import type { EditorView } from '@codemirror/view';

export interface EditorViewContextType {
  viewRef: RefObject<EditorView | null>;
  setView: (view: EditorView | null) => void;
}

export const EditorViewContext = createContext<EditorViewContextType | null>(null);
