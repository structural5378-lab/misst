/**
 * Media Upload Service — Orchestrates file validation, storage, and processing.
 */

import { imageValidator } from './validators/image.validator';
import { storage } from './storage/base44.storage';
import { imageProcessingService } from './image-processing.service';
import { signedUrlService } from './signed-url.service';
import { AppError } from '../utils/errors';

export class UploadService {
  async uploadImage(file: Buffer, mimeType: string, fileName: string): Promise<{ file_url: string; thumbnail_url?: string }> {
    // Validate
    imageValidator.validate(file, mimeType);

    // Upload original
    const { file_url } = await storage.upload(file, mimeType, fileName);

    // Generate thumbnail
    let thumbnail_url: string | undefined;
    try {
      const thumbnail = await imageProcessingService.createThumbnail(file, 300);
      const thumbResult = await storage.upload(thumbnail, 'image/jpeg', `thumb_${fileName}`);
      thumbnail_url = thumbResult.file_url;
    } catch {
      // Thumbnail generation is best-effort
    }

    return { file_url, thumbnail_url };
  }

  async getSignedUrl(fileUri: string, expiresIn = 300): Promise<string> {
    return signedUrlService.create(fileUri, expiresIn);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    await storage.delete(fileUrl);
  }
}

export const uploadService = new UploadService();