export const STORAGE_KEY = 'verstak.workspace.v1';
export const statuses = ['backlog', 'todo', 'progress', 'done'] as const;
export type Status = typeof statuses[number];
export type Priority = 'low' | 'medium' | 'high';
export type Project = { id: string; name: string; description: string; color: string };
export type Check = { id: string; text: string; done: boolean };
export type Task = {
  id: string; projectId: string; title: string; description: string;
  status: Status; priority: Priority; due: string; labels: string[];
  checklist: Check[]; createdAt: string;
};
export type Note = { id: string; projectId: string; title: string; body: string; updatedAt: string };
export type Workspace = { version: 1; projects: Project[]; tasks: Task[]; notes: Note[] };
export const statusNames: Record<Status, string> = {
  backlog: 'Идеи', todo: 'К работе', progress: 'В работе', done: 'Готово',
};
export const priorityNames: Record<Priority, string> = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
export const colors = ['#bb684a', '#657956', '#687f9e', '#9374a6', '#b28c43'];

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isDue(task: Task, today = localDate()): boolean {
  return task.status !== 'done' && Boolean(task.due) && task.due <= today;
}

export function moveTask(workspace: Workspace, id: string, status: Status): Workspace {
  if (!statuses.includes(status)) throw new Error('Неизвестный статус задачи');
  return { ...workspace, tasks: workspace.tasks.map(task => task.id === id ? { ...task, status } : task) };
}

export function seedWorkspace(): Workspace {
  const now = new Date().toISOString();
  const base = { projectId: 'verstak', description: '', due: '', checklist: [], createdAt: now };
  return {
    version: 1,
    projects: [{ id: 'verstak', name: 'Verstak', description: 'Место, где идеи становятся готовыми проектами.', color: colors[0] }],
    tasks: [
      { ...base, id: 'welcome-1', title: 'Собрать идеи для своего планировщика', status: 'backlog', priority: 'low', labels: ['Идея'], description: 'Что поможет тебе работать удобнее? Записывай сюда любые мысли.' },
      { ...base, id: 'welcome-2', title: 'Продумать структуру проектов', status: 'todo', priority: 'high', labels: ['Планирование'], description: 'Какие проекты ты хочешь вести в Verstak?', checklist: [{ id: 'check-1', text: 'Составить список текущих проектов', done: false }, { id: 'check-2', text: 'Выбрать первый проект', done: false }] },
      { ...base, id: 'welcome-3', title: 'Попробовать доску задач', status: 'progress', priority: 'medium', labels: ['Первый шаг'], description: 'Перетащи эту карточку в «Готово» или открой её и измени статус. Все примеры можно редактировать и удалять.' },
      { ...base, id: 'welcome-4', title: 'Выбрать название — Verstak', status: 'done', priority: 'medium', labels: ['Начало'] },
    ],
    notes: [{ id: 'welcome-note', projectId: 'verstak', title: 'С чего всё начинается', body: '# Привет, это твой Verstak\n\nЗдесь можно собирать идеи, планировать работу и хранить контекст проекта.\n\n## Как начать\n\n- Создай свой проект кнопкой «+» в боковом меню.\n- Добавь первую задачу и выбери её приоритет.\n- Перетаскивай карточки между колонками.\n- Записывай решения и идеи в заметки.\n\nЗадачи на доске — примеры. Их можно менять и удалять. Данные сохраняются в этом браузере. Для резервной копии используй экспорт внизу бокового меню.', updatedAt: now }],
  };
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string';
const date = (value: unknown): value is string => string(value) && (value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value);
const timestamp = (value: unknown): value is string => string(value) && !Number.isNaN(Date.parse(value));

export function parseWorkspace(value: unknown): Workspace {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.projects) || !Array.isArray(value.tasks) || !Array.isArray(value.notes)) throw new Error('Это не резервная копия Verstak версии 1.');
  const ids = new Set<string>();
  const unique = (id: unknown) => { if (!string(id) || !id.trim() || ids.has(id)) return false; ids.add(id); return true; };
  for (const p of value.projects) {
    if (!record(p) || !unique(p.id) || !string(p.name) || !p.name.trim() || !string(p.description) || !string(p.color) || !/^#[0-9a-f]{6}$/i.test(p.color)) throw new Error('Некорректные данные проекта.');
  }
  const projectIds = new Set(value.projects.map((p: Project) => p.id));
  for (const t of value.tasks) {
    if (!record(t) || !unique(t.id) || !projectIds.has(t.projectId as string) || !string(t.title) || !t.title.trim() || !string(t.description) || !statuses.includes(t.status as Status) || !['low', 'medium', 'high'].includes(t.priority as string) || !date(t.due) || !timestamp(t.createdAt) || !Array.isArray(t.labels) || !t.labels.every(string) || !Array.isArray(t.checklist)) throw new Error('Некорректные данные задачи.');
    const checks = new Set<string>();
    for (const c of t.checklist) {
      if (!record(c) || !string(c.id) || !c.id.trim() || checks.has(c.id) || !string(c.text) || typeof c.done !== 'boolean') throw new Error('Некорректный чеклист.');
      checks.add(c.id);
    }
  }
  for (const n of value.notes) {
    if (!record(n) || !unique(n.id) || !projectIds.has(n.projectId as string) || !string(n.title) || !n.title.trim() || !string(n.body) || !timestamp(n.updatedAt)) throw new Error('Некорректные данные заметки.');
  }
  return value as unknown as Workspace;
}
