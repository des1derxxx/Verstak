'use client';

import { CalendarContext, useBrowserCalendar } from '@/shared/ui/CalendarContext';
import type { Calendar } from '@/shared/ui/CalendarContext';

import { RouteDraftContext } from '@/shared/ui/RouteDraft';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegments,
} from 'next/navigation';
import type { Member, Session, Snapshot, Space } from '@/shared/api/types';
import { api, ApiError, setCsrf } from '@/shared/api/client';
import {
  filterSearch,
  readWorkspaceRoute,
  taskPath,
  viewPath,
  workspacePath,
} from '@/shared/lib/routes';
import { WorkspaceProvider } from '@/features/workspaces/WorkspaceContext';
import { useWorkspaceController } from '@/features/workspaces/hooks/useWorkspaceController';
export const WorkspaceRouter = ({
  session: initialSession,
  spaces,
  info,
  snapshot,
  members,
  calendar: initialCalendar,
  children,
}: {
  session: Session;
  spaces: Space[];
  info: Space;
  snapshot: Snapshot;
  members: Member[];
  calendar: Calendar;
  children: ReactNode;
}) => {
  const calendar = useBrowserCalendar(initialCalendar);
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const intercepted = useSelectedLayoutSegments('modal').includes('(.)tasks');
  const skipPopGuard = useRef(false);
  const drafts = useRef(new Set<symbol>());
  const registerDraft = useCallback((id: symbol) => {
    drafts.current.add(id);
    return () => {
      drafts.current.delete(id);
    };
  }, []);
  const [session, setSession] = useState(initialSession);
  const [error, setError] = useState('');
  const parsedRoute = readWorkspaceRoute(pathname, new URLSearchParams(search.toString()));
  const background = useRef(parsedRoute);
  if (!intercepted) background.current = parsedRoute;
  const route = intercepted ? background.current : parsedRoute;
  useEffect(() => {
    const previous = { url: window.location.href, state: window.history.state };
    const pop = (event: PopStateEvent) => {
      if (skipPopGuard.current) {
        skipPopGuard.current = false;
        return;
      }
      if (
        drafts.current.size &&
        !window.confirm('Есть несохранённые изменения. Покинуть страницу?')
      ) {
        event.stopImmediatePropagation();
        window.history.pushState(previous.state, '', previous.url);
      }
    };
    window.addEventListener('popstate', pop, true);
    return () => window.removeEventListener('popstate', pop, true);
  }, [pathname, search]);
  useEffect(() => {
    setCsrf(initialSession.csrf);
    setSession(initialSession);
  }, [initialSession]);
  useEffect(() => {
    const expired = () => {
      setCsrf('');
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      router.refresh();
    };
    window.addEventListener('verstak:unauthorized', expired);
    return () => window.removeEventListener('verstak:unauthorized', expired);
  }, [router, pathname]);
  const navigate = (href: string, options?: { discard?: boolean }) => {
    if (
      !options?.discard &&
      drafts.current.size &&
      !window.confirm('Есть несохранённые изменения. Покинуть страницу?')
    )
      return;
    setError('');
    router.push(href);
  };
  const model = useWorkspaceController({
    session,
    spaces,
    info,
    todayDate: calendar.today,
    initialSnapshot: snapshot,
    initialMembers: members,
    route,
    onNavigate: navigate,
    hasDraft: () => drafts.current.size > 0,
    onBack: () => {
      skipPopGuard.current = true;
      router.back();
    },
    onFilters: (filters) => {
      const query = filterSearch(new URLSearchParams(window.location.search), filters);
      window.history.replaceState(null, '', `${pathname}${query ? `?${query}` : ''}`);
    },
    onOpenTask: (task) => navigate(taskPath(info.id, task.key ?? task.id)),
    onSelectSpace: (id, taskId) => navigate(taskId ? taskPath(id, taskId) : viewPath(id)),
    onNewSpace: () => navigate('/workspaces/new'),
    onTeam: () => navigate(`${workspacePath(info.id)}/settings/members`),
    onProfile: () => navigate(`${workspacePath(info.id)}/settings/profile`),
    onUser: (user) => {
      setSession((previous) => ({ ...previous, user }));
      router.refresh();
    },
    onLogout: () => {
      if (
        drafts.current.size &&
        !window.confirm('Есть несохранённые изменения. Выйти из аккаунта?')
      )
        return;
      void api('/auth/logout', 'POST', {})
        .then(() => {
          setCsrf('');
          router.replace('/login');
          router.refresh();
        })
        .catch((error: Error) => {
          if (error instanceof ApiError && error.status === 401) {
            router.replace('/login');
            router.refresh();
          } else setError(error.message);
        });
    },
  });
  return (
    <CalendarContext.Provider value={calendar}>
      <RouteDraftContext.Provider value={registerDraft}>
        <WorkspaceProvider model={model}>
          {error && (
            <p
              role="alert"
              className="fixed top-16 right-5 z-60 rounded border border-danger bg-white p-4 text-danger"
            >
              {error}
            </p>
          )}
          {children}
        </WorkspaceProvider>
      </RouteDraftContext.Provider>
    </CalendarContext.Provider>
  );
};
