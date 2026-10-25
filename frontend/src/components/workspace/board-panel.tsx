'use client';

import { Board } from '@/components/task/board';
import { useMembers } from '@/queries/members';
import { useNavigation } from '@/lib/navigation-guard';
import { viewPath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useProjectActions, useTaskActions } from '@/lib/workspace/use-workspace-actions';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
import { useTaskView } from '@/lib/workspace/workspace-location';
export const BoardPanel = () => {
  const { info, readOnly } = useWorkspace();
  const { openDialog } = useWorkspaceUi();
  const { addColumn } = useProjectActions();
  const { navigate } = useNavigation();
  const { members } = useMembers();
  const {
    scope: selected,
    filtered,
    projects: sortedProjects,
    filtersActive: activeFilters,
    project,
    statuses,
  } = useTaskView();
  const editable = Boolean(project) && !readOnly;
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
      backlogCount={filtered.filter((task) => statuses.category(task) === 'backlog').length}
      onOpen={openTask}
      onCreate={saveTask}
      onChange={saveTask}
      onBacklog={() => navigate(viewPath(info.id, selected, 'backlog'))}
      onAddColumn={
        editable && project ? (name, category) => addColumn(project, name, category) : undefined
      }
      onEditColumns={
        editable && project ? () => openDialog({ kind: 'project', project }) : undefined
      }
    />
  );
};
