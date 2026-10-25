'use client';

import { useWorkspace } from '@/features/workspaces/WorkspaceContext';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/ui/cn';
import { Plus, Search } from 'lucide-react';
import { emptyFilters } from '@/features/tasks/task-view';
import { IssueTable } from '@/features/tasks/IssueTable';
export const ListPanel = () => {
  const model = useWorkspace();
  const {
    readOnly,
    selected,
    members,
    filtered,
    sortedProjects,
    activeFilters,
    openTask,
    saveTask,
    setFilters,
    newTask,
  } = model;
  return (
    <div className={'list-view border border-line rounded-[5px] overflow-hidden'}>
      {filtered.length > 0 ? (
        <IssueTable
          tasks={filtered}
          members={members}
          projects={sortedProjects}
          onOpen={openTask}
          onChange={saveTask}
        />
      ) : (
        <div
          className={cn(
            'empty-state flex flex-col items-center justify-center gap-[15px] text-center min-h-65 py-12.5',
            'px-6 text-muted col-[1/-1] [&>svg]:text-[#8590a2] [&_h2]:text-[19px] [&_h2]:font-semibold',
            '[&_h2]:leading-7 [&_h2]:text-ink [&_p]:text-[13px] [&_p]:leading-[21px] [&_p]:max-w-102.5',
            '[&_p]:text-muted max-[520px]:py-9.5 max-[520px]:px-[15px] max-[520px]:[&_h2]:text-[17px]',
            'max-[520px]:[&_p]:text-xs',
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
      <div className={'list-quick-create py-[15px] px-2.5'}>
        <Button disabled={readOnly} onClick={() => newTask()} variant="secondary" size="compact">
          <Plus size={16} />
          Создать задачу
        </Button>
      </div>
    </div>
  );
};
