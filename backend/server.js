//SESETHU NCITI 231118384 and Naledi Ngobeni(230742912)//
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passport from './config/passport.js';
import { ExtractJwt } from 'passport-jwt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const frontendBuildPath = path.join(__dirname, '../frontend/build');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'drivemate-secret-key-change-in-production';
const DB_PATH = path.resolve(__dirname, 'prisma', 'dev.db');

// Initialize Prisma after environment variables are loaded
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${DB_PATH}`
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Authorization helper
const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getBestSchedulingSuggestions = async (studentId) => {
    const today = new Date();
    const windowStart = formatDateKey(today);
    const studentProgress = await prisma.studentProgress.findUnique({
        where: { studentId },
        select: { progressPct: true, completedLessons: true, totalLessons: true },
    });

    const availableSlots = await prisma.availabilitySlot.findMany({
        where: {
            isBooked: false,
            date: { gte: windowStart },
        },
        include: { instructor: { select: { name: true } } },
        orderBy: [{ date: 'asc' }, { timeWindow: 'asc' }],
        take: 15,
    });

    const scoreSlot = (slot) => {
        const scoreDate = new Date(`${slot.date}T${slot.timeWindow}:00`).getTime();
        const now = Date.now();
        const daysAway = Math.max(0, (scoreDate - now) / (1000 * 60 * 60 * 24));
        let score = 100 - Math.min(daysAway * 8, 60);

        if (slot.timeWindow.startsWith('08') || slot.timeWindow.startsWith('09')) score += 8;
        if (slot.timeWindow.startsWith('14') || slot.timeWindow.startsWith('15')) score += 5;
        if (studentProgress?.progressPct && studentProgress.progressPct < 50) score += 10;

        return score;
    };

    const suggestions = availableSlots
        .map((slot) => {
            const slotDate = new Date(`${slot.date}T${slot.timeWindow}:00`);
            const daysAway = Math.max(0, Math.round((slotDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            const score = scoreSlot(slot);
            const reason =
                studentProgress && studentProgress.progressPct < 50
                    ? 'High-priority lesson to build confidence faster'
                    : daysAway <= 2
                        ? 'Ideal slot for maintaining momentum'
                        : 'Strong next available lesson slot';

            return {
                id: slot.id,
                date: slot.date,
                timeWindow: slot.timeWindow,
                vehicle: slot.vehicle,
                instructor: slot.instructor?.name || 'Instructor',
                reason,
                score: Math.max(70, Math.min(99, Math.round(score))),
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    return suggestions;
};

const generateLessonReminderNotifications = async (studentId) => {
    const today = new Date();
    const maxWindow = new Date(today.getTime() + 1000 * 60 * 60 * 24 * 7);

    const upcomingBookings = await prisma.booking.findMany({
        where: {
            studentId,
            status: 'CONFIRMED',
            slot: {
                date: {
                    gte: formatDateKey(today),
                    lte: formatDateKey(maxWindow),
                },
            },
        },
        include: {
            slot: {
                include: {
                    instructor: { select: { name: true } },
                },
            },
        },
        orderBy: { slot: { date: 'asc' } },
    });

    const reminders = [];
    for (const booking of upcomingBookings) {
        const bookingDateTime = new Date(`${booking.slot.date}T${booking.slot.timeWindow}:00`);
        const diffMs = bookingDateTime.getTime() - Date.now();

        if (diffMs < 0 || diffMs > 1000 * 60 * 60 * 24 * 7) continue;

        const reminderMessage = diffMs <= 1000 * 60 * 60 * 24
            ? `Your lesson is tomorrow at ${booking.slot.timeWindow} with ${booking.slot.instructor?.name || 'your instructor'}. Please arrive 10 minutes early.`
            : `Your next lesson is on ${booking.slot.date} at ${booking.slot.timeWindow} with ${booking.slot.instructor?.name || 'your instructor'}.`;

        let reminder = await prisma.notification.findFirst({
            where: {
                userId: studentId,
                type: 'lesson_reminder',
                relatedId: booking.id,
            },
        });

        if (!reminder) {
            reminder = await prisma.notification.create({
                data: {
                    userId: studentId,
                    type: 'lesson_reminder',
                    title: 'Lesson Reminder',
                    message: reminderMessage,
                    relatedId: booking.id,
                },
            });
        }

        reminders.push(reminder);
    }

    return reminders;
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, name, password } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role: 'STUDENT',
            },
        });

        // Create student progress record
        await prisma.studentProgress.create({
            data: {
                studentId: user.id,
                track: 'CODE_8',
                totalLessons: 20,
            },
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login with standard JWT authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role, title: user.title },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { studentProgress: true },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update current user profile
app.patch('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const { name, phone, bio } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone }),
                ...(bio !== undefined && { bio }),
            },
        });

        res.json(user);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET + '-refresh');

        // Check if refresh token exists in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken || storedToken.userId !== decoded.id) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Check if refresh token is expired
        if (storedToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({ where: { token: refreshToken } });
            return res.status(401).json({ error: 'Refresh token expired' });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { id: storedToken.user.id, email: storedToken.user.email, role: storedToken.user.role },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await prisma.refreshToken.delete({
                where: { token: refreshToken },
            }).catch(() => {
                // Token doesn't exist, but that's okay
            });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// ============ USER MANAGEMENT (ADMIN) ============

// List all users with pagination
app.get('/api/admin/users', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await prisma.user.findMany({
            skip,
            take: limit,
            include: { studentProgress: true },
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.user.count();

        res.json({
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update user role
app.patch('/api/admin/users/:userId', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Prevent self-demotion
        if (userId === req.user.id && role !== 'ADMIN') {
            return res.status(400).json({ error: 'Cannot demote yourself' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
app.delete('/api/admin/users/:userId', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        await prisma.user.delete({ where: { id: userId } });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ============ AVAILABILITY SLOTS (INSTRUCTOR) ============

// Create availability slot
app.post('/api/slots', authenticateToken, authorize(['INSTRUCTOR', 'ADMIN']), async (req, res) => {
    try {
        const { date, timeWindow, vehicle, vehicleId } = req.body;

        // Check for conflicts
        const existing = await prisma.availabilitySlot.findFirst({
            where: {
                instructorId: req.user.id,
                date,
                timeWindow,
                vehicleId,
            },
        });

        if (existing) {
            return res.status(409).json({ error: 'Slot already exists at this time' });
        }

        const slot = await prisma.availabilitySlot.create({
            data: {
                instructorId: req.user.id,
                date,
                timeWindow,
                vehicle,
                vehicleId,
                isBooked: false,
            },
        });

        res.json(slot);
    } catch (error) {
        console.error('Slot creation error:', error);
        res.status(500).json({ error: 'Failed to create slot' });
    }
});

// Get available slots for student booking
app.get('/api/slots/available', authenticateToken, async (req, res) => {
    try {
        const { date, licenseCode } = req.query;

        const where = { isBooked: false };
        if (date) where.date = date;

        const slots = await prisma.availabilitySlot.findMany({
            where,
            include: { instructor: { select: { id: true, name: true } } },
            orderBy: [{ date: 'asc' }, { timeWindow: 'asc' }],
        });

        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch slots' });
    }
});

// Get instructor's own slots (includes booked student details)
app.get('/api/slots/my-schedule', authenticateToken, authorize(['INSTRUCTOR', 'ADMIN']), async (req, res) => {
    try {
        const slots = await prisma.availabilitySlot.findMany({
            where: { instructorId: req.user.id },
            include: { booking: { include: { student: { select: { id: true, name: true } } } } },
            orderBy: [{ date: 'asc' }, { timeWindow: 'asc' }],
        });

        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

// Delete slot
app.delete('/api/slots/:slotId', authenticateToken, authorize(['INSTRUCTOR', 'ADMIN']), async (req, res) => {
    try {
        const { slotId } = req.params;

        const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
        if (!slot) return res.status(404).json({ error: 'Slot not found' });

        if (slot.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.availabilitySlot.delete({ where: { id: slotId } });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete slot' });
    }
});

// ============ BOOKINGS (STUDENT) ============

// Book a lesson (with double-booking prevention)
app.post('/api/bookings/:slotId', authenticateToken, authorize(['STUDENT', 'ADMIN']), async (req, res) => {
    try {
        const { slotId } = req.params;

        // Fetch the slot
        const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
        if (!slot) return res.status(404).json({ error: 'Slot not found' });

        if (slot.isBooked) {
            return res.status(409).json({ error: 'This slot is no longer available' });
        }

        // Prevent double-booking: check if student already has a booking at this date+time
        const existingBooking = await prisma.booking.findFirst({
            where: {
                studentId: req.user.id,
                slot: {
                    date: slot.date,
                    timeWindow: slot.timeWindow,
                },
            },
        });

        if (existingBooking) {
            return res.status(409).json({ error: 'You already have a lesson at this time' });
        }

        // Students must have an active PAID package with remaining lesson credits
        if (req.user.role === 'STUDENT') {
            const paidPayments = await prisma.payment.findMany({
                where: { studentId: req.user.id, status: 'PAID' },
            });
            const totalPaidLessons = paidPayments.reduce((sum, p) => sum + p.lessonsIncluded, 0);
            const usedLessons = await prisma.booking.count({
                where: { studentId: req.user.id, status: { not: 'CANCELLED' } },
            });
            if (totalPaidLessons - usedLessons <= 0) {
                return res.status(402).json({
                    error: 'No lesson credits available. Please purchase and pay for a package before booking.',
                });
            }
        }

        // Book the slot in transaction
        const booking = await prisma.$transaction(async (tx) => {
            // Update slot as booked
            await tx.availabilitySlot.update({
                where: { id: slotId },
                data: { isBooked: true, studentId: req.user.id },
            });

            // Create booking record
            return tx.booking.create({
                data: {
                    slotId,
                    studentId: req.user.id,
                    status: 'CONFIRMED',
                },
            });
        });

        // Create confirmation + reminder-ready notification
        await prisma.notification.create({
            data: {
                userId: req.user.id,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                message: `Your lesson is booked for ${slot.date} at ${slot.timeWindow}`,
                relatedId: booking.id,
            },
        });

        await generateLessonReminderNotifications(req.user.id);

        res.json(booking);
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Failed to book slot' });
    }
});

// Smart lesson recommendations for students
app.get('/api/scheduling/suggestions', authenticateToken, authorize(['STUDENT']), async (req, res) => {
    try {
        const suggestions = await getBestSchedulingSuggestions(req.user.id);
        const reminderCount = (await generateLessonReminderNotifications(req.user.id)).length;

        res.json({
            suggestions,
            reminderCount,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Scheduling suggestion error:', error);
        res.status(500).json({ error: 'Failed to generate lesson suggestions' });
    }
});

// Generate and fetch reminder notifications for students
app.get('/api/scheduling/reminders', authenticateToken, authorize(['STUDENT']), async (req, res) => {
    try {
        const reminders = await generateLessonReminderNotifications(req.user.id);
        res.json({
            reminders,
            count: reminders.length,
        });
    } catch (error) {
        console.error('Reminder generation error:', error);
        res.status(500).json({ error: 'Failed to generate lesson reminders' });
    }
});

// Get student's bookings
app.get('/api/bookings/my-lessons', authenticateToken, authorize(['STUDENT']), async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { studentId: req.user.id },
            include: {
                slot: { include: { instructor: { select: { name: true } } } },
            },
            orderBy: { slot: { date: 'asc' } },
        });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Cancel booking
app.post('/api/bookings/:bookingId/cancel', authenticateToken, async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { slot: true },
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Check authorization
        if (booking.studentId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Update booking and slot
        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: bookingId },
                data: { status: 'CANCELLED' },
            });

            await tx.availabilitySlot.update({
                where: { id: booking.slotId },
                data: { isBooked: false, studentId: null },
            });
        });

        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

// ============ LESSON PROGRESS & HISTORY ============

// Get student progress
app.get('/api/progress/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;

        // Allow students to view only their own progress
        if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const progress = await prisma.studentProgress.findUnique({
            where: { studentId },
            include: { feedbackReceived: true },
        });

        if (!progress) return res.status(404).json({ error: 'Progress not found' });

        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// Update student progress (instructor/admin)
app.patch('/api/progress/:studentId', authenticateToken, authorize(['INSTRUCTOR', 'ADMIN']), async (req, res) => {
    try {
        const { studentId } = req.params;
        const { progressPct, rating, lessonNotes, completedLessons } = req.body;

        const progress = await prisma.studentProgress.update({
            where: { studentId },
            data: {
                ...(progressPct !== undefined && { progressPct }),
                ...(rating !== undefined && { rating }),
                ...(lessonNotes !== undefined && { lessonNotes }),
                ...(completedLessons !== undefined && { completedLessons }),
            },
        });

        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Get lesson history (completed bookings)
app.get('/api/lessons/history', authenticateToken, async (req, res) => {
    try {
        let where = { status: 'COMPLETED' };
        if (req.user.role === 'STUDENT') {
            where.studentId = req.user.id;
        }

        const history = await prisma.booking.findMany({
            where,
            include: {
                slot: { include: { instructor: { select: { name: true } } } },
            },
            orderBy: { slot: { date: 'desc' } },
            take: 50,
        });

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Get student's lesson credits (from paid packages minus booked lessons)
app.get('/api/lessons/credits', authenticateToken, authorize(['STUDENT']), async (req, res) => {
    try {
        const paidPayments = await prisma.payment.findMany({
            where: { studentId: req.user.id, status: 'PAID' },
        });
        const totalPaidLessons = paidPayments.reduce((sum, p) => sum + p.lessonsIncluded, 0);
        const usedLessons = await prisma.booking.count({
            where: { studentId: req.user.id, status: { not: 'CANCELLED' } },
        });
        res.json({
            totalPaidLessons,
            usedLessons,
            availableCredits: Math.max(0, totalPaidLessons - usedLessons),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch credits' });
    }
});

// ============ PAYMENTS ============

// Get payment packages
app.get('/api/payments/packages', authenticateToken, async (req, res) => {
    const packages = {
        single: {
            id: 'single',
            name: 'Single Lesson',
            amount: 500,
            lessons: 1,
            description: 'One 1-hour lesson',
            currency: 'ZAR',
        },
        starter: {
            id: 'starter',
            name: 'Starter Pack',
            amount: 2250,
            lessons: 5,
            description: '5 lessons (R450/lesson)',
            currency: 'ZAR',
        },
        pro: {
            id: 'pro',
            name: 'Pro Pack',
            amount: 4000,
            lessons: 10,
            description: '10 lessons (R400/lesson)',
            currency: 'ZAR',
        },
        full: {
            id: 'full',
            name: 'Full Course',
            amount: 7500,
            lessons: 20,
            description: '20 lessons (R375/lesson)',
            currency: 'ZAR',
        },
    };

    res.json(packages);
});

// Create payment record
app.post('/api/payments', authenticateToken, async (req, res) => {
    try {
        const { packageType } = req.body;

        const packages = {
            single: { amount: 500, lessons: 1 },
            starter: { amount: 2250, lessons: 5 },
            pro: { amount: 4000, lessons: 10 },
            full: { amount: 7500, lessons: 20 },
        };

        const pkg = packages[packageType];
        if (!pkg) return res.status(400).json({ error: 'Invalid package' });

        const payment = await prisma.payment.create({
            data: {
                studentId: req.user.id,
                amount: pkg.amount,
                packageType,
                lessonsIncluded: pkg.lessons,
                status: 'PENDING',
            },
        });

        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// Get student's payments
app.get('/api/payments/my', authenticateToken, authorize(['STUDENT']), async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            where: { studentId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Update payment status (simulate payment processing)
app.patch('/api/payments/:paymentId', authenticateToken, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { status } = req.body;

        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) return res.status(404).json({ error: 'Payment not found' });

        if (payment.studentId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updated = await prisma.payment.update({
            where: { id: paymentId },
            data: { status },
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

// Get admin payment overview
app.get('/api/admin/payments', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            include: { student: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        const stats = {
            total: payments.length,
            totalRevenue: payments.reduce((sum, p) => sum + (p.status === 'PAID' ? p.amount : 0), 0),
            paidTransactions: payments.filter((p) => p.status === 'PAID').length,
            pendingAmount: payments
                .filter((p) => p.status === 'PENDING')
                .reduce((sum, p) => sum + p.amount, 0),
        };

        res.json({ payments, stats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// ============ NOTIFICATIONS ============

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'STUDENT') {
            await generateLessonReminderNotifications(req.user.id);
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId', authenticateToken, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });

        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// ============ MESSAGING ============

// Send message
app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        const message = await prisma.message.create({
            data: {
                senderId: req.user.id,
                receiverId,
                content,
                isRead: false,
            },
        });

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get messages with a user
app.get('/api/messages/:peerId', authenticateToken, async (req, res) => {
    try {
        const { peerId } = req.params;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: req.user.id, receiverId: peerId },
                    { senderId: peerId, receiverId: req.user.id },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });

        // Mark as read
        await prisma.message.updateMany({
            where: { senderId: peerId, receiverId: req.user.id, isRead: false },
            data: { isRead: true },
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get message threads
app.get('/api/messages-threads', authenticateToken, async (req, res) => {
    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
            },
            orderBy: { createdAt: 'desc' },
        });

        const threadsMap = new Map();
        for (const msg of messages) {
            const peerId = msg.senderId === req.user.id ? msg.receiverId : msg.senderId;
            if (!threadsMap.has(peerId)) {
                threadsMap.set(peerId, msg);
            }
        }

        const threads = Array.from(threadsMap.values());
        const enriched = await Promise.all(
            threads.map(async (thread) => {
                const peerId = thread.senderId === req.user.id ? thread.receiverId : thread.senderId;
                const peer = await prisma.user.findUnique({
                    where: { id: peerId },
                    select: { id: true, name: true, role: true },
                });

                const unreadCount = await prisma.message.count({
                    where: {
                        senderId: peerId,
                        receiverId: req.user.id,
                        isRead: false,
                    },
                });

                return {
                    peerId,
                    peer,
                    lastMessage: thread.content,
                    lastAt: thread.createdAt,
                    unreadCount,
                };
            })
        );

        res.json(enriched);
    } catch (error) {
        console.error('Thread error:', error);
        res.status(500).json({ error: 'Failed to fetch threads' });
    }
});

// ============ FEEDBACK ============

// Submit feedback
app.post('/api/feedback', authenticateToken, authorize(['INSTRUCTOR', 'ADMIN']), async (req, res) => {
    try {
        const { studentId, ratingScore, evaluationNotes } = req.body;

        const feedback = await prisma.feedback.create({
            data: {
                studentId,
                authorId: req.user.id,
                ratingScore,
                evaluationNotes,
            },
        });

        // Create notification for student
        await prisma.notification.create({
            data: {
                userId: studentId,
                type: 'feedback_received',
                title: 'New Feedback',
                message: `Your instructor ${req.user.name} left feedback on your progress`,
                relatedId: feedback.id,
            },
        });

        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// Get feedback for a student
app.get('/api/feedback/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;

        const feedback = await prisma.feedback.findMany({
            where: { studentId },
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });

        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// ============ ANALYTICS (ADMIN) ============

// Get dashboard analytics
app.get('/api/admin/analytics', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const stats = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
            prisma.booking.count(),
            prisma.booking.count({ where: { status: 'COMPLETED' } }),
            prisma.payment.count({ where: { status: 'PAID' } }),
            prisma.payment.aggregate({
                where: { status: 'PAID' },
                _sum: { amount: true },
            }),
        ]);

        res.json({
            totalUsers: stats[0],
            totalStudents: stats[1],
            totalInstructors: stats[2],
            totalBookings: stats[3],
            completedBookings: stats[4],
            totalTransactions: stats[5],
            totalRevenue: stats[6]._sum.amount || 0,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// ============ QUIZ ============

const K53_QUESTIONS = [
    {
        id: 'q1',
        category: 'Rules',
        code: 'both',
        question: 'When approaching a STOP sign at a controlled intersection you must:',
        options: ['Slow down and continue if the road is clear', 'Come to a complete stop, then proceed when safe', 'Give way only to the right', 'Sound your hooter and proceed'],
        correct: 1,
    },
    {
        id: 'q2',
        category: 'Rules',
        code: 'both',
        question: 'The general speed limit on a public road within an urban area is:',
        options: ['100 km/h', '80 km/h', '60 km/h', '40 km/h'],
        correct: 2,
    },
    {
        id: 'q3',
        category: 'Rules',
        code: 'both',
        question: 'You may only overtake another vehicle when:',
        options: ['The road ahead is clear and you can see far enough to complete safely', 'The driver in front signals you to pass', 'You are in a hurry', 'The road markings say you can, no matter the visibility'],
        correct: 0,
    },
    {
        id: 'q4',
        category: 'Rules',
        code: 'both',
        question: 'At a 4-way stop the vehicle that has right of way is the one that:',
        options: ['Has the biggest engine', 'Arrived first at the intersection', 'Is on the right', 'Signals the loudest'],
        correct: 1,
    },
    {
        id: 'q5',
        category: 'Rules',
        code: '10',
        question: 'The maximum legal load a Code 10 vehicle may carry is determined by:',
        options: ["The driver's licence class", "The vehicle's Gross Vehicle Mass (GVM) on the licence disc", 'How full the fuel tank is', 'The number of passengers'],
        correct: 1,
    },
    {
        id: 'q6',
        category: 'Signs',
        code: 'both',
        question: 'A triangular sign with a red border is a:',
        options: ['Regulatory sign — you must obey it', 'Warning sign — hazard ahead', 'Guidance sign — information', 'Temporary sign — construction'],
        correct: 1,
    },
    {
        id: 'q7',
        category: 'Signs',
        code: 'both',
        question: 'A round sign with a red border and a diagonal red line means:',
        options: ['Compulsory action ahead', 'Prohibition — you may NOT do what is shown', 'Warning ahead', 'Yield to the vehicle shown'],
        correct: 1,
    },
    {
        id: 'q8',
        category: 'Controls',
        code: 'both',
        question: 'The clutch pedal is used to:',
        options: ['Accelerate the vehicle', 'Engage and disengage the engine from the gearbox', 'Apply the parking brake', 'Signal a turn'],
        correct: 1,
    },
    {
        id: 'q9',
        category: 'Controls',
        code: 'both',
        question: 'Before moving off, you should:',
        options: ['Check mirrors, signal, check blind spot, then move off', 'Only check the rear-view mirror', 'Blow the hooter first', 'Rev the engine loudly'],
        correct: 0,
    },
    {
        id: 'q10',
        category: 'Controls',
        code: 'both',
        question: 'The handbrake / parking brake should be applied:',
        options: ['Only when parking on a hill', 'Every time the vehicle is stationary and unattended', 'Never while the engine is running', 'Only in wet weather'],
        correct: 1,
    },
];

// Get quiz questions
app.get('/api/quiz/questions', authenticateToken, (req, res) => {
    const { count = 10, code = 'both' } = req.query;
    const filtered = K53_QUESTIONS.filter((q) => q.code === code || q.code === 'both');
    const shuffled = filtered.sort(() => 0.5 - Math.random()).slice(0, parseInt(count));
    const questions = shuffled.map(({ id, category, code: c, question, options }) => ({
        id,
        category,
        code: c,
        question,
        options,
    }));
    res.json(questions);
});

// Submit quiz attempt
app.post('/api/quiz/attempt', authenticateToken, async (req, res) => {
    try {
        const { licenseCode, answers } = req.body;

        const byId = Object.fromEntries(K53_QUESTIONS.map((q) => [q.id, q]));
        let correct = 0;
        const breakdown = [];

        for (const [qid, chosen] of Object.entries(answers)) {
            const q = byId[qid];
            if (!q) continue;
            const isRight = parseInt(chosen) === q.correct;
            if (isRight) correct++;
            breakdown.push({
                questionId: qid,
                question: q.question,
                chosen: parseInt(chosen),
                correct: q.correct,
                isRight,
            });
        }

        const total = Object.keys(answers).length;
        const percentScore = total > 0 ? Math.round((correct / total) * 100) : 0;
        const passed = correct >= Math.ceil((total * 3) / 4); // 75% pass

        const attempt = await prisma.quizAttempt.create({
            data: {
                userId: req.user.id,
                licenseCode,
                score: correct,
                total,
                percentScore,
                passed,
                answers: JSON.stringify(answers),
            },
        });

        res.json({ ...attempt, breakdown });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

// Get user's quiz attempts
app.get('/api/quiz/attempts', authenticateToken, async (req, res) => {
    try {
        const attempts = await prisma.quizAttempt.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        res.json(attempts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
});

// ============ VEHICLE MANAGEMENT ============

// Get all vehicles (Admin)
app.get('/api/admin/vehicles', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

// Create vehicle (Admin)
app.post('/api/admin/vehicles', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.create({
            data: req.body,
        });
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
});

// Update vehicle (Admin)
app.patch('/api/admin/vehicles/:id', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

// Delete vehicle (Admin)
app.delete('/api/admin/vehicles/:id', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        await prisma.vehicle.delete({
            where: { id: req.params.id },
        });
        res.json({ message: 'Vehicle deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

// ============ DOCUMENT MANAGEMENT ============

// Get user's documents
app.get('/api/documents', authenticateToken, async (req, res) => {
    try {
        const documents = await prisma.document.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Upload document
app.post('/api/documents', authenticateToken, async (req, res) => {
    try {
        const document = await prisma.document.create({
            data: {
                ...req.body,
                userId: req.user.id,
            },
        });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// Get all documents (Admin)
app.get('/api/admin/documents', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const documents = await prisma.document.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Approve/Reject document (Admin)
app.patch('/api/admin/documents/:id', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const document = await prisma.document.update({
            where: { id: req.params.id },
            data: {
                status,
                rejectionReason,
                reviewedBy: req.user.id,
                reviewedAt: new Date(),
            },
        });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update document' });
    }
});

// ============ ATTENDANCE MANAGEMENT ============

// Get instructor's attendance records
app.get('/api/attendance/instructor', authenticateToken, authorize(['INSTRUCTOR', 'ADMIN']), async (req, res) => {
    try {
        const attendance = await prisma.attendance.findMany({
            where: { instructorId: req.user.id },
            include: {
                student: true,
                booking: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Get student's attendance records
app.get('/api/attendance/student', authenticateToken, async (req, res) => {
    try {
        const attendance = await prisma.attendance.findMany({
            where: { studentId: req.user.id },
            include: {
                instructor: true,
                booking: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Mark attendance (Instructor)
app.post('/api/attendance', authenticateToken, authorize(['INSTRUCTOR', 'ADMIN']), async (req, res) => {
    try {
        const { bookingId, status, notes } = req.body;

        // Get booking details
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { slot: true },
        });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const attendance = await prisma.attendance.create({
            data: {
                bookingId,
                studentId: booking.studentId,
                instructorId: req.user.id,
                status,
                notes,
                checkInTime: status === 'PRESENT' ? new Date() : null,
            },
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// Update attendance (Instructor)
app.patch('/api/attendance/:id', authenticateToken, authorize(['INSTRUCTOR', 'ADMIN']), async (req, res) => {
    try {
        const attendance = await prisma.attendance.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update attendance' });
    }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'DriveMate API is running' });
});

// ============ SERVE FRONTEND (single-server deployment) ============

app.use(express.static(frontendBuildPath));

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
        if (err) {
            res.status(404).json({
                error: 'Frontend not built. Run: npm run build',
            });
        }
    });
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============

app.listen(PORT, () => {
    console.log(`🚗 DriveMate running at http://localhost:${PORT}`);
    console.log(`   Frontend + API served from a single server`);
    console.log(`   Database: SQLite (backend/prisma/dev.db)`);
});

export default app;

