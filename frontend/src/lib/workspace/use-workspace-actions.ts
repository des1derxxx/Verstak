'use client';

import { useNavigation } from '@/lib/navigation-guard';
import { createTask, emptyFilters, filterTasks } from '@/lib/model/task';
import type { Note, Project, Status, Task } from '@/lib/model/workspace';
import { taskPath, viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
import { useTaskFilters, useWorkspaceLocation } from '@/lib/workspace/workspace-location';
import { useCommitWorkspace, useWorkspaceData } from '@/queries/workspace';
const upsert = <T extends { id: string }>(items: T[], item: T) =>
  items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [...items, item];
export const useTaskActions = () => {
  const commit = useCommitWorkspace();
  const { info, readOnly } = useWorkspace();
  const { openDialog, notify } = useWorkspaceUi();
  const { navigate } = useNavigation();
  const { workspace, loading } = useWorkspaceData();
  const { view } = useWorkspaceLocation();
  const { filters, setFilters } = useTaskFilters();
  const saveTask = async (task: Task): Promise<boolean> => {
    const original = workspace.tasks.find((item) => item.id === task.id);
    // Completing a task always goes through the editor to collect a resolution.
    if (task.status === 'done' && original?.status !== 'done' && !task.resolutionComment?.trim()) {
      openDialog({
        kind: 'task',
        task: original,
        seed: original ? undefined : task,
        status: 'done',
      });
      return false;
    }
    if (!(await commit((current) => ({ ...current, tasks: upsert(current.tasks, task) }))))
      return false;
    if (!original && !filterTasks(workspace, [task], filters).length) {
      setFilters((previous) => ({ ...emptyFilters, sort: previous.sort }));
      notify('Задача создана. Фильтры сброшены, чтобы показать её.');
    } else notify(original ? 'Задача обновлена' : 'Задача создана');
    return true;
  };
  const deleteTask = async (id: string) => {
    const deleted = await commit((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
    }));
    if (deleted) notify('Задача удалена');
    return deleted;
  };
  return {
    saveTask,
    deleteTask,
    openTask: (task: Task) => navigate(taskPath(info.id, task.key ?? task.id)),
    newTask: (status?: Status) => {
      if (readOnly || loading) return;
      openDialog(
        workspace.projects.length
          ? { kind: 'task', status: status ?? (view === 'backlog' ? 'backlog' : 'todo') }
          : { kind: 'project' },
      );
    },
    newSubtask: (parent: Task) =>
      openDialog({ kind: 'task', seed: { ...createTask(parent.projectId), parentId: parent.id } }),
  };
};
export const useProjectActions = () => {
  const commit = useCommitWorkspace();
  const { info } = useWorkspace();
  const { notify } = useWorkspaceUi();
  const { navigate } = useNavigation();
  const { workspace } = useWorkspaceData();
  return {
    saveProject: async (project: Project) => {
      const exists = workspace.projects.some((item) => item.id === project.id);
      const saved = await commit((current) => ({
        ...current,
        projects: upsert(current.projects, project),
      }));
      if (saved) {
        notify(exists ? 'Проект обновлён' : 'Проект создан');
        navigate(viewPath(info.id, project.id));
      }
      return saved;
    },
    deleteProject: async (id: string) => {
      const deleted = await commit((current) => ({
        ...current,
        projects: current.projects.filter((project) => project.id !== id),
        tasks: current.tasks.filter((task) => task.projectId !== id),
        notes: current.notes.filter((note) => note.projectId !== id),
      }));
      if (deleted) {
        notify('Проект удалён');
        navigate(viewPath(info.id));
      }
      return deleted;
    },
  };
};
export const useNoteActions = () => {
  const commit = useCommitWorkspace();
  const { readOnly } = useWorkspace();
  const { openDialog, notify } = useWorkspaceUi();
  const { workspace } = useWorkspaceData();
  return {
    newNote: () => {
      if (!readOnly) openDialog(workspace.projects.length ? { kind: 'note' } : { kind: 'project' });
    },
    saveNote: async (note: Note) => {
      const saved = await commit((current) => ({ ...current, notes: upsert(current.notes, note) }));
      if (saved) notify('Страница сохранена');
      return saved;
    },
    deleteNote: async (id: string) => {
      const deleted = await commit((current) => ({
        ...current,
        notes: current.notes.filter((note) => note.id !== id),
      }));
      if (deleted) notify('Страница удалена');
      return deleted;
    },
  };
};
// Settings and detail pages close back to the workspace board without asking twice.
export const useBackToWorkspace = () => {
  const { info } = useWorkspace();
  const { navigate } = useNavigation();
  return () => navigate(viewPath(info.id), { discard: true });
};
