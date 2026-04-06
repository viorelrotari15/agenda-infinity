import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DEFAULT_SITE_NAME, renderSpecialistPublicPage } from './specialist-public-page';

@Controller('p')
export class PublicSpecialistController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async specialistPage(@Param('slug') slug: string): Promise<string> {
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        displayName: true,
        slug: true,
        publicBio: true,
        seoTitle: true,
      },
    });
    if (!specialist) {
      throw new NotFoundException();
    }

    const serviceRows = await this.prisma.service.findMany({
      where: { specialistId: specialist.id, active: true },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const publicOrigin = (process.env.PUBLIC_APP_ORIGIN ?? 'http://127.0.0.1:5173').replace(
      /\/$/,
      '',
    );
    const siteName = process.env.PUBLIC_SITE_NAME ?? DEFAULT_SITE_NAME;

    return renderSpecialistPublicPage({
      displayName: specialist.displayName,
      slug: specialist.slug,
      publicBio: specialist.publicBio,
      seoTitle: specialist.seoTitle,
      serviceNames: serviceRows.map((s) => s.name),
      publicOrigin,
      siteName,
    });
  }
}
