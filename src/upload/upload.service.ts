import { Injectable, BadRequestException, Inject, forwardRef, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { join } from 'path';
import { existsSync, mkdir, writeFile } from 'fs';
import { MediaService } from '../media/media.service';
import { CreateMediaDto } from '../media/dto/create-media.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { InitUploadDto } from './dto/init-upload.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { WholeFileUploadDto } from './dto/whole-file-upload.dto';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { StorageConfigService } from '../config/config.service';
import { CloudStorageService } from '../storage/cloud-storage.service';
import { StorageFactoryService } from '../storage/storage-factory.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly tempDir: string;
  private readonly maxFileSize: number;

  constructor(
    private readonly nestConfigService: NestConfigService,
    private readonly configService: StorageConfigService,
    @Inject(forwardRef(() => MediaService))
    private readonly mediaService: MediaService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly cloudStorageService: CloudStorageService,
    private readonly storageFactory: StorageFactoryService,
    private readonly prisma: PrismaService,
  ) {
    this.uploadDir = this.nestConfigService.get('UPLOAD_DIR', 'uploads');
    this.tempDir = this.nestConfigService.get('TEMP_DIR', 'temp');
    this.maxFileSize = this.nestConfigService.get('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB default
  }

  async uploadFile(file: Express.Multer.File, uploadFileDto: UploadFileDto): Promise<CreateMediaDto> {
    // Validate file
    this.validateFile(file, uploadFileDto);

    // Get storage provider
    const storageProvider = this.storageFactory.getStorageProvider();
    
    // Generate unique filename and storage key
    const filename = this.generateFilename(file.originalname);
    const storageKey = storageProvider.generateKey(
      file.originalname,
      uploadFileDto.userId || 'anonymous',
      this.getFolderByType(file.mimetype)
    );

    // Determine media type
    const mediaType = this.determineMediaType(file.mimetype) as 'IMAGE' | 'VIDEO' | 'DOCUMENT';

    // Upload to storage
    const uploadResult = await storageProvider.uploadFile(file, storageKey, {
      originalName: file.originalname,
      userId: uploadFileDto.userId || 'anonymous',
      mediaType,
    });

    // Create media DTO
    const createMediaDto: CreateMediaDto = {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: storageKey, // Store storage key as path
      url: uploadResult.url, // Store storage URL
      type: mediaType,
      userId: uploadFileDto.userId || 'anonymous',
    };

    // If it's an image, process it and get dimensions
    if (mediaType === 'IMAGE') {
      try {
        // Create temporary file for image processing
        const tempDir = path.join(process.cwd(), 'temp');
        await fs.ensureDir(tempDir);
        const tempFilePath = path.join(tempDir, filename);
        await fs.writeFile(tempFilePath, file.buffer);

        // Validate image
        const isValidImage = await this.imageProcessingService.validateImage(tempFilePath);
        if (!isValidImage) {
          throw new BadRequestException('Invalid image file');
        }

        // Get image dimensions and metadata
        const dimensions = await this.imageProcessingService.getImageDimensions(tempFilePath);
        createMediaDto.width = dimensions.width;
        createMediaDto.height = dimensions.height;

        // Get additional metadata
        const metadata = await this.imageProcessingService.getImageMetadata(tempFilePath);
        createMediaDto.metadata = {
          format: metadata.format,
          hasAlpha: metadata.hasAlpha,
          channels: metadata.channels,
          space: metadata.space,
          depth: metadata.depth,
          exif: metadata.exif,
        };

        // If quality is specified, optimize the image
        if (uploadFileDto.quality && uploadFileDto.quality < 100) {
          const optimizedPath = await this.optimizeImage(tempFilePath, uploadFileDto.quality);
          if (optimizedPath) {
            // Upload optimized version to storage
            const optimizedBuffer = await fs.readFile(optimizedPath);
            const optimizedKey = storageKey.replace(path.extname(storageKey), '_optimized' + path.extname(storageKey));
            const optimizedResult = await storageProvider.uploadFile(
              { ...file, buffer: optimizedBuffer } as Express.Multer.File,
              optimizedKey,
              { ...uploadResult, optimized: 'true' }
            );
            
            // Update the main file with optimized version
            createMediaDto.url = optimizedResult.url;
            createMediaDto.path = optimizedKey;
            createMediaDto.size = optimizedBuffer.length;
          }
        }

        // Clean up temporary file
        await fs.remove(tempFilePath);
      } catch (error) {
        console.warn('Could not process image:', error.message);
        // Don't fail the upload, just log the warning
      }
    }

    // Save to database
    const savedMedia = await this.mediaService.create(createMediaDto, uploadFileDto.userId || 'anonymous');
    return savedMedia;
  }

  private async ensureDirectories() {
    try {
      if (!existsSync(this.uploadDir)) {
        await fs.ensureDir(this.uploadDir);
      }
      if (!existsSync(this.tempDir)) {
        await fs.ensureDir(this.tempDir);
      }
      } catch (error) {
      this.logger.error('Failed to create upload directories', error);
    }
  }

  async initUpload(initDto: InitUploadDto, userId: string) {
    try {
      // Validate file size
      if (initDto.totalFileSize > this.maxFileSize) {
        throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
      }

      // Validate MIME type
      this.validateMimeType(initDto.mimeType, initDto.mediaType);

      // Create upload session
      const sessionToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const uploadSession = await (this.prisma as any).uploadSession.create({
        data: {
          sessionToken,
          totalChunks: initDto.totalChunks,
          chunkSize: initDto.chunkSize,
          totalFileSize: initDto.totalFileSize,
          fileName: initDto.fileName,
          mimeType: initDto.mimeType,
          checksum: initDto.checksum,
          expiresAt,
          userId,
        },
      });

      this.logger.log(`Upload session initiated: ${sessionToken} for user ${userId}`);

      return {
        sessionToken,
        totalChunks: initDto.totalChunks,
        chunkSize: initDto.chunkSize,
        expiresAt,
        message: 'Upload session created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to initialize upload session', error);
      throw error;
    }
  }

  async uploadChunk(uploadChunkDto: UploadChunkDto, userId: string) {
    try {
      // Validate session
      const session = await (this.prisma as any).uploadSession.findFirst({
        where: {
          sessionToken: uploadChunkDto.sessionToken,
          userId,
          status: { in: ['INITIATED', 'UPLOADING'] },
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new NotFoundException('Invalid or expired upload session');
      }

      // Validate chunk data
      if (uploadChunkDto.totalChunks !== session.totalChunks) {
        throw new BadRequestException('Total chunks mismatch');
      }

      if (uploadChunkDto.totalFileSize !== session.totalFileSize) {
        throw new BadRequestException('Total file size mismatch');
      }

      // Check if chunk already exists
      const existingChunk = await (this.prisma as any).uploadChunk.findUnique({
        where: {
          sessionId_chunkNumber: {
            sessionId: session.id,
            chunkNumber: uploadChunkDto.chunkNumber,
          },
        },
      });

      if (existingChunk) {
        throw new BadRequestException(`Chunk ${uploadChunkDto.chunkNumber} already uploaded`);
      }

      // Save chunk to temporary storage
      const chunkFileName = `${session.id}_${uploadChunkDto.chunkNumber}.chunk`;
      const chunkPath = join(this.tempDir, chunkFileName);
      
      const chunkBuffer = Buffer.from(uploadChunkDto.chunkData, 'base64');
      await fs.writeFile(chunkPath, chunkBuffer);

      // Calculate chunk checksum
      const chunkChecksum = createHash('md5').update(chunkBuffer).digest('hex');

      // Save chunk metadata to database
      await this.prisma.uploadChunk.create({
        data: {
          sessionId: session.id,
          chunkNumber: uploadChunkDto.chunkNumber,
          chunkSize: uploadChunkDto.chunkSize,
          chunkData: chunkPath, // Store file path instead of base64 data
          checksum: chunkChecksum,
        },
      });

      // Update session status
      await this.prisma.uploadSession.update({
        where: { id: session.id },
        data: { status: 'UPLOADING' },
      });

      this.logger.log(`Chunk ${uploadChunkDto.chunkNumber} uploaded for session ${session.sessionToken}`);

      // Check if all chunks are uploaded
      const uploadedChunks = await (this.prisma as any).uploadChunk.count({
        where: { sessionId: session.id },
      });

      if (uploadedChunks === session.totalChunks) {
        await this.assembleFile(session.id);
      }

      return {
        chunkNumber: uploadChunkDto.chunkNumber,
        uploadedChunks,
        totalChunks: session.totalChunks,
        message: 'Chunk uploaded successfully',
      };
    } catch (error) {
      this.logger.error('Failed to upload chunk', error);
      throw error;
    }
  }

  async uploadWholeFile(file: Express.Multer.File, metadata: WholeFileUploadDto, userId: string) {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (file.size > this.maxFileSize) {
        throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
      }

      // Determine media type if not provided
      const mediaType = (metadata.mediaType || this.detectMediaType(file.mimetype)) as 'IMAGE' | 'VIDEO' | 'DOCUMENT';

      // Validate MIME type
      this.validateMimeType(file.mimetype, mediaType);

      // Get storage provider
      const storageProvider = this.storageFactory.getStorageProvider();
      
      // Generate unique filename and storage key
      const filename = this.generateFilename(file.originalname);
      const storageKey = storageProvider.generateKey(
        file.originalname,
        userId,
        this.getFolderByType(file.mimetype)
      );

      // Upload to storage
      const uploadResult = await storageProvider.uploadFile(file, storageKey, {
        originalName: file.originalname,
        userId,
        mediaType,
      });

      // Create media DTO
      const createMediaDto: CreateMediaDto = {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: storageKey,
        url: uploadResult.url,
        type: mediaType,
        userId,
      };

      // If it's an image, process it and get dimensions
      if (mediaType === 'IMAGE') {
        try {
          // Create temporary file for image processing
          const tempDir = path.join(process.cwd(), 'temp');
          await fs.ensureDir(tempDir);
          const tempFilePath = path.join(tempDir, filename);
          await fs.writeFile(tempFilePath, file.buffer);

          // Validate image
          const isValidImage = await this.imageProcessingService.validateImage(tempFilePath);
          if (!isValidImage) {
            throw new BadRequestException('Invalid image file');
          }

          // Get image dimensions and metadata
          const dimensions = await this.imageProcessingService.getImageDimensions(tempFilePath);
          createMediaDto.width = dimensions.width;
          createMediaDto.height = dimensions.height;

          // Get additional metadata
          const metadata = await this.imageProcessingService.getImageMetadata(tempFilePath);
          createMediaDto.metadata = {
            format: metadata.format,
            hasAlpha: metadata.hasAlpha,
            channels: metadata.channels,
            space: metadata.space,
            depth: metadata.depth,
            exif: metadata.exif,
          };

          // Clean up temporary file
          await fs.remove(tempFilePath);
        } catch (error) {
          console.warn('Could not process image:', error.message);
          // Don't fail the upload, just log the warning
        }
      }

      // Save to database
      const savedMedia = await this.mediaService.create(createMediaDto, userId);
      return savedMedia;
    } catch (error) {
      this.logger.error('Failed to upload whole file', error);
      throw error;
    }
  }

  /**
   * Optimize image with specified quality
   */
  private async optimizeImage(filePath: string, quality: number): Promise<string | null> {
    try {
      const ext = path.extname(filePath);
      const nameWithoutExt = path.basename(filePath, ext);
      const dir = path.dirname(filePath);
      const optimizedPath = path.join(dir, `${nameWithoutExt}_optimized${ext}`);

      const result = await this.imageProcessingService.optimizeImage(filePath, optimizedPath, {
        quality,
        format: 'jpeg', // Default to JPEG for optimization
      });

      return result.path;
    } catch (error) {
      console.warn('Image optimization failed:', error.message);
      return null;
    }
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(filePath: string, thumbnailPath: string, width: number = 300, height: number = 300): Promise<boolean> {
    try {
      await this.imageProcessingService.generateThumbnail(filePath, thumbnailPath, {
        width,
        height,
        quality: 80,
        format: 'jpeg',
      });
      return true;
    } catch (error) {
      console.warn('Thumbnail generation failed:', error.message);
      return false;
    }
  }

  /**
   * Convert image format
   */
  async convertImageFormat(
    filePath: string,
    outputPath: string,
    format: 'jpeg' | 'png' | 'webp' | 'avif',
    quality: number = 80,
  ): Promise<boolean> {
    try {
      await this.imageProcessingService.convertFormat(filePath, outputPath, format, quality);
      return true;
    } catch (error) {
      console.warn('Format conversion failed:', error.message);
      return false;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Get storage provider
      const storageProvider = this.storageFactory.getStorageProvider();
      
      // Delete from storage
      await storageProvider.deleteFile(filePath);
    } catch (error) {
      this.logger.error('Failed to delete file', error);
      throw error;
    }
  }

  /**
   * Get folder name based on file type
   */
  private getFolderByType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'images';
    } else if (mimeType.startsWith('video/')) {
      return 'videos';
    } else {
      return 'documents';
    }
  }

  async getFileStats(filePath: string): Promise<fs.Stats> {
    return fs.stat(filePath);
  }

  /**
   * Validate file
   */
  private validateFile(file: Express.Multer.File, uploadFileDto: UploadFileDto): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }

    this.validateMimeType(file.mimetype);
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${nameWithoutExt}_${timestamp}_${randomString}${ext}`;
  }

  /**
   * Determine media type from MIME type
   */
  private determineMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'IMAGE';
    } else if (mimeType.startsWith('video/')) {
      return 'VIDEO';
    } else if (mimeType.startsWith('audio/')) {
      return 'AUDIO';
    } else if (mimeType.includes('pdf')) {
      return 'DOCUMENT';
    } else {
      return 'FILE';
    }
  }

  /**
   * Detect media type from MIME type
   */
  private detectMediaType(mimeType: string): string {
    return this.determineMediaType(mimeType);
  }

  /**
   * Validate MIME type
   */
  private validateMimeType(mimeType: string, mediaType?: string): void {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }
  }

  /**
   * Assemble file from chunks
   */
  private async assembleFile(sessionId: string): Promise<void> {
    try {
      // Get session and chunks
      const session = await this.prisma.uploadSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException('Upload session not found');
      }

      const chunks = await this.prisma.uploadChunk.findMany({
        where: { sessionId },
        orderBy: { chunkNumber: 'asc' },
      });

      if (chunks.length !== session.totalChunks) {
        throw new BadRequestException('Not all chunks uploaded');
      }

      // Create final file
      const finalFileName = this.generateFilename(session.fileName);
      const finalPath = join(this.uploadDir, finalFileName);
      
      // Ensure upload directory exists
      await fs.ensureDir(this.uploadDir);

      // Write chunks to final file
      const writeStream = fs.createWriteStream(finalPath);
      
      for (const chunk of chunks) {
        const chunkData = await fs.readFile(chunk.chunkData);
        writeStream.write(chunkData);
      }
      
      writeStream.end();

      // Verify file integrity
      const finalFileStats = await fs.stat(finalPath);
      if (finalFileStats.size !== session.totalFileSize) {
        throw new BadRequestException('File size mismatch after assembly');
      }

      // Update session status
      await this.prisma.uploadSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' },
      });

      // Clean up chunk files
      for (const chunk of chunks) {
        await fs.remove(chunk.chunkData);
      }

      // Clean up chunk records
      await this.prisma.uploadChunk.deleteMany({
        where: { sessionId },
      });

      this.logger.log(`File assembled successfully: ${finalFileName}`);
    } catch (error) {
      this.logger.error('Failed to assemble file', error);
      throw error;
    }
  }

  /**
   * Get upload status
   */
  async getUploadStatus(sessionToken: string, userId: string) {
    try {
      const session = await this.prisma.uploadSession.findFirst({
        where: {
          sessionToken,
          userId,
        },
        include: {
          chunks: {
            select: {
              chunkNumber: true,
              chunkSize: true,
              checksum: true,
            },
          },
        },
      });

      if (!session) {
        throw new NotFoundException('Upload session not found');
      }

      const uploadedChunks = session.chunks.length;
      const progress = (uploadedChunks / session.totalChunks) * 100;

      return {
        sessionToken: session.sessionToken,
        status: session.status,
        progress: Math.round(progress),
        uploadedChunks,
        totalChunks: session.totalChunks,
        totalFileSize: session.totalFileSize,
        fileName: session.fileName,
        mimeType: session.mimeType,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        chunks: session.chunks,
      };
    } catch (error) {
      this.logger.error('Failed to get upload status', error);
      throw error;
    }
  }

  /**
   * Cancel upload session
   */
  async cancelUpload(sessionToken: string, userId: string) {
    try {
      const session = await this.prisma.uploadSession.findFirst({
        where: {
          sessionToken,
          userId,
          status: { in: ['INITIATED', 'UPLOADING'] },
        },
        include: {
          chunks: true,
        },
      });

      if (!session) {
        throw new NotFoundException('Upload session not found or cannot be cancelled');
      }

      // Clean up chunk files
      for (const chunk of session.chunks) {
        try {
          await fs.remove(chunk.chunkData);
        } catch (error) {
          this.logger.warn(`Failed to remove chunk file: ${chunk.chunkData}`, error);
        }
      }

      // Delete chunk records
      await this.prisma.uploadChunk.deleteMany({
        where: { sessionId: session.id },
      });

      // Update session status
      await this.prisma.uploadSession.update({
        where: { id: session.id },
        data: { status: 'CANCELLED' },
      });

      this.logger.log(`Upload session cancelled: ${sessionToken} for user ${userId}`);

      return {
        sessionToken,
        status: 'CANCELLED',
        message: 'Upload cancelled successfully',
        cleanedChunks: session.chunks.length,
      };
    } catch (error) {
      this.logger.error('Failed to cancel upload', error);
      throw error;
    }
  }

  /**
   * Upload multiple files in bulk
   */
  async uploadBulkFiles(
    files: Express.Multer.File | Express.Multer.File[],
    metadata: any,
    userId: string
  ) {
    try {
      // Ensure files is an array
      const fileArray = Array.isArray(files) ? files : [files];
      
      if (fileArray.length === 0) {
        throw new BadRequestException('No files provided');
      }

      const results = [];
      let successfulUploads = 0;
      let failedUploads = 0;

      // Process each file
      for (const file of fileArray) {
        try {
          // Validate file type
          this.validateMimeType(file.mimetype);

          // Create media record
          const mediaData: CreateMediaDto = {
            filename: file.originalname,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: '', // Will be updated after file is saved
            type: this.determineMediaType(file.mimetype) as 'IMAGE' | 'VIDEO' | 'DOCUMENT',
            title: file.originalname,
            description: '',
            altText: '',
            isPublic: metadata?.isPublic ?? true,
            folderId: metadata?.folderId,
            userId: userId,
          };

          // Create media record in database
          const media = await this.mediaService.create(mediaData, userId);

          // Generate unique filename
          const fileExtension = path.extname(file.originalname);
          const uniqueFilename = `${media.id}${fileExtension}`;
          const folder = this.getFolderByType(file.mimetype);
          const filePath = path.join(folder, uniqueFilename);

          // Ensure directory exists
          const fullPath = path.join(this.uploadDir, filePath);
          const dir = path.dirname(fullPath);
          if (!existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
          }

          // Save file
          await fs.writeFile(fullPath, file.buffer);

          // Update media record with file path
          const updatedMedia = await this.mediaService.update(media.id, {
            path: filePath,
            url: `/uploads/${filePath}`,
          });

          // Process image if it's an image
          if (file.mimetype.startsWith('image/')) {
            try {
              // Validate image
              const isValidImage = await this.imageProcessingService.validateImage(fullPath);
              if (isValidImage) {
                // Get image dimensions and metadata
                const dimensions = await this.imageProcessingService.getImageDimensions(fullPath);
                const imageMetadata = await this.imageProcessingService.getImageMetadata(fullPath);
                
                // Update media with image metadata
                await this.mediaService.update(media.id, {
                  width: dimensions.width,
                  height: dimensions.height,
                  metadata: imageMetadata,
                });
              }
            } catch (error) {
              this.logger.warn(`Image processing failed for ${file.originalname}:`, error);
            }
          }

          results.push({
            mediaId: media.id,
            fileName: uniqueFilename,
            publicUrl: `/uploads/${filePath}`,
            status: 'success',
          });

          successfulUploads++;
        } catch (error) {
          this.logger.error(`Failed to upload ${file.originalname}:`, error);
          results.push({
            mediaId: null,
            fileName: file.originalname,
            publicUrl: null,
            status: 'error',
            error: error.message,
          });
          failedUploads++;
        }
      }

      return {
        results,
        totalFiles: fileArray.length,
        successfulUploads,
        failedUploads,
        message: `Bulk upload completed. ${successfulUploads} successful, ${failedUploads} failed.`,
      };
    } catch (error) {
      this.logger.error('Bulk upload failed:', error);
      throw error;
    }
  }
}
