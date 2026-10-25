import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { BoardPanel } from '@/components/workspace/board-panel';
import { BacklogPanel } from '@/components/workspace/backlog-panel';
import { ListPanel } from '@/components/workspace/list-panel';
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
