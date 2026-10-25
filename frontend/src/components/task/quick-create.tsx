import { Button, IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Dropdown } from '@/components/ui/dropdown';
import { useContext, useRef, useState } from 'react';
import { CornerDownLeft, Plus, X } from 'lucide-react';
import type { Project, Status, Task } from '@/lib/model/workspace';
import { MutationContext } from '@/components/ui/modal';
import { createTask } from '@/lib/model/task';
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
          'quick-create-trigger flex items-center gap-1.75 w-full text-left text-body text-muted py-2.5',
          'px-1.5 rounded [&:hover]:bg-overlay-pressed [&:hover]:text-ink',
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
        'quick-create p-2.25 border-2 border-focus rounded-card bg-surface [&_textarea]:w-full',
        '[&_textarea]:resize-y [&_textarea]:min-h-16.25 [&_textarea]:p-0.75 [&_textarea]:bg-surface',
        '[&_textarea]:border-0 [&_textarea]:outline-none [&_textarea]:text-sm [&_textarea]:text-ink',
        '[&_textarea]:leading-5.25 [&>.dropdown_.dropdown-trigger]:p-1',
        '[&>.dropdown_.dropdown-trigger]:max-w-full [&>.dropdown_.dropdown-trigger]:border',
        '[&>.dropdown_.dropdown-trigger]:border-line [&>.dropdown_.dropdown-trigger]:bg-surface',
        '[&>.dropdown_.dropdown-trigger]:rounded-chip [&>.dropdown_.dropdown-trigger]:text-caption',
        '[&>.dropdown]:mt-1 [&>.dropdown]:mb-2 [&_.dropdown-trigger]:min-h-7 [&_.dropdown-trigger]:text-caption',
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
          className={'quick-create-error mt-1.5 mx-0 mb-2.5 text-caption leading-4.25 text-danger'}
          role="alert"
        >
          {error}
        </p>
      )}
      <div
        className={cn(
          'quick-create-actions flex items-center gap-1.25 [&>span]:ml-auto [&>span]:text-micro',
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
