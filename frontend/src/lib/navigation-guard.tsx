'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
const leaveMessage = 'Есть несохранённые изменения. Покинуть страницу?';
type Navigation = {
  navigate: (href: string, options?: { discard?: boolean }) => void;
  back: () => void;
  // Asks the user before an action that would drop unsaved drafts.
  confirmLeave: (message?: string) => boolean;
  hasDraft: boolean;
};
export const RouteDraftContext = createContext<((id: symbol) => () => void) | null>(null);
const NavigationContext = createContext<Navigation | null>(null);
export const useNavigation = () => {
  const navigation = useContext(NavigationContext);
  if (!navigation) throw new Error('NavigationGuardProvider is required');
  return navigation;
};
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
export const NavigationGuardProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const drafts = useRef(new Set<symbol>());
  const [draftCount, setDraftCount] = useState(0);
  const skipPopGuard = useRef(false);
  const register = useCallback((id: symbol) => {
    drafts.current.add(id);
    setDraftCount(drafts.current.size);
    return () => {
      drafts.current.delete(id);
      setDraftCount(drafts.current.size);
    };
  }, []);
  useEffect(() => {
    const previous = { url: window.location.href, state: window.history.state };
    const pop = (event: PopStateEvent) => {
      if (skipPopGuard.current) {
        skipPopGuard.current = false;
        return;
      }
      if (drafts.current.size && !window.confirm(leaveMessage)) {
        event.stopImmediatePropagation();
        window.history.pushState(previous.state, '', previous.url);
      }
    };
    window.addEventListener('popstate', pop, true);
    return () => window.removeEventListener('popstate', pop, true);
  }, [pathname, search]);
  const confirmLeave = useCallback(
    (message = leaveMessage) => !drafts.current.size || window.confirm(message),
    [],
  );
  const navigation = useMemo<Navigation>(
    () => ({
      navigate: (href, options) => {
        if (options?.discard || confirmLeave()) router.push(href);
      },
      back: () => {
        skipPopGuard.current = true;
        router.back();
      },
      confirmLeave,
      hasDraft: draftCount > 0,
    }),
    [router, confirmLeave, draftCount],
  );
  return (
    <RouteDraftContext.Provider value={register}>
      <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>
    </RouteDraftContext.Provider>
  );
};
