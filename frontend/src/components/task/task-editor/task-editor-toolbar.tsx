import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Copy } from 'lucide-react';
import { taskKey } from '@/lib/model/task';
import { TaskType } from '@/components/task/task-meta';
import type { TaskEditorModel } from '@/components/task/task-editor/use-task-editor';
export const TaskEditorToolbar = ({ model }: { model: TaskEditorModel }) => {
  const { draft, task, setCopyNotice, copyNotice, mutation } = model;
  if (!task) return null;
  return (
    <div
      className={cn(
        'issue-editor-toolbar flex items-center gap-2 pt-4 px-5.5 pb-0 text-xs text-muted',
        'max-[520px]:px-5 max-[520px]:gap-1.5',
      )}
    >
      <TaskType done={draft.status === 'done'} type={draft.type} />
      <span>{draft.type === 'bug' ? 'Ошибка' : draft.type === 'story' ? 'История' : 'Задача'}</span>
      <span className={'issue-key text-[11px] text-muted font-medium'} title={task.id}>
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
      <span className={'copy-notice text-[10px] max-[520px]:hidden'} role="status">
        {copyNotice}
      </span>
      {mutation.readOnly && (
        <span
          className={'read-only-label ml-auto bg-[#f1f2f4] rounded-[3px] py-0.5 px-1.5 text-[10px]'}
        >
          Только просмотр
        </span>
      )}
    </div>
  );
};
