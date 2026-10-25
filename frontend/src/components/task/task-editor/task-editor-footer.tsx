import { IconButton, Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Trash2 } from 'lucide-react';
import type { TaskEditorModel } from '@/components/task/task-editor/use-task-editor';
export const TaskEditorFooter = ({ model }: { model: TaskEditorModel }) => {
  const {
    task,
    mutation,
    children,
    setDeleting,
    commentDirty,
    dirty,
    requestClose,
    draft,
    closing,
    commentBusy,
    stale,
  } = model;
  return (
    <div
      className={cn(
        'issue-editor-footer flex items-center gap-2.5 py-4 px-5.5 border-t border-line bg-white sticky',
        'bottom-0 mt-auto z-1 max-[760px]:py-3.5 max-[760px]:px-5 max-[520px]:gap-[5px] max-[520px]:px-4',
        'max-[520px]:flex-wrap max-[520px]:[&_.button]:text-xs max-[520px]:[&_.button]:px-2.5',
      )}
    >
      {task && !mutation.readOnly && (
        <IconButton
          type="button"
          aria-label="Удалить задачу"
          disabled={children.length > 0}
          title={children.length ? 'Сначала удали или отвяжи подзадачи' : undefined}
          onClick={() => setDeleting(true)}
          tone="danger"
        >
          <Trash2 size={17} />
        </IconButton>
      )}
      <span
        className={cn(
          'editor-save-hint text-[10px] leading-4 text-muted max-w-60 max-[760px]:text-[10px]',
          'max-[760px]:max-w-37.5 max-[520px]:max-w-35',
        )}
      >
        {commentDirty
          ? 'Сначала отправь или очисти черновик комментария'
          : dirty && !mutation.readOnly
            ? 'Есть несохранённые изменения'
            : task
              ? 'Все изменения сохранены'
              : 'Обязательно только название и проект'}
      </span>
      <div className={'footer-actions flex items-center justify-end gap-2 ml-auto'}>
        <Button type="button" onClick={requestClose} variant="secondary">
          {mutation.readOnly ? 'Закрыть' : 'Отмена'}
        </Button>
        {!mutation.readOnly && (
          <Button
            type="submit"
            disabled={
              !draft.title.trim() ||
              (Boolean(task) && !dirty) ||
              (closing && !draft.resolutionComment?.trim()) ||
              commentBusy ||
              commentDirty ||
              stale
            }
            variant="primary"
          >
            {mutation.saving ? 'Сохраняем…' : task ? 'Сохранить' : 'Создать задачу'}
          </Button>
        )}
      </div>
    </div>
  );
};
