import { IsString, IsNumber, IsOptional, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitUploadDto {
  @ApiProperty({ description: 'Original filename' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'MIME type of the file' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Total file size in bytes', minimum: 1 })
  @IsNumber()
  @Min(1)
  totalFileSize: number;

  @ApiProperty({ description: 'Total number of chunks', minimum: 1 })
  @IsNumber()
  @Min(1)
  totalChunks: number;

  @ApiProperty({ description: 'Size of each chunk in bytes', minimum: 1024, maximum: 5242880 })
  @IsNumber()
  @Min(1024) // 1KB minimum
  @Max(5242880) // 5MB maximum
  chunkSize: number;

  @ApiProperty({ enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'], description: 'Type of media being uploaded' })
  @IsEnum(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'])
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';

  @ApiPropertyOptional({ description: 'Expected file checksum for integrity verification' })
  @IsOptional()
  @IsString()
  checksum?: string;

  @ApiPropertyOptional({ description: 'Title for the media (SEO-friendly)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Alt text for accessibility' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: 'Description of the media' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Associated product ID' })
  @IsOptional()
  @IsString()
  associatedProduct?: string;

  @ApiPropertyOptional({ description: 'Usage rights/license information' })
  @IsOptional()
  @IsString()
  usageRights?: string;

  @ApiPropertyOptional({ description: 'Whether the media should be public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
