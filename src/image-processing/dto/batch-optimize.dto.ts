import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class BatchOptimizeDto {
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
}
