import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from '../auth/auth.service';
import { apiT } from '../../i18n/api-messages';
import { optimizeImageForUpload } from '../../image-optimize';
import { ObjectStorageService } from '../../infra/storage/object-storage.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 20;

@Controller()
export class SpecialistMediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly storage: ObjectStorageService,
  ) {}

  @Get('specialist/media')
  async listGallery(@Headers('authorization') authorization: string | undefined) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'SPECIALIST') throw new BadRequestException(apiT('specialist_role_required'));

    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    return this.prisma.specialistGalleryImage.findMany({
      where: { specialistId: specialist.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, publicUrl: true, sortOrder: true, createdAt: true },
    });
  }

  @Post('specialist/media')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_BYTES },
    }),
  )
  async upload(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file: Express.Multer.File | undefined,
    // multipart field (not stripped by global ValidationPipe — no DTO class here)
    @Body('purpose') purposeRaw: string | undefined,
  ) {
    if (!this.storage.isConfigured()) {
      throw new ServiceUnavailableException(apiT('storage_not_configured'));
    }

    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'SPECIALIST') throw new BadRequestException(apiT('specialist_role_required'));

    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    const purpose = typeof purposeRaw === 'string' ? purposeRaw.trim() : '';
    if (purpose !== 'avatar' && purpose !== 'gallery') {
      throw new BadRequestException(apiT('media_purpose_invalid'));
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException(apiT('media_file_missing'));
    }

    const galleryCount = await this.prisma.specialistGalleryImage.count({
      where: { specialistId: specialist.id },
    });
    if (purpose === 'gallery' && galleryCount >= MAX_GALLERY_IMAGES) {
      throw new BadRequestException(apiT('gallery_limit'));
    }

    let optimized: Buffer;
    try {
      optimized = await optimizeImageForUpload(file.buffer);
    } catch {
      throw new BadRequestException(apiT('image_invalid'));
    }

    const objectKey =
      purpose === 'avatar'
        ? this.storage.avatarKey(specialist.id)
        : this.storage.galleryKey(specialist.id);
    const publicUrl = this.storage.publicUrlForKey(objectKey);

    await this.storage.putObjectBytes(objectKey, optimized, 'image/webp');

    if (purpose === 'avatar') {
      const prev = specialist.publicPhotoUrl;
      await this.prisma.specialistProfile.update({
        where: { id: specialist.id },
        data: { publicPhotoUrl: publicUrl },
      });
      const prevKey = prev ? this.storage.tryParseObjectKeyFromPublicUrl(prev) : null;
      if (prevKey && prevKey !== objectKey) {
        await this.storage.deleteObjectByKey(prevKey);
      }
      return { kind: 'avatar' as const, publicUrl };
    }

    const row = await this.prisma.specialistGalleryImage.create({
      data: {
        specialistId: specialist.id,
        objectKey,
        publicUrl,
        sortOrder: galleryCount,
      },
      select: { id: true, publicUrl: true, sortOrder: true, createdAt: true },
    });
    return { kind: 'gallery' as const, ...row };
  }

  @Delete('specialist/media/:id')
  async deleteGallery(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    if (!this.storage.isConfigured()) {
      throw new ServiceUnavailableException(apiT('storage_not_configured'));
    }

    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'SPECIALIST') throw new BadRequestException(apiT('specialist_role_required'));

    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    const row = await this.prisma.specialistGalleryImage.findFirst({
      where: { id, specialistId: specialist.id },
    });
    if (!row) throw new BadRequestException(apiT('media_not_found'));

    await this.storage.deleteObjectByKey(row.objectKey);
    await this.prisma.specialistGalleryImage.delete({ where: { id: row.id } });
    return { ok: true as const };
  }
}
