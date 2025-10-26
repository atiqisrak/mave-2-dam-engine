import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { StorageConfigService } from './config.service';
import { StorageConfig } from './config.service';

@ApiTags('Configuration')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: StorageConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get current storage configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getConfig(): Promise<StorageConfig> {
    return this.configService.getConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Update storage configuration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uploadDir: { type: 'string', description: 'Main upload directory' },
        optimizedDir: { type: 'string', description: 'Optimized images directory' },
        thumbnailsDir: { type: 'string', description: 'Thumbnails directory' },
        convertedDir: { type: 'string', description: 'Converted files directory' },
        batchDir: { type: 'string', description: 'Batch processed files directory' },
        maxFileSize: { type: 'number', description: 'Maximum file size in bytes' },
        allowedImageTypes: { type: 'array', items: { type: 'string' }, description: 'Allowed image MIME types' },
        allowedVideoTypes: { type: 'array', items: { type: 'string' }, description: 'Allowed video MIME types' },
        allowedDocumentTypes: { type: 'array', items: { type: 'string' }, description: 'Allowed document MIME types' },
        nginxConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Enable nginx configuration' },
            baseUrl: { type: 'string', description: 'Base URL for nginx' },
            cacheEnabled: { type: 'boolean', description: 'Enable caching' },
            cacheMaxAge: { type: 'number', description: 'Cache max age in seconds' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(@Body() config: Partial<StorageConfig>): Promise<StorageConfig> {
    return this.configService.updateConfig(config);
  }

  @Get('directories')
  @ApiOperation({ summary: 'List all storage directories and their status' })
  @ApiResponse({ status: 200, description: 'Directories listed successfully' })
  async listDirectories(): Promise<{
    directories: Array<{
      name: string;
      path: string;
      exists: boolean;
      writable: boolean;
      size: number;
    }>;
  }> {
    const config = this.configService.getConfig();
    const fs = require('fs-extra');
    const path = require('path');

    const directories = [
      { name: 'Upload Directory', path: config.uploadDir },
      { name: 'Optimized Directory', path: config.optimizedDir },
      { name: 'Thumbnails Directory', path: config.thumbnailsDir },
      { name: 'Converted Directory', path: config.convertedDir },
      { name: 'Batch Directory', path: config.batchDir },
    ];

    const results = await Promise.all(
      directories.map(async (dir) => {
        const fullPath = path.resolve(dir.path);
        const exists = await fs.pathExists(fullPath);
        let writable = false;
        let size = 0;

        if (exists) {
          try {
            await fs.access(fullPath, fs.constants.W_OK);
            writable = true;
            const stats = await fs.stat(fullPath);
            size = stats.size;
          } catch (error) {
            writable = false;
          }
        }

        return {
          name: dir.name,
          path: fullPath,
          exists,
          writable,
          size,
        };
      })
    );

    return { directories: results };
  }

  @Post('directories/ensure')
  @ApiOperation({ summary: 'Create all required directories' })
  @ApiResponse({ status: 200, description: 'Directories created successfully' })
  async ensureDirectories(): Promise<{ message: string; directories: string[] }> {
    await this.configService.ensureDirectories();
    const config = this.configService.getConfig();
    
    return {
      message: 'All directories created successfully',
      directories: [
        config.uploadDir,
        config.optimizedDir,
        config.thumbnailsDir,
        config.convertedDir,
        config.batchDir,
      ],
    };
  }

  @Get('nginx')
  @ApiOperation({ summary: 'Get nginx configuration' })
  @ApiResponse({ status: 200, description: 'Nginx configuration generated' })
  async getNginxConfig(): Promise<{ config: string; enabled: boolean }> {
    const nginxConfig = this.configService.getNginxConfig();
    const config = await this.configService.generateNginxConfig();
    
    return {
      config,
      enabled: nginxConfig.enabled,
    };
  }

  @Post('nginx/generate')
  @ApiOperation({ summary: 'Generate and save nginx configuration file' })
  @ApiResponse({ status: 200, description: 'Nginx configuration file generated' })
  async generateNginxConfigFile(): Promise<{ message: string; filePath: string }> {
    const config = await this.configService.generateNginxConfig();
    const fs = require('fs-extra');
    const path = require('path');
    
    const filePath = path.join(process.cwd(), 'nginx-oreo.conf');
    await fs.writeFile(filePath, config);
    
    return {
      message: 'Nginx configuration file generated successfully',
      filePath,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get storage statistics' })
  @ApiResponse({ status: 200, description: 'Storage statistics retrieved' })
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
    directories: Record<string, { count: number; size: number }>;
  }> {
    const fs = require('fs-extra');
    const path = require('path');
    const config = this.configService.getConfig();

    const directories = [
      { name: 'uploads', path: config.uploadDir },
      { name: 'optimized', path: config.optimizedDir },
      { name: 'thumbnails', path: config.thumbnailsDir },
      { name: 'converted', path: config.convertedDir },
      { name: 'batch', path: config.batchDir },
    ];

    let totalFiles = 0;
    let totalSize = 0;
    const byType: Record<string, { count: number; size: number }> = {};
    const dirStats: Record<string, { count: number; size: number }> = {};

    for (const dir of directories) {
      let dirCount = 0;
      let dirSize = 0;

      if (await fs.pathExists(dir.path)) {
        const files = await fs.readdir(dir.path, { withFileTypes: true });
        
        for (const file of files) {
          if (file.isFile()) {
            const filePath = path.join(dir.path, file.name);
            const stats = await fs.stat(filePath);
            
            dirCount++;
            dirSize += stats.size;
            totalFiles++;
            totalSize += stats.size;

            // Categorize by file extension
            const ext = path.extname(file.name).toLowerCase();
            if (!byType[ext]) {
              byType[ext] = { count: 0, size: 0 };
            }
            byType[ext].count++;
            byType[ext].size += stats.size;
          }
        }
      }

      dirStats[dir.name] = { count: dirCount, size: dirSize };
    }

    return {
      totalFiles,
      totalSize,
      byType,
      directories: dirStats,
    };
  }
}
