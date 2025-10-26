import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage.interface';
import { CloudStorageService } from './cloud-storage.service';
import { LocalStorageService } from './local-storage.service';

export type StorageType = 'cloud' | 'local';

@Injectable()
export class StorageFactoryService {
  constructor(
    private readonly configService: ConfigService,
    private readonly cloudStorageService: CloudStorageService,
    private readonly localStorageService: LocalStorageService,
  ) {}

  /**
   * Get storage provider based on configuration
   */
  getStorageProvider(): StorageProvider {
    const storageType = this.getStorageType();
    
    switch (storageType) {
      case 'cloud':
        return this.cloudStorageService;
      case 'local':
        return this.localStorageService;
      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }
  }

  /**
   * Get storage type from configuration
   */
  private getStorageType(): StorageType {
    const provider = this.configService.get<string>('CLOUD_STORAGE_PROVIDER');
    const nginxEnabled = this.configService.get<string>('NGINX_ENABLED', 'false') === 'true';
    
    // If nginx is enabled and no cloud provider is configured, use local storage
    if (nginxEnabled && !provider) {
      return 'local';
    }
    
    // If cloud provider is configured, use cloud storage
    if (provider && provider !== 'none') {
      return 'cloud';
    }
    
    // Default to local storage
    return 'local';
  }

  /**
   * Check if cloud storage is configured
   */
  isCloudStorageConfigured(): boolean {
    const provider = this.configService.get<string>('CLOUD_STORAGE_PROVIDER');
    const accessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucket = this.configService.get<string>('CLOUD_STORAGE_BUCKET');
    
    return !!(provider && accessKey && secretKey && bucket);
  }

  /**
   * Check if local storage is configured
   */
  isLocalStorageConfigured(): boolean {
    const nginxEnabled = this.configService.get<string>('NGINX_ENABLED', 'false') === 'true';
    const uploadDir = this.configService.get<string>('UPLOAD_DIR');
    
    return nginxEnabled || !!uploadDir;
  }

  /**
   * Get current storage configuration info
   */
  getStorageInfo(): {
    type: StorageType;
    configured: boolean;
    details: any;
  } {
    const type = this.getStorageType();
    const configured = type === 'cloud' ? this.isCloudStorageConfigured() : this.isLocalStorageConfigured();
    
    let details = {};
    if (type === 'cloud') {
      details = this.cloudStorageService.getConfig();
    } else {
      details = this.localStorageService.getConfig();
    }
    
    return {
      type,
      configured,
      details,
    };
  }

  /**
   * Validate storage configuration
   */
  validateStorageConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const type = this.getStorageType();
    
    if (type === 'cloud') {
      if (!this.isCloudStorageConfigured()) {
        errors.push('Cloud storage is not properly configured. Missing required environment variables.');
      }
    } else if (type === 'local') {
      if (!this.isLocalStorageConfigured()) {
        errors.push('Local storage is not properly configured. Missing upload directory or nginx configuration.');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
