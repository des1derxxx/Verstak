'use client';

import { RouteLink } from '@/components/ui/route-link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Dropdown } from '@/components/ui/dropdown';
import { ArrowDownWideNarrow, FileText, LayoutGrid, List, ListTodo, Plus, X } from 'lucide-react';
import { priorityNames, statuses, statusNames } from '@/lib/model/workspace';
import { emptyFilters } from '@/lib/model/task';
import type { Sort } from '@/lib/model/task';
import { useNavigation } from '@/lib/navigation-guard';
import { viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useNoteActions } from '@/lib/workspace/use-workspace-actions';
import { useTaskFilters, useTaskView } from '@/lib/workspace/use-workspace-location';
const views = [
  { id: 'board', label: 'Доска', icon: LayoutGrid },
  { id: 'backlog', label: 'Бэклог', icon: ListTodo },
  { id: 'list', label: 'Список', icon: List },
  { id: 'notes', label: 'Страницы', icon: FileText },
] as const;
export const WorkspaceToolbar = () => {
  const { info, readOnly } = useWorkspace();
  const { navigate } = useNavigation();
  const { view, scope, filtered, scoped, counts, filtersActive: activeFilters } = useTaskView();
  const { filters, setFilters } = useTaskFilters();
  const { newNote: openPage } = useNoteActions();
  const navigationViews = scope === 'today' ? views.filter((item) => item.id !== 'notes') : views;
  const hrefFor = (mode: (typeof views)[number]['id']) => viewPath(info.id, scope, mode);
  return (
    <>
      <div
        className={cn(
          'view-tabs flex gap-6.25 min-h-10.5 border-b-2 border-neutral [&>:is(button,a)]:inline-flex',
          '[&>:is(button,a)]:items-center [&>:is(button,a)]:gap-1.75 [&>:is(button,a)]:relative [&>:is(button,a)]:text-muted',
          '[&>:is(button,a)]:font-medium [&>:is(button,a)]:text-body [&>:is(button,a)]:pt-0 [&>:is(button,a)]:px-0',
          "[&>:is(button,a)]:pb-3.25 [&>:is(button,a).active]:text-brand [&>:is(button,a).active::after]:content-['']",
          '[&>:is(button,a).active::after]:absolute [&>:is(button,a).active::after]:[inset:auto_0_-2px]',
          '[&>:is(button,a).active::after]:h-0.75 [&>:is(button,a).active::after]:rounded-xs',
          '[&>:is(button,a).active::after]:bg-brand [&>:is(button,a):hover]:text-brand max-tablet:gap-6.25',
          'max-tablet:[&>:is(button,a)]:text-xs max-tablet:[&>:is(button,a)]:gap-1.5 max-tablet:[&>:is(button,a)]:pb-3',
          'max-phone:gap-5.25 max-phone:[&>:is(button,a)]:gap-1.25 max-phone:[&>:is(button,a)>svg]:w-3.5',
          'max-phone:[&_.tab-count]:text-micro max-phone:[&_.tab-count]:px-1',
          'max-phone:[&_.tab-count]:min-w-3.5',
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
          navigate(hrefFor(navigationViews[next].id));
          document.getElementById(`tab-${navigationViews[next].id}`)?.focus();
        }}
      >
        {navigationViews.map((tab) => (
          <RouteLink
            href={hrefFor(tab.id)}
            navigate={navigate}
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={view === tab.id}
            aria-controls="view-panel"
            tabIndex={view === tab.id ? 0 : -1}
            className={
              view === tab.id
                ? 'active [&_.tab-count]:bg-brand-tint [&_.tab-count]:text-brand-strong'
                : ''
            }
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'backlog' && counts.backlog > 0 && (
              <span
                className={cn(
                  'tab-count min-w-4.5 py-px px-1.25 text-center rounded-chip text-tiny leading-4 bg-line',
                  'text-ink-secondary',
                )}
              >
                {counts.backlog}
              </span>
            )}
          </RouteLink>
        ))}
      </div>
      <div
        className={cn(
          'toolbar flex justify-between items-center gap-5 min-h-17.25 py-4 px-0 max-tablet:min-h-16.25',
          'max-tablet:gap-2.5 max-phone:items-start',
        )}
      >
        <div
          className={cn(
            'toolbar-filters flex items-center gap-2 min-w-0 max-tablet:gap-1.5 max-phone:flex-wrap',
            '[&>.dropdown]:w-auto [&>.dropdown]:max-w-47.5',
          )}
        >
          {view !== 'notes' ? (
            <>
              <Dropdown
                className={cn(
                  'filter-select border border-transparent rounded bg-neutral text-ink-secondary min-h-8 py-1.25',
                  'px-2 max-w-43.75 text-xs cursor-pointer [&:hover]:bg-line [&.is-active]:bg-brand-soft',
                  '[&.is-active]:text-brand-strong [&.is-active]:border-brand-border max-tablet:max-w-31.25',
                  'max-tablet:text-caption',
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
                  'filter-select border border-transparent rounded bg-neutral text-ink-secondary min-h-8 py-1.25',
                  'px-2 max-w-43.75 text-xs cursor-pointer [&:hover]:bg-line [&.is-active]:bg-brand-soft',
                  '[&.is-active]:text-brand-strong [&.is-active]:border-brand-border max-tablet:max-w-31.25',
                  'max-tablet:text-caption',
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
                    'text-button inline-flex items-center gap-1.25 py-1 px-0 text-body text-muted',
                    '[&:hover]:text-brand [&.danger]:text-danger clear-filters text-xs whitespace-nowrap px-1.25',
                    'max-tablet:text-tiny',
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
                'toolbar-description text-muted text-body max-laptop:text-xs max-phone:max-w-43.75',
                'max-phone:text-caption max-phone:leading-4.5',
              )}
            >
              Документация, решения и заметки проекта
            </span>
          )}
        </div>
        <div
          className={cn(
            'toolbar-right flex items-center gap-2 min-w-0 max-phone:[&>.button]:text-caption',
            'max-phone:[&>.button]:px-2',
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
                  'results-count text-muted text-caption whitespace-nowrap pr-1.5 max-laptop:hidden'
                }
              >
                {activeFilters
                  ? `${filtered.length} из ${scoped.length}`
                  : `${scoped.length} задач`}
              </span>
              <label
                className={cn(
                  'sort-control flex items-center gap-1.25 text-muted [&_.dropdown-trigger]:border-0',
                  '[&_.dropdown-trigger]:bg-transparent [&_.dropdown-trigger]:p-0.75',
                  '[&_.dropdown-trigger]:text-muted [&_.dropdown-trigger]:text-caption',
                  '[&_.dropdown-trigger]:max-w-36.25 [&_.dropdown-trigger]:cursor-pointer',
                  '[&_.dropdown-trigger]:min-h-7 max-tablet:[&>svg]:hidden',
                  'max-tablet:[&>.dropdown_.dropdown-trigger]:text-tiny',
                  'max-tablet:[&>.dropdown_.dropdown-trigger]:max-w-31.25',
                  'max-phone:[&_.dropdown-trigger]:max-w-28.75',
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
