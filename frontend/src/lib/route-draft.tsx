'use client';

import { createContext, useContext, useEffect } from 'react';
export const RouteDraftContext = createContext<((id: symbol) => () => void) | null>(null);
export const useRouteDraft = (dirty: boolean) => {
  const register = useContext(RouteDraftContext);
  useEffect(() => {
    if (!dirty) return;
    const release = register?.(Symbol('draft'));
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', unload);
    return () => {
      release?.();
      window.removeEventListener('beforeunload', unload);
    };
  }, [dirty, register]);
};
