import { getWorkspace, requireTask } from '@/shared/api/server';
import { TaskRoute } from '@/features/tasks/TaskRoute';
type Props = { params: Promise<{ workspaceId: string; taskId: string }> };
export const generateMetadata = async ({ params }: Props) => {
  const p = await params;
  const task = await requireTask(p.workspaceId, p.taskId);
  return { title: `${task.key} — ${task.title}` };
};
const Page = async ({ params }: Props) => {
  const p = await params;
  await requireTask(p.workspaceId, p.taskId);
  const seed = await getWorkspace(p.workspaceId);
  return <TaskRoute reference={p.taskId} snapshot={seed.snapshot} modal={false} />;
};
export default Page;
