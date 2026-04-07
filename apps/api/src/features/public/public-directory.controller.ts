import { Controller, Get, Headers, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { categoryLabel } from '../../category-display';
import { getLocale } from '../../i18n/locale-context';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Score used when sorting with optional interest boost (deterministic tie-breakers below). */
const INTEREST_MATCH_BOOST = 1_000_000;

@Controller('public')
export class PublicDirectoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Get('categories')
  listCategories() {
    const locale = getLocale();
    return this.prisma.category
      .findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameRo: true,
          nameRu: true,
          _count: { select: { specialists: true } },
        },
      })
      .then((rows) =>
        rows.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: categoryLabel(c, locale),
          specialistCount: c._count.specialists,
        })),
      );
  }

  @Get('specialists')
  async listDirectorySpecialists(
    @Headers('authorization') authorization: string | undefined,
    @Query('categorySlug') categorySlug?: string,
    @Query('sort') sort: 'rating' | 'name' | 'recommended' = 'rating',
  ) {
    const locale = getLocale();
    const user = await this.auth.tryGetUserFromToken(authorization);

    let interestCategoryIds: string[] = [];
    if (user?.role === 'CLIENT') {
      const interests = await this.prisma.clientInterest.findMany({
        where: { userId: user.id },
        select: { categoryId: true },
      });
      interestCategoryIds = interests.map((i) => i.categoryId);
    }

    const where =
      categorySlug && categorySlug.length > 0
        ? {
            categories: {
              some: {
                category: { slug: categorySlug, active: true },
              },
            },
          }
        : {};

    const rows = await this.prisma.specialistProfile.findMany({
      where,
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                slug: true,
                nameEn: true,
                nameRo: true,
                nameRu: true,
                active: true,
              },
            },
          },
        },
        services: {
          where: { active: true },
          take: 4,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
      },
    });

    const useInterestBoost = sort === 'recommended' && interestCategoryIds.length > 0;

    const scored = rows.map((sp) => {
      const categoryRows = sp.categories
        .filter((sc) => sc.category.active)
        .map((sc) => ({
          id: sc.category.id,
          slug: sc.category.slug,
          name: categoryLabel(sc.category, locale),
          isPrimary: sc.isPrimary,
        }));
      const interestMatch =
        useInterestBoost && sp.categories.some((sc) => interestCategoryIds.includes(sc.categoryId));
      const boost = interestMatch ? INTEREST_MATCH_BOOST : 0;
      return {
        specialist: sp,
        categoryRows,
        sortScore:
          boost +
          sp.averageRating * 10_000 +
          sp.reviewCount * 100 +
          (sp.displayName.toLowerCase().charCodeAt(0) ?? 0) * 0.001,
      };
    });

    scored.sort((a, b) => {
      if (sort === 'name') {
        return a.specialist.displayName.localeCompare(b.specialist.displayName);
      }
      if (b.sortScore !== a.sortScore) return b.sortScore - a.sortScore;
      return a.specialist.displayName.localeCompare(b.specialist.displayName);
    });

    return scored.map(({ specialist: sp, categoryRows }) => ({
      id: sp.id,
      slug: sp.slug,
      displayName: sp.displayName,
      timezone: sp.timezone,
      publicPhotoUrl: sp.publicPhotoUrl,
      publicBio: sp.publicBio,
      seoTitle: sp.seoTitle,
      averageRating: sp.averageRating,
      reviewCount: sp.reviewCount,
      categories: categoryRows,
      sampleServices: sp.services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
      })),
    }));
  }
}
