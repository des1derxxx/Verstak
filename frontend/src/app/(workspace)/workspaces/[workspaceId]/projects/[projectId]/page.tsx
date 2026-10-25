import { redirect } from 'next/navigation';
import { viewPath } from '@/lib/routes';
const ProjectIndex = async ({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) => {
  const p = await params;
  redirect(viewPath(p.workspaceId, p.projectId));
};
export default ProjectIndex;
