import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readWorkspaceRoute,
  viewPath,
  taskPath,
  filterSearch,
  safeReturnPath,
} from '../src/shared/lib/routes.ts';
test('project, task and today links preserve their scope on a fresh URL', () => {
  const path = viewPath('team', 'project', 'notes');
  assert.equal(path, '/workspaces/team/projects/project/pages');
  assert.deepEqual(readWorkspaceRoute(path, new URLSearchParams()), {
    selected: 'project',
    view: 'notes',
    filters: { query: '', priority: 'all', status: 'all', sort: 'created' },
  });
  const today = new URL(viewPath('team', 'today', 'backlog'), 'http://localhost');
  assert.equal(readWorkspaceRoute(today.pathname, today.searchParams).view, 'backlog');
  assert.equal(readWorkspaceRoute(today.pathname, today.searchParams).selected, 'today');
  assert.equal(taskPath('team', 'OM-52'), '/workspaces/team/tasks/OM-52');
});
test('URL filters round trip search and reset without losing the today view', () => {
  const filters = { query: 'release & API', priority: 'high', status: 'progress', sort: 'due' };
  const query = filterSearch(new URLSearchParams('view=backlog'), filters);
  const route = readWorkspaceRoute('/workspaces/team/today', new URLSearchParams(query));
  assert.deepEqual(route.filters, filters);
  assert.equal(route.view, 'backlog');
  assert.equal(
    filterSearch(new URLSearchParams(query), {
      query: '',
      priority: 'all',
      status: 'all',
      sort: 'created',
    }),
    'view=backlog',
  );
  assert.deepEqual(
    readWorkspaceRoute(
      '/workspaces/team/list',
      new URLSearchParams('priority=admin&status=unknown&sort=wrong'),
    ).filters,
    { query: '', priority: 'all', status: 'all', sort: 'created' },
  );
});
test('login return URLs cannot send users to another origin', () => {
  for (const input of [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/\\\\evil.example',
  ])
    assert.equal(safeReturnPath(input), '/');
  assert.equal(
    safeReturnPath('/workspaces/team/tasks/OM-52?mode=read'),
    '/workspaces/team/tasks/OM-52?mode=read',
  );
});
