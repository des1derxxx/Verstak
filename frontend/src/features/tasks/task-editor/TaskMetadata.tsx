import { statusStyles } from '@/shared/ui/variants';
import { cn } from '@/shared/ui/cn';
import { Dropdown } from '@/shared/ui/Dropdown';
import { priorityNames, statuses, statusNames } from '@/shared/model/workspace';
import type { Priority, Status, Task } from '@/shared/model/workspace';
import { taskKey } from '@/features/tasks/task-view';
import type { TaskEditorModel } from '@/features/tasks/task-editor/useTaskEditor';
export const TaskMetadata = ({ model }: { model: TaskEditorModel }) => {
  const { draft, update, task, projects, membersError, members, tasks } = model;
  return (
    <div
      className={cn(
        'issue-metadata-fields flex flex-col gap-4.5 [&_label]:text-[11px] [&_input]:text-xs',
        '[&_input]:min-h-[33px] [&_input]:py-1.5 [&_input]:px-[7px] [&_input]:bg-white',
        '[&_.dropdown-trigger]:text-xs [&_.dropdown-trigger]:min-h-[33px] [&_.dropdown-trigger]:py-1.5',
        '[&_.dropdown-trigger]:px-[7px] [&_.dropdown-trigger]:bg-white',
      )}
    >
      <label>
        Статус
        <Dropdown
          aria-label="Статус задачи"
          className={cn(
            'status-select border-0 rounded-[3px] text-[10px] font-semibold uppercase py-1 px-[5px]',
            'cursor-pointer max-w-32.5',
            statusStyles[draft.status],
          )}
          value={draft.status}
          onValueChange={(value) => update('status', value as Status)}
          options={[...statuses.map((value) => ({ value: value, label: statusNames[value] }))]}
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
            'error-text py-2.5 px-3 text-[#ae2e24] bg-[#fff1f0] border border-[#f5c8c5] rounded text-xs',
            'leading-[19px]',
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
        <span className={'field-hint text-[10px] font-normal text-muted'}>
          Например: дизайн, backend
        </span>
      </label>
    </div>
  );
};
