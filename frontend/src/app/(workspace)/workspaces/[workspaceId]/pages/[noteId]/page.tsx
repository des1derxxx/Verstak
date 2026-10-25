import { notFound } from 'next/navigation';
import { getWorkspace } from '@/shared/api/server';
import { NoteRoute } from '@/features/notes/NoteRoute';
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
  return <NoteRoute noteId={p.noteId} snapshot={seed.snapshot} />;
};
export default Page;
