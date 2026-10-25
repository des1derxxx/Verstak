'use client';

import { useWorkspace } from '@/features/workspaces/WorkspaceContext';
import { Board } from '@/features/tasks/Board';
export const BoardPanel = () => {
  const model = useWorkspace();
  const {
    selected,
    members,
    filtered,
    sortedProjects,
    activeFilters,
    openTask,
    saveTask,
    setView,
  } = model;
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
      onBacklog={() => setView('backlog')}
    />
  );
};
