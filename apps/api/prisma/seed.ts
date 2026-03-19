import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  await prisma.priceTrend.createMany({ data: [
    { panelType: 'RPP',  trend: 'DOWN', changePct: -3.2 },
    { panelType: 'EGI',  trend: 'DOWN', changePct: -1.8 },
    { panelType: '스틸', trend: 'FLAT', changePct: 0.0  },
  ], skipDuplicates: true });
  console.log('✅ Price trends seeded');

  const adminPw = await bcrypt.hash('admin2026!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@axis.kr' },
    update: {},
    create: { email: 'admin@axis.kr', password: adminPw, role: 'ADMIN', companyName: 'AXIS' },
  });

  const gapPw = await bcrypt.hash('test1234', 10);
  await prisma.user.upsert({
    where: { email: 'gap@test.com' },
    update: {},
    create: { email: 'gap@test.com', password: gapPw, role: 'GAP', companyName: '테스트건설' },
  });

  const eulPw = await bcrypt.hash('test1234', 10);
  await prisma.user.upsert({
    where: { email: 'eul@test.com' },
    update: {},
    create: { email: 'eul@test.com', password: eulPw, role: 'EUL', companyName: '테스트시공' },
  });
  console.log('✅ Users seeded');
}

main().then(() => prisma.$disconnect());
