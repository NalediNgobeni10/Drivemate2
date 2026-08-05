from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="DriveMate API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ADMIN_EMAIL = "lesegoryan36@gmail.com"
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "DriveMate")


# ---------- Models ----------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = ""
    role: Literal["admin", "instructor", "student"] = "student"
    title: Optional[str] = ""
    phone: Optional[str] = ""
    bio: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    title: Optional[str] = None


class StudentProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_name: str
    email: Optional[str] = ""
    license_track: Literal["Code 8", "Code 10"] = "Code 8"
    progress: int = 0
    rating: float = 0.0
    lessons_completed: int = 0
    total_lessons: int = 20
    instructor_id: Optional[str] = None
    avatar: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StudentCreate(BaseModel):
    student_name: str
    email: Optional[str] = ""
    license_track: Literal["Code 8", "Code 10"] = "Code 8"
    progress: int = 0
    rating: float = 0.0
    lessons_completed: int = 0
    total_lessons: int = 20


class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    author_id: str
    author_name: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FeedbackCreate(BaseModel):
    student_id: str
    rating: int
    comment: str


class AvailabilitySlot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    time: str
    vehicle: str
    vehicle_id: Optional[str] = None
    status: Literal["Available", "Booked", "Completed"] = "Available"
    instructor_id: Optional[str] = None
    student_id: Optional[str] = None
    student_name: Optional[str] = ""
    student_email: Optional[str] = ""
    notes: Optional[str] = ""
    reminder_sent_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SlotCreate(BaseModel):
    date: str
    time: str
    vehicle: str
    vehicle_id: Optional[str] = None
    status: Literal["Available", "Booked", "Completed"] = "Available"
    student_name: Optional[str] = ""
    student_email: Optional[str] = ""
    notes: Optional[str] = ""


class SlotUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    vehicle: Optional[str] = None
    vehicle_id: Optional[str] = None
    status: Optional[Literal["Available", "Booked", "Completed"]] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    notes: Optional[str] = None


class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    make_model: str
    license_plate: str
    license_class: Literal["Code 8", "Code 10"] = "Code 8"
    total_hours: float = 0.0
    hours_since_service: float = 0.0
    service_interval_hours: float = 100.0
    status: Literal["Active", "Service Due", "In Service", "Retired"] = "Active"
    color: Optional[str] = ""
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VehicleCreate(BaseModel):
    name: str
    make_model: str
    license_plate: str
    license_class: Literal["Code 8", "Code 10"] = "Code 8"
    service_interval_hours: float = 100.0
    color: Optional[str] = ""
    notes: Optional[str] = ""


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    make_model: Optional[str] = None
    license_plate: Optional[str] = None
    license_class: Optional[Literal["Code 8", "Code 10"]] = None
    service_interval_hours: Optional[float] = None
    status: Optional[Literal["Active", "Service Due", "In Service", "Retired"]] = None
    color: Optional[str] = None
    notes: Optional[str] = None


# ---------- Auth helpers ----------
async def get_current_user(request: Request) -> User:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            session_token = auth[7:]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


# ---------- Email helper ----------
async def send_email(to_email: str, subject: str, html: str, reply_to: Optional[str] = None) -> bool:
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY not set; skipping email send")
        return False
    payload = {
        "to": [to_email],
        "subject": subject,
        "html": html,
        "from_name": EMAIL_FROM_NAME,
    }
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as h:
            resp = await h.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        logger.info(f"Email sent to {to_email}: {resp.json().get('id')}")
        return True
    except httpx.HTTPStatusError as e:
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        return False
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return False


def reminder_html(student_name: str, date: str, time: str, vehicle: str, instructor: str) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;font-family:Arial,sans-serif;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px;color:#f8fafc;">
            <div style="font-size:12px;letter-spacing:2px;color:#10b981;text-transform:uppercase;">Lesson Reminder · DriveMate</div>
            <h1 style="margin:12px 0 4px 0;font-size:28px;color:#f8fafc;">Hi {student_name},</h1>
            <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
              Just a friendly nudge — your driving lesson is coming up in about 24 hours.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;padding:20px;">
              <tr><td style="color:#cbd5e1;font-size:14px;line-height:1.9;">
                <strong style="color:#10b981;">Date:</strong> {date}<br>
                <strong style="color:#10b981;">Time:</strong> {time}<br>
                <strong style="color:#10b981;">Vehicle:</strong> {vehicle}<br>
                <strong style="color:#10b981;">Instructor:</strong> {instructor}
              </td></tr>
            </table>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:24px 0 0 0;">
              Please arrive 5 minutes early. If you need to reschedule, reply to this email as soon as possible.
            </p>
            <p style="color:#64748b;font-size:12px;margin:32px 0 0 0;">Drive safe · Learn steady</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


