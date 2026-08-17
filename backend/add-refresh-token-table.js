import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function addRefreshTokenTable() {
  try {
    console.log('Adding RefreshToken table...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS RefreshToken (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE,
        userId TEXT,
        expiresAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    
    console.log('RefreshToken table created successfully');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRefreshTokenTable();
