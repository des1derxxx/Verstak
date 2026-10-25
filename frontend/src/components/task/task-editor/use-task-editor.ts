import { useRouteDraft } from '@/lib/navigation-guard';
import { useContext, useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/model/workspace';
import { MutationContext } from '@/components/ui/modal';
import { createTask } from '@/lib/model/task';
import type { TaskEditorProps } from '@/components/task/task-editor/types';
export const useTaskEditor = ({
  task,
  seed,
  status,
  projects,
  projectId,
  today = false,
  tasks = [],
  members = [],
  membersError = '',
  workspaceId,
  onOpenTask,
  onSubtask,
  onActivity = async () => {},
  onSave,
  onDelete,
  onClose,
}: TaskEditorProps) => {
  const mutation = useContext(MutationContext);
  const initial = useRef(
    task
      ? structuredClone(task)
      : (seed ??
          createTask(
            projects.some((project) => project.id === projectId) ? projectId : projects[0].id,
            '',
            status,
            today,
          )),
  );
  const [draft, setDraft] = useState<Task>(() => ({
    ...initial.current,
    ...(status ? { status } : {}),
  }));
  const [preview, setPreview] = useState(mutation.readOnly);
  const [commentDirty, setCommentDirty] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const closing = draft.status === 'done' && (!task || initial.current.status !== 'done');
  const liveTask = tasks.find((t) => t.id === task?.id);
  const stale = Boolean(
    task &&
      workspaceId &&
      initial.current.revision &&
      (!liveTask || liveTask.revision !== initial.current.revision),
  );
  const children = tasks.filter((child) => child.parentId === draft.id);
  const parent = tasks.find((t) => t.id === draft.parentId);
  const [checkText, setCheckText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [copyNotice, setCopyNotice] = useState('');
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial.current) ||
    Boolean(checkText.trim()) ||
    commentDirty;
  useRouteDraft(dirty && !mutation.readOnly);
  const selectedProject = projects.find((project) => project.id === draft.projectId);
  useEffect(() => {
    const input = titleRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.max(input.scrollHeight, 39)}px`;
  }, [draft.title]);
  const update = <K extends keyof Task>(key: K, value: Task[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setDiscarding(false);
  };
  const requestClose = () => {
    if (dirty && !mutation.readOnly) setDiscarding(true);
    else onClose();
  };
  const addCheck = () => {
    if (!checkText.trim()) return;
    update('checklist', [
      ...draft.checklist,
      { id: crypto.randomUUID(), text: checkText.trim(), done: false },
    ]);
    setCheckText('');
  };
  return {
    task,
    seed,
    status,
    projects,
    projectId,
    today,
    tasks,
    members,
    membersError,
    workspaceId,
    onOpenTask,
    onSubtask,
    onActivity,
    onSave,
    onDelete,
    onClose,
    selectedProject,
    requestClose,
    commentBusy,
    mutation,
    stale,
    commentDirty,
    draft,
    closing,
    checkText,
    liveTask,
    initial,
    setDraft,
    setCheckText,
    setDiscarding,
    setCopyNotice,
    copyNotice,
    titleRef,
    update,
    parent,
    preview,
    setPreview,
    children,
    dirty,
    setCommentDirty,
    setCommentBusy,
    discarding,
    deleting,
    setDeleting,
    addCheck,
  };
};
export type TaskEditorModel = ReturnType<typeof useTaskEditor>;
