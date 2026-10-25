import { Button, IconButton } from '@/shared/ui/Button';
import { cn } from '@/shared/ui/cn';
import { Dropdown } from '@/shared/ui/Dropdown';
import { useContext, useRef, useState } from 'react';
import { CornerDownLeft, Plus, X } from 'lucide-react';
import type { Project, Status, Task } from '@/shared/model/workspace';
import { MutationContext } from '@/shared/ui/Modal';
import { createTask } from '@/features/tasks/task-view';
export const QuickCreate = ({
  projects,
  projectId,
  status = 'todo',
  today = false,
  onCreate,
}: {
  projects: Project[];
  projectId: string;
  status?: Status;
  today?: boolean;
  onCreate: (task: Task) => Promise<boolean>;
}) => {
  const mutation = useContext(MutationContext);
  const input = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState(
    projects.find((p) => p.id === projectId)?.id ?? projects[0]?.id ?? '',
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  // Retain the same identity after an uncertain network result, so retrying cannot duplicate a task.
  const draft = useRef<Task | null>(null);
  const submit = async () => {
    if (!title.trim() || !selectedProject || pending || mutation.saving || mutation.readOnly)
      return;
    setPending(true);
    setError('');
    draft.current ??= createTask(selectedProject, title, status, today);
    const candidate = { ...draft.current, projectId: selectedProject, title: title.trim() };
    let success = false;
    try {
      success = await onCreate(candidate);
    } catch {
      setError('Не удалось создать задачу. Текст сохранён — попробуй ещё раз.');
    }
    if (success) {
      setTitle('');
      draft.current = null;
      requestAnimationFrame(() => input.current?.focus());
    } else
      setError(
        'Задача не подтверждена сервером. Повтори создание или проверь сообщение об ошибке.',
      );
    setPending(false);
  };
  if (!expanded)
    return (
      <button
        type="button"
        className={cn(
          'quick-create-trigger flex items-center gap-[7px] w-full text-left text-[13px] text-muted py-2.5',
          'px-1.5 rounded [&:hover]:bg-[#091e420f] [&:hover]:text-ink',
        )}
        disabled={mutation.readOnly || !projects.length}
        onClick={() => setExpanded(true)}
      >
        <Plus size={16} />
        Создать задачу
      </button>
    );
  return (
    <form
      className={cn(
        'quick-create p-[9px] border-2 border-[#388bff] rounded-[5px] bg-white [&_textarea]:w-full',
        '[&_textarea]:resize-y [&_textarea]:min-h-[65px] [&_textarea]:p-[3px] [&_textarea]:bg-white',
        '[&_textarea]:border-0 [&_textarea]:outline-none [&_textarea]:text-sm [&_textarea]:text-ink',
        '[&_textarea]:leading-[21px] [&>.dropdown_.dropdown-trigger]:p-1',
        '[&>.dropdown_.dropdown-trigger]:max-w-full [&>.dropdown_.dropdown-trigger]:border',
        '[&>.dropdown_.dropdown-trigger]:border-line [&>.dropdown_.dropdown-trigger]:bg-white',
        '[&>.dropdown_.dropdown-trigger]:rounded-[3px] [&>.dropdown_.dropdown-trigger]:text-[11px]',
        '[&>.dropdown]:my-[4px_8px] [&_.dropdown-trigger]:min-h-7 [&_.dropdown-trigger]:text-[11px]',
      )}
      aria-label="Быстрое создание задачи"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <textarea
        ref={input}
        autoFocus
        rows={3}
        maxLength={180}
        aria-label="Название новой задачи"
        placeholder="Что нужно сделать?"
        disabled={pending}
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setError('');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !pending) {
            event.stopPropagation();
            setExpanded(false);
          }
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submit();
          }
        }}
      />
      {projectId === 'all' || projectId === 'today' ? (
        <Dropdown
          aria-label="Проект новой задачи"
          disabled={pending}
          value={selectedProject}
          onValueChange={(value) => setSelectedProject(value)}
          options={[...projects.map((project) => ({ value: project.id, label: project.name }))]}
        />
      ) : null}
      {error && (
        <p
          className={'quick-create-error mt-1.5 mx-0 mb-2.5 text-[11px] leading-[17px] text-danger'}
          role="alert"
        >
          {error}
        </p>
      )}
      <div
        className={cn(
          'quick-create-actions flex items-center gap-[5px] [&>span]:ml-auto [&>span]:text-[9px]',
          '[&>span]:text-muted',
        )}
      >
        <Button type="submit" disabled={pending || !title.trim()} variant="primary" size="compact">
          {pending ? 'Создаём…' : 'Создать'}
          <CornerDownLeft size={13} />
        </Button>
        <IconButton
          type="button"
          aria-label="Отменить создание"
          disabled={pending}
          onClick={() => setExpanded(false)}
        >
          <X size={17} />
        </IconButton>
        <span>Enter — создать</span>
      </div>
    </form>
  );
};
