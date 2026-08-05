# DriveMate Driving School Management System — PRD

## Original Problem Statement
Build a full-stack web application called **DriveMate**. Multi-role driving school management with:
- Instructor Roster (searchable, progress bars, ratings, feedback modal)
- Calendar Slot Scheduler (Date, Time, Vehicle, Status + add slot modal)
- Instructor Profile (rating, hours, editable info)
- Header with avatar (Lesego Lebese — Technical Lead)
- CPUT Faculty branding footer
- Modern Dark Glassmorphism (navy #0f172a, emerald #1D6A4A, neon #10b981)

## Architecture
- **Backend**: FastAPI + Motor (MongoDB async)
- **Frontend**: React 19 + Tailwind + shadcn/ui + lucide-react + sonner
- **Auth**: Emergent-managed Google OAuth (session cookie httpOnly, secure, samesite=None)
- **DB Collections**: `users`, `user_sessions`, `students`, `slots`, `feedback`

## User Personas
- **Admin (Lesego Lebese)** — Full CRUD, faculty console. Auto-assigned on `lesegoryan36@gmail.com` sign-in.
- **Instructor** — Manage roster, slots, feedback. Cannot delete students.
- **Student** — Read-only view of own progress and slots.

## Implemented (2026-02-05)
- Emergent Google Auth (login, callback, /me, logout) with cookie + role auto-promotion
- Models: User, StudentProgress, AvailabilitySlot, Feedback (all Pydantic + `_id` excluded)
- API: `/api/auth/*`, `/api/students`, `/api/slots`, `/api/feedback`, `/api/me`, `/api/instructor/stats`
- Seed data: 5 students (Code 8 & Code 10) + 5 slots + admin user
- Frontend routes: `/` (Login), `/dashboard` (protected), OAuth callback via hash detection
- Dashboard sections: Instructor Roster (search, progress bars, feedback modal, add student), Calendar Slot Scheduler (add/delete slot modal), Instructor Profile (stats grid + editable form)
- Dark glassmorphism theme, Outfit/Plus Jakarta Sans/JetBrains Mono fonts, grain overlay, hover-lift animations
- Header with user avatar dropdown + Footer with CPUT branding

## Iteration 2 (2026-02-05)
- Removed all CPUT branding (client-agnostic now) — header, footer, sidebar, login
- **Week Calendar View** — 7-day × hourly grid inside Slot Scheduler with prev/next navigation; click empty cell to add slot
- **Fleet Manager** — new module with Vehicle model, service tracking (`hours_since_service` vs `service_interval_hours`), auto-flag "Service Due", "Mark Serviced" resets counter, per-vehicle license class (Code 8/10). Slots now reference `vehicle_id`. Completed slots auto-increment vehicle hours.
- **Email Reminders (Resend via Emergent proxy)** — `POST /api/slots/{id}/send-reminder` manual send + `POST /api/slots/run-reminders` bulk 24h window job + background asyncio loop every 30 min. HTML email template with DriveMate brand.
- Seed vehicles (3) refreshed; slot seed now uses relative dates (today+1/+2/+3) and links to `vehicle_id`.

## Iteration 3 (2026-02-05)
- **Student self-booking flow**: `POST /api/slots/{id}/book` + `/cancel`; sends booking confirmation email; per-user double-booking prevention on date+time
- **Double-booking prevention at slot creation**: (date, time, vehicle_id) uniqueness → 409
- **My Lessons page** (upcoming + history with cancel)
- **Admin User Manager**: list/promote/demote/delete users; self-safety guards (400 on demote/delete self)
- **Admin Analytics dashboard**: revenue, users, bookings, fleet stats + recent transactions table
- **Payments (Stripe via emergentintegrations)**: 4 packages (single $25, starter $110, pro $200, full $360), checkout → real Stripe URL, pending record, status polling with self-heal, `/payment/success` + `/payment/cancel` pages
- **In-app messaging**: threads, directory (role-aware), send, mark-as-read, 5-second polling
- Role-based routing: Student default=book, Instructor default=roster, Admin default=analytics
- Testing agent: 22/22 backend + all frontend flows verified, including live Stripe redirect to Sandbox3

## Backlog / Next
- **P2**: Return 404 (not silent 200) from DELETE /api/admin/users when user missing
- **P2**: Instructor availability = booking window (block booking too close to slot time)
- **P3**: SMS reminders (Twilio) alongside email
- **P3**: Package credits tracked per student (auto-decrement on Completed lesson)
