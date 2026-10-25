import { getSession } from '@/shared/api/server';
import { InviteScreen } from '@/features/account/InviteScreen';
export const metadata = { title: 'Приглашение' };
const Page = async () => <InviteScreen session={await getSession()} />;
export default Page;
