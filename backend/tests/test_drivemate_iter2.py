"""DriveMate iteration 2 tests: vehicles, reminders, stats fleet fields."""
import os
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://drivemate-school.preview.emergentagent.com").rstrip("/")
SESSION_TOKEN = "test_drivemate_token_2026"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"})
    return s


# ---------- Vehicles ----------
class TestVehicles:
    def test_list_vehicles_seeded(self, client):
        r = client.get(f"{BASE_URL}/api/vehicles")
        assert r.status_code == 200, r.text
        vehicles = r.json()
        assert isinstance(vehicles, list)
        assert len(vehicles) >= 3, f"Expected >=3 seeded vehicles, got {len(vehicles)}"
        v0 = vehicles[0]
        for k in ("id", "name", "make_model", "license_plate", "license_class",
                  "service_interval_hours", "hours_since_service", "total_hours", "status"):
            assert k in v0, f"missing key {k}"
        pytest.vehicles = vehicles

    def test_fleet03_service_due(self, client):
        r = client.get(f"{BASE_URL}/api/vehicles")
        v_by_name = {v["name"]: v for v in r.json()}
        assert "Fleet-03" in v_by_name, f"Fleet-03 not in {list(v_by_name)}"
        f3 = v_by_name["Fleet-03"]
        assert f3["hours_since_service"] >= f3["service_interval_hours"], \
            f"Fleet-03 hours {f3['hours_since_service']} vs interval {f3['service_interval_hours']}"
        assert f3["status"] == "Service Due", f"expected Service Due, got {f3['status']}"

    def test_create_update_service_delete_vehicle(self, client):
        payload = {"name": "TEST_Fleet", "make_model": "TEST Car", "license_plate": "TST 001",
                   "license_class": "Code 8", "service_interval_hours": 100, "color": "#123456"}
        r = client.post(f"{BASE_URL}/api/vehicles", json=payload)
        assert r.status_code == 200, r.text
        v = r.json()
        vid = v["id"]
        assert v["name"] == "TEST_Fleet"
        assert v["status"] == "Active"
        assert v["hours_since_service"] == 0

        # PATCH (only fields exposed on VehicleUpdate)
        u = client.patch(f"{BASE_URL}/api/vehicles/{vid}", json={"color": "#abcdef", "notes": "TEST notes"})
        assert u.status_code == 200
        assert u.json()["color"] == "#abcdef"
        assert u.json()["notes"] == "TEST notes"

        # Simulate service usage by completing a linked slot (side-effect increases hours)
        slot_r = client.post(f"{BASE_URL}/api/slots", json={
            "date": "2026-04-15", "time": "10:00", "vehicle": "TEST", "vehicle_id": vid,
            "status": "Booked", "student_name": "TEST_x", "student_email": "test_x@x.com"})
        sid = slot_r.json()["id"]
        client.patch(f"{BASE_URL}/api/slots/{sid}", json={"status": "Completed"})
        vv = client.get(f"{BASE_URL}/api/vehicles").json()
        vv0 = next(x for x in vv if x["id"] == vid)
        assert vv0["hours_since_service"] >= 1.0
        client.delete(f"{BASE_URL}/api/slots/{sid}")

        # Mark serviced -> resets
        s = client.post(f"{BASE_URL}/api/vehicles/{vid}/service")
        assert s.status_code == 200
        sd = s.json()
        assert sd["hours_since_service"] == 0
        assert sd["status"] == "Active"

        # DELETE (admin allowed)
        d = client.delete(f"{BASE_URL}/api/vehicles/{vid}")
        assert d.status_code == 200


