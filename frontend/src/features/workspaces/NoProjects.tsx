import { Button } from '../../shared/ui/Button';
import { cn } from '../../shared/ui/cn';
import { Plus } from 'lucide-react';
export const NoProjects = ({ readOnly, onCreate }: { readOnly: boolean; onCreate: () => void }) => {
  return (
    <div
      className={cn(
        'empty-state flex flex-col items-center justify-center gap-[15px] text-center min-h-65 py-12.5',
        'px-6 text-muted col-[1/-1] [&>svg]:text-[#8590a2] [&_h2]:text-[19px] [&_h2]:font-semibold',
        '[&_h2]:leading-7 [&_h2]:text-ink [&_p]:text-[13px] [&_p]:leading-[21px] [&_p]:max-w-102.5',
        '[&_p]:text-muted max-[520px]:py-9.5 max-[520px]:px-[15px] max-[520px]:[&_h2]:text-[17px]',
        'max-[520px]:[&_p]:text-xs onboarding-empty min-h-107.5',
      )}
    >
      <div
        className={cn(
          'empty-board flex gap-[7px] p-[11px] w-40.5 h-25 bg-[#f1f2f4] border border-line rounded-[5px]',
          'mb-[3px] [&_span]:w-10 [&_span]:h-[65px] [&_span]:bg-white [&_span]:border',
          '[&_span]:border-[#dfe1e6] [&_span]:rounded-[3px] [&_span]:relative',
          "[&_span::before]:content-[''] [&_span::before]:absolute [&_span::before]:top-2.5",
          '[&_span::before]:left-1.5 [&_span::before]:right-1.5 [&_span::before]:h-[5px]',
          '[&_span::before]:bg-[#deebff] [&_span::before]:rounded-[1px]',
          '[&_span::before]:shadow-[0_12px_#f1f2f4,0_24px_#f1f2f4] [&_span:nth-child(2)]:h-[49px]',
          '[&_span:nth-child(3)::before]:bg-[#baf3db]',
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
