import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.attendance.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.availabilitySlot.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.studentProgress.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️  Cleared existing data');

  // Seed Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'lesego@drivemate.co.za',
      name: 'Lesego Lebese',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: 'ADMIN',
      title: 'Technical Lead',
      phone: '+27 71 000 0000',
      bio: 'Senior driving instructor and technical lead at DriveMate. Passionate about safe driving education.',
    },
  });

  const instructorUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sipho.khumalo@drivemate.co.za',
        name: 'Sipho Khumalo',
        passwordHash: await bcrypt.hash('Instructor@123', 10),
        role: 'INSTRUCTOR',
        title: 'Senior Instructor',
        phone: '+27 72 111 1111',
        bio: 'Expert in manual transmission vehicles. 10+ years of teaching experience.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'thabo.mokoena@drivemate.co.za',
        name: 'Thabo Mokoena',
        passwordHash: await bcrypt.hash('Instructor@123', 10),
        role: 'INSTRUCTOR',
        title: 'Road Safety Specialist',
        phone: '+27 73 222 2222',
        bio: 'Focused on defensive driving techniques. Certified K53 examiner.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'naledi.ngobeni@drivemate.co.za',
        name: 'Naledi Ngobeni',
        passwordHash: await bcrypt.hash('Instructor@123', 10),
        role: 'INSTRUCTOR',
        title: 'Code 10 Specialist',
        phone: '+27 74 333 3333',
        bio: 'Specialized in heavy vehicle instruction for Code 10 licenses.',
      },
    }),
  ]);

  const studentUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'thando.zungu@example.co.za',
        name: 'Thando Zungu',
        passwordHash: await bcrypt.hash('Student@123', 10),
        role: 'STUDENT',
        phone: '+27 75 444 4444',
      },
    }),
    prisma.user.create({
      data: {
        email: 'lerato.ndlovu@example.co.za',
        name: 'Lerato Ndlovu',
        passwordHash: await bcrypt.hash('Student@123', 10),
        role: 'STUDENT',
        phone: '+27 76 555 5555',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bongani.mkhize@example.co.za',
        name: 'Bongani Mkhize',
        passwordHash: await bcrypt.hash('Student@123', 10),
        role: 'STUDENT',
        phone: '+27 77 666 6666',
      },
    }),
    prisma.user.create({
      data: {
        email: 'ayanda.motloung@example.co.za',
        name: 'Ayanda Motloung',
        passwordHash: await bcrypt.hash('Student@123', 10),
        role: 'STUDENT',
        phone: '+27 78 777 7777',
      },
    }),
    prisma.user.create({
      data: {
        email: 'zama.sithole@example.co.za',
        name: 'Zama Sithole',
        passwordHash: await bcrypt.hash('Student@123', 10),
        role: 'STUDENT',
        phone: '+27 79 888 8888',
      },
    }),
    prisma.user.create({
      data: {
        email: 'dudu.nkosi@example.co.za',
        name: 'Dudu Nkosi',
        passwordHash: await bcrypt.hash('Student@123', 10),
        role: 'STUDENT',
        phone: '+27 80 999 9999',
      },
    }),
    prisma.user.create({
      data: {
        email: 'simphiwe.mthembu@example.co.za',
        name: 'Simphiwe Mthembu',
        passwordHash: await bcrypt.hash('Student@123', 10),
        role: 'STUDENT',
        phone: '+27 81 101 0101',
      },
    }),
  ]);

  console.log('✅ Users created');

  // Seed Student Progress
  const progressRecords = await Promise.all(
    studentUsers.map((student, idx) => {
      const progressValues = [75, 40, 95, 60, 25, 55, 30];
      const ratingValues = [4.6, 4.2, 4.9, 4.5, 4.0, 4.3, 4.1];
      const completedLessons = [15, 8, 19, 12, 5, 11, 6];

      return prisma.studentProgress.create({
        data: {
          studentId: student.id,
          track: idx % 2 === 0 ? 'CODE_8' : 'CODE_10',
          progressPct: progressValues[idx],
          rating: ratingValues[idx],
          lessonNotes: 'Student showing good progress. Needs more work on hill starts and parking.',
          completedLessons: completedLessons[idx],
          totalLessons: 20,
        },
      });
    })
  );

  console.log('✅ Student progress created');

  // Seed Vehicles
  const vehicleRecords = await Promise.all([
    prisma.vehicle.create({
      data: {
        make: 'Toyota',
        model: 'Hilux 2.4D',
        year: 2021,
        licensePlate: 'CA 123 456',
        vehicleType: 'manual',
        code: 'CODE_10',
        status: 'AVAILABLE',
        currentMileage: 48200,
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'Volkswagen',
        model: 'Polo 1.4',
        year: 2019,
        licensePlate: 'CA 234 567',
        vehicleType: 'manual',
        code: 'CODE_8',
        status: 'AVAILABLE',
        currentMileage: 61120,
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'Nissan',
        model: 'NV200',
        year: 2020,
        licensePlate: 'CA 345 678',
        vehicleType: 'manual',
        code: 'CODE_8',
        status: 'AVAILABLE',
        currentMileage: 53410,
      },
    }),
  ]);

  const vehicleNames = vehicleRecords.map((vehicle) => `${vehicle.make} ${vehicle.model} (${vehicle.vehicleType} - ${vehicle.code})`);

  // Seed Availability Slots
  const today = new Date();
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  // Create slots for next 7 days
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const slotDate = new Date(today);
    slotDate.setDate(slotDate.getDate() + dayOffset);
    const dateStr = slotDate.toISOString().split('T')[0];

    for (let i = 0; i < vehicleRecords.length; i++) {
      for (let j = 0; j < timeSlots.length; j++) {
        const isBooked = Math.random() > 0.6;
        await prisma.availabilitySlot.create({
          data: {
            instructorId: instructorUsers[i % instructorUsers.length].id,
            date: dateStr,
            timeWindow: timeSlots[j],
            vehicle: vehicleNames[i],
            vehicleId: vehicleRecords[i].id,
            isBooked: isBooked,
            studentId: isBooked ? studentUsers[Math.floor(Math.random() * studentUsers.length)].id : null,
          },
        });
      }
    }
  }

  console.log('✅ Availability slots created');

  // Seed Bookings
  const bookingSlots = await prisma.availabilitySlot.findMany({
    where: { isBooked: true },
    take: 5,
  });

  for (const slot of bookingSlots) {
    await prisma.booking.create({
      data: {
        slotId: slot.id,
        studentId: slot.studentId || studentUsers[0].id,
        status: 'CONFIRMED',
      },
    });
  }

  console.log('✅ Bookings created');

  // Seed Payments
  const packages = ['single', 'starter', 'pro', 'full'];
  const packageDetails = {
    single: { amount: 500, lessons: 1 },
    starter: { amount: 2250, lessons: 5 },
    pro: { amount: 4000, lessons: 10 },
    full: { amount: 7500, lessons: 20 },
  };

  for (let i = 0; i < studentUsers.length; i++) {
    const pkg = packages[i % packages.length];
    const { amount, lessons } = packageDetails[pkg];
    await prisma.payment.create({
      data: {
        studentId: studentUsers[i].id,
        amount: amount,
        status: Math.random() > 0.3 ? 'PAID' : 'PENDING',
        packageType: pkg,
        lessonsIncluded: lessons,
      },
    });
  }

  console.log('✅ Payments created');

  // Seed Messages
  const messageCount = 5;
  for (let i = 0; i < messageCount; i++) {
    const from = instructorUsers[i % instructorUsers.length];
    const to = studentUsers[i % studentUsers.length];
    await prisma.message.create({
      data: {
        senderId: from.id,
        receiverId: to.id,
        content: `Hi ${to.name}, great progress in your last lesson! Keep practicing those parking maneuvers.`,
        isRead: Math.random() > 0.5,
      },
    });
  }

  console.log('✅ Messages created');

  // Seed Feedback
  for (let i = 0; i < progressRecords.length; i++) {
    await prisma.feedback.create({
      data: {
        studentId: progressRecords[i].id,
        authorId: instructorUsers[i % instructorUsers.length].id,
        ratingScore: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        evaluationNotes: 'Student demonstrates good vehicle control and awareness. Continue practicing in different weather conditions.',
      },
    });
  }

  console.log('✅ Feedback created');

  // Seed Quiz Attempts
  for (let i = 0; i < studentUsers.length; i++) {
    const score = Math.floor(Math.random() * 5) + 11; // 11-16 out of 20
    await prisma.quizAttempt.create({
      data: {
        userId: studentUsers[i].id,
        licenseCode: i % 2 === 0 ? '8' : '10',
        score: score,
        total: 20,
        percentScore: Math.round((score / 20) * 100),
        passed: score >= 15,
        answers: JSON.stringify({
          q1: 1, q2: 2, q3: 0, q4: 1, q5: 1,
          q6: 1, q7: 1, q8: 1, q9: 1, q10: 1,
          q11: 1, q12: 0, q13: 1, q14: 0, q15: 1,
          q16: 1, q17: 0, q18: 1, q19: 1, q20: 1,
        }),
      },
    });
  }

  console.log('✅ Quiz attempts created');

  // Seed Notifications
  for (let i = 0; i < studentUsers.length; i++) {
    await prisma.notification.create({
      data: {
        userId: studentUsers[i].id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: 'Your lesson is confirmed for tomorrow at 10:00 AM',
        isRead: false,
      },
    });
  }

  console.log('✅ Notifications created');

  console.log('✨ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

