import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useContext, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Note, Project } from '@/lib/model/workspace';
import { Modal, MutationContext, useDiscardConfirmation } from '@/components/ui/modal';
import { Dropdown } from '@/components/ui/dropdown';
import { Markdown } from '@/components/ui/markdown';
export const NoteForm = ({
  note,
  projects,
  projectId,
  onSave,
  onDelete,
  onClose,
  inline = false,
}: {
  note?: Note;
  projects: Project[];
  projectId: string;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  inline?: boolean;
}) => {
  const mutation = useContext(MutationContext);
  const id = useRef(note?.id ?? crypto.randomUUID());
  const initialProject = useRef(
    note?.projectId ?? (projects.some((p) => p.id === projectId) ? projectId : projects[0].id),
  );
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [project, setProject] = useState(
    note?.projectId ?? (projects.some((p) => p.id === projectId) ? projectId : projects[0].id),
  );
  const [preview, setPreview] = useState(mutation.readOnly);
  const [deleting, setDeleting] = useState(false);
  const close = useDiscardConfirmation(
    !mutation.readOnly &&
      (title !== (note?.title ?? '') ||
        body !== (note?.body ?? '') ||
        project !== initialProject.current),
    onClose,
  );
  return (
    <Modal
      inline={inline}
      title={note ? 'Страница проекта' : 'Новая страница'}
      onClose={close.requestClose}
      wide
    >
      <form
        className={cn(
          'editor-form flex flex-col gap-5 p-6 [&_h2]:text-heading-sm [&_h2]:font-semibold [&_h3]:text-lead',
          '[&_h3]:font-semibold',
          '[&_.title-input]:text-heading-lg [&_.title-input]:font-semibold [&_.title-input]:pt-0.75',
          '[&_.title-input]:px-0 [&_.title-input]:pb-3 [&_.title-input]:border-0 [&_.title-input]:border-b',
          '[&_.title-input]:border-line [&_.title-input]:rounded-none [&_.note-textarea]:min-h-85',
          '[&_.note-textarea]:font-mono [&_.note-textarea]:text-body [&_.note-textarea]:leading-5.75',
          'max-phone:p-5 max-phone:gap-4.5',
        )}
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.readOnly && title.trim())
            onSave({
              id: id.current,
              projectId: project,
              title: title.trim(),
              body,
              updatedAt: new Date().toISOString(),
            });
        }}
      >
        <input
          autoFocus
          readOnly={mutation.readOnly}
          className={'title-input'}
          aria-label="Название страницы"
          required
          maxLength={180}
          placeholder="Название страницы"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div
          className={cn(
            'note-editor-toolbar flex items-center gap-3.5 [&>.dropdown_.dropdown-trigger]:w-auto',
            '[&>.dropdown_.dropdown-trigger]:max-w-57.5 [&>.dropdown_.dropdown-trigger]:text-xs',
            'max-phone:gap-2.5 max-phone:[&>.dropdown_.dropdown-trigger]:max-w-35',
            'max-phone:[&>.dropdown_.dropdown-trigger]:text-caption [&>.dropdown]:w-auto',
            '[&>.dropdown]:min-w-32.5 [&>.dropdown]:max-w-[65%]',
          )}
        >
          <label
            className={
              'sr-only absolute w-px h-px p-0 overflow-hidden [clip:rect(0,0,0,0)] whitespace-nowrap border-0'
            }
            htmlFor="note-project"
          >
            Проект страницы
          </label>
          <Dropdown
            disabled={mutation.readOnly}
            id="note-project"
            value={project}
            onValueChange={(value) => setProject(value)}
            options={[...projects.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <div
            className={cn(
              'segmented flex p-0.75 rounded bg-neutral ml-auto shrink-0 [&_button]:py-1.25',
              '[&_button]:px-2.5 [&_button]:text-caption [&_button]:rounded-chip [&_button]:text-muted',
              '[&_button.active]:bg-surface [&_button.active]:text-ink',
              '[&_button.active]:shadow-raised max-phone:[&_button]:text-tiny',
              'max-phone:[&_button]:px-1.75',
            )}
          >
            <button
              type="button"
              aria-pressed={!preview}
              className={
                !preview
                  ? 'active [&_.tab-count]:bg-brand-tint [&_.tab-count]:text-brand-strong'
                  : ''
              }
              onClick={() => setPreview(false)}
            >
              Текст
            </button>
            <button
              type="button"
              aria-pressed={preview}
              className={
                preview
                  ? 'active [&_.tab-count]:bg-brand-tint [&_.tab-count]:text-brand-strong'
                  : ''
              }
              onClick={() => setPreview(true)}
            >
              Просмотр
            </button>
          </div>
        </div>
        {preview ? (
          <div
            className={
              'note-preview min-h-85 py-4 px-5 border border-line rounded max-phone:px-3.5'
            }
          >
            <Markdown text={body || 'Здесь появится твоя заметка.'} />
          </div>
        ) : (
          <textarea
            readOnly={mutation.readOnly}
            className={'note-textarea'}
            aria-label="Текст страницы"
            maxLength={200000}
            rows={13}
            placeholder={
              'Записывай идеи и решения…\n\n# Заголовок\n## Подзаголовок\n- Пункт списка'
            }
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        )}
        {close.confirmation}
        <div
          className={cn(
            'modal-footer flex items-center justify-between gap-3.75 pt-4.5 border-t border-line',
            'max-phone:gap-2.5 max-phone:flex-wrap max-phone:[&_.button]:text-xs',
            'max-phone:[&_.button]:px-2.75',
          )}
        >
          {note && !mutation.readOnly && (
            <button
              type="button"
              className={cn(
                'text-button inline-flex items-center gap-1.25 py-1 px-0 text-body text-muted',
                '[&:hover]:text-brand [&.danger]:text-danger danger text-danger',
              )}
              onClick={() => setDeleting(!deleting)}
            >
              <Trash2 size={15} />
              Удалить
            </button>
          )}
          <div className={'footer-actions flex items-center justify-end gap-2 ml-auto'}>
            <Button type="button" onClick={close.requestClose} variant="secondary">
              Отмена
            </Button>
            {!mutation.readOnly && (
              <Button type="submit" disabled={!title.trim()} variant="primary">
                Сохранить страницу
              </Button>
            )}
          </div>
        </div>
        {deleting && (
          <div
            className={cn(
              'delete-confirm p-3.75 border border-danger-border bg-danger-soft rounded text-xs leading-5',
              'text-danger-ink flex items-center flex-wrap gap-2.5 [&>span]:flex-1 [&>span]:min-w-42.5',
            )}
          >
            <span>Удалить эту страницу?</span>
            <Button type="button" onClick={() => onDelete(note!.id)} variant="danger">
              Да, удалить
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
};
