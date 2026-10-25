import type { Filters, Scope, View } from '@/lib/model/task';
import { emptyFilters } from '@/lib/model/task';
export const workspacePath = (id: string) => `/workspaces/${encodeURIComponent(id)}`;
export const viewPath = (id: string, scope: Scope = 'all', view: View = 'board') => {
  const base = workspacePath(id);
  if (scope === 'today')
    return view === 'list' || view === 'notes' ? `${base}/today` : `${base}/today/${view}`;
  const root = scope === 'all' ? base : `${base}/projects/${encodeURIComponent(scope)}`;
  return `${root}/${view === 'notes' ? 'pages' : view}`;
};
export const taskPath = (id: string, task: string) =>
  `${workspacePath(id)}/tasks/${encodeURIComponent(task)}`;
export const notePath = (id: string, note: string) =>
  `${workspacePath(id)}/pages/${encodeURIComponent(note)}`;
export const settingsPath = (id: string, section: 'members' | 'profile' | 'tokens' | 'data') =>
  `${workspacePath(id)}/settings/${section}`;
export const notificationsPath = (id: string) => `${workspacePath(id)}/notifications`;
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
const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const viewSegment = (segment?: string): View =>
  segment === 'pages' ? 'notes' : segment === 'list' || segment === 'backlog' ? segment : 'board';
// Segments come from the App Router (below the workspace layout), never from a parsed URL.
export const locationFromSegments = (segments: string[]): { scope: Scope; view: View } => {
  const [first, second, third] = segments.map(decode);
  if (first === 'today')
    return { scope: 'today', view: second === 'board' || second === 'backlog' ? second : 'list' };
  if (first === 'projects' && second) return { scope: second, view: viewSegment(third) };
  return { scope: 'all', view: viewSegment(first) };
};
export const parseFilters = (search: URLSearchParams): Filters => {
  const priority = search.get('priority') ?? '';
  const status = search.get('status') ?? '';
  const sort = search.get('sort');
  return {
    query: search.get('q') ?? '',
    priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'all',
    status: /^[a-zA-Z0-9_-]{1,40}$/.test(status) ? status : 'all',
    sort: sort === 'priority' || sort === 'due' ? sort : 'created',
  };
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
