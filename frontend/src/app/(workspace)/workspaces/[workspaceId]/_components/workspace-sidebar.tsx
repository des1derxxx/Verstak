'use client';

import { useCalendar } from '@/lib/calendar';
import { RouteLink } from '@/components/ui/route-link';
import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import {
  CalendarDays,
  ChevronRight,
  Database,
  FolderKanban,
  LayoutGrid,
  LogOut,
  Plus,
  Settings2,
  Users,
} from 'lucide-react';
import { scopeTasks } from '@/lib/model/task';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, setCsrf } from '@/lib/api/client';
import { useNavigation } from '@/lib/navigation-guard';
import { settingsPath, viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
import { useTaskView } from '@/lib/workspace/workspace-location';
const useLogout = () => {
  const router = useRouter();
  const { confirmLeave } = useNavigation();
  const [error, setError] = useState('');
  const leave = () => {
    setCsrf('');
    router.replace('/login');
    router.refresh();
  };
  const logout = () => {
    if (!confirmLeave('Есть несохранённые изменения. Выйти из аккаунта?')) return;
    setError('');
    void api('/auth/logout', 'POST', {})
      .then(leave)
      .catch((error: Error) => {
        if (error instanceof ApiError && error.status === 401) leave();
        else setError(error.message);
      });
  };
  return { logout, error };
};
export const WorkspaceSidebar = () => {
  const { today } = useCalendar();
  const { info, spaces, session, readOnly } = useWorkspace();
  const { sidebarOpen, setSidebarOpen, openDialog } = useWorkspaceUi();
  const { navigate: go } = useNavigation();
  const { workspace, projects: sortedProjects, scope: selected } = useTaskView();
  const { logout, error } = useLogout();
  const navigate = (href: string) => {
    setSidebarOpen(false);
    go(href);
  };
  return (
    <>
      {sidebarOpen && (
        <button
          className={cn(
            'sidebar-scrim hidden max-tablet:block max-tablet:fixed max-tablet:[inset:56px_0_0]',
            'max-tablet:bg-overlay max-tablet:z-40',
          )}
          aria-label="Закрыть меню"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'sidebar fixed [inset:var(--header-height)_auto_0_0] w-[var(--sidebar-width)] flex flex-col pt-5',
          'px-3 pb-3 bg-surface-soft border-r border-line z-20 max-laptop:px-2.25',
          'max-tablet:[transform:translateX(-100%)] max-tablet:[transition:transform_.2s]',
          'max-tablet:z-45 max-tablet:[&.is-open]:[transform:translateX(0)]',
          sidebarOpen ? 'is-open' : '',
        )}
        aria-label="Навигация пространства"
      >
        <div
          className={cn(
            'workspace-switcher flex items-center gap-2.25 pt-0 px-1 pb-5 [&>div]:flex-1 [&>div]:min-w-0',
            '[&_label]:block [&_label]:text-muted [&_label]:text-tiny [&_label]:leading-4.25',
            '[&_.dropdown-trigger]:w-full [&_.dropdown-trigger]:p-0 [&_.dropdown-trigger]:border-0',
            '[&_.dropdown-trigger]:bg-transparent [&_.dropdown-trigger]:text-ink',
            '[&_.dropdown-trigger]:text-xs [&_.dropdown-trigger]:font-semibold [&_.dropdown-trigger]:h-5.5',
            '[&_.dropdown-trigger]:text-ellipsis [&_.dropdown-trigger]:min-h-6 [&>.icon-button]:w-6',
            'max-laptop:gap-1.5 max-laptop:[&_.workspace-icon]:w-7.5',
            'max-laptop:[&_.workspace-icon]:h-8 max-laptop:[&_label]:text-micro',
            'max-laptop:[&_.dropdown-trigger]:text-caption',
          )}
        >
          <span
            className={cn(
              'workspace-icon flex items-center justify-center w-9 h-9 text-brand bg-brand-tint rounded-card',
              'shrink-0',
            )}
          >
            <FolderKanban size={21} />
          </span>
          <div>
            <label htmlFor="workspace-switcher">Рабочее пространство</label>
            <Dropdown
              id="workspace-switcher"
              value={info.id}
              onValueChange={(value) => navigate(viewPath(value))}
              options={[...spaces.map((space) => ({ value: space.id, label: space.name }))]}
            />
          </div>
          <IconButton aria-label="Создать пространство" onClick={() => navigate('/workspaces/new')}>
            <Plus size={16} />
          </IconButton>
        </div>
        <nav
          className={cn(
            'primary-nav flex flex-col gap-0.75 [&>:is(button,a)]:flex [&>:is(button,a)]:items-center [&>:is(button,a)]:gap-2.5',
            '[&>:is(button,a)]:min-h-9.5 [&>:is(button,a)]:rounded [&>:is(button,a)]:text-left [&>:is(button,a)]:py-2 [&>:is(button,a)]:px-3',
            '[&>:is(button,a)]:text-ink-secondary [&>:is(button,a)]:text-body [&>:is(button,a):hover]:bg-overlay-hover',
            '[&>:is(button,a).selected]:text-brand-strong [&>:is(button,a).selected]:bg-brand-soft',
            '[&>:is(button,a).selected]:font-semibold [&>:is(button,a).selected]:relative',
            "[&>:is(button,a).selected::before]:content-[''] [&>:is(button,a).selected::before]:absolute",
            '[&>:is(button,a).selected::before]:[inset:9px_auto_9px_0] [&>:is(button,a).selected::before]:w-0.75',
            '[&>:is(button,a).selected::before]:rounded-xs [&>:is(button,a).selected::before]:bg-brand',
          )}
          aria-label="Задачи"
        >
          <RouteLink
            href={viewPath(info.id)}
            navigate={navigate}
            className={
              selected === 'all'
                ? 'selected [&_.nav-count]:text-brand-strong [&_.nav-count]:bg-brand-muted'
                : ''
            }
            aria-current={selected === 'all' ? 'page' : undefined}
          >
            <LayoutGrid size={18} />
            Все задачи
            <span
              className={cn(
                'nav-count min-w-4.5 leading-4.5 py-0 px-1.25 ml-auto rounded-chip bg-line text-ink-secondary',
                'text-center text-tiny font-medium',
              )}
            >
              {workspace.tasks.filter((task) => task.status !== 'done').length}
            </span>
          </RouteLink>
          <RouteLink
            href={viewPath(info.id, 'today', 'list')}
            navigate={navigate}
            className={
              selected === 'today'
                ? 'selected [&_.nav-count]:text-brand-strong [&_.nav-count]:bg-brand-muted'
                : ''
            }
            aria-current={selected === 'today' ? 'page' : undefined}
          >
            <CalendarDays size={18} />
            Сегодня
            {scopeTasks(workspace, 'today', today).length > 0 && (
              <span
                className={cn(
                  'nav-count min-w-4.5 leading-4.5 py-0 px-1.25 ml-auto rounded-chip bg-line text-ink-secondary',
                  'text-center text-tiny font-medium due-count bg-warning-tint text-warning-ink',
                )}
              >
                {scopeTasks(workspace, 'today', today).length}
              </span>
            )}
          </RouteLink>
        </nav>
        <div
          className={cn(
            'sidebar-section-heading flex items-center justify-between mt-5.75 mr-1.25 mb-2 ml-3',
            'text-muted text-caption font-semibold [&_.icon-button]:w-6 [&_.icon-button]:h-6',
          )}
        >
          <span>Проекты</span>
          <IconButton
            aria-label="Создать проект"
            disabled={readOnly}
            onClick={() => openDialog({ kind: 'project' })}
          >
            <Plus size={16} />
          </IconButton>
        </div>
        <nav
          className={cn(
            'project-nav flex flex-col gap-0.75 overflow-y-auto min-h-0 [&>:is(button,a)]:flex',
            '[&>:is(button,a)]:items-center [&>:is(button,a)]:gap-2.5 [&>:is(button,a)]:min-h-9.5 [&>:is(button,a)]:rounded',
            '[&>:is(button,a)]:text-left [&>:is(button,a)]:py-2 [&>:is(button,a)]:px-3 [&>:is(button,a)]:text-ink-secondary',
            '[&>:is(button,a)]:text-body [&>:is(button,a):hover]:bg-overlay-hover [&>:is(button,a).selected]:text-brand-strong',
            '[&>:is(button,a).selected]:bg-brand-soft [&>:is(button,a).selected]:font-semibold [&>:is(button,a).selected]:relative',
            "[&>:is(button,a).selected::before]:content-[''] [&>:is(button,a).selected::before]:absolute",
            '[&>:is(button,a).selected::before]:[inset:9px_auto_9px_0] [&>:is(button,a).selected::before]:w-0.75',
            '[&>:is(button,a).selected::before]:rounded-xs [&>:is(button,a).selected::before]:bg-brand',
            '[&>.add-project]:text-muted [&>.add-project]:text-xs',
          )}
          aria-label="Проекты"
        >
          {sortedProjects.map((item) => (
            <RouteLink
              href={viewPath(info.id, item.id)}
              navigate={navigate}
              key={item.id}
              className={
                selected === item.id
                  ? 'selected [&_.nav-count]:text-brand-strong [&_.nav-count]:bg-brand-muted'
                  : ''
              }
              aria-current={selected === item.id ? 'page' : undefined}
            >
              <span
                className={cn(
                  'project-tile flex items-center justify-center w-5.25 h-5.25 text-tiny rounded shrink-0',
                  'text-white font-semibold',
                )}
                style={{ background: item.color }}
              >
                {item.name[0].toUpperCase()}
              </span>
              <span
                className={
                  'project-nav-name overflow-hidden text-ellipsis whitespace-nowrap flex-1'
                }
              >
                {item.name}
              </span>
              {selected === item.id && <ChevronRight size={14} />}
            </RouteLink>
          ))}
          {!sortedProjects.length && (
            <p className={'sidebar-empty py-2 px-3 text-xs text-subtle'}>Проекты появятся здесь</p>
          )}
          {!readOnly && (
            <button className={'add-project'} onClick={() => openDialog({ kind: 'project' })}>
              <Plus size={16} />
              Создать проект
            </button>
          )}
        </nav>
        <div className={'sidebar-bottom mt-auto pt-6'}>
          <button
            className={cn(
              'data-link w-full flex items-center gap-2.5 py-2.5 px-3 rounded text-left text-xs text-muted',
              '[&:hover]:bg-overlay-hover [&:hover]:text-ink',
            )}
            onClick={() => navigate(settingsPath(info.id, 'members'))}
          >
            <Users size={17} />
            Участники
          </button>
          <button
            className={cn(
              'data-link w-full flex items-center gap-2.5 py-2.5 px-3 rounded text-left text-xs text-muted',
              '[&:hover]:bg-overlay-hover [&:hover]:text-ink',
            )}
            onClick={() => navigate(settingsPath(info.id, 'tokens'))}
          >
            <Settings2 size={17} />
            API-токены
          </button>
          <button
            className={cn(
              'data-link w-full flex items-center gap-2.5 py-2.5 px-3 rounded text-left text-xs text-muted',
              '[&:hover]:bg-overlay-hover [&:hover]:text-ink',
            )}
            onClick={() => navigate(settingsPath(info.id, 'data'))}
          >
            <Database size={17} />
            Данные пространства
          </button>
          <div
            className={cn(
              'account-row flex items-center gap-2 border-t border-line pt-3.75 px-1 pb-0 mt-3',
              '[&>div]:flex-1 [&>div]:min-w-0 [&_strong]:block [&_strong]:overflow-hidden',
              '[&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-xs',
              '[&_strong]:font-semibold [&>div>span]:block [&>div>span]:text-muted [&>div>span]:text-tiny',
              '[&>div>span]:mt-0.75',
            )}
          >
            <button
              className={cn(
                'account-profile flex-1 min-w-0 flex items-center gap-2 p-0.75 text-left rounded',
                '[&:hover]:bg-overlay-pressed',
              )}
              aria-label="Мой профиль"
              aria-haspopup="dialog"
              onClick={() => navigate(settingsPath(info.id, 'profile'))}
            >
              <Avatar user={session.user} />
              <span
                className={cn(
                  'account-profile-info min-w-0 [&>span]:block [&>span]:text-muted [&>span]:text-tiny',
                  '[&>span]:mt-0.75',
                )}
              >
                <strong>{session.user.name}</strong>
                <span>
                  {readOnly
                    ? 'Только просмотр'
                    : info.role === 'owner'
                      ? 'Владелец пространства'
                      : 'Редактор'}
                </span>
              </span>
            </button>
            <IconButton aria-label="Выйти из аккаунта" title="Выйти" onClick={logout}>
              <LogOut size={17} />
            </IconButton>
          </div>
          {error && (
            <p role="alert" className="px-1 pt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      </aside>
    </>
  );
};
