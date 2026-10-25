import { WorkspaceOverview } from '@/features/workspaces/WorkspaceOverview';
import { ListPanel } from '@/features/workspaces/components/ListPanel';
export const metadata = { title: 'Список задач' };
const Page = () => (
  <WorkspaceOverview>
    <ListPanel />
  </WorkspaceOverview>
);
export default Page;
