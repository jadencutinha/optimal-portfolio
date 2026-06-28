from fastapi.testclient import TestClient

from app.api.deps import get_access, get_current_user
from app.auth.gating import Access
from app.auth.plans import entitlements_for
from app.auth.repository import ProfileData
from app.education.content import COURSES


def as_user(client: TestClient, uid: str) -> None:
    client.app.dependency_overrides[get_current_user] = lambda: ProfileData(
        id=uid, email=None, plan="course", plan_selected=True
    )
    client.app.dependency_overrides[get_access] = lambda: Access(
        plan="course", user_id=uid, entitlements=entitlements_for("course")
    )


def clear(client: TestClient) -> None:
    client.app.dependency_overrides.pop(get_current_user, None)
    client.app.dependency_overrides.pop(get_access, None)


def test_list_courses_is_public() -> None:
    pass


def test_catalog_and_detail(client: TestClient) -> None:
    response = client.get("/api/courses")
    assert response.status_code == 200
    assert len(response.json()) == 3

    course_id = COURSES[0]["id"]
    detail = client.get(f"/api/courses/{course_id}").json()
    assert len(detail["topics"]) > 0
    assert "answer" not in detail["topics"][0]["quiz"]


def test_enroll_answer_and_progress(client: TestClient) -> None:
    as_user(client, "u-enroll")
    try:
        course = COURSES[0]
        cid = course["id"]
        topic = course["topics"][0]

        enroll = client.post(f"/api/courses/{cid}/enroll")
        assert enroll.status_code == 200
        assert enroll.json()["enrolled"] is True

        correct = topic["quiz"]["answer"]
        right = client.post(f"/api/courses/{cid}/topics/{topic['id']}/answer", json={"choice": correct})
        assert right.status_code == 200
        assert right.json()["correct"] is True

        second = course["topics"][1]
        wrong = (second["quiz"]["answer"] + 1) % len(second["quiz"]["options"])
        miss = client.post(f"/api/courses/{cid}/topics/{second['id']}/answer", json={"choice": wrong})
        assert miss.json()["correct"] is False

        progress = client.get(f"/api/courses/{cid}/progress").json()
        assert progress["enrolled"] is True
        assert topic["id"] in progress["completed_topics"]
        assert progress["complete"] is False
    finally:
        clear(client)


def test_exam_pass_issues_certificate_and_marks_complete(client: TestClient) -> None:
    as_user(client, "u-pass")
    try:
        course = COURSES[1]
        cid = course["id"]
        answers = {question["id"]: question["answer"] for question in course["final_exam"]}
        result = client.post(f"/api/courses/{cid}/exam", json={"answers": answers})
        assert result.status_code == 200, result.text
        body = result.json()
        assert body["passed"] is True
        assert body["percent"] == 1.0
        assert body["credential_id"]

        catalog = client.get("/api/courses").json()
        completed = next(item for item in catalog if item["id"] == cid)
        assert completed["completed"] is True
    finally:
        clear(client)


def test_exam_fail_issues_no_certificate(client: TestClient) -> None:
    as_user(client, "u-fail")
    try:
        course = COURSES[2]
        result = client.post(f"/api/courses/{course['id']}/exam", json={"answers": {}})
        assert result.status_code == 200
        body = result.json()
        assert body["passed"] is False
        assert body["credential_id"] is None
    finally:
        clear(client)


def test_unknown_course_returns_404(client: TestClient) -> None:
    assert client.get("/api/courses/nope").status_code == 404
