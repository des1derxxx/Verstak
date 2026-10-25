import type { Note, Project, Status, Task } from '@/lib/model/workspace';
import type { Filters, View } from '@/lib/model/task';
import type { Session, Space, Snapshot, Member, User } from '@/lib/api/types';
export type WorkspaceControllerProps = {
  todayDate?: string;
  initialSnapshot?: Snapshot;
  initialMembers?: Member[];
  route: { selected: string; view: View; filters: Filters };
  onNavigate: (href: string, options?: { discard?: boolean }) => void;
  onFilters: (filters: Filters) => void;
  onOpenTask?: (task: Task) => void;
  hasDraft?: () => boolean;
  onBack?: () => void;
  onUser?: (user: User) => void;
  onProfile?: () => void;
  info: Space;
  session: Session;
  spaces: Space[];
  onSelectSpace: (id: string, taskId?: string) => void;
  onNewSpace: () => void;
  onTeam: () => void;
  onLogout: () => void;
};
export type ModalState =
  | {
      kind: 'task';
      task?: Task;
      seed?: Task;
      status?: Status;
    }
  | {
      kind: 'project';
      project?: Project;
    }
  | {
      kind: 'note';
      note?: Note;
    }
  | {
      kind: 'shortcuts';
    }
  | null;
