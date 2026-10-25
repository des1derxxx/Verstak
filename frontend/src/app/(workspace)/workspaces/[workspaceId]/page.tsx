import { redirect } from 'next/navigation';
import { viewPath } from '@/shared/lib/routes';
const WorkspaceIndex = async ({ params }: { params: Promise<{ workspaceId: string }> }) => {
  const { workspaceId } = await params;
  redirect(viewPath(workspaceId));
};
export default WorkspaceIndex;
