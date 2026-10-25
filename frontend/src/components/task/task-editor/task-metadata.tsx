import { categoryStyles } from '@/components/task/task-styles';
import { cn } from '@/lib/cn';
import { Dropdown } from '@/components/ui/dropdown';
import { priorityNames } from '@/lib/model/workspace';
import type { Priority, Task } from '@/lib/model/workspace';
import { taskKey } from '@/lib/model/task';
import type { TaskEditorModel } from '@/components/task/task-editor/use-task-editor';
export const TaskMetadata = ({ model }: { model: TaskEditorModel }) => {
  const { draft, update, task, projects, statuses, membersError, members, tasks } = model;
  return (
    <div
      className={cn(
        'issue-metadata-fields flex flex-col gap-4.5 [&_label]:text-caption [&_input]:text-xs',
        '[&_input]:min-h-8.25 [&_input]:py-1.5 [&_input]:px-1.75 [&_input]:bg-surface',
        '[&_.dropdown-trigger]:text-xs [&_.dropdown-trigger]:min-h-8.25 [&_.dropdown-trigger]:py-1.5',
        '[&_.dropdown-trigger]:px-1.75 [&_.dropdown-trigger]:bg-surface',
      )}
    >
      <label>
        Статус
        <Dropdown
          aria-label="Статус задачи"
          className={cn(
            'status-select border-0 rounded-chip text-tiny font-semibold uppercase py-1 px-1.25',
            'cursor-pointer max-w-32.5',
            categoryStyles[statuses.category(draft)],
          )}
          value={draft.status}
          onValueChange={(value) => update('status', value)}
          options={statuses
            .list(draft.projectId)
            .map((status) => ({ value: status.id, label: status.name }))}
        />
      </label>
      {task && (
        <label>
          Проект
          <Dropdown
            aria-label="Проект задачи"
            disabled={Boolean(task.key)}
            value={draft.projectId}
            onValueChange={(value) => {
              update('projectId', value);
              update('parentId', null);
              // Columns differ between projects; keep the same stage.
              update('status', statuses.resolve(value, statuses.category(draft)));
            }}
            options={[...projects.map((project) => ({ value: project.id, label: project.name }))]}
          />
        </label>
      )}
      <label>
        Тип
        <Dropdown
          aria-label="Тип задачи"
          value={draft.type ?? 'task'}
          onValueChange={(value) => update('type', value as Task['type'])}
          options={[
            { value: 'task', label: 'Задача' },
            { value: 'bug', label: 'Ошибка' },
            { value: 'story', label: 'История' },
          ]}
        />
      </label>
      <label>
        Исполнитель
        <Dropdown
          aria-label="Исполнитель задачи"
          value={draft.assigneeId ?? ''}
          disabled={Boolean(membersError)}
          onValueChange={(value) => update('assigneeId', value || null)}
          options={[
            { value: '', label: 'Не назначен' },
            ...(draft.assigneeId && !members.some((m) => m.user.id === draft.assigneeId)
              ? [{ value: draft.assigneeId, label: 'Участник покинул пространство' }]
              : []),
            ...members.map((m) => ({ value: m.user.id, label: m.user.name })),
          ]}
        />
      </label>
      {membersError && (
        <p
          className={cn(
            'error-text py-2.5 px-3 text-danger-strong bg-danger-soft border border-danger-border rounded text-xs',
            'leading-4.75',
          )}
          role="alert"
        >
          {membersError}
        </p>
      )}
      <label>
        Родительская задача
        <Dropdown
          aria-label="Родительская задача"
          value={draft.parentId ?? ''}
          onValueChange={(value) => update('parentId', value || null)}
          options={[
            { value: '', label: 'Без родителя' },
            ...tasks
              .filter((t) => t.projectId === draft.projectId && t.id !== draft.id)
              .map((t) => ({
                value: t.id,
                label: (
                  <>
                    {taskKey(t)}· {t.title}
                  </>
                ),
              })),
          ]}
        />
      </label>
      <label>
        Приоритет
        <Dropdown
          aria-label="Приоритет задачи"
          value={draft.priority}
          onValueChange={(value) => update('priority', value as Priority)}
          options={[
            ...Object.entries(priorityNames).map(([value, label]) => ({
              value: value,
              label: label,
            })),
          ]}
        />
      </label>
      <label>
        Срок
        <input
          aria-label="Срок задачи"
          type="date"
          value={draft.due}
          onChange={(event) => update('due', event.target.value)}
        />
      </label>
      <label>
        Метки
        <input
          aria-label="Метки задачи"
          placeholder="Через запятую"
          value={draft.labels.join(',')}
          onChange={(event) => update('labels', event.target.value.split(','))}
        />
        <span className={'field-hint text-tiny font-normal text-muted'}>
          Например: дизайн, backend
        </span>
      </label>
    </div>
  );
};
