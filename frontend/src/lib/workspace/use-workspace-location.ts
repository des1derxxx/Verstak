'use client';

import { useRef } from 'react';
import { useSearchParams, useSelectedLayoutSegments } from 'next/navigation';
import { useCalendar } from '@/lib/calendar';
import {
  filterNotes,
  filterTasks,
  hasActiveFilters,
  scopeTasks,
  sortProjects,
} from '@/lib/model/task';
import type { Filters } from '@/lib/model/task';
import { filterSearch, locationFromSegments, parseFilters } from '@/lib/routes';
import { useWorkspaceData } from '@/queries/workspace';
// The children slot keeps the background page while an intercepted task is open,
// so these segments still describe the board or list behind the drawer.
export const useWorkspaceLocation = () => locationFromSegments(useSelectedLayoutSegments());
export const useTaskFilters = () => {
  const search = useSearchParams();
  const intercepted = useSelectedLayoutSegments('modal')[0] === '(.)tasks';
  const background = useRef(search.toString());
  if (!intercepted) background.current = search.toString();
  const filters = parseFilters(new URLSearchParams(background.current));
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
