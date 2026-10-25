import { api } from './client';
import { parseWorkspace } from '../model/workspace';
import type { Workspace } from '../model/workspace';
import type { Snapshot } from './types';
export const loadSnapshot = async (id: string): Promise<Snapshot> => {
  const result = await api<Snapshot>(`/workspaces/${id}/data`);
  return { ...result, data: parseWorkspace(result.data) };
};
export const diffWorkspace = (previous: Workspace, next: Workspace) => {
  const upsert: Record<string, unknown[]> = {};
  const remove: Record<string, string[]> = {};
  for (const kind of ['projects', 'tasks', 'notes'] as const) {
    const old = new Map(previous[kind].map((item) => [item.id, JSON.stringify(item)]));
    const current = new Set(next[kind].map((item) => item.id));
    upsert[kind] = next[kind].filter((item) => old.get(item.id) !== JSON.stringify(item));
    remove[kind] = previous[kind].filter((item) => !current.has(item.id)).map((item) => item.id);
  }
  return { upsert, remove };
};
export const saveSnapshot = async (
  id: string,
  revision: number,
  previous: Workspace,
  next: Workspace,
  replace = false,
): Promise<Snapshot> => {
  const result = await api<Snapshot>(
    `/workspaces/${id}/data`,
    replace ? 'PUT' : 'PATCH',
    replace ? { revision, data: next } : { revision, ...diffWorkspace(previous, next) },
  );
  return { ...result, data: parseWorkspace(result.data) };
};
