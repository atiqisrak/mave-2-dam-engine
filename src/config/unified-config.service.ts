import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export enum ConfigType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
}

export enum ConfigCategory {
  GENERAL = 'GENERAL',
  DATABASE = 'DATABASE',
  STORAGE = 'STORAGE',
  SECURITY = 'SECURITY',
  UPLOAD = 'UPLOAD',
  MEDIA_PROCESSING = 'MEDIA_PROCESSING',
  NGINX = 'NGINX',
  CLOUD_STORAGE = 'CLOUD_STORAGE',
  RATE_LIMITING = 'RATE_LIMITING',
  LOGGING = 'LOGGING',
  MONITORING = 'MONITORING',
  EXTERNAL_API = 'EXTERNAL_API',
}

export interface UnifiedConfig {
  // General Settings
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  
  // Database Settings
  databaseUrl: string;
  
  // Storage Settings
  storageProvider: 'local' | 'aws' | 'gcp' | 'azure';
  uploadDir: string;
  optimizedDir: string;
  thumbnailsDir: string;
  convertedDir: string;
  batchDir: string;
  localStoragePath: string;
  
  // Cloud Storage Settings
  cloudStorageProvider: string;
  cloudStorageBucket: string;
  cloudStorageRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  cloudStorageBaseUrl: string;
  cloudStorageCdnUrl: string;
  enableCdn: boolean;
  cdnUrl: string;
  
  // File Upload Settings
  maxFileSize: number;
  chunkSize: number;
  tempDir: string;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedDocumentTypes: string[];
  
  // Media Processing Settings
  enableImageOptimization: boolean;
  enableVideoProcessing: boolean;
  enableDocumentProcessing: boolean;
  maxImageDimension: number;
  maxVideoDuration: number;
  
  // Security Settings
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  
  // Rate Limiting Settings
  rateLimitWindow: string;
  rateLimitMaxRequests: number;
  rateLimitTtl: number;
  rateLimitLimit: number;
  
  // Logging Settings
  logLevel: string;
  logFile: string;
  
  // Monitoring Settings
  enableHealthChecks: boolean;
  healthCheckInterval: number;
  
  // Nginx Settings
  nginxEnabled: boolean;
  nginxBaseUrl: string;
  nginxCacheEnabled: boolean;
  nginxCacheMaxAge: number;
  
  // External API Settings
  removeBgApiKey: string;
}

@Injectable()
export class UnifiedConfigService implements OnModuleInit {
  private config: UnifiedConfig;
  private encryptionKey: string;

  constructor(
    private readonly nestConfigService: NestConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.encryptionKey = this.nestConfigService.get<string>('ENCRYPTION_KEY', 'default-encryption-key-change-in-production');
  }

  async onModuleInit() {
    await this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    // Load from database first, fallback to environment variables
    const dbConfig = await this.loadFromDatabase();
    const envConfig = this.loadFromEnvironment();
    
    this.config = {
      ...envConfig,
      ...dbConfig,
    };
  }

