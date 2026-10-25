import { getSession, getSpaces } from '@/shared/api/server';
import { EntryRedirect } from '@/application/EntryRedirect';
import { viewPath } from '@/shared/lib/routes';
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
