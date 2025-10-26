import { Controller, Post, Get, Param, Body, Query, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ImageProcessingService, ImageOptimizationOptions, ThumbnailOptions } from './image-processing.service';
import { ConfigService } from '@nestjs/config';
import { OptimizeImageDto } from './dto/optimize-image.dto';
import { ThumbnailDto } from './dto/thumbnail.dto';
import { ConvertFormatDto } from './dto/convert-format.dto';
import { BatchOptimizeDto } from './dto/batch-optimize.dto';
import { OptimizeMediaByIdDto } from './dto/optimize-media-by-id.dto';
import { ThumbnailMediaByIdDto } from './dto/thumbnail-media-by-id.dto';
import { ConvertMediaByIdDto } from './dto/convert-media-by-id.dto';
import { RemoveBgDto, RemoveBgFromUrlDto, RemoveBgFromMediaIdDto } from './dto/remove-bg.dto';
import { RemoveBgService } from './remove-bg.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProcessedMediaService } from '../processed-media/processed-media.service';
import * as path from 'path';
import * as fs from 'fs-extra';

@ApiTags('Image Processing')
@Controller('image-processing')
export class ImageProcessingController {
  constructor(
    private readonly imageProcessingService: ImageProcessingService,
    private readonly configService: ConfigService,
    private readonly processedMediaService: ProcessedMediaService,
    private readonly removeBgService: RemoveBgService,
  ) {}

