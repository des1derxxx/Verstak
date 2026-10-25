import { getSession, getSpaces } from '@/lib/api/server';
import { EntryRedirect } from '@/app/_components/entry-redirect';
import { viewPath } from '@/lib/routes';
const Home = async () => {
  const session = await getSession();
  const spaces = session ? await getSpaces() : [];
  return (
    <EntryRedirect
      destination={session ? (spaces[0] ? viewPath(spaces[0].id) : '/workspaces/new') : '/login'}
    />
  );
};
export default Home;
