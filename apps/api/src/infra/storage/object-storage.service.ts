import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';

function buildPublicReadPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly enabled: boolean;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT?.trim();
    const region = process.env.S3_REGION?.trim() || 'us-east-1';
    const accessKeyId = process.env.S3_ACCESS_KEY?.trim();
    const secretAccessKey = process.env.S3_SECRET_KEY?.trim();
    this.bucket = process.env.S3_BUCKET?.trim() || 'agenda-media';
    this.publicBaseUrl = (process.env.S3_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');

    this.enabled = Boolean(endpoint && accessKeyId && secretAccessKey && this.publicBaseUrl);

    if (!this.enabled) {
      this.logger.warn(
        'Object storage disabled (set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_BASE_URL).',
      );
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      await this.ensureBucketReady();
    } catch (e) {
      this.logger.error(`Object storage init failed: ${String(e)}`);
    }
  }

  isConfigured(): boolean {
    return this.enabled;
  }

  publicUrlForKey(objectKey: string): string {
    return `${this.publicBaseUrl}/${objectKey}`;
  }

  /** Parse object key from a stored public URL, if it belongs to this deployment. */
  tryParseObjectKeyFromPublicUrl(url: string): string | null {
    const u = url.trim();
    if (!u.startsWith(`${this.publicBaseUrl}/`)) return null;
    return u.slice(this.publicBaseUrl.length + 1);
  }

  async ensureBucketReady(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      this.logger.log(`Creating bucket ${this.bucket}`);
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: buildPublicReadPolicy(this.bucket),
      }),
    );
  }

  async putObjectBytes(objectKey: string, body: Buffer, contentType: string): Promise<void> {
    if (!this.client) {
      throw new ServiceUnavailableException();
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObjectByKey(objectKey: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    } catch (e) {
      this.logger.warn(`deleteObject failed for ${objectKey}: ${String(e)}`);
    }
  }

  avatarKey(specialistId: string): string {
    return `specialists/${specialistId}/avatar.webp`;
  }

  galleryKey(specialistId: string): string {
    return `specialists/${specialistId}/gallery/${randomUUID()}.webp`;
  }
}
