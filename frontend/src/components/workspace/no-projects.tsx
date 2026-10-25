import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Plus } from 'lucide-react';
export const NoProjects = ({ readOnly, onCreate }: { readOnly: boolean; onCreate: () => void }) => {
  return (
    <div
      className={cn(
        'empty-state flex flex-col items-center justify-center gap-3.75 text-center min-h-65 py-12.5',
        'px-6 text-muted col-[1/-1] [&>svg]:text-placeholder [&_h2]:text-title [&_h2]:font-semibold',
        '[&_h2]:leading-7 [&_h2]:text-ink [&_p]:text-body [&_p]:leading-5.25 [&_p]:max-w-102.5',
        '[&_p]:text-muted max-phone:py-9.5 max-phone:px-3.75 max-phone:[&_h2]:text-title-sm',
        'max-phone:[&_p]:text-xs onboarding-empty min-h-107.5',
      )}
    >
      <div
        className={cn(
          'empty-board flex gap-1.75 p-2.75 w-40.5 h-25 bg-neutral border border-line rounded-card',
          'mb-0.75 [&_span]:w-10 [&_span]:h-16.25 [&_span]:bg-surface [&_span]:border',
          '[&_span]:border-line [&_span]:rounded-chip [&_span]:relative',
          "[&_span::before]:content-[''] [&_span::before]:absolute [&_span::before]:top-2.5",
          '[&_span::before]:left-1.5 [&_span::before]:right-1.5 [&_span::before]:h-1.25',
          '[&_span::before]:bg-brand-tint [&_span::before]:rounded-hairline',
          '[&_span::before]:shadow-skeleton [&_span:nth-child(2)]:h-12.25',
          '[&_span:nth-child(3)::before]:bg-success-border',
        )}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>
      <h2>{readOnly ? 'В пространстве пока нет проектов' : 'Начни с первого проекта'}</h2>
      <p>
        {readOnly
          ? 'Проекты появятся здесь, когда их добавит участник с правом редактирования.'
          : 'Собери задачи одного продукта или направления в проект. После этого можно работать с доской и страницами.'}
      </p>
      {!readOnly && (
        <Button onClick={onCreate} variant="primary">
          <Plus size={17} />
          Создать проект
        </Button>
      )}
    </div>
  );
};
