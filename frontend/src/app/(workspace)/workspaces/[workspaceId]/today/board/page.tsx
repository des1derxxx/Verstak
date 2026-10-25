import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { BoardPanel } from '@/components/workspace/board-panel';
export const metadata = { title: 'Сегодня — Доска' };
const Page = () => (
  <WorkspaceOverview>
    <BoardPanel />
  </WorkspaceOverview>
);
export default Page;
