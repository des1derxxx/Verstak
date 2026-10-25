import { isDue, localDate, statusIndex } from '@/lib/model/workspace.ts';
import type { Note, Priority, Project, Status, Task, Workspace } from '@/lib/model/workspace.ts';
export type View = 'board' | 'backlog' | 'list' | 'notes';
// 'all', 'today' or a project ID.
export type Scope = string;
export type Sort = 'created' | 'priority' | 'due';
export type Filters = {
  query: string;
  priority: string;
  status: string;
  sort: Sort;
};
export const emptyFilters: Filters = { query: '', priority: 'all', status: 'all', sort: 'created' };
export const hasActiveFilters = (filters: Filters): boolean =>
  Boolean(filters.query.trim() || filters.priority !== 'all' || filters.status !== 'all');
const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
export const taskKey = (task: Task): string => {
  return task.key || `#${task.id.replaceAll('-', '').slice(0, 8).toUpperCase()}`;
};
export const createTask = (
  projectId: string,
  title = '',
  status: Status = 'todo',
  today = false,
): Task => {
  return {
    id: crypto.randomUUID(),
    projectId,
    title: title.trim(),
    description: '',
    status,
    priority: 'medium',
    due: today ? localDate() : '',
    labels: [],
    checklist: [],
    createdAt: new Date().toISOString(),
  };
};
export const scopeTasks = (workspace: Workspace, scope: Scope, today = localDate()): Task[] => {
  if (scope === 'today') {
    const index = statusIndex(workspace.projects);
    return workspace.tasks.filter((task) => isDue(task, today, index));
  }
  if (scope === 'all') return workspace.tasks;
  return workspace.tasks.filter((task) => task.projectId === scope);
};
export const filterTasks = (workspace: Workspace, tasks: Task[], filters: Filters): Task[] => {
  const query = filters.query.trim().toLocaleLowerCase('ru');
  const projects = new Map(workspace.projects.map((project) => [project.id, project.name]));
  const index = statusIndex(workspace.projects);
  return tasks
    .filter(
      (task) =>
        (filters.priority === 'all' || task.priority === filters.priority) &&
        // In a project the filter names a column; across projects it names a stage.
        (filters.status === 'all' ||
          task.status === filters.status ||
          index.category(task) === filters.status) &&
        (!query ||
          [
            task.title,
            task.description,
            task.id,
            taskKey(task),
            ...task.labels,
            projects.get(task.projectId),
          ]
            .join(' ')
            .toLocaleLowerCase('ru')
            .includes(query)),
    )
    .sort((a, b) => {
      if (filters.sort === 'priority') {
        const difference = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (difference) return difference;
      }
      if (filters.sort === 'due') {
        // A missing deadline belongs after every scheduled task.
        const difference = (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31');
        if (difference) return difference;
      }
      return Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id);
    });
};
export const sortProjects = (projects: Project[]): Project[] =>
  [...projects].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
export const filterNotes = (
  notes: Note[],
  projectId: string | undefined,
  query: string,
): Note[] => {
  const needle = query.trim().toLocaleLowerCase('ru');
  return notes
    .filter(
      (note) =>
        (!projectId || note.projectId === projectId) &&
        (!needle || `${note.title} ${note.body}`.toLocaleLowerCase('ru').includes(needle)),
    )
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
};
export const isTypingTarget = (target: EventTarget | null): boolean => {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'input,textarea,[role="combobox"],[role="listbox"],[contenteditable="true"],[role="textbox"]',
      ),
    )
  );
};
export const dueLabel = (value: string, today = localDate()): string => {
  if (value === today) return 'Сегодня';
  return new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' }).format(
    new Date(`${value}T12:00:00`),
  );
};
