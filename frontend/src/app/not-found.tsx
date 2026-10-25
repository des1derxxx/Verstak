import Link from 'next/link';
const NotFound = () => (
  <main className="mx-auto flex min-h-80 max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
    <h1>Страница не найдена</h1>
    <p className="text-muted">Ссылка устарела или у тебя нет доступа.</p>
    <Link href="/">Перейти к рабочим пространствам</Link>
  </main>
);
export default NotFound;
