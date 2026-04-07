import { createHash } from 'node:crypto';
import { PrismaClient, type Role } from '@prisma/client';

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

function dbUrl(): string {
  const url = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Missing E2E_DATABASE_URL (preferred) or DATABASE_URL for E2E DB access.',
    );
  }
  return url;
}

let prismaSingleton: PrismaClient | null = null;

export function getE2EPrisma(): PrismaClient {
  if (!prismaSingleton) prismaSingleton = new PrismaClient({ datasourceUrl: dbUrl() });
  return prismaSingleton;
}

export async function resetDb() {
  const prisma = getE2EPrisma();

  const ignoreMissingTable = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    // Prisma error text differs by engine/provider; match the common Postgres phrasing we saw.
    if (msg.includes('does not exist') && msg.includes('table')) return;
    throw err;
  };

  // Order matters due to foreign keys. Run sequentially so we can ignore missing tables
  // (e.g. when DATABASE_URL points at a DB that hasn't been pushed/migrated yet).
  const safe = async (fn: () => Promise<unknown>) => fn().catch(ignoreMissingTable);

  await safe(() => prisma.booking.deleteMany({}));
  await safe(() => prisma.review.deleteMany({}));
  await safe(() => prisma.availabilityBlock.deleteMany({}));
  await safe(() => prisma.workingHoursRule.deleteMany({}));
  await safe(() => prisma.specialistGalleryImage.deleteMany({}));
  await safe(() => prisma.specialistCategory.deleteMany({}));
  await safe(() => prisma.clientInterest.deleteMany({}));

  await safe(() => prisma.service.deleteMany({}));
  await safe(() => prisma.serviceType.deleteMany({}));
  await safe(() => prisma.banner.deleteMany({}));
  await safe(() => prisma.category.deleteMany({}));

  await safe(() => prisma.specialistProfile.deleteMany({}));
  await safe(() => prisma.clientProfile.deleteMany({}));
  await safe(() => prisma.user.deleteMany({}));
}

export type SeededUser = { email: string; password: string; role: Role };
export type SeededSpecialist = {
  id: string;
  slug: string;
  displayName: string;
  timezone: string;
  serviceId: string;
  serviceName: string;
};

export async function seedBaseData(): Promise<{
  admin: SeededUser;
  client: SeededUser;
  specialistUser: SeededUser;
  specialist: SeededSpecialist;
  category: { id: string; slug: string; nameEn: string };
}> {
  const prisma = getE2EPrisma();

  const admin: SeededUser = {
    email: 'admin.e2e@agenda.local',
    password: 'AdminPass123!',
    role: 'ADMIN',
  };
  const client: SeededUser = {
    email: 'client.e2e@agenda.local',
    password: 'ClientPass123!',
    role: 'CLIENT',
  };
  const specialistUser: SeededUser = {
    email: 'spec.e2e@agenda.local',
    password: 'SpecPass123!',
    role: 'SPECIALIST',
  };

  await prisma.user.create({
    data: {
      email: admin.email,
      phone: '+10000000001',
      password: sha256(admin.password),
      role: admin.role,
    },
  });

  const clientRow = await prisma.user.create({
    data: {
      email: client.email,
      phone: '+10000000002',
      password: sha256(client.password),
      role: client.role,
      clientProfile: { create: {} },
    },
    select: { id: true },
  });

  const specUserRow = await prisma.user.create({
    data: {
      email: specialistUser.email,
      phone: '+10000000003',
      password: sha256(specialistUser.password),
      role: specialistUser.role,
      specialist: {
        create: {
          displayName: 'Dr. One',
          slug: 'doc-one',
          timezone: 'UTC',
          publicBio: 'Test bio',
        },
      },
    },
    include: { specialist: true },
  });

  const therapy = await prisma.category.create({
    data: {
      slug: 'therapy',
      nameEn: 'Therapy',
      nameRo: 'Terapie',
      nameRu: 'Терапия',
      sortOrder: 0,
      active: true,
    },
  });

  await prisma.specialistCategory.create({
    data: {
      specialistId: specUserRow.specialist!.id,
      categoryId: therapy.id,
      isPrimary: true,
    },
  });

  const service = await prisma.service.create({
    data: {
      specialistId: specUserRow.specialist!.id,
      name: 'Consult',
      durationMinutes: 30,
      bufferMinutes: 0,
      active: true,
    },
    select: { id: true, name: true },
  });

  await prisma.workingHoursRule.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      specialistId: specUserRow.specialist!.id,
      dayOfWeek,
      startLocal: '09:00',
      endLocal: '17:00',
    })),
  });

  // One approved review to make directory rating deterministic.
  await prisma.review.create({
    data: {
      specialistId: specUserRow.specialist!.id,
      authorUserId: clientRow.id,
      rating: 5,
      comment: 'Great session.',
      status: 'APPROVED',
    },
  });
  await prisma.specialistProfile.update({
    where: { id: specUserRow.specialist!.id },
    data: { averageRating: 5, reviewCount: 1 },
  });

  return {
    admin,
    client,
    specialistUser,
    specialist: {
      id: specUserRow.specialist!.id,
      slug: specUserRow.specialist!.slug,
      displayName: specUserRow.specialist!.displayName,
      timezone: specUserRow.specialist!.timezone,
      serviceId: service.id,
      serviceName: service.name,
    },
    category: { id: therapy.id, slug: therapy.slug, nameEn: therapy.nameEn },
  };
}

