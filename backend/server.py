from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
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
    progress: int = 0  # 0-100
    rating: float = 0.0  # 0-5
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
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    vehicle: str
    status: Literal["Available", "Booked", "Completed"] = "Available"
    instructor_id: Optional[str] = None
    student_id: Optional[str] = None
    student_name: Optional[str] = ""
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SlotCreate(BaseModel):
    date: str
    time: str
    vehicle: str
    status: Literal["Available", "Booked", "Completed"] = "Available"
    student_name: Optional[str] = ""
    notes: Optional[str] = ""


class SlotUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    vehicle: Optional[str] = None
    status: Optional[Literal["Available", "Booked", "Completed"]] = None
    student_name: Optional[str] = None
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
        # promote admin if needed
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
    # update aggregate rating
    all_fb = await db.feedback.find({"student_id": payload.student_id}, {"_id": 0}).to_list(500)
    if all_fb:
        avg = round(sum(f["rating"] for f in all_fb) / len(all_fb), 1)
        await db.students.update_one({"id": payload.student_id}, {"$set": {"rating": avg}})
    return fb


# ---------- Slots ----------
@api_router.get("/slots", response_model=List[AvailabilitySlot])
async def list_slots(user: User = Depends(get_current_user)):
    docs = await db.slots.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    return [AvailabilitySlot(**d) for d in docs]


@api_router.post("/slots", response_model=AvailabilitySlot)
async def create_slot(payload: SlotCreate, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    slot = AvailabilitySlot(**payload.model_dump(), instructor_id=user.user_id)
    doc = slot.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.slots.insert_one(doc)
    return slot


@api_router.patch("/slots/{slot_id}", response_model=AvailabilitySlot)
async def update_slot(slot_id: str, payload: SlotUpdate, user: User = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.slots.update_one({"id": slot_id}, {"$set": update})
    doc = await db.slots.find_one({"id": slot_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return AvailabilitySlot(**doc)


@api_router.delete("/slots/{slot_id}")
async def delete_slot(slot_id: str, user: User = Depends(get_current_user)):
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.slots.delete_one({"id": slot_id})
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
    # 1 slot = 1 hr
    total_hours = completed_slots + 142 if user.email == ADMIN_EMAIL else completed_slots
    return {
        "rating": avg_rating or 4.8,
        "total_hours": total_hours,
        "total_students": total_students,
        "total_slots": total_slots,
        "completed_slots": completed_slots,
        "available_slots": await db.slots.count_documents({"status": "Available"}),
    }


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"message": "DriveMate API", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Seed ----------
SEED_STUDENTS = [
    {"student_name": "Thabo Mokoena", "email": "thabo@student.cput.ac.za", "license_track": "Code 8", "progress": 75, "rating": 4.6, "lessons_completed": 15, "total_lessons": 20},
    {"student_name": "Naledi Dlamini", "email": "naledi@student.cput.ac.za", "license_track": "Code 10", "progress": 40, "rating": 4.2, "lessons_completed": 8, "total_lessons": 20},
    {"student_name": "Sipho Ndaba", "email": "sipho@student.cput.ac.za", "license_track": "Code 8", "progress": 95, "rating": 4.9, "lessons_completed": 19, "total_lessons": 20},
    {"student_name": "Amahle Zulu", "email": "amahle@student.cput.ac.za", "license_track": "Code 10", "progress": 60, "rating": 4.5, "lessons_completed": 12, "total_lessons": 20},
    {"student_name": "Kagiso Molefe", "email": "kagiso@student.cput.ac.za", "license_track": "Code 8", "progress": 25, "rating": 4.0, "lessons_completed": 5, "total_lessons": 20},
]

SEED_SLOTS = [
    {"date": "2026-02-15", "time": "08:00", "vehicle": "Toyota Corolla - CA 123-456", "status": "Available"},
    {"date": "2026-02-15", "time": "10:00", "vehicle": "Toyota Corolla - CA 123-456", "status": "Booked", "student_name": "Thabo Mokoena"},
    {"date": "2026-02-16", "time": "09:00", "vehicle": "Isuzu Truck - CA 789-012", "status": "Available"},
    {"date": "2026-02-16", "time": "14:00", "vehicle": "VW Polo - CA 345-678", "status": "Completed", "student_name": "Sipho Ndaba"},
    {"date": "2026-02-17", "time": "11:00", "vehicle": "Isuzu Truck - CA 789-012", "status": "Available"},
]


@app.on_event("startup")
async def seed_data():
    # Seed admin user
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

    if await db.students.count_documents({}) == 0:
        for s in SEED_STUDENTS:
            doc = StudentProgress(**s).model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.students.insert_one(doc)
        logger.info("Seeded students")

    if await db.slots.count_documents({}) == 0:
        for s in SEED_SLOTS:
            doc = AvailabilitySlot(**s).model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.slots.insert_one(doc)
        logger.info("Seeded slots")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
