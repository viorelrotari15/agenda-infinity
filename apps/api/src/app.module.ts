import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminController } from './admin.controller';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { NotificationsService } from './notifications.service';
import { AuthService } from './auth.service';
import { LocaleInterceptor } from './i18n/locale.interceptor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me',
    }),
  ],
  controllers: [AppController, AdminController],
  providers: [
    PrismaService,
    NotificationsService,
    AuthService,
    { provide: APP_INTERCEPTOR, useClass: LocaleInterceptor },
  ],
})
export class AppModule {}
