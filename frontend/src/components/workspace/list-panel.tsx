'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Plus, Search } from 'lucide-react';
import { emptyFilters } from '@/lib/model/task';
import { TaskTable } from '@/components/task/task-table';
import { useMembers } from '@/queries/members';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useTaskActions } from '@/lib/workspace/use-workspace-actions';
import { useTaskFilters, useTaskView } from '@/lib/workspace/workspace-location';
export const ListPanel = () => {
  const { readOnly } = useWorkspace();
  const { members } = useMembers();
  const {
    scope: selected,
    filtered,
    projects: sortedProjects,
    filtersActive: activeFilters,
  } = useTaskView();
  const { setFilters } = useTaskFilters();
  const { openTask, saveTask, newTask } = useTaskActions();
  return (
    <div className={'list-view border border-line rounded-card overflow-hidden'}>
      {filtered.length > 0 ? (
        <TaskTable
          tasks={filtered}
          members={members}
          projects={sortedProjects}
          onOpen={openTask}
          onChange={saveTask}
        />
      ) : (
        <div
          className={cn(
            'empty-state flex flex-col items-center justify-center gap-3.75 text-center min-h-65 py-12.5',
            'px-6 text-muted col-[1/-1] [&>svg]:text-placeholder [&_h2]:text-title [&_h2]:font-semibold',
            '[&_h2]:leading-7 [&_h2]:text-ink [&_p]:text-body [&_p]:leading-5.25 [&_p]:max-w-102.5',
            '[&_p]:text-muted max-phone:py-9.5 max-phone:px-3.75 max-phone:[&_h2]:text-title-sm',
            'max-phone:[&_p]:text-xs',
          )}
        >
          <Search size={30} strokeWidth={1.5} />
          <h2>
            {activeFilters
              ? 'Задачи не найдены'
              : selected === 'today'
                ? 'На сегодня всё спокойно'
                : 'Начни с первой задачи'}
          </h2>
          <p>
            {activeFilters
              ? 'Попробуй другой запрос или сбрось фильтры.'
              : selected === 'today'
                ? 'Здесь появятся задачи со сроком на сегодня и просроченные.'
                : 'Создай задачу, укажи детали и начни работу.'}
          </p>
          {activeFilters && (
            <Button onClick={() => setFilters(emptyFilters)} variant="secondary">
              Сбросить фильтры
            </Button>
          )}
        </div>
      )}
      <div className={'list-quick-create py-3.75 px-2.5'}>
        <Button disabled={readOnly} onClick={() => newTask()} variant="secondary" size="compact">
          <Plus size={16} />
          Создать задачу
        </Button>
      </div>
    </div>
  );
};
