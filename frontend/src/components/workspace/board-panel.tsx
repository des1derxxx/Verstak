'use client';

import { Board } from '@/components/task/board';
import { useMembers } from '@/queries/members';
import { useNavigation } from '@/lib/navigation-guard';
import { viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useTaskActions } from '@/lib/workspace/use-workspace-actions';
import { useTaskView } from '@/lib/workspace/workspace-location';
export const BoardPanel = () => {
  const { info } = useWorkspace();
  const { navigate } = useNavigation();
  const { members } = useMembers();
  const {
    scope: selected,
    filtered,
    projects: sortedProjects,
    filtersActive: activeFilters,
  } = useTaskView();
  const { openTask, saveTask } = useTaskActions();
  return (
    <Board
      key={selected}
      members={members}
      tasks={filtered}
      projects={sortedProjects}
      projectId={selected}
      today={selected === 'today'}
      filtered={activeFilters}
      backlogCount={filtered.filter((task) => task.status === 'backlog').length}
      onOpen={openTask}
      onCreate={saveTask}
      onChange={saveTask}
      onBacklog={() => navigate(viewPath(info.id, selected, 'backlog'))}
    />
  );
};
