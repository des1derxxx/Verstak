import test from 'node:test';
import assert from 'node:assert/strict';
import {
  locationFromSegments,
  parseFilters,
  viewPath,
  taskPath,
  filterSearch,
  safeReturnPath,
} from '../src/lib/routes.ts';
const segments = (path) => path.split('/').slice(3);
test('project, task and today links round trip through App Router segments', () => {
  const path = viewPath('team', 'project', 'notes');
  assert.equal(path, '/workspaces/team/projects/project/pages');
  assert.deepEqual(locationFromSegments(segments(path)), { scope: 'project', view: 'notes' });
  assert.equal(viewPath('team', 'today', 'list'), '/workspaces/team/today');
  assert.equal(viewPath('team', 'today', 'backlog'), '/workspaces/team/today/backlog');
  for (const view of ['list', 'board', 'backlog'])
    assert.deepEqual(locationFromSegments(segments(viewPath('team', 'today', view))), {
      scope: 'today',
      view,
    });
  assert.deepEqual(locationFromSegments(['pages', 'note-id']), { scope: 'all', view: 'notes' });
  assert.deepEqual(locationFromSegments(['settings', 'members']), { scope: 'all', view: 'board' });
  assert.equal(taskPath('team', 'OM-52'), '/workspaces/team/tasks/OM-52');
});
test('URL filters round trip search and reset without losing other parameters', () => {
  const filters = { query: 'release & API', priority: 'high', status: 'progress', sort: 'due' };
  const query = filterSearch(new URLSearchParams('tab=1'), filters);
  assert.deepEqual(parseFilters(new URLSearchParams(query)), filters);
  assert.equal(
    filterSearch(new URLSearchParams(query), {
      query: '',
      priority: 'all',
      status: 'all',
      sort: 'created',
    }),
    'tab=1',
  );
  assert.deepEqual(
    parseFilters(new URLSearchParams('priority=admin&status=not%20a%20status!&sort=wrong')),
    {
      query: '',
      priority: 'all',
      status: 'all',
      sort: 'created',
    },
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
