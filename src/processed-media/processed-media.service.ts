import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { CreateProcessedMediaDto } from './dto/create-processed-media.dto';
import { UpdateProcessedMediaDto, MakePermanentDto, ExtendExpiryDto } from './dto/update-processed-media.dto';
import { ProcessedMedia } from './entities/processed-media.entity';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class ProcessedMediaService {
  private readonly logger = new Logger(ProcessedMediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  /**
   * Create a new processed media entry
   */
  async create(createDto: CreateProcessedMediaDto, userId: string): Promise<ProcessedMedia> {
    // Calculate expiry date: use expiresAt if provided, otherwise calculate from expiryDays
    let expiresAt: Date;
    if (createDto.expiresAt) {
      expiresAt = new Date(createDto.expiresAt);
    } else {
      const expiryDays = createDto.expiryDays || 1;
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
    }

    // Calculate compression ratio if we have both sizes
    let compressionRatio = createDto.compressionRatio;
    if (!compressionRatio && createDto.originalSize && createDto.fileSize) {
      compressionRatio = ((createDto.originalSize - createDto.fileSize) / createDto.originalSize) * 100;
    }

    const processed = await this.prisma.processedMedia.create({
      data: {
        originalName: createDto.originalName,
        storedFileName: createDto.storedFileName,
        mimeType: createDto.mimeType,
        fileSize: createDto.fileSize,
        filePath: createDto.filePath,
        publicUrl: createDto.publicUrl,
        width: createDto.width,
        height: createDto.height,
        format: createDto.format,
        processType: createDto.processType,
        quality: createDto.quality,
        originalSize: createDto.originalSize,
        compressionRatio,
        processingOptions: createDto.processingOptions || {},
        sourceMediaId: createDto.sourceMediaId,
        sourceType: createDto.sourceType,
        userId,
        expiresAt,
        status: 'TEMPORARY',
      },
    });

    this.logger.log(`Created processed media ${processed.id} for user ${userId}, expires at ${expiresAt}`);
    return processed as ProcessedMedia;
  }

  /**
   * Find all processed media for a user
   */
  async findByUserId(userId: string, includeDeleted = false): Promise<ProcessedMedia[]> {
    const where: any = { userId };
    
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.processedMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) as Promise<ProcessedMedia[]>;
  }

  /**
   * Find one by ID
   */
  async findOne(id: string, userId?: string): Promise<ProcessedMedia> {
    const processed = await this.prisma.processedMedia.findUnique({
      where: { id },
    });

    if (!processed) {
      throw new NotFoundException('Processed media not found');
    }

    if (processed.deletedAt) {
      throw new NotFoundException('Processed media has been deleted');
    }

    if (userId && processed.userId !== userId && !processed.isPublic) {
      throw new ForbiddenException('You do not have access to this processed media');
    }

    return processed as ProcessedMedia;
  }

  /**
   * Find by share token (public access)
   */
  async findByShareToken(token: string): Promise<ProcessedMedia> {
    const processed = await this.prisma.processedMedia.findUnique({
      where: { shareToken: token },
    });

    if (!processed) {
      throw new NotFoundException('Share link not found');
    }

    if (processed.deletedAt) {
      throw new NotFoundException('This file has been deleted');
    }

    if (!processed.isShared) {
      throw new BadRequestException('This file is not shared');
    }

    // Check if share link has expired
    if (processed.shareExpiresAt && new Date() > processed.shareExpiresAt) {
      throw new BadRequestException('This share link has expired');
    }

    // Check if the file itself has expired (for temporary files)
    if (processed.expiresAt && new Date() > processed.expiresAt) {
      throw new BadRequestException('This file has expired');
    }

    // Increment view count
    await this.prisma.processedMedia.update({
      where: { id: processed.id },
      data: { viewCount: { increment: 1 } },
    });

    return processed as ProcessedMedia;
  }

  /**
   * Update processed media
   */
  async update(id: string, userId: string, updateDto: UpdateProcessedMediaDto): Promise<ProcessedMedia> {
    const processed = await this.findOne(id, userId);

    const updated = await this.prisma.processedMedia.update({
      where: { id },
      data: updateDto,
    });

    return updated as ProcessedMedia;
  }

  /**
   * Generate a share link
   */
  async generateShareLink(id: string, userId: string, expiryHours = 24): Promise<ProcessedMedia> {
    const processed = await this.findOne(id, userId);

    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareExpiresAt = new Date();
    shareExpiresAt.setHours(shareExpiresAt.getHours() + expiryHours);

    const updated = await this.prisma.processedMedia.update({
      where: { id },
      data: {
        isShared: true,
        shareToken,
        shareExpiresAt,
      },
    });

    this.logger.log(`Generated share link for ${id}, expires at ${shareExpiresAt}`);
    return updated as ProcessedMedia;
  }

  /**
   * Revoke share link
   */
  async revokeShareLink(id: string, userId: string): Promise<ProcessedMedia> {
    const processed = await this.findOne(id, userId);

    const updated = await this.prisma.processedMedia.update({
      where: { id },
      data: {
        isShared: false,
        shareToken: null,
        shareExpiresAt: null,
      },
    });

    this.logger.log(`Revoked share link for ${id}`);
    return updated as ProcessedMedia;
  }

  /**
   * Make permanent (remove expiry)
   */
  async makePermanent(id: string, userId: string, dto: MakePermanentDto): Promise<ProcessedMedia | any> {
    const processed = await this.findOne(id, userId);

    // If transferring to media library
    if (dto.transferToLibrary) {
      const media = await this.mediaService.create({
        filename: processed.storedFileName,
        originalName: dto.title || processed.originalName,
        mimeType: processed.mimeType,
        size: processed.fileSize,
        path: processed.filePath,
        url: processed.publicUrl,
        type: 'IMAGE',
        width: processed.width,
        height: processed.height,
        isPublic: processed.isPublic,
        title: dto.title,
        description: dto.description,
        folderId: dto.folderId,
        userId,
        metadata: {
          transferredFrom: 'processed_media',
          processedMediaId: processed.id,
          processType: processed.processType,
          quality: processed.quality,
          originalSize: processed.originalSize,
          compressionRatio: processed.compressionRatio,
        },
      }, userId);

      // Mark processed media as transferred
      await this.prisma.processedMedia.update({
        where: { id },
        data: {
          status: 'PERMANENT',
          isPermanent: true,
          expiresAt: null,
        },
      });

      this.logger.log(`Transferred processed media ${id} to media library as ${media.id}`);
      return { processedMedia: processed, media };
    }

    // Just make it permanent without transferring
    const updated = await this.prisma.processedMedia.update({
      where: { id },
      data: {
        status: 'PERMANENT',
        isPermanent: true,
        expiresAt: null,
      },
    });

    this.logger.log(`Made processed media ${id} permanent`);
    return updated as ProcessedMedia;
  }

  /**
   * Extend expiry
   */
  async extendExpiry(id: string, userId: string, dto: ExtendExpiryDto): Promise<ProcessedMedia> {
    const processed = await this.findOne(id, userId);

    if (processed.isPermanent) {
      throw new BadRequestException('Permanent files do not have expiry');
    }

    // Get current expiry date
    const currentDate = processed.expiresAt 
      ? (processed.expiresAt instanceof Date ? processed.expiresAt : new Date(processed.expiresAt))
      : new Date();
    
    // Calculate new expiry date
    const newExpiresAt = new Date(currentDate.getTime());
    newExpiresAt.setDate(newExpiresAt.getDate() + dto.days);

    const updated = await this.prisma.processedMedia.update({
      where: { id },
      data: { expiresAt: newExpiresAt },
    });

    this.logger.log(`Extended expiry for ${id} by ${dto.days} days to ${newExpiresAt.toISOString()}`);
    return updated as ProcessedMedia;
  }

  /**
   * Soft delete
   */
  async softDelete(id: string, userId: string): Promise<ProcessedMedia> {
    const processed = await this.findOne(id, userId);

    const updated = await this.prisma.processedMedia.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Soft deleted processed media ${id}`);
    return updated as ProcessedMedia;
  }

  /**
   * Hard delete (remove from database and disk)
   */
  async hardDelete(id: string, userId: string): Promise<void> {
    const processed = await this.findOne(id, userId);

    // Delete file from disk
    try {
      if (await fs.pathExists(processed.filePath)) {
        await fs.remove(processed.filePath);
        this.logger.log(`Deleted file from disk: ${processed.filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file from disk: ${error.message}`);
    }

    // Delete from database
    await this.prisma.processedMedia.delete({
      where: { id },
    });

    this.logger.log(`Hard deleted processed media ${id}`);
  }

  /**
   * Find expired processed media for cleanup
   */
  async findExpired(): Promise<ProcessedMedia[]> {
    const now = new Date();

    return this.prisma.processedMedia.findMany({
      where: {
        status: 'TEMPORARY',
        expiresAt: {
          lte: now,
        },
        deletedAt: null,
      },
    }) as Promise<ProcessedMedia[]>;
  }

  /**
   * Cleanup expired files (for scheduler)
   */
  async cleanupExpired(): Promise<{ deleted: number; errors: string[] }> {
    const expired = await this.findExpired();
    const errors: string[] = [];
    let deleted = 0;

    this.logger.log(`Found ${expired.length} expired processed media files to cleanup`);

    for (const processed of expired) {
      try {
        // Delete file from disk
        if (await fs.pathExists(processed.filePath)) {
          await fs.remove(processed.filePath);
        }

        // Mark as expired in database
        await this.prisma.processedMedia.update({
          where: { id: processed.id },
          data: {
            status: 'EXPIRED',
            deletedAt: new Date(),
          },
        });

        deleted++;
      } catch (error) {
        const errorMsg = `Failed to cleanup ${processed.id}: ${error.message}`;
        this.logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    this.logger.log(`Cleanup completed: ${deleted} files deleted, ${errors.length} errors`);
    return { deleted, errors };
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id: string): Promise<void> {
    await this.prisma.processedMedia.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  /**
   * Get statistics for user
   */
  async getUserStats(userId: string): Promise<any> {
    const stats = await this.prisma.processedMedia.groupBy({
      by: ['status', 'processType'],
      where: {
        userId,
        deletedAt: null,
      },
      _count: true,
      _sum: {
        fileSize: true,
      },
    });

    const total = await this.prisma.processedMedia.count({
      where: { userId, deletedAt: null },
    });

    const totalSize = await this.prisma.processedMedia.aggregate({
      where: { userId, deletedAt: null },
      _sum: { fileSize: true },
    });

    return {
      total,
      totalSize: totalSize._sum.fileSize || 0,
      byStatus: stats,
    };
  }
}

