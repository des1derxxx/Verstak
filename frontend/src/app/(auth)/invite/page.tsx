import { getSession } from '@/lib/api/server';
import { InviteScreen } from '@/app/(auth)/invite/_components/invite-screen';
export const metadata = { title: 'Приглашение' };
const Page = async () => <InviteScreen session={await getSession()} />;
export default Page;
