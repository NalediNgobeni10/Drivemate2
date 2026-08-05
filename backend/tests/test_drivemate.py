"""DriveMate backend API tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://drivemate-school.preview.emergentagent.com").rstrip("/")
SESSION_TOKEN = "test_drivemate_token_2026"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def anon():
    return requests.Session()


# ---------- Auth ----------
class TestAuth:
    def test_me_unauthorized(self, anon):
        r = anon.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_authorized(self, client):
        r = client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == "testinstructor@drivemate.test"
        assert data["role"] == "admin"
        assert data["user_id"] == "test-user-drivemate"


# ---------- Students ----------
class TestStudents:
    def test_list_students(self, client):
        r = client.get(f"{BASE_URL}/api/students")
        assert r.status_code == 200
        students = r.json()
        assert isinstance(students, list)
        assert len(students) >= 5
        s0 = students[0]
        for k in ("student_name", "license_track", "progress", "rating", "lessons_completed", "total_lessons"):
            assert k in s0
        assert s0["license_track"] in ("Code 8", "Code 10")

    def test_create_student(self, client):
        payload = {"student_name": "TEST_Student", "email": "test@x.com", "license_track": "Code 10",
                   "progress": 10, "rating": 3.0, "lessons_completed": 2, "total_lessons": 20}
        r = client.post(f"{BASE_URL}/api/students", json=payload)
        assert r.status_code == 200, r.text
        s = r.json()
        assert s["student_name"] == "TEST_Student"
        assert s["license_track"] == "Code 10"
        assert "id" in s
        # Verify via GET
        g = client.get(f"{BASE_URL}/api/students/{s['id']}")
        assert g.status_code == 200
        assert g.json()["student_name"] == "TEST_Student"
        pytest.created_student_id = s["id"]


# ---------- Feedback ----------
class TestFeedback:
    def test_create_feedback_updates_rating(self, client):
        # Get a student
        students = client.get(f"{BASE_URL}/api/students").json()
        sid = students[0]["id"]
        r = client.post(f"{BASE_URL}/api/feedback", json={"student_id": sid, "rating": 5, "comment": "TEST_great"})
        assert r.status_code == 200, r.text
        fb = r.json()
        assert fb["rating"] == 5
        assert fb["comment"] == "TEST_great"
        # rating aggregated
        g = client.get(f"{BASE_URL}/api/students/{sid}")
        assert g.status_code == 200
        assert isinstance(g.json()["rating"], (int, float))


# ---------- Slots ----------
class TestSlots:
    def test_list_slots(self, client):
        r = client.get(f"{BASE_URL}/api/slots")
        assert r.status_code == 200
        slots = r.json()
        assert isinstance(slots, list)
        assert len(slots) >= 5
        s0 = slots[0]
        for k in ("date", "time", "vehicle", "status"):
            assert k in s0
        assert s0["status"] in ("Available", "Booked", "Completed")

    def test_slot_crud(self, client):
        payload = {"date": "2026-03-01", "time": "12:00", "vehicle": "TEST_Vehicle", "status": "Available"}
        r = client.post(f"{BASE_URL}/api/slots", json=payload)
        assert r.status_code == 200, r.text
        slot = r.json()
        sid = slot["id"]
        assert slot["vehicle"] == "TEST_Vehicle"

        # PATCH
        u = client.patch(f"{BASE_URL}/api/slots/{sid}", json={"status": "Booked", "student_name": "TEST_stu"})
        assert u.status_code == 200
        assert u.json()["status"] == "Booked"
        assert u.json()["student_name"] == "TEST_stu"

        # DELETE
        d = client.delete(f"{BASE_URL}/api/slots/{sid}")
        assert d.status_code == 200

        # Confirm gone via patch -> 404
        g = client.patch(f"{BASE_URL}/api/slots/{sid}", json={"status": "Available"})
        assert g.status_code == 404


# ---------- Instructor ----------
class TestInstructor:
    def test_stats(self, client):
        r = client.get(f"{BASE_URL}/api/instructor/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("rating", "total_hours", "total_students", "total_slots"):
            assert k in d
        assert d["total_students"] >= 5

    def test_update_me(self, client):
        payload = {"name": "Test Instructor Updated", "title": "Senior Instructor",
                   "phone": "+27 71 111 2222", "bio": "TEST bio"}
        r = client.patch(f"{BASE_URL}/api/me", json=payload)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["name"] == "Test Instructor Updated"
        assert u["title"] == "Senior Instructor"
        assert u["phone"] == "+27 71 111 2222"
        assert u["bio"] == "TEST bio"
        # verify via /auth/me
        me = client.get(f"{BASE_URL}/api/auth/me").json()
        assert me["bio"] == "TEST bio"
