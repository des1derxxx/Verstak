'use client';

import { useEffect } from 'react';
import type { Snapshot } from '@/shared/api/types';
import { useWorkspace } from '@/features/workspaces/WorkspaceContext';
import { NoteForm } from '@/features/notes/NoteForm';
import { viewPath } from '@/shared/lib/routes';
export const NoteRoute = ({ noteId, snapshot }: { noteId: string; snapshot: Snapshot }) => {
  const model = useWorkspace();
  useEffect(() => {
    model.receive(snapshot);
  }, [snapshot]);
  const workspace = snapshot.revision > model.revision ? snapshot.data : model.workspace;
  const note = workspace.notes.find((item) => item.id === noteId);
  const close = () =>
    model.navigate(viewPath(model.info.id, note?.projectId ?? 'all', 'notes'), { discard: true });
  if (!note) return <h1>Страница удалена или недоступна</h1>;
  return (
    <NoteForm
      key={note.id}
      inline
      note={note}
      projects={model.sortedProjects}
      projectId={note.projectId}
      onClose={close}
      onSave={async (next) => {
        if (
          await model.commit(
            {
              ...model.workspace,
              notes: model.workspace.notes.map((item) => (item.id === next.id ? next : item)),
            },
            'Страница сохранена',
          )
        )
          close();
      }}
      onDelete={async (id) => {
        if (
          await model.commit(
            { ...model.workspace, notes: model.workspace.notes.filter((item) => item.id !== id) },
            'Страница удалена',
          )
        )
          close();
      }}
    />
  );
};
