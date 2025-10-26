import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsObject, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProcessedMediaDto {
  @ApiProperty({ description: 'Original filename' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'Stored filename on disk' })
  @IsString()
  storedFileName: string;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: 'File path on server' })
  @IsString()
  filePath: string;

  @ApiProperty({ description: 'Public accessible URL', required: false })
  @IsOptional()
  @IsString()
  publicUrl?: string;

  @ApiProperty({ description: 'Image width in pixels', required: false })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({ description: 'Image height in pixels', required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ description: 'Output format' })
  @IsString()
  format: string;

  @ApiProperty({ description: 'Processing type', enum: ['OPTIMIZE', 'THUMBNAIL', 'CONVERT', 'RESIZE', 'WATERMARK', 'FORMAT_CHANGE', 'REMOVE_BG'] })
  @IsEnum(['OPTIMIZE', 'THUMBNAIL', 'CONVERT', 'RESIZE', 'WATERMARK', 'FORMAT_CHANGE', 'REMOVE_BG'])
  processType: 'OPTIMIZE' | 'THUMBNAIL' | 'CONVERT' | 'RESIZE' | 'WATERMARK' | 'FORMAT_CHANGE' | 'REMOVE_BG';

  @ApiProperty({ description: 'Quality setting used', required: false })
  @IsOptional()
  @IsNumber()
  quality?: number;

  @ApiProperty({ description: 'Original file size before processing', required: false })
  @IsOptional()
  @IsNumber()
  originalSize?: number;

  @ApiProperty({ description: 'Compression ratio percentage', required: false })
  @IsOptional()
  @IsNumber()
  compressionRatio?: number;

  @ApiProperty({ description: 'Processing options used', required: false })
  @IsOptional()
  @IsObject()
  processingOptions?: Record<string, any>;

  @ApiProperty({ description: 'Source media ID if from gallery', required: false })
  @IsOptional()
  @IsString()
  sourceMediaId?: string;

  @ApiProperty({ description: 'Source type', enum: ['UPLOAD', 'MEDIA_LIBRARY', 'URL'] })
  @IsEnum(['UPLOAD', 'MEDIA_LIBRARY', 'URL'])
  sourceType: 'UPLOAD' | 'MEDIA_LIBRARY' | 'URL';

  @ApiProperty({ description: 'User ID who created this', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Expiry duration in days (default: 1)', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  expiryDays?: number;

  @ApiProperty({ description: 'Custom expiry date and time (ISO 8601 format)', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

