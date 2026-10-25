'use client';

import { NoteForm } from '@/components/note/note-form';
import { sortProjects } from '@/lib/model/task';
import { useNavigation } from '@/lib/navigation-guard';
import { viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useNoteActions } from '@/lib/workspace/use-workspace-actions';
import { useWorkspaceData } from '@/queries/workspace';
export const NotePage = ({ noteId }: { noteId: string }) => {
  const { info } = useWorkspace();
  const { navigate } = useNavigation();
  const { workspace } = useWorkspaceData();
  const { saveNote, deleteNote } = useNoteActions();
  const note = workspace.notes.find((item) => item.id === noteId);
  const close = () =>
    navigate(viewPath(info.id, note?.projectId ?? 'all', 'notes'), { discard: true });
  if (!note) return <h1>Страница удалена или недоступна</h1>;
  return (
    <NoteForm
      key={note.id}
      inline
      note={note}
      projects={sortProjects(workspace.projects)}
      projectId={note.projectId}
      onClose={close}
      onSave={async (next) => {
        if (await saveNote(next)) close();
      }}
      onDelete={async (id) => {
        if (await deleteNote(id)) close();
      }}
    />
  );
};
