import base64
from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image
import pytest

from conftest import login, register
from test_api import invite


def update(client, user, **fields):
    return client.patch('/api/auth/profile', json={
        'revision': user.get('profileRevision', 0), 'name': user['name'], 'email': user['email'], 'bio': user.get('bio', ''), **fields,
    })


def image_data(format='PNG', size=(400, 200)):
    output = BytesIO()
    image = Image.new('RGB', size, '#0c66e4')
    image.save(output, format=format, comment=b'private metadata')
    mime = 'jpeg' if format == 'JPEG' else format.lower()
    return f'data:image/{mime};base64,' + base64.b64encode(output.getvalue()).decode()


def test_profile_persists_and_rejects_stale_or_forged_updates(client):
    user, _ = register(client)
    response = update(client, user, name='  Ivan Ralo  ', bio=' Product engineer ')
    assert response.status_code == 200, response.text
    current = response.json()
    assert current['name'] == 'Ivan Ralo' and current['bio'] == 'Product engineer' and current['profileRevision'] == 1
    assert client.get('/api/auth/me').json()['user'] == current
    assert 'password_hash' not in current
    assert update(client, user, name='Stale').status_code == 409
    assert update(client, current, user_id='other').status_code == 422
    assert update(client, current, name=' ').status_code == 422
    assert update(client, current, bio='x' * 501).status_code == 422
    assert update(client, current, email='invalid').status_code == 422


def test_email_change_needs_password_and_revokes_other_sessions(client, store):
    user, _ = register(client)
    assert update(client, user, email='new@example.com').status_code == 403
    assert update(client, user, email='new@example.com', currentPassword='wrong').status_code == 403
    with TestClient(client.app, headers={'X-Verstak-Client':'web'}) as other:
        login(other)
        response = update(client, user, email='NEW@example.com', currentPassword='correct-horse-battery')
        assert response.status_code == 200, response.text
        assert response.json()['email'] == 'new@example.com'
        assert client.get('/api/auth/me').status_code == 200
        assert other.get('/api/auth/me').status_code == 401
    assert client.post('/api/auth/login', json={'email':'owner@example.com', 'password':'correct-horse-battery'}).status_code == 401
    assert client.post('/api/auth/login', json={'email':'new@example.com', 'password':'correct-horse-battery'}).status_code == 200


def test_duplicate_email_rolls_back_name_avatar_and_revision(client):
    owner, _ = register(client)
    register(client, 'taken@example.com')
    login(client)
    response = update(client, owner, name='Must roll back', email='TAKEN@example.com', currentPassword='correct-horse-battery', avatarData=image_data())
    assert response.status_code == 409
    assert client.get('/api/auth/me').json()['user'] == owner
    assert client.get(f"/api/users/{owner['id']}/avatar").status_code == 404


@pytest.mark.parametrize('format', ['PNG', 'JPEG', 'WEBP'])
def test_avatar_is_normalized_private_and_removed(client, store, format):
    user, _ = register(client)
    response = update(client, user, avatarData=image_data(format))
    assert response.status_code == 200, response.text
    current = response.json()
    url = current['avatarUrl']
    assert url.startswith(f"/api/users/{user['id']}/avatar?v=")
    image_response = client.get(url)
    assert image_response.status_code == 200 and image_response.headers['content-type'] == 'image/webp'
    assert image_response.headers['x-content-type-options'] == 'nosniff'
    with Image.open(BytesIO(image_response.content)) as image:
        assert image.size == (256, 256) and image.format == 'WEBP'
        assert not image.getexif() and 'comment' not in image.info
    stored = store.db.users.find_one({'_id':user['id']})
    assert 'avatarData' not in stored and 'data' not in stored
    removed = update(client, current, avatarData=None)
    assert removed.status_code == 200 and removed.json()['avatarUrl'] is None
    assert client.get(url).status_code == 404


@pytest.mark.parametrize('payload', [
    'data:image/svg+xml;base64,' + base64.b64encode(b'<svg><script/></svg>').decode(),
    'data:image/png;base64,invalid!',
    'data:image/png;base64,' + base64.b64encode(b'not a raster').decode(),
    '',
])
def test_invalid_avatar_is_rejected_without_profile_changes(client, payload):
    user, _ = register(client)
    assert update(client, user, name='Should not persist', avatarData=payload).status_code == 422
    assert client.get('/api/auth/me').json()['user'] == user


def test_oversized_avatar_is_rejected(client):
    user, _ = register(client)
    assert update(client, user, avatarData='data:image/png;base64,' + 'x' * 2800001).status_code == 422
    assert update(client, user, avatarData=image_data(size=(4001, 4001))).status_code == 422


def test_avatar_access_requires_own_account_or_shared_workspace(client):
    owner, space = register(client)
    url = update(client, owner, avatarData=image_data()).json()['avatarUrl']
    _, token = invite(client, space, 'editor@example.com')
    editor, _ = register(client, 'editor@example.com')
    assert client.get(url).status_code == 404
    assert client.post('/api/invitations/accept', json={'token':token}).status_code == 200
    assert client.get(url).status_code == 200
    login(client)
    assert client.request('DELETE', f"/api/workspaces/{space['id']}/members/{editor['id']}", json={}).status_code == 204
    login(client, 'editor@example.com')
    assert client.get(url).status_code == 404
    client.post('/api/auth/logout', json={})
    assert client.get(url).status_code == 401


def test_profile_requires_cookie_csrf_and_does_not_modify_someone_else(client):
    user, space = register(client)
    del client.headers['X-CSRF-Token']
    assert update(client, user, name='Denied').status_code == 403
    login(client)
    token = client.post('/api/api-tokens', json={'workspaceId':space['id'], 'name':'Read'}).json()['token']
    assert update(client, user, name='Still owner').status_code == 200
    with TestClient(client.app, headers={'Authorization':'Bearer ' + token, 'X-Verstak-Client':'web'}) as bot:
        assert update(bot, user).status_code == 401
