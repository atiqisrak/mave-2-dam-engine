import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Query, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProcessedMediaService } from './processed-media.service';
import { ProcessedMediaCleanupService } from './processed-media-cleanup.service';
import { CreateProcessedMediaDto } from './dto/create-processed-media.dto';
import { UpdateProcessedMediaDto, GenerateShareLinkDto, MakePermanentDto, ExtendExpiryDto } from './dto/update-processed-media.dto';
import { ProcessedMedia } from './entities/processed-media.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';

@ApiTags('Processed Media')
@Controller('processed-media')
export class ProcessedMediaController {
  constructor(
    private readonly processedMediaService: ProcessedMediaService,
    private readonly cleanupService: ProcessedMediaCleanupService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all processed media for current user' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of processed media', type: [ProcessedMedia] })
  async findAll(@Request() req, @Query('includeDeleted') includeDeleted?: boolean) {
    return this.processedMediaService.findByUserId(req.user.id, includeDeleted);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get statistics for current user' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getStats(@Request() req) {
    return this.processedMediaService.getUserStats(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get processed media by ID' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 200, description: 'Processed media details', type: ProcessedMedia })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.processedMediaService.findOne(id, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update processed media' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 200, description: 'Updated processed media', type: ProcessedMedia })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProcessedMediaDto,
    @Request() req,
  ) {
    return this.processedMediaService.update(id, req.user.id, updateDto);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a shareable public link' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 201, description: 'Share link generated', type: ProcessedMedia })
  async generateShareLink(
    @Param('id') id: string,
    @Body() dto: GenerateShareLinkDto,
    @Request() req,
  ) {
    const processed = await this.processedMediaService.generateShareLink(
      id,
      req.user.id,
      dto.expiryHours || 24,
    );

    return {
      ...processed,
      shareUrl: `/api/v1/share/${processed.shareToken}`,
    };
  }

  @Delete(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke share link' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 200, description: 'Share link revoked' })
  async revokeShareLink(@Param('id') id: string, @Request() req) {
    return this.processedMediaService.revokeShareLink(id, req.user.id);
  }

  @Post(':id/make-permanent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Make processed media permanent or transfer to media library' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 201, description: 'Made permanent or transferred' })
  async makePermanent(
    @Param('id') id: string,
    @Body() dto: MakePermanentDto,
    @Request() req,
  ) {
    return this.processedMediaService.makePermanent(id, req.user.id, dto);
  }

  @Post(':id/extend-expiry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extend expiry date' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 201, description: 'Expiry extended' })
  async extendExpiry(
    @Param('id') id: string,
    @Body() dto: ExtendExpiryDto,
    @Request() req,
  ) {
    return this.processedMediaService.extendExpiry(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete processed media' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 200, description: 'Soft deleted' })
  async softDelete(@Param('id') id: string, @Request() req) {
    return this.processedMediaService.softDelete(id, req.user.id);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete processed media and file' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 204, description: 'Permanently deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id') id: string, @Request() req) {
    await this.processedMediaService.hardDelete(id, req.user.id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download processed media file' })
  @ApiParam({ name: 'id', description: 'Processed media ID' })
  @ApiResponse({ status: 200, description: 'File download' })
  async download(@Param('id') id: string, @Request() req, @Res() res: Response) {
    const processed = await this.processedMediaService.findOne(id, req.user.id);
    
    if (!await fs.pathExists(processed.filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    await this.processedMediaService.incrementDownloadCount(id);

    res.setHeader('Content-Type', processed.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${processed.originalName}"`);
    
    const fileStream = fs.createReadStream(processed.filePath);
    fileStream.pipe(res);
  }

  @Post('cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger cleanup of expired processed media files' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async triggerCleanup() {
    return this.cleanupService.triggerManualCleanup();
  }
}

// Public share link controller
@ApiTags('Public Share')
@Controller('share')
export class ShareController {
  constructor(private readonly processedMediaService: ProcessedMediaService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Access shared processed media (public)' })
  @ApiParam({ name: 'token', description: 'Share token' })
  @ApiResponse({ status: 200, description: 'Shared media details' })
  async getShared(@Param('token') token: string) {
    const processed = await this.processedMediaService.findByShareToken(token);
    return {
      id: processed.id,
      originalName: processed.originalName,
      mimeType: processed.mimeType,
      fileSize: processed.fileSize,
      width: processed.width,
      height: processed.height,
      format: processed.format,
      createdAt: processed.createdAt,
      shareExpiresAt: processed.shareExpiresAt,
      viewCount: processed.viewCount,
      downloadCount: processed.downloadCount,
    };
  }

  @Get(':token/download')
  @ApiOperation({ summary: 'Download shared processed media (public)' })
  @ApiParam({ name: 'token', description: 'Share token' })
  @ApiResponse({ status: 200, description: 'File download' })
  async downloadShared(@Param('token') token: string, @Res() res: Response) {
    const processed = await this.processedMediaService.findByShareToken(token);
    
    if (!await fs.pathExists(processed.filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    await this.processedMediaService.incrementDownloadCount(processed.id);

    res.setHeader('Content-Type', processed.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${processed.originalName}"`);
    
    const fileStream = fs.createReadStream(processed.filePath);
    fileStream.pipe(res);
  }

  @Get(':token/view')
  @ApiOperation({ summary: 'View/serve shared processed media (public)' })
  @ApiParam({ name: 'token', description: 'Share token' })
  @ApiResponse({ status: 200, description: 'File served inline' })
  async viewShared(@Param('token') token: string, @Res() res: Response) {
    const processed = await this.processedMediaService.findByShareToken(token);
    
    if (!await fs.pathExists(processed.filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    res.setHeader('Content-Type', processed.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${processed.originalName}"`);
    
    const fileStream = fs.createReadStream(processed.filePath);
    fileStream.pipe(res);
  }
}

