export const categories = ['backlog', 'todo', 'progress', 'done'] as const;
// Every column belongs to one of these stages; workflow rules (resolution, Today, backlog) use it.
export type StatusCategory = (typeof categories)[number];
// A column id from the task's project.
export type Status = string;
export type ProjectStatus = { id: Status; name: string; category: StatusCategory };
export type Priority = 'low' | 'medium' | 'high';
export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  key?: string | null;
  statuses?: ProjectStatus[] | null;
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
export const categoryNames: Record<StatusCategory, string> = {
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
// Projects without their own columns use these; the ids match the categories.
export const defaultStatuses: ProjectStatus[] = categories.map((category) => ({
  id: category,
  name: categoryNames[category],
  category,
}));
export const projectStatuses = (project?: Pick<Project, 'statuses'> | null): ProjectStatus[] =>
  project?.statuses?.length ? project.statuses : defaultStatuses;
const unknownStatus = (id: Status): ProjectStatus => ({ id, name: id, category: 'todo' });
export type StatusIndex = ReturnType<typeof statusIndex>;
// Looks up columns by project, so views can mix tasks from projects with different workflows.
export const statusIndex = (projects: Pick<Project, 'id' | 'statuses'>[]) => {
  const byProject = new Map(projects.map((project) => [project.id, projectStatuses(project)]));
  const list = (projectId?: string) => byProject.get(projectId ?? '') ?? defaultStatuses;
  const of = (task: Pick<Task, 'projectId' | 'status'>) =>
    list(task.projectId).find((status) => status.id === task.status) ??
    defaultStatuses.find((status) => status.id === task.status) ??
    unknownStatus(task.status);
  return {
    list,
    of,
    category: (task: Pick<Task, 'projectId' | 'status'>) => of(task).category,
    // Keeps a status the project has, otherwise picks its first column of the same stage.
    resolve: (projectId: string, wanted: Status | StatusCategory = 'todo'): Status => {
      const statuses = list(projectId);
      if (statuses.some((status) => status.id === wanted)) return wanted;
      const category = categories.includes(wanted as StatusCategory) ? wanted : 'todo';
      return (
        statuses.find((status) => status.category === category) ??
        statuses.find((status) => status.category === 'todo')!
      ).id;
    },
  };
};
export const isDue = (
  task: Task,
  today = localDate(),
  index: StatusIndex = statusIndex([]),
): boolean => {
  return index.category(task) !== 'done' && Boolean(task.due) && task.due <= today;
};
export const moveTask = (workspace: Workspace, id: string, status: Status): Workspace => {
  const task = workspace.tasks.find((item) => item.id === id);
  const project = workspace.projects.find((item) => item.id === task?.projectId);
  if (!projectStatuses(project).some((item) => item.id === status))
    throw new Error('Неизвестный статус задачи');
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
const validStatuses = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length >= 2 &&
  value.length <= 20 &&
  value.every(
    (item) =>
      record(item) &&
      string(item.id) &&
      /^[a-zA-Z0-9_-]{1,40}$/.test(item.id) &&
      string(item.name) &&
      Boolean(item.name.trim()) &&
      categories.includes(item.category as StatusCategory),
  ) &&
  new Set(value.map((item) => item.id)).size === value.length &&
  ['todo', 'done'].every((category) => value.some((item) => item.category === category));
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
      !/^#[0-9a-f]{6}$/i.test(p.color) ||
      !(p.statuses == null || validStatuses(p.statuses))
    )
      throw new Error('Некорректные данные проекта.');
  }
  const projectIds = new Set(value.projects.map((p: Project) => p.id));
  const columns = new Map(
    value.projects.map((p: Project) => [p.id, new Set(projectStatuses(p).map((item) => item.id))]),
  );
  for (const t of value.tasks) {
    if (
      !record(t) ||
      !unique(t.id) ||
      !projectIds.has(t.projectId as string) ||
      !string(t.title) ||
      !t.title.trim() ||
      !string(t.description) ||
      !columns.get(t.projectId as string)?.has(t.status as string) ||
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
