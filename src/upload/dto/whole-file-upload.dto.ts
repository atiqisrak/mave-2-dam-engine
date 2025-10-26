import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class WholeFileUploadDto {
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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Type of media being uploaded', enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'] })
  @IsOptional()
  @IsEnum(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'])
  mediaType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
}
