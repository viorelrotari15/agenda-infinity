import { Injectable } from '@nestjs/common';
import { Prisma, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async recalcSpecialistAggregates(
    tx: Prisma.TransactionClient,
    specialistId: string,
  ): Promise<void> {
    const agg = await tx.review.aggregate({
      where: { specialistId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await tx.specialistProfile.update({
      where: { id: specialistId },
      data: {
        averageRating: agg._avg.rating ?? 0,
        reviewCount: agg._count._all,
      },
    });
  }

  async setReviewStatus(reviewId: string, status: ReviewStatus): Promise<{ specialistId: string }> {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id: reviewId },
        data: { status },
        select: { specialistId: true },
      });
      await this.recalcSpecialistAggregates(tx, review.specialistId);
      return { specialistId: review.specialistId };
    });
  }
}
