import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Plus, X } from 'lucide-react';
import type { TaskEditorModel } from '@/components/task/task-editor/use-task-editor';
export const TaskChecklist = ({ model }: { model: TaskEditorModel }) => {
  const { draft, update, mutation, checkText, setCheckText, addCheck } = model;
  return (
    <section
      className={cn(
        'issue-section flex flex-col gap-2.5 [&>textarea]:min-h-28 checklist-editor flex flex-col',
        'gap-2.75',
      )}
    >
      <div
        className={cn(
          'issue-section-heading [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink flex items-center',
          'gap-2.5 [&>span]:text-caption [&>span]:text-muted [&_.segmented]:ml-auto',
        )}
      >
        <h3>Чеклист</h3>
        {draft.checklist.length > 0 && (
          <span>
            {draft.checklist.filter((item) => item.done).length} / {draft.checklist.length}
          </span>
        )}
      </div>
      {draft.checklist.map((item) => (
        <div
          className={cn(
            'checklist-item flex items-center gap-2.25 text-body leading-5.25 [&>span]:flex-1',
            '[&>span]:wrap-anywhere',
          )}
          key={item.id}
        >
          <input
            aria-label={item.text}
            type="checkbox"
            checked={item.done}
            onChange={() =>
              update(
                'checklist',
                draft.checklist.map((check) =>
                  check.id === item.id ? { ...check, done: !check.done } : check,
                ),
              )
            }
          />
          <span className={item.done ? 'struck text-muted line-through' : ''}>{item.text}</span>
          {!mutation.readOnly && (
            <IconButton
              type="button"
              aria-label={`Удалить пункт: ${item.text}`}
              onClick={() =>
                update(
                  'checklist',
                  draft.checklist.filter((check) => check.id !== item.id),
                )
              }
            >
              <X size={14} />
            </IconButton>
          )}
        </div>
      ))}
      {!mutation.readOnly && (
        <div className={'check-add flex items-center gap-1.5'}>
          <input
            aria-label="Новый пункт чеклиста"
            placeholder="Добавить пункт…"
            maxLength={500}
            value={checkText}
            onChange={(event) => setCheckText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCheck();
              }
            }}
          />
          <IconButton
            type="button"
            aria-label="Добавить пункт"
            disabled={!checkText.trim()}
            onClick={addCheck}
          >
            <Plus size={17} />
          </IconButton>
        </div>
      )}
      {mutation.readOnly && !draft.checklist.length && (
        <p className={'body-muted text-body text-muted leading-5.25'}>Нет пунктов</p>
      )}
    </section>
  );
};
