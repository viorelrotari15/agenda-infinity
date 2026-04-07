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
      publicPhotoUrl: 'https://picsum.photos/seed/dr-iona-martin/400/400',
      publicBio:
        'Licensed physiotherapist offering massage therapy, rehabilitation, and treatment planning. Book online for flexible appointment times.',
      seoTitle: 'Dr. Iona Martin — Physiotherapy & massage',
    },
  });

  const categoryDefs = [
    {
      slug: 'beauty',
      nameEn: 'Beauty',
      nameRo: 'Frumusețe',
      nameRu: 'Красота',
      sortOrder: 0,
    },
    {
      slug: 'therapy',
      nameEn: 'Therapy',
      nameRo: 'Terapie',
      nameRu: 'Терапия',
      sortOrder: 1,
    },
    {
      slug: 'medical',
      nameEn: 'Medical',
      nameRo: 'Medical',
      nameRu: 'Медицина',
      sortOrder: 2,
    },
    {
      slug: 'wellness',
      nameEn: 'Wellness',
      nameRo: 'Wellness',
      nameRu: 'Велнес',
      sortOrder: 3,
    },
    {
      slug: 'fitness',
      nameEn: 'Fitness',
      nameRo: 'Fitness',
      nameRu: 'Фитнес',
      sortOrder: 4,
    },
    {
      slug: 'dental',
      nameEn: 'Dental',
      nameRo: 'Stomatologie',
      nameRu: 'Стоматология',
      sortOrder: 5,
    },
    {
      slug: 'mental_health',
      nameEn: 'Mental health',
      nameRo: 'Sănătate mintală',
      nameRu: 'Психическое здоровье',
      sortOrder: 6,
    },
    {
      slug: 'nutrition',
      nameEn: 'Nutrition',
      nameRo: 'Nutriție',
      nameRu: 'Питание',
      sortOrder: 7,
    },
    {
      slug: 'other',
      nameEn: 'Other',
      nameRo: 'Altele',
      nameRu: 'Другое',
      sortOrder: 99,
    },
  ] as const;

  const categories = await Promise.all(
    categoryDefs.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {
          nameEn: c.nameEn,
          nameRo: c.nameRo,
          nameRu: c.nameRu,
          sortOrder: c.sortOrder,
          active: true,
        },
        create: {
          slug: c.slug,
          nameEn: c.nameEn,
          nameRo: c.nameRo,
          nameRu: c.nameRu,
          sortOrder: c.sortOrder,
          active: true,
        },
      }),
    ),
  );

  const therapyCat = categories.find((x) => x.slug === 'therapy');
  const wellnessCat = categories.find((x) => x.slug === 'wellness');
  if (therapyCat && wellnessCat) {
    await prisma.specialistCategory.upsert({
      where: {
        specialistId_categoryId: { specialistId: specialist.id, categoryId: therapyCat.id },
      },
      update: { isPrimary: true },
      create: {
        specialistId: specialist.id,
        categoryId: therapyCat.id,
        isPrimary: true,
      },
    });
    await prisma.specialistCategory.upsert({
      where: {
        specialistId_categoryId: { specialistId: specialist.id, categoryId: wellnessCat.id },
      },
      update: { isPrimary: false },
      create: {
        specialistId: specialist.id,
        categoryId: wellnessCat.id,
        isPrimary: false,
      },
    });
  }

  const clientEmail = 'client.demo@agenda.local';
  const clientPassword = 'ClientPass123!';
  const clientUser = await prisma.user.upsert({
    where: { email: clientEmail },
    update: { password: hashPassword(clientPassword), role: 'CLIENT', phone: '+40700000002' },
    create: {
      email: clientEmail,
      phone: '+40700000002',
      password: hashPassword(clientPassword),
      role: 'CLIENT',
      clientProfile: { create: {} },
    },
  });
  await prisma.clientProfile.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: { userId: clientUser.id },
  });
  if (therapyCat) {
    await prisma.clientInterest.upsert({
      where: {
        userId_categoryId: { userId: clientUser.id, categoryId: therapyCat.id },
      },
      update: {},
      create: { userId: clientUser.id, categoryId: therapyCat.id },
    });
  }

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

  const extraSpecialistDefs = [
    {
      email: 'maria.popescu@agenda.local',
      phone: '+40700000011',
      slug: 'maria-popescu-beauty',
      displayName: 'Maria Popescu',
      publicBio:
        'Makeup artist and skincare consultant. Personalized looks for events and everyday confidence.',
      seoTitle: 'Maria Popescu — Beauty & skincare',
      primaryCategorySlug: 'beauty',
      secondaryCategorySlugs: ['wellness'] as const,
      rating: 4.7,
      reviewComment: 'Lovely atmosphere and great advice.',
    },
    {
      email: 'alex.dumitru@agenda.local',
      phone: '+40700000012',
      slug: 'alex-dumitru-fitness',
      displayName: 'Alex Dumitru',
      publicBio: 'Personal trainer focused on sustainable strength and mobility programs.',
      seoTitle: 'Alex Dumitru — Personal training',
      primaryCategorySlug: 'fitness',
      secondaryCategorySlugs: ['wellness'] as const,
      rating: 4.3,
      reviewComment: 'Clear plans and motivating sessions.',
    },
    {
      email: 'elena.vasile@agenda.local',
      phone: '+40700000013',
      slug: 'elena-vasile-dental',
      displayName: 'Dr. Elena Vasile',
      publicBio:
        'General dentistry with a gentle approach — checkups, hygiene, and restorative care.',
      seoTitle: 'Dr. Elena Vasile — Dental care',
      primaryCategorySlug: 'dental',
      secondaryCategorySlugs: ['medical'] as const,
      rating: 4.9,
      reviewComment: 'Very thorough and calm.',
    },
    {
      email: 'mihai.ionescu@agenda.local',
      phone: '+40700000014',
      slug: 'mihai-ionescu-nutrition',
      displayName: 'Mihai Ionescu',
      publicBio: 'Nutrition coaching for busy professionals — meal planning and habit building.',
      seoTitle: 'Mihai Ionescu — Nutrition coaching',
      primaryCategorySlug: 'nutrition',
      secondaryCategorySlugs: ['wellness'] as const,
      rating: 4.1,
      reviewComment: 'Practical tips that stuck.',
    },
    {
      email: 'ana.radu@agenda.local',
      phone: '+40700000015',
      slug: 'ana-radu-mental-health',
      displayName: 'Ana Radu',
      publicBio: 'Counselling for stress, anxiety, and life transitions — online and in-person.',
      seoTitle: 'Ana Radu — Counselling',
      primaryCategorySlug: 'mental_health',
      secondaryCategorySlugs: ['therapy'] as const,
      rating: 4.6,
      reviewComment: 'Felt heard and supported.',
    },
  ] as const;

  const extraDemoPassword = password;

  for (const ex of extraSpecialistDefs) {
    const existingUser = await prisma.user.findUnique({
      where: { email: ex.email },
      include: { specialist: true },
    });

    const exUser = existingUser
      ? await prisma.user.update({
          where: { email: ex.email },
          data: {
            password: hashPassword(extraDemoPassword),
            role: 'SPECIALIST',
            phone: ex.phone,
          },
          include: { specialist: true },
        })
      : await prisma.user.create({
          data: {
            email: ex.email,
            phone: ex.phone,
            password: hashPassword(extraDemoPassword),
            role: 'SPECIALIST',
          },
          include: { specialist: true },
        });

    const exSpec =
      exUser.specialist ??
      (await prisma.specialistProfile.create({
        data: {
          userId: exUser.id,
          displayName: ex.displayName,
          slug: ex.slug,
          timezone: 'Europe/Bucharest',
        },
      }));

    await prisma.specialistProfile.update({
      where: { id: exSpec.id },
      data: {
        displayName: ex.displayName,
        slug: ex.slug,
        timezone: 'Europe/Bucharest',
        publicPhotoUrl: `https://picsum.photos/seed/${ex.slug}/400/400`,
        publicBio: ex.publicBio,
        seoTitle: ex.seoTitle,
      },
    });

    const primaryCat = categories.find((c) => c.slug === ex.primaryCategorySlug);
    if (primaryCat) {
      await prisma.specialistCategory.upsert({
        where: {
          specialistId_categoryId: { specialistId: exSpec.id, categoryId: primaryCat.id },
        },
        update: { isPrimary: true },
        create: {
          specialistId: exSpec.id,
          categoryId: primaryCat.id,
          isPrimary: true,
        },
      });
    }
    for (const slug of ex.secondaryCategorySlugs) {
      const cat = categories.find((c) => c.slug === slug);
      if (!cat) continue;
      await prisma.specialistCategory.upsert({
        where: {
          specialistId_categoryId: { specialistId: exSpec.id, categoryId: cat.id },
        },
        update: { isPrimary: false },
        create: {
          specialistId: exSpec.id,
          categoryId: cat.id,
          isPrimary: false,
        },
      });
    }

    const exServices = [
      {
        name: 'Initial Consultation',
        durationMinutes: 45,
        bufferMinutes: 15,
        serviceTypeId: stConsult.id,
      },
      { name: 'Follow-up Session', durationMinutes: 30, bufferMinutes: 10 },
    ];

    for (const service of exServices) {
      await prisma.service.upsert({
        where: { id: `${exSpec.id}:${service.name}` },
        update: {
          durationMinutes: service.durationMinutes,
          bufferMinutes: service.bufferMinutes,
          active: true,
          serviceTypeId: service.serviceTypeId ?? null,
        },
        create: {
          id: `${exSpec.id}:${service.name}`,
          specialistId: exSpec.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          bufferMinutes: service.bufferMinutes,
          active: true,
          serviceTypeId: service.serviceTypeId ?? null,
        },
      });
    }

    await prisma.workingHoursRule.deleteMany({ where: { specialistId: exSpec.id } });
    await prisma.workingHoursRule.createMany({
      data: rules.map((rule) => ({
        specialistId: exSpec.id,
        ...rule,
      })),
    });

    const existingReview = await prisma.review.findFirst({
      where: { specialistId: exSpec.id, authorUserId: clientUser.id },
    });
    if (!existingReview) {
      const rounded = Math.round(ex.rating);
      await prisma.review.create({
        data: {
          specialistId: exSpec.id,
          authorUserId: clientUser.id,
          rating: rounded,
          comment: ex.reviewComment,
          status: 'APPROVED',
        },
      });
      await prisma.specialistProfile.update({
        where: { id: exSpec.id },
        data: { averageRating: ex.rating, reviewCount: 1 },
      });
    }
  }

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

  const approvedReview = await prisma.review.findFirst({
    where: { specialistId: specialist.id, authorUserId: clientUser.id },
  });
  if (!approvedReview) {
    await prisma.review.create({
      data: {
        specialistId: specialist.id,
        authorUserId: clientUser.id,
        rating: 5,
        comment: 'Great session, very professional.',
        status: 'APPROVED',
      },
    });
    await prisma.specialistProfile.update({
      where: { id: specialist.id },
      data: { averageRating: 5, reviewCount: 1 },
    });
  }

  await prisma.$disconnect();

  console.log('Seeded accounts:');
  console.log(`  admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  specialist (primary demo): ${email} / ${password} (${slug})`);
  console.log(
    `  + ${extraSpecialistDefs.length} more specialists (same password ${extraDemoPassword} — see extraSpecialistDefs in seed.ts)`,
  );
  console.log(`  client: ${clientEmail} / ${clientPassword}`);
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
