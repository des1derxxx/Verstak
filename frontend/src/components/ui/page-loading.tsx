export const PageLoading = ({ label = 'Загружаем страницу…' }: { label?: string }) => (
  <div
    className="flex min-h-60 flex-col items-center justify-center gap-4 p-8 text-muted"
    role="status"
  >
    <span
      className="size-6 animate-spin rounded-full border-2 border-brand-soft border-t-brand"
      aria-hidden="true"
    />
    <p>{label}</p>
  </div>
);
