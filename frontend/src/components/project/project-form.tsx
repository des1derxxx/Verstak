import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useContext, useRef, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { colors } from '@/lib/model/workspace';
import type { Project } from '@/lib/model/workspace';
import { Modal, MutationContext, useDiscardConfirmation } from '@/components/ui/modal';
export const ProjectForm = ({
  project,
  onSave,
  onDelete,
  onClose,
}: {
  project?: Project;
  onSave: (project: Project) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) => {
  const mutation = useContext(MutationContext);
  const id = useRef(project?.id ?? crypto.randomUUID());
  const [name, setName] = useState(project?.name ?? '');
  const [key, setKey] = useState(project?.key ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [color, setColor] = useState(project?.color ?? colors[0]);
  const [deleting, setDeleting] = useState(false);
  const close = useDiscardConfirmation(
    !mutation.readOnly &&
      (key !== (project?.key ?? '') ||
        name !== (project?.name ?? '') ||
        description !== (project?.description ?? '') ||
        color !== (project?.color ?? colors[0])),
    onClose,
  );
  return (
    <Modal title={project ? 'Настройки проекта' : 'Новый проект'} onClose={close.requestClose}>
      <form
        className={cn(
          'editor-form flex flex-col gap-5 p-6 [&_h2]:text-[21px] [&_h2]:font-semibold [&_h3]:text-[15px]',
          '[&_h3]:font-semibold',
          '[&_.title-input]:text-[23px] [&_.title-input]:font-semibold [&_.title-input]:pt-[3px]',
          '[&_.title-input]:px-0 [&_.title-input]:pb-3 [&_.title-input]:border-0 [&_.title-input]:border-b',
          '[&_.title-input]:border-line [&_.title-input]:rounded-none [&_.note-textarea]:min-h-85',
          '[&_.note-textarea]:font-mono [&_.note-textarea]:text-[13px] [&_.note-textarea]:leading-[23px]',
          'max-[520px]:p-5 max-[520px]:gap-4.5',
        )}
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.readOnly && name.trim())
            onSave({
              id: id.current,
              name: name.trim(),
              description: description.trim(),
              color,
              ...(key ? { key } : {}),
            });
        }}
      >
        <label>
          Название
          <input
            disabled={mutation.readOnly}
            autoFocus
            required
            maxLength={80}
            placeholder="Например, личный сайт"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Ключ проекта
          <input
            aria-label="Ключ проекта"
            disabled={Boolean(project?.key) || mutation.readOnly}
            placeholder="OM"
            pattern="[A-Z][A-Z0-9]{1,9}"
            minLength={2}
            maxLength={10}
            value={key}
            onChange={(event) => setKey(event.target.value.toUpperCase())}
          />
          <span className={'field-hint text-[10px] font-normal text-muted'}>
            Например OM → OM-52. Пустой ключ сервер подберёт по названию.
          </span>
        </label>
        <label>
          Описание
          <textarea
            disabled={mutation.readOnly}
            maxLength={4000}
            rows={3}
            placeholder="Что ты хочешь сделать?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <fieldset
          className={cn(
            'color-field flex gap-[9px] border-0 p-0 m-0 [&_legend]:text-xs [&_legend]:font-medium',
            '[&_legend]:text-[#44546f] [&_legend]:mb-2.5 [&_button]:w-[29px] [&_button]:h-[29px]',
            '[&_button]:rounded [&_button]:text-white [&_button]:inline-flex [&_button]:items-center',
            '[&_button]:justify-center [&_button]:border-2 [&_button]:border-white',
            '[&_button]:[outline:1px_solid_transparent]',
            '[&_button[aria-pressed=true]]:[outline-color:var(--blue)]',
          )}
          disabled={mutation.readOnly}
        >
          <legend>Цвет проекта</legend>
          {colors.map((value) => (
            <button
              key={value}
              aria-label={`Цвет ${value}`}
              aria-pressed={color === value}
              type="button"
              style={{ background: value }}
              onClick={() => setColor(value)}
            >
              {color === value && <Check size={17} />}
            </button>
          ))}
        </fieldset>
        {close.confirmation}
        <div
          className={cn(
            'modal-footer flex items-center justify-between gap-[15px] pt-4.5 border-t border-line',
            'max-[520px]:gap-2.5 max-[520px]:flex-wrap max-[520px]:[&_.button]:text-xs',
            'max-[520px]:[&_.button]:px-[11px]',
          )}
        >
          {project && !mutation.readOnly && (
            <button
              type="button"
              className={cn(
                'text-button inline-flex items-center gap-[5px] py-1 px-0 text-[13px] text-muted',
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
            <Button type="submit" disabled={mutation.readOnly || !name.trim()} variant="primary">
              {project ? 'Сохранить' : 'Создать проект'}
            </Button>
          </div>
        </div>
        {deleting && (
          <div
            className={cn(
              'delete-confirm p-[15px] border border-[#f5c8c5] bg-[#fff1f0] rounded text-xs leading-5',
              'text-[#5d1f1a] flex items-center flex-wrap gap-2.5 [&>span]:flex-1 [&>span]:min-w-42.5',
            )}
          >
            <span>Проект, его задачи и заметки будут удалены.</span>
            <Button type="button" onClick={() => onDelete(project!.id)} variant="danger">
              Удалить всё
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
};
