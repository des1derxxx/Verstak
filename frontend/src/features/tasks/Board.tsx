import { useCalendar } from '@/shared/ui/CalendarContext';
import { TaskLink } from '@/features/tasks/TaskLink';
import { statusStyles } from '@/shared/ui/variants';
import { cn } from '@/shared/ui/cn';
import { Avatar } from '@/shared/ui/Avatar';
import { useContext, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, GripVertical, SquareCheck } from 'lucide-react';
import { statusNames } from '@/shared/model/workspace';
import type { Project, Status, Task } from '@/shared/model/workspace';
import type { Member } from '@/shared/api/types';
import { MutationContext } from '@/shared/ui/Modal';
import { dueLabel, taskKey } from '@/features/tasks/task-view';
import { IssueType, PriorityBadge, StatusIcon } from '@/features/tasks/IssueMeta';
import { IssueTable } from '@/features/tasks/IssueTable';
import { QuickCreate } from '@/features/tasks/QuickCreate';
const boardStatuses: Status[] = ['todo', 'progress', 'done'];
export const Board = ({
  tasks,
  projects,
  members = [],
  projectId,
  today,
  filtered,
  backlogCount,
  onOpen,
  onCreate,
  onChange,
  onBacklog,
}: {
  members?: Member[];
  tasks: Task[];
  projects: Project[];
  projectId: string;
  today: boolean;
  filtered: boolean;
  backlogCount: number;
  onOpen: (task: Task) => void;
  onCreate: (task: Task) => Promise<boolean>;
  onChange: (task: Task) => Promise<boolean>;
  onBacklog: () => void;
}) => {
  const { today: todayDate } = useCalendar();
  const mutation = useContext(MutationContext);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const dragged = useRef<string | null>(null);
  return (
    <>
      <div
        className={cn(
          'board grid grid-cols-[repeat(3,minmax(245px,1fr))] items-start gap-5 overflow-x-auto pb-[3px]',
          'max-[1000px]:grid-cols-[repeat(3,minmax(250px,1fr))]',
          'max-[760px]:grid-cols-[repeat(3,minmax(270px,1fr))] max-[760px]:gap-3',
          'max-[520px]:grid-cols-[repeat(3,minmax(275px,1fr))]',
        )}
        aria-label="Доска задач"
      >
        {boardStatuses.map((status) => (
          <section
            className={cn(
              'board-column flex flex-col bg-surface-soft border border-transparent rounded-[5px]',
              'h-[max(390px,calc(100dvh_-_340px))] [transition:border-color_.15s,background_.15s]',
              '[&.drag-over]:border-[#388bff] [&.drag-over]:bg-[#e9f2ff]',
              'max-[760px]:h-[max(390px,calc(100dvh_-_330px))]',
              `column-${status}`,
              dragOver === status ? 'drag-over' : '',
            )}
            key={status}
            aria-label={statusNames[status]}
            onDragOver={(event) => {
              if (mutation.readOnly || mutation.saving || !dragged.current) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDragOver(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(null);
              if (mutation.readOnly || mutation.saving) return;
              const task = tasks.find((item) => item.id === dragged.current);
              dragged.current = null;
              if (task && task.status !== status) void onChange({ ...task, status });
            }}
          >
            <div
              className={cn(
                'column-heading flex items-center min-h-12 py-3 px-[13px] [&>div]:flex [&>div]:items-center',
                '[&>div]:gap-[7px] [&_h2]:text-[11px] [&_h2]:font-semibold [&_h2]:text-[#44546f]',
                '[&_h2]:uppercase [&_h2]:tracking-[.35px]',
              )}
            >
              <div>
                <span
                  className={cn(
                    'status-icon inline-flex text-muted [&.status-progress]:text-brand [&.status-done]:text-success',
                    statusStyles[status],
                  )}
                >
                  <StatusIcon status={status} />
                </span>
                <h2>{statusNames[status]}</h2>
                <span className={'column-count text-[11px] text-muted pl-[3px]'}>
                  {tasks.filter((task) => task.status === status).length}
                </span>
              </div>
            </div>
            <div
              className={cn(
                'column-cards flex flex-col flex-1 min-h-0 overflow-y-auto gap-2 pt-0 px-2 pb-2.5',
                '[scrollbar-width:thin] [scrollbar-color:#dfe1e6_transparent] [&>*]:shrink-0',
              )}
            >
              {tasks
                .filter((task) => task.status === status)
                .map((task) => {
                  const assignee = members.find((m) => m.user.id === task.assigneeId)?.user;
                  const project = projects.find((item) => item.id === task.projectId);
                  return (
                    <TaskLink
                      task={task}
                      onOpen={onOpen}
                      key={task.id}
                      className={cn(
                        'task-card flex flex-col w-full p-[15px] bg-white border border-[#dfe1e6] rounded-[5px]',
                        'shadow-[0_1px_1px_#091e4214] text-left [transition:border-color_.12s,box-shadow_.12s]',
                        '[&:hover]:border-[#85b8ff] [&:hover]:shadow-[0_1px_5px_#091e4226] [&:active]:[cursor:grabbing]',
                        '[&.is-done_.task-card-title]:text-muted [&.is-done_.task-card-title]:line-through',
                        '[&.is-done_.task-card-title]:[text-decoration-color:#b3b9c4] [&:hover_.drag-grip]:opacity-[1]',
                        status === 'done' ? 'is-done' : '',
                      )}
                      draggable={!mutation.readOnly && !mutation.saving}
                      onDragStart={(event) => {
                        dragged.current = task.id;
                        event.dataTransfer.setData('text/plain', task.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        dragged.current = null;
                        setDragOver(null);
                      }}
                    >
                      <span
                        className={
                          'task-card-title text-sm leading-[21px] font-normal text-[#172b4d] wrap-anywhere'
                        }
                      >
                        {task.title}
                      </span>
                      {task.labels.length > 0 && (
                        <span className={'tags flex flex-wrap gap-1 mt-2.5'}>
                          {task.labels.slice(0, 3).map((label) => (
                            <span
                              className={cn(
                                'tag text-[10px] leading-4 bg-[#f1f2f4] rounded-[3px] py-px px-[5px] text-[#44546f]',
                                'overflow-hidden text-ellipsis max-w-full',
                              )}
                              key={label}
                            >
                              {label}
                            </span>
                          ))}
                        </span>
                      )}
                      {(task.due || task.checklist.length > 0) && (
                        <span
                          className={'card-detail-row flex items-center flex-wrap gap-2 mt-2.5'}
                        >
                          {task.due && (
                            <span
                              className={cn(
                                'due-chip inline-flex items-center gap-1 text-[10px] leading-[17px] text-muted py-px px-[5px]',
                                'border border-[#dfe1e6] rounded-[3px] [&.overdue]:border-[#f5c8c5] [&.overdue]:bg-[#fff1f0]',
                                task.due < todayDate && status !== 'done'
                                  ? 'overdue text-danger!'
                                  : '',
                              )}
                            >
                              <CalendarDays size={12} />
                              {dueLabel(task.due, todayDate)}
                            </span>
                          )}
                          {task.checklist.length > 0 && (
                            <span
                              className={
                                'check-chip inline-flex items-center gap-1 text-[10px] leading-[17px] text-muted'
                              }
                            >
                              <SquareCheck size={13} />
                              {task.checklist.filter((item) => item.done).length}/
                              {task.checklist.length}
                            </span>
                          )}
                        </span>
                      )}
                      <span
                        className={
                          'card-footer flex items-center justify-between gap-2 mt-[17px] w-full'
                        }
                      >
                        <span
                          className={
                            'card-key inline-flex items-center gap-1.5 text-[11px] font-medium text-muted tracking-[.15px]'
                          }
                        >
                          <IssueType done={status === 'done'} type={task.type} />
                          {taskKey(task)}
                        </span>
                        <span className={'card-footer-right flex items-center gap-1.5 min-w-0'}>
                          {projectId === 'all' || projectId === 'today' ? (
                            <span
                              className={cn(
                                'card-project max-w-[105px] overflow-hidden whitespace-nowrap text-ellipsis text-[10px]',
                                'text-muted',
                              )}
                              title={project?.name}
                            >
                              {project?.name}
                            </span>
                          ) : null}
                          <PriorityBadge priority={task.priority} label={false} />
                          {assignee && (
                            <span title={`Исполнитель: ${assignee.name}`}>
                              <Avatar
                                user={assignee}
                                className={'issue-assignee w-5.5 h-5.5 text-[10px]'}
                              />
                            </span>
                          )}
                          <GripVertical
                            size={13}
                            className={'drag-grip text-[#8590a2] opacity-[0] w-2.5'}
                          />
                        </span>
                      </span>
                    </TaskLink>
                  );
                })}
              {!tasks.some((task) => task.status === status) && (
                <p
                  className={
                    'column-empty text-xs text-muted leading-4.5 text-center py-7 px-[15px]'
                  }
                >
                  {filtered
                    ? 'Нет задач по выбранным фильтрам'
                    : status === 'done'
                      ? 'Завершённые задачи появятся здесь'
                      : 'Пока нет задач'}
                </p>
              )}
              {status !== 'done' && (
                <QuickCreate
                  key={`${projectId}:${status}`}
                  projects={projects}
                  projectId={projectId}
                  status={status}
                  today={today}
                  onCreate={onCreate}
                />
              )}
            </div>
          </section>
        ))}
      </div>
      {backlogCount > 0 && (
        <button
          className={cn(
            'backlog-link flex items-center gap-2 text-muted text-[11px] pt-3.5 px-px pb-px [&>span]:ml-1',
            '[&>span]:text-brand [&>svg]:text-brand max-[520px]:text-[10px]',
          )}
          onClick={onBacklog}
        >
          В бэклоге: {backlogCount}
          <span>Открыть бэклог</span>
          <ArrowRight size={14} />
        </button>
      )}
    </>
  );
};
export const BacklogSection = ({
  status,
  tasks,
  projects,
  projectId,
  today,
  onOpen,
  onCreate,
  onChange,
}: {
  status: 'backlog' | 'todo';
  tasks: Task[];
  projects: Project[];
  projectId: string;
  today: boolean;
  onOpen: (task: Task) => void;
  onCreate: (task: Task) => Promise<boolean>;
  onChange: (task: Task) => Promise<boolean>;
}) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <section
      className={'backlog-section border border-line rounded-[5px] mb-5'}
      aria-label={statusNames[status]}
    >
      <button
        className={cn(
          'backlog-section-heading flex items-center gap-2 py-3.5 px-3 w-full bg-[#f7f8f9] text-left',
          '[&_h2]:text-sm [&_h2]:font-semibold [&>svg]:text-muted [&>svg]:[transition:transform_.15s]',
          '[&_.is-collapsed]:[transform:rotate(-90deg)] max-[520px]:px-2.5 max-[520px]:[&_h2]:text-[13px]',
        )}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronDown size={17} className={expanded ? '' : 'is-collapsed'} />
        <h2>{statusNames[status]}</h2>
        <span
          className={cn(
            'count-badge min-w-4.5 py-px px-[5px] text-center rounded-[3px] text-[10px] leading-4',
            'bg-[#dfe1e6] text-[#44546f]',
          )}
        >
          {tasks.length}
        </span>
        <span
          className={
            'backlog-description ml-1.5 text-[11px] font-normal text-muted max-[1000px]:hidden'
          }
        >
          {status === 'todo' ? 'Задачи, которые можно брать в работу' : 'Идеи и будущие задачи'}
        </span>
      </button>
      {expanded && (
        <div
          className={cn(
            'backlog-section-content border-t border-line [&>.quick-create]:m-2.5',
            '[&>.quick-create]:max-w-140 [&>.quick-create-trigger]:py-3 [&>.quick-create-trigger]:px-[15px]',
          )}
        >
          {tasks.length > 0 ? (
            <IssueTable
              tasks={tasks}
              projects={projects}
              onOpen={onOpen}
              onChange={onChange}
              compact
              startAction
            />
          ) : (
            <p className={'backlog-empty py-[23px] px-5 text-xs text-muted'}>
              {status === 'todo'
                ? 'Переведи сюда задачу из бэклога, когда будешь готов начать.'
                : 'Добавь идеи, которые хочешь запланировать.'}
            </p>
          )}
          <QuickCreate
            key={`${projectId}:${status}`}
            projects={projects}
            projectId={projectId}
            status={status}
            today={today}
            onCreate={onCreate}
          />
        </div>
      )}
    </section>
  );
};
