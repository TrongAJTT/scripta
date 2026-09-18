import { createContext, useContext } from 'react';

export interface DropdownContextValue {
  isOpen: boolean;
  close: () => void;
  isMobile: boolean;
  alignGutter?: boolean;
}

export const DropdownContext = createContext<DropdownContextValue | null>(null);

export function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown compound components must be inside DropdownMenu');
  return ctx;
}
