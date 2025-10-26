import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  InternalServerErrorException,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { VideoService } from './video.service';
import { extname, join } from 'path';
import {
  OptimizeVideoDto,
  TrimVideoDto,
  RotateVideoDto,
  SpeedVideoDto,
  ExtractAudioDto,
  WatermarkDto,
  MultipleThumbnailsDto,
  OptimizeByIdDto,
  TrimByIdDto,
  RotateByIdDto,
  SpeedByIdDto,
  ExtractAudioByIdDto,
  WatermarkByIdDto,
  MultipleThumbnailsByIdDto,
  MultiQualityByIdDto,
  ConvertToWebmByIdDto,
  ConcatenateVideosDto,
  ConvertFormatDto,
  BitrateCompressDto,
  TwoPassEncodeDto,
  DetectResolutionDto,
  ValidateVideoDto,
} from './dto';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('optimize')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          // Generate a unique filename with a timestamp
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept video files only
        const allowedMimeTypes = [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/webm',
          'video/x-matroska',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only video files are allowed.',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
      },
    }),
  )
  async optimizeVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: OptimizeVideoDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const originalFileName = file.originalname;
    const outputFileName = `optimized-${file.filename}`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      // Perform the video optimization
      await this.videoService.compressVideo(
        inputPath,
        outputPath,
        dto.crf,
        dto.audioBitrate,
      );

      // Create a thumbnail from the optimized video
      const thumbnailFileName = `thumbnail-${file.filename.split('.')[0]}.png`;
      const thumbnailPath = join('./uploads/thumbnails', thumbnailFileName);
      await this.videoService.createThumbnail(
        outputPath,
        thumbnailPath,
        dto.thumbnailTimestamp,
      );

      // Clean up the original uploaded file
      await this.videoService.deleteFile(inputPath);

      return {
        message: 'Video processed successfully',
        originalFileName,
        optimizedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
        thumbnailPath: thumbnailPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath); // Clean up the original
      this.videoService.deleteFile(outputPath); // Clean up any partial output
      throw new InternalServerErrorException(
        'Video processing failed',
        error.message,
      );
    }
  }

  @Post('convert-webm')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async convertToWebm(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const outputFileName = `${file.filename.split('.')[0]}.webm`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.convertToWebm(inputPath, outputPath);
      await this.videoService.deleteFile(inputPath);

      return {
        message: 'Video converted successfully',
        convertedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath);
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video conversion failed',
        error.message,
      );
    }
  }

  @Post('trim')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async trimVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: TrimVideoDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const outputFileName = `trimmed-${file.filename}`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.trimVideo(
        inputPath,
        outputPath,
        dto.startTime,
        dto.duration,
      );
      await this.videoService.deleteFile(inputPath);

      return {
        message: 'Video trimmed successfully',
        trimmedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath);
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video trimming failed',
        error.message,
      );
    }
  }

  @Post('rotate')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async rotateVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: RotateVideoDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const outputFileName = `rotated-${dto.rotation}-${file.filename}`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.rotateVideo(inputPath, outputPath, dto.rotation);
      await this.videoService.deleteFile(inputPath);

      return {
        message: `Video rotated ${dto.rotation} degrees successfully`,
        rotatedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath);
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video rotation failed',
        error.message,
      );
    }
  }

  @Post('speed')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async changeSpeed(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SpeedVideoDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const outputFileName = `speed-${dto.speed}x-${file.filename}`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.changeSpeed(inputPath, outputPath, dto.speed);
      await this.videoService.deleteFile(inputPath);

      return {
        message: `Video speed changed to ${dto.speed}x successfully`,
        processedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath);
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video speed change failed',
        error.message,
      );
    }
  }

  @Post('extract-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async extractAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ExtractAudioDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const format = dto.format || 'mp3';
    const outputFileName = `${file.filename.split('.')[0]}.${format}`;
    const outputPath = join('./uploads/audio', outputFileName);

    try {
      await this.videoService.extractAudio(inputPath, outputPath, format);
      await this.videoService.deleteFile(inputPath);

      return {
        message: 'Audio extracted successfully',
        audioPath: outputPath.replace('./uploads/', '/uploads/'),
        format,
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath);
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Audio extraction failed',
        error.message,
      );
    }
  }

  @Post('watermark')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async addWatermark(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: WatermarkDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const outputFileName = `watermarked-${file.filename}`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.addTextWatermark(
        inputPath,
        outputPath,
        dto.text,
        dto.position,
      );
      await this.videoService.deleteFile(inputPath);

      return {
        message: 'Watermark added successfully',
        watermarkedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath);
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Watermark addition failed',
        error.message,
      );
    }
  }

  @Post('multiple-thumbnails')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createMultipleThumbnails(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: MultipleThumbnailsDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const baseFilename = file.filename.split('.')[0];

    try {
      const thumbnailPaths = await this.videoService.createMultipleThumbnails(
        inputPath,
        './uploads/thumbnails',
        dto.timestamps,
        baseFilename,
      );
      await this.videoService.deleteFile(inputPath);

      return {
        message: 'Thumbnails created successfully',
        count: thumbnailPaths.length,
        thumbnails: thumbnailPaths.map((path) =>
          path.replace('./uploads/', '/uploads/'),
        ),
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath);
      throw new InternalServerErrorException(
        'Thumbnail creation failed',
        error.message,
      );
    }
  }

  @Post('multi-quality')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async generateMultipleQualities(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const baseFilename = file.filename.split('.')[0];

    const qualities = [
      { label: '360p', width: 640, bitrate: '800k' },
      { label: '480p', width: 854, bitrate: '1400k' },
      { label: '720p', width: 1280, bitrate: '2800k' },
      { label: '1080p', width: 1920, bitrate: '5000k' },
    ];

    try {
      const outputs = await this.videoService.generateMultipleQualities(
        inputPath,
        './uploads/videos',
        baseFilename,
        qualities,
      );
      await this.videoService.deleteFile(inputPath);

      return {
        message: 'Multiple quality videos generated successfully',
        videos: outputs.map((output) => ({
          quality: output.label,
          path: output.path.replace('./uploads/', '/uploads/'),
        })),
      };
    } catch (error) {
      this.videoService.deleteFile(inputPath);
      throw new InternalServerErrorException(
        'Multi-quality generation failed',
        error.message,
      );
    }
  }

  // ========================================
  // ID-BASED PROCESSING ENDPOINTS
  // Process existing videos from media library
  // ========================================

  @Post('by-id/optimize')
  async optimizeVideoById(@Body() dto: OptimizeByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `optimized-${baseFilename}.mp4`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.compressVideo(
        inputPath,
        outputPath,
        dto.crf,
        dto.audioBitrate,
      );

      const thumbnailFileName = `thumbnail-${baseFilename}.png`;
      const thumbnailPath = join('./uploads/thumbnails', thumbnailFileName);
      await this.videoService.createThumbnail(
        outputPath,
        thumbnailPath,
        dto.thumbnailTimestamp,
      );

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        'optimized',
        'system', // TODO: Get from JWT
        dto.folderId,
      );

      return {
        message: 'Video optimized successfully',
        mediaId: newMedia.id,
        optimizedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
        thumbnailPath: thumbnailPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video optimization failed',
        error.message,
      );
    }
  }

  @Post('by-id/trim')
  async trimVideoById(@Body() dto: TrimByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `trimmed-${baseFilename}.mp4`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.trimVideo(
        inputPath,
        outputPath,
        dto.startTime,
        dto.duration,
      );

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        'trimmed',
        'system',
        dto.folderId,
      );

      return {
        message: 'Video trimmed successfully',
        mediaId: newMedia.id,
        trimmedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video trimming failed',
        error.message,
      );
    }
  }

  @Post('by-id/rotate')
  async rotateVideoById(@Body() dto: RotateByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `rotated-${dto.rotation}-${baseFilename}.mp4`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.rotateVideo(inputPath, outputPath, dto.rotation);

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        `rotated-${dto.rotation}`,
        'system',
        dto.folderId,
      );

      return {
        message: `Video rotated ${dto.rotation} degrees successfully`,
        mediaId: newMedia.id,
        rotatedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video rotation failed',
        error.message,
      );
    }
  }

  @Post('by-id/speed')
  async changeSpeedById(@Body() dto: SpeedByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `speed-${dto.speed}x-${baseFilename}.mp4`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.changeSpeed(inputPath, outputPath, dto.speed);

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        `speed-${dto.speed}x`,
        'system',
        dto.folderId,
      );

      return {
        message: `Video speed changed to ${dto.speed}x successfully`,
        mediaId: newMedia.id,
        processedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video speed change failed',
        error.message,
      );
    }
  }

  @Post('by-id/extract-audio')
  async extractAudioById(@Body() dto: ExtractAudioByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const format = dto.format || 'mp3';
    const outputFileName = `${baseFilename}.${format}`;
    const outputPath = join('./uploads/audio', outputFileName);

    try {
      await this.videoService.extractAudio(inputPath, outputPath, format);

      return {
        message: 'Audio extracted successfully',
        audioPath: outputPath.replace('./uploads/', '/uploads/'),
        format,
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Audio extraction failed',
        error.message,
      );
    }
  }

  @Post('by-id/watermark')
  async addWatermarkById(@Body() dto: WatermarkByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `watermarked-${baseFilename}.mp4`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.addTextWatermark(
        inputPath,
        outputPath,
        dto.text,
        dto.position,
      );

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        'watermarked',
        'system',
        dto.folderId,
      );

      return {
        message: 'Watermark added successfully',
        mediaId: newMedia.id,
        watermarkedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Watermark addition failed',
        error.message,
      );
    }
  }

  @Post('by-id/multiple-thumbnails')
  async createMultipleThumbnailsById(@Body() dto: MultipleThumbnailsByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];

    try {
      const thumbnailPaths = await this.videoService.createMultipleThumbnails(
        inputPath,
        './uploads/thumbnails',
        dto.timestamps,
        baseFilename,
      );

      return {
        message: 'Thumbnails created successfully',
        count: thumbnailPaths.length,
        thumbnails: thumbnailPaths.map((path) =>
          path.replace('./uploads/', '/uploads/'),
        ),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Thumbnail creation failed',
        error.message,
      );
    }
  }

  @Post('by-id/multi-quality')
  async generateMultipleQualitiesById(@Body() dto: MultiQualityByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];

    const qualities = [
      { label: '360p', width: 640, bitrate: '800k' },
      { label: '480p', width: 854, bitrate: '1400k' },
      { label: '720p', width: 1280, bitrate: '2800k' },
      { label: '1080p', width: 1920, bitrate: '5000k' },
    ];

    try {
      const outputs = await this.videoService.generateMultipleQualities(
        inputPath,
        './uploads/videos',
        baseFilename,
        qualities,
      );

      // Create media entries for each quality
      const mediaEntries = await Promise.all(
        outputs.map((output) =>
          this.videoService.createProcessedMediaEntry(
            dto.mediaId,
            output.path,
            `quality-${output.label}`,
            'system',
            dto.folderId,
          ),
        ),
      );

      return {
        message: 'Multiple quality videos generated successfully',
        videos: outputs.map((output, index) => ({
          quality: output.label,
          path: output.path.replace('./uploads/', '/uploads/'),
          mediaId: mediaEntries[index].id,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Multi-quality generation failed',
        error.message,
      );
    }
  }

  @Post('by-id/convert-webm')
  async convertToWebmById(@Body() dto: ConvertToWebmByIdDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `${baseFilename}.webm`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.convertToWebm(inputPath, outputPath);

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        'webm-converted',
        'system',
        dto.folderId,
      );

      return {
        message: 'Video converted to WebM successfully',
        mediaId: newMedia.id,
        convertedVideoPath: outputPath.replace('./uploads/', '/uploads/'),
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Video conversion failed',
        error.message,
      );
    }
  }

  // ========================================
  // ADVANCED PROCESSING ENDPOINTS
  // New features: concatenation, format conversion, bitrate modes, etc.
  // ========================================

  @Post('by-id/concatenate')
  async concatenateVideos(@Body() dto: ConcatenateVideosDto) {
    if (dto.mediaIds.length < 2) {
      throw new BadRequestException('At least 2 videos are required for concatenation');
    }

    const inputPaths: string[] = [];
    try {
      // Get local file paths for all media IDs
      for (const mediaId of dto.mediaIds) {
        const path = await this.videoService.getLocalFilePath(mediaId);
        inputPaths.push(path);
      }

      const outputFileName = `concatenated-${Date.now()}.mp4`;
      const outputPath = join('./uploads/videos', outputFileName);

      await this.videoService.concatenateVideos(inputPaths, outputPath);

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaIds[0],
        outputPath,
        'concatenated',
        'system',
        dto.folderId,
      );

      return {
        message: `Successfully concatenated ${dto.mediaIds.length} videos`,
        mediaId: newMedia.id,
        videoPath: outputPath.replace('./uploads/', '/uploads/'),
        sourceCount: dto.mediaIds.length,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Video concatenation failed',
        error.message,
      );
    }
  }

  @Post('by-id/convert-format')
  async convertFormat(@Body() dto: ConvertFormatDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `${baseFilename}.${dto.targetFormat}`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.convertFormat(
        inputPath,
        outputPath,
        dto.targetFormat,
        dto.hwAccel,
      );

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        `format-${dto.targetFormat}`,
        'system',
        dto.folderId,
      );

      return {
        message: `Video converted to ${dto.targetFormat.toUpperCase()} successfully`,
        mediaId: newMedia.id,
        videoPath: outputPath.replace('./uploads/', '/uploads/'),
        format: dto.targetFormat,
        hwAccel: dto.hwAccel || 'none',
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Format conversion failed',
        error.message,
      );
    }
  }

  @Post('by-id/compress-bitrate')
  async compressWithBitrateMode(@Body() dto: BitrateCompressDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `${dto.bitrateMode}-${baseFilename}.mp4`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.compressWithBitrateMode(
        inputPath,
        outputPath,
        dto.bitrateMode,
        dto.bitrate,
        dto.crf,
      );

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        `${dto.bitrateMode}-compressed`,
        'system',
        dto.folderId,
      );

      return {
        message: `Video compressed with ${dto.bitrateMode.toUpperCase()} mode successfully`,
        mediaId: newMedia.id,
        videoPath: outputPath.replace('./uploads/', '/uploads/'),
        bitrateMode: dto.bitrateMode,
        bitrate: dto.bitrate,
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Bitrate compression failed',
        error.message,
      );
    }
  }

  @Post('by-id/two-pass-encode')
  async twoPassEncode(@Body() dto: TwoPassEncodeDto) {
    const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
    const baseFilename = inputPath.split('/').pop().split('.')[0];
    const outputFileName = `twopass-${baseFilename}.mp4`;
    const outputPath = join('./uploads/videos', outputFileName);

    try {
      await this.videoService.twoPassEncode(
        inputPath,
        outputPath,
        dto.bitrate,
        dto.resolution,
      );

      const newMedia = await this.videoService.createProcessedMediaEntry(
        dto.mediaId,
        outputPath,
        'two-pass-encoded',
        'system',
        dto.folderId,
      );

      return {
        message: 'Two-pass encoding completed successfully',
        mediaId: newMedia.id,
        videoPath: outputPath.replace('./uploads/', '/uploads/'),
        bitrate: dto.bitrate,
        resolution: dto.resolution || 'original',
      };
    } catch (error) {
      this.videoService.deleteFile(outputPath);
      throw new InternalServerErrorException(
        'Two-pass encoding failed',
        error.message,
      );
    }
  }

  @Post('by-id/detect-resolution')
  async detectResolution(@Body() dto: DetectResolutionDto) {
    try {
      const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
      const metadata = await this.videoService.detectVideoResolution(inputPath);

      return {
        message: 'Video metadata detected successfully',
        metadata,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Resolution detection failed',
        error.message,
      );
    }
  }

  @Post('by-id/validate')
  async validateVideo(@Body() dto: ValidateVideoDto) {
    try {
      const inputPath = await this.videoService.getLocalFilePath(dto.mediaId);
      const validation = await this.videoService.validateVideo(
        inputPath,
        dto.minWidth,
        dto.minHeight,
        dto.maxDuration,
      );

      return {
        message: validation.valid
          ? 'Video validation passed'
          : 'Video validation failed',
        ...validation,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Video validation failed',
        error.message,
      );
    }
  }
}

