import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AuthForm } from '../src/app/(auth)/_components/auth-form.tsx';
import { PageLoading } from '../src/components/ui/page-loading.tsx';
test('public page components render on the server without browser globals or account data', () => {
  assert.equal(typeof window, 'undefined');
  const html = renderToString(createElement(AuthForm, { invitation: '', onSession: () => {} }));
  assert.match(html, /Войти в Verstak/);
  assert.ok(!html.includes('ivan@example.com'));
  assert.match(renderToString(createElement(PageLoading)), /role="status"/);
});
