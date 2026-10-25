import { WorkspaceOverview } from '@/features/workspaces/WorkspaceOverview';
import { NotesPanel } from '@/features/workspaces/components/NotesPanel';
export const metadata = { title: 'Страницы' };
const Page = () => (
  <WorkspaceOverview>
    <NotesPanel />
  </WorkspaceOverview>
);
export default Page;
