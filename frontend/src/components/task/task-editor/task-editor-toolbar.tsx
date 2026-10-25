import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Copy } from 'lucide-react';
import { taskKey } from '@/lib/model/task';
import { TaskType } from '@/components/task/task-meta';
import type { TaskEditorModel } from '@/components/task/task-editor/use-task-editor';
export const TaskEditorToolbar = ({ model }: { model: TaskEditorModel }) => {
  const { draft, task, statuses, setCopyNotice, copyNotice, mutation } = model;
  if (!task) return null;
  return (
    <div
      className={cn(
        'issue-editor-toolbar flex items-center gap-2 pt-4 px-5.5 pb-0 text-xs text-muted',
        'max-phone:px-5 max-phone:gap-1.5',
      )}
    >
      <TaskType done={statuses.category(draft) === 'done'} type={draft.type} />
      <span>{draft.type === 'bug' ? 'Ошибка' : draft.type === 'story' ? 'История' : 'Задача'}</span>
      <span className={'issue-key text-caption text-muted font-medium'} title={task.id}>
        {taskKey(task)}
      </span>
      <IconButton
        type="button"
        aria-label="Копировать ID задачи"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(task.key || task.id);
            setCopyNotice('ID скопирован');
          } catch {
            setCopyNotice('Не удалось скопировать ID');
          }
        }}
      >
        <Copy size={15} />
      </IconButton>
      <span className={'copy-notice text-tiny max-phone:hidden'} role="status">
        {copyNotice}
      </span>
      {mutation.readOnly && (
        <span className={'read-only-label ml-auto bg-neutral rounded-chip py-0.5 px-1.5 text-tiny'}>
          Только просмотр
        </span>
      )}
    </div>
  );
};
