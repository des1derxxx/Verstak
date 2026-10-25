import { statusStyles } from '@/shared/ui/variants';
import { cn } from '@/shared/ui/cn';
import { Plus } from 'lucide-react';
import { statusNames } from '@/shared/model/workspace';
import { taskKey } from '@/features/tasks/task-view';
import type { TaskEditorModel } from '@/features/tasks/task-editor/useTaskEditor';
export const TaskRelationships = ({ model }: { model: TaskEditorModel }) => {
  const { task, children, mutation, onSubtask, dirty, parent, onOpenTask } = model;
  return (
    <div
      className={'task-relationships py-0 px-6 [&:empty]:hidden max-[620px]:py-0 max-[620px]:px-4'}
    >
      {task && (
        <section className={'issue-section flex flex-col gap-2.5 [&>textarea]:min-h-28'}>
          <div
            className={cn(
              'issue-section-heading [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink flex items-center',
              'gap-2.5 [&>span]:text-[11px] [&>span]:text-muted [&_.segmented]:ml-auto',
            )}
          >
            <h3>
              Подзадачи{' '}
              {children.length > 0 &&
                `(${children.filter((c) => c.status === 'done').length}/${children.length})`}
            </h3>
            {!mutation.readOnly && onSubtask && (
              <button
                type="button"
                disabled={dirty}
                title={dirty ? 'Сначала сохрани изменения' : undefined}
                className={cn(
                  'text-button inline-flex items-center gap-[5px] py-1 px-0 text-[13px] text-muted',
                  '[&:hover]:text-brand [&.danger]:text-danger',
                )}
                onClick={() => onSubtask(task)}
              >
                <Plus size={14} />
                Создать подзадачу
              </button>
            )}
          </div>
          {parent && (
            <p className={'body-muted text-[13px] text-muted leading-[21px]'}>
              Родитель:{' '}
              <button
                type="button"
                className={cn(
                  'text-button inline-flex items-center gap-[5px] py-1 px-0 text-[13px] text-muted',
                  '[&:hover]:text-brand [&.danger]:text-danger',
                )}
                disabled={dirty}
                onClick={() => onOpenTask?.(parent)}
              >
                {taskKey(parent)}
              </button>
            </p>
          )}
          {children.map((child) => (
            <button
              type="button"
              className={cn(
                'subtask-row flex gap-2.5 w-full items-center py-2.5 px-0.5 border-b border-[#ebecf0]',
                'bg-transparent text-left [&>:nth-child(2)]:flex-1 [&>:nth-child(2)]:wrap-anywhere',
                '[&_.issue-key]:shrink-0 [&:hover]:bg-[#f7f8f9]',
              )}
              disabled={dirty}
              key={child.id}
              onClick={() => onOpenTask?.(child)}
            >
              <span className={'issue-key text-[11px] text-muted font-medium'}>
                {taskKey(child)}
              </span>
              <span>{child.title}</span>
              <span className={cn('status-badge', statusStyles[child.status])}>
                {statusNames[child.status]}
              </span>
            </button>
          ))}
          {!children.length && (
            <p className={'body-muted text-[13px] text-muted leading-[21px]'}>Подзадач пока нет</p>
          )}
        </section>
      )}
    </div>
  );
};