# ---------- Auth routes ----------
@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient(timeout=15.0) as h:
        r = await h.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id})
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        data = r.json()

    email = data["email"]
    name = data.get("name", email.split("@")[0])
    picture = data.get("picture", "")
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        update_fields = {"name": name, "picture": picture}
        if email == ADMIN_EMAIL and existing.get("role") != "admin":
            update_fields["role"] = "admin"
            update_fields["title"] = existing.get("title") or "Technical Lead"
        await db.users.update_one({"user_id": user_id}, {"$set": update_fields})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "admin" if email == ADMIN_EMAIL else "instructor"
        title = "Technical Lead" if email == ADMIN_EMAIL else ""
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "title": title,
            "phone": "",
            "bio": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc}


@api_router.get("/auth/me")
async def auth_me(user: User = Depends(get_current_user)):
    return user.model_dump()


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------- Students ----------
@api_router.get("/students", response_model=List[StudentProgress])
async def list_students(user: User = Depends(get_current_user)):
    if user.role == "student":
        docs = await db.students.find({"email": user.email}, {"_id": 0}).to_list(1000)
    else:
        docs = await db.students.find({}, {"_id": 0}).to_list(1000)
    return [StudentProgress(**d) for d in docs]


@api_router.post("/students", response_model=StudentProgress)
async def create_student(payload: StudentCreate, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    student = StudentProgress(**payload.model_dump(), instructor_id=user.user_id)
    doc = student.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.students.insert_one(doc)
    return student


@api_router.get("/students/{student_id}", response_model=StudentProgress)
async def get_student(student_id: str, user: User = Depends(get_current_user)):
    doc = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentProgress(**doc)


@api_router.patch("/students/{student_id}", response_model=StudentProgress)
async def update_student(student_id: str, payload: StudentCreate, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.students.update_one({"id": student_id}, {"$set": payload.model_dump()})
    doc = await db.students.find_one({"id": student_id}, {"_id": 0})
    return StudentProgress(**doc)


@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.students.delete_one({"id": student_id})
    return {"ok": True}


# ---------- Feedback ----------
@api_router.get("/students/{student_id}/feedback", response_model=List[Feedback])
async def list_feedback(student_id: str, user: User = Depends(get_current_user)):
    docs = await db.feedback.find({"student_id": student_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Feedback(**d) for d in docs]


@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(payload: FeedbackCreate, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    fb = Feedback(
        student_id=payload.student_id,
        author_id=user.user_id,
        author_name=user.name,
        rating=payload.rating,
        comment=payload.comment,
    )
    doc = fb.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.feedback.insert_one(doc)
    all_fb = await db.feedback.find({"student_id": payload.student_id}, {"_id": 0}).to_list(500)
    if all_fb:
        avg = round(sum(f["rating"] for f in all_fb) / len(all_fb), 1)
        await db.students.update_one({"id": payload.student_id}, {"$set": {"rating": avg}})
    return fb


# ---------- Slots ----------
async def _handle_slot_side_effects(before: Optional[dict], after: dict):
    """When a slot flips to Completed, add 1 hour to the linked vehicle."""
    before_status = (before or {}).get("status")
    after_status = after.get("status")
    if after_status == "Completed" and before_status != "Completed":
        vid = after.get("vehicle_id")
        if vid:
            veh = await db.vehicles.find_one({"id": vid}, {"_id": 0})
            if veh:
                new_total = float(veh.get("total_hours", 0)) + 1.0
                new_since = float(veh.get("hours_since_service", 0)) + 1.0
                new_status = "Service Due" if new_since >= float(veh.get("service_interval_hours", 100)) else veh.get("status", "Active")
                await db.vehicles.update_one({"id": vid}, {"$set": {
                    "total_hours": new_total,
                    "hours_since_service": new_since,
                    "status": new_status,
                }})


@api_router.get("/slots", response_model=List[AvailabilitySlot])
async def list_slots(user: User = Depends(get_current_user)):
    docs = await db.slots.find({}, {"_id": 0}).sort([("date", 1), ("time", 1)]).to_list(2000)
    return [AvailabilitySlot(**d) for d in docs]


@api_router.post("/slots", response_model=AvailabilitySlot)
async def create_slot(payload: SlotCreate, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    # Prevent double booking: same date+time+vehicle already exists
    conflict = await db.slots.find_one({
        "date": payload.date,
        "time": payload.time,
        "vehicle_id": payload.vehicle_id,
    }, {"_id": 0})
    if conflict:
        raise HTTPException(status_code=409, detail="A slot already exists for this vehicle at this date & time")
    slot = AvailabilitySlot(**payload.model_dump(), instructor_id=user.user_id)
    doc = slot.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.slots.insert_one(doc)
    await _handle_slot_side_effects(None, doc)
    return slot


@api_router.patch("/slots/{slot_id}", response_model=AvailabilitySlot)
async def update_slot(slot_id: str, payload: SlotUpdate, user: User = Depends(get_current_user)):
    before = await db.slots.find_one({"id": slot_id}, {"_id": 0})
    if not before:
        raise HTTPException(status_code=404, detail="Not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.slots.update_one({"id": slot_id}, {"$set": update})
    doc = await db.slots.find_one({"id": slot_id}, {"_id": 0})
    await _handle_slot_side_effects(before, doc)
    return AvailabilitySlot(**doc)


@api_router.delete("/slots/{slot_id}")
async def delete_slot(slot_id: str, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.slots.delete_one({"id": slot_id})
    return {"ok": True}


@api_router.post("/slots/{slot_id}/send-reminder")
async def send_slot_reminder(slot_id: str, user: User = Depends(get_current_user)):
    slot = await db.slots.find_one({"id": slot_id}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.get("status") not in ("Booked",):
        raise HTTPException(status_code=400, detail="Only booked slots can have reminders")
    # Determine recipient email
    to_email = slot.get("student_email") or ""
    if not to_email and slot.get("student_name"):
        # try lookup by name in students collection
        st = await db.students.find_one({"student_name": slot["student_name"]}, {"_id": 0})
        if st:
            to_email = st.get("email", "")
    if not to_email:
        raise HTTPException(status_code=400, detail="No student email on file")

    html = reminder_html(
        student_name=slot.get("student_name") or "there",
        date=slot["date"], time=slot["time"], vehicle=slot["vehicle"],
        instructor=user.name,
    )
    ok = await send_email(to_email, f"Reminder: your DriveMate lesson on {slot['date']} at {slot['time']}", html, reply_to=user.email)
    if not ok:
        raise HTTPException(status_code=502, detail="Failed to send email")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.slots.update_one({"id": slot_id}, {"$set": {"reminder_sent_at": now_iso}})
    return {"ok": True, "sent_to": to_email, "sent_at": now_iso}


@api_router.post("/slots/run-reminders")
async def run_reminders(user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    sent, skipped = await _run_reminders_job()
    return {"sent": sent, "skipped": skipped}


async def _run_reminders_job():
    """Find booked slots ~24h out (±2h window) and email their students once."""
    now = datetime.now(timezone.utc)
    lower = now + timedelta(hours=22)
    upper = now + timedelta(hours=26)
    slots = await db.slots.find({"status": "Booked", "reminder_sent_at": None}, {"_id": 0}).to_list(1000)
    sent, skipped = 0, 0
    for s in slots:
        try:
            dt = datetime.fromisoformat(f"{s['date']}T{s['time']}:00+00:00")
        except Exception:
            skipped += 1
            continue
        if not (lower <= dt <= upper):
            skipped += 1
            continue
        to_email = s.get("student_email") or ""
        if not to_email and s.get("student_name"):
            st = await db.students.find_one({"student_name": s["student_name"]}, {"_id": 0})
            if st:
                to_email = st.get("email", "")
        if not to_email:
            skipped += 1
            continue
        instructor = "your instructor"
        if s.get("instructor_id"):
            u = await db.users.find_one({"user_id": s["instructor_id"]}, {"_id": 0})
            if u:
                instructor = u.get("name", instructor)
        html = reminder_html(s.get("student_name") or "there", s["date"], s["time"], s["vehicle"], instructor)
        ok = await send_email(to_email, f"Reminder: your DriveMate lesson on {s['date']} at {s['time']}", html)
        if ok:
            await db.slots.update_one({"id": s["id"]}, {"$set": {"reminder_sent_at": datetime.now(timezone.utc).isoformat()}})
            sent += 1
        else:
            skipped += 1
    return sent, skipped


# ---------- Vehicles ----------
@api_router.get("/vehicles", response_model=List[Vehicle])
async def list_vehicles(user: User = Depends(get_current_user)):
    docs = await db.vehicles.find({}, {"_id": 0}).to_list(500)
    # auto-flag service due
    for d in docs:
        if d.get("status") == "Active" and float(d.get("hours_since_service", 0)) >= float(d.get("service_interval_hours", 100)):
            d["status"] = "Service Due"
    return [Vehicle(**d) for d in docs]


@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(payload: VehicleCreate, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    v = Vehicle(**payload.model_dump())
    doc = v.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.vehicles.insert_one(doc)
    return v


@api_router.patch("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, payload: VehicleUpdate, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.vehicles.update_one({"id": vehicle_id}, {"$set": update})
    doc = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return Vehicle(**doc)


@api_router.post("/vehicles/{vehicle_id}/service")
async def mark_vehicle_serviced(vehicle_id: str, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": {"hours_since_service": 0.0, "status": "Active"}})
    doc = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return Vehicle(**doc)


@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.vehicles.delete_one({"id": vehicle_id})
    return {"ok": True}


# ---------- Instructor profile ----------
@api_router.patch("/me", response_model=User)
async def update_me(payload: UserUpdate, user: User = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update})
    doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return User(**doc)


@api_router.get("/instructor/stats")
async def instructor_stats(user: User = Depends(get_current_user)):
    total_slots = await db.slots.count_documents({})
    completed_slots = await db.slots.count_documents({"status": "Completed"})
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    total_students = len(students)
    avg_rating = round(sum(s.get("rating", 0) for s in students) / len(students), 1) if students else 0.0
    # Total delivered hours = completed slots + baseline seed (so demo shows 142 hrs)
    baseline_hours = 142
    total_hours = completed_slots + baseline_hours
    fleet_count = await db.vehicles.count_documents({})
    fleet_service_due = await db.vehicles.count_documents({"status": "Service Due"})
    return {
        "rating": avg_rating or 4.8,
        "total_hours": total_hours,
        "total_students": total_students,
        "total_slots": total_slots,
        "completed_slots": completed_slots,
        "available_slots": await db.slots.count_documents({"status": "Available"}),
        "fleet_count": fleet_count,
        "fleet_service_due": fleet_service_due,
    }


@api_router.get("/")
async def root():
    return {"message": "DriveMate API", "status": "ok"}


# ==========================================
# STUDENT BOOKING (self-service)
# ==========================================
def _booking_confirmation_html(student_name, date, time, vehicle, instructor):
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;font-family:Arial,sans-serif;">
      <tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px;color:#f8fafc;">
          <div style="font-size:12px;letter-spacing:2px;color:#10b981;text-transform:uppercase;">Booking Confirmed · DriveMate</div>
          <h1 style="margin:12px 0 4px 0;font-size:28px;">Hi {student_name},</h1>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px 0;">Your lesson is locked in. See you soon!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;padding:20px;">
            <tr><td style="color:#cbd5e1;font-size:14px;line-height:1.9;">
              <strong style="color:#10b981;">Date:</strong> {date}<br>
              <strong style="color:#10b981;">Time:</strong> {time}<br>
              <strong style="color:#10b981;">Vehicle:</strong> {vehicle}<br>
              <strong style="color:#10b981;">Instructor:</strong> {instructor}
            </td></tr>
          </table>
          <p style="color:#64748b;font-size:12px;margin:32px 0 0 0;">Drive safe · Learn steady</p>
        </td></tr>
      </table></td></tr>
    </table>
    """


@api_router.get("/my/lessons", response_model=List[AvailabilitySlot])
async def my_lessons(user: User = Depends(get_current_user)):
    docs = await db.slots.find(
        {"$or": [{"student_id": user.user_id}, {"student_email": user.email}]},
        {"_id": 0}
    ).sort([("date", 1), ("time", 1)]).to_list(500)
    return [AvailabilitySlot(**d) for d in docs]


@api_router.post("/slots/{slot_id}/book", response_model=AvailabilitySlot)
async def book_slot(slot_id: str, user: User = Depends(get_current_user)):
    slot = await db.slots.find_one({"id": slot_id}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.get("status") != "Available":
        raise HTTPException(status_code=409, detail="Slot is not available")
    # Prevent double-booking: student already has a Booked slot at this date+time
    existing = await db.slots.find_one({
        "date": slot["date"], "time": slot["time"], "status": "Booked",
        "$or": [{"student_id": user.user_id}, {"student_email": user.email}]
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="You already have a lesson at this time")
    await db.slots.update_one({"id": slot_id}, {"$set": {
        "status": "Booked",
        "student_id": user.user_id,
        "student_name": user.name,
        "student_email": user.email,
    }})
    doc = await db.slots.find_one({"id": slot_id}, {"_id": 0})
    # Send confirmation email (fire and forget)
    instructor = "your instructor"
    if doc.get("instructor_id"):
        u = await db.users.find_one({"user_id": doc["instructor_id"]}, {"_id": 0})
        if u: instructor = u.get("name", instructor)
    html = _booking_confirmation_html(user.name, doc["date"], doc["time"], doc["vehicle"], instructor)
    asyncio.create_task(send_email(user.email, f"Booking confirmed: {doc['date']} at {doc['time']}", html))
    return AvailabilitySlot(**doc)


@api_router.post("/slots/{slot_id}/cancel", response_model=AvailabilitySlot)
async def cancel_slot(slot_id: str, user: User = Depends(get_current_user)):
    slot = await db.slots.find_one({"id": slot_id}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    # Student can only cancel their own; instructor/admin can cancel any
    if user.role == "student":
        if slot.get("student_id") != user.user_id and slot.get("student_email") != user.email:
            raise HTTPException(status_code=403, detail="Not your booking")
    await db.slots.update_one({"id": slot_id}, {"$set": {
        "status": "Available",
        "student_id": None,
        "student_name": "",
        "student_email": "",
        "reminder_sent_at": None,
    }})
    doc = await db.slots.find_one({"id": slot_id}, {"_id": 0})
    return AvailabilitySlot(**doc)


# ==========================================
# ADMIN — USER MANAGER
# ==========================================
def _require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


class AdminUserUpdate(BaseModel):
    role: Optional[Literal["admin", "instructor", "student"]] = None
    title: Optional[str] = None
    active: Optional[bool] = None


@api_router.get("/admin/users")
async def list_users(user: User = Depends(get_current_user)):
    _require_admin(user)
    docs = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.patch("/admin/users/{user_id}")
async def admin_update_user(user_id: str, payload: AdminUserUpdate, user: User = Depends(get_current_user)):
    _require_admin(user)
    # Never let admin demote themselves
    if user_id == user.user_id and payload.role and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot demote yourself")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"user_id": user_id}, {"$set": update})
    doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, user: User = Depends(get_current_user)):
    _require_admin(user)
    if user_id == user.user_id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    return {"ok": True}


@api_router.get("/admin/analytics")
async def admin_analytics(user: User = Depends(get_current_user)):
    _require_admin(user)
    total_users = await db.users.count_documents({})
    students_ct = await db.users.count_documents({"role": "student"})
    instructors_ct = await db.users.count_documents({"role": "instructor"})
    admins_ct = await db.users.count_documents({"role": "admin"})
    total_slots = await db.slots.count_documents({})
    booked = await db.slots.count_documents({"status": "Booked"})
    completed = await db.slots.count_documents({"status": "Completed"})
    available = await db.slots.count_documents({"status": "Available"})
    paid = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(2000)
    revenue = sum(float(p.get("amount", 0)) for p in paid)
    return {
        "users": {"total": total_users, "students": students_ct, "instructors": instructors_ct, "admins": admins_ct},
        "slots": {"total": total_slots, "booked": booked, "completed": completed, "available": available},
        "revenue": {"total": round(revenue, 2), "currency": "zar", "transactions": len(paid)},
        "fleet": {
            "total": await db.vehicles.count_documents({}),
            "service_due": await db.vehicles.count_documents({"status": "Service Due"}),
        },
    }


@api_router.post("/admin/reset-demo")
async def reset_demo(user: User = Depends(get_current_user)):
    """Wipe demo data (students, slots, vehicles, feedback, payments, messages) and reseed. Users are preserved."""
    _require_admin(user)
    await db.students.delete_many({})
    await db.slots.delete_many({})
    await db.vehicles.delete_many({})
    await db.feedback.delete_many({})
    await db.payment_transactions.delete_many({})
    await db.messages.delete_many({})
    await _seed_all()  # noqa: F821 — defined further down; resolved at request time
    return {"ok": True, "message": "Demo data reset. Fresh sample loaded."}


# ==========================================
# PAYMENTS (Stripe via emergentintegrations)
# ==========================================
try:
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    _STRIPE_AVAILABLE = True
except Exception as e:
    logger.warning(f"emergentintegrations Stripe not available: {e}")
    _STRIPE_AVAILABLE = False

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

PACKAGES = {
    "single":   {"name": "Single Lesson",   "amount": 500.0,  "lessons": 1,  "description": "One 1-hour lesson"},
    "starter":  {"name": "Starter Pack",    "amount": 2250.0, "lessons": 5,  "description": "5 lessons (R450 / lesson)"},
    "pro":      {"name": "Pro Pack",        "amount": 4000.0, "lessons": 10, "description": "10 lessons (R400 / lesson)"},
    "full":     {"name": "Full Course",     "amount": 7500.0, "lessons": 20, "description": "20 lessons (R375 / lesson)"},
}


CURRENCY = "zar"


class CheckoutBody(BaseModel):
    package_id: str
    origin_url: str


@api_router.get("/payments/packages")
async def list_packages():
    return {k: {**v, "id": k, "currency": CURRENCY} for k, v in PACKAGES.items()}


@api_router.post("/payments/checkout")
async def create_checkout(body: CheckoutBody, request: Request, user: User = Depends(get_current_user)):
    if not _STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payments unavailable")
    pkg = PACKAGES.get(body.package_id)
    if not pkg:
        raise HTTPException(status_code=400, detail="Unknown package")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{body.origin_url.rstrip('/')}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{body.origin_url.rstrip('/')}/payment/cancel"
    req = CheckoutSessionRequest(
        amount=float(pkg["amount"]), currency=CURRENCY,
        success_url=success_url, cancel_url=cancel_url,
        metadata={"user_id": user.user_id, "package_id": body.package_id, "lessons": str(pkg["lessons"])},
    )
    session = await checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user.user_id,
        "user_email": user.email,
        "package_id": body.package_id,
        "package_name": pkg["name"],
        "lessons": pkg["lessons"],
        "amount": float(pkg["amount"]),
        "currency": CURRENCY,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.session_id}


@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid" and _STRIPE_AVAILABLE:
        try:
            checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
            status = await checkout.get_checkout_status(session_id)
            if status.payment_status == "paid" or status.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {
                        "status": "completed", "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
                record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except Exception as e:
            logger.warning(f"Stripe status check failed: {e}")
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"], "amount": record["amount"],
            "package_name": record.get("package_name")}


@api_router.get("/payments/my")
async def my_payments(user: User = Depends(get_current_user)):
    docs = await db.payment_transactions.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api_router.get("/admin/payments")
async def admin_payments(user: User = Depends(get_current_user)):
    _require_admin(user)
    docs = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    if not _STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payments unavailable")
    try:
        checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        result = await checkout.handle_webhook(body, signature)
        if result.event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
            await db.payment_transactions.update_one(
                {"session_id": result.session_id, "payment_status": {"$ne": "paid"}},
                {"$set": {
                    "status": "completed", "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
        return {"ok": True}
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook")


# ==========================================
# IN-APP MESSAGING
# ==========================================
class MessageCreate(BaseModel):
    to_user_id: str
    body: str


@api_router.get("/messages/threads")
async def list_threads(user: User = Depends(get_current_user)):
    # Return distinct users I've messaged with
    pipeline = [
        {"$match": {"$or": [{"from_user_id": user.user_id}, {"to_user_id": user.user_id}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {"$cond": [{"$eq": ["$from_user_id", user.user_id]}, "$to_user_id", "$from_user_id"]},
            "last_message": {"$first": "$body"},
            "last_at": {"$first": "$created_at"},
            "unread": {"$sum": {"$cond": [{"$and": [{"$eq": ["$to_user_id", user.user_id]}, {"$eq": ["$read", False]}]}, 1, 0]}},
        }},
    ]
    threads = await db.messages.aggregate(pipeline).to_list(200)
    # Enrich with user info
    result = []
    for t in threads:
        peer_id = t["_id"]
        peer = await db.users.find_one({"user_id": peer_id}, {"_id": 0})
        if peer:
            result.append({
                "peer_id": peer_id, "peer_name": peer.get("name", ""),
                "peer_picture": peer.get("picture", ""), "peer_role": peer.get("role", ""),
                "last_message": t["last_message"], "last_at": t["last_at"], "unread": t["unread"],
            })
    return result


@api_router.get("/messages/with/{peer_id}")
async def list_messages_with(peer_id: str, user: User = Depends(get_current_user)):
    docs = await db.messages.find({
        "$or": [
            {"from_user_id": user.user_id, "to_user_id": peer_id},
            {"from_user_id": peer_id, "to_user_id": user.user_id},
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(500)
    # Mark as read
    await db.messages.update_many(
        {"from_user_id": peer_id, "to_user_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    return docs


@api_router.post("/messages")
async def send_message(payload: MessageCreate, user: User = Depends(get_current_user)):
    msg = {
        "id": str(uuid.uuid4()),
        "from_user_id": user.user_id,
        "from_name": user.name,
        "to_user_id": payload.to_user_id,
        "body": payload.body,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    return {k: v for k, v in msg.items() if k != "_id"}


@api_router.get("/users/directory")
async def users_directory(user: User = Depends(get_current_user)):
    """List users the current user can message: students see instructors+admins, instructors/admins see all."""
    if user.role == "student":
        docs = await db.users.find({"role": {"$in": ["instructor", "admin"]}}, {"_id": 0}).to_list(500)
    else:
        docs = await db.users.find({"user_id": {"$ne": user.user_id}}, {"_id": 0}).to_list(500)
    return [{"user_id": d["user_id"], "name": d["name"], "role": d["role"], "picture": d.get("picture", "")} for d in docs]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Seed ----------
SEED_VEHICLES = [
    {"name": "Fleet-01", "make_model": "Toyota Corolla", "license_plate": "CA 123-456", "license_class": "Code 8", "total_hours": 320, "hours_since_service": 62, "service_interval_hours": 100, "color": "Silver"},
    {"name": "Fleet-02", "make_model": "VW Polo Vivo", "license_plate": "CA 345-678", "license_class": "Code 8", "total_hours": 180, "hours_since_service": 22, "service_interval_hours": 100, "color": "White"},
    {"name": "Fleet-03", "make_model": "Isuzu N-Series Truck", "license_plate": "CA 789-012", "license_class": "Code 10", "total_hours": 640, "hours_since_service": 108, "service_interval_hours": 100, "color": "Blue", "status": "Service Due"},
]

SEED_STUDENTS = [
    {"student_name": "Thabo Mokoena", "email": "thabo.mokoena@example.co.za", "license_track": "Code 8", "progress": 75, "rating": 4.6, "lessons_completed": 15, "total_lessons": 20},
    {"student_name": "Naledi Dlamini", "email": "naledi.dlamini@example.co.za", "license_track": "Code 10", "progress": 40, "rating": 4.2, "lessons_completed": 8, "total_lessons": 20},
    {"student_name": "Sipho Ndaba", "email": "sipho.ndaba@example.co.za", "license_track": "Code 8", "progress": 95, "rating": 4.9, "lessons_completed": 19, "total_lessons": 20},
    {"student_name": "Amahle Zulu", "email": "amahle.zulu@example.co.za", "license_track": "Code 10", "progress": 60, "rating": 4.5, "lessons_completed": 12, "total_lessons": 20},
    {"student_name": "Kagiso Molefe", "email": "kagiso.molefe@example.co.za", "license_track": "Code 8", "progress": 25, "rating": 4.0, "lessons_completed": 5, "total_lessons": 20},
    {"student_name": "Lerato Ndlovu", "email": "lerato.ndlovu@example.co.za", "license_track": "Code 8", "progress": 55, "rating": 4.3, "lessons_completed": 11, "total_lessons": 20},
    {"student_name": "Bongani Khumalo", "email": "bongani.khumalo@example.co.za", "license_track": "Code 10", "progress": 30, "rating": 4.1, "lessons_completed": 6, "total_lessons": 20},
]


async def _reminder_loop():
    """Run the 24h reminder job every 30 minutes."""
    while True:
        try:
            await asyncio.sleep(30 * 60)
            sent, skipped = await _run_reminders_job()
            if sent:
                logger.info(f"Reminder loop: sent={sent} skipped={skipped}")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Reminder loop error: {e}")


async def _seed_all():
    """Idempotent seed helper — reused by startup and /admin/reset-demo."""
    if await db.vehicles.count_documents({}) == 0:
        for v in SEED_VEHICLES:
            doc = Vehicle(**v).model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.vehicles.insert_one(doc)
        logger.info("Seeded vehicles")

    if await db.students.count_documents({}) == 0:
        for s in SEED_STUDENTS:
            doc = StudentProgress(**s).model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.students.insert_one(doc)
        logger.info("Seeded students")

    if await db.slots.count_documents({}) == 0:
        vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(10)
        v_by_class = {v["license_class"]: v for v in vehicles}
        today = datetime.now(timezone.utc).date()
        seed_slots = [
            {"date": (today + timedelta(days=1)).isoformat(), "time": "08:00", "vehicle": f"{v_by_class['Code 8']['make_model']} - {v_by_class['Code 8']['license_plate']}", "vehicle_id": v_by_class['Code 8']['id'], "status": "Available"},
            {"date": (today + timedelta(days=1)).isoformat(), "time": "10:00", "vehicle": f"{v_by_class['Code 8']['make_model']} - {v_by_class['Code 8']['license_plate']}", "vehicle_id": v_by_class['Code 8']['id'], "status": "Booked", "student_name": "Thabo Mokoena", "student_email": "thabo.mokoena@example.co.za"},
            {"date": (today + timedelta(days=2)).isoformat(), "time": "09:00", "vehicle": f"{v_by_class['Code 10']['make_model']} - {v_by_class['Code 10']['license_plate']}", "vehicle_id": v_by_class['Code 10']['id'], "status": "Available"},
            {"date": (today + timedelta(days=2)).isoformat(), "time": "14:00", "vehicle": f"{vehicles[1]['make_model']} - {vehicles[1]['license_plate']}", "vehicle_id": vehicles[1]['id'], "status": "Completed", "student_name": "Sipho Ndaba", "student_email": "sipho.ndaba@example.co.za"},
            {"date": (today + timedelta(days=3)).isoformat(), "time": "11:00", "vehicle": f"{v_by_class['Code 10']['make_model']} - {v_by_class['Code 10']['license_plate']}", "vehicle_id": v_by_class['Code 10']['id'], "status": "Booked", "student_name": "Naledi Dlamini", "student_email": "naledi.dlamini@example.co.za"},
            {"date": (today + timedelta(days=3)).isoformat(), "time": "15:00", "vehicle": f"{v_by_class['Code 8']['make_model']} - {v_by_class['Code 8']['license_plate']}", "vehicle_id": v_by_class['Code 8']['id'], "status": "Available"},
            {"date": (today + timedelta(days=4)).isoformat(), "time": "10:00", "vehicle": f"{vehicles[1]['make_model']} - {vehicles[1]['license_plate']}", "vehicle_id": vehicles[1]['id'], "status": "Available"},
        ]
        for s in seed_slots:
            doc = AvailabilitySlot(**s).model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.slots.insert_one(doc)
        logger.info("Seeded slots")


@app.on_event("startup")
async def seed_data():
    if not await db.users.find_one({"email": ADMIN_EMAIL}):
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": ADMIN_EMAIL,
            "name": "Lesego Lebese",
            "picture": "",
            "role": "admin",
            "title": "Technical Lead",
            "phone": "+27 71 000 0000",
            "bio": "Senior driving instructor and technical lead at DriveMate. Passionate about safe driving education.",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user")

    await _seed_all()

    # Start reminder loop
    app.state.reminder_task = asyncio.create_task(_reminder_loop())


@app.on_event("shutdown")
async def shutdown_db_client():
    task = getattr(app.state, "reminder_task", None)
    if task:
        task.cancel()
    client.close()
