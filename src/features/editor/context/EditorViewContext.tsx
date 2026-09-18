import React, { useRef } from 'react';
import type { ReactNode } from 'react';
import type { EditorView } from '@codemirror/view';
import { EditorViewContext } from './EditorViewContextInstance';

export const EditorViewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const viewRef = useRef<EditorView | null>(null);

  const setView = (view: EditorView | null) => {
    viewRef.current = view;
  };

  return (
    <EditorViewContext.Provider value={{ viewRef, setView }}>
      {children}
    </EditorViewContext.Provider>
  );
};