# ---------- Slot -> vehicle side effects ----------
class TestSlotCompletionSideEffect:
    def test_completing_slot_increments_vehicle_hours(self, client):
        vehicles = client.get(f"{BASE_URL}/api/vehicles").json()
        # pick an Active vehicle
        veh = next((v for v in vehicles if v["status"] == "Active"), vehicles[0])
        vid = veh["id"]
        before_total = float(veh["total_hours"])
        before_since = float(veh["hours_since_service"])

        # create a booked slot for that vehicle
        payload = {"date": "2026-04-01", "time": "10:00",
                   "vehicle": f"{veh['make_model']} - {veh['license_plate']}",
                   "vehicle_id": vid, "status": "Booked",
                   "student_name": "TEST_Complete", "student_email": "test_complete@x.com"}
        r = client.post(f"{BASE_URL}/api/slots", json=payload)
        assert r.status_code == 200, r.text
        sid = r.json()["id"]

        # complete it
        u = client.patch(f"{BASE_URL}/api/slots/{sid}", json={"status": "Completed"})
        assert u.status_code == 200

        after = client.get(f"{BASE_URL}/api/vehicles").json()
        after_v = next(v for v in after if v["id"] == vid)
        assert abs(float(after_v["total_hours"]) - (before_total + 1.0)) < 0.001
        assert abs(float(after_v["hours_since_service"]) - (before_since + 1.0)) < 0.001

        # cleanup
        client.delete(f"{BASE_URL}/api/slots/{sid}")


# ---------- Reminders ----------
class TestReminders:
    def test_send_reminder_on_booked(self, client):
        # find a Booked slot with email OR create one
        slots = client.get(f"{BASE_URL}/api/slots").json()
        booked = next((s for s in slots if s["status"] == "Booked" and s.get("student_email")), None)
        if not booked:
            r = client.post(f"{BASE_URL}/api/slots", json={
                "date": "2026-05-01", "time": "09:00", "vehicle": "TEST_veh",
                "status": "Booked", "student_name": "TEST_reminder",
                "student_email": "test_reminder@x.com"})
            assert r.status_code == 200
            booked = r.json()

        # reset reminder_sent_at so we can test send
        client.patch(f"{BASE_URL}/api/slots/{booked['id']}", json={"reminder_sent_at": None})

        r = client.post(f"{BASE_URL}/api/slots/{booked['id']}/send-reminder")
        # 200 or 502 (proxy) both acceptable per instructions
        assert r.status_code in (200, 502), r.text
        if r.status_code == 200:
            data = r.json()
            assert "sent_to" in data and data["sent_to"]
            assert "sent_at" in data and data["sent_at"]

    def test_send_reminder_on_available_400(self, client):
        # create Available slot
        r = client.post(f"{BASE_URL}/api/slots", json={
            "date": "2026-05-02", "time": "09:00", "vehicle": "TEST_veh_av",
            "status": "Available"})
        assert r.status_code == 200
        sid = r.json()["id"]
        rr = client.post(f"{BASE_URL}/api/slots/{sid}/send-reminder")
        assert rr.status_code == 400, rr.text
        client.delete(f"{BASE_URL}/api/slots/{sid}")

    def test_send_reminder_on_completed_400(self, client):
        r = client.post(f"{BASE_URL}/api/slots", json={
            "date": "2026-05-03", "time": "09:00", "vehicle": "TEST_veh_c",
            "status": "Completed"})
        assert r.status_code == 200
        sid = r.json()["id"]
        rr = client.post(f"{BASE_URL}/api/slots/{sid}/send-reminder")
        assert rr.status_code == 400
        client.delete(f"{BASE_URL}/api/slots/{sid}")

    def test_run_reminders_returns_sent_skipped(self, client):
        r = client.post(f"{BASE_URL}/api/slots/run-reminders")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "sent" in data and "skipped" in data
        assert isinstance(data["sent"], int)
        assert isinstance(data["skipped"], int)


# ---------- Stats ----------
class TestStats:
    def test_stats_has_fleet_fields(self, client):
        r = client.get(f"{BASE_URL}/api/instructor/stats")
        assert r.status_code == 200
        d = r.json()
        assert "fleet_count" in d
        assert "fleet_service_due" in d
        assert d["fleet_count"] >= 3
        assert d["fleet_service_due"] >= 1
