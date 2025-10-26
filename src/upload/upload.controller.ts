import { 
  Controller, 
  Post, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  Param, 
  Get, 
  Delete,
  UseGuards,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiConsumes, 
  ApiBody, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam 
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { InitUploadDto } from './dto/init-upload.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { WholeFileUploadDto } from './dto/whole-file-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('File Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('init')
  @ApiOperation({ 
    summary: 'Initialize chunked upload session',
    description: 'Creates a new upload session for chunked file uploads. Use this for large files that need to be uploaded in parts.'
  })
  @ApiBody({ type: InitUploadDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Upload session created successfully',
    schema: {
      type: 'object',
      properties: {
        sessionToken: { type: 'string', description: 'Unique token for this upload session' },
        totalChunks: { type: 'number', description: 'Total number of chunks expected' },
        chunkSize: { type: 'number', description: 'Size of each chunk in bytes' },
        expiresAt: { type: 'string', format: 'date-time', description: 'When the session expires' },
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initUpload(
    @Body() initDto: InitUploadDto,
    @Request() req: any
  ) {
    return this.uploadService.initUpload(initDto, req.user.id);
  }

  @Post('chunk')
  @ApiOperation({ 
    summary: 'Upload a file chunk',
    description: 'Uploads a single chunk of a file. Must be called multiple times until all chunks are uploaded.'
  })
  @ApiBody({ type: UploadChunkDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Chunk uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        chunkNumber: { type: 'number', description: 'The uploaded chunk number' },
        uploadedChunks: { type: 'number', description: 'Total chunks uploaded so far' },
        totalChunks: { type: 'number', description: 'Total chunks expected' },
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid chunk data or session mismatch' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Upload session not found' })
  async uploadChunk(
    @Body() uploadChunkDto: UploadChunkDto,
    @Request() req: any
  ) {
    return this.uploadService.uploadChunk(uploadChunkDto, req.user.id);
  }

  @Post('whole-file')
  @ApiOperation({ 
    summary: 'Upload complete file',
    description: 'Uploads a complete file in a single request. Best for smaller files (< 10MB).'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload'
        },
        title: {
          type: 'string',
          description: 'SEO-friendly title for the media'
        },
        altText: {
          type: 'string',
          description: 'Alt text for accessibility'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the media'
        },
        associatedProduct: {
          type: 'string',
          description: 'Associated product ID'
        },
        usageRights: {
          type: 'string',
          description: 'Usage rights/license information'
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether the media should be public',
          default: true
        },
        mediaType: {
          type: 'string',
          enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'],
          description: 'Type of media being uploaded'
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        mediaId: { type: 'string', description: 'Unique identifier for the uploaded media' },
        fileName: { type: 'string', description: 'Stored filename on server' },
        publicUrl: { type: 'string', description: 'Public accessible URL' },
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid file or metadata' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async uploadWholeFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
        ],
      }),
    ) file: Express.Multer.File,
    @Body() metadata: WholeFileUploadDto,
    @Request() req: any
  ) {
    return this.uploadService.uploadWholeFile(file, metadata, req.user.id);
  }

  @Get('status/:sessionToken')
  @ApiOperation({ 
    summary: 'Get upload session status',
    description: 'Retrieves the current status and progress of a chunked upload session.'
  })
  @ApiParam({ name: 'sessionToken', description: 'Upload session token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Upload status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessionToken: { type: 'string', description: 'Upload session token' },
        status: { type: 'string', enum: ['INITIATED', 'UPLOADING', 'COMPLETED', 'FAILED', 'EXPIRED'], description: 'Current session status' },
        totalChunks: { type: 'number', description: 'Total chunks expected' },
        uploadedChunks: { type: 'number', description: 'Chunks uploaded so far' },
        progress: { type: 'number', description: 'Upload progress percentage' },
        expiresAt: { type: 'string', format: 'date-time', description: 'When the session expires' },
        chunks: { 
          type: 'array', 
          items: {
            type: 'object',
            properties: {
              chunkNumber: { type: 'number' },
              receivedAt: { type: 'string', format: 'date-time' }
            }
          },
          description: 'Details of uploaded chunks'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Upload session not found' })
  async getUploadStatus(
    @Param('sessionToken') sessionToken: string,
    @Request() req: any
  ) {
    return this.uploadService.getUploadStatus(sessionToken, req.user.id);
  }

  @Delete('cancel/:sessionToken')
  @ApiOperation({ 
    summary: 'Cancel upload session',
    description: 'Cancels an active upload session and cleans up any uploaded chunks.'
  })
  @ApiParam({ name: 'sessionToken', description: 'Upload session token to cancel' })
  @ApiResponse({ 
    status: 200, 
    description: 'Upload cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Upload session not found or cannot be cancelled' })
  async cancelUpload(
    @Param('sessionToken') sessionToken: string,
    @Request() req: any
  ) {
    return this.uploadService.cancelUpload(sessionToken, req.user.id);
  }

  @Post('resume/:sessionToken')
  @ApiOperation({ 
    summary: 'Resume interrupted upload',
    description: 'Resumes an interrupted upload session by checking which chunks are already uploaded.'
  })
  @ApiParam({ name: 'sessionToken', description: 'Upload session token to resume' })
  @ApiResponse({ 
    status: 200, 
    description: 'Upload session resumed successfully',
    schema: {
      type: 'object',
      properties: {
        sessionToken: { type: 'string', description: 'Upload session token' },
        status: { type: 'string', description: 'Current session status' },
        totalChunks: { type: 'number', description: 'Total chunks expected' },
        uploadedChunks: { type: 'number', description: 'Chunks already uploaded' },
        missingChunks: { type: 'array', items: { type: 'number' }, description: 'Chunk numbers that still need to be uploaded' },
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Upload session not found' })
  async resumeUpload(
    @Param('sessionToken') sessionToken: string,
    @Request() req: any
  ) {
    // This would implement resume logic
    // For now, just return the current status
    const status = await this.uploadService.getUploadStatus(sessionToken, req.user.id);
    const missingChunks = [];
    
    for (let i = 0; i < status.totalChunks; i++) {
      if (!status.chunks.find(chunk => chunk.chunkNumber === i)) {
        missingChunks.push(i);
      }
    }

    return {
      ...status,
      missingChunks,
      message: 'Upload session resumed successfully'
    };
  }

  @Post('bulk')
  @ApiOperation({ 
    summary: 'Bulk upload multiple files',
    description: 'Uploads multiple files in a single request. Best for smaller files (< 10MB each).'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          },
          description: 'Multiple files to upload'
        },
        metadata: {
          type: 'object',
          description: 'Common metadata for all files',
          properties: {
            isPublic: { type: 'boolean', default: true },
            folderId: { type: 'string' }
          }
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('files'))
  @ApiResponse({ 
    status: 201, 
    description: 'Files uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mediaId: { type: 'string' },
              fileName: { type: 'string' },
              publicUrl: { type: 'string' },
              status: { type: 'string', enum: ['success', 'error'] },
              error: { type: 'string' }
            }
          }
        },
        totalFiles: { type: 'number' },
        successfulUploads: { type: 'number' },
        failedUploads: { type: 'number' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid files or metadata' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'Files too large' })
  async uploadBulkFiles(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB per file
        ],
        fileIsRequired: false,
      }),
    ) files: Express.Multer.File | Express.Multer.File[],
    @Body() metadata: any,
    @Request() req: any
  ) {
    return this.uploadService.uploadBulkFiles(files, metadata, req.user.id);
  }
}