  private async loadFromDatabase(): Promise<Partial<UnifiedConfig>> {
    try {
      const configs = await this.prisma.configuration.findMany();
      const configMap: Partial<UnifiedConfig> = {};

      for (const config of configs) {
        let value: any = config.value;
        
        // Decrypt if needed
        if (config.isEncrypted) {
          value = this.decryptValue(value);
        }
        
        // Parse based on type
        switch (config.type) {
          case ConfigType.NUMBER:
            value = parseFloat(value);
            break;
          case ConfigType.BOOLEAN:
            value = value === 'true';
            break;
          case ConfigType.JSON:
            value = JSON.parse(value);
            break;
          case ConfigType.ARRAY:
            value = value.split(',').map(item => item.trim());
            break;
        }

        // Map database keys to config properties
        const keyMap: Record<string, keyof UnifiedConfig> = {
          'NODE_ENV': 'nodeEnv',
          'PORT': 'port',
          'CORS_ORIGIN': 'corsOrigin',
          'DATABASE_URL': 'databaseUrl',
          'STORAGE_PROVIDER': 'storageProvider',
          'UPLOAD_DIR': 'uploadDir',
          'OPTIMIZED_DIR': 'optimizedDir',
          'THUMBNAILS_DIR': 'thumbnailsDir',
          'CONVERTED_DIR': 'convertedDir',
          'BATCH_DIR': 'batchDir',
          'LOCAL_STORAGE_PATH': 'localStoragePath',
          'CLOUD_STORAGE_PROVIDER': 'cloudStorageProvider',
          'CLOUD_STORAGE_BUCKET': 'cloudStorageBucket',
          'CLOUD_STORAGE_REGION': 'cloudStorageRegion',
          'AWS_ACCESS_KEY_ID': 'awsAccessKeyId',
          'AWS_SECRET_ACCESS_KEY': 'awsSecretAccessKey',
          'CLOUD_STORAGE_BASE_URL': 'cloudStorageBaseUrl',
          'CLOUD_STORAGE_CDN_URL': 'cloudStorageCdnUrl',
          'ENABLE_CDN': 'enableCdn',
          'CDN_URL': 'cdnUrl',
          'MAX_FILE_SIZE': 'maxFileSize',
          'CHUNK_SIZE': 'chunkSize',
          'TEMP_DIR': 'tempDir',
          'ALLOWED_IMAGE_TYPES': 'allowedImageTypes',
          'ALLOWED_VIDEO_TYPES': 'allowedVideoTypes',
          'ALLOWED_DOCUMENT_TYPES': 'allowedDocumentTypes',
          'ENABLE_IMAGE_OPTIMIZATION': 'enableImageOptimization',
          'ENABLE_VIDEO_PROCESSING': 'enableVideoProcessing',
          'ENABLE_DOCUMENT_PROCESSING': 'enableDocumentProcessing',
          'MAX_IMAGE_DIMENSION': 'maxImageDimension',
          'MAX_VIDEO_DURATION': 'maxVideoDuration',
          'JWT_SECRET': 'jwtSecret',
          'JWT_EXPIRES_IN': 'jwtExpiresIn',
          'BCRYPT_ROUNDS': 'bcryptRounds',
          'RATE_LIMIT_WINDOW': 'rateLimitWindow',
          'RATE_LIMIT_MAX_REQUESTS': 'rateLimitMaxRequests',
          'RATE_LIMIT_TTL': 'rateLimitTtl',
          'RATE_LIMIT_LIMIT': 'rateLimitLimit',
          'LOG_LEVEL': 'logLevel',
          'LOG_FILE': 'logFile',
          'ENABLE_HEALTH_CHECKS': 'enableHealthChecks',
          'HEALTH_CHECK_INTERVAL': 'healthCheckInterval',
          'NGINX_ENABLED': 'nginxEnabled',
          'NGINX_BASE_URL': 'nginxBaseUrl',
          'NGINX_CACHE_ENABLED': 'nginxCacheEnabled',
          'NGINX_CACHE_MAX_AGE': 'nginxCacheMaxAge',
        };

        const configKey = keyMap[config.key];
        if (configKey) {
          (configMap as any)[configKey] = value;
        }
      }

      return configMap;
    } catch (error) {
      console.warn('Failed to load configuration from database:', error.message);
      return {};
    }
  }

