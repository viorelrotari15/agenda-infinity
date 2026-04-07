import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { apiT } from '../../i18n/api-messages';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Controller('specialists')
export class SpecialistReviewsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Get(':specialistId/reviews')
  async listReviews(
    @Param('specialistId') specialistId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { id: specialistId },
      select: { id: true },
    });
    if (!specialist) throw new NotFoundException(apiT('specialist_not_found'));

    const limit = Math.min(50, Math.max(1, parseInt(limitRaw ?? '20', 10) || 20));

    const items = await this.prisma.review.findMany({
      where: { specialistId, status: 'APPROVED' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    const page = items.length > limit ? items.slice(0, limit) : items;
    if (items.length > limit) {
      nextCursor = page[page.length - 1]?.id ?? null;
    }

    return {
      items: page.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        authorLabel: maskEmail(r.author.email),
      })),
      nextCursor,
    };
  }

  @Post(':specialistId/reviews')
  async createReview(
    @Headers('authorization') authorization: string | undefined,
    @Param('specialistId') specialistId: string,
    @Body() body: { rating: number; comment: string },
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'CLIENT') {
      throw new ForbiddenException(apiT('client_role_required'));
    }

    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { id: specialistId },
      select: { id: true, userId: true },
    });
    if (!specialist) throw new NotFoundException(apiT('specialist_not_found'));
    if (specialist.userId === user.id) {
      throw new BadRequestException(apiT('review_self_specialist'));
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException(apiT('review_rating_invalid'));
    }
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    if (comment.length < 3) throw new BadRequestException(apiT('review_comment_short'));
    if (comment.length > 2000) throw new BadRequestException(apiT('review_comment_long'));

    await this.prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    try {
      const review = await this.prisma.review.create({
        data: {
          specialistId,
          authorUserId: user.id,
          rating,
          comment,
          status: 'PENDING',
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });
      return {
        id: review.id,
        status: review.status,
        createdAt: review.createdAt.toISOString(),
      };
    } catch (e: unknown) {
      const code =
        typeof e === 'object' && e && 'code' in e ? String((e as { code: string }).code) : '';
      if (code === 'P2002') {
        throw new BadRequestException(apiT('review_already_exists'));
      }
      throw e;
    }
  }
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 1) return '•••';
  return `${email[0]}•••@${email.slice(at + 1)}`;
}
