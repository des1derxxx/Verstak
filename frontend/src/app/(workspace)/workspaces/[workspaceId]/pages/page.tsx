import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { NotesPanel } from '@/components/workspace/notes-panel';
export const metadata = { title: 'Страницы' };
const Page = () => (
  <WorkspaceOverview>
    <NotesPanel />
  </WorkspaceOverview>
);
export default Page;
