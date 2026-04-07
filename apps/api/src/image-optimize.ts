import sharp from 'sharp';

const MAX_EDGE_PX = 1600;
const WEBP_QUALITY = 80;

/**
 * Normalize uploads to WebP (smaller storage & bandwidth vs raw JPEG/PNG).
 * Keeps aspect ratio; does not upscale small images.
 */
export async function optimizeImageForUpload(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE_PX,
      height: MAX_EDGE_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
}
