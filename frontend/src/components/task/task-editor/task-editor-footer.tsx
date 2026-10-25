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
        'issue-editor-footer flex items-center gap-2.5 py-4 px-5.5 border-t border-line bg-surface sticky',
        'bottom-0 mt-auto z-1 max-tablet:py-3.5 max-tablet:px-5 max-phone:gap-1.25 max-phone:px-4',
        'max-phone:flex-wrap max-phone:[&_.button]:text-xs max-phone:[&_.button]:px-2.5',
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
          'editor-save-hint text-tiny leading-4 text-muted max-w-60 max-tablet:text-tiny',
          'max-tablet:max-w-37.5 max-phone:max-w-35',
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
