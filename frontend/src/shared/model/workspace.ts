export const statuses = ['backlog', 'todo', 'progress', 'done'] as const;
export type Status = (typeof statuses)[number];
export type Priority = 'low' | 'medium' | 'high';
export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  key?: string | null;
};
export type Check = {
  id: string;
  text: string;
  done: boolean;
};
export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due: string;
  labels: string[];
  checklist: Check[];
  createdAt: string;
  key?: string | null;
  revision?: number;
  parentId?: string | null;
  assigneeId?: string | null;
  type?: 'task' | 'bug' | 'story';
  links?: {
    url: string;
    label: string;
    kind: 'pr' | 'commit' | 'reference';
  }[];
  createdById?: string | null;
  updatedAt?: string | null;
  resolutionComment?: string | null;
};
export type Note = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  updatedAt: string;
};
export type Workspace = {
  version: 1;
  projects: Project[];
  tasks: Task[];
  notes: Note[];
};
export const statusNames: Record<Status, string> = {
  backlog: 'Бэклог',
  todo: 'К выполнению',
  progress: 'В работе',
  done: 'Готово',
};
export const priorityNames: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};
export const colors = ['#0c66e4', '#6e5dc6', '#1f845a', '#c9372c', '#946f00'];
export const localDate = (date = new Date()): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const isDue = (task: Task, today = localDate()): boolean => {
  return task.status !== 'done' && Boolean(task.due) && task.due <= today;
};
export const moveTask = (workspace: Workspace, id: string, status: Status): Workspace => {
  if (!statuses.includes(status)) throw new Error('Неизвестный статус задачи');
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) => (task.id === id ? { ...task, status } : task)),
  };
};
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string';
const date = (value: unknown): value is string =>
  string(value) &&
  (value === '' ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value));
const timestamp = (value: unknown): value is string =>
  string(value) && !Number.isNaN(Date.parse(value));
export const parseWorkspace = (value: unknown): Workspace => {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.notes)
  )
    throw new Error('Это не резервная копия Verstak версии 1.');
  const ids = new Set<string>();
  const unique = (id: unknown) => {
    if (!string(id) || !id.trim() || ids.has(id)) return false;
    ids.add(id);
    return true;
  };
  for (const p of value.projects) {
    if (
      !record(p) ||
      !unique(p.id) ||
      !string(p.name) ||
      !p.name.trim() ||
      !string(p.description) ||
      !string(p.color) ||
      !/^#[0-9a-f]{6}$/i.test(p.color)
    )
      throw new Error('Некорректные данные проекта.');
  }
  const projectIds = new Set(value.projects.map((p: Project) => p.id));
  for (const t of value.tasks) {
    if (
      !record(t) ||
      !unique(t.id) ||
      !projectIds.has(t.projectId as string) ||
      !string(t.title) ||
      !t.title.trim() ||
      !string(t.description) ||
      !statuses.includes(t.status as Status) ||
      !['low', 'medium', 'high'].includes(t.priority as string) ||
      !date(t.due) ||
      !timestamp(t.createdAt) ||
      !Array.isArray(t.labels) ||
      !t.labels.every(string) ||
      !Array.isArray(t.checklist)
    )
      throw new Error('Некорректные данные задачи.');
    const checks = new Set<string>();
    for (const c of t.checklist) {
      if (
        !record(c) ||
        !string(c.id) ||
        !c.id.trim() ||
        checks.has(c.id) ||
        !string(c.text) ||
        typeof c.done !== 'boolean'
      )
        throw new Error('Некорректный чеклист.');
      checks.add(c.id);
    }
  }
  const tasks = new Map(value.tasks.map((t: Task) => [t.id, t]));
  for (const t of value.tasks as Task[]) {
    if (
      (t.key && !/^[A-Z][A-Z0-9]{1,9}-[1-9]\d*$/.test(t.key)) ||
      (t.type && !['task', 'bug', 'story'].includes(t.type)) ||
      (t.revision !== undefined && (!Number.isInteger(t.revision) || t.revision < 0))
    )
      throw new Error('Некорректные поля задачи.');
    if (
      t.links &&
      (!Array.isArray(t.links) ||
        t.links.some(
          (link) =>
            !link ||
            typeof link.url !== 'string' ||
            !/^https?:\/\//i.test(link.url) ||
            !['pr', 'commit', 'reference'].includes(link.kind),
        ))
    )
      throw new Error('Некорректные ссылки задачи.');
    let parent = t.parentId;
    const seen = new Set([t.id]);
    while (parent) {
      const item = tasks.get(parent) as Task | undefined;
      if (!item || item.projectId !== t.projectId || seen.has(parent) || seen.size >= 32)
        throw new Error('Некорректные связи подзадач.');
      seen.add(parent);
      parent = item.parentId;
    }
  }
  for (const n of value.notes) {
    if (
      !record(n) ||
      !unique(n.id) ||
      !projectIds.has(n.projectId as string) ||
      !string(n.title) ||
      !n.title.trim() ||
      !string(n.body) ||
      !timestamp(n.updatedAt)
    )
      throw new Error('Некорректные данные заметки.');
  }
  return value as unknown as Workspace;
};
