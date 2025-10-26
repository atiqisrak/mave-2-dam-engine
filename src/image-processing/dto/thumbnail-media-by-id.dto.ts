import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ThumbnailMediaByIdDto {
  @ApiProperty({ description: 'Thumbnail width', required: false, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiProperty({ description: 'Thumbnail height', required: false, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  height?: number;

  @ApiProperty({ description: 'Thumbnail quality (1-100)', required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiProperty({ description: 'Expiry in days (default: 1)', required: false, default: 1, minimum: 1, maximum: 365 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : 1)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  expiryDays?: number;

  @ApiProperty({ description: 'Custom expiry date and time (ISO 8601 format)', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
