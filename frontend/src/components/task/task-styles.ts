import type { Priority, Status } from '@/lib/model/workspace';

export const statusStyles: Record<Status, string> = {
  backlog: 'status-backlog text-[#44546f] bg-[#f1f2f4]',
  todo: 'status-todo text-[#44546f] bg-[#f1f2f4]',
  progress: 'status-progress text-[#0055cc] bg-[#e9f2ff]',
  done: 'status-done text-[#216e4e] bg-[#dcfff1]',
};

export const priorityStyles: Record<Priority, string> = {
  high: 'priority-high text-danger',
  medium: 'priority-medium text-[#b38700]',
  low: 'priority-low text-brand',
};
