import type { ReactNode } from 'react';
import { getWorkspace } from '@/shared/api/server';
import { WorkspaceRouter } from '@/application/WorkspaceRouter';
import { WorkspaceShell } from '@/features/workspaces/WorkspaceShell';
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
