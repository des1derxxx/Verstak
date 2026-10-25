import { Button } from '../../../shared/ui/Button';
import { cn } from '../../../shared/ui/cn';
import type { TaskEditorModel } from './useTaskEditor';
export const TaskDraftConflict = ({ model }: { model: TaskEditorModel }) => {
  const { liveTask, initial, setDraft, setCheckText, setDiscarding } = model;
  return (
    <div
      className={cn(
        'draft-conflict my-4 mx-6 p-3 bg-[#fff7d6] border border-[#e2b203] rounded-[5px] [&_p]:my-2',
        '[&_p]:mx-0 [&_p]:text-xs [&_p]:leading-[1.5]',
      )}
      role="alert"
    >
      <strong>
        {liveTask
          ? 'Задача изменилась, твой черновик сохранён в карточке.'
          : 'Задача удалена другим участником.'}
      </strong>
      {liveTask && (
        <>
          <p>Загрузи новую версию перед сохранением. Это заменит текущий черновик полей задачи.</p>
          <Button
            type="button"
            onClick={() => {
              initial.current = structuredClone(liveTask);
              setDraft(structuredClone(liveTask));
              setCheckText('');
              setDiscarding(false);
            }}
            variant="secondary"
            size="compact"
          >
            Загрузить новую версию
          </Button>
        </>
      )}
    </div>
  );
};
