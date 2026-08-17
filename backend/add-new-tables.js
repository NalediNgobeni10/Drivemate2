import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function addNewTables() {
  try {
    console.log('Adding new tables...');

    // Vehicle table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Vehicle (
        id TEXT PRIMARY KEY,
        make TEXT,
        model TEXT,
        year INTEGER,
        licensePlate TEXT UNIQUE,
        vehicleType TEXT,
        code TEXT,
        status TEXT DEFAULT 'AVAILABLE',
        currentMileage INTEGER DEFAULT 0,
        lastServiceDate DATETIME,
        nextServiceDate DATETIME,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Vehicle table created');

    // Document table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Document (
        id TEXT PRIMARY KEY,
        userId TEXT,
        documentType TEXT,
        fileName TEXT,
        fileUrl TEXT,
        fileSize INTEGER,
        mimeType TEXT,
        status TEXT DEFAULT 'PENDING',
        reviewedBy TEXT,
        reviewedAt DATETIME,
        rejectionReason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Document table created');

    // Attendance table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Attendance (
        id TEXT PRIMARY KEY,
        bookingId TEXT UNIQUE,
        studentId TEXT,
        instructorId TEXT,
        status TEXT DEFAULT 'PRESENT',
        checkInTime DATETIME,
        checkOutTime DATETIME,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bookingId) REFERENCES Booking(id) ON DELETE CASCADE,
        FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (instructorId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Attendance table created');

    console.log('All new tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addNewTables();
