"""DriveMate iteration 3 tests: student booking, admin user manager, analytics, payments, messaging."""
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

ADMIN_TOKEN = "test_drivemate_token_2026"
STUDENT_TOKEN = "test_student_token_2026"
STUDENT_USER_ID = "test-student-drivemate"
STUDENT_EMAIL = "teststudent@drivemate.test"


def _sess(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin():
    return _sess(ADMIN_TOKEN)


@pytest.fixture(scope="module")
def student():
    return _sess(STUDENT_TOKEN)


@pytest.fixture(scope="module")
def vehicle_id(admin):
    r = admin.get(f"{BASE_URL}/api/vehicles")
    assert r.status_code == 200
    return r.json()[0]["id"]


# ---------- Student Booking / Double-Booking Prevention ----------
class TestBooking:
    def test_create_slot_duplicate_conflict_409(self, admin, vehicle_id):
        payload = {
            "date": "2026-06-01", "time": "08:00",
            "vehicle": "TEST_veh", "vehicle_id": vehicle_id, "status": "Available",
        }
        r1 = admin.post(f"{BASE_URL}/api/slots", json=payload)
        assert r1.status_code == 200, r1.text
        sid = r1.json()["id"]
        pytest._iter3_slot_a = sid
        r2 = admin.post(f"{BASE_URL}/api/slots", json=payload)
        assert r2.status_code == 409, r2.text

    def test_student_books_available_slot(self, admin, student, vehicle_id):
        # Fresh available slot
        payload = {
            "date": "2026-06-02", "time": "09:00",
            "vehicle": "TEST_veh_book", "vehicle_id": vehicle_id, "status": "Available",
        }
        cr = admin.post(f"{BASE_URL}/api/slots", json=payload)
        assert cr.status_code == 200, cr.text
        sid = cr.json()["id"]
        pytest._iter3_slot_book = sid

        br = student.post(f"{BASE_URL}/api/slots/{sid}/book")
        assert br.status_code == 200, br.text
        d = br.json()
        assert d["status"] == "Booked"
        assert d["student_id"] == STUDENT_USER_ID
        assert d["student_email"] == STUDENT_EMAIL

        # Second book on same slot -> 409
        br2 = student.post(f"{BASE_URL}/api/slots/{sid}/book")
        assert br2.status_code == 409, br2.text

    def test_double_time_conflict_for_second_student(self, admin, student, vehicle_id):
        # Student is already booked at 2026-06-02 09:00 in previous test.
        # Create another Available slot at same date+time (different vehicle)
        # Need a second vehicle id
        vs = admin.get(f"{BASE_URL}/api/vehicles").json()
        vid2 = next((v["id"] for v in vs if v["id"] != vehicle_id), None) or vehicle_id
        # If only one vehicle, use time 09:00 with different vehicle_id (still respects unique triple)
        payload = {
            "date": "2026-06-02", "time": "09:00",
            "vehicle": "TEST_veh_conflict", "vehicle_id": vid2, "status": "Available",
        }
        cr = admin.post(f"{BASE_URL}/api/slots", json=payload)
        assert cr.status_code == 200, cr.text
        sid_c = cr.json()["id"]
        pytest._iter3_slot_conflict = sid_c

        # Same student attempts to book -> 409 (already booked at that date+time)
        r = student.post(f"{BASE_URL}/api/slots/{sid_c}/book")
        assert r.status_code == 409, r.text

    def test_my_lessons_returns_only_own(self, student):
        r = student.get(f"{BASE_URL}/api/my/lessons")
        assert r.status_code == 200
        lessons = r.json()
        assert isinstance(lessons, list)
        assert len(lessons) >= 1
        for l in lessons:
            assert l.get("student_id") == STUDENT_USER_ID or l.get("student_email") == STUDENT_EMAIL

    def test_cancel_by_owning_student(self, student):
        sid = pytest._iter3_slot_book
        r = student.post(f"{BASE_URL}/api/slots/{sid}/cancel")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "Available"
        assert not d.get("student_id")
        assert d.get("student_email") in ("", None)

    def test_cleanup_booking_slots(self, admin):
        for name in ("_iter3_slot_a", "_iter3_slot_book", "_iter3_slot_conflict"):
            sid = getattr(pytest, name, None)
            if sid:
                admin.delete(f"{BASE_URL}/api/slots/{sid}")


# ---------- Admin User Manager ----------
class TestUserManager:
    def test_list_users_admin(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list) and len(users) >= 2
        assert any(u["email"] == "lesegoryan36@gmail.com" for u in users)

    def test_list_users_forbidden_for_student(self, student):
        r = student.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 403

    def test_promote_demote_role(self, admin):
        # Toggle test-student between student and instructor
        r = admin.patch(f"{BASE_URL}/api/admin/users/{STUDENT_USER_ID}", json={"role": "instructor"})
        assert r.status_code == 200
        assert r.json()["role"] == "instructor"
        r2 = admin.patch(f"{BASE_URL}/api/admin/users/{STUDENT_USER_ID}", json={"role": "student"})
        assert r2.status_code == 200
        assert r2.json()["role"] == "student"

    def test_admin_cannot_demote_self(self, admin):
        me = admin.get(f"{BASE_URL}/api/auth/me").json()
        r = admin.patch(f"{BASE_URL}/api/admin/users/{me['user_id']}", json={"role": "instructor"})
        assert r.status_code == 400, r.text

    def test_admin_cannot_delete_self(self, admin):
        me = admin.get(f"{BASE_URL}/api/auth/me").json()
        r = admin.delete(f"{BASE_URL}/api/admin/users/{me['user_id']}")
        assert r.status_code == 400, r.text

    def test_admin_delete_user_ok(self, admin):
        # Create disposable user
        uid = f"TEST_user_{uuid.uuid4().hex[:8]}"
        # Insert via mongo would be needed; use requests? there's no admin create endpoint.
        # Skip actual delete of a real user; just verify endpoint responds 200 for non-existent id (idempotent behavior).
        r = admin.delete(f"{BASE_URL}/api/admin/users/{uid}")
        assert r.status_code == 200


# ---------- Analytics ----------
class TestAnalytics:
    def test_analytics_shape(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/analytics")
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("users", "slots", "revenue", "fleet"):
            assert k in d, f"missing {k}"
        assert set(["total", "students", "instructors", "admins"]).issubset(d["users"].keys())
        assert set(["total", "booked", "completed", "available"]).issubset(d["slots"].keys())
        assert set(["total", "currency", "transactions"]).issubset(d["revenue"].keys())
        assert set(["total", "service_due"]).issubset(d["fleet"].keys())

    def test_analytics_forbidden_for_student(self, student):
        r = student.get(f"{BASE_URL}/api/admin/analytics")
        assert r.status_code == 403


# ---------- Payments ----------
class TestPayments:
    def test_packages_lists_4(self, admin):
        r = admin.get(f"{BASE_URL}/api/payments/packages")
        assert r.status_code == 200
        d = r.json()
        assert set(d.keys()) == {"single", "starter", "pro", "full"}
        for k, v in d.items():
            assert "amount" in v and "lessons" in v and v["id"] == k

    def test_checkout_creates_session_and_row(self, student):
        r = student.post(f"{BASE_URL}/api/payments/checkout",
                         json={"package_id": "pro", "origin_url": "https://drivemate.example.com"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "checkout_url" in d and "session_id" in d
        assert "stripe.com" in d["checkout_url"] or "checkout.stripe" in d["checkout_url"], \
            f"Expected Stripe URL, got {d['checkout_url']}"
        pytest._iter3_session_id = d["session_id"]

        # Status is pending initially
        s = student.get(f"{BASE_URL}/api/payments/status/{d['session_id']}")
        assert s.status_code == 200
        assert s.json()["payment_status"] in ("pending", "unpaid", "initiated")

    def test_my_payments_lists_transaction(self, student):
        r = student.get(f"{BASE_URL}/api/payments/my")
        assert r.status_code == 200
        rows = r.json()
        assert any(row.get("session_id") == pytest._iter3_session_id for row in rows)

    def test_admin_payments_lists_all(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/payments")
        assert r.status_code == 200
        rows = r.json()
        assert any(row.get("session_id") == pytest._iter3_session_id for row in rows)

    def test_admin_payments_forbidden_for_student(self, student):
        r = student.get(f"{BASE_URL}/api/admin/payments")
        assert r.status_code == 403


# ---------- Messaging ----------
class TestMessaging:
    def test_directory_student_sees_only_instructors_admins(self, student):
        r = student.get(f"{BASE_URL}/api/users/directory")
        assert r.status_code == 200
        dirs = r.json()
        assert dirs, "directory should not be empty for student"
        for u in dirs:
            assert u["role"] in ("instructor", "admin")

    def test_directory_admin_sees_all_except_self(self, admin):
        me = admin.get(f"{BASE_URL}/api/auth/me").json()
        r = admin.get(f"{BASE_URL}/api/users/directory")
        assert r.status_code == 200
        dirs = r.json()
        assert all(u["user_id"] != me["user_id"] for u in dirs)

    def test_send_and_read_thread(self, student, admin):
        me_admin = admin.get(f"{BASE_URL}/api/auth/me").json()
        admin_id = me_admin["user_id"]

        body_a = f"TEST_msg_{uuid.uuid4().hex[:6]} hello admin"
        r = student.post(f"{BASE_URL}/api/messages", json={"to_user_id": admin_id, "body": body_a})
        assert r.status_code == 200, r.text
        assert r.json()["body"] == body_a

        body_b = f"TEST_msg_{uuid.uuid4().hex[:6]} reply from admin"
        r2 = admin.post(f"{BASE_URL}/api/messages", json={"to_user_id": STUDENT_USER_ID, "body": body_b})
        assert r2.status_code == 200

        # Thread listing for student
        t = student.get(f"{BASE_URL}/api/messages/threads")
        assert t.status_code == 200
        threads = t.json()
        assert any(th["peer_id"] == admin_id for th in threads)

        # Ordered messages
        m = student.get(f"{BASE_URL}/api/messages/with/{admin_id}")
        assert m.status_code == 200
        msgs = m.json()
        bodies = [x["body"] for x in msgs]
        assert body_a in bodies and body_b in bodies
        # Ordered ascending by created_at
        created_ats = [x["created_at"] for x in msgs]
        assert created_ats == sorted(created_ats), "messages must be sorted by created_at asc"
