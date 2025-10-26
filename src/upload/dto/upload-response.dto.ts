import { ApiProperty } from '@nestjs/swagger';

export class InitUploadResponseDto {
  @ApiProperty({ description: 'Unique token for this upload session' })
  sessionToken: string;

  @ApiProperty({ description: 'Total number of chunks expected' })
  totalChunks: number;

  @ApiProperty({ description: 'Size of each chunk in bytes' })
  chunkSize: number;

  @ApiProperty({ description: 'When the session expires', format: 'date-time' })
  expiresAt: Date;

  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class UploadChunkResponseDto {
  @ApiProperty({ description: 'The uploaded chunk number' })
  chunkNumber: number;

  @ApiProperty({ description: 'Total chunks uploaded so far' })
  uploadedChunks: number;

  @ApiProperty({ description: 'Total chunks expected' })
  totalChunks: number;

  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class WholeFileUploadResponseDto {
  @ApiProperty({ description: 'Unique identifier for the uploaded media' })
  mediaId: string;

  @ApiProperty({ description: 'Stored filename on server' })
  fileName: string;

  @ApiProperty({ description: 'Public accessible URL' })
  publicUrl: string;

  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class UploadStatusResponseDto {
  @ApiProperty({ description: 'Upload session token' })
  sessionToken: string;

  @ApiProperty({ 
    enum: ['INITIATED', 'UPLOADING', 'COMPLETED', 'FAILED', 'EXPIRED'],
    description: 'Current session status' 
  })
  status: string;

  @ApiProperty({ description: 'Total chunks expected' })
  totalChunks: number;

  @ApiProperty({ description: 'Chunks uploaded so far' })
  uploadedChunks: number;

  @ApiProperty({ description: 'Upload progress percentage' })
  progress: number;

  @ApiProperty({ description: 'When the session expires', format: 'date-time' })
  expiresAt: Date;

  @ApiProperty({ 
    type: 'array',
    items: {
      type: 'object',
      properties: {
        chunkNumber: { type: 'number' },
        receivedAt: { type: 'string', format: 'date-time' }
      }
    },
    description: 'Details of uploaded chunks' 
  })
  chunks: Array<{ chunkNumber: number; receivedAt: Date }>;
}

export class ResumeUploadResponseDto extends UploadStatusResponseDto {
  @ApiProperty({ 
    type: 'array',
    items: { type: 'number' },
    description: 'Chunk numbers that still need to be uploaded' 
  })
  missingChunks: number[];

  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class CancelUploadResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;
}
