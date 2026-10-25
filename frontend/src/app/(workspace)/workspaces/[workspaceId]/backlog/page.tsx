import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { BacklogPanel } from '@/components/workspace/backlog-panel';
export const metadata = { title: 'Бэклог' };
const Page = () => (
  <WorkspaceOverview>
    <BacklogPanel />
  </WorkspaceOverview>
);
export default Page;
