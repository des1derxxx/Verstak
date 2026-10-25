'use client';

import { createContext, useContext, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams, useSelectedLayoutSegments } from 'next/navigation';
import { useCalendar } from '@/lib/calendar';
import {
  filterNotes,
  filterTasks,
  hasActiveFilters,
  scopeTasks,
  sortProjects,
} from '@/lib/model/task';
import type { Filters, Scope, View } from '@/lib/model/task';
import { filterSearch, locationFromSegments, parseFilters } from '@/lib/routes';
import { useWorkspaceData } from '@/queries/workspace';
type Location = { scope: Scope; view: View; search: string };
const LocationContext = createContext<Location | null>(null);
// Must render in the workspace layout: Next.js narrows layout segments at every level,
// so a page asking for them directly would only see the segments below itself.
export const WorkspaceLocationProvider = ({ children }: { children: ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const search = useSearchParams().toString();
  // While an intercepted task is open, the children slot keeps the page behind the drawer,
  // but the URL (and its search params) already belongs to the task.
  const intercepted = useSelectedLayoutSegments('modal')[0] === '(.)tasks';
  const background = useRef(search);
  if (!intercepted) background.current = search;
  const path = segments.join('/');
  const value = useMemo(
    () => ({ ...locationFromSegments(path ? path.split('/') : []), search: background.current }),
    [path, background.current],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
const useLocation = () => {
  const location = useContext(LocationContext);
  if (!location) throw new Error('WorkspaceLocationProvider is required');
  return location;
};
export const useWorkspaceLocation = () => {
  const { scope, view } = useLocation();
  return { scope, view };
};
export const useTaskFilters = () => {
  const filters = parseFilters(new URLSearchParams(useLocation().search));
  const setFilters = (next: Filters | ((previous: Filters) => Filters)) => {
    const value = typeof next === 'function' ? next(filters) : next;
    const query = filterSearch(new URLSearchParams(window.location.search), value);
    // Next.js syncs history.replaceState with useSearchParams without a server round trip.
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  };
  return { filters, setFilters, active: hasActiveFilters(filters) };
};
export const useTaskView = () => {
  const { workspace } = useWorkspaceData();
  const { scope, view } = useWorkspaceLocation();
  const { filters, active } = useTaskFilters();
  const { today } = useCalendar();
  const project = workspace.projects.find((item) => item.id === scope);
  const scoped = scopeTasks(workspace, scope, today);
  return {
    workspace,
    scope,
    view,
    project,
    title: project?.name ?? (scope === 'today' ? 'Сегодня' : 'Все задачи'),
    projects: sortProjects(workspace.projects),
    scoped,
    filtered: filterTasks(workspace, scoped, filters),
    notes: filterNotes(workspace.notes, project?.id, filters.query),
    filtersActive: active,
    counts: {
      done: scoped.filter((task) => task.status === 'done').length,
      progress: scoped.filter((task) => task.status === 'progress').length,
      backlog: scoped.filter((task) => task.status === 'backlog').length,
    },
  };
};
