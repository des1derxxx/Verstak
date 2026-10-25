'use client';

import { TaskEditor } from '@/components/task/task-editor/task-editor';
import { sortProjects } from '@/lib/model/task';
import { useNavigation } from '@/lib/navigation-guard';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useBackToWorkspace, useTaskActions } from '@/lib/workspace/use-workspace-actions';
import { useMembers } from '@/queries/members';
import { useRefreshWorkspace, useWorkspaceData } from '@/queries/workspace';
export const TaskPage = ({ reference, modal = false }: { reference: string; modal?: boolean }) => {
  const { info } = useWorkspace();
  const { workspace } = useWorkspaceData();
  const { members } = useMembers();
  const { back } = useNavigation();
  const backToWorkspace = useBackToWorkspace();
  const refresh = useRefreshWorkspace();
  const { openTask, saveTask, deleteTask, newSubtask } = useTaskActions();
  const task = workspace.tasks.find((item) => item.id === reference || item.key === reference);
  const close = modal ? back : backToWorkspace;
  if (!task)
    return (
      <div className="p-8">
        <h1>Задача удалена или недоступна</h1>
        <button className="mt-4 text-brand" onClick={close}>
          Вернуться к задачам
        </button>
      </div>
    );
  return (
    <TaskEditor
      key={task.id}
      inline={!modal}
      task={task}
      tasks={workspace.tasks}
      members={members}
      projects={sortProjects(workspace.projects)}
      projectId={task.projectId}
      workspaceId={info.id}
      onActivity={refresh}
      onOpenTask={openTask}
      onClose={close}
      onSave={saveTask}
      onSubtask={newSubtask}
      onDelete={deleteTask}
    />
  );
};
