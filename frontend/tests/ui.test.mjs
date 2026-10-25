import { mockApi } from './mock-api.mjs';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
for (const key of [
  'window',
  'self',
  'document',
  'navigator',
  'Element',
  'HTMLElement',
  'HTMLDialogElement',
  'Node',
  'Event',
  'CustomEvent',
  'localStorage',
]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.createImageBitmap = async () => {
  throw new Error('Not implemented outside avatar tests');
};
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};

const { createElement: h } = await import('react');
const testingLibrary = await import('@testing-library/react');
const { cleanup, fireEvent, screen, waitFor, within } = testingLibrary;
const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
// Every render gets its own query cache; gcTime Infinity schedules no timers that keep node alive.
const render = (element) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  return testingLibrary.render(element, {
    wrapper: ({ children }) => h(QueryClientProvider, { client }, children),
  });
};
const { QuickCreate } = await import('../src/components/task/quick-create.tsx');
const { TaskEditor } = await import('../src/components/task/task-editor/task-editor.tsx');
const { MutationContext } = await import('../src/components/ui/modal.tsx');
const { WorkspaceApp } = await import('./workspace-harness.tsx');
const { localDate } = await import('../src/lib/model/workspace.ts');

const project = { id: 'project', name: 'Verstak', description: '', color: '#0c66e4' };
const task = {
  id: 'task-1234',
  projectId: project.id,
  title: 'Fix the board',
  description: '',
  status: 'todo',
  priority: 'high',
  due: '',
  labels: [],
  checklist: [],
  createdAt: '2026-10-24T00:00:00Z',
};
const space = { id: 'space', name: 'Team', role: 'owner' };
const session = { user: { id: 'user', name: 'Ivan', email: 'ivan@example.com' }, csrf: 'csrf' };

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function chooseDropdown(name, option) {
  fireEvent.click(screen.getByRole('combobox', { name }));
  fireEvent.click(screen.getByRole('option', { name: option, exact: true }));
}

function mountWorkspace(context, tasks = [task]) {
  let revision = 0;
  let data = { version: 1, projects: [project], tasks: structuredClone(tasks), notes: [] };
  const mutations = [];
  mockApi(context, async (_url, options) => {
    if (String(_url).endsWith('/notifications')) return Response.json([]);
    if (String(_url).endsWith('/members'))
      return Response.json([{ user: session.user, role: 'owner' }]);
    if (/\/(comments|history)(\?|$)/.test(String(_url))) return Response.json([]);
    if (options.method === 'PATCH') {
      const body = JSON.parse(options.body);
      mutations.push(body);
      for (const kind of ['projects', 'tasks', 'notes']) {
        const items = new Map(data[kind].map((item) => [item.id, item]));
        for (const id of body.remove[kind]) items.delete(id);
        for (const item of body.upsert[kind]) items.set(item.id, item);
        data[kind] = [...items.values()];
      }
      revision += 1;
    }
    return new Response(JSON.stringify({ revision, data }), { status: 200 });
  });
  render(h(WorkspaceApp, { session, space, snapshot: { revision, data: structuredClone(data) } }));
  return mutations;
}

