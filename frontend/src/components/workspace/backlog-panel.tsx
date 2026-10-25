'use client';

import { cn } from '@/lib/cn';
import { ListTodo } from 'lucide-react';
import { BacklogSection } from '@/components/task/board';
import { useNavigation } from '@/lib/navigation-guard';
import { viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useTaskActions } from '@/lib/workspace/use-workspace-actions';
import { useTaskView } from '@/lib/workspace/use-workspace-location';
export const BacklogPanel = () => {
  const { info } = useWorkspace();
  const { navigate } = useNavigation();
  const { scope: selected, filtered, projects: sortedProjects, counts } = useTaskView();
  const { openTask, saveTask } = useTaskActions();
  return (
    <div className={'backlog-view'}>
      <div
        className={cn(
          'backlog-intro flex items-center gap-2 text-muted text-xs pb-5 max-[520px]:text-[11px]',
          'max-[520px]:leading-4.5',
        )}
      >
        <ListTodo size={18} />
        <span>Планируй будущие задачи и переводи готовые к выполнению в работу.</span>
      </div>
      {(['todo', 'backlog'] as const).map((status) => (
        <BacklogSection
          key={`${selected}:${status}`}
          status={status}
          tasks={filtered.filter((task) => task.status === status)}
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
            'backlog-footnote text-muted text-xs [&_button]:text-brand [&_button]:py-0 [&_button]:px-[3px]',
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
