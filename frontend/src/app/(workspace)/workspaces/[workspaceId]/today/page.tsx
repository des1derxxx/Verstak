import { WorkspaceOverview } from '@/features/workspaces/WorkspaceOverview';
import { BoardPanel } from '@/features/workspaces/components/BoardPanel';
import { BacklogPanel } from '@/features/workspaces/components/BacklogPanel';
import { ListPanel } from '@/features/workspaces/components/ListPanel';
export const metadata = { title: 'Сегодня' };
const Page = async ({ searchParams }: { searchParams: Promise<{ view?: string }> }) => {
  const { view } = await searchParams;
  return (
    <WorkspaceOverview>
      {view === 'board' ? <BoardPanel /> : view === 'backlog' ? <BacklogPanel /> : <ListPanel />}
    </WorkspaceOverview>
  );
};
export default Page;
