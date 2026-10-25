import { requireSession } from '@/lib/api/server';
import { NewWorkspaceForm } from '@/app/(workspace)/workspaces/new/_components/new-workspace-form';
export const metadata = { title: 'Новое пространство' };
const Page = async () => {
  const session = await requireSession();
  return <NewWorkspaceForm csrf={session.csrf} />;
};
export default Page;