  private loadFromEnvironment(): UnifiedConfig {
    return {
      // General Settings
      nodeEnv: this.nestConfigService.get<string>('NODE_ENV', 'development'),
      port: parseInt(this.nestConfigService.get<string>('PORT', '3018')),
      corsOrigin: this.nestConfigService.get<string>('CORS_ORIGIN', '*'),
      
      // Database Settings
      databaseUrl: this.nestConfigService.get<string>('DATABASE_URL', 'postgres://olaf:Niloy%40Niil9@167.71.201.117:5432/Oreo'),
      
      // Storage Settings
      storageProvider: this.nestConfigService.get<'local' | 'aws' | 'gcp' | 'azure'>('STORAGE_PROVIDER', 'local'),
      uploadDir: this.nestConfigService.get<string>('UPLOAD_DIR', 'uploads'),
      optimizedDir: this.nestConfigService.get<string>('OPTIMIZED_DIR', 'uploads/optimized'),
      thumbnailsDir: this.nestConfigService.get<string>('THUMBNAILS_DIR', 'uploads/thumbnails'),
      convertedDir: this.nestConfigService.get<string>('CONVERTED_DIR', 'uploads/converted'),
      batchDir: this.nestConfigService.get<string>('BATCH_DIR', 'uploads/batch-optimized'),
      localStoragePath: this.nestConfigService.get<string>('LOCAL_STORAGE_PATH', '/var/www/uploads'),
      
      // Cloud Storage Settings
      cloudStorageProvider: this.nestConfigService.get<string>('CLOUD_STORAGE_PROVIDER', 'aws'),
      cloudStorageBucket: this.nestConfigService.get<string>('CLOUD_STORAGE_BUCKET', 'oreo-media-bucket'),
      cloudStorageRegion: this.nestConfigService.get<string>('CLOUD_STORAGE_REGION', 'us-east-1'),
      awsAccessKeyId: this.nestConfigService.get<string>('AWS_ACCESS_KEY_ID', ''),
      awsSecretAccessKey: this.nestConfigService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      cloudStorageBaseUrl: this.nestConfigService.get<string>('CLOUD_STORAGE_BASE_URL', ''),
      cloudStorageCdnUrl: this.nestConfigService.get<string>('CLOUD_STORAGE_CDN_URL', ''),
      enableCdn: this.nestConfigService.get<string>('ENABLE_CDN', 'false') === 'true',
      cdnUrl: this.nestConfigService.get<string>('CDN_URL', ''),
      
      // File Upload Settings
      maxFileSize: parseInt(this.nestConfigService.get<string>('MAX_FILE_SIZE', '100000000')),
      chunkSize: parseInt(this.nestConfigService.get<string>('CHUNK_SIZE', '5242880')),
      tempDir: this.nestConfigService.get<string>('TEMP_DIR', 'uploads/_tmp'),
      allowedImageTypes: this.nestConfigService.get<string>('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/gif,image/webp,image/avif').split(','),
      allowedVideoTypes: this.nestConfigService.get<string>('ALLOWED_VIDEO_TYPES', 'video/mp4,video/avi,video/quicktime,video/x-msvideo,video/webm').split(','),
      allowedDocumentTypes: this.nestConfigService.get<string>('ALLOWED_DOCUMENT_TYPES', 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain').split(','),
      
      // Media Processing Settings
      enableImageOptimization: this.nestConfigService.get<string>('ENABLE_IMAGE_OPTIMIZATION', 'true') === 'true',
      enableVideoProcessing: this.nestConfigService.get<string>('ENABLE_VIDEO_PROCESSING', 'true') === 'true',
      enableDocumentProcessing: this.nestConfigService.get<string>('ENABLE_DOCUMENT_PROCESSING', 'true') === 'true',
      maxImageDimension: parseInt(this.nestConfigService.get<string>('MAX_IMAGE_DIMENSION', '4096')),
      maxVideoDuration: parseInt(this.nestConfigService.get<string>('MAX_VIDEO_DURATION', '3600')),
      
      // Security Settings
      jwtSecret: this.nestConfigService.get<string>('JWT_SECRET', 'aWQf9m6NEU8qmJ3vLcZo6ZT5wdNyv86kc4r5PWTnuulm='),
      jwtExpiresIn: this.nestConfigService.get<string>('JWT_EXPIRES_IN', '24h'),
      bcryptRounds: parseInt(this.nestConfigService.get<string>('BCRYPT_ROUNDS', '12')),
      
      // Rate Limiting Settings
      rateLimitWindow: this.nestConfigService.get<string>('RATE_LIMIT_WINDOW', '15m'),
      rateLimitMaxRequests: parseInt(this.nestConfigService.get<string>('RATE_LIMIT_MAX_REQUESTS', '100')),
      rateLimitTtl: parseInt(this.nestConfigService.get<string>('RATE_LIMIT_TTL', '60')),
      rateLimitLimit: parseInt(this.nestConfigService.get<string>('RATE_LIMIT_LIMIT', '100')),
      
      // Logging Settings
      logLevel: this.nestConfigService.get<string>('LOG_LEVEL', 'info'),
      logFile: this.nestConfigService.get<string>('LOG_FILE', 'logs/oreo.log'),
      
      // Monitoring Settings
      enableHealthChecks: this.nestConfigService.get<string>('ENABLE_HEALTH_CHECKS', 'true') === 'true',
      healthCheckInterval: parseInt(this.nestConfigService.get<string>('HEALTH_CHECK_INTERVAL', '30000')),
      
      // Nginx Settings
      nginxEnabled: this.nestConfigService.get<string>('NGINX_ENABLED', 'false') === 'true',
      nginxBaseUrl: this.nestConfigService.get<string>('NGINX_BASE_URL', 'http://localhost:3018'),
      nginxCacheEnabled: this.nestConfigService.get<string>('NGINX_CACHE_ENABLED', 'true') === 'true',
      nginxCacheMaxAge: parseInt(this.nestConfigService.get<string>('NGINX_CACHE_MAX_AGE', '31536000')),
      
      // External API Settings
      removeBgApiKey: this.nestConfigService.get<string>('REMOVEBG_API', ''),
    };
  }

  getConfig(): UnifiedConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<UnifiedConfig>): Promise<UnifiedConfig> {
    // Update in-memory config
    this.config = { ...this.config, ...updates };

    // Update database
    await this.updateDatabaseConfig(updates);

    return this.getConfig();
  }

