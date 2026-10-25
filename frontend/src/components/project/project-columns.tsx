import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { categoryNames } from '@/lib/model/workspace';
import type { ProjectStatus, StatusCategory } from '@/lib/model/workspace';
const stages = (['backlog', 'todo', 'progress', 'done'] as const).map((value) => ({
  value,
  label: categoryNames[value],
}));
// The board needs somewhere to create work and somewhere to finish it.
const required: StatusCategory[] = ['todo', 'done'];
export const ProjectColumns = ({
  columns,
  onChange,
}: {
  columns: ProjectStatus[];
  onChange: (columns: ProjectStatus[]) => void;
}) => {
  const update = (index: number, patch: Partial<ProjectStatus>) =>
    onChange(columns.map((column, i) => (i === index ? { ...column, ...patch } : column)));
  const move = (index: number, offset: number) => {
    const next = [...columns];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };
  const isLast = (column: ProjectStatus) =>
    required.includes(column.category) &&
    columns.filter((item) => item.category === column.category).length === 1;
  return (
    <fieldset className="flex flex-col gap-2.5 border-0 p-0">
      <legend className="mb-1 text-xs font-medium text-ink-secondary">Колонки доски</legend>
      {columns.map((column, index) => (
        <div className="grid grid-cols-[1fr_150px_auto] items-center gap-2" key={column.id}>
          <input
            aria-label={`Название колонки ${index + 1}`}
            required
            maxLength={40}
            value={column.name}
            onChange={(event) => update(index, { name: event.target.value })}
          />
          <Dropdown
            aria-label={`Стадия колонки ${column.name}`}
            value={column.category}
            disabled={isLast(column)}
            onValueChange={(value) => update(index, { category: value as StatusCategory })}
            options={stages}
          />
          <span className="flex">
            <IconButton
              type="button"
              aria-label={`Переместить ${column.name} выше`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp size={15} />
            </IconButton>
            <IconButton
              type="button"
              aria-label={`Переместить ${column.name} ниже`}
              disabled={index === columns.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown size={15} />
            </IconButton>
            <IconButton
              type="button"
              tone="danger"
              aria-label={`Удалить колонку ${column.name}`}
              title={isLast(column) ? 'Это последняя колонка такой стадии' : undefined}
              disabled={isLast(column)}
              onClick={() => onChange(columns.filter((_, i) => i !== index))}
            >
              <Trash2 size={15} />
            </IconButton>
          </span>
        </div>
      ))}
      <p className="text-caption text-muted">
        Стадия определяет поведение: «Готово» требует итогового комментария, «Бэклог» не
        показывается на доске. Задачи из удалённой колонки перейдут в первую колонку той же стадии.
      </p>
      {columns.length < 20 && (
        <Button
          type="button"
          variant="secondary"
          size="compact"
          className="self-start"
          onClick={() =>
            onChange([
              ...columns,
              { id: `col-${crypto.randomUUID().slice(0, 8)}`, name: '', category: 'progress' },
            ])
          }
        >
          <Plus size={15} />
          Добавить колонку
        </Button>
      )}
    </fieldset>
  );
};
