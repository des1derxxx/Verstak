'use client';

import { IconButton, Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/avatar';
import { Keyboard, Menu, Plus, Search, X } from 'lucide-react';
import { NotificationBell } from '@/app/(workspace)/workspaces/[workspaceId]/_components/notification-bell';
import { useNavigation } from '@/lib/navigation-guard';
import { notificationsPath, settingsPath, viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
import { useTaskActions } from '@/lib/workspace/use-workspace-actions';
import { useTaskFilters, useWorkspaceLocation } from '@/lib/workspace/use-workspace-location';
import { useWorkspaceSaveState } from '@/queries/workspace';
export const WorkspaceHeader = () => {
  const { info, session, readOnly } = useWorkspace();
  const { setSidebarOpen, openDialog, searchRef } = useWorkspaceUi();
  const { navigate } = useNavigation();
  const { view } = useWorkspaceLocation();
  const { filters, setFilters } = useTaskFilters();
  const { newTask } = useTaskActions();
  const { saving } = useWorkspaceSaveState();
  return (
    <>
      <header
        className={cn(
          'global-header fixed [inset:0_0_auto] h-[var(--header-height)] flex items-center gap-4 py-0 px-5',
          'border-b border-line bg-surface z-30 max-tablet:gap-2.5 max-tablet:px-3.25 max-phone:gap-2',
          'max-phone:px-2.5',
        )}
      >
        <IconButton
          className={cn('mobile-menu hidden', 'max-tablet:inline-flex max-tablet:w-7')}
          aria-label="Открыть меню"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={21} />
        </IconButton>
        <button
          className={cn(
            'brand inline-flex items-center gap-2.25 min-w-50 p-0 text-left text-heading font-bold',
            'tracking-[-.7px] text-ink-strong max-laptop:min-w-43.75 max-tablet:min-w-0',
            'max-tablet:gap-1.25 max-tablet:text-title max-tablet:[&_.brand-mark]:w-5.75',
            'max-tablet:[&_.brand-mark]:h-6.5 max-tablet:[&_.brand-mark_svg]:w-5.75',
            'max-tablet:[&_.brand-mark_svg]:h-5.75 max-phone:[&>span:last-child]:hidden',
          )}
          onClick={() => navigate(viewPath(info.id))}
          aria-label="Verstak — все задачи"
        >
          <span
            className={cn(
              'brand-mark w-7 h-7.5 inline-flex items-center justify-center bg-brand rounded-card text-white',
              '[&_svg]:w-6.75 [&_svg]:h-6.75',
            )}
          >
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="m7 8 9 17 9-17M12 8l4 8 4-8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>Verstak</span>
        </button>
        <span
          className={cn(
            'header-space-name max-w-57.5 overflow-hidden text-ellipsis whitespace-nowrap text-body',
            'text-muted max-desktop:hidden',
          )}
        >
          {info.name}
        </span>
        <div
          className={cn(
            'global-search flex items-center gap-2 w-[min(380px,_34vw)] ml-auto border border-input-border',
            'rounded-card bg-surface py-0 px-2.25 min-h-8.25 text-muted [&:focus-within]:border-brand',
            '[&:focus-within]:[outline:1px_solid_var(--color-brand)] [&_input]:border-0 [&_input]:outline-none',
            '[&_input]:bg-transparent [&_input]:text-ink [&_input]:min-w-0 [&_input]:w-full [&_input]:h-7.5',
            '[&_input]:text-body [&_input::-webkit-search-cancel-button]:hidden',
            '[&_input::placeholder]:text-muted [&_.icon-button]:w-5.5 [&_.icon-button]:h-6 [&_kbd]:border-0',
            '[&_kbd]:bg-neutral [&_kbd]:text-tiny max-desktop:w-[min(420px,42vw)] max-tablet:ml-auto',
            'max-tablet:w-auto max-tablet:flex-1 max-tablet:max-w-85 max-tablet:[&_kbd]:hidden',
            'max-phone:max-w-none max-phone:[&_input]:text-xs',
          )}
        >
          <Search size={17} />
          <input
            ref={searchRef}
            type="search"
            aria-label="Поиск задач и страниц"
            placeholder={view === 'notes' ? 'Найти страницу…' : 'Найти задачу…'}
            value={filters.query}
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, query: event.target.value }))
            }
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setFilters((previous) => ({ ...previous, query: '' }));
                event.currentTarget.blur();
              }
            }}
          />
          {filters.query ? (
            <IconButton
              aria-label="Очистить поиск"
              onClick={() => setFilters((previous) => ({ ...previous, query: '' }))}
            >
              <X size={14} />
            </IconButton>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </div>
        <Button
          className={cn(
            'global-create min-h-8 py-1.25 px-2.75 text-body max-tablet:min-h-8',
            'max-tablet:px-2.25 max-tablet:text-xs max-phone:px-2 max-phone:[&>svg]:w-3.5',
          )}
          disabled={readOnly || saving}
          onClick={() => newTask()}
          title="Создать задачу (C)"
          variant="primary"
        >
          <Plus size={16} />
          Создать
        </Button>
        <IconButton
          className={cn('shortcuts-button', 'max-tablet:hidden')}
          aria-label="Сочетания клавиш"
          onClick={() => openDialog({ kind: 'shortcuts' })}
        >
          <Keyboard size={19} />
        </IconButton>
        <NotificationBell onOpen={() => navigate(notificationsPath(info.id))} />
        <button
          className={
            'profile-trigger inline-flex rounded-full p-0.5 shrink-0 [&:hover]:shadow-ring-brand-muted'
          }
          aria-label="Открыть профиль"
          aria-haspopup="dialog"
          title={`${session.user.name} · ${session.user.email}`}
          onClick={() => navigate(settingsPath(info.id, 'profile'))}
        >
          <Avatar
            user={session.user}
            className={'header-avatar w-7 h-7 bg-discovery-soft text-discovery-ink'}
          />
        </button>
      </header>
    </>
  );
};
