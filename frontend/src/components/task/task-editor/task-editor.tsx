import { useCalendar } from '@/lib/calendar';
import { TaskMainFields } from '@/components/task/task-editor/task-main-fields';
import { TaskEditorToolbar } from '@/components/task/task-editor/task-editor-toolbar';
import { TaskDraftConflict } from '@/components/task/task-editor/task-draft-conflict';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import { TaskActivity } from '@/components/task/task-editor/task-activity';
import { Modal } from '@/components/ui/modal';
import { taskKey } from '@/lib/model/task';

import { useTaskEditor } from '@/components/task/task-editor/use-task-editor';
import type { TaskEditorProps } from '@/components/task/task-editor/types';
import { TaskMetadata } from '@/components/task/task-editor/task-metadata';

import { TaskRelationships } from '@/components/task/task-editor/task-relationships';
import { TaskEditorFooter } from '@/components/task/task-editor/task-editor-footer';
export const TaskEditor = (props: TaskEditorProps) => {
  const { timeZone } = useCalendar();
  const model = useTaskEditor(props);
  const {
    task,
    selectedProject,
    seed,
    requestClose,
    commentBusy,
    mutation,
    stale,
    commentDirty,
    draft,
    closing,
    checkText,
    onSave,
    onClose,
    setDiscarding,
    workspaceId,
    setCommentDirty,
    setCommentBusy,
    onActivity,
    discarding,
    deleting,
    setDeleting,
    onDelete,
  } = model;
  const metadata = <TaskMetadata model={model} />;
  return (
    <Modal
      inline={props.inline}
      title={
        task
          ? `${selectedProject?.name ?? 'Задача'} / ${taskKey(task)}`
          : seed?.parentId
            ? 'Создать подзадачу'
            : 'Создать задачу'
      }
      onClose={requestClose}
      pending={commentBusy}
      drawer={Boolean(task)}
      wide
    >
      <form
        className={cn(
          'issue-editor',
          'flex flex-col',
          'max-[520px]:[&_.issue-title-input]:text-[21px]',
          task
            ? 'issue-editor-existing min-h-[calc(100dvh_-_58px)] [&_.issue-editor-body]:grid-cols-[minmax(0,1fr)_240px] [&_.issue-editor-body]:flex-1 [&_.issue-editor-body]:mt-2 max-[760px]:[&_.issue-editor-body]:grid-cols-[minmax(0,1fr)_215px] max-[520px]:[&_.issue-editor-body]:flex max-[520px]:[&_.issue-editor-body]:flex-col'
            : '',
        )}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !mutation.readOnly) {
            event.preventDefault();
            event.currentTarget.requestSubmit();
          }
        }}
        onSubmit={async (event) => {
          event.preventDefault();
          if (
            mutation.readOnly ||
            mutation.saving ||
            stale ||
            commentDirty ||
            !draft.title.trim() ||
            (closing && !draft.resolutionComment?.trim())
          )
            return;
          const checklist = checkText.trim()
            ? [...draft.checklist, { id: crypto.randomUUID(), text: checkText.trim(), done: false }]
            : draft.checklist;
          const success = await onSave({
            ...draft,
            title: draft.title.trim(),
            labels: [...new Set(draft.labels.map((label) => label.trim()).filter(Boolean))],
            checklist,
          });
          if (success) onClose();
        }}
      >
        {stale && <TaskDraftConflict model={model} />}
        {task && <TaskEditorToolbar model={model} />}
        <fieldset
          disabled={mutation.readOnly}
          className={'issue-editor-body grid grid-cols-[1fr] min-w-0 border-0 p-0 m-0'}
        >
          <TaskMainFields model={model} />
          {task && (
            <aside
              className={cn(
                'issue-details py-[21px] px-4.5 bg-[#fafbfc] border-l border-line min-w-0 [&>h3]:text-[13px]',
                '[&>h3]:font-semibold [&>h3]:mb-[21px] max-[760px]:py-5 max-[760px]:px-[15px]',
                'max-[520px]:border-l-0 max-[520px]:border-t max-[520px]:border-line max-[520px]:p-5',
                'max-[520px]:[&_.issue-metadata-fields]:grid',
                'max-[520px]:[&_.issue-metadata-fields]:grid-cols-[1fr_1fr]',
                'max-[520px]:[&_.issue-metadata-fields]:gap-4 max-[520px]:[&>h3]:mb-[17px]',
              )}
            >
              <h3>Сведения</h3>
              {metadata}
              <p className={'issue-created-at text-muted text-[10px] leading-4.5 mt-7'}>
                Создано{' '}
                {new Intl.DateTimeFormat('ru', {
                  timeZone,
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(draft.createdAt))}
              </p>
            </aside>
          )}
        </fieldset>
        <TaskRelationships model={model} />
        {task && workspaceId && (
          <TaskActivity
            workspaceId={workspaceId}
            taskId={task.id}
            readOnly={mutation.readOnly}
            onDirty={setCommentDirty}
            onBusy={setCommentBusy}
            onActivity={onActivity}
          />
        )}
        {discarding && (
          <div
            className={cn(
              'discard-confirm p-[15px] border border-[#f5c8c5] bg-[#fff1f0] rounded text-xs leading-5',
              'text-[#5d1f1a] mt-0 mx-5 mb-4 [&>div]:flex [&>div]:flex-wrap [&>div]:justify-end [&>div]:gap-2',
              '[&>div]:mt-3.5 max-[520px]:mx-[15px] max-[520px]:[&_.button]:text-[11px]',
              'max-[520px]:[&_.button]:whitespace-normal',
            )}
            role="alert"
          >
            <strong>В задаче есть несохранённые изменения</strong>
            <div>
              <Button type="button" onClick={() => setDiscarding(false)} variant="secondary">
                Продолжить редактирование
              </Button>
              <Button type="button" onClick={onClose} variant="danger">
                Закрыть без сохранения
              </Button>
            </div>
          </div>
        )}
        {deleting && (
          <div
            className={cn(
              'delete-confirm p-[15px] border border-[#f5c8c5] bg-[#fff1f0] rounded text-xs leading-5',
              'text-[#5d1f1a] flex items-center flex-wrap gap-2.5 [&>span]:flex-1 [&>span]:min-w-42.5',
            )}
            role="alert"
          >
            <span>Удалить задачу «{task?.title}»?</span>
            <Button type="button" onClick={() => setDeleting(false)} variant="secondary">
              Отмена
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (task && (await onDelete(task.id))) onClose();
              }}
              variant="danger"
            >
              Удалить задачу
            </Button>
          </div>
        )}
        <TaskEditorFooter model={model} />
      </form>
    </Modal>
  );
};
