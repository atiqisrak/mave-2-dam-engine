import { ApiProperty } from '@nestjs/swagger';

export class ProcessedMedia {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Original filename' })
  originalName: string;

  @ApiProperty({ description: 'Stored filename on disk' })
  storedFileName: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'File path on server' })
  filePath: string;

  @ApiProperty({ description: 'Public accessible URL', required: false })
  publicUrl?: string;

  @ApiProperty({ description: 'Image width in pixels', required: false })
  width?: number;

  @ApiProperty({ description: 'Image height in pixels', required: false })
  height?: number;

  @ApiProperty({ description: 'Output format' })
  format: string;

  @ApiProperty({ description: 'Processing type', enum: ['OPTIMIZE', 'THUMBNAIL', 'CONVERT', 'RESIZE', 'WATERMARK', 'FORMAT_CHANGE'] })
  processType: string;

  @ApiProperty({ description: 'Quality setting used', required: false })
  quality?: number;

  @ApiProperty({ description: 'Original file size before processing', required: false })
  originalSize?: number;

  @ApiProperty({ description: 'Compression ratio percentage', required: false })
  compressionRatio?: number;

  @ApiProperty({ description: 'Processing options used', required: false })
  processingOptions?: Record<string, any>;

  @ApiProperty({ description: 'Source media ID if from gallery', required: false })
  sourceMediaId?: string;

  @ApiProperty({ description: 'Source type', enum: ['UPLOAD', 'MEDIA_LIBRARY', 'URL'] })
  sourceType: string;

  @ApiProperty({ description: 'Processing status', enum: ['TEMPORARY', 'PERMANENT', 'EXPIRED', 'DELETED'] })
  status: string;

  @ApiProperty({ description: 'Expiry timestamp', required: false })
  expiresAt?: Date;

  @ApiProperty({ description: 'Whether file is permanent' })
  isPermanent: boolean;

  @ApiProperty({ description: 'Whether file is shared' })
  isShared: boolean;

  @ApiProperty({ description: 'Share token for public access', required: false })
  shareToken?: string;

  @ApiProperty({ description: 'Share link expiry', required: false })
  shareExpiresAt?: Date;

  @ApiProperty({ description: 'Owner user ID' })
  userId: string;

  @ApiProperty({ description: 'Whether file is public' })
  isPublic: boolean;

  @ApiProperty({ description: 'Download count' })
  downloadCount: number;

  @ApiProperty({ description: 'View count' })
  viewCount: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Soft delete timestamp', required: false })
  deletedAt?: Date;
}

