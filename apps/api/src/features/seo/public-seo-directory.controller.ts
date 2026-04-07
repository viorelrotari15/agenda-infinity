import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { renderCategorySeoPage, renderDirectorySeoPage } from '../../directory-public-page';
import { DEFAULT_SITE_NAME } from '../../specialist-public-page';
import { getLocale } from '../../i18n/locale-context';
import { categoryLabel } from '../../category-display';

@Controller('seo')
export class PublicSeoDirectoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('directory')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async directoryPage(): Promise<string> {
    const [specialistCount, categoryCount] = await Promise.all([
      this.prisma.specialistProfile.count(),
      this.prisma.category.count({ where: { active: true } }),
    ]);
    const publicOrigin = (process.env.PUBLIC_APP_ORIGIN ?? 'http://127.0.0.1:5173').replace(
      /\/$/,
      '',
    );
    const siteName = process.env.PUBLIC_SITE_NAME ?? DEFAULT_SITE_NAME;
    return renderDirectorySeoPage({
      siteName,
      publicOrigin,
      specialistCount,
      categoryCount,
    });
  }

  @Get('category/:slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async categoryPage(@Param('slug') slug: string): Promise<string> {
    const category = await this.prisma.category.findFirst({
      where: { slug, active: true },
    });
    if (!category) {
      throw new NotFoundException();
    }
    const locale = getLocale();
    const specialistCount = await this.prisma.specialistCategory.count({
      where: { categoryId: category.id },
    });
    const publicOrigin = (process.env.PUBLIC_APP_ORIGIN ?? 'http://127.0.0.1:5173').replace(
      /\/$/,
      '',
    );
    const siteName = process.env.PUBLIC_SITE_NAME ?? DEFAULT_SITE_NAME;
    return renderCategorySeoPage({
      siteName,
      publicOrigin,
      slug: category.slug,
      categoryName: categoryLabel(category, locale),
      specialistCount,
    });
  }
}
