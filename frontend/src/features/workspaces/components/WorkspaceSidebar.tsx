import { useCalendar } from '../../../shared/ui/CalendarContext';
import { workspacePath } from '../../../shared/lib/routes';
import { RouteLink } from '../../../shared/ui/RouteLink';
import { IconButton } from '../../../shared/ui/Button';
import { cn } from '../../../shared/ui/cn';
import { Avatar } from '../../../shared/ui/Avatar';
import { Dropdown } from '../../../shared/ui/Dropdown';
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
import { scopeTasks } from '../../tasks/task-view';
import type { WorkspaceController } from '../hooks/useWorkspaceController';
export const WorkspaceSidebar = ({ model }: { model: WorkspaceController }) => {
  const { today } = useCalendar();
  const {
    sidebarOpen,
    setSidebarOpen,
    info,
    onSelectSpace,
    spaces,
    onNewSpace,
    selected,
    navigate,
    hrefFor,
    workspace,
    readOnly,
    setModal,
    sortedProjects,
    onTeam,
    onProfile,
    session,
    onLogout,
  } = model;
  return (
    <>
      {sidebarOpen && (
        <button
          className={cn(
            'sidebar-scrim hidden max-[760px]:block max-[760px]:fixed max-[760px]:[inset:56px_0_0]',
            'max-[760px]:bg-[#091e4240] max-[760px]:z-40',
          )}
          aria-label="Закрыть меню"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'sidebar fixed [inset:var(--header-height)_auto_0_0] w-[var(--sidebar-width)] flex flex-col pt-5',
          'px-3 pb-3 bg-surface-soft border-r border-line z-20 max-[1000px]:px-[9px]',
          'max-[760px]:[transform:translateX(-100%)] max-[760px]:[transition:transform_.2s]',
          'max-[760px]:z-45 max-[760px]:[&.is-open]:[transform:translateX(0)]',
          sidebarOpen ? 'is-open' : '',
        )}
        aria-label="Навигация пространства"
      >
        <div
          className={cn(
            'workspace-switcher flex items-center gap-[9px] pt-0 px-1 pb-5 [&>div]:flex-1 [&>div]:min-w-0',
            '[&_label]:block [&_label]:text-muted [&_label]:text-[10px] [&_label]:leading-[17px]',
            '[&_.dropdown-trigger]:w-full [&_.dropdown-trigger]:p-0 [&_.dropdown-trigger]:border-0',
            '[&_.dropdown-trigger]:bg-transparent [&_.dropdown-trigger]:text-ink',
            '[&_.dropdown-trigger]:text-xs [&_.dropdown-trigger]:font-semibold [&_.dropdown-trigger]:h-5.5',
            '[&_.dropdown-trigger]:text-ellipsis [&_.dropdown-trigger]:min-h-6 [&>.icon-button]:w-6',
            'max-[1000px]:gap-1.5 max-[1000px]:[&_.workspace-icon]:w-7.5',
            'max-[1000px]:[&_.workspace-icon]:h-8 max-[1000px]:[&_label]:text-[9px]',
            'max-[1000px]:[&_.dropdown-trigger]:text-[11px]',
          )}
        >
          <span
            className={cn(
              'workspace-icon flex items-center justify-center w-9 h-9 text-brand bg-[#deebff] rounded-[5px]',
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
              onValueChange={(value) => onSelectSpace(value)}
              options={[...spaces.map((space) => ({ value: space.id, label: space.name }))]}
            />
          </div>
          <IconButton aria-label="Создать пространство" onClick={onNewSpace}>
            <Plus size={16} />
          </IconButton>
        </div>
        <nav
          className={cn(
            'primary-nav flex flex-col gap-[3px] [&>:is(button,a)]:flex [&>:is(button,a)]:items-center [&>:is(button,a)]:gap-2.5',
            '[&>:is(button,a)]:min-h-9.5 [&>:is(button,a)]:rounded [&>:is(button,a)]:text-left [&>:is(button,a)]:py-2 [&>:is(button,a)]:px-3',
            '[&>:is(button,a)]:text-[#44546f] [&>:is(button,a)]:text-[13px] [&>:is(button,a):hover]:bg-[#091e4208]',
            '[&>:is(button,a).selected]:text-[#0052cc] [&>:is(button,a).selected]:bg-[#e9f2ff]',
            '[&>:is(button,a).selected]:font-semibold [&>:is(button,a).selected]:relative',
            "[&>:is(button,a).selected::before]:content-[''] [&>:is(button,a).selected::before]:absolute",
            '[&>:is(button,a).selected::before]:[inset:9px_auto_9px_0] [&>:is(button,a).selected::before]:w-[3px]',
            '[&>:is(button,a).selected::before]:rounded-[2px] [&>:is(button,a).selected::before]:bg-brand',
          )}
          aria-label="Задачи"
        >
          <RouteLink
            href={hrefFor('all', 'board')}
            navigate={navigate}
            className={
              selected === 'all'
                ? 'selected [&_.nav-count]:text-[#0052cc] [&_.nav-count]:bg-[#cce0ff]'
                : ''
            }
            aria-current={selected === 'all' ? 'page' : undefined}
          >
            <LayoutGrid size={18} />
            Все задачи
            <span
              className={cn(
                'nav-count min-w-4.5 leading-4.5 py-0 px-[5px] ml-auto rounded-[3px] bg-[#dfe1e6] text-[#44546f]',
                'text-center text-[10px] font-medium',
              )}
            >
              {workspace.tasks.filter((task) => task.status !== 'done').length}
            </span>
          </RouteLink>
          <RouteLink
            href={hrefFor('today', 'list')}
            navigate={navigate}
            className={
              selected === 'today'
                ? 'selected [&_.nav-count]:text-[#0052cc] [&_.nav-count]:bg-[#cce0ff]'
                : ''
            }
            aria-current={selected === 'today' ? 'page' : undefined}
          >
            <CalendarDays size={18} />
            Сегодня
            {scopeTasks(workspace, 'today', today).length > 0 && (
              <span
                className={cn(
                  'nav-count min-w-4.5 leading-4.5 py-0 px-[5px] ml-auto rounded-[3px] bg-[#dfe1e6] text-[#44546f]',
                  'text-center text-[10px] font-medium due-count bg-[#fff0b3] text-[#7f5f01]',
                )}
              >
                {scopeTasks(workspace, 'today', today).length}
              </span>
            )}
          </RouteLink>
        </nav>
        <div
          className={cn(
            'sidebar-section-heading flex items-center justify-between mt-[23px] mr-[5px] mb-2 ml-3',
            'text-muted text-[11px] font-semibold [&_.icon-button]:w-6 [&_.icon-button]:h-6',
          )}
        >
          <span>Проекты</span>
          <IconButton
            aria-label="Создать проект"
            disabled={readOnly}
            onClick={() => setModal({ kind: 'project' })}
          >
            <Plus size={16} />
          </IconButton>
        </div>
        <nav
          className={cn(
            'project-nav flex flex-col gap-[3px] overflow-y-auto min-h-0 [&>:is(button,a)]:flex',
            '[&>:is(button,a)]:items-center [&>:is(button,a)]:gap-2.5 [&>:is(button,a)]:min-h-9.5 [&>:is(button,a)]:rounded',
            '[&>:is(button,a)]:text-left [&>:is(button,a)]:py-2 [&>:is(button,a)]:px-3 [&>:is(button,a)]:text-[#44546f]',
            '[&>:is(button,a)]:text-[13px] [&>:is(button,a):hover]:bg-[#091e4208] [&>:is(button,a).selected]:text-[#0052cc]',
            '[&>:is(button,a).selected]:bg-[#e9f2ff] [&>:is(button,a).selected]:font-semibold [&>:is(button,a).selected]:relative',
            "[&>:is(button,a).selected::before]:content-[''] [&>:is(button,a).selected::before]:absolute",
            '[&>:is(button,a).selected::before]:[inset:9px_auto_9px_0] [&>:is(button,a).selected::before]:w-[3px]',
            '[&>:is(button,a).selected::before]:rounded-[2px] [&>:is(button,a).selected::before]:bg-brand',
            '[&>.add-project]:text-muted [&>.add-project]:text-xs',
          )}
          aria-label="Проекты"
        >
          {sortedProjects.map((item) => (
            <RouteLink
              href={hrefFor(item.id, 'board')}
              navigate={navigate}
              key={item.id}
              className={
                selected === item.id
                  ? 'selected [&_.nav-count]:text-[#0052cc] [&_.nav-count]:bg-[#cce0ff]'
                  : ''
              }
              aria-current={selected === item.id ? 'page' : undefined}
            >
              <span
                className={cn(
                  'project-tile flex items-center justify-center w-[21px] h-[21px] text-[10px] rounded shrink-0',
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
            <button className={'add-project'} onClick={() => setModal({ kind: 'project' })}>
              <Plus size={16} />
              Создать проект
            </button>
          )}
        </nav>
        <div className={'sidebar-bottom mt-auto pt-6'}>
          <button
            className={cn(
              'data-link w-full flex items-center gap-2.5 py-2.5 px-3 rounded text-left text-xs text-muted',
              '[&:hover]:bg-[#091e4208] [&:hover]:text-ink',
            )}
            onClick={onTeam}
          >
            <Users size={17} />
            Участники
          </button>
          <button
            className={cn(
              'data-link w-full flex items-center gap-2.5 py-2.5 px-3 rounded text-left text-xs text-muted',
              '[&:hover]:bg-[#091e4208] [&:hover]:text-ink',
            )}
            onClick={() => navigate(`${workspacePath(info.id)}/settings/tokens`)}
          >
            <Settings2 size={17} />
            API-токены
          </button>
          <button
            className={cn(
              'data-link w-full flex items-center gap-2.5 py-2.5 px-3 rounded text-left text-xs text-muted',
              '[&:hover]:bg-[#091e4208] [&:hover]:text-ink',
            )}
            onClick={() => navigate(`${workspacePath(info.id)}/settings/data`)}
          >
            <Database size={17} />
            Данные пространства
          </button>
          <div
            className={cn(
              'account-row flex items-center gap-2 border-t border-line pt-[15px] px-1 pb-0 mt-3',
              '[&>div]:flex-1 [&>div]:min-w-0 [&_strong]:block [&_strong]:overflow-hidden',
              '[&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-xs',
              '[&_strong]:font-semibold [&>div>span]:block [&>div>span]:text-muted [&>div>span]:text-[10px]',
              '[&>div>span]:mt-[3px]',
            )}
          >
            <button
              className={cn(
                'account-profile flex-1 min-w-0 flex items-center gap-2 p-[3px] text-left rounded',
                '[&:hover]:bg-[#091e420f]',
              )}
              aria-label="Мой профиль"
              aria-haspopup="dialog"
              onClick={onProfile}
            >
              <Avatar user={session.user} />
              <span
                className={cn(
                  'account-profile-info min-w-0 [&>span]:block [&>span]:text-muted [&>span]:text-[10px]',
                  '[&>span]:mt-[3px]',
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
            <IconButton aria-label="Выйти из аккаунта" title="Выйти" onClick={onLogout}>
              <LogOut size={17} />
            </IconButton>
          </div>
        </div>
      </aside>
    </>
  );
};
