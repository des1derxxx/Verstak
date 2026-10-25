import { notFound } from 'next/navigation';
import { HydrationBoundary } from '@tanstack/react-query';
import { getWorkspace, workspaceState } from '@/lib/api/server';
import { NotePage } from '@/app/(workspace)/workspaces/[workspaceId]/pages/[noteId]/_components/note-page';
type Props = { params: Promise<{ workspaceId: string; noteId: string }> };
const findNote = async ({ params }: Props) => {
  const p = await params;
  const seed = await getWorkspace(p.workspaceId);
  return seed.snapshot.data.notes.find((item) => item.id === p.noteId);
};
export const generateMetadata = async (props: Props) => ({
  title: (await findNote(props))?.title ?? 'Страница не найдена',
});
const Page = async (props: Props) => {
  const p = await props.params;
  if (!(await findNote(props))) notFound();
  return (
    <HydrationBoundary state={await workspaceState(p.workspaceId)}>
      <NotePage noteId={p.noteId} />
    </HydrationBoundary>
  );
};
export default Page;
