from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.database.migrations import migrate
from app.main import create_app
from app.core.security import digest, PASSWORDS
from app.database.mongo import now
from conftest import register
from test_api import PROJECT, TASK, save, invite


def setup(client):
    user, space = register(client)
    result = save(client, space, projects=[{**PROJECT, "key": "OM"}])
    assert result.status_code == 200, result.text
    return user, space


def create(client, space, **fields):
    return client.post('/api/tasks', json={"workspaceId": space['id'], "projectId": PROJECT['id'], "title": "Ship", **fields})


def patch(client, space, task, **fields):
    return client.patch(f"/api/tasks/{task['key']}?workspaceId={space['id']}", json={"revision": task['revision'], **fields})


def test_keys_survive_edits_deletion_and_import(client):
    _, space = setup(client)
    first = create(client, space).json()
    assert first['key'] == 'OM-1' and first['revision'] == 1
    result = patch(client, space, first, title='Changed')
    assert result.status_code == 200, result.text
    assert result.json()['key'] == first['key'] and result.json()['revision'] == 2
    assert patch(client, space, first, title='Stale').status_code == 409
    response = client.request('DELETE', f"/api/tasks/OM-1?workspaceId={space['id']}&revision=2", json={})
    assert response.status_code == 204, response.text
    second = create(client, space).json()
    assert second['key'] == 'OM-2'
    snapshot = client.get(f"/api/workspaces/{space['id']}/data").json()
    copied = {**first, 'id': 'forged', 'key': 'OM-1'}
    snapshot['data']['tasks'].append(copied)
    result = client.put(f"/api/workspaces/{space['id']}/data", json=snapshot)
    assert result.status_code == 409
    snapshot['data']['tasks'].pop()
    snapshot['data']['projects'][0]['key'] = 'NEW'
    assert client.put(f"/api/workspaces/{space['id']}/data", json=snapshot).status_code == 409


def test_atomic_completion_subtasks_comments_and_history(client, store):
    user, space = setup(client)
    parent = create(client, space, title='Parent').json()
    child = create(client, space, title='Child', parentId=parent['id']).json()
    assert patch(client, space, parent, status='done').status_code == 422
    assert patch(client, space, parent, status='done', resolutionComment='Done').status_code == 409
    assert patch(client, space, parent, parentId=child['id']).status_code == 422
    before = client.get(f"/api/workspaces/{space['id']}/data").json()
    assert client.request('DELETE', f"/api/tasks/{parent['key']}?workspaceId={space['id']}&revision=1", json={}).status_code == 422
    assert client.get(f"/api/workspaces/{space['id']}/data").json() == before
    result = patch(client, space, child, status='done', resolutionComment='**Tested** PR #52')
    assert result.status_code == 200, result.text
    result = patch(client, space, parent, status='done', resolutionComment='Integrated')
    assert result.status_code == 200, result.text
    comments = client.get(f"/api/tasks/{parent['key']}/comments?workspaceId={space['id']}").json()
    assert len(comments) == 1 and comments[0]['body'] == 'Integrated' and comments[0]['kind'] == 'resolution'
    assert comments[0]['authorId'] == user['id']
    history = client.get(f"/api/tasks/{parent['key']}/history?workspaceId={space['id']}").json()
    status = next(e for e in history if e['event'] == 'status_changed')
    assert status['actorId'] == user['id'] and status['changes']['status'] == {'from': 'todo', 'to': 'done'}
    assert 'resolutionComment' not in result.json()
    reopened = patch(client, space, result.json(), status='todo').json()
    assert patch(client, space, reopened, status='done').status_code == 422


def test_parallel_allocations_are_unique(client, store):
    user, space = setup(client)
    # Separate HTTP clients share the authenticated cookie but perform simultaneous requests.
    def operation(index):
        peer = TestClient(client.app, headers=dict(client.headers), cookies=dict(client.cookies))
        try:
            result = create(peer, space, title=f'Task {index}')
            assert result.status_code == 201, result.text
            return result.json()['key']
        finally:
            peer.close()
    with ThreadPoolExecutor(max_workers=4) as pool:
        keys = list(pool.map(operation, range(8)))
    assert set(keys) == {f'OM-{i}' for i in range(1, 9)}


def test_fields_and_server_owned_identity(client):
    user, space = setup(client)
    result = create(client, space, assigneeId=user['id'], type='bug', description='# Steps\n```py\nprint(1)\n```', links=[{'kind':'pr', 'url':'https://github.com/team/app/pull/52', 'label':'Fix'}])
    assert result.status_code == 201, result.text
    task = result.json()
    assert task['type'] == 'bug' and task['assigneeId'] == user['id'] and task['links'][0]['kind'] == 'pr'
    assert create(client, space, assigneeId='outsider').status_code == 422
    assert create(client, space, links=[{'url': 'javascript:alert(1)'}]).status_code == 422
    assert patch(client, space, task, title=None).status_code == 422
    assert patch(client, space, task, parentId='missing').status_code == 422
    snapshot = client.get(f"/api/workspaces/{space['id']}/data").json()
    # Board writes protect a task draft even after a newer global revision was loaded.
    task['revision'] = 0
    assert save(client, space, revision=snapshot['revision'], tasks=[task]).status_code == 409


