import { WorkspaceOverview } from '@/features/workspaces/WorkspaceOverview';
import { BoardPanel } from '@/features/workspaces/components/BoardPanel';
export const metadata = { title: 'Доска' };
const Page = () => (
  <WorkspaceOverview>
    <BoardPanel />
  </WorkspaceOverview>
);
export default Page;
