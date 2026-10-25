import React, { useState } from 'react';
import type { WorkspaceControllerProps } from '../src/lib/workspace/types';
import { WorkspaceProvider } from '../src/lib/workspace/workspace-context';
import { WorkspaceShell } from '../src/app/(workspace)/workspaces/[workspaceId]/_components/workspace-shell';
import { WorkspaceOverview } from '../src/components/workspace/workspace-overview';
import { BoardPanel } from '../src/components/workspace/board-panel';
import { BacklogPanel } from '../src/components/workspace/backlog-panel';
import { ListPanel } from '../src/components/workspace/list-panel';
import { NotesPanel } from '../src/components/workspace/notes-panel';
import { useWorkspaceController } from '../src/lib/workspace/use-workspace-controller';
import { readWorkspaceRoute, viewPath } from '../src/lib/routes';
import { ProfilePanel } from '../src/app/(workspace)/workspaces/[workspaceId]/settings/profile/_components/profile-panel';
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
