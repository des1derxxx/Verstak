import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { ListPanel } from '@/components/workspace/list-panel';
export const metadata = { title: 'Сегодня' };
const Page = () => (
  <WorkspaceOverview>
    <ListPanel />
  </WorkspaceOverview>
);
export default Page;
