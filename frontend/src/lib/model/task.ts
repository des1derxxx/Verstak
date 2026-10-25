import { isDue, localDate } from '@/lib/model/workspace.ts';
import type { Priority, Status, Task, Workspace } from '@/lib/model/workspace.ts';
export type View = 'board' | 'backlog' | 'list' | 'notes';
export type Sort = 'created' | 'priority' | 'due';
export type Filters = {
  query: string;
  priority: string;
  status: string;
  sort: Sort;
};
export const emptyFilters: Filters = { query: '', priority: 'all', status: 'all', sort: 'created' };
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
export const scopeTasks = (workspace: Workspace, selected: string, today = localDate()): Task[] => {
  if (selected === 'today') return workspace.tasks.filter((task) => isDue(task, today));
  if (selected === 'all') return workspace.tasks;
  return workspace.tasks.filter((task) => task.projectId === selected);
};
export const filterTasks = (workspace: Workspace, tasks: Task[], filters: Filters): Task[] => {
  const query = filters.query.trim().toLocaleLowerCase('ru');
  const projects = new Map(workspace.projects.map((project) => [project.id, project.name]));
  return tasks
    .filter(
      (task) =>
        (filters.priority === 'all' || task.priority === filters.priority) &&
        (filters.status === 'all' || task.status === filters.status) &&
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
