'use client';

import { cn } from '@/lib/cn';
import { ListTodo } from 'lucide-react';
import { BacklogSection } from '@/components/task/board';
import { categoryNames, projectStatuses } from '@/lib/model/workspace';
import type { StatusCategory } from '@/lib/model/workspace';
import { useNavigation } from '@/lib/navigation-guard';
import { viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useTaskActions } from '@/lib/workspace/use-workspace-actions';
import { useTaskView } from '@/lib/workspace/workspace-location';
export const BacklogPanel = () => {
  const { info } = useWorkspace();
  const { navigate } = useNavigation();
  const {
    scope: selected,
    filtered,
    projects: sortedProjects,
    counts,
    project,
    statuses,
  } = useTaskView();
  const describe = (category: StatusCategory) =>
    category === 'todo'
      ? {
          description: 'Задачи, которые можно брать в работу',
          empty: 'Переведи сюда задачу из бэклога, когда будешь готов начать.',
        }
      : {
          description: 'Идеи и будущие задачи',
          empty: 'Добавь идеи, которые хочешь запланировать.',
        };
  // Ready work first, then ideas: a project's own columns, or the shared stages across projects.
  const sections = (['todo', 'backlog'] as const).flatMap((category) =>
    project
      ? projectStatuses(project)
          .filter((status) => status.category === category)
          .map((status) => ({
            status: status.id,
            title: status.name,
            ...describe(category),
            tasks: filtered.filter((task) => task.status === status.id),
          }))
      : [
          {
            status: category,
            title: categoryNames[category],
            ...describe(category),
            tasks: filtered.filter((task) => statuses.category(task) === category),
          },
        ],
  );
  const { openTask, saveTask } = useTaskActions();
  return (
    <div className={'backlog-view'}>
      <div
        className={cn(
          'backlog-intro flex items-center gap-2 text-muted text-xs pb-5 max-phone:text-caption',
          'max-phone:leading-4.5',
        )}
      >
        <ListTodo size={18} />
        <span>Планируй будущие задачи и переводи готовые к выполнению в работу.</span>
      </div>
      {sections.map((section) => (
        <BacklogSection
          key={`${selected}:${section.status}`}
          {...section}
          projects={sortedProjects}
          projectId={selected}
          today={selected === 'today'}
          onOpen={openTask}
          onCreate={saveTask}
          onChange={saveTask}
        />
      ))}
      {counts.progress > 0 && (
        <p
          className={cn(
            'backlog-footnote text-muted text-xs [&_button]:text-brand [&_button]:py-0 [&_button]:px-0.75',
            '[&_button]:text-xs',
          )}
        >
          Сейчас в работе: {counts.progress}.{' '}
          <button onClick={() => navigate(viewPath(info.id, selected, 'board'))}>
            Открыть доску
          </button>
        </p>
      )}
    </div>
  );
};
