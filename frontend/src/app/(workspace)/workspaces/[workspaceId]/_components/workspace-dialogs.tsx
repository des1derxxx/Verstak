'use client';

import dynamic from 'next/dynamic';
import { PageLoading } from '@/components/ui/page-loading';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/modal';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
import {
  useNoteActions,
  useProjectActions,
  useTaskActions,
} from '@/lib/workspace/use-workspace-actions';
import { useTaskView } from '@/lib/workspace/workspace-location';
import { useMembers } from '@/queries/members';
import { useRefreshWorkspace } from '@/queries/workspace';
const EditorLoading = () => {
  const { closeDialog } = useWorkspaceUi();
  return (
    <Modal title="Открываем редактор" onClose={closeDialog}>
      <PageLoading label="Загружаем…" />
    </Modal>
  );
};
const TaskEditor = dynamic(
  () => import('@/components/task/task-editor/task-editor').then((module) => module.TaskEditor),
  { loading: EditorLoading },
);
const NoteForm = dynamic(
  () => import('@/components/note/note-form').then((module) => module.NoteForm),
  { loading: EditorLoading },
);
const ProjectForm = dynamic(
  () => import('@/components/project/project-form').then((module) => module.ProjectForm),
  { loading: EditorLoading },
);
export const WorkspaceDialogs = () => {
  const { info } = useWorkspace();
  const { dialog, closeDialog } = useWorkspaceUi();
  const { workspace, projects, scope } = useTaskView();
  const { members, error: membersError } = useMembers();
  const refresh = useRefreshWorkspace();
  const tasks = useTaskActions();
  const projectActions = useProjectActions();
  const notes = useNoteActions();
  const closeOn = (done: boolean) => {
    if (done) closeDialog();
  };
  return (
    <>
      {dialog?.kind === 'task' && projects.length > 0 && (
        <TaskEditor
          key={dialog.task?.id ?? dialog.seed?.id ?? 'new'}
          seed={dialog.seed}
          tasks={workspace.tasks}
          members={members}
          membersError={membersError}
          workspaceId={info.id}
          onActivity={refresh}
          onOpenTask={tasks.openTask}
          onSubtask={tasks.newSubtask}
          task={dialog.task}
          status={dialog.status}
          projects={projects}
          projectId={scope}
          today={scope === 'today'}
          onClose={closeDialog}
          onSave={tasks.saveTask}
          onDelete={tasks.deleteTask}
        />
      )}
      {dialog?.kind === 'project' && (
        <ProjectForm
          project={dialog.project}
          onClose={closeDialog}
          onSave={async (project) => closeOn(await projectActions.saveProject(project))}
          onDelete={async (id) => closeOn(await projectActions.deleteProject(id))}
        />
      )}
      {dialog?.kind === 'note' && projects.length > 0 && (
        <NoteForm
          note={dialog.note}
          projects={projects}
          projectId={scope}
          onClose={closeDialog}
          onSave={async (note) => closeOn(await notes.saveNote(note))}
          onDelete={async (id) => closeOn(await notes.deleteNote(id))}
        />
      )}
      {dialog?.kind === 'shortcuts' && (
        <Modal title="Сочетания клавиш" onClose={closeDialog}>
          <div
            className={cn(
              'shortcuts-list py-5 px-6 [&>p]:text-xs [&>p]:leading-5 [&>p]:text-muted [&>p]:mb-3.75',
              '[&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-5 [&>div]:py-3.25',
              '[&>div]:px-0 [&>div]:text-xs [&>div]:border-b [&>div]:border-neutral',
              '[&>div>span:last-child]:whitespace-nowrap max-phone:py-4.25 max-phone:px-5',
              'max-phone:[&>div]:gap-3 max-phone:[&>div]:text-caption',
            )}
          >
            <p>Работают, когда курсор находится вне поля ввода.</p>
            <div>
              <span>Создать задачу</span>
              <kbd>C</kbd>
            </div>
            <div>
              <span>Перейти к поиску</span>
              <span>
                <kbd>/</kbd> или <kbd>⌘ / Ctrl</kbd> + <kbd>K</kbd>
              </span>
            </div>
            <div>
              <span>Сохранить задачу в редакторе</span>
              <span>
                <kbd>⌘ / Ctrl</kbd> + <kbd>Enter</kbd>
              </span>
            </div>
            <div>
              <span>Закрыть окно или отменить быстрый ввод</span>
              <kbd>Esc</kbd>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
