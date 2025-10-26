import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProcessedMediaDto {
  @ApiProperty({ description: 'Update original name', required: false })
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiProperty({ description: 'Update public URL', required: false })
  @IsOptional()
  @IsString()
  publicUrl?: string;

  @ApiProperty({ description: 'Mark as permanent', required: false })
  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;

  @ApiProperty({ description: 'Update public access', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class GenerateShareLinkDto {
  @ApiProperty({ description: 'Share link expiry in hours (default: 24)', required: false, default: 24 })
  @IsOptional()
  expiryHours?: number;
}

export class MakePermanentDto {
  @ApiProperty({ description: 'Transfer to media library', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  transferToLibrary?: boolean;

  @ApiProperty({ description: 'Folder ID if transferring to library', required: false })
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiProperty({ description: 'Title for media library entry', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Description for media library entry', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ExtendExpiryDto {
  @ApiProperty({ description: 'Additional days to extend expiry', default: 7 })
  days: number;
}