  @Post('optimize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Optimize an uploaded image and save to processed media' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to optimize',
        },
        quality: {
          type: 'number',
          description: 'Quality setting (1-100)',
          default: 80,
        },
        format: {
          type: 'string',
          enum: ['jpeg', 'png', 'webp', 'avif'],
          description: 'Output format',
          default: 'jpeg',
        },
        width: {
          type: 'number',
          description: 'Target width (optional)',
        },
        height: {
          type: 'number',
          description: 'Target height (optional)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image optimized successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @UseInterceptors(FileInterceptor('file'))
  async optimizeImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() options: OptimizeImageDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const optimizedDir = path.join(uploadDir, 'optimized');
    await fs.ensureDir(optimizedDir);

    const filename = `${Date.now()}-optimized.${options.format || 'jpeg'}`;
    const outputPath = path.join(optimizedDir, filename);

    const optimizationOptions: ImageOptimizationOptions = {
      quality: options.quality || 80,
      format: options.format || 'jpeg',
      width: options.width,
      height: options.height,
    };

    const result = await this.imageProcessingService.optimizeImage(
      file.buffer,
      outputPath,
      optimizationOptions,
    );

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: file.originalname,
      storedFileName: filename,
      mimeType: `image/${options.format || 'jpeg'}`,
      fileSize: result.size,
      filePath: outputPath,
      publicUrl: `/uploads/optimized/${filename}`,
      width: result.dimensions.width,
      height: result.dimensions.height,
      format: options.format || 'jpeg',
      processType: 'OPTIMIZE',
      quality: options.quality,
      originalSize: file.size,
      processingOptions: optimizationOptions,
      sourceType: 'UPLOAD',
      ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiryDays: options.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      originalSize: file.size,
      optimizedSize: result.size,
      dimensions: result.dimensions,
      outputPath: result.path,
      url: `/uploads/optimized/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
    };
  }

  @Post('thumbnail')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate thumbnail from uploaded image and save to processed media' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to create thumbnail from',
        },
        width: {
          type: 'number',
          description: 'Thumbnail width',
          default: 300,
        },
        height: {
          type: 'number',
          description: 'Thumbnail height',
          default: 300,
        },
        quality: {
          type: 'number',
          description: 'Thumbnail quality (1-100)',
          default: 80,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Thumbnail generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @UseInterceptors(FileInterceptor('file'))
  async generateThumbnail(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() options: ThumbnailDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const thumbnailsDir = path.join(uploadDir, 'thumbnails');
    await fs.ensureDir(thumbnailsDir);

    const filename = `${Date.now()}-thumb.jpeg`;
    const outputPath = path.join(thumbnailsDir, filename);

    const thumbnailOptions: ThumbnailOptions = {
      width: options.width || 300,
      height: options.height || 300,
      quality: options.quality || 80,
      format: 'jpeg',
    };

    const result = await this.imageProcessingService.generateThumbnail(
      file.buffer,
      outputPath,
      thumbnailOptions,
    );

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: file.originalname,
      storedFileName: filename,
      mimeType: 'image/jpeg',
      fileSize: result.size,
      filePath: outputPath,
      publicUrl: `/uploads/thumbnails/${filename}`,
      width: result.dimensions.width,
      height: result.dimensions.height,
      format: 'jpeg',
      processType: 'THUMBNAIL',
      quality: options.quality,
      originalSize: file.size,
      processingOptions: thumbnailOptions,
      sourceType: 'UPLOAD',
      ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiryDays: options.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      originalSize: file.size,
      thumbnailSize: result.size,
      dimensions: result.dimensions,
      outputPath: result.path,
      url: `/uploads/thumbnails/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
    };
  }

  @Post('convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert image format and save to processed media' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to convert',
        },
        format: {
          type: 'string',
          enum: ['jpeg', 'png', 'webp', 'avif'],
          description: 'Target format',
        },
        quality: {
          type: 'number',
          description: 'Output quality (1-100)',
          default: 80,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image converted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @UseInterceptors(FileInterceptor('file'))
  async convertFormat(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() options: ConvertFormatDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const convertedDir = path.join(uploadDir, 'converted');
    await fs.ensureDir(convertedDir);

    const filename = `${Date.now()}-converted.${options.format}`;
    const outputPath = path.join(convertedDir, filename);

    const result = await this.imageProcessingService.convertFormat(
      file.buffer,
      outputPath,
      options.format,
      options.quality || 80,
    );

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: file.originalname,
      storedFileName: filename,
      mimeType: `image/${options.format}`,
      fileSize: result.size,
      filePath: outputPath,
      publicUrl: `/uploads/converted/${filename}`,
      width: result.dimensions.width,
      height: result.dimensions.height,
      format: options.format,
      processType: 'CONVERT',
      quality: options.quality,
      originalSize: file.size,
      processingOptions: { format: options.format, quality: options.quality },
      sourceType: 'UPLOAD',
      ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiryDays: options.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      originalSize: file.size,
      convertedSize: result.size,
      dimensions: result.dimensions,
      outputPath: result.path,
      url: `/uploads/converted/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
    };
  }

  @Get('metadata/:filename')
  @ApiOperation({ summary: 'Get image metadata' })
  @ApiParam({ name: 'filename', description: 'Image filename' })
  @ApiResponse({ status: 200, description: 'Image metadata retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async getImageMetadata(@Param('filename') filename: string) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const filePath = path.join(uploadDir, filename);

    if (!await fs.pathExists(filePath)) {
      throw new Error('Image not found');
    }

    const metadata = await this.imageProcessingService.getImageMetadata(filePath);
    return {
      success: true,
      metadata,
    };
  }

  @Post('batch-optimize')
  @ApiOperation({ summary: 'Batch optimize multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple image files to optimize',
        },
        quality: {
          type: 'number',
          description: 'Quality setting (1-100)',
          default: 80,
        },
        format: {
          type: 'string',
          enum: ['jpeg', 'png', 'webp', 'avif'],
          description: 'Output format',
          default: 'jpeg',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Images optimized successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @UseInterceptors(FileInterceptor('files'))
  async batchOptimize(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB total
        ],
      }),
    )
    files: Express.Multer.File[],
    @Body() options: BatchOptimizeDto,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const batchDir = path.join(uploadDir, 'batch-optimized');
    await fs.ensureDir(batchDir);

    const inputPaths = files.map(file => {
      const tempPath = path.join(batchDir, `temp-${Date.now()}-${file.originalname}`);
      fs.writeFileSync(tempPath, file.buffer);
      return tempPath;
    });

    const optimizationOptions: ImageOptimizationOptions = {
      quality: options.quality || 80,
      format: options.format || 'jpeg',
    };

    const results = await this.imageProcessingService.batchOptimize(
      inputPaths,
      batchDir,
      optimizationOptions,
    );

    // Clean up temporary files
    for (const inputPath of inputPaths) {
      await fs.remove(inputPath);
    }

    return {
      success: true,
      processed: results.length,
      results: results.map(result => ({
        originalSize: files.find(f => f.originalname === path.basename(result.inputPath))?.size || 0,
        optimizedSize: result.size,
        dimensions: result.dimensions,
        outputPath: result.outputPath,
      })),
    };
  }

  @Post('media/:mediaId/optimize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Optimize existing media by ID and save to processed media' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiBody({ type: OptimizeMediaByIdDto })
  @ApiResponse({ status: 201, description: 'Media optimized successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async optimizeMediaById(
    @Param('mediaId') mediaId: string,
    @Body() options: OptimizeMediaByIdDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const optimizedDir = path.join(uploadDir, 'optimized');
    await fs.ensureDir(optimizedDir);

    const filename = `${Date.now()}-optimized.${options.format || 'jpeg'}`;
    const outputPath = path.join(optimizedDir, filename);

    const optimizationOptions: ImageOptimizationOptions = {
      quality: options.quality || 80,
      format: options.format || 'jpeg',
      width: options.width,
      height: options.height,
    };

    const result = await this.imageProcessingService.optimizeMediaById(
      mediaId,
      outputPath,
      optimizationOptions,
    );

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: `optimized-${mediaId}`,
      storedFileName: filename,
      mimeType: `image/${options.format || 'jpeg'}`,
      fileSize: result.size,
      filePath: outputPath,
      publicUrl: `/uploads/optimized/${filename}`,
      width: result.dimensions.width,
      height: result.dimensions.height,
      format: options.format || 'jpeg',
      processType: 'OPTIMIZE',
      quality: options.quality,
      originalSize: result.originalSize,
      sourceMediaId: mediaId,
      processingOptions: optimizationOptions,
      sourceType: 'MEDIA_LIBRARY',
      ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiryDays: options.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      originalSize: result.originalSize,
      optimizedSize: result.size,
      dimensions: result.dimensions,
      outputPath: result.path,
      url: `/uploads/optimized/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
    };
  }

  @Post('media/:mediaId/thumbnail')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate thumbnail from existing media by ID and save to processed media' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiBody({ type: ThumbnailMediaByIdDto })
  @ApiResponse({ status: 201, description: 'Thumbnail generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async generateThumbnailFromMediaId(
    @Param('mediaId') mediaId: string,
    @Body() options: ThumbnailMediaByIdDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const thumbnailsDir = path.join(uploadDir, 'thumbnails');
    await fs.ensureDir(thumbnailsDir);

    const filename = `${Date.now()}-thumb.jpeg`;
    const outputPath = path.join(thumbnailsDir, filename);

    const thumbnailOptions: ThumbnailOptions = {
      width: options.width || 300,
      height: options.height || 300,
      quality: options.quality || 80,
      format: 'jpeg',
    };

    const result = await this.imageProcessingService.generateThumbnailFromMediaId(
      mediaId,
      outputPath,
      thumbnailOptions,
    );

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: `thumb-${mediaId}`,
      storedFileName: filename,
      mimeType: 'image/jpeg',
      fileSize: result.size,
      filePath: outputPath,
      publicUrl: `/uploads/thumbnails/${filename}`,
      width: result.dimensions.width,
      height: result.dimensions.height,
      format: 'jpeg',
      processType: 'THUMBNAIL',
      quality: options.quality,
      originalSize: result.originalSize,
      sourceMediaId: mediaId,
      processingOptions: thumbnailOptions,
      sourceType: 'MEDIA_LIBRARY',
      ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiryDays: options.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      originalSize: result.originalSize,
      thumbnailSize: result.size,
      dimensions: result.dimensions,
      outputPath: result.path,
      url: `/uploads/thumbnails/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
    };
  }

  @Post('media/:mediaId/convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert format of existing media by ID and save to processed media' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiBody({ type: ConvertMediaByIdDto })
  @ApiResponse({ status: 201, description: 'Media converted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async convertMediaFormatById(
    @Param('mediaId') mediaId: string,
    @Body() options: ConvertMediaByIdDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const convertedDir = path.join(uploadDir, 'converted');
    await fs.ensureDir(convertedDir);

    const filename = `${Date.now()}-converted.${options.format}`;
    const outputPath = path.join(convertedDir, filename);

    const result = await this.imageProcessingService.convertMediaFormatById(
      mediaId,
      outputPath,
      options.format,
      options.quality || 80,
    );

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: `converted-${mediaId}`,
      storedFileName: filename,
      mimeType: `image/${options.format}`,
      fileSize: result.size,
      filePath: outputPath,
      publicUrl: `/uploads/converted/${filename}`,
      width: result.dimensions.width,
      height: result.dimensions.height,
      format: options.format,
      processType: 'CONVERT',
      quality: options.quality,
      originalSize: result.originalSize,
      sourceMediaId: mediaId,
      processingOptions: { format: options.format, quality: options.quality },
      sourceType: 'MEDIA_LIBRARY',
      ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiryDays: options.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      originalSize: result.originalSize,
      convertedSize: result.size,
      dimensions: result.dimensions,
      outputPath: result.path,
      url: `/uploads/converted/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
    };
  }

  @Get('media/:mediaId/metadata')
  @ApiOperation({ summary: 'Get metadata of existing media by ID' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiResponse({ status: 200, description: 'Media metadata retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async getMediaMetadataById(@Param('mediaId') mediaId: string) {
    const metadata = await this.imageProcessingService.getMediaMetadataById(mediaId);
    return {
      success: true,
      metadata,
    };
  }

  @Get('media/:mediaId/serve')
  @ApiOperation({ summary: 'Serve original media file by ID' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiResponse({ status: 200, description: 'Media file served successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async serveMediaById(@Param('mediaId') mediaId: string) {
    const result = await this.imageProcessingService.serveMediaById(mediaId);
    return {
      success: true,
      filePath: result.filePath,
      mimeType: result.mimeType,
      size: result.size,
      url: `/uploads/images/${path.basename(result.filePath)}`,
    };
  }

  @Post('remove-bg')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove background from uploaded image and save to processed media' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to remove background from',
        },
        size: {
          type: 'string',
          enum: ['auto', 'preview', 'small', 'regular', 'medium', 'hd', 'full', '4k', '50MP'],
          description: 'Output size',
          default: 'auto',
        },
        format: {
          type: 'string',
          enum: ['png', 'jpg', 'zip'],
          description: 'Output format',
          default: 'png',
        },
        type: {
          type: 'string',
          enum: ['auto', 'person', 'product', 'car', 'animal', 'graphic', 'transportation'],
          description: 'Image type for better processing',
          default: 'auto',
        },
        crop: {
          type: 'boolean',
          description: 'Crop empty regions',
          default: false,
        },
        addShadow: {
          type: 'boolean',
          description: 'Add shadow to result',
          default: false,
        },
        bgColor: {
          type: 'string',
          description: 'Background color (hex)',
          example: '#ffffff',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Background removed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @UseInterceptors(FileInterceptor('file'))
  async removeBackground(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() options: RemoveBgDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const removeBgDir = path.join(uploadDir, 'remove-bg');
    await fs.ensureDir(removeBgDir);

    const filename = `${Date.now()}-no-bg.${options.format || 'png'}`;
    const outputPath = path.join(removeBgDir, filename);

    const result = await this.removeBgService.removeBackground(file.buffer, options);
    
    // Save result to file
    await fs.writeFile(outputPath, result.imageBuffer);

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: file.originalname,
      storedFileName: filename,
      mimeType: `image/${options.format || 'png'}`,
      fileSize: result.imageBuffer.length,
      filePath: outputPath,
      publicUrl: `/uploads/remove-bg/${filename}`,
      width: result.foregroundWidth,
      height: result.foregroundHeight,
      format: options.format || 'png',
      processType: 'REMOVE_BG',
      originalSize: file.size,
      processingOptions: options,
      sourceType: 'UPLOAD',
      ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiryDays: options.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      originalSize: file.size,
      processedSize: result.imageBuffer.length,
      dimensions: {
        width: result.foregroundWidth,
        height: result.foregroundHeight,
      },
      outputPath: outputPath,
      url: `/uploads/remove-bg/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
      creditsCharged: result.creditsCharged,
      type: result.type,
    };
  }

  @Post('remove-bg/url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove background from image URL and save to processed media' })
  @ApiBody({ type: RemoveBgFromUrlDto })
  @ApiResponse({ status: 201, description: 'Background removed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  async removeBackgroundFromUrl(
    @Body() dto: RemoveBgFromUrlDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const removeBgDir = path.join(uploadDir, 'remove-bg');
    await fs.ensureDir(removeBgDir);

    const filename = `${Date.now()}-no-bg.${dto.format || 'png'}`;
    const outputPath = path.join(removeBgDir, filename);

    const result = await this.removeBgService.removeBackgroundFromUrl(dto.imageUrl, dto);
    
    // Save result to file
    await fs.writeFile(outputPath, result.imageBuffer);

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: `url-${Date.now()}`,
      storedFileName: filename,
      mimeType: `image/${dto.format || 'png'}`,
      fileSize: result.imageBuffer.length,
      filePath: outputPath,
      publicUrl: `/uploads/remove-bg/${filename}`,
      width: result.foregroundWidth,
      height: result.foregroundHeight,
      format: dto.format || 'png',
      processType: 'REMOVE_BG',
      processingOptions: dto,
      sourceType: 'URL',
      ...(dto.expiresAt ? { expiresAt: dto.expiresAt } : { expiryDays: dto.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      processedSize: result.imageBuffer.length,
      dimensions: {
        width: result.foregroundWidth,
        height: result.foregroundHeight,
      },
      outputPath: outputPath,
      url: `/uploads/remove-bg/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
      creditsCharged: result.creditsCharged,
      type: result.type,
    };
  }

  @Post('media/:mediaId/remove-bg')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove background from existing media by ID and save to processed media' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiBody({ type: RemoveBgFromMediaIdDto })
  @ApiResponse({ status: 201, description: 'Background removed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async removeBackgroundFromMediaId(
    @Param('mediaId') mediaId: string,
    @Body() options: RemoveBgFromMediaIdDto,
    @Request() req,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const removeBgDir = path.join(uploadDir, 'remove-bg');
    await fs.ensureDir(removeBgDir);

    const filename = `${Date.now()}-no-bg.${options.format || 'png'}`;
    const outputPath = path.join(removeBgDir, filename);

    // Get media file
    const { filePath, media } = await this.imageProcessingService.getMediaFileById(mediaId);
    const imageBuffer = await fs.readFile(filePath);

    const result = await this.removeBgService.removeBackground(imageBuffer, options);
    
    // Save result to file
    await fs.writeFile(outputPath, result.imageBuffer);

    // Save to ProcessedMedia table
    const processedMedia = await this.processedMediaService.create({
      originalName: `no-bg-${mediaId}`,
      storedFileName: filename,
      mimeType: `image/${options.format || 'png'}`,
      fileSize: result.imageBuffer.length,
      filePath: outputPath,
      publicUrl: `/uploads/remove-bg/${filename}`,
      width: result.foregroundWidth,
      height: result.foregroundHeight,
      format: options.format || 'png',
      processType: 'REMOVE_BG',
      originalSize: media.size,
      sourceMediaId: mediaId,
      processingOptions: options,
      sourceType: 'MEDIA_LIBRARY',
      ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiryDays: options.expiryDays || 1 }),
    }, req.user.id);

    return {
      success: true,
      originalSize: media.size,
      processedSize: result.imageBuffer.length,
      dimensions: {
        width: result.foregroundWidth,
        height: result.foregroundHeight,
      },
      outputPath: outputPath,
      url: `/uploads/remove-bg/${filename}`,
      processedMediaId: processedMedia.id,
      expiresAt: processedMedia.expiresAt,
      creditsCharged: result.creditsCharged,
      type: result.type,
    };
  }

  @Get('remove-bg/account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get remove.bg account information and credit balance' })
  @ApiResponse({ status: 200, description: 'Account information retrieved successfully' })
  @ApiResponse({ status: 400, description: 'API key not configured' })
  async getRemoveBgAccountInfo() {
    const accountInfo = await this.removeBgService.getAccountInfo();
    return {
      success: true,
      account: accountInfo,
    };
  }
}
