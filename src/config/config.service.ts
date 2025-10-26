import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface StorageConfig {
  uploadDir: string;
  optimizedDir: string;
  thumbnailsDir: string;
  convertedDir: string;
  batchDir: string;
  maxFileSize: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedDocumentTypes: string[];
  nginxConfig: {
    enabled: boolean;
    baseUrl: string;
    cacheEnabled: boolean;
    cacheMaxAge: number;
  };
}

@Injectable()
export class StorageConfigService {
  private config: StorageConfig;

  constructor(private readonly nestConfigService: NestConfigService) {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.config = {
      uploadDir: this.nestConfigService.get<string>('UPLOAD_DIR', 'uploads'),
      optimizedDir: this.nestConfigService.get<string>('OPTIMIZED_DIR', 'uploads/optimized'),
      thumbnailsDir: this.nestConfigService.get<string>('THUMBNAILS_DIR', 'uploads/thumbnails'),
      convertedDir: this.nestConfigService.get<string>('CONVERTED_DIR', 'uploads/converted'),
      batchDir: this.nestConfigService.get<string>('BATCH_DIR', 'uploads/batch-optimized'),
      maxFileSize: parseInt(this.nestConfigService.get<string>('MAX_FILE_SIZE', '10485760')), // 10MB
      allowedImageTypes: this.nestConfigService.get<string>('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/gif,image/webp').split(','),
      allowedVideoTypes: this.nestConfigService.get<string>('ALLOWED_VIDEO_TYPES', 'video/mp4,video/avi,video/quicktime,video/x-msvideo').split(','),
      allowedDocumentTypes: this.nestConfigService.get<string>('ALLOWED_DOCUMENT_TYPES', 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(','),
      nginxConfig: {
        enabled: this.nestConfigService.get<string>('NGINX_ENABLED', 'false') === 'true',
        baseUrl: this.nestConfigService.get<string>('NGINX_BASE_URL', 'http://localhost:3018'),
        cacheEnabled: this.nestConfigService.get<string>('NGINX_CACHE_ENABLED', 'true') === 'true',
        cacheMaxAge: parseInt(this.nestConfigService.get<string>('NGINX_CACHE_MAX_AGE', '31536000')), // 1 year
      },
    };
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<StorageConfig>): Promise<StorageConfig> {
    // Update configuration
    this.config = { ...this.config, ...newConfig };

    // Create directories if they don't exist
    await this.ensureDirectories();

    // Update environment variables (optional - you might want to persist to a config file)
    await this.updateEnvironmentFile(newConfig);

    return this.getConfig();
  }

  async ensureDirectories(): Promise<void> {
    const dirs = [
      this.config.uploadDir,
      this.config.optimizedDir,
      this.config.thumbnailsDir,
      this.config.convertedDir,
      this.config.batchDir,
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  private async updateEnvironmentFile(config: Partial<StorageConfig>): Promise<void> {
    const envPath = path.join(process.cwd(), '.env');
    
    try {
      let envContent = '';
      if (await fs.pathExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf8');
      }

      // Update or add configuration values
      const updates = {
        UPLOAD_DIR: config.uploadDir,
        OPTIMIZED_DIR: config.optimizedDir,
        THUMBNAILS_DIR: config.thumbnailsDir,
        CONVERTED_DIR: config.convertedDir,
        BATCH_DIR: config.batchDir,
        MAX_FILE_SIZE: config.maxFileSize?.toString(),
        ALLOWED_IMAGE_TYPES: config.allowedImageTypes?.join(','),
        ALLOWED_VIDEO_TYPES: config.allowedVideoTypes?.join(','),
        ALLOWED_DOCUMENT_TYPES: config.allowedDocumentTypes?.join(','),
        NGINX_ENABLED: config.nginxConfig?.enabled?.toString(),
        NGINX_BASE_URL: config.nginxConfig?.baseUrl,
        NGINX_CACHE_ENABLED: config.nginxConfig?.cacheEnabled?.toString(),
        NGINX_CACHE_MAX_AGE: config.nginxConfig?.cacheMaxAge?.toString(),
      };

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          const newLine = `${key}=${value}`;
          
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, newLine);
          } else {
            envContent += `\n${newLine}`;
          }
        }
      }

      await fs.writeFile(envPath, envContent);
    } catch (error) {
      console.warn('Could not update .env file:', error.message);
    }
  }

  getUploadDir(): string {
    return this.config.uploadDir;
  }

  getOptimizedDir(): string {
    return this.config.optimizedDir;
  }

  getThumbnailsDir(): string {
    return this.config.thumbnailsDir;
  }

  getConvertedDir(): string {
    return this.config.convertedDir;
  }

  getBatchDir(): string {
    return this.config.batchDir;
  }

  getMaxFileSize(): number {
    return this.config.maxFileSize;
  }

  getAllowedTypes(type: 'image' | 'video' | 'document'): string[] {
    switch (type) {
      case 'image':
        return this.config.allowedImageTypes;
      case 'video':
        return this.config.allowedVideoTypes;
      case 'document':
        return this.config.allowedDocumentTypes;
      default:
        return [];
    }
  }

  getNginxConfig() {
    return this.config.nginxConfig;
  }

  async generateNginxConfig(): Promise<string> {
    const { nginxConfig, uploadDir } = this.config;
    
    if (!nginxConfig.enabled) {
      return '# Nginx configuration disabled';
    }

    const nginxConfigTemplate = `
# Oreo Media Management - Nginx Configuration
# Generated automatically - Do not edit manually

# Main uploads directory
location /uploads/ {
    alias ${path.resolve(uploadDir)}/;
    expires ${nginxConfig.cacheMaxAge}s;
    add_header Cache-Control "public, immutable";
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    
    # CORS for media files
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type "text/plain charset=UTF-8";
        add_header Content-Length 0;
        return 204;
    }
}

# Optimized images
location /uploads/optimized/ {
    alias ${path.resolve(this.config.optimizedDir)}/;
    expires ${nginxConfig.cacheMaxAge}s;
    add_header Cache-Control "public, immutable";
}

# Thumbnails
location /uploads/thumbnails/ {
    alias ${path.resolve(this.config.thumbnailsDir)}/;
    expires ${nginxConfig.cacheMaxAge}s;
    add_header Cache-Control "public, immutable";
}

# Converted files
location /uploads/converted/ {
    alias ${path.resolve(this.config.convertedDir)}/;
    expires ${nginxConfig.cacheMaxAge}s;
    add_header Cache-Control "public, immutable";
}

# Batch processed files
location /uploads/batch-optimized/ {
    alias ${path.resolve(this.config.batchDir)}/;
    expires ${nginxConfig.cacheMaxAge}s;
    add_header Cache-Control "public, immutable";
}

# Security: Block access to sensitive files
location ~ /\\. {
    deny all;
}

# Security: Block access to backup files
location ~ \\.(bak|backup|old|tmp)$ {
    deny all;
}
`;

    return nginxConfigTemplate.trim();
  }
}
