import type { ReactNode } from 'react';
import { HydrationBoundary } from '@tanstack/react-query';
import { getWorkspace, workspaceState } from '@/lib/api/server';
import { WorkspaceProviders } from '@/app/(workspace)/workspaces/[workspaceId]/_components/workspace-providers';
import { WorkspaceShell } from '@/app/(workspace)/workspaces/[workspaceId]/_components/workspace-shell';
const WorkspaceLayout = async ({
  children,
  modal,
  params,
}: {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ workspaceId: string }>;
}) => {
  const { workspaceId } = await params;
  const { session, spaces, info, calendar } = await getWorkspace(workspaceId);
  return (
    <HydrationBoundary state={await workspaceState(workspaceId)}>
      <WorkspaceProviders
        key={workspaceId}
        session={session}
        spaces={spaces}
        info={info}
        calendar={calendar}
      >
        <WorkspaceShell>{children}</WorkspaceShell>
        {modal}
      </WorkspaceProviders>
    </HydrationBoundary>
  );
};
export default WorkspaceLayout;
