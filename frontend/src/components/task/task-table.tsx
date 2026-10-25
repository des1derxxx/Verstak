import { useCalendar } from '@/lib/calendar';
import { TaskLink } from '@/components/task/task-link';
import { IconButton } from '@/components/ui/button';
import { statusStyles } from '@/components/task/task-styles';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { useContext } from 'react';
import { ArrowRight, CalendarDays, SquareCheck } from 'lucide-react';
import { priorityNames, statuses, statusNames } from '@/lib/model/workspace';
import type { Priority, Project, Status, Task } from '@/lib/model/workspace';
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
  return (
    <div className={cn('issue-table-wrap overflow-x-auto w-full', compact ? 'is-compact' : '')}>
      <table
        className={cn(
          'issue-table w-full border-collapse text-left text-xs whitespace-nowrap [&_th]:py-[11px]',
          '[&_th]:px-3 [&_th]:border-b-2 [&_th]:border-[#dfe1e6] [&_th]:text-muted [&_th]:text-[11px]',
          '[&_th]:font-semibold [&_td]:py-2.5 [&_td]:px-3 [&_td]:border-b [&_td]:border-[#ebecf0]',
          '[&_td]:h-[49px] [&_tr:hover_td]:bg-[#f7f8f9] [&_th:nth-child(2)]:w-full',
          '[&_th:nth-child(2)]:min-w-55 max-[1200px]:[&_td]:px-2.5 max-[1200px]:[&_th]:px-2.5',
          '[&_.dropdown]:w-auto [&_.dropdown]:max-w-[145px]',
        )}
      >
        <thead>
          <tr>
            <th className={'issue-key-column min-w-[125px]'}>Ключ</th>
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
                    'issue-key-link inline-flex items-center gap-[7px] text-muted py-0.5 px-0 text-[10px]',
                    'font-medium [&:hover]:text-brand',
                  )}
                  title={task.id}
                >
                  <TaskType done={task.status === 'done'} type={task.type} />
                  {taskKey(task)}
                </TaskLink>
              </td>
              <td>
                <TaskLink
                  task={task}
                  onOpen={onOpen}
                  className={cn(
                    'issue-title-link text-left text-ink py-0.5 px-0 text-[13px] max-w-110 overflow-hidden',
                    'whitespace-nowrap text-ellipsis align-middle [&:hover]:text-brand [&:hover]:underline',
                    '[&.is-done]:text-muted [&.is-done]:line-through max-[1200px]:max-w-65',
                    task.status === 'done' ? 'is-done' : '',
                  )}
                >
                  {task.title}
                </TaskLink>
                {task.checklist.length > 0 && (
                  <span
                    className={
                      'table-checks inline-flex items-center gap-1 ml-2.5 text-[10px] text-muted'
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
                      'table-project text-muted text-[11px] max-w-27.5 overflow-hidden block text-ellipsis'
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
                      'table-assignee text-xs text-[#44546f] bg-transparent whitespace-nowrap max-w-37.5',
                      'overflow-hidden text-ellipsis inline-flex items-center gap-1.5 [&:hover]:text-[#0c66e4]',
                    )}
                    onClick={() => onOpen(task)}
                    aria-label={`Исполнитель задачи: ${task.title}`}
                  >
                    {members.find((m) => m.user.id === task.assigneeId)?.user && (
                      <Avatar
                        user={members.find((m) => m.user.id === task.assigneeId)!.user}
                        className={'issue-assignee w-5.5 h-5.5 text-[10px]'}
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
                    'inline-status border-0 rounded-[3px] text-[10px] font-semibold uppercase py-1 px-[5px]',
                    'cursor-pointer max-w-32.5',
                    statusStyles[task.status],
                  )}
                  disabled={mutation.readOnly || mutation.saving}
                  value={task.status}
                  onValueChange={(value) => {
                    void onChange({ ...task, status: value as Status });
                  }}
                  options={[
                    ...statuses.map((status) => ({ value: status, label: statusNames[status] })),
                  ]}
                />
              </td>
              <td>
                <div
                  className={cn(
                    'inline-priority flex items-center gap-[3px] [&_.dropdown-trigger]:p-[3px]',
                    '[&_.dropdown-trigger]:border-0 [&_.dropdown-trigger]:text-[#44546f]',
                    '[&_.dropdown-trigger]:bg-transparent [&_.dropdown-trigger]:text-[11px]',
                    '[&_.dropdown-trigger]:cursor-pointer [&_.dropdown-trigger]:min-h-[27px]',
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
                    'table-due inline-flex items-center gap-[5px] text-[11px] text-muted min-h-6.5 p-0',
                    '[&:hover]:text-brand',
                    task.due && task.due < todayDate && task.status !== 'done'
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
                      void onChange({ ...task, status: 'progress' });
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