  private async updateDatabaseConfig(updates: Partial<UnifiedConfig>): Promise<void> {
    const keyMap: Record<keyof UnifiedConfig, string> = {
      'nodeEnv': 'NODE_ENV',
      'port': 'PORT',
      'corsOrigin': 'CORS_ORIGIN',
      'databaseUrl': 'DATABASE_URL',
      'storageProvider': 'STORAGE_PROVIDER',
      'uploadDir': 'UPLOAD_DIR',
      'optimizedDir': 'OPTIMIZED_DIR',
      'thumbnailsDir': 'THUMBNAILS_DIR',
      'convertedDir': 'CONVERTED_DIR',
      'batchDir': 'BATCH_DIR',
      'localStoragePath': 'LOCAL_STORAGE_PATH',
      'cloudStorageProvider': 'CLOUD_STORAGE_PROVIDER',
      'cloudStorageBucket': 'CLOUD_STORAGE_BUCKET',
      'cloudStorageRegion': 'CLOUD_STORAGE_REGION',
      'awsAccessKeyId': 'AWS_ACCESS_KEY_ID',
      'awsSecretAccessKey': 'AWS_SECRET_ACCESS_KEY',
      'cloudStorageBaseUrl': 'CLOUD_STORAGE_BASE_URL',
      'cloudStorageCdnUrl': 'CLOUD_STORAGE_CDN_URL',
      'enableCdn': 'ENABLE_CDN',
      'cdnUrl': 'CDN_URL',
      'maxFileSize': 'MAX_FILE_SIZE',
      'chunkSize': 'CHUNK_SIZE',
      'tempDir': 'TEMP_DIR',
      'allowedImageTypes': 'ALLOWED_IMAGE_TYPES',
      'allowedVideoTypes': 'ALLOWED_VIDEO_TYPES',
      'allowedDocumentTypes': 'ALLOWED_DOCUMENT_TYPES',
      'enableImageOptimization': 'ENABLE_IMAGE_OPTIMIZATION',
      'enableVideoProcessing': 'ENABLE_VIDEO_PROCESSING',
      'enableDocumentProcessing': 'ENABLE_DOCUMENT_PROCESSING',
      'maxImageDimension': 'MAX_IMAGE_DIMENSION',
      'maxVideoDuration': 'MAX_VIDEO_DURATION',
      'jwtSecret': 'JWT_SECRET',
      'jwtExpiresIn': 'JWT_EXPIRES_IN',
      'bcryptRounds': 'BCRYPT_ROUNDS',
      'rateLimitWindow': 'RATE_LIMIT_WINDOW',
      'rateLimitMaxRequests': 'RATE_LIMIT_MAX_REQUESTS',
      'rateLimitTtl': 'RATE_LIMIT_TTL',
      'rateLimitLimit': 'RATE_LIMIT_LIMIT',
      'logLevel': 'LOG_LEVEL',
      'logFile': 'LOG_FILE',
      'enableHealthChecks': 'ENABLE_HEALTH_CHECKS',
      'healthCheckInterval': 'HEALTH_CHECK_INTERVAL',
      'nginxEnabled': 'NGINX_ENABLED',
      'nginxBaseUrl': 'NGINX_BASE_URL',
      'nginxCacheEnabled': 'NGINX_CACHE_ENABLED',
      'nginxCacheMaxAge': 'NGINX_CACHE_MAX_AGE',
      'removeBgApiKey': 'REMOVEBG_API',
    };

    const categoryMap: Record<keyof UnifiedConfig, ConfigCategory> = {
      'nodeEnv': ConfigCategory.GENERAL,
      'port': ConfigCategory.GENERAL,
      'corsOrigin': ConfigCategory.GENERAL,
      'databaseUrl': ConfigCategory.DATABASE,
      'storageProvider': ConfigCategory.STORAGE,
      'uploadDir': ConfigCategory.STORAGE,
      'optimizedDir': ConfigCategory.STORAGE,
      'thumbnailsDir': ConfigCategory.STORAGE,
      'convertedDir': ConfigCategory.STORAGE,
      'batchDir': ConfigCategory.STORAGE,
      'localStoragePath': ConfigCategory.STORAGE,
      'cloudStorageProvider': ConfigCategory.CLOUD_STORAGE,
      'cloudStorageBucket': ConfigCategory.CLOUD_STORAGE,
      'cloudStorageRegion': ConfigCategory.CLOUD_STORAGE,
      'awsAccessKeyId': ConfigCategory.CLOUD_STORAGE,
      'awsSecretAccessKey': ConfigCategory.CLOUD_STORAGE,
      'cloudStorageBaseUrl': ConfigCategory.CLOUD_STORAGE,
      'cloudStorageCdnUrl': ConfigCategory.CLOUD_STORAGE,
      'enableCdn': ConfigCategory.CLOUD_STORAGE,
      'cdnUrl': ConfigCategory.CLOUD_STORAGE,
      'maxFileSize': ConfigCategory.UPLOAD,
      'chunkSize': ConfigCategory.UPLOAD,
      'tempDir': ConfigCategory.UPLOAD,
      'allowedImageTypes': ConfigCategory.UPLOAD,
      'allowedVideoTypes': ConfigCategory.UPLOAD,
      'allowedDocumentTypes': ConfigCategory.UPLOAD,
      'enableImageOptimization': ConfigCategory.MEDIA_PROCESSING,
      'enableVideoProcessing': ConfigCategory.MEDIA_PROCESSING,
      'enableDocumentProcessing': ConfigCategory.MEDIA_PROCESSING,
      'maxImageDimension': ConfigCategory.MEDIA_PROCESSING,
      'maxVideoDuration': ConfigCategory.MEDIA_PROCESSING,
      'jwtSecret': ConfigCategory.SECURITY,
      'jwtExpiresIn': ConfigCategory.SECURITY,
      'bcryptRounds': ConfigCategory.SECURITY,
      'rateLimitWindow': ConfigCategory.RATE_LIMITING,
      'rateLimitMaxRequests': ConfigCategory.RATE_LIMITING,
      'rateLimitTtl': ConfigCategory.RATE_LIMITING,
      'rateLimitLimit': ConfigCategory.RATE_LIMITING,
      'logLevel': ConfigCategory.LOGGING,
      'logFile': ConfigCategory.LOGGING,
      'enableHealthChecks': ConfigCategory.MONITORING,
      'healthCheckInterval': ConfigCategory.MONITORING,
      'nginxEnabled': ConfigCategory.NGINX,
      'nginxBaseUrl': ConfigCategory.NGINX,
      'nginxCacheEnabled': ConfigCategory.NGINX,
      'nginxCacheMaxAge': ConfigCategory.NGINX,
      'removeBgApiKey': ConfigCategory.EXTERNAL_API,
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const configKey = keyMap[key as keyof UnifiedConfig];
        const category = categoryMap[key as keyof UnifiedConfig];
        
        if (configKey && category) {
          let stringValue: string;
          let type: ConfigType;
          let isEncrypted = false;

          if (Array.isArray(value)) {
            stringValue = value.join(',');
            type = ConfigType.ARRAY;
          } else if (typeof value === 'boolean') {
            stringValue = value.toString();
            type = ConfigType.BOOLEAN;
          } else if (typeof value === 'number') {
            stringValue = value.toString();
            type = ConfigType.NUMBER;
          } else if (typeof value === 'object') {
            stringValue = JSON.stringify(value);
            type = ConfigType.JSON;
          } else {
            stringValue = value.toString();
            type = ConfigType.STRING;
          }

          // Encrypt sensitive values
          if (this.isSensitiveKey(configKey)) {
            stringValue = this.encryptValue(stringValue);
            isEncrypted = true;
          }

          await this.prisma.configuration.upsert({
            where: { key: configKey },
            update: {
              value: stringValue,
              type,
              category,
              isEncrypted,
              updatedAt: new Date(),
            },
            create: {
              key: configKey,
              value: stringValue,
              type,
              category,
              isEncrypted,
              description: this.getConfigDescription(configKey),
            },
          });
        }
      }
    }
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'JWT_SECRET',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'DATABASE_URL',
    ];
    return sensitiveKeys.includes(key);
  }

  private getConfigDescription(key: string): string {
    const descriptions: Record<string, string> = {
      'NODE_ENV': 'Application environment (development, production, test)',
      'PORT': 'Port number for the application server',
      'CORS_ORIGIN': 'CORS allowed origins',
      'DATABASE_URL': 'Database connection string',
      'STORAGE_PROVIDER': 'Storage provider (local, aws, gcp, azure)',
      'UPLOAD_DIR': 'Directory for uploaded files',
      'MAX_FILE_SIZE': 'Maximum file size in bytes',
      'JWT_SECRET': 'Secret key for JWT token signing',
      'LOG_LEVEL': 'Logging level (error, warn, info, debug)',
    };
    return descriptions[key] || `Configuration for ${key}`;
  }

  private encryptValue(value: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptValue(encryptedValue: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const [ivHex, encrypted] = encryptedValue.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Convenience getters
  getNodeEnv(): string {
    return this.config.nodeEnv;
  }

  getPort(): number {
    return this.config.port;
  }

  getCorsOrigin(): string {
    return this.config.corsOrigin;
  }

  getDatabaseUrl(): string {
    return this.config.databaseUrl;
  }

  getStorageProvider(): 'local' | 'aws' | 'gcp' | 'azure' {
    return this.config.storageProvider;
  }

  getUploadDir(): string {
    return this.config.uploadDir;
  }

  getMaxFileSize(): number {
    return this.config.maxFileSize;
  }

  getJwtSecret(): string {
    return this.config.jwtSecret;
  }

  getLogLevel(): string {
    return this.config.logLevel;
  }

  // Storage-specific getters
  getStorageConfig() {
    return {
      provider: this.config.storageProvider,
      uploadDir: this.config.uploadDir,
      optimizedDir: this.config.optimizedDir,
      thumbnailsDir: this.config.thumbnailsDir,
      convertedDir: this.config.convertedDir,
      batchDir: this.config.batchDir,
      localStoragePath: this.config.localStoragePath,
      cloudStorage: {
        provider: this.config.cloudStorageProvider,
        bucket: this.config.cloudStorageBucket,
        region: this.config.cloudStorageRegion,
        accessKeyId: this.config.awsAccessKeyId,
        secretAccessKey: this.config.awsSecretAccessKey,
        baseUrl: this.config.cloudStorageBaseUrl,
        cdnUrl: this.config.cloudStorageCdnUrl,
        enableCdn: this.config.enableCdn,
      },
    };
  }

  // Upload-specific getters
  getUploadConfig() {
    return {
      maxFileSize: this.config.maxFileSize,
      chunkSize: this.config.chunkSize,
      tempDir: this.config.tempDir,
      allowedImageTypes: this.config.allowedImageTypes,
      allowedVideoTypes: this.config.allowedVideoTypes,
      allowedDocumentTypes: this.config.allowedDocumentTypes,
    };
  }

  // Media processing getters
  getMediaProcessingConfig() {
    return {
      enableImageOptimization: this.config.enableImageOptimization,
      enableVideoProcessing: this.config.enableVideoProcessing,
      enableDocumentProcessing: this.config.enableDocumentProcessing,
      maxImageDimension: this.config.maxImageDimension,
      maxVideoDuration: this.config.maxVideoDuration,
    };
  }

  // Security getters
  getSecurityConfig() {
    return {
      jwtSecret: this.config.jwtSecret,
      jwtExpiresIn: this.config.jwtExpiresIn,
      bcryptRounds: this.config.bcryptRounds,
    };
  }

  // Rate limiting getters
  getRateLimitConfig() {
    return {
      window: this.config.rateLimitWindow,
      maxRequests: this.config.rateLimitMaxRequests,
      ttl: this.config.rateLimitTtl,
      limit: this.config.rateLimitLimit,
    };
  }

  // Logging getters
  getLoggingConfig() {
    return {
      level: this.config.logLevel,
      file: this.config.logFile,
    };
  }

  // Monitoring getters
  getMonitoringConfig() {
    return {
      enableHealthChecks: this.config.enableHealthChecks,
      healthCheckInterval: this.config.healthCheckInterval,
    };
  }

  // Nginx getters
  getNginxConfig() {
    return {
      enabled: this.config.nginxEnabled,
      baseUrl: this.config.nginxBaseUrl,
      cacheEnabled: this.config.nginxCacheEnabled,
      cacheMaxAge: this.config.nginxCacheMaxAge,
    };
  }
}
