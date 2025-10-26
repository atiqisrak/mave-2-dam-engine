import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StorageFactoryService } from './storage-factory.service';
import { LocalStorageService } from './local-storage.service';
import { CloudStorageService } from './cloud-storage.service';

@ApiTags('Storage Configuration')
@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageFactory: StorageFactoryService,
    private readonly localStorageService: LocalStorageService,
    private readonly cloudStorageService: CloudStorageService,
  ) {}

  @Get('info')
  @ApiOperation({ 
    summary: 'Get current storage configuration',
    description: 'Returns information about the current storage provider and configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Storage configuration information',
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['cloud', 'local'] },
        configured: { type: 'boolean' },
        details: { type: 'object' }
      }
    }
  })
  getStorageInfo() {
    return this.storageFactory.getStorageInfo();
  }

  @Get('validate')
  @ApiOperation({ 
    summary: 'Validate storage configuration',
    description: 'Validates the current storage configuration and returns any errors'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Storage configuration validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  validateStorageConfiguration() {
    return this.storageFactory.validateStorageConfiguration();
  }

  @Get('nginx-config')
  @ApiOperation({ 
    summary: 'Generate nginx configuration',
    description: 'Generates nginx configuration for local storage setup'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Generated nginx configuration',
    schema: {
      type: 'string',
      description: 'Nginx configuration content'
    }
  })
  async generateNginxConfig() {
    const config = await this.localStorageService.generateNginxConfig();
    return {
      config,
      message: 'Nginx configuration generated successfully. Save this to your nginx configuration file.'
    };
  }

  @Get('cloud-config')
  @ApiOperation({ 
    summary: 'Get cloud storage configuration',
    description: 'Returns the current cloud storage configuration (without sensitive data)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cloud storage configuration',
    schema: {
      type: 'object',
      properties: {
        provider: { type: 'string' },
        bucket: { type: 'string' },
        region: { type: 'string' },
        baseUrl: { type: 'string' },
        cdnUrl: { type: 'string' }
      }
    }
  })
  getCloudStorageConfig() {
    const config = this.cloudStorageService.getConfig();
    // Remove sensitive information
    const { accessKeyId, secretAccessKey, ...safeConfig } = config;
    return {
      ...safeConfig,
      accessKeyId: accessKeyId ? '***' + accessKeyId.slice(-4) : undefined,
      secretAccessKey: secretAccessKey ? '***' + secretAccessKey.slice(-4) : undefined,
    };
  }

  @Get('local-config')
  @ApiOperation({ 
    summary: 'Get local storage configuration',
    description: 'Returns the current local storage configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Local storage configuration',
    schema: {
      type: 'object',
      properties: {
        uploadDir: { type: 'string' },
        optimizedDir: { type: 'string' },
        thumbnailsDir: { type: 'string' },
        convertedDir: { type: 'string' },
        batchDir: { type: 'string' },
        nginxConfig: { type: 'object' }
      }
    }
  })
  getLocalStorageConfig() {
    return this.localStorageService.getConfig();
  }
}
