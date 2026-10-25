import { statusStyles, priorityStyles } from '@/components/task/task-styles';
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
import { priorityNames, statusNames } from '@/lib/model/workspace';
import type { Priority, Status, Task } from '@/lib/model/workspace';
export const StatusIcon = ({ status, size = 14 }: { status: Status; size?: number }) => {
  if (status === 'done') return <CircleCheck size={size} />;
  if (status === 'progress') return <Clock3 size={size} />;
  if (status === 'backlog') return <Circle size={size} />;
  return <SquareCheck size={size} />;
};
export const StatusBadge = ({ status }: { status: Status }) => {
  return (
    <span className={cn('status-badge', statusStyles[status])}>
      <StatusIcon status={status} />
      {statusNames[status]}
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
        'priority inline-flex items-center gap-[5px] text-[#44546f] text-xs whitespace-nowrap',
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
        'issue-type w-3.5 h-3.5 inline-flex items-center justify-center bg-[#4b9ce8] text-white',
        'rounded-[2px] shrink-0',
        `issue-type-${type}`,
        done ? 'issue-type-done bg-[#22a06b]' : '',
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
