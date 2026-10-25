import { workspacePath } from '@/shared/lib/routes';
import { IconButton, Button } from '@/shared/ui/Button';
import { cn } from '@/shared/ui/cn';
import { Avatar } from '@/shared/ui/Avatar';
import { Keyboard, Menu, Plus, Search, X } from 'lucide-react';
import { NotificationBell } from '@/features/notifications/Notifications';
import type { WorkspaceController } from '@/features/workspaces/hooks/useWorkspaceController';
export const WorkspaceHeader = ({ model }: { model: WorkspaceController }) => {
  const {
    setSidebarOpen,
    select,
    navigate,
    info,
    searchRef,
    view,
    filters,
    setFilters,
    readOnly,
    saving,
    newTask,
    setModal,
    session,
    onProfile,
  } = model;
  return (
    <>
      <header
        className={cn(
          'global-header fixed [inset:0_0_auto] h-[var(--header-height)] flex items-center gap-4 py-0 px-5',
          'border-b border-line bg-white z-30 max-[760px]:gap-2.5 max-[760px]:px-[13px] max-[520px]:gap-2',
          'max-[520px]:px-2.5',
        )}
      >
        <IconButton
          className={cn('mobile-menu hidden', 'max-[760px]:inline-flex max-[760px]:w-7')}
          aria-label="Открыть меню"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={21} />
        </IconButton>
        <button
          className={cn(
            'brand inline-flex items-center gap-[9px] min-w-50 p-0 text-left text-[22px] font-bold',
            'tracking-[-.7px] text-[#253858] max-[1000px]:min-w-[175px] max-[760px]:min-w-0',
            'max-[760px]:gap-[5px] max-[760px]:text-[19px] max-[760px]:[&_.brand-mark]:w-[23px]',
            'max-[760px]:[&_.brand-mark]:h-6.5 max-[760px]:[&_.brand-mark_svg]:w-[23px]',
            'max-[760px]:[&_.brand-mark_svg]:h-[23px] max-[520px]:[&>span:last-child]:hidden',
          )}
          onClick={() => select('all')}
          aria-label="Verstak — все задачи"
        >
          <span
            className={cn(
              'brand-mark w-7 h-7.5 inline-flex items-center justify-center bg-brand rounded-[5px] text-white',
              '[&_svg]:w-[27px] [&_svg]:h-[27px]',
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
            'header-space-name max-w-57.5 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]',
            'text-muted max-[1200px]:hidden',
          )}
        >
          {info.name}
        </span>
        <div
          className={cn(
            'global-search flex items-center gap-2 w-[min(380px,_34vw)] ml-auto border border-[#b6beca]',
            'rounded-[5px] bg-white py-0 px-[9px] min-h-[33px] text-muted [&:focus-within]:border-brand',
            '[&:focus-within]:[outline:1px_solid_var(--blue)] [&_input]:border-0 [&_input]:outline-none',
            '[&_input]:bg-transparent [&_input]:text-ink [&_input]:min-w-0 [&_input]:w-full [&_input]:h-7.5',
            '[&_input]:text-[13px] [&_input::-webkit-search-cancel-button]:hidden',
            '[&_input::placeholder]:text-muted [&_.icon-button]:w-5.5 [&_.icon-button]:h-6 [&_kbd]:border-0',
            '[&_kbd]:bg-[#f1f2f4] [&_kbd]:text-[10px] max-[1200px]:w-[min(420px,42vw)] max-[760px]:ml-auto',
            'max-[760px]:w-auto max-[760px]:flex-1 max-[760px]:max-w-85 max-[760px]:[&_kbd]:hidden',
            'max-[520px]:max-w-none max-[520px]:[&_input]:text-xs',
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
            'global-create min-h-8 py-[5px] px-[11px] text-[13px] max-[760px]:min-h-8',
            'max-[760px]:px-[9px] max-[760px]:text-xs max-[520px]:px-2 max-[520px]:[&>svg]:w-3.5',
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
          className={cn('shortcuts-button', 'max-[760px]:hidden')}
          aria-label="Сочетания клавиш"
          onClick={() => setModal({ kind: 'shortcuts' })}
        >
          <Keyboard size={19} />
        </IconButton>
        <NotificationBell onOpen={() => navigate(`${workspacePath(info.id)}/notifications`)} />
        <button
          className={
            'profile-trigger inline-flex rounded-full p-0.5 shrink-0 [&:hover]:shadow-[0_0_0_2px_#cce0ff]'
          }
          aria-label="Открыть профиль"
          aria-haspopup="dialog"
          title={`${session.user.name} · ${session.user.email}`}
          onClick={onProfile}
        >
          <Avatar
            user={session.user}
            className={'header-avatar w-7 h-7 bg-[#eae6ff] text-[#5243aa]'}
          />
        </button>
      </header>
    </>
  );
};
