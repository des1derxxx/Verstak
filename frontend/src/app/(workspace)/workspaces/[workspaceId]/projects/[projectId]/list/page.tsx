import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { ListPanel } from '@/components/workspace/list-panel';
import { requireProject } from '@/lib/api/server';
type Props = { params: Promise<{ workspaceId: string; projectId: string }> };
export const generateMetadata = async ({ params }: Props) => {
  const p = await params;
  const project = await requireProject(p.workspaceId, p.projectId);
  return { title: `${project.name} — Список задач` };
};
const Page = async ({ params }: Props) => {
  const p = await params;
  await requireProject(p.workspaceId, p.projectId);
  return (
    <WorkspaceOverview>
      <ListPanel />
    </WorkspaceOverview>
  );
};
export default Page;
