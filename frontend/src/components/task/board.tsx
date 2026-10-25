import { useCalendar } from '@/lib/calendar';
import { TaskLink } from '@/components/task/task-link';
import { categoryStyles } from '@/components/task/task-styles';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/avatar';
import { useContext, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  GripVertical,
  Plus,
  Settings2,
  SquareCheck,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { categoryNames, projectStatuses, statusIndex } from '@/lib/model/workspace';
import type { Project, Status, StatusCategory, Task } from '@/lib/model/workspace';
import type { Member } from '@/lib/api/types';
import { MutationContext } from '@/components/ui/modal';
import { dueLabel, taskKey } from '@/lib/model/task';
import { TaskType, PriorityBadge, StatusIcon } from '@/components/task/task-meta';
import { TaskTable } from '@/components/task/task-table';
import { QuickCreate } from '@/components/task/quick-create';
type Column = {
  id: string;
  name: string;
  category: StatusCategory;
  matches: (task: Task) => boolean;
  // The status a task gets when it is dropped into or created in this column.
  target: (projectId: string) => Status;
};
const columnsFor = (projects: Project[], projectId: string): Column[] => {
  const index = statusIndex(projects);
  const project = projects.find((item) => item.id === projectId);
  // Inside a project the board shows its own columns; mixed views group tasks by stage.
  if (project)
    return projectStatuses(project)
      .filter((status) => status.category !== 'backlog')
      .map((status) => ({
        ...status,
        matches: (task) => task.status === status.id,
        target: () => status.id,
      }));
  return (['todo', 'progress', 'done'] as const).map((category) => ({
    id: category,
    name: categoryNames[category],
    category,
    matches: (task) => index.category(task) === category,
    target: (target) => index.resolve(target, category),
  }));
};
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
  onAddColumn,
  onEditColumns,
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
  // Only passed on a project board that the user may edit.
  onAddColumn?: (name: string, category: StatusCategory) => Promise<boolean>;
  onEditColumns?: () => void;
}) => {
  const { today: todayDate } = useCalendar();
  const mutation = useContext(MutationContext);
  const index = statusIndex(projects);
  const columns = columnsFor(projects, projectId);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const dragged = useRef<string | null>(null);
  return (
    <>
      <div
        className={cn(
          'board grid items-start gap-5 overflow-x-auto pb-0.75 [--column-min:245px]',
          'max-laptop:[--column-min:250px] max-tablet:gap-3 max-tablet:[--column-min:270px]',
          'max-phone:[--column-min:275px]',
        )}
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(var(--column-min), 1fr))${onAddColumn ? ' minmax(220px, 0.6fr)' : ''}`,
        }}
        aria-label="Доска задач"
      >
        {columns.map((column) => (
          <section
            className={cn(
              'board-column flex flex-col bg-surface-soft border border-transparent rounded-card',
              'h-[max(390px,calc(100dvh_-_340px))] [transition:border-color_.15s,background_.15s]',
              '[&.drag-over]:border-focus [&.drag-over]:bg-brand-soft',
              'max-tablet:h-[max(390px,calc(100dvh_-_330px))]',
              `column-${column.category}`,
              dragOver === column.id ? 'drag-over' : '',
            )}
            key={column.id}
            aria-label={column.name}
            onDragOver={(event) => {
              if (mutation.readOnly || mutation.saving || !dragged.current) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDragOver(column.id);
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
              if (!task || column.matches(task)) return;
              void onChange({ ...task, status: column.target(task.projectId) });
            }}
          >
            <div
              className={cn(
                'column-heading flex items-center min-h-12 py-3 px-3.25 [&>div]:flex [&>div]:items-center',
                '[&>div]:gap-1.75 [&_h2]:text-caption [&_h2]:font-semibold [&_h2]:text-ink-secondary',
                '[&_h2]:uppercase [&_h2]:tracking-[.35px]',
              )}
            >
              <div>
                <span
                  className={cn(
                    'status-icon inline-flex text-muted [&.status-progress]:text-brand [&.status-done]:text-success',
                    categoryStyles[column.category],
                  )}
                >
                  <StatusIcon category={column.category} />
                </span>
                <h2>{column.name}</h2>
                <span className={'column-count text-caption text-muted pl-0.75'}>
                  {tasks.filter(column.matches).length}
                </span>
              </div>
              {onEditColumns && (
                <IconButton
                  className="ml-auto"
                  aria-label={`Настроить колонку ${column.name}`}
                  title="Настроить колонки"
                  onClick={onEditColumns}
                >
                  <Settings2 size={15} />
                </IconButton>
              )}
            </div>
            <div
              className={cn(
                'column-cards flex flex-col flex-1 min-h-0 overflow-y-auto gap-2 pt-0 px-2 pb-2.5',
                '[scrollbar-width:thin] [scrollbar-color:var(--color-line)_transparent] [&>*]:shrink-0',
              )}
            >
              {tasks.filter(column.matches).map((task) => {
                const status = index.of(task);
                const done = status.category === 'done';
                const assignee = members.find((m) => m.user.id === task.assigneeId)?.user;
                const project = projects.find((item) => item.id === task.projectId);
                return (
                  <TaskLink
                    task={task}
                    onOpen={onOpen}
                    key={task.id}
                    className={cn(
                      'task-card flex flex-col w-full p-3.75 bg-surface border border-line rounded-card',
                      'shadow-card text-left [transition:border-color_.12s,box-shadow_.12s]',
                      '[&:hover]:border-brand-border [&:hover]:shadow-card-hover [&:active]:[cursor:grabbing]',
                      '[&.is-done_.task-card-title]:text-muted [&.is-done_.task-card-title]:line-through',
                      '[&.is-done_.task-card-title]:[text-decoration-color:var(--color-disabled)] [&:hover_.drag-grip]:opacity-100',
                      done ? 'is-done' : '',
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
                        'task-card-title text-sm leading-5.25 font-normal text-ink wrap-anywhere'
                      }
                    >
                      {task.title}
                    </span>
                    {task.labels.length > 0 && (
                      <span className={'tags flex flex-wrap gap-1 mt-2.5'}>
                        {task.labels.slice(0, 3).map((label) => (
                          <span
                            className={cn(
                              'tag text-tiny leading-4 bg-neutral rounded-chip py-px px-1.25 text-ink-secondary',
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
                      <span className={'card-detail-row flex items-center flex-wrap gap-2 mt-2.5'}>
                        {task.due && (
                          <span
                            className={cn(
                              'due-chip inline-flex items-center gap-1 text-tiny leading-4.25 text-muted py-px px-1.25',
                              'border border-line rounded-chip [&.overdue]:border-danger-border [&.overdue]:bg-danger-soft',
                              task.due < todayDate && !done ? 'overdue text-danger!' : '',
                            )}
                          >
                            <CalendarDays size={12} />
                            {dueLabel(task.due, todayDate)}
                          </span>
                        )}
                        {task.checklist.length > 0 && (
                          <span
                            className={
                              'check-chip inline-flex items-center gap-1 text-tiny leading-4.25 text-muted'
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
                        'card-footer flex items-center justify-between gap-2 mt-4.25 w-full'
                      }
                    >
                      <span
                        className={
                          'card-key inline-flex items-center gap-1.5 text-caption font-medium text-muted tracking-[.15px]'
                        }
                      >
                        <TaskType done={done} type={task.type} />
                        {taskKey(task)}
                      </span>
                      <span className={'card-footer-right flex items-center gap-1.5 min-w-0'}>
                        {status.name !== column.name && (
                          <span
                            className={cn(
                              'card-status max-w-24 overflow-hidden whitespace-nowrap text-ellipsis rounded-chip',
                              'px-1.25 py-px text-tiny',
                              categoryStyles[status.category],
                            )}
                            title={status.name}
                          >
                            {status.name}
                          </span>
                        )}
                        {projectId === 'all' || projectId === 'today' ? (
                          <span
                            className={cn(
                              'card-project max-w-26.25 overflow-hidden whitespace-nowrap text-ellipsis text-tiny',
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
                              className={'issue-assignee w-5.5 h-5.5 text-tiny'}
                            />
                          </span>
                        )}
                        <GripVertical
                          size={13}
                          className={'drag-grip text-placeholder opacity-0 w-2.5'}
                        />
                      </span>
                    </span>
                  </TaskLink>
                );
              })}
              {!tasks.some(column.matches) && (
                <p
                  className={'column-empty text-xs text-muted leading-4.5 text-center py-7 px-3.75'}
                >
                  {filtered
                    ? 'Нет задач по выбранным фильтрам'
                    : column.category === 'done'
                      ? 'Завершённые задачи появятся здесь'
                      : 'Пока нет задач'}
                </p>
              )}
              {column.category !== 'done' && (
                <QuickCreate
                  key={`${projectId}:${column.id}`}
                  projects={projects}
                  projectId={projectId}
                  status={column.id}
                  today={today}
                  onCreate={onCreate}
                />
              )}
            </div>
          </section>
        ))}
        {onAddColumn && <AddColumn onAdd={onAddColumn} />}
      </div>
      {backlogCount > 0 && (
        <button
          className={cn(
            'backlog-link flex items-center gap-2 text-muted text-caption pt-3.5 px-px pb-px [&>span]:ml-1',
            '[&>span]:text-brand [&>svg]:text-brand max-phone:text-tiny',
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
const AddColumn = ({
  onAdd,
}: {
  onAdd: (name: string, category: StatusCategory) => Promise<boolean>;
}) => {
  const mutation = useContext(MutationContext);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StatusCategory>('progress');
  if (mutation.readOnly) return null;
  if (!open)
    return (
      <Button
        variant="secondary"
        className="justify-start"
        onClick={() => setOpen(true)}
        aria-label="Добавить колонку"
      >
        <Plus size={16} />
        Колонка
      </Button>
    );
  return (
    <form
      className="flex flex-col gap-2.5 rounded-card border border-line bg-surface-soft p-3"
      aria-label="Новая колонка"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        if (await onAdd(name.trim(), category)) {
          setName('');
          setOpen(false);
        }
      }}
    >
      <label>
        Название колонки
        <input
          autoFocus
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        />
      </label>
      <label>
        Стадия
        <Dropdown
          aria-label="Стадия колонки"
          value={category}
          onValueChange={(value) => setCategory(value as StatusCategory)}
          options={(['todo', 'progress', 'done', 'backlog'] as const).map((value) => ({
            value,
            label: categoryNames[value],
          }))}
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="compact" disabled={!name.trim()}>
          Добавить
        </Button>
        <Button type="button" variant="secondary" size="compact" onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
    </form>
  );
};
export const BacklogSection = ({
  status,
  title,
  description,
  empty,
  tasks,
  projects,
  projectId,
  today,
  onOpen,
  onCreate,
  onChange,
}: {
  // A column of the project, or a stage when the view mixes projects.
  status: Status;
  title: string;
  description: string;
  empty: string;
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
    <section className={'backlog-section border border-line rounded-card mb-5'} aria-label={title}>
      <button
        className={cn(
          'backlog-section-heading flex items-center gap-2 py-3.5 px-3 w-full bg-surface-soft text-left',
          '[&_h2]:text-sm [&_h2]:font-semibold [&>svg]:text-muted [&>svg]:[transition:transform_.15s]',
          '[&_.is-collapsed]:[transform:rotate(-90deg)] max-phone:px-2.5 max-phone:[&_h2]:text-body',
        )}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronDown size={17} className={expanded ? '' : 'is-collapsed'} />
        <h2>{title}</h2>
        <span
          className={cn(
            'count-badge min-w-4.5 py-px px-1.25 text-center rounded-chip text-tiny leading-4',
            'bg-line text-ink-secondary',
          )}
        >
          {tasks.length}
        </span>
        <span
          className={
            'backlog-description ml-1.5 text-caption font-normal text-muted max-laptop:hidden'
          }
        >
          {description}
        </span>
      </button>
      {expanded && (
        <div
          className={cn(
            'backlog-section-content border-t border-line [&>.quick-create]:m-2.5',
            '[&>.quick-create]:max-w-140 [&>.quick-create-trigger]:py-3 [&>.quick-create-trigger]:px-3.75',
          )}
        >
          {tasks.length > 0 ? (
            <TaskTable
              tasks={tasks}
              projects={projects}
              onOpen={onOpen}
              onChange={onChange}
              compact
              startAction
            />
          ) : (
            <p className={'backlog-empty py-5.75 px-5 text-xs text-muted'}>{empty}</p>
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
