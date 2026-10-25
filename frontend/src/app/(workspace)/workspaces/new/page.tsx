import { requireSession } from '@/shared/api/server';
import { NewWorkspace } from '@/features/workspaces/NewWorkspace';
export const metadata = { title: 'Новое пространство' };
const Page = async () => {
  const session = await requireSession();
  return <NewWorkspace csrf={session.csrf} />;
};
export default Page;
