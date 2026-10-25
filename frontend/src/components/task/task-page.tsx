'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Snapshot } from '@/lib/api/types';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { TaskEditor } from '@/components/task/task-editor/task-editor';
import { createTask } from '@/lib/model/task';
import { viewPath } from '@/lib/routes';
export const TaskPage = ({
  reference,
  snapshot,
  modal = false,
}: {
  reference: string;
  snapshot: Snapshot;
  modal?: boolean;
}) => {
  const model = useWorkspace();
  const router = useRouter();
  useEffect(() => {
    model.receive(snapshot);
  }, [snapshot]);
  const workspace = snapshot.revision > model.revision ? snapshot.data : model.workspace;
  const task = workspace.tasks.find((item) => item.id === reference || item.key === reference);
  const close = () =>
    modal
      ? model.back
        ? model.back()
        : router.back()
      : model.navigate(viewPath(model.info.id), { discard: true });
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
      members={model.members}
      projects={model.sortedProjects}
      projectId={task.projectId}
      workspaceId={model.info.id}
      onActivity={() => model.refresh()}
      onOpenTask={model.openTask}
      onClose={close}
      onSave={model.saveTask}
      onSubtask={(parent) =>
        model.setModal({
          kind: 'task',
          seed: { ...createTask(parent.projectId), parentId: parent.id },
        })
      }
      onDelete={(id) =>
        model.commit(
          { ...model.workspace, tasks: model.workspace.tasks.filter((item) => item.id !== id) },
          'Задача удалена',
        )
      }
    />
  );
};
