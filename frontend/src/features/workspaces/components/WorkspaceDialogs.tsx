import { createTask } from '../../tasks/task-view';
import type { WorkspaceController } from '../hooks/useWorkspaceController';
import { useWorkspace } from '../WorkspaceContext';
import dynamic from 'next/dynamic';
import { PageLoading } from '../../../shared/ui/PageLoading';
import { cn } from '../../../shared/ui/cn';
import { Modal } from '../../../shared/ui/Modal';
const EditorLoading = () => {
  const model = useWorkspace();
  return (
    <Modal title="Открываем редактор" onClose={() => model.setModal(null)}>
      <PageLoading label="Загружаем…" />
    </Modal>
  );
};
const TaskEditor = dynamic(
  () => import('../../tasks/task-editor/TaskEditor').then((module) => module.TaskEditor),
  { loading: EditorLoading },
);
const NoteForm = dynamic(() => import('../../notes/NoteForm').then((module) => module.NoteForm), {
  loading: EditorLoading,
});
const ProjectForm = dynamic(
  () => import('../../projects/ProjectForm').then((module) => module.ProjectForm),
  { loading: EditorLoading },
);
export const WorkspaceDialogs = ({ model }: { model: WorkspaceController }) => {
  const {
    modal,
    sortedProjects,
    workspace,
    members,
    membersError,
    info,
    refresh,
    openTask,
    setModal,
    selected,
    saveTask,
    commit,
    select,
  } = model;
  return (
    <>
      {modal?.kind === 'task' && sortedProjects.length > 0 && (
        <TaskEditor
          key={modal.task?.id ?? modal.seed?.id ?? 'new'}
          seed={modal.seed}
          tasks={workspace.tasks}
          members={members}
          membersError={membersError}
          workspaceId={info.id}
          onActivity={() => refresh()}
          onOpenTask={openTask}
          onSubtask={(parent) =>
            setModal({
              kind: 'task',
              seed: { ...createTask(parent.projectId), parentId: parent.id },
            })
          }
          task={modal.task}
          status={modal.status}
          projects={sortedProjects}
          projectId={selected}
          today={selected === 'today'}
          onClose={() => setModal(null)}
          onSave={saveTask}
          onDelete={(id) =>
            commit(
              { ...workspace, tasks: workspace.tasks.filter((task) => task.id !== id) },
              'Задача удалена',
            )
          }
        />
      )}
      {modal?.kind === 'project' && (
        <ProjectForm
          project={modal.project}
          onClose={() => setModal(null)}
          onSave={async (item) => {
            const exists = workspace.projects.some((project) => project.id === item.id);
            if (
              await commit(
                {
                  ...workspace,
                  projects: exists
                    ? workspace.projects.map((project) => (project.id === item.id ? item : project))
                    : [...workspace.projects, item],
                },
                exists ? 'Проект обновлён' : 'Проект создан',
              )
            ) {
              select(item.id);
              setModal(null);
            }
          }}
          onDelete={async (id) => {
            if (
              await commit(
                {
                  ...workspace,
                  projects: workspace.projects.filter((project) => project.id !== id),
                  tasks: workspace.tasks.filter((task) => task.projectId !== id),
                  notes: workspace.notes.filter((note) => note.projectId !== id),
                },
                'Проект удалён',
              )
            ) {
              select('all');
              setModal(null);
            }
          }}
        />
      )}
      {modal?.kind === 'note' && sortedProjects.length > 0 && (
        <NoteForm
          note={modal.note}
          projects={sortedProjects}
          projectId={selected}
          onClose={() => setModal(null)}
          onSave={async (note) => {
            if (
              await commit(
                {
                  ...workspace,
                  notes: workspace.notes.some((item) => item.id === note.id)
                    ? workspace.notes.map((item) => (item.id === note.id ? note : item))
                    : [...workspace.notes, note],
                },
                'Страница сохранена',
              )
            )
              setModal(null);
          }}
          onDelete={async (id) => {
            if (
              await commit(
                { ...workspace, notes: workspace.notes.filter((note) => note.id !== id) },
                'Страница удалена',
              )
            )
              setModal(null);
          }}
        />
      )}
      {modal?.kind === 'shortcuts' && (
        <Modal title="Сочетания клавиш" onClose={() => setModal(null)}>
          <div
            className={cn(
              'shortcuts-list py-5 px-6 [&>p]:text-xs [&>p]:leading-5 [&>p]:text-muted [&>p]:mb-[15px]',
              '[&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-5 [&>div]:py-[13px]',
              '[&>div]:px-0 [&>div]:text-xs [&>div]:border-b [&>div]:border-[#f1f2f4]',
              '[&>div>span:last-child]:whitespace-nowrap max-[520px]:py-[17px] max-[520px]:px-5',
              'max-[520px]:[&>div]:gap-3 max-[520px]:[&>div]:text-[11px]',
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
