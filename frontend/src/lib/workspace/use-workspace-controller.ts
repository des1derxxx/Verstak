import type { SetStateAction } from 'react';
import { viewPath } from '@/lib/routes';
import { loadSnapshot, saveSnapshot } from '@/lib/api/workspace-data';
import { useEffect, useRef, useState } from 'react';
import { FileText, LayoutGrid, List, ListTodo } from 'lucide-react';
import type { Status, Task, Workspace } from '@/lib/model/workspace';
import { api, ApiError } from '@/lib/api/client';
import type { Member } from '@/lib/api/types';
import { emptyFilters, filterTasks, isTypingTarget, scopeTasks } from '@/lib/model/task';
import type { Filters, View } from '@/lib/model/task';
import type { ModalState, WorkspaceControllerProps } from '@/lib/workspace/types';
const views = [
  { id: 'board', label: 'Доска', icon: LayoutGrid },
  { id: 'backlog', label: 'Бэклог', icon: ListTodo },
  { id: 'list', label: 'Список', icon: List },
  { id: 'notes', label: 'Страницы', icon: FileText },
] as const;
export const useWorkspaceController = ({
  info,
  session,
  initialSnapshot,
  todayDate,
  initialMembers,
  route,
  onNavigate,
  onFilters,
  onOpenTask: onRouteTask,
  onUser,
  onBack,
  hasDraft,
  spaces,
  onSelectSpace,
  onNewSpace,
  onTeam,
  onLogout,
  onProfile,
}: WorkspaceControllerProps) => {
  const [workspace, setWorkspace] = useState<Workspace>(
    initialSnapshot?.data ?? {
      version: 1,
      projects: [],
      tasks: [],
      notes: [],
    },
  );
  const [revision, setRevision] = useState(initialSnapshot?.revision ?? 0);
  const revisionRef = useRef(initialSnapshot?.revision ?? 0);
  const [loading, setLoading] = useState(!initialSnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [mutationError, setMutationError] = useState('');
  const [storageError, setStorageError] = useState('');
  const { selected, view, filters } = route;
  const setFilters = (action: SetStateAction<Filters>) =>
    onFilters(typeof action === 'function' ? action(filters) : action);
  const navigate = onNavigate;
  const setView = (next: View) => navigate(viewPath(info.id, selected, next));
  const hrefFor = (scope = selected, mode: View = view) => viewPath(info.id, scope, mode);
  const [modal, setModalState] = useState<ModalState>(null);
  const setModal = setModalState;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers ?? []);
  const [membersError, setMembersError] = useState('');
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const readOnly = info.role === 'viewer';
  const sortedProjects = [...workspace.projects].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const project = workspace.projects.find((item) => item.id === selected);
  const title = project?.name ?? (selected === 'today' ? 'Сегодня' : 'Все задачи');
  const scoped = scopeTasks(workspace, selected, todayDate);
  const filtered = filterTasks(workspace, scoped, filters);
  const notes = workspace.notes
    .filter(
      (note) =>
        (!project || note.projectId === project.id) &&
        (!filters.query.trim() ||
          `${note.title} ${note.body}`
            .toLocaleLowerCase('ru')
            .includes(filters.query.trim().toLocaleLowerCase('ru'))),
    )
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const done = scoped.filter((task) => task.status === 'done').length;
  const inProgress = scoped.filter((task) => task.status === 'progress').length;
  const backlog = scoped.filter((task) => task.status === 'backlog').length;
  const activeFilters = Boolean(
    filters.query.trim() || filters.priority !== 'all' || filters.status !== 'all',
  );
  const navigationViews =
    selected === 'today' ? views.filter((item) => item.id !== 'notes') : views;
  const receive = (snapshot: Awaited<ReturnType<typeof loadSnapshot>>) => {
    if (snapshot.revision < revisionRef.current) return;
    revisionRef.current = snapshot.revision;
    setWorkspace(snapshot.data);
    setRevision(snapshot.revision);
  };
  const refresh = async (manual = false) => {
    if (savingRef.current) return;
    if (manual) setRefreshing(true);
    try {
      const [snapshot, people] = await Promise.all([
        loadSnapshot(info.id),
        api<Member[]>(`/workspaces/${info.id}/members`).catch((error) => {
          setMembersError(error.message);
          return null;
        }),
      ]);
      if (people) {
        setMembers(people);
        setMembersError('');
      }
      receive(snapshot);
      setStorageError('');
    } catch (error) {
      setStorageError((error as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    if (initialSnapshot) receive(initialSnapshot);
    if (initialMembers) setMembers(initialMembers);
  }, [initialSnapshot, initialMembers]);
  const select = (id: string) => {
    setSidebarOpen(false);
    navigate(viewPath(info.id, id, id === 'today' ? 'list' : 'board'));
  };
  const newTask = (status?: Status) => {
    if (readOnly || loading) return;
    setModal(
      workspace.projects.length
        ? { kind: 'task', status: status ?? (view === 'backlog' ? 'backlog' : 'todo') }
        : { kind: 'project' },
    );
  };
  useEffect(() => {
    if (!initialSnapshot) void refresh();
  }, [info.id]);
  useEffect(() => {
    const update = () => {
      void refresh();
    };
    window.addEventListener('verstak:profile', update);
    return () => window.removeEventListener('verstak:profile', update);
  }, [info.id]);
  useEffect(() => {
    const update = () => {
      if (!modal && !hasDraft?.() && !savingRef.current && document.visibilityState !== 'hidden')
        void refresh();
    };
    const timer = setInterval(update, 30000);
    window.addEventListener('focus', update);
    window.addEventListener('verstak:refresh', update);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', update);
      window.removeEventListener('verstak:refresh', update);
    };
  }, [modal, info.id]);
  useEffect(() => {
    setMutationError('');
  }, [modal]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (modal || document.querySelector('dialog[open]')) return;
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (
        isTypingTarget(event.target) ||
        modal ||
        document.querySelector('dialog[open]') ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        newTask();
      }
      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === '?') {
        event.preventDefault();
        setModal({ kind: 'shortcuts' });
      }
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [modal, selected, view, workspace.projects.length, readOnly, loading]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const commit = async (next: Workspace, message?: string, replace = false): Promise<boolean> => {
    if (readOnly || savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setMutationError('');
    try {
      const snapshot = await saveSnapshot(info.id, revision, workspace, next, replace);
      receive(snapshot);
      setStorageError('');
      if (message) setToast(message);
      return true;
    } catch (error) {
      const message = (error as Error).message;
      setMutationError(message);
      setStorageError(message);
      if (error instanceof ApiError && error.status === 409) {
        try {
          receive(await loadSnapshot(info.id));
        } catch {
          /* Keep the draft and show the existing error. */
        }
      }
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  const saveTask = async (task: Task): Promise<boolean> => {
    const original = workspace.tasks.find((item) => item.id === task.id);
    if (task.status === 'done' && original?.status !== 'done' && !task.resolutionComment?.trim()) {
      setModal({ kind: 'task', task: original, seed: original ? undefined : task, status: 'done' });
      return false;
    }
    const exists = Boolean(original);
    const success = await commit(
      {
        ...workspace,
        tasks: exists
          ? workspace.tasks.map((item) => (item.id === task.id ? task : item))
          : [...workspace.tasks, task],
      },
      exists ? 'Задача обновлена' : 'Задача создана',
    );
    if (success && !exists && !filterTasks(workspace, [task], filters).length) {
      setFilters((previous) => ({ ...emptyFilters, sort: previous.sort }));
      setToast('Задача создана. Фильтры сброшены, чтобы показать её.');
    }
    return success;
  };
  const openTask = (task: Task) => {
    if (onRouteTask) {
      onRouteTask(task);
      return;
    }
    setModal({ kind: 'task', task });
  };
  const openPage = () => {
    if (!readOnly) setModal(workspace.projects.length ? { kind: 'note' } : { kind: 'project' });
  };
  return {
    info,
    session,
    spaces,
    onSelectSpace,
    onNewSpace,
    onTeam,
    onLogout,
    onProfile,
    onUser,
    back: onBack,
    navigate,
    hrefFor,
    receive,
    revision,
    loading,
    mutationError,
    setSidebarOpen,
    select,
    searchRef,
    view,
    filters,
    setFilters,
    readOnly,
    saving,
    newTask,
    setModal,
    sidebarOpen,
    selected,
    workspace,
    sortedProjects,
    storageError,
    refreshing,
    refresh,
    project,
    title,
    navigationViews,
    setView,
    backlog,
    activeFilters,
    openPage,
    filtered,
    scoped,
    members,
    openTask,
    saveTask,
    inProgress,
    notes,
    done,
    modal,
    membersError,
    commit,
    setToast,
    toast,
  };
};
export type WorkspaceController = ReturnType<typeof useWorkspaceController>;
