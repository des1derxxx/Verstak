import { RouteLink } from '@/components/ui/route-link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Dropdown } from '@/components/ui/dropdown';
import { ArrowDownWideNarrow, Plus, X } from 'lucide-react';
import { priorityNames, statuses, statusNames } from '@/lib/model/workspace';
import { emptyFilters } from '@/lib/model/task';
import type { Sort } from '@/lib/model/task';
import type { WorkspaceController } from '@/lib/workspace/use-workspace-controller';
export const WorkspaceToolbar = ({ model }: { model: WorkspaceController }) => {
  const {
    navigationViews,
    navigate,
    hrefFor,
    view,
    setView,
    backlog,
    filters,
    setFilters,
    activeFilters,
    readOnly,
    openPage,
    filtered,
    scoped,
  } = model;
  return (
    <>
      <div
        className={cn(
          'view-tabs flex gap-[25px] min-h-10.5 border-b-2 border-[#f1f2f4] [&>:is(button,a)]:inline-flex',
          '[&>:is(button,a)]:items-center [&>:is(button,a)]:gap-[7px] [&>:is(button,a)]:relative [&>:is(button,a)]:text-muted',
          '[&>:is(button,a)]:font-medium [&>:is(button,a)]:text-[13px] [&>:is(button,a)]:pt-0 [&>:is(button,a)]:px-0',
          "[&>:is(button,a)]:pb-[13px] [&>:is(button,a).active]:text-brand [&>:is(button,a).active::after]:content-['']",
          '[&>:is(button,a).active::after]:absolute [&>:is(button,a).active::after]:[inset:auto_0_-2px]',
          '[&>:is(button,a).active::after]:h-[3px] [&>:is(button,a).active::after]:rounded-[2px]',
          '[&>:is(button,a).active::after]:bg-brand [&>:is(button,a):hover]:text-brand max-[760px]:gap-[25px]',
          'max-[760px]:[&>:is(button,a)]:text-xs max-[760px]:[&>:is(button,a)]:gap-1.5 max-[760px]:[&>:is(button,a)]:pb-3',
          'max-[520px]:gap-[21px] max-[520px]:[&>:is(button,a)]:gap-[5px] max-[520px]:[&>:is(button,a)>svg]:w-3.5',
          'max-[520px]:[&_.tab-count]:text-[9px] max-[520px]:[&_.tab-count]:px-1',
          'max-[520px]:[&_.tab-count]:min-w-3.5',
        )}
        role="tablist"
        aria-label="Представление задач"
        onKeyDown={(event) => {
          const current = navigationViews.findIndex((item) => item.id === view);
          let next = current;
          if (event.key === 'ArrowRight') next = (current + 1) % navigationViews.length;
          else if (event.key === 'ArrowLeft')
            next = (current + navigationViews.length - 1) % navigationViews.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = navigationViews.length - 1;
          else return;
          event.preventDefault();
          setView(navigationViews[next].id);
          document.getElementById(`tab-${navigationViews[next].id}`)?.focus();
        }}
      >
        {navigationViews.map((tab) => (
          <RouteLink
            href={hrefFor(undefined, tab.id)}
            navigate={navigate}
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={view === tab.id}
            aria-controls="view-panel"
            tabIndex={view === tab.id ? 0 : -1}
            className={
              view === tab.id
                ? 'active [&_.tab-count]:bg-[#deebff] [&_.tab-count]:text-[#0052cc]'
                : ''
            }
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'backlog' && backlog > 0 && (
              <span
                className={cn(
                  'tab-count min-w-4.5 py-px px-[5px] text-center rounded-[3px] text-[10px] leading-4 bg-[#dfe1e6]',
                  'text-[#44546f]',
                )}
              >
                {backlog}
              </span>
            )}
          </RouteLink>
        ))}
      </div>
      <div
        className={cn(
          'toolbar flex justify-between items-center gap-5 min-h-[69px] py-4 px-0 max-[760px]:min-h-[65px]',
          'max-[760px]:gap-2.5 max-[520px]:items-start',
        )}
      >
        <div
          className={cn(
            'toolbar-filters flex items-center gap-2 min-w-0 max-[760px]:gap-1.5 max-[520px]:flex-wrap',
            '[&>.dropdown]:w-auto [&>.dropdown]:max-w-47.5',
          )}
        >
          {view !== 'notes' ? (
            <>
              <Dropdown
                className={cn(
                  'filter-select border border-transparent rounded bg-[#f1f2f4] text-[#44546f] min-h-8 py-[5px]',
                  'px-2 max-w-[175px] text-xs cursor-pointer [&:hover]:bg-[#dfe1e6] [&.is-active]:bg-[#e9f2ff]',
                  '[&.is-active]:text-[#0052cc] [&.is-active]:border-[#85b8ff] max-[760px]:max-w-[125px]',
                  'max-[760px]:text-[11px]',
                  filters.priority !== 'all' ? 'is-active' : '',
                )}
                aria-label="Фильтр по приоритету"
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters((previous) => ({ ...previous, priority: value }))
                }
                options={[
                  { value: 'all', label: 'Приоритет' },
                  ...Object.entries(priorityNames).map(([value, name]) => ({
                    value: value,
                    label: name,
                  })),
                ]}
              />
              <Dropdown
                className={cn(
                  'filter-select border border-transparent rounded bg-[#f1f2f4] text-[#44546f] min-h-8 py-[5px]',
                  'px-2 max-w-[175px] text-xs cursor-pointer [&:hover]:bg-[#dfe1e6] [&.is-active]:bg-[#e9f2ff]',
                  '[&.is-active]:text-[#0052cc] [&.is-active]:border-[#85b8ff] max-[760px]:max-w-[125px]',
                  'max-[760px]:text-[11px]',
                  filters.status !== 'all' ? 'is-active' : '',
                )}
                aria-label="Фильтр по статусу"
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((previous) => ({ ...previous, status: value }))
                }
                options={[
                  { value: 'all', label: 'Статус' },
                  ...statuses.map((status) => ({ value: status, label: statusNames[status] })),
                ]}
              />
              {activeFilters && (
                <button
                  className={cn(
                    'text-button inline-flex items-center gap-[5px] py-1 px-0 text-[13px] text-muted',
                    '[&:hover]:text-brand [&.danger]:text-danger clear-filters text-xs whitespace-nowrap px-[5px]',
                    'max-[760px]:text-[10px]',
                  )}
                  onClick={() => setFilters(emptyFilters)}
                >
                  <X size={13} />
                  Сбросить
                </button>
              )}
            </>
          ) : (
            <span
              className={cn(
                'toolbar-description text-muted text-[13px] max-[1000px]:text-xs max-[520px]:max-w-[175px]',
                'max-[520px]:text-[11px] max-[520px]:leading-4.5',
              )}
            >
              Документация, решения и заметки проекта
            </span>
          )}
        </div>
        <div
          className={cn(
            'toolbar-right flex items-center gap-2 min-w-0 max-[520px]:[&>.button]:text-[11px]',
            'max-[520px]:[&>.button]:px-2',
          )}
        >
          {view === 'notes' ? (
            <Button disabled={readOnly} onClick={openPage} variant="primary" size="compact">
              <Plus size={16} />
              Создать страницу
            </Button>
          ) : (
            <>
              <span
                className={
                  'results-count text-muted text-[11px] whitespace-nowrap pr-1.5 max-[1000px]:hidden'
                }
              >
                {activeFilters
                  ? `${filtered.length} из ${scoped.length}`
                  : `${scoped.length} задач`}
              </span>
              <label
                className={cn(
                  'sort-control flex items-center gap-[5px] text-muted [&_.dropdown-trigger]:border-0',
                  '[&_.dropdown-trigger]:bg-transparent [&_.dropdown-trigger]:p-[3px]',
                  '[&_.dropdown-trigger]:text-muted [&_.dropdown-trigger]:text-[11px]',
                  '[&_.dropdown-trigger]:max-w-[145px] [&_.dropdown-trigger]:cursor-pointer',
                  '[&_.dropdown-trigger]:min-h-7 max-[760px]:[&>svg]:hidden',
                  'max-[760px]:[&>.dropdown_.dropdown-trigger]:text-[10px]',
                  'max-[760px]:[&>.dropdown_.dropdown-trigger]:max-w-[125px]',
                  'max-[520px]:[&_.dropdown-trigger]:max-w-[115px]',
                )}
              >
                <ArrowDownWideNarrow size={15} />
                <span
                  className={
                    'sr-only absolute w-px h-px p-0 overflow-hidden [clip:rect(0,0,0,0)] whitespace-nowrap border-0'
                  }
                >
                  Сортировка задач
                </span>
                <Dropdown
                  aria-label="Сортировка задач"
                  value={filters.sort}
                  onValueChange={(value) =>
                    setFilters((previous) => ({ ...previous, sort: value as Sort }))
                  }
                  options={[
                    { value: 'created', label: 'По дате создания' },
                    { value: 'priority', label: 'По приоритету' },
                    { value: 'due', label: 'По сроку' },
                  ]}
                />
              </label>
            </>
          )}
        </div>
      </div>
    </>
  );
};
