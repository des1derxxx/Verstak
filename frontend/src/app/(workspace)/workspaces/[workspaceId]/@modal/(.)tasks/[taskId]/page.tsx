import { getWorkspace, requireTask } from '@/lib/api/server';
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
  const seed = await getWorkspace(p.workspaceId);
  return <TaskPage reference={p.taskId} snapshot={seed.snapshot} modal={true} />;
};
export default Page;
