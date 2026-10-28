import json

from fastapi.testclient import TestClient

from test_api import PROJECT, save
from test_issues import create, setup

NOTE = {"id": "note-1", "projectId": "project-1", "title": "Релиз", "body": "## План\nВыкатить в пятницу", "updatedAt": "2026-10-24T00:00:00Z"}


def rpc(bot, method, params=None, id=1):
    return bot.post('/api/mcp', json={"jsonrpc": "2.0", "id": id, "method": method, "params": params or {}})


def call(bot, name, **arguments):
    result = rpc(bot, 'tools/call', {"name": name, "arguments": arguments}).json()['result']
    return json.loads(result['content'][0]['text']) if not result.get('isError') else result


def token(client, space, scopes):
    return client.post('/api/api-tokens', json={'workspaceId': space['id'], 'name': 'Claude', 'scopes': scopes}).json()['token']


def test_mcp_handshake_and_auth(client):
    _, space = setup(client)
    with TestClient(client.app) as anonymous:
        assert rpc(anonymous, 'initialize').status_code == 401
    with TestClient(client.app, headers={'Authorization': 'Bearer ' + token(client, space, ['tasks:read'])}) as bot:
        result = rpc(bot, 'initialize', {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "test", "version": "1"}})
        assert result.status_code == 200, result.text
        assert result.json()['result']['protocolVersion'] == '2025-06-18'
        assert rpc(bot, 'initialize', {"protocolVersion": "1999-01-01"}).json()['result']['protocolVersion'] == '2025-11-25'
        assert bot.post('/api/mcp', json={"jsonrpc": "2.0", "method": "notifications/initialized"}).status_code == 202
        assert {tool['name'] for tool in rpc(bot, 'tools/list').json()['result']['tools']} == {'workspace_overview', 'list_tasks', 'get_task', 'list_pages', 'get_page'}
        assert rpc(bot, 'resources/list').json()['error']['code'] == -32601
        assert rpc(bot, 'tools/call', {"name": "delete_everything"}).json()['error']['code'] == -32602
        assert bot.get('/api/mcp').status_code == 405


def test_mcp_reads_tasks(client):
    user, space = setup(client)
    parent = create(client, space, title="Вход по email", priority="high", assigneeId=user['id']).json()
    create(client, space, title="Проверить письмо", parentId=parent['id'])
    client.post(f"/api/tasks/{parent['key']}/comments?workspaceId={space['id']}", json={"body": "Начал"})
    with TestClient(client.app, headers={'Authorization': 'Bearer ' + token(client, space, ['tasks:read'])}) as bot:
        overview = call(bot, 'workspace_overview')
        assert overview['members'] == [{'id': user['id'], 'name': 'Owner', 'role': 'owner'}]
        assert overview['projects'][0]['key'] == 'OM' and overview['projects'][0]['tasks'] == {'total': 2, 'open': 2}
        assert [t['key'] for t in call(bot, 'list_tasks', priority='high')['items']] == ['OM-1']
        assert call(bot, 'list_tasks', query='письм')['total'] == 1
        assert call(bot, 'list_tasks', stage='todo', projectId=PROJECT['id'])['total'] == 2
        assert call(bot, 'list_tasks', assigneeId=user['id'])['items'][0]['assigneeName'] == 'Owner'
        task = call(bot, 'get_task', ref='OM-1', includeHistory=True)
        assert [s['key'] for s in task['subtasks']] == ['OM-2']
        assert task['comments'][0]['body'] == 'Начал' and task['history']
        assert call(bot, 'get_task', ref='OM-99')['isError']
        assert call(bot, 'list_tasks', limit=1000)['isError']


def test_mcp_pages_need_their_scope(client):
    _, space = setup(client)
    assert save(client, space, revision=1, notes=[NOTE]).status_code == 200
    with TestClient(client.app, headers={'Authorization': 'Bearer ' + token(client, space, ['tasks:read'])}) as bot:
        assert call(bot, 'list_pages')['isError']
    with TestClient(client.app, headers={'Authorization': 'Bearer ' + token(client, space, ['notes:read'])}) as bot:
        assert call(bot, 'list_pages', query='пятниц') == [{'id': 'note-1', 'projectId': 'project-1', 'title': 'Релиз', 'updatedAt': NOTE['updatedAt'], 'length': len(NOTE['body'])}]
        assert call(bot, 'get_page', id='note-1')['body'] == NOTE['body']
        assert call(bot, 'get_page', id='missing')['isError']


def test_mcp_stops_after_revocation(client):
    _, space = setup(client)
    created = client.post('/api/api-tokens', json={'workspaceId': space['id'], 'name': 'Claude'}).json()
    with TestClient(client.app, headers={'Authorization': 'Bearer ' + created['token']}) as bot:
        assert rpc(bot, 'tools/list').status_code == 200
        client.request('DELETE', '/api/api-tokens/' + created['id'], json={})
        assert rpc(bot, 'tools/list').status_code == 401
