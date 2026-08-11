const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash('Admin123!', 12);
    await prisma.user.upsert({
      where: { email: 'admin@steeze.com' },
      update: { role: 'ADMIN', passwordHash: hash },
      create: {
        email: 'admin@steeze.com',
        passwordHash: hash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
      },
    });
    console.log('Admin user ready');
  } finally {
    await prisma.$disconnect();
  }
}
main();
