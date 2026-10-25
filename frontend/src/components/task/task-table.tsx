import { useCalendar } from '@/lib/calendar';
import { TaskLink } from '@/components/task/task-link';
import { IconButton } from '@/components/ui/button';
import { categoryStyles } from '@/components/task/task-styles';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { useContext } from 'react';
import { ArrowRight, CalendarDays, SquareCheck } from 'lucide-react';
import { priorityNames, statusIndex } from '@/lib/model/workspace';
import type { Priority, Project, Task } from '@/lib/model/workspace';
import type { Member } from '@/lib/api/types';
import { MutationContext } from '@/components/ui/modal';
import { dueLabel, taskKey } from '@/lib/model/task';
import { TaskType, PriorityBadge } from '@/components/task/task-meta';
export const TaskTable = ({
  tasks,
  projects,
  members = [],
  onOpen,
  onChange,
  compact = false,
  startAction = false,
}: {
  members?: Member[];
  tasks: Task[];
  projects: Project[];
  onOpen: (task: Task) => void;
  onChange: (task: Task) => Promise<boolean>;
  compact?: boolean;
  startAction?: boolean;
}) => {
  const { today: todayDate } = useCalendar();
  const mutation = useContext(MutationContext);
  const statuses = statusIndex(projects);
  return (
    <div className={cn('issue-table-wrap overflow-x-auto w-full', compact ? 'is-compact' : '')}>
      <table
        className={cn(
          'issue-table w-full border-collapse text-left text-xs whitespace-nowrap [&_th]:py-2.75',
          '[&_th]:px-3 [&_th]:border-b-2 [&_th]:border-line [&_th]:text-muted [&_th]:text-caption',
          '[&_th]:font-semibold [&_td]:py-2.5 [&_td]:px-3 [&_td]:border-b [&_td]:border-line-soft',
          '[&_td]:h-12.25 [&_tr:hover_td]:bg-surface-soft [&_th:nth-child(2)]:w-full',
          '[&_th:nth-child(2)]:min-w-55 max-desktop:[&_td]:px-2.5 max-desktop:[&_th]:px-2.5',
          '[&_.dropdown]:w-auto [&_.dropdown]:max-w-36.25',
        )}
      >
        <thead>
          <tr>
            <th className={'issue-key-column min-w-31.25'}>Ключ</th>
            <th>Название</th>
            {!compact && (
              <>
                <th>Проект</th>
                <th>Исполнитель</th>
              </>
            )}
            <th>Статус</th>
            <th>Приоритет</th>
            <th>Срок</th>
            {startAction && (
              <th>
                <span
                  className={
                    'sr-only absolute w-px h-px p-0 overflow-hidden [clip:rect(0,0,0,0)] whitespace-nowrap border-0'
                  }
                >
                  Действия
                </span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <TaskLink
                  task={task}
                  onOpen={onOpen}
                  className={cn(
                    'issue-key-link inline-flex items-center gap-1.75 text-muted py-0.5 px-0 text-tiny',
                    'font-medium [&:hover]:text-brand',
                  )}
                  title={task.id}
                >
                  <TaskType done={statuses.category(task) === 'done'} type={task.type} />
                  {taskKey(task)}
                </TaskLink>
              </td>
              <td>
                <TaskLink
                  task={task}
                  onOpen={onOpen}
                  className={cn(
                    'issue-title-link text-left text-ink py-0.5 px-0 text-body max-w-110 overflow-hidden',
                    'whitespace-nowrap text-ellipsis align-middle [&:hover]:text-brand [&:hover]:underline',
                    '[&.is-done]:text-muted [&.is-done]:line-through max-desktop:max-w-65',
                    statuses.category(task) === 'done' ? 'is-done' : '',
                  )}
                >
                  {task.title}
                </TaskLink>
                {task.checklist.length > 0 && (
                  <span
                    className={
                      'table-checks inline-flex items-center gap-1 ml-2.5 text-tiny text-muted'
                    }
                  >
                    <SquareCheck size={12} />
                    {task.checklist.filter((item) => item.done).length}/{task.checklist.length}
                  </span>
                )}
              </td>
              {!compact && (
                <td>
                  <span
                    className={
                      'table-project text-muted text-caption max-w-27.5 overflow-hidden block text-ellipsis'
                    }
                  >
                    {projects.find((project) => project.id === task.projectId)?.name}
                  </span>
                </td>
              )}
              {!compact && (
                <td>
                  <button
                    className={cn(
                      'table-assignee text-xs text-ink-secondary bg-transparent whitespace-nowrap max-w-37.5',
                      'overflow-hidden text-ellipsis inline-flex items-center gap-1.5 [&:hover]:text-brand',
                    )}
                    onClick={() => onOpen(task)}
                    aria-label={`Исполнитель задачи: ${task.title}`}
                  >
                    {members.find((m) => m.user.id === task.assigneeId)?.user && (
                      <Avatar
                        user={members.find((m) => m.user.id === task.assigneeId)!.user}
                        className={'issue-assignee w-5.5 h-5.5 text-tiny'}
                      />
                    )}
                    {members.find((m) => m.user.id === task.assigneeId)?.user.name ??
                      (task.assigneeId ? 'Бывший участник' : 'Не назначен')}
                  </button>
                </td>
              )}
              <td>
                <Dropdown
                  aria-label={`Статус задачи: ${task.title}`}
                  className={cn(
                    'inline-status border-0 rounded-chip text-tiny font-semibold uppercase py-1 px-1.25',
                    'cursor-pointer max-w-32.5',
                    categoryStyles[statuses.category(task)],
                  )}
                  disabled={mutation.readOnly || mutation.saving}
                  value={task.status}
                  onValueChange={(value) => {
                    void onChange({ ...task, status: value });
                  }}
                  options={statuses
                    .list(task.projectId)
                    .map((status) => ({ value: status.id, label: status.name }))}
                />
              </td>
              <td>
                <div
                  className={cn(
                    'inline-priority flex items-center gap-0.75 [&_.dropdown-trigger]:p-0.75',
                    '[&_.dropdown-trigger]:border-0 [&_.dropdown-trigger]:text-ink-secondary',
                    '[&_.dropdown-trigger]:bg-transparent [&_.dropdown-trigger]:text-caption',
                    '[&_.dropdown-trigger]:cursor-pointer [&_.dropdown-trigger]:min-h-6.75',
                  )}
                >
                  <PriorityBadge priority={task.priority} label={false} />
                  <Dropdown
                    aria-label={`Приоритет задачи: ${task.title}`}
                    disabled={mutation.readOnly || mutation.saving}
                    value={task.priority}
                    onValueChange={(value) => {
                      void onChange({ ...task, priority: value as Priority });
                    }}
                    options={[
                      ...Object.entries(priorityNames).map(([value, name]) => ({
                        value: value,
                        label: name,
                      })),
                    ]}
                  />
                </div>
              </td>
              <td>
                <button
                  className={cn(
                    'table-due inline-flex items-center gap-1.25 text-caption text-muted min-h-6.5 p-0',
                    '[&:hover]:text-brand',
                    task.due && task.due < todayDate && statuses.category(task) !== 'done'
                      ? 'overdue text-danger!'
                      : '',
                  )}
                  aria-label={`Изменить срок задачи: ${task.title}`}
                  onClick={() => onOpen(task)}
                >
                  {task.due ? (
                    <>
                      <CalendarDays size={13} />
                      {dueLabel(task.due, todayDate)}
                    </>
                  ) : (
                    '—'
                  )}
                </button>
              </td>
              {startAction && (
                <td>
                  <IconButton
                    title="Начать работу"
                    aria-label={`Начать работу: ${task.title}`}
                    disabled={mutation.readOnly || mutation.saving}
                    onClick={() => {
                      void onChange({
                        ...task,
                        status: statuses.resolve(task.projectId, 'progress'),
                      });
                    }}
                  >
                    <ArrowRight size={17} />
                  </IconButton>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
