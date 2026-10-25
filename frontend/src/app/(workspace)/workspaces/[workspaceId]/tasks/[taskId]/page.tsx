import { HydrationBoundary } from '@tanstack/react-query';
import { requireTask, workspaceState } from '@/lib/api/server';
import { TaskPage } from '@/components/task/task-page';
type Props = { params: Promise<{ workspaceId: string; taskId: string }> };
export const generateMetadata = async ({ params }: Props) => {
  const p = await params;
  const task = await requireTask(p.workspaceId, p.taskId);
  return { title: `${task.key} — ${task.title}` };
};
const Page = async ({ params }: Props) => {
  const p = await params;
  await requireTask(p.workspaceId, p.taskId);
  return (
    <HydrationBoundary state={await workspaceState(p.workspaceId)}>
      <TaskPage reference={p.taskId} modal={false} />
    </HydrationBoundary>
  );
};
export default Page;