test('quick create needs only a title, preserves the target column and assigns today when appropriate', async () => {
  const created = [];
  render(
    h(QuickCreate, {
      projects: [project],
      projectId: project.id,
      status: 'progress',
      today: true,
      onCreate: async (task) => {
        created.push(task);
        return true;
      },
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }));
  const input = screen.getByRole('textbox', { name: 'Название новой задачи' });
  fireEvent.change(input, { target: { value: '  A useful task  ' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => assert.equal(input.value, ''));
  assert.equal(created.length, 1);
  assert.equal(created[0].title, 'A useful task');
  assert.equal(created[0].projectId, project.id);
  assert.equal(created[0].status, 'progress');
  assert.equal(created[0].due, localDate());
});

test('failed quick creation retains the draft and reuses its ID on retry', async () => {
  const created = [];
  render(
    h(QuickCreate, {
      projects: [project],
      projectId: project.id,
      onCreate: async (task) => {
        created.push(task);
        return created.length > 1;
      },
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }));
  const input = screen.getByRole('textbox', { name: 'Название новой задачи' });
  fireEvent.change(input, { target: { value: 'Keep this draft' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await screen.findByRole('alert');
  assert.equal(input.value, 'Keep this draft');
  fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
  await waitFor(() => assert.equal(input.value, ''));
  assert.equal(created.length, 2);
  assert.equal(created[0].id, created[1].id);
});

test('task details open in a drawer and protect unsaved changes before closing', async () => {
  let closed = 0;
  const saved = [];
  render(
    h(TaskEditor, {
      task,
      projects: [project],
      projectId: project.id,
      onSave: async (value) => {
        saved.push(value);
        return true;
      },
      onDelete: async () => true,
      onClose: () => {
        closed++;
      },
    }),
  );
  assert.ok(screen.getByRole('dialog').classList.contains('modal-drawer'));
  assert.equal(screen.getByRole('button', { name: 'Сохранить' }).disabled, true);
  chooseDropdown('Статус задачи', 'В работе');
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть', exact: true }));
  assert.equal(closed, 0);
  assert.match(screen.getByRole('alert').textContent, /несохранённые изменения/);
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить редактирование' }));
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  await waitFor(() => assert.equal(closed, 1));
  assert.equal(saved[0].status, 'progress');
});

test('viewers can inspect and close details but cannot edit or save', () => {
  let closed = 0;
  render(
    h(
      MutationContext.Provider,
      { value: { saving: false, readOnly: true, error: '' } },
      h(TaskEditor, {
        task,
        projects: [project],
        projectId: project.id,
        onSave: async () => {
          throw new Error('must not save');
        },
        onDelete: async () => false,
        onClose: () => {
          closed++;
        },
      }),
    ),
  );
  const viewerTitle = screen.getByLabelText('Название задачи');
  assert.equal(viewerTitle.matches(':disabled'), true);
  assert.ok(screen.queryByRole('button', { name: 'Сохранить' }) === null);
  fireEvent.click(screen.getAllByRole('button', { name: 'Закрыть' })[0]);
  assert.equal(closed, 1);
});

test('creating a task does not require opening optional fields', async () => {
  const saved = [];
  render(
    h(TaskEditor, {
      projects: [project],
      projectId: 'today',
      today: true,
      onSave: async (task) => {
        saved.push(task);
        return true;
      },
      onDelete: async () => false,
      onClose() {},
    }),
  );
  assert.equal(screen.getByText('Дополнительные поля').closest('details').open, false);
  fireEvent.change(screen.getByRole('textbox', { name: 'Название задачи' }), {
    target: { value: 'One simple step' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }));
  await waitFor(() => assert.equal(saved.length, 1));
  assert.equal(saved[0].projectId, project.id);
  assert.equal(saved[0].due, localDate());
});

test('the task list changes status directly without opening an editor', async (context) => {
  const mutations = mountWorkspace(context);
  await screen.findByRole('heading', { name: 'Все задачи' });
  fireEvent.click(screen.getByRole('tab', { name: 'Список' }));
  chooseDropdown('Статус задачи: Fix the board', 'В работе');
  await waitFor(() =>
    assert.match(
      screen.getByRole('combobox', { name: 'Статус задачи: Fix the board' }).textContent,
      /В работе/,
    ),
  );
  assert.equal(mutations.length, 1);
  assert.equal(mutations[0].upsert.tasks[0].status, 'progress');
  assert.ok(screen.queryByRole('dialog') === null);
});

test('C opens creation but typing C in search does not trigger a dialog', async (context) => {
  mountWorkspace(context);
  await screen.findByRole('heading', { name: 'Все задачи' });
  fireEvent.keyDown(document.body, { key: 'c' });
  assert.ok(await screen.findByRole('dialog', { name: 'Создать задачу' }));
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
  const search = screen.getByRole('searchbox', { name: 'Поиск задач и страниц' });
  fireEvent.keyDown(search, { key: 'c' });
  assert.ok(screen.queryByRole('dialog') === null);
});

test('backlog work can be started without opening a task', async (context) => {
  const backlogTask = {
    ...task,
    id: 'backlog-item',
    title: 'Plan the next release',
    status: 'backlog',
  };
  const mutations = mountWorkspace(context, [task, backlogTask]);
  await screen.findByRole('heading', { name: 'Все задачи' });
  assert.ok(screen.queryByText('Plan the next release') === null);
  fireEvent.click(screen.getByRole('tab', { name: /Бэклог/ }));
  fireEvent.click(screen.getByLabelText('Начать работу: Plan the next release'));
  await waitFor(() => assert.ok(screen.queryByText('Plan the next release') === null));
  assert.equal(mutations[0].upsert.tasks[0].status, 'progress');
});

test('the login screen exposes password visibility and clear registration requirements', async (context) => {
  mockApi(
    context,
    async () => new Response(JSON.stringify({ detail: 'Sign in' }), { status: 401 }),
  );
  const { AuthForm } = await import('../src/app/(auth)/_components/auth-form.tsx');
  render(h(AuthForm, { invitation: '', onSession: () => {} }));
  await screen.findByRole('heading', { name: 'Войти в Verstak' });
  const password = screen.getByLabelText('Пароль');
  assert.equal(password.type, 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Показать пароль' }));
  assert.equal(password.type, 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
  await screen.findByRole('heading', { name: 'Создать аккаунт' });
  assert.equal(screen.getByLabelText('Пароль').minLength, 12);
  assert.ok(screen.getByText('Не меньше 12 символов'));
  assert.ok(screen.getByLabelText('Имя'));
});

test('sorting the list puts scheduled work before tasks without a deadline', async (context) => {
  const tasks = [
    {
      ...task,
      id: 'low-task',
      title: 'Unscheduled',
      priority: 'low',
      createdAt: '2026-10-20T00:00:00Z',
    },
    {
      ...task,
      id: 'high-task',
      title: 'Later deadline',
      priority: 'high',
      due: '2030-12-31',
      createdAt: '2026-10-21T00:00:00Z',
    },
    {
      ...task,
      id: 'medium-task',
      title: 'Earlier deadline',
      priority: 'medium',
      due: '2026-10-25',
      createdAt: '2026-10-22T00:00:00Z',
    },
  ];
  const mutations = mountWorkspace(context, tasks);
  await screen.findByRole('heading', { name: 'Все задачи' });
  fireEvent.click(screen.getByRole('tab', { name: 'Список' }));
  const titles = () =>
    [...document.querySelectorAll('.issue-title-link')].map((button) => button.textContent);
  chooseDropdown('Сортировка задач', 'По сроку');
  assert.deepEqual(titles(), ['Earlier deadline', 'Later deadline', 'Unscheduled']);
  chooseDropdown('Сортировка задач', 'По приоритету');
  assert.deepEqual(titles(), ['Later deadline', 'Earlier deadline', 'Unscheduled']);
  assert.equal(mutations.length, 0);
});

test('today keeps backlog navigation available for scheduled backlog tasks', async (context) => {
  mountWorkspace(context, [
    { ...task, id: 'scheduled-backlog', status: 'backlog', due: localDate() },
  ]);
  await screen.findByRole('heading', { name: 'Все задачи' });
  fireEvent.click(screen.getByRole('link', { name: /^Сегодня/ }));
  fireEvent.click(screen.getByRole('tab', { name: 'Доска' }));
  fireEvent.click(screen.getByRole('button', { name: /Открыть бэклог/ }));
  assert.equal(screen.getByRole('tab', { name: /Бэклог/ }).getAttribute('aria-selected'), 'true');
  assert.ok(screen.getByText('Fix the board'));
});

test('closing a page preserves its draft until the user explicitly discards it', async () => {
  const { NoteForm } = await import('../src/components/note/note-form.tsx');
  let closed = 0;
  let saved = 0;
  const note = {
    id: 'note',
    projectId: project.id,
    title: 'Architecture',
    body: '# Original',
    updatedAt: task.createdAt,
  };
  render(
    h(NoteForm, {
      note,
      projects: [project],
      projectId: project.id,
      onSave: () => {
        saved++;
      },
      onDelete() {},
      onClose: () => {
        closed++;
      },
    }),
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Текст страницы' }), {
    target: { value: '# Keep this document' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть', exact: true }));
  assert.equal(closed, 0);
  assert.match(screen.getByRole('alert').textContent, /несохранённые изменения/);
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить редактирование' }));
  assert.equal(
    screen.getByRole('textbox', { name: 'Текст страницы' }).value,
    '# Keep this document',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть без сохранения' }));
  assert.equal(closed, 1);
  assert.equal(saved, 0);
});

test('completing a task from the list asks for a resolution and saves it with the status', async (context) => {
  const mutations = mountWorkspace(context, [{ ...task, key: 'OM-52', revision: 1 }]);
  await screen.findByRole('heading', { name: 'Все задачи' });
  fireEvent.click(screen.getByRole('tab', { name: 'Список' }));
  chooseDropdown('Статус задачи: Fix the board', 'Готово');
  await screen.findByRole('textbox', { name: 'Итоговый комментарий' });
  assert.equal(mutations.length, 0);
  assert.equal(screen.getByRole('button', { name: 'Сохранить' }).disabled, true);
  fireEvent.change(screen.getByRole('textbox', { name: 'Итоговый комментарий' }), {
    target: { value: 'Implemented and tested PR #52' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  await waitFor(() => assert.equal(mutations.length, 1));
  assert.equal(mutations[0].upsert.tasks[0].status, 'done');
  assert.equal(mutations[0].upsert.tasks[0].resolutionComment, 'Implemented and tested PR #52');
  await waitFor(() => assert.ok(screen.queryByRole('dialog') === null));
});

test('task metadata and real subtask navigation are separate from checklist items', async () => {
  const saved = [],
    opened = [],
    subtask = [];
  const parent = { ...task, key: 'OM-52' };
  const child = { ...task, id: 'child', key: 'OM-53', parentId: task.id, title: 'Child task' };
  render(
    h(TaskEditor, {
      task: parent,
      tasks: [parent, child],
      members: [{ user: session.user, role: 'owner' }],
      projects: [project],
      projectId: project.id,
      onSave: async (t) => {
        saved.push(t);
        return true;
      },
      onDelete: async () => false,
      onOpenTask: (t) => opened.push(t),
      onSubtask: (t) => subtask.push(t),
      onClose() {},
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: /OM-53.*Child task/ }));
  assert.equal(opened[0].id, child.id);
  fireEvent.click(screen.getByRole('button', { name: 'Создать подзадачу' }));
  assert.equal(subtask[0].id, parent.id);
  chooseDropdown('Тип задачи', 'Ошибка');
  chooseDropdown('Исполнитель задачи', 'Ivan');
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  await waitFor(() => assert.equal(saved.length, 1));
  assert.equal(saved[0].type, 'bug');
  assert.equal(saved[0].assigneeId, session.user.id);
});

test('Markdown renders code and tables and never inserts raw HTML or executable links', async () => {
  const { Markdown } = await import('../src/components/ui/markdown.tsx');
  render(
    h(Markdown, {
      text: '# Heading\n\n**Bold** and [unsafe](javascript:alert(1))\n\n<script>alert(1)</script>\n\n```python\nprint(52)\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |',
    }),
  );
  assert.ok(screen.getByRole('heading', { name: 'Heading' }));
  assert.equal(document.querySelector('strong').textContent, 'Bold');
  assert.equal(document.querySelector('pre code').textContent.trim(), 'print(52)');
  assert.equal(document.querySelectorAll('table').length, 1);
  assert.equal(document.querySelectorAll('script').length, 0);
  assert.ok(!document.querySelector('a').getAttribute('href')?.startsWith('javascript:'));
});

test('failed comment posting retains the draft and close protects it', async (context) => {
  mockApi(context, async (_url, options) =>
    options.method === 'POST'
      ? Response.json({ detail: 'Connection failed' }, { status: 503 })
      : Response.json([]),
  );
  let closed = 0;
  render(
    h(TaskEditor, {
      task,
      workspaceId: space.id,
      projects: [project],
      projectId: project.id,
      onSave: async () => false,
      onDelete: async () => false,
      onClose: () => closed++,
    }),
  );
  const composer = await screen.findByRole('textbox', { name: 'Новый комментарий' });
  fireEvent.change(composer, { target: { value: 'Keep my comment' } });
  fireEvent.click(screen.getByRole('button', { name: 'Отправить комментарий' }));
  await screen.findByText('Connection failed');
  assert.equal(composer.value, 'Keep my comment');
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть', exact: true }));
  assert.equal(closed, 0);
  assert.ok(
    screen.getAllByRole('alert').some((alert) => /несохранённые изменения/.test(alert.textContent)),
  );
});

test('API tokens expose secrets once and revocation sends the token ID', async (context) => {
  const { TokenPanel } = await import(
    '../src/app/(workspace)/workspaces/[workspaceId]/settings/tokens/_components/token-panel.tsx'
  );
  const calls = [];
  let token = null;
  mockApi(context, async (url, options) => {
    calls.push([url, options]);
    if (options.method === 'POST') {
      token = {
        id: 'token-id',
        workspaceId: space.id,
        name: 'Bot',
        scopes: ['tasks:read'],
        last4: 'abcd',
        expiresAt: '2027-01-01T00:00:00Z',
      };
      return Response.json({ ...token, token: 'vsk_secret-abcd' });
    }
    if (options.method === 'DELETE') {
      token = null;
      return new Response(null, { status: 204 });
    }
    return Response.json(token ? [token] : []);
  });
  render(h(TokenPanel, { space, onClose() {} }));
  const input = screen.getByRole('textbox', { name: 'Название токена' });
  fireEvent.change(input, { target: { value: 'Bot' } });
  await waitFor(() =>
    assert.equal(screen.getByRole('button', { name: 'Создать токен' }).disabled, false),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Создать токен' }));
  assert.equal(
    (await screen.findByRole('textbox', { name: 'Новый API-токен' })).value,
    'vsk_secret-abcd',
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Я сохранил токен' }));
  fireEvent.click(screen.getByRole('button', { name: 'Скрыть токен' }));
  assert.ok(screen.queryByDisplayValue('vsk_secret-abcd') === null);
  fireEvent.click(await screen.findByRole('button', { name: 'Отозвать токен Bot' }));
  await waitFor(() =>
    assert.ok(
      calls.some(
        ([url, options]) => url === '/api/api-tokens/token-id' && options.method === 'DELETE',
      ),
    ),
  );
});

test('password recovery checks confirmation and submits the reset token', async (context) => {
  const { PasswordRecovery } = await import('../src/app/(auth)/_components/password-recovery.tsx');
  const calls = [];
  mockApi(context, async (url, options) => {
    calls.push([url, JSON.parse(options.body)]);
    return new Response(null, { status: 204 });
  });
  render(h(PasswordRecovery, { token: 'reset-secret', onClose() {} }));
  fireEvent.change(screen.getByLabelText('Новый пароль'), {
    target: { value: 'strong-password-123' },
  });
  fireEvent.change(screen.getByLabelText('Повтори пароль'), {
    target: { value: 'different-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сменить пароль' }));
  assert.equal(screen.getByRole('alert').textContent, 'Пароли не совпадают');
  assert.equal(calls.length, 0);
  fireEvent.change(screen.getByLabelText('Повтори пароль'), {
    target: { value: 'strong-password-123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сменить пароль' }));
  await screen.findByText('Пароль изменён. Войди с новым паролем.');
  assert.deepEqual(calls[0], [
    '/api/auth/reset-password',
    { token: 'reset-secret', password: 'strong-password-123' },
  ]);
});

test('a stale task draft cannot overwrite a newer task and can explicitly load the current version', async (context) => {
  mockApi(context, async () => Response.json([]));
  const original = { ...task, key: 'OM-52', revision: 1 };
  const props = {
    task: original,
    tasks: [original],
    workspaceId: space.id,
    projects: [project],
    projectId: project.id,
    onSave: async () => false,
    onDelete: async () => false,
    onClose() {},
  };
  const view = render(h(TaskEditor, props));
  await screen.findByText('Пока нет комментариев');
  fireEvent.change(screen.getByLabelText('Название задачи'), {
    target: { value: 'My local edit' },
  });
  view.rerender(
    h(TaskEditor, {
      ...props,
      tasks: [{ ...original, revision: 2, title: 'Changed by colleague' }],
    }),
  );
  assert.equal(screen.getByLabelText('Название задачи').value, 'My local edit');
  assert.equal(screen.getByRole('button', { name: 'Сохранить' }).disabled, true);
  fireEvent.click(screen.getByRole('button', { name: 'Загрузить новую версию' }));
  assert.equal(screen.getByLabelText('Название задачи').value, 'Changed by colleague');
  assert.equal(screen.getByRole('button', { name: 'Сохранить' }).disabled, true);
});

test('the shared dropdown supports keyboard selection, skips disabled options and never submits a form', async () => {
  const { Dropdown } = await import('../src/components/ui/dropdown.tsx');
  const changed = [];
  let submitted = 0;
  render(
    h(
      'form',
      {
        onSubmit: (e) => {
          e.preventDefault();
          submitted++;
        },
      },
      h(Dropdown, {
        'aria-label': 'Выбор статуса',
        value: 'todo',
        options: [
          { value: 'todo', label: 'К выполнению' },
          { value: 'blocked', label: 'Недоступно', disabled: true },
          { value: 'progress', label: 'В работе' },
        ],
        onValueChange: (value) => changed.push(value),
      }),
    ),
  );
  const trigger = screen.getByRole('combobox', { name: 'Выбор статуса' });
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  fireEvent.keyDown(trigger, { key: 'Enter' });
  assert.deepEqual(changed, ['progress']);
  assert.equal(submitted, 0);
  assert.equal(document.activeElement === trigger, true);
  assert.ok(screen.queryByRole('listbox') === null);
});

test('dropdown search filters long lists, supports empty results and Escape closes only the list', async () => {
  const { Dropdown } = await import('../src/components/ui/dropdown.tsx');
  const changed = [];
  let bubbled = 0;
  render(
    h(
      'div',
      { onKeyDown: () => bubbled++ },
      h(Dropdown, {
        'aria-label': 'Проект',
        value: '1',
        options: Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `Проект ${i}` })),
        onValueChange: (value) => changed.push(value),
      }),
    ),
  );
  const trigger = screen.getByRole('combobox', { name: 'Проект' });
  fireEvent.click(trigger);
  const search = screen.getByRole('searchbox', { name: 'Проект: поиск' });
  fireEvent.change(search, { target: { value: 'Проект 11' } });
  assert.equal(screen.getAllByRole('option').length, 1);
  fireEvent.keyDown(search, { key: 'Enter' });
  assert.deepEqual(changed, ['11']);
  assert.equal(bubbled, 0);
  fireEvent.click(trigger);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'No matches' } });
  assert.ok(screen.getByText('Ничего не найдено'));
  fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
  assert.ok(screen.queryByRole('listbox') === null);
  assert.equal(bubbled, 0);
});

test('dropdown respects inherited disabled fields, closes on outside clicks and keeps one list open', async () => {
  const { Dropdown } = await import('../src/components/ui/dropdown.tsx');
  const options = [
    { value: 'a', label: 'Первый' },
    { value: 'b', label: 'Второй' },
  ];
  render(
    h(
      'div',
      {},
      h(Dropdown, { 'aria-label': 'Первый список', value: 'a', options, onValueChange() {} }),
      h(Dropdown, { 'aria-label': 'Второй список', value: 'a', options, onValueChange() {} }),
      h(
        'fieldset',
        { disabled: true },
        h(Dropdown, {
          'aria-label': 'Заблокирован',
          value: 'a',
          options,
          onValueChange: () => {
            throw Error('Cannot change');
          },
        }),
      ),
    ),
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Заблокирован' }));
  assert.ok(screen.queryByRole('listbox') === null);
  fireEvent.click(screen.getByRole('combobox', { name: 'Первый список' }));
  fireEvent.pointerDown(screen.getByRole('combobox', { name: 'Второй список' }));
  fireEvent.click(screen.getByRole('combobox', { name: 'Второй список' }));
  assert.equal(screen.getAllByRole('listbox').length, 1);
  assert.equal(
    screen.getByRole('combobox', { name: 'Первый список' }).getAttribute('aria-expanded'),
    'false',
  );
  fireEvent.pointerDown(document.body);
  assert.ok(screen.queryByRole('listbox') === null);
});

test('typing in a workspace dropdown does not open the global task creation shortcut', async (context) => {
  mountWorkspace(context);
  await screen.findByRole('heading', { name: 'Все задачи' });
  const trigger = screen.getByRole('combobox', { name: 'Фильтр по статусу' });
  fireEvent.click(trigger);
  fireEvent.keyDown(trigger, { key: 'c' });
  assert.ok(screen.queryByRole('dialog') === null);
  assert.ok(screen.getByRole('listbox'));
});

test('profile saves account fields, displays the avatar and requires a password only when changing email', async (context) => {
  const { ProfilePanel } = await import(
    '../src/app/(workspace)/workspaces/[workspaceId]/settings/profile/_components/profile-panel.tsx'
  );
  const user = {
    ...session.user,
    bio: '',
    profileRevision: 3,
    avatarUrl: '/api/users/user/avatar?v=first',
  };
  const updated = [];
  const calls = [];
  mockApi(context, async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push([url, body]);
    return Response.json({
      ...user,
      name: body.name,
      email: body.email,
      bio: body.bio,
      profileRevision: body.revision + 1,
      avatarUrl: body.avatarData === null ? null : user.avatarUrl,
    });
  });
  render(h(ProfilePanel, { user, onUser: (user) => updated.push(user), onClose() {} }));
  assert.equal(document.querySelector('.profile-avatar img').getAttribute('src'), user.avatarUrl);
  fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Ivan Updated' } });
  fireEvent.change(screen.getByLabelText('О себе'), { target: { value: 'Developer' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить профиль' }));
  await screen.findByText('Профиль сохранён');
  assert.equal(updated[0].name, 'Ivan Updated');
  assert.equal(calls[0][1].revision, 3);
  assert.ok(!('currentPassword' in calls[0][1]) && !('avatarData' in calls[0][1]));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  assert.equal(screen.getByRole('button', { name: 'Сохранить профиль' }).disabled, true);
  fireEvent.change(screen.getByLabelText('Текущий пароль'), {
    target: { value: 'current-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Удалить аватарку' }));
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить профиль' }));
  await waitFor(() => assert.equal(updated.length, 2));
  assert.equal(calls[1][1].avatarData, null);
  assert.equal(calls[1][1].currentPassword, 'current-password');
});

test('profile upload prepares an avatar, previews it and sends it only on save', async (context) => {
  const { ProfilePanel } = await import(
    '../src/app/(workspace)/workspaces/[workspaceId]/settings/profile/_components/profile-panel.tsx'
  );
  const calls = [];
  let bitmapClosed = false;
  const bitmap = {
    width: 1200,
    height: 800,
    close: () => {
      bitmapClosed = true;
    },
  };
  context.mock.method(globalThis, 'createImageBitmap', async () => bitmap);
  context.mock.method(dom.window.HTMLCanvasElement.prototype, 'getContext', () => ({
    drawImage() {},
  }));
  context.mock.method(
    dom.window.HTMLCanvasElement.prototype,
    'toDataURL',
    () => 'data:image/webp;base64,cHJldmlldw==',
  );
  mockApi(context, async (url, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json({
      ...session.user,
      profileRevision: 1,
      avatarUrl: '/api/users/user/avatar?v=new',
    });
  });
  render(h(ProfilePanel, { user: session.user, onUser() {}, onClose() {} }));
  fireEvent.change(screen.getByLabelText('Файл аватарки'), {
    target: { files: [new dom.window.File(['png'], 'avatar.png', { type: 'image/png' })] },
  });
  await waitFor(() =>
    assert.equal(
      document.querySelector('.profile-avatar img')?.getAttribute('src'),
      'data:image/webp;base64,cHJldmlldw==',
    ),
  );
  assert.equal(calls.length, 0);
  assert.equal(bitmapClosed, true);
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить профиль' }));
  await screen.findByText('Профиль сохранён');
  assert.equal(calls[0].avatarData, 'data:image/webp;base64,cHJldmlldw==');
});

test('profile rejects unsupported files and protects unsaved fields when closed', async () => {
  const { ProfilePanel } = await import(
    '../src/app/(workspace)/workspaces/[workspaceId]/settings/profile/_components/profile-panel.tsx'
  );
  let closed = 0;
  render(h(ProfilePanel, { user: session.user, onUser() {}, onClose: () => closed++ }));
  fireEvent.change(screen.getByLabelText('Файл аватарки'), {
    target: { files: [new dom.window.File(['svg'], 'avatar.svg', { type: 'image/svg+xml' })] },
  });
  await screen.findByText('Выбери фото в формате PNG, JPEG или WebP.');
  fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Unsaved' } });
  fireEvent.click(
    within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Закрыть', exact: true })[0],
  );
  assert.equal(closed, 0);
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить редактирование' }));
  assert.equal(screen.getByLabelText('Имя').value, 'Unsaved');
});

test('profile opens from the header and saved identity updates the workspace account controls', async (context) => {
  let user = { ...session.user, bio: '', profileRevision: 0 };
  mockApi(context, async (url, options) => {
    if (url === '/api/auth/profile') {
      const body = JSON.parse(options.body);
      user = { ...user, name: body.name, bio: body.bio, profileRevision: 1 };
      return Response.json(user);
    }
    return Response.json([]);
  });
  render(
    h(WorkspaceApp, {
      session,
      space,
      snapshot: { revision: 0, data: { version: 1, projects: [project], tasks: [], notes: [] } },
    }),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Открыть профиль' }));
  fireEvent.change(await screen.findByLabelText('Имя'), { target: { value: 'New name' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить профиль' }));
  await screen.findByText('Профиль сохранён');
  assert.match(screen.getByRole('button', { name: 'Мой профиль' }).textContent, /New name/);
  assert.match(
    screen.getByRole('button', { name: 'Открыть профиль' }).getAttribute('title'),
    /New name/,
  );
});

test('server-provided workspace data renders immediately and navigation exposes real URLs', async (context) => {
  const requests = [];
  const navigations = [];
  mockApi(context, async (url) => {
    requests.push(url);
    return Response.json([]);
  });
  render(
    h(WorkspaceApp, {
      session,
      space,
      snapshot: {
        revision: 4,
        data: { version: 1, projects: [project], tasks: [task], notes: [] },
      },
      onPush: (href) => navigations.push(href),
    }),
  );
  assert.ok(screen.getByText(task.title));
  assert.equal(
    screen.getByRole('link', { name: /Сегодня/ }).getAttribute('href'),
    '/workspaces/space/today',
  );
  assert.equal(
    screen.getByRole('tab', { name: 'Список' }).getAttribute('href'),
    '/workspaces/space/list',
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Список' }));
  assert.deepEqual(navigations, ['/workspaces/space/list']);
  await screen.findByRole('tab', { name: 'Список', selected: true });
  assert.ok(!requests.some((url) => url.endsWith('/data') || url.endsWith('/members')));
});

test('dirty page editors register a navigation guard and prevent accidental reloads', async () => {
  const { RouteDraftContext } = await import('../src/lib/navigation-guard.tsx');
  const { ProfilePanel } = await import(
    '../src/app/(workspace)/workspaces/[workspaceId]/settings/profile/_components/profile-panel.tsx'
  );
  const active = new Set();
  const register = (id) => {
    active.add(id);
    return () => active.delete(id);
  };
  render(
    h(
      RouteDraftContext.Provider,
      { value: register },
      h(ProfilePanel, { inline: true, user: session.user, onUser: () => {}, onClose: () => {} }),
    ),
  );
  assert.equal(screen.queryByRole('dialog'), null);
  assert.equal(active.size, 0);
  fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Draft' } });
  assert.equal(active.size, 1);
  const unload = new dom.window.Event('beforeunload', { cancelable: true });
  window.dispatchEvent(unload);
  assert.equal(unload.defaultPrevented, true);
  fireEvent.change(screen.getByLabelText('Имя'), { target: { value: session.user.name } });
  assert.equal(active.size, 0);
});

test('an intercepted task keeps the project and filters behind it and guards drafts', async (context) => {
  mockApi(context, async () => Response.json([]));
  const pushes = [];
  render(
    h(WorkspaceApp, {
      session,
      space,
      snapshot: {
        revision: 1,
        data: { version: 1, projects: [project], tasks: [task], notes: [] },
      },
      path: '/workspaces/space/projects/project/board?q=board',
      onPush: (href) => pushes.push(href),
    }),
  );
  assert.ok(screen.getByRole('heading', { name: project.name }));
  fireEvent.click(screen.getByText(task.title).closest('a'));
  assert.deepEqual(pushes, ['/workspaces/space/tasks/task-1234']);
  const drawer = await screen.findByRole('dialog');
  assert.ok(drawer.classList.contains('modal-drawer'));
  assert.ok(screen.getByRole('heading', { name: project.name }));
  assert.equal(screen.getByRole('searchbox', { name: 'Поиск задач и страниц' }).value, 'board');
  const confirm = context.mock.method(window, 'confirm', () => false);
  fireEvent.change(within(drawer).getByLabelText('Название задачи'), {
    target: { value: 'Unsaved title' },
  });
  fireEvent.click(screen.getByRole('link', { name: /Все задачи/ }));
  assert.equal(pushes.length, 1);
  assert.equal(confirm.mock.callCount(), 1);
  confirm.mock.mockImplementation(() => true);
  fireEvent.click(screen.getByRole('link', { name: /Все задачи/ }));
  assert.deepEqual(pushes.at(-1), '/workspaces/space/board');
});