def test_tokens_are_hashed_scoped_and_revocable(client, store):
    _, space = setup(client)
    other = client.post('/api/workspaces', json={'name':'Other'}).json()
    result = client.post('/api/api-tokens', json={'workspaceId':space['id'], 'name':'Bot', 'scopes':['tasks:write'], 'expiresInDays':30})
    assert result.status_code == 201, result.text
    token = result.json()
    assert token['token'].startswith('vsk_')
    stored = store.db.api_tokens.find_one({'_id':token['id']})
    assert stored['token_hash'] == digest(token['token']) and token['token'] not in str(stored)
    assert 'token' not in client.get('/api/api-tokens').json()[0]
    with TestClient(client.app) as bot:
        bot.headers['Authorization'] = 'Bearer ' + token['token']
        result = bot.post('/api/tasks', json={'projectId':PROJECT['id'], 'title':'Bot task'})
        assert result.status_code == 201, result.text
        assert result.json()['key'] == 'OM-1'
        assert bot.get('/api/projects').status_code == 200
        assert bot.get(f"/api/tasks?workspaceId={other['id']}").status_code == 404
        assert bot.get('/api/api-tokens').status_code == 401
        assert bot.post('/api/workspaces', json={'name':'Bad'}).status_code in (401,403)
        assert client.request('DELETE', '/api/api-tokens/' + token['id'], json={}).status_code == 204
        assert bot.get('/api/tasks').status_code == 401
    client.headers['Authorization'] = 'Bearer invalid'
    assert client.get('/api/tasks?workspaceId=' + space['id']).status_code == 401


def test_read_token_cannot_mutate_and_current_role_is_checked(client, store):
    user, space = setup(client)
    token = client.post('/api/api-tokens', json={'workspaceId':space['id'], 'name':'Readonly'}).json()['token']
    write = client.post('/api/api-tokens', json={'workspaceId':space['id'], 'name':'Write', 'scopes':['tasks:write']}).json()['token']
    with TestClient(client.app, headers={'Authorization':'Bearer ' + token}) as bot:
        assert bot.get('/api/tasks').status_code == 200
        assert bot.post('/api/tasks', json={'projectId':PROJECT['id'], 'title':'Bad'}).status_code == 403
    store.db.members.update_one({'workspace_id':space['id'], 'user_id':user['id']}, {'$set':{'role':'viewer'}})
    with TestClient(client.app, headers={'Authorization':'Bearer ' + write}) as bot:
        assert bot.post('/api/tasks', json={'projectId':PROJECT['id'], 'title':'Bad'}).status_code == 403
        store.db.members.delete_one({'workspace_id':space['id'], 'user_id':user['id']})
        assert bot.get('/api/tasks').status_code == 404


def test_notification_and_comment_permissions(client, store):
    owner, space = setup(client)
    task = create(client, space).json()
    _, raw = invite(client, space, 'editor@example.com')
    editor, _ = register(client, 'editor@example.com', 'Editor')
    assert client.post('/api/invitations/accept', json={'token':raw}).status_code == 200
    result = client.post(f"/api/tasks/{task['key']}/comments?workspaceId={space['id']}", json={'body':'Looks good'})
    assert result.status_code == 201 and result.json()['authorId'] == editor['id']
    assert client.post(f"/api/tasks/{task['key']}/comments?workspaceId={space['id']}", json={'body':'Forge', 'authorId':owner['id']}).status_code == 422
    from conftest import login
    login(client)
    notifications = client.get('/api/notifications').json()
    assert len(notifications) == 1 and notifications[0]['actorName'] == 'Editor'
    assert notifications[0]['workspaceId'] == space['id']
    assert client.patch(f"/api/notifications/{notifications[0]['id']}/read", json={}).status_code == 204
    assert client.get('/api/notifications').json()[0]['readAt']
    # Downgraded editor cannot post; outsiders cannot view discussion/history.
    store.db.members.update_one({'workspace_id':space['id'], 'user_id':editor['id']}, {'$set':{'role':'viewer'}})
    login(client, 'editor@example.com')
    assert client.post(f"/api/tasks/{task['key']}/comments?workspaceId={space['id']}", json={'body':'Denied'}).status_code == 403
    register(client, 'outsider@example.com')
    assert client.get(f"/api/tasks/{task['key']}/history?workspaceId={space['id']}").status_code == 404


