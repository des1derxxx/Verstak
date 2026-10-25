'use client';

const ErrorPage = ({ reset }: { reset: () => void }) => (
  <main className={'flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center'}>
    <h1 className={'text-xl font-semibold text-ink'}>Не удалось открыть пространство</h1>
    <p className={'text-sm text-muted'}>Попробуй загрузить приложение ещё раз.</p>
    <button
      type="button"
      className={'rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover'}
      onClick={reset}
    >
      Повторить
    </button>
  </main>
);
export default ErrorPage;
