import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ConvertFormatDto {
  @ApiProperty({ description: 'Target format', enum: ['jpeg', 'png', 'webp', 'avif'] })
  @IsEnum(['jpeg', 'png', 'webp', 'avif'])
  format: 'jpeg' | 'png' | 'webp' | 'avif';

  @ApiProperty({ description: 'Output quality (1-100)', required: false, minimum: 1, maximum: 100 })
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