def test_legacy_migration_is_idempotent_and_keeps_ids(client, store):
    _, space = register(client)
    ws = space['id']
    store.db.workspaces.update_one({'_id':ws}, {'$set':{'schema_version':1}})
    store.db.projects.insert_one({**PROJECT, '_id':f'{ws}:project-1', 'workspace_id':ws})
    store.db.tasks.insert_one({**TASK, 'status':'done', '_id':f'{ws}:task-1', 'workspace_id':ws})
    migrate(store)
    first = client.get(f'/api/workspaces/{ws}/data').json()
    migrate(store)
    assert client.get(f'/api/workspaces/{ws}/data').json() == first
    task = first['data']['tasks'][0]
    assert task['id'] == TASK['id'] and task['key'] == 'VERSTAK-1' and task['status'] == 'done'
    assert list(store.db.history.find({'workspace_id':ws})) == []
    assert list(store.db.comments.find({'workspace_id':ws})) == []


class Mailer:
    configured = True
    def __init__(self): self.messages = []
    def send_reset(self, email, url): self.messages.append((email, url))


def test_password_reset_is_one_use_and_revokes_sessions_tokens(store):
    mailer = Mailer()
    app = create_app(Settings(public_origin='http://testserver'), store, mailer)
    headers = {'X-Verstak-Client':'web', 'Origin':'http://testserver'}
    with TestClient(app, headers=headers) as client:
        user, space = register(client)
        token = client.post('/api/api-tokens', json={'workspaceId':space['id'], 'name':'Bot'}).json()['token']
        unknown = client.post('/api/auth/forgot-password', json={'email':'missing@example.com'})
        known = client.post('/api/auth/forgot-password', json={'email':user['email']})
        assert known.status_code == unknown.status_code == 202 and known.json() == unknown.json()
        assert len(mailer.messages) == 1
        raw = parse_qs(urlparse(mailer.messages[0][1]).fragment)['reset'][0]
        saved = store.db.password_resets.find_one({'token_hash':digest(raw)})
        assert saved and raw not in str(saved)
        password = 'a-new-password-123456'
        assert client.post('/api/auth/reset-password', json={'token':raw, 'password':password}).status_code == 204
        assert client.get('/api/auth/me').status_code == 401
        assert client.get('/api/tasks', headers={'Authorization':'Bearer ' + token}).status_code == 401
        assert client.post('/api/auth/reset-password', json={'token':raw, 'password':password}).status_code == 400
        assert PASSWORDS.verify(password, store.db.users.find_one({'_id':user['id']})['password_hash'])
        assert client.post('/api/auth/login', json={'email':user['email'], 'password':'correct-horse-battery'}).status_code == 401
        assert client.post('/api/auth/login', json={'email':user['email'], 'password':password}).status_code == 200


def test_reset_expiry_and_unconfigured_mail(client, store):
    user, space = register(client)
    for email in (user['email'], 'missing@example.com'):
        assert client.post('/api/auth/forgot-password', json={'email':email}).status_code == 503
    store.db.password_resets.insert_one({'_id':'expired', 'user_id':user['id'], 'token_hash':digest('x' * 40), 'expires_at':now() - timedelta(seconds=1)})
    assert client.post('/api/auth/reset-password', json={'token':'x' * 40, 'password':'another-password'}).status_code == 400
    assert client.get('/api/auth/me').status_code == 200


def test_expired_api_token_and_read_scope_cannot_write_comments(client, store):
    _, space = setup(client)
    task = create(client, space).json()
    token = client.post('/api/api-tokens', json={'workspaceId':space['id'], 'name':'Read'}).json()
    with TestClient(client.app, headers={'Authorization':'Bearer ' + token['token']}) as bot:
        assert bot.post(f"/api/tasks/{task['key']}/comments", json={'body':'No'}).status_code == 403
        store.db.api_tokens.update_one({'_id':token['id']}, {'$set':{'expires_at':now() - timedelta(seconds=1)}})
        assert bot.get('/api/tasks').status_code == 401


def test_smtp_failure_is_generic_and_does_not_leave_a_usable_reset(store):
    import smtplib
    class FailedMailer(Mailer):
        def send_reset(self, email, url): raise smtplib.SMTPException('test failure')
    with TestClient(create_app(Settings(public_origin='http://testserver'), store, FailedMailer()), headers={'X-Verstak-Client':'web'}) as client:
        register(client)
        result = client.post('/api/auth/forgot-password', json={'email':'owner@example.com'})
        assert result.status_code == 202
        assert list(store.db.password_resets.find({})) == []


def test_departed_assignee_does_not_block_unrelated_workspace_changes(client, store):
    from conftest import login
    owner, space = setup(client)
    _, raw = invite(client, space, 'editor@example.com')
    editor, _ = register(client, 'editor@example.com', 'Editor')
    assert client.post('/api/invitations/accept', json={'token':raw}).status_code == 200
    login(client)
    task = create(client, space, assigneeId=editor['id']).json()
    assert client.request('DELETE', f"/api/workspaces/{space['id']}/members/{editor['id']}", json={}).status_code == 204
    result = patch(client, space, task, title='Still editable')
    assert result.status_code == 200, result.text
    assert result.json()['assigneeId'] == editor['id']
    assert create(client, space, title='Another task').status_code == 201
    assert create(client, space, assigneeId=editor['id']).status_code == 422
