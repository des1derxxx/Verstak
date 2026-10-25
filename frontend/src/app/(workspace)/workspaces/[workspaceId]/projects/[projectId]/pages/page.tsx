import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { NotesPanel } from '@/components/workspace/notes-panel';
import { requireProject } from '@/lib/api/server';
type Props = { params: Promise<{ workspaceId: string; projectId: string }> };
export const generateMetadata = async ({ params }: Props) => {
  const p = await params;
  const project = await requireProject(p.workspaceId, p.projectId);
  return { title: `${project.name} — Страницы` };
};
const Page = async ({ params }: Props) => {
  const p = await params;
  await requireProject(p.workspaceId, p.projectId);
  return (
    <WorkspaceOverview>
      <NotesPanel />
    </WorkspaceOverview>
  );
};
export default Page;
