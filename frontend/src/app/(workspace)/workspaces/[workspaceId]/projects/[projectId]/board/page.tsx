import { WorkspaceOverview } from '@/features/workspaces/WorkspaceOverview';
import { BoardPanel } from '@/features/workspaces/components/BoardPanel';
import { requireProject } from '@/shared/api/server';
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
