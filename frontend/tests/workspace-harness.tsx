import React, { useState } from 'react';
import type { WorkspaceControllerProps } from '../src/features/workspaces/types';
import { WorkspaceProvider } from '../src/features/workspaces/WorkspaceContext';
import { WorkspaceShell } from '../src/features/workspaces/WorkspaceShell';
import { WorkspaceOverview } from '../src/features/workspaces/WorkspaceOverview';
import { BoardPanel } from '../src/features/workspaces/components/BoardPanel';
import { BacklogPanel } from '../src/features/workspaces/components/BacklogPanel';
import { ListPanel } from '../src/features/workspaces/components/ListPanel';
import { NotesPanel } from '../src/features/workspaces/components/NotesPanel';
import { useWorkspaceController } from '../src/features/workspaces/hooks/useWorkspaceController';
import { readWorkspaceRoute, viewPath } from '../src/shared/lib/routes';
import { ProfilePanel } from '../src/features/account/ProfilePanel';
export const WorkspaceView = (
  props: Omit<WorkspaceControllerProps, 'route' | 'onNavigate' | 'onFilters'>,
) => {
  const [href, setHref] = useState(viewPath(props.info.id));
  const url = new URL(href, 'http://localhost');
  const [filters, setFilters] = useState(
    readWorkspaceRoute(url.pathname, url.searchParams).filters,
  );
  const model = useWorkspaceController({
    ...props,
    route: { ...readWorkspaceRoute(url.pathname, url.searchParams), filters },
    onNavigate: setHref,
    onFilters: setFilters,
  });
  return (
    <WorkspaceProvider model={model}>
      <WorkspaceShell>
        <WorkspaceOverview>
          {model.view === 'board' ? (
            <BoardPanel />
          ) : model.view === 'backlog' ? (
            <BacklogPanel />
          ) : model.view === 'list' ? (
            <ListPanel />
          ) : (
            <NotesPanel />
          )}
        </WorkspaceOverview>
      </WorkspaceShell>
    </WorkspaceProvider>
  );
};
export const WorkspaceRoot = ({
  session,
  space,
}: {
  session: WorkspaceControllerProps['session'];
  space: WorkspaceControllerProps['info'];
}) => {
  const [user, setUser] = useState(session.user);
  const [profile, setProfile] = useState(false);
  return (
    <>
      <WorkspaceView
        info={space}
        session={{ ...session, user }}
        spaces={[space]}
        onProfile={() => setProfile(true)}
        onSelectSpace={() => {}}
        onNewSpace={() => {}}
        onTeam={() => {}}
        onLogout={() => {}}
      />
      {profile && <ProfilePanel user={user} onUser={setUser} onClose={() => setProfile(false)} />}
    </>
  );
};
