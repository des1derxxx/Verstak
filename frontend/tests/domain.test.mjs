import { diffWorkspace } from '../src/lib/api/workspace-data.ts';
import { mockApi } from './mock-api.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { isDue, moveTask, parseWorkspace } from '../src/lib/model/workspace.ts';
import { api, ApiError, setCsrf } from '../src/lib/api/client.ts';

const empty = () => ({ version: 1, projects: [], tasks: [], notes: [] });
const project = { id: 'p', name: 'Verstak', description: '', color: '#bb684a' };
const task = {
  id: 't',
  projectId: 'p',
  title: 'Ship',
  description: '',
  status: 'todo',
  priority: 'high',
  due: '2026-10-24',
  labels: [],
  checklist: [],
  createdAt: '2026-10-24T12:00:00Z',
};

test('today includes overdue tasks but excludes completed and unscheduled tasks', () => {
  assert.equal(isDue(task, '2026-10-24'), true);
  assert.equal(isDue({ ...task, due: '2026-10-23' }, '2026-10-24'), true);
  assert.equal(isDue({ ...task, due: '2026-10-25' }, '2026-10-24'), false);
  assert.equal(isDue({ ...task, status: 'done' }, '2026-10-24'), false);
  assert.equal(isDue({ ...task, due: '' }, '2026-10-24'), false);
});

test('moving a task preserves its content and does not mutate the current snapshot', () => {
  const before = { ...empty(), projects: [project], tasks: [task] };
  const after = moveTask(before, task.id, 'done');
  assert.equal(before.tasks[0].status, 'todo');
  assert.deepEqual(after.tasks[0], { ...task, status: 'done' });
  assert.throws(() => moveTask(before, task.id, 'unknown'));
});

test('backup validation rejects unknown references, duplicate IDs and invalid calendar dates', () => {
  const data = { ...empty(), projects: [project], tasks: [task] };
  assert.deepEqual(parseWorkspace(JSON.parse(JSON.stringify(data))), data);
  assert.throws(() => parseWorkspace({ ...data, projects: [] }));
  assert.throws(() => parseWorkspace({ ...data, tasks: [task, task] }));
  assert.throws(() => parseWorkspace({ ...data, tasks: [{ ...task, due: '2026-02-30' }] }));
  assert.throws(() =>
    parseWorkspace({
      ...data,
      tasks: [
        {
          ...task,
          checklist: [
            { id: 'x', text: 'a', done: true },
            { id: 'x', text: 'b', done: false },
          ],
        },
      ],
    }),
  );
});

test('the API change set contains only changed records and explicit deletions', () => {
  const before = { ...empty(), projects: [project], tasks: [task] };
  const after = { ...before, tasks: [{ ...task, status: 'progress' }] };
  assert.deepEqual(diffWorkspace(before, after), {
    upsert: { projects: [], tasks: [after.tasks[0]], notes: [] },
    remove: { projects: [], tasks: [], notes: [] },
  });
  assert.deepEqual(diffWorkspace(before, empty()).remove, {
    projects: ['p'],
    tasks: ['t'],
    notes: [],
  });
});

test('API mutations use same-origin credentials and CSRF headers', async (context) => {
  setCsrf('csrf-token');
  const transport = mockApi(context, async (_url, options) => {
    assert.equal(options.withCredentials, true);
    assert.equal(options.headers['X-CSRF-Token'], 'csrf-token');
    assert.equal(options.headers['X-Verstak-Client'], 'web');
    assert.deepEqual(JSON.parse(options.body), { name: 'Work' });
    return new Response(JSON.stringify({ id: 'space' }), { status: 201 });
  });
  assert.deepEqual(await api('/workspaces', 'POST', { name: 'Work' }), { id: 'space' });
  assert.equal(transport.mock.callCount(), 1);
  setCsrf('');
});

test('API errors preserve conflict status and report unavailable or malformed responses', async (context) => {
  const transport = mockApi(
    context,
    async () => new Response(JSON.stringify({ detail: 'Conflict' }), { status: 409 }),
  );
  await assert.rejects(
    api('/workspaces'),
    (error) => error instanceof ApiError && error.status === 409 && error.message === 'Conflict',
  );
  transport.mock.mockImplementation(async () => {
    throw new TypeError('offline');
  });
  await assert.rejects(
    api('/workspaces'),
    (error) => error instanceof ApiError && error.status === 0,
  );
  transport.mock.mockImplementation(async () => new Response('<html>wrong server</html>'));
  await assert.rejects(
    api('/workspaces'),
    (error) => error instanceof ApiError && error.status === 502,
  );
});
