import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { proxy } from '../src/proxy.ts';

test('Next pages receive a unique CSP nonce without allowing arbitrary inline scripts', () => {
  const first = proxy(new NextRequest('http://localhost:3000/'));
  const second = proxy(new NextRequest('http://localhost:3000/'));
  const policy = first.headers.get('Content-Security-Policy');
  const scripts = policy
    .split(';')
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith('script-src'));
  assert.match(scripts, /'nonce-[A-Za-z0-9+/=]+'/);
  assert.ok(!scripts.includes("'unsafe-inline'"));
  assert.notEqual(policy, second.headers.get('Content-Security-Policy'));
  assert.equal(first.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(first.headers.get('X-Frame-Options'), 'DENY');
});
