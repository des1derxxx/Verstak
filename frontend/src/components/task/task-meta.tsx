import { categoryStyles, priorityStyles } from '@/components/task/task-styles';
import { cn } from '@/lib/cn';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Bug,
  Check,
  Circle,
  CircleCheck,
  Clock3,
  Minus,
  SquareCheck,
} from 'lucide-react';
import { priorityNames } from '@/lib/model/workspace';
import type { Priority, ProjectStatus, StatusCategory, Task } from '@/lib/model/workspace';
export const StatusIcon = ({
  category,
  size = 14,
}: {
  category: StatusCategory;
  size?: number;
}) => {
  if (category === 'done') return <CircleCheck size={size} />;
  if (category === 'progress') return <Clock3 size={size} />;
  if (category === 'backlog') return <Circle size={size} />;
  return <SquareCheck size={size} />;
};
export const StatusBadge = ({ status }: { status: ProjectStatus }) => {
  return (
    <span className={cn('status-badge', categoryStyles[status.category])}>
      <StatusIcon category={status.category} />
      {status.name}
    </span>
  );
};
export const PriorityBadge = ({
  priority,
  label = true,
}: {
  priority: Priority;
  label?: boolean;
}) => {
  const Icon = priority === 'high' ? ArrowUp : priority === 'low' ? ArrowDown : Minus;
  return (
    <span
      className={cn(
        'priority inline-flex items-center gap-1.25 text-ink-secondary text-xs whitespace-nowrap',
        priorityStyles[priority],
      )}
      title={`Приоритет: ${priorityNames[priority]}`}
    >
      <Icon size={15} />
      {label && <span>{priorityNames[priority]}</span>}
    </span>
  );
};
export const TaskType = ({
  done = false,
  type = 'task',
}: {
  done?: boolean;
  type?: Task['type'];
}) => {
  const name = type === 'bug' ? 'Ошибка' : type === 'story' ? 'История' : 'Задача';
  return (
    <span
      className={cn(
        'issue-type w-3.5 h-3.5 inline-flex items-center justify-center bg-brand-light text-white',
        'rounded-xs shrink-0',
        `issue-type-${type}`,
        done ? 'issue-type-done bg-success-bright' : '',
      )}
      aria-label={done ? `Завершено · ${name}` : name}
      title={name}
    >
      {type === 'bug' ? (
        <Bug size={11} />
      ) : type === 'story' ? (
        <Bookmark size={10} />
      ) : (
        <Check size={10} strokeWidth={3} />
      )}
    </span>
  );
};
