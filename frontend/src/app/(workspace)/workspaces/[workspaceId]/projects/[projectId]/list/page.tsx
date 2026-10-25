import { WorkspaceOverview } from '@/features/workspaces/WorkspaceOverview';
import { ListPanel } from '@/features/workspaces/components/ListPanel';
import { requireProject } from '@/shared/api/server';
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
