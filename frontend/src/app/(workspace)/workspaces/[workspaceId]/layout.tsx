import type { ReactNode } from 'react';
import { getWorkspace } from '@/lib/api/server';
import { WorkspaceRouter } from '@/app/(workspace)/workspaces/[workspaceId]/_components/workspace-router';
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
  const seed = await getWorkspace(workspaceId);
  return (
    <WorkspaceRouter key={workspaceId} {...seed}>
      <WorkspaceShell>{children}</WorkspaceShell>
      {modal}
    </WorkspaceRouter>
  );
};
export default WorkspaceLayout;
