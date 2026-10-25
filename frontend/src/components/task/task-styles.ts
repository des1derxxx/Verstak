import type { Priority, StatusCategory } from '@/lib/model/workspace';

export const categoryStyles: Record<StatusCategory, string> = {
  backlog: 'status-backlog text-ink-secondary bg-neutral',
  todo: 'status-todo text-ink-secondary bg-neutral',
  progress: 'status-progress text-brand-hover bg-brand-soft',
  done: 'status-done text-success-strong bg-success-soft',
};

export const priorityStyles: Record<Priority, string> = {
  high: 'priority-high text-danger',
  medium: 'priority-medium text-warning',
  low: 'priority-low text-brand',
};
