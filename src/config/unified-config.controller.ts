import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UnifiedConfigService, UnifiedConfig, ConfigType, ConfigCategory } from './unified-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

export class UpdateConfigDto {
  [key: string]: any;
}

export class CreateConfigDto {
  key: string;
  value: string;
  type: ConfigType;
  category: ConfigCategory;
  description?: string;
  isEncrypted?: boolean;
  isReadOnly?: boolean;
}

@ApiTags('Unified Configuration')
@Controller('api/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UnifiedConfigController {
  constructor(
    private readonly configService: UnifiedConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get complete unified configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  @Roles('ADMIN')
  getConfig(): UnifiedConfig {
    return this.configService.getConfig();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get configuration by categories' })
  @ApiQuery({ name: 'category', required: false, enum: ConfigCategory })
  @ApiResponse({ status: 200, description: 'Configuration categories retrieved successfully' })
  @Roles('ADMIN')
  async getConfigByCategory(@Query('category') category?: ConfigCategory) {
    if (category) {
      const configs = await this.prisma.configuration.findMany({
        where: { category },
        orderBy: { key: 'asc' },
      });
      return configs;
    }

    const categories = await this.prisma.configuration.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.category,
    }));
  }

  @Get('storage')
  @ApiOperation({ summary: 'Get storage configuration' })
  @ApiResponse({ status: 200, description: 'Storage configuration retrieved successfully' })
  @Roles('ADMIN')
  getStorageConfig() {
    return this.configService.getStorageConfig();
  }

  @Get('upload')
  @ApiOperation({ summary: 'Get upload configuration' })
  @ApiResponse({ status: 200, description: 'Upload configuration retrieved successfully' })
  @Roles('ADMIN')
  getUploadConfig() {
    return this.configService.getUploadConfig();
  }

  @Get('media-processing')
  @ApiOperation({ summary: 'Get media processing configuration' })
  @ApiResponse({ status: 200, description: 'Media processing configuration retrieved successfully' })
  @Roles('ADMIN')
  getMediaProcessingConfig() {
    return this.configService.getMediaProcessingConfig();
  }

  @Get('security')
  @ApiOperation({ summary: 'Get security configuration' })
  @ApiResponse({ status: 200, description: 'Security configuration retrieved successfully' })
  @Roles('ADMIN')
  getSecurityConfig() {
    return this.configService.getSecurityConfig();
  }

  @Get('rate-limiting')
  @ApiOperation({ summary: 'Get rate limiting configuration' })
  @ApiResponse({ status: 200, description: 'Rate limiting configuration retrieved successfully' })
  @Roles('ADMIN')
  getRateLimitConfig() {
    return this.configService.getRateLimitConfig();
  }

  @Get('logging')
  @ApiOperation({ summary: 'Get logging configuration' })
  @ApiResponse({ status: 200, description: 'Logging configuration retrieved successfully' })
  @Roles('ADMIN')
  getLoggingConfig() {
    return this.configService.getLoggingConfig();
  }

  @Get('monitoring')
  @ApiOperation({ summary: 'Get monitoring configuration' })
  @ApiResponse({ status: 200, description: 'Monitoring configuration retrieved successfully' })
  @Roles('ADMIN')
  getMonitoringConfig() {
    return this.configService.getMonitoringConfig();
  }

  @Get('nginx')
  @ApiOperation({ summary: 'Get nginx configuration' })
  @ApiResponse({ status: 200, description: 'Nginx configuration retrieved successfully' })
  @Roles('ADMIN')
  getNginxConfig() {
    return this.configService.getNginxConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Update configuration' })
  @ApiBody({ type: UpdateConfigDto })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @Roles('ADMIN')
  async updateConfig(@Body() updates: UpdateConfigDto): Promise<UnifiedConfig> {
    return this.configService.updateConfig(updates);
  }

  @Post('storage-provider')
  @ApiOperation({ summary: 'Change storage provider' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        provider: { type: 'string', enum: ['local', 'aws', 'gcp', 'azure'] },
        config: { type: 'object' }
      },
      required: ['provider']
    }
  })
  @ApiResponse({ status: 200, description: 'Storage provider changed successfully' })
  @Roles('ADMIN')
  async changeStorageProvider(@Body() body: { provider: 'local' | 'aws' | 'gcp' | 'azure'; config?: any }) {
    const updates: Partial<UnifiedConfig> = {
      storageProvider: body.provider,
    };

    if (body.config) {
      Object.assign(updates, body.config);
    }

    return this.configService.updateConfig(updates);
  }

  @Post('cloud-storage')
  @ApiOperation({ summary: 'Configure cloud storage' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        provider: { type: 'string' },
        bucket: { type: 'string' },
        region: { type: 'string' },
        accessKeyId: { type: 'string' },
        secretAccessKey: { type: 'string' },
        baseUrl: { type: 'string' },
        cdnUrl: { type: 'string' },
        enableCdn: { type: 'boolean' },
      },
      required: ['provider', 'bucket', 'region']
    }
  })
  @ApiResponse({ status: 200, description: 'Cloud storage configured successfully' })
  @Roles('ADMIN')
  async configureCloudStorage(@Body() config: any) {
    const updates: Partial<UnifiedConfig> = {
      cloudStorageProvider: config.provider,
      cloudStorageBucket: config.bucket,
      cloudStorageRegion: config.region,
      awsAccessKeyId: config.accessKeyId || '',
      awsSecretAccessKey: config.secretAccessKey || '',
      cloudStorageBaseUrl: config.baseUrl || '',
      cloudStorageCdnUrl: config.cdnUrl || '',
      enableCdn: config.enableCdn || false,
      cdnUrl: config.cdnUrl || '',
    };

    return this.configService.updateConfig(updates);
  }

  @Post('upload-limits')
  @ApiOperation({ summary: 'Configure upload limits' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        maxFileSize: { type: 'number' },
        chunkSize: { type: 'number' },
        allowedImageTypes: { type: 'array', items: { type: 'string' } },
        allowedVideoTypes: { type: 'array', items: { type: 'string' } },
        allowedDocumentTypes: { type: 'array', items: { type: 'string' } },
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Upload limits configured successfully' })
  @Roles('ADMIN')
  async configureUploadLimits(@Body() config: any) {
    const updates: Partial<UnifiedConfig> = {
      maxFileSize: config.maxFileSize,
      chunkSize: config.chunkSize,
      allowedImageTypes: config.allowedImageTypes,
      allowedVideoTypes: config.allowedVideoTypes,
      allowedDocumentTypes: config.allowedDocumentTypes,
    };

    return this.configService.updateConfig(updates);
  }

  @Post('media-processing')
  @ApiOperation({ summary: 'Configure media processing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enableImageOptimization: { type: 'boolean' },
        enableVideoProcessing: { type: 'boolean' },
        enableDocumentProcessing: { type: 'boolean' },
        maxImageDimension: { type: 'number' },
        maxVideoDuration: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Media processing configured successfully' })
  @Roles('ADMIN')
  async configureMediaProcessing(@Body() config: any) {
    const updates: Partial<UnifiedConfig> = {
      enableImageOptimization: config.enableImageOptimization,
      enableVideoProcessing: config.enableVideoProcessing,
      enableDocumentProcessing: config.enableDocumentProcessing,
      maxImageDimension: config.maxImageDimension,
      maxVideoDuration: config.maxVideoDuration,
    };

    return this.configService.updateConfig(updates);
  }

  @Post('security')
  @ApiOperation({ summary: 'Configure security settings' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        jwtSecret: { type: 'string' },
        jwtExpiresIn: { type: 'string' },
        bcryptRounds: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Security settings configured successfully' })
  @Roles('ADMIN')
  async configureSecurity(@Body() config: any) {
    const updates: Partial<UnifiedConfig> = {
      jwtSecret: config.jwtSecret,
      jwtExpiresIn: config.jwtExpiresIn,
      bcryptRounds: config.bcryptRounds,
    };

    return this.configService.updateConfig(updates);
  }

  @Post('rate-limiting')
  @ApiOperation({ summary: 'Configure rate limiting' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        window: { type: 'string' },
        maxRequests: { type: 'number' },
        ttl: { type: 'number' },
        limit: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Rate limiting configured successfully' })
  @Roles('ADMIN')
  async configureRateLimiting(@Body() config: any) {
    const updates: Partial<UnifiedConfig> = {
      rateLimitWindow: config.window,
      rateLimitMaxRequests: config.maxRequests,
      rateLimitTtl: config.ttl,
      rateLimitLimit: config.limit,
    };

    return this.configService.updateConfig(updates);
  }

  @Post('logging')
  @ApiOperation({ summary: 'Configure logging' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        level: { type: 'string' },
        file: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Logging configured successfully' })
  @Roles('ADMIN')
  async configureLogging(@Body() config: any) {
    const updates: Partial<UnifiedConfig> = {
      logLevel: config.level,
      logFile: config.file,
    };

    return this.configService.updateConfig(updates);
  }

  @Post('nginx')
  @ApiOperation({ summary: 'Configure nginx settings' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        baseUrl: { type: 'string' },
        cacheEnabled: { type: 'boolean' },
        cacheMaxAge: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Nginx settings configured successfully' })
  @Roles('ADMIN')
  async configureNginx(@Body() config: any) {
    const updates: Partial<UnifiedConfig> = {
      nginxEnabled: config.enabled,
      nginxBaseUrl: config.baseUrl,
      nginxCacheEnabled: config.cacheEnabled,
      nginxCacheMaxAge: config.cacheMaxAge,
    };

    return this.configService.updateConfig(updates);
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get specific configuration by key' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  @Roles('ADMIN')
  async getConfigByKey(@Param('key') key: string) {
    const config = await this.prisma.configuration.findUnique({
      where: { key },
    });

    if (!config) {
      return { error: 'Configuration not found' };
    }

    return config;
  }

  @Put('key/:key')
  @ApiOperation({ summary: 'Update specific configuration by key' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        value: { type: 'string' },
        type: { enum: Object.values(ConfigType) },
        category: { enum: Object.values(ConfigCategory) },
        description: { type: 'string' },
        isEncrypted: { type: 'boolean' },
        isReadOnly: { type: 'boolean' },
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @Roles('ADMIN')
  async updateConfigByKey(@Param('key') key: string, @Body() body: any) {
    const config = await this.prisma.configuration.update({
      where: { key },
      data: {
        value: body.value,
        type: body.type,
        category: body.category,
        description: body.description,
        isEncrypted: body.isEncrypted,
        isReadOnly: body.isReadOnly,
        updatedAt: new Date(),
      },
    });

    // Reload configuration
    await this.configService.onModuleInit();

    return config;
  }

  @Delete('key/:key')
  @ApiOperation({ summary: 'Delete specific configuration by key' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  @ApiResponse({ status: 200, description: 'Configuration deleted successfully' })
  @Roles('ADMIN')
  async deleteConfigByKey(@Param('key') key: string) {
    const config = await this.prisma.configuration.delete({
      where: { key },
    });

    // Reload configuration
    await this.configService.onModuleInit();

    return { message: 'Configuration deleted successfully', config };
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset configuration to defaults' })
  @ApiResponse({ status: 200, description: 'Configuration reset successfully' })
  @Roles('ADMIN')
  async resetToDefaults() {
    // Delete all custom configurations
    await this.prisma.configuration.deleteMany({
      where: {
        isReadOnly: false,
      },
    });

    // Reload configuration from environment
    await this.configService.onModuleInit();

    return { message: 'Configuration reset to defaults' };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export configuration' })
  @ApiResponse({ status: 200, description: 'Configuration exported successfully' })
  @Roles('ADMIN')
  async exportConfig() {
    const configs = await this.prisma.configuration.findMany({
      orderBy: { category: 'asc' },
    });

    return {
      exportedAt: new Date().toISOString(),
      configurations: configs,
    };
  }

  @Post('import')
  @ApiOperation({ summary: 'Import configuration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        configurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
              type: { enum: Object.values(ConfigType) },
              category: { enum: Object.values(ConfigCategory) },
              description: { type: 'string' },
              isEncrypted: { type: 'boolean' },
              isReadOnly: { type: 'boolean' },
            },
            required: ['key', 'value', 'type', 'category']
          }
        }
      },
      required: ['configurations']
    }
  })
  @ApiResponse({ status: 200, description: 'Configuration imported successfully' })
  @Roles('ADMIN')
  async importConfig(@Body() body: { configurations: any[] }) {
    const results = [];

    for (const config of body.configurations) {
      try {
        const result = await this.prisma.configuration.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            type: config.type,
            category: config.category,
            description: config.description,
            isEncrypted: config.isEncrypted || false,
            isReadOnly: config.isReadOnly || false,
            updatedAt: new Date(),
          },
          create: {
            key: config.key,
            value: config.value,
            type: config.type,
            category: config.category,
            description: config.description,
            isEncrypted: config.isEncrypted || false,
            isReadOnly: config.isReadOnly || false,
          },
        });
        results.push({ success: true, config: result });
      } catch (error) {
        results.push({ success: false, key: config.key, error: error.message });
      }
    }

    // Reload configuration
    await this.configService.onModuleInit();

    return {
      importedAt: new Date().toISOString(),
      results,
    };
  }
}
