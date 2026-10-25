import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { BoardPanel } from '@/components/workspace/board-panel';
import { requireProject } from '@/lib/api/server';
type Props = { params: Promise<{ workspaceId: string; projectId: string }> };
export const generateMetadata = async ({ params }: Props) => {
  const p = await params;
  const project = await requireProject(p.workspaceId, p.projectId);
  return { title: `${project.name} — Доска` };
};
const Page = async ({ params }: Props) => {
  const p = await params;
  await requireProject(p.workspaceId, p.projectId);
  return (
    <WorkspaceOverview>
      <BoardPanel />
    </WorkspaceOverview>
  );
};
export default Page;
