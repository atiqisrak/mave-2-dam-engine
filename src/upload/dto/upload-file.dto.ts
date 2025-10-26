import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UploadFileDto {
  @ApiProperty({ description: 'User ID uploading the file', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Maximum file size in bytes', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @Type(() => Number)
  @IsNumber()
  maxSize?: number;

  @ApiProperty({ description: 'Allowed file types', required: false })
  @IsOptional()
  @IsString()
  allowedTypes?: string;

  @ApiProperty({ description: 'Quality setting for optimization', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @Type(() => Number)
  @IsNumber()
  quality?: number;
}
