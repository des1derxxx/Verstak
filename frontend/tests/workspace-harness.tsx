import React, { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createRequire } from 'node:module';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '../src/lib/query-client';
import { queryKeys } from '../src/queries/keys';
import type { Member, Session, Snapshot, Space } from '../src/lib/api/types';
import { WorkspaceProviders } from '../src/app/(workspace)/workspaces/[workspaceId]/_components/workspace-providers';
import { WorkspaceShell } from '../src/app/(workspace)/workspaces/[workspaceId]/_components/workspace-shell';
import { WorkspaceOverview } from '../src/components/workspace/workspace-overview';
import { BoardPanel } from '../src/components/workspace/board-panel';
import { BacklogPanel } from '../src/components/workspace/backlog-panel';
import { ListPanel } from '../src/components/workspace/list-panel';
import { NotesPanel } from '../src/components/workspace/notes-panel';
import { TaskPage } from '../src/components/task/task-page';
import { ProfileSettings } from '../src/app/(workspace)/workspaces/[workspaceId]/settings/profile/_components/profile-settings';
import { localDate } from '../src/lib/model/workspace';
const require = createRequire(import.meta.url);
const {
  AppRouterContext,
  LayoutRouterContext,
} = require('next/dist/shared/lib/app-router-context.shared-runtime.js');
const {
  PathnameContext,
  SearchParamsContext,
} = require('next/dist/shared/lib/hooks-client-context.shared-runtime.js');
// Mirrors the page files under app/(workspace)/workspaces/[workspaceId].
const page = (segments: string[]): ReactNode => {
  const [first, second, third] = segments;
  if (first === 'tasks') return <TaskPage reference={second} />;
  if (first === 'settings' && second === 'profile') return <ProfileSettings />;
  const view = first === 'today' ? (second ?? 'list') : first === 'projects' ? third : first;
  return (
    <WorkspaceOverview>
      {view === 'list' ? (
        <ListPanel />
      ) : view === 'backlog' ? (
        <BacklogPanel />
      ) : view === 'pages' ? (
        <NotesPanel />
      ) : (
        <BoardPanel />
      )}
    </WorkspaceOverview>
  );
};
const tree = (segments: string[]): unknown =>
  segments.length ? [segments[0], { children: tree(segments.slice(1)) }] : ['__PAGE__', {}];
const base = 'http://localhost';
const nativeReplaceState = window.history.replaceState.bind(window.history);
export const WorkspaceApp = ({
  session,
  space,
  snapshot,
  members = [{ user: session.user, role: 'owner' }],
  path = `/workspaces/${space.id}/board`,
  onPush = () => {},
}: {
  session: Session;
  space: Space;
  snapshot: Snapshot;
  members?: Member[];
  path?: string;
  onPush?: (href: string) => void;
}) => {
  const [location, setLocation] = useState({ url: new URL(path, base), modal: '' });
  const [client] = useState(() => {
    const client = makeQueryClient();
    // Infinite gcTime schedules no timers, so the test process can exit.
    client.setDefaultOptions({
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    });
    client.setQueryData(queryKeys.workspaceData(space.id), snapshot);
    client.setQueryData(queryKeys.members(space.id), members);
    return client;
  });
  useEffect(() => {
    nativeReplaceState(null, '', location.url.pathname + location.url.search);
  }, [location.url]);
  useEffect(() => {
    // Next.js turns history.replaceState into a search params update.
    const original = window.history.replaceState;
    window.history.replaceState = function (state, unused, href) {
      original.call(this, state, unused, href);
      if (href) setLocation((current) => ({ ...current, url: new URL(String(href), base) }));
    };
    return () => {
      window.history.replaceState = original;
    };
  }, []);
  const router = useMemo(
    () => ({
      push: (href: string) => {
        onPush(href);
        const url = new URL(href, base);
        // A task opened from a view is intercepted into the @modal slot.
        if (url.pathname.includes('/tasks/'))
          setLocation((current) => ({ ...current, modal: url.pathname.split('/').at(-1)! }));
        else setLocation({ url, modal: '' });
      },
      replace: () => {},
      refresh: () => {},
      back: () => setLocation((current) => ({ ...current, modal: '' })),
      forward: () => {},
      prefetch: () => {},
    }),
    [],
  );
  const segments = location.url.pathname.split('/').slice(3).filter(Boolean);
  const parentTree = [
    space.id,
    {
      children: tree(segments),
      modal: location.modal
        ? ['(.)tasks', { children: tree([location.modal]) }]
        : ['__DEFAULT__', {}],
    },
  ];
  return (
    <QueryClientProvider client={client}>
      <AppRouterContext.Provider value={router}>
        <LayoutRouterContext.Provider
          value={{ parentTree, parentRenderTree: { data: { bfcacheId: 0 } } }}
        >
          <PathnameContext.Provider value={location.url.pathname}>
            <SearchParamsContext.Provider value={location.url.searchParams}>
              <WorkspaceProviders
                session={session}
                spaces={[space]}
                info={space}
                calendar={{ today: localDate(), timeZone: 'UTC' }}
              >
                <WorkspaceShell>{page(segments)}</WorkspaceShell>
                {location.modal && <TaskPage reference={location.modal} modal />}
              </WorkspaceProviders>
            </SearchParamsContext.Provider>
          </PathnameContext.Provider>
        </LayoutRouterContext.Provider>
      </AppRouterContext.Provider>
    </QueryClientProvider>
  );
};
