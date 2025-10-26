import { IsString, IsNumber, IsOptional, IsBase64, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadChunkDto {
  @ApiProperty({ description: 'Upload session token' })
  @IsString()
  @IsUUID()
  sessionToken: string;

  @ApiProperty({ description: 'Chunk number (0-based)', minimum: 0 })
  @IsNumber()
  @Min(0)
  chunkNumber: number;

  @ApiProperty({ description: 'Total number of chunks expected', minimum: 1 })
  @IsNumber()
  @Min(1)
  totalChunks: number;

  @ApiProperty({ description: 'Chunk data in base64 format' })
  @IsString()
  @IsBase64()
  chunkData: string;

  @ApiProperty({ description: 'Size of this chunk in bytes', minimum: 1 })
  @IsNumber()
  @Min(1)
  chunkSize: number;

  @ApiProperty({ description: 'Total file size in bytes', minimum: 1 })
  @IsNumber()
  @Min(1)
  totalFileSize: number;

  @ApiPropertyOptional({ description: 'Chunk checksum for integrity verification' })
  @IsOptional()
  @IsString()
  checksum?: string;
}
