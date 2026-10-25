from conftest import register
from test_api import PROJECT, save
from test_issues import create, patch

COLUMNS = [
    {"id": "todo", "name": "К выполнению", "category": "todo"},
    {"id": "review", "name": "Ревью", "category": "progress"},
    {"id": "shipped", "name": "В сторе", "category": "done"},
]


def setup_columns(client):
    _, space = register(client)
    other = {**PROJECT, "id": "project-2", "name": "Site", "key": "SITE"}
    result = save(client, space, projects=[{**PROJECT, "key": "APP", "statuses": COLUMNS}, other])
    assert result.status_code == 200, result.text
    return space


def test_project_columns_validate_task_statuses(client):
    space = setup_columns(client)
    task = create(client, space).json()
    assert task["status"] == "todo"
    assert patch(client, space, task, status="progress").status_code == 422
    moved = patch(client, space, task, status="review")
    assert moved.status_code == 200, moved.text
    assert patch(client, space, moved.json(), status="shipped").status_code == 422
    done = patch(client, space, moved.json(), status="shipped", resolutionComment="Released")
    assert done.status_code == 200, done.text
    comments = client.get(f"/api/tasks/{task['key']}/comments?workspaceId={space['id']}").json()
    assert comments[-1]["kind"] == "resolution"


def test_columns_need_todo_and_done_and_unique_ids(client):
    _, space = register(client)
    without_done = [column for column in COLUMNS if column["category"] != "done"]
    assert save(client, space, projects=[{**PROJECT, "statuses": without_done}]).status_code == 422
    duplicated = [*COLUMNS, {**COLUMNS[0], "name": "Copy"}]
    assert save(client, space, projects=[{**PROJECT, "statuses": duplicated}]).status_code == 422


def test_new_tasks_use_the_columns_of_their_project(client):
    space = setup_columns(client)
    assert create(client, space, projectId="project-2").json()["status"] == "todo"
    assert create(client, space, projectId="project-2", status="progress").json()["status"] == "progress"
    assert create(client, space, projectId="project-2", status="review").status_code == 422
    assert create(client, space, status="review").json()["status"] == "review"


def test_removing_a_column_in_use_is_rejected(client):
    space = setup_columns(client)
    create(client, space, status="review")
    data = client.get(f"/api/workspaces/{space['id']}/data").json()
    project = {**data["data"]["projects"][0], "statuses": [COLUMNS[0], COLUMNS[2]]}
    result = save(client, space, revision=data["revision"], projects=[project])
    assert result.status_code == 422
