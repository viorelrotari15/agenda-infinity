import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

function hashPassword(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

async function main() {
  const prisma = new PrismaClient();

  const adminEmail = 'admin@agenda.local';
  const adminPassword = 'AdminPass123!';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashPassword(adminPassword), role: 'ADMIN', phone: '+10000000000' },
    create: {
      email: adminEmail,
      phone: '+10000000000',
      password: hashPassword(adminPassword),
      role: 'ADMIN',
    },
  });

  const email = 'specialist.demo@agenda.local';
  const password = 'DemoPass123!';
  const slug = 'dr-iona-martin';

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { specialist: true },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { email },
        data: {
          password: hashPassword(password),
          role: 'SPECIALIST',
          phone: '+40700000001',
        },
        include: { specialist: true },
      })
    : await prisma.user.create({
        data: {
          email,
          phone: '+40700000001',
          password: hashPassword(password),
          role: 'SPECIALIST',
        },
        include: { specialist: true },
      });

  const specialist =
    user.specialist ??
    (await prisma.specialistProfile.create({
      data: {
        userId: user.id,
        displayName: 'Dr. Iona Martin',
        slug,
        timezone: 'Europe/Bucharest',
      },
    }));

  await prisma.specialistProfile.update({
    where: { id: specialist.id },
    data: {
      displayName: 'Dr. Iona Martin',
      slug,
      timezone: 'Europe/Bucharest',
      publicBio:
        'Licensed physiotherapist offering massage therapy, rehabilitation, and treatment planning. Book online for flexible appointment times.',
      seoTitle: 'Dr. Iona Martin — Physiotherapy & massage',
    },
  });

  const stConsult = await prisma.serviceType.upsert({
    where: { id: 'seed-type-consult' },
    update: {},
    create: {
      id: 'seed-type-consult',
      name: 'Consultation',
      defaultDurationMinutes: 45,
      defaultBufferMinutes: 15,
      sortOrder: 0,
      active: true,
    },
  });

  await prisma.serviceType.upsert({
    where: { id: 'seed-type-followup' },
    update: {},
    create: {
      id: 'seed-type-followup',
      name: 'Follow-up',
      defaultDurationMinutes: 30,
      defaultBufferMinutes: 10,
      sortOrder: 1,
      active: true,
    },
  });

  const services = [
    {
      name: 'Initial Consultation',
      durationMinutes: 45,
      bufferMinutes: 15,
      serviceTypeId: stConsult.id,
    },
    { name: 'Follow-up Session', durationMinutes: 30, bufferMinutes: 10 },
    { name: 'Online Consultation', durationMinutes: 25, bufferMinutes: 5 },
    { name: 'Treatment Planning', durationMinutes: 60, bufferMinutes: 15 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: {
        id: `${specialist.id}:${service.name}`,
      },
      update: {
        durationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
        active: true,
        serviceTypeId: service.serviceTypeId ?? null,
      },
      create: {
        id: `${specialist.id}:${service.name}`,
        specialistId: specialist.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
        active: true,
        serviceTypeId: service.serviceTypeId ?? null,
      },
    });
  }

  await prisma.workingHoursRule.deleteMany({
    where: { specialistId: specialist.id },
  });

  const rules = [
    { dayOfWeek: 1, startLocal: '09:00', endLocal: '17:00' },
    { dayOfWeek: 2, startLocal: '09:00', endLocal: '17:00' },
    { dayOfWeek: 3, startLocal: '10:00', endLocal: '18:00' },
    { dayOfWeek: 4, startLocal: '09:00', endLocal: '17:00' },
    { dayOfWeek: 5, startLocal: '09:00', endLocal: '15:00' },
  ];

  await prisma.workingHoursRule.createMany({
    data: rules.map((rule) => ({
      specialistId: specialist.id,
      ...rule,
    })),
  });

  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          imageUrl: 'https://picsum.photos/seed/agenda-banner-1/1400/600',
          title: 'Book care that fits your life',
          subtitle: 'Transparent availability · calm scheduling',
          sortOrder: 0,
          active: true,
        },
        {
          imageUrl: 'https://picsum.photos/seed/agenda-banner-2/1400/600',
          title: 'Specialists you can trust',
          subtitle: 'Services tailored to your needs',
          sortOrder: 1,
          active: true,
        },
      ],
    });
  }

  await prisma.$disconnect();

  console.log('Seeded accounts:');
  console.log(`  admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  specialist: ${email} / ${password} (${slug})`);
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
