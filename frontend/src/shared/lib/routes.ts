import type { Filters, View } from '@/features/tasks/task-view';
import { emptyFilters } from '@/features/tasks/task-view';
export const workspacePath = (id: string) => `/workspaces/${encodeURIComponent(id)}`;
export const viewPath = (id: string, selected = 'all', view: View = 'board') => {
  const base = workspacePath(id);
  if (selected === 'today')
    return `${base}/today${view === 'list' ? '' : `?view=${view === 'notes' ? 'list' : view}`}`;
  const scope = selected === 'all' ? base : `${base}/projects/${encodeURIComponent(selected)}`;
  return `${scope}/${view === 'notes' ? 'pages' : view}`;
};
export const taskPath = (id: string, task: string) =>
  `${workspacePath(id)}/tasks/${encodeURIComponent(task)}`;
export const safeReturnPath = (path?: string | null) => {
  if (!path?.startsWith('/')) return '/';
  try {
    const base = 'https://verstak.local';
    const url = new URL(path, base);
    return url.origin === base ? url.pathname + url.search + url.hash : '/';
  } catch {
    return '/';
  }
};
export const readWorkspaceRoute = (pathname: string, search: URLSearchParams) => {
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const today = segments[2] === 'today';
  const selected = segments[2] === 'projects' ? (segments[3] ?? 'all') : today ? 'today' : 'all';
  const tail = today ? (search.get('view') ?? 'list') : segments.at(-1);
  const view: View =
    tail === 'pages'
      ? 'notes'
      : ['board', 'backlog', 'list'].includes(tail ?? '')
        ? (tail as View)
        : 'board';
  const filters: Filters = {
    query: search.get('q') ?? '',
    priority: ['low', 'medium', 'high'].includes(search.get('priority') ?? '')
      ? search.get('priority')!
      : 'all',
    status: ['backlog', 'todo', 'progress', 'done'].includes(search.get('status') ?? '')
      ? search.get('status')!
      : 'all',
    sort:
      search.get('sort') === 'priority'
        ? 'priority'
        : search.get('sort') === 'due'
          ? 'due'
          : 'created',
  };
  return { selected, view, filters };
};
export const filterSearch = (current: URLSearchParams, filters: Filters) => {
  const next = new URLSearchParams(current);
  for (const [field, key] of [
    ['query', 'q'],
    ['priority', 'priority'],
    ['status', 'status'],
    ['sort', 'sort'],
  ] as const) {
    if (filters[field] === emptyFilters[field]) next.delete(key);
    else next.set(key, filters[field]);
  }
  return next.toString();
};
