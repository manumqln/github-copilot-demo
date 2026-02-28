import copy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src.app import app
import src.app as app_module

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    # Arrange: snapshot the in-memory activities before a test
    original = copy.deepcopy(app_module.activities)
    yield
    # Teardown: restore the original activities after the test
    app_module.activities = copy.deepcopy(original)


def test_get_activities():
    # Arrange: (reset handled by fixture)
    # Act:
    resp = client.get("/activities")
    # Assert:
    assert resp.status_code == 200
    data = resp.json()
    assert "Chess Club" in data
    assert isinstance(data, dict)


def test_signup_success():
    # Arrange:
    activity = "Chess Club"
    email = "newstudent@mergington.edu"
    assert email not in app_module.activities[activity]["participants"]
    path = f"/activities/{quote(activity)}/signup"
    # Act:
    resp = client.post(path, params={"email": email})
    # Assert:
    assert resp.status_code == 200
    assert email in app_module.activities[activity]["participants"]
    assert email in resp.json().get("message", "")


def test_signup_duplicate_error():
    # Arrange:
    activity = "Chess Club"
    existing = app_module.activities[activity]["participants"][0]
    path = f"/activities/{quote(activity)}/signup"
    # Act:
    resp = client.post(path, params={"email": existing})
    # Assert:
    assert resp.status_code == 400
    assert resp.json().get("detail") == "Student already signed up"


def test_delete_success():
    # Arrange:
    activity = "Basketball Team"
    email = "alex@mergington.edu"
    assert email in app_module.activities[activity]["participants"]
    path = f"/activities/{quote(activity)}/participants"
    # Act:
    resp = client.delete(path, params={"email": email})
    # Assert:
    assert resp.status_code == 200
    assert email not in app_module.activities[activity]["participants"]
    assert "Removed" in resp.json().get("message", "")


def test_delete_missing_error():
    # Arrange:
    activity = "Tennis Club"
    missing = "not-a-participant@mergington.edu"
    assert missing not in app_module.activities[activity]["participants"]
    path = f"/activities/{quote(activity)}/participants"
    # Act:
    resp = client.delete(path, params={"email": missing})
    # Assert:
    assert resp.status_code == 404
    assert resp.json().get("detail") == "Participant not found"
