import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs-extra';
import { MediaService } from '../media/media.service';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  density?: number;
  hasAlpha: boolean;
  channels: number;
  space: string;
  depth: string;
  exif?: any;
}

export interface ImageOptimizationOptions {
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  background?: string;
  withoutEnlargement?: boolean;
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(
    @Inject(forwardRef(() => MediaService))
    private readonly mediaService: MediaService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Get image dimensions and basic metadata
   */
  async getImageDimensions(filePath: string): Promise<ImageDimensions> {
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get image dimensions for ${filePath}:`, error);
      throw new Error(`Could not read image dimensions: ${error.message}`);
    }
  }

  /**
   * Get comprehensive image metadata
   */
  async getImageMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: (await fs.stat(filePath)).size,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha || false,
        channels: metadata.channels || 0,
        space: metadata.space || 'unknown',
        depth: metadata.depth || 'unknown',
        exif: metadata.exif,
      };
    } catch (error) {
      this.logger.error(`Failed to get image metadata for ${filePath}:`, error);
      throw new Error(`Could not read image metadata: ${error.message}`);
    }
  }

  /**
   * Optimize image with various options
   */
  async optimizeImage(
    input: string | Buffer,
    outputPath: string,
    options: ImageOptimizationOptions = {},
  ): Promise<{ path: string; size: number; dimensions: ImageDimensions }> {
    try {
      const {
        quality = 80,
        format = 'jpeg',
        width,
        height,
        fit = 'cover',
        position = 'center',
        background = '#ffffff',
        withoutEnlargement = true,
      } = options;

      let sharpInstance = sharp(input);

      // Resize if dimensions are provided
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit,
          position,
          background,
          withoutEnlargement,
        });
      }

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality, progressive: true });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality });
          break;
      }

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Process and save
      await sharpInstance.toFile(outputPath);

      // Get final dimensions and size
      const finalMetadata = await sharp(outputPath).metadata();
      const stats = await fs.stat(outputPath);

      return {
        path: outputPath,
        size: stats.size,
        dimensions: {
          width: finalMetadata.width || 0,
          height: finalMetadata.height || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to optimize image:`, error);
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail from image
   */
  async generateThumbnail(
    input: string | Buffer,
    outputPath: string,
    options: ThumbnailOptions,
  ): Promise<{ path: string; size: number; dimensions: ImageDimensions }> {
    try {
      const {
        width,
        height,
        quality = 80,
        format = 'jpeg',
        fit = 'cover',
      } = options;

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      let sharpInstance = sharp(input)
        .resize(width, height, {
          fit,
          position: 'center',
          withoutEnlargement: false,
        });

      // Apply format-specific settings
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality, progressive: true });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality });
          break;
      }

      // Process and save
      await sharpInstance.toFile(outputPath);

      // Get final dimensions and size
      const finalMetadata = await sharp(outputPath).metadata();
      const stats = await fs.stat(outputPath);

      return {
        path: outputPath,
        size: stats.size,
        dimensions: {
          width: finalMetadata.width || 0,
          height: finalMetadata.height || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail:`, error);
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Add watermark to image
   */
  async addWatermark(
    inputPath: string,
    outputPath: string,
    watermarkPath: string,
    options: {
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity?: number;
      scale?: number;
    } = {},
  ): Promise<{ path: string; size: number; dimensions: ImageDimensions }> {
    try {
      const { position = 'bottom-right', opacity = 0.7, scale = 0.1 } = options;

      // Get input image dimensions
      const inputMetadata = await sharp(inputPath).metadata();
      const inputWidth = inputMetadata.width || 0;
      const inputHeight = inputMetadata.height || 0;

      // Get watermark dimensions
      const watermarkMetadata = await sharp(watermarkPath).metadata();
      const watermarkWidth = watermarkMetadata.width || 0;
      const watermarkHeight = watermarkMetadata.height || 0;

      // Calculate watermark size (scale based on input image)
      const scaledWidth = Math.floor(inputWidth * scale);
      const scaledHeight = Math.floor((watermarkHeight * scaledWidth) / watermarkWidth);

      // Calculate position
      let left: number, top: number;
      switch (position) {
        case 'top-left':
          left = 10;
          top = 10;
          break;
        case 'top-right':
          left = inputWidth - scaledWidth - 10;
          top = 10;
          break;
        case 'bottom-left':
          left = 10;
          top = inputHeight - scaledHeight - 10;
          break;
        case 'bottom-right':
          left = inputWidth - scaledWidth - 10;
          top = inputHeight - scaledHeight - 10;
          break;
        case 'center':
          left = Math.floor((inputWidth - scaledWidth) / 2);
          top = Math.floor((inputHeight - scaledHeight) / 2);
          break;
        default:
          left = inputWidth - scaledWidth - 10;
          top = inputHeight - scaledHeight - 10;
      }

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Create watermarked image
      await sharp(inputPath)
        .composite([
          {
            input: await sharp(watermarkPath)
              .resize(scaledWidth, scaledHeight)
              .png()
              .toBuffer(),
            left,
            top,
          },
        ])
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      // Get final dimensions and size
      const finalMetadata = await sharp(outputPath).metadata();
      const stats = await fs.stat(outputPath);

      return {
        path: outputPath,
        size: stats.size,
        dimensions: {
          width: finalMetadata.width || 0,
          height: finalMetadata.height || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to add watermark to ${inputPath}:`, error);
      throw new Error(`Watermarking failed: ${error.message}`);
    }
  }

  /**
   * Convert image format
   */
  async convertFormat(
    input: string | Buffer,
    outputPath: string,
    format: 'jpeg' | 'png' | 'webp' | 'avif',
    quality: number = 80,
  ): Promise<{ path: string; size: number; dimensions: ImageDimensions }> {
    try {
      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      let sharpInstance = sharp(input);

      // Apply format-specific settings
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality, progressive: true });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality });
          break;
      }

      // Process and save
      await sharpInstance.toFile(outputPath);

      // Get final dimensions and size
      const finalMetadata = await sharp(outputPath).metadata();
      const stats = await fs.stat(outputPath);

      return {
        path: outputPath,
        size: stats.size,
        dimensions: {
          width: finalMetadata.width || 0,
          height: finalMetadata.height || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to convert image format:`, error);
      throw new Error(`Format conversion failed: ${error.message}`);
    }
  }

  /**
   * Batch process multiple images
   */
  async batchOptimize(
    inputPaths: string[],
    outputDir: string,
    options: ImageOptimizationOptions = {},
  ): Promise<Array<{ inputPath: string; outputPath: string; size: number; dimensions: ImageDimensions }>> {
    const results = [];

    for (const inputPath of inputPaths) {
      try {
        const filename = path.basename(inputPath, path.extname(inputPath));
        const extension = options.format || path.extname(inputPath).slice(1);
        const outputPath = path.join(outputDir, `${filename}_optimized.${extension}`);

        const result = await this.optimizeImage(inputPath, outputPath, options);
        results.push({
          inputPath,
          outputPath: result.path,
          size: result.size,
          dimensions: result.dimensions,
        });
      } catch (error) {
        this.logger.error(`Failed to process ${inputPath} in batch:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Validate if file is a valid image
   */
  async validateImage(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata();
      return !!(metadata.width && metadata.height);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get media file by ID and validate it's an image
   */
  async getMediaFileById(mediaId: string): Promise<{ filePath: string; media: any }> {
    try {
      const media = await this.mediaService.findOne(mediaId);
      
      if (media.type !== 'IMAGE') {
        throw new Error('Media is not an image');
      }

      // Construct full file path from storage key
      const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
      const fullPath = path.join(uploadDir, media.path);

      if (!await fs.pathExists(fullPath)) {
        throw new NotFoundException('Media file not found on disk');
      }

      return {
        filePath: fullPath,
        media,
      };
    } catch (error) {
      this.logger.error(`Failed to get media file by ID ${mediaId}:`, error);
      throw error;
    }
  }

  /**
   * Optimize existing media by ID
   */
  async optimizeMediaById(
    mediaId: string,
    outputPath: string,
    options: ImageOptimizationOptions = {},
  ): Promise<{ path: string; size: number; dimensions: ImageDimensions; originalSize: number }> {
    try {
      const { filePath, media } = await this.getMediaFileById(mediaId);
      
      const result = await this.optimizeImage(filePath, outputPath, options);
      
      return {
        ...result,
        originalSize: media.size,
      };
    } catch (error) {
      this.logger.error(`Failed to optimize media by ID ${mediaId}:`, error);
      throw error;
    }
  }

  /**
   * Generate thumbnail from existing media by ID
   */
  async generateThumbnailFromMediaId(
    mediaId: string,
    outputPath: string,
    options: ThumbnailOptions,
  ): Promise<{ path: string; size: number; dimensions: ImageDimensions; originalSize: number }> {
    try {
      const { filePath, media } = await this.getMediaFileById(mediaId);
      
      const result = await this.generateThumbnail(filePath, outputPath, options);
      
      return {
        ...result,
        originalSize: media.size,
      };
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail from media ID ${mediaId}:`, error);
      throw error;
    }
  }

  /**
   * Convert format of existing media by ID
   */
  async convertMediaFormatById(
    mediaId: string,
    outputPath: string,
    format: 'jpeg' | 'png' | 'webp' | 'avif',
    quality: number = 80,
  ): Promise<{ path: string; size: number; dimensions: ImageDimensions; originalSize: number }> {
    try {
      const { filePath, media } = await this.getMediaFileById(mediaId);
      
      const result = await this.convertFormat(filePath, outputPath, format, quality);
      
      return {
        ...result,
        originalSize: media.size,
      };
    } catch (error) {
      this.logger.error(`Failed to convert media format by ID ${mediaId}:`, error);
      throw error;
    }
  }

  /**
   * Get metadata of existing media by ID
   */
  async getMediaMetadataById(mediaId: string): Promise<ImageMetadata> {
    try {
      const { filePath } = await this.getMediaFileById(mediaId);
      return await this.getImageMetadata(filePath);
    } catch (error) {
      this.logger.error(`Failed to get media metadata by ID ${mediaId}:`, error);
      throw error;
    }
  }

  /**
   * Serve original media file by ID
   */
  async serveMediaById(mediaId: string): Promise<{ filePath: string; mimeType: string; size: number }> {
    try {
      const { filePath, media } = await this.getMediaFileById(mediaId);
      
      return {
        filePath,
        mimeType: media.mimeType,
        size: media.size,
      };
    } catch (error) {
      this.logger.error(`Failed to serve media by ID ${mediaId}:`, error);
      throw error;
    }
  }
}
