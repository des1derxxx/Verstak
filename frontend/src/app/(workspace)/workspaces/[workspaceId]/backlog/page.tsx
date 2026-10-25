import { WorkspaceOverview } from '@/features/workspaces/WorkspaceOverview';
import { BacklogPanel } from '@/features/workspaces/components/BacklogPanel';
export const metadata = { title: 'Бэклог' };
const Page = () => (
  <WorkspaceOverview>
    <BacklogPanel />
  </WorkspaceOverview>
);
export default Page;
