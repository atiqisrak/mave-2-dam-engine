import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, Min, Max, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class OptimizeImageDto {
  @ApiProperty({ description: 'Quality setting (1-100)', required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiProperty({ description: 'Output format', enum: ['jpeg', 'png', 'webp', 'avif'], required: false })
  @IsOptional()
  @IsEnum(['jpeg', 'png', 'webp', 'avif'])
  format?: 'jpeg' | 'png' | 'webp' | 'avif';

  @ApiProperty({ description: 'Target width (optional)', required: false, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiProperty({ description: 'Target height (optional)', required: false, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  height?: number;

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
