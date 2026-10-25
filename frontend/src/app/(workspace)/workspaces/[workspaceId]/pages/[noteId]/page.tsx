import { notFound } from 'next/navigation';
import { getWorkspace } from '@/lib/api/server';
import { NotePage } from '@/app/(workspace)/workspaces/[workspaceId]/pages/[noteId]/_components/note-page';
type Props = { params: Promise<{ workspaceId: string; noteId: string }> };
export const generateMetadata = async ({ params }: Props) => {
  const p = await params;
  const seed = await getWorkspace(p.workspaceId);
  const note = seed.snapshot.data.notes.find((item) => item.id === p.noteId);
  return { title: note?.title ?? 'Страница не найдена' };
};
const Page = async ({ params }: Props) => {
  const p = await params;
  const seed = await getWorkspace(p.workspaceId);
  if (!seed.snapshot.data.notes.some((item) => item.id === p.noteId)) notFound();
  return <NotePage noteId={p.noteId} snapshot={seed.snapshot} />;
};
export default Page;
