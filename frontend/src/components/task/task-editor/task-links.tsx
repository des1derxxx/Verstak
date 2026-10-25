import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Dropdown } from '@/components/ui/dropdown';
import { Plus, X } from 'lucide-react';
import type { TaskEditorModel } from '@/components/task/task-editor/use-task-editor';
export const TaskLinks = ({ model }: { model: TaskEditorModel }) => {
  const { draft, update, mutation } = model;
  return (
    <section
      className={'issue-section flex flex-col gap-2.5 [&>textarea]:min-h-28 task-links [&_h3]:mb-3'}
    >
      <h3>Ссылки</h3>
      {(draft.links ?? []).map((link, index) => (
        <div
          className={cn(
            'task-link grid grid-cols-[112px_minmax(80px,_1fr)_22px_24px] gap-1.5 items-center mb-2',
            '[&_input]:min-w-0 [&_.dropdown-trigger]:min-w-0 [&_a]:text-[#0c66e4] [&_a]:text-xl',
            '[&_a]:text-center max-[620px]:grid-cols-[90px_minmax(70px,_1fr)_20px_22px]',
            '[&>.dropdown]:min-w-0',
          )}
          key={index}
        >
          <Dropdown
            aria-label={`Тип ссылки ${index + 1}`}
            value={link.kind}
            onValueChange={(value) =>
              update(
                'links',
                draft.links!.map((l, i) =>
                  i === index ? { ...l, kind: value as typeof link.kind } : l,
                ),
              )
            }
            options={[
              { value: 'pr', label: 'Pull request' },
              { value: 'commit', label: 'Коммит' },
              { value: 'reference', label: 'Материал' },
            ]}
          />
          <input
            aria-label={`Адрес ссылки ${index + 1}`}
            type="url"
            required
            pattern="https?://.*"
            placeholder="https://github.com/…"
            value={link.url}
            onChange={(e) =>
              update(
                'links',
                draft.links!.map((l, i) => (i === index ? { ...l, url: e.target.value } : l)),
              )
            }
          />
          <a
            href={/^https?:\/\//i.test(link.url) ? link.url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Открыть ссылку ${index + 1}`}
          >
            ↗
          </a>
          {!mutation.readOnly && (
            <IconButton
              type="button"
              aria-label={`Удалить ссылку ${index + 1}`}
              onClick={() =>
                update(
                  'links',
                  draft.links!.filter((_, i) => i !== index),
                )
              }
            >
              <X size={14} />
            </IconButton>
          )}
        </div>
      ))}
      {!mutation.readOnly && (
        <button
          type="button"
          className={cn(
            'text-button inline-flex items-center gap-[5px] py-1 px-0 text-[13px] text-muted',
            '[&:hover]:text-brand [&.danger]:text-danger',
          )}
          disabled={(draft.links?.length ?? 0) >= 30}
          onClick={() =>
            update('links', [...(draft.links ?? []), { url: '', label: '', kind: 'pr' }])
          }
        >
          <Plus size={14} />
          Добавить ссылку
        </button>
      )}
    </section>
  );
};
