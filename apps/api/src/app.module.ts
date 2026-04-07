import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminController } from './features/admin/admin.controller';
import { AppController } from './features/app/app.controller';
import { ClientInterestsController } from './features/client/client-interests.controller';
import { PublicDirectoryController } from './features/public/public-directory.controller';
import { PublicSeoDirectoryController } from './features/seo/public-seo-directory.controller';
import { PublicSpecialistController } from './features/public/public-specialist.controller';
import { SpecialistMediaController } from './features/specialists/specialist-media.controller';
import { SpecialistReviewsController } from './features/specialists/specialist-reviews.controller';
import { PrismaService } from './infra/prisma/prisma.service';
import { ObjectStorageService } from './infra/storage/object-storage.service';
import { NotificationsService } from './infra/notifications/notifications.service';
import { AuthService } from './features/auth/auth.service';
import { ReviewsService } from './features/reviews/reviews.service';
import { LocaleInterceptor } from './i18n/locale.interceptor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me',
    }),
  ],
  controllers: [
    AppController,
    AdminController,
    PublicSpecialistController,
    PublicDirectoryController,
    SpecialistReviewsController,
    SpecialistMediaController,
    ClientInterestsController,
    PublicSeoDirectoryController,
  ],
  providers: [
    PrismaService,
    ObjectStorageService,
    NotificationsService,
    AuthService,
    ReviewsService,
    { provide: APP_INTERCEPTOR, useClass: LocaleInterceptor },
  ],
})
export class AppModule {}
