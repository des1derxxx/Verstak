import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
// The CSP nonce must be generated for every page, including error pages.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Verstak — проекты и задачи', template: '%s · Verstak' },
  robots: { index: false, follow: false },
  description: 'Рабочее пространство для проектов, задач и документации команды.',
  icons: { icon: '/favicon.svg' },
};
const RootLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => (
  <html lang="ru">
    <body>{children}</body>
  </html>
);
export default RootLayout;
