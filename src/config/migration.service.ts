import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigType, ConfigCategory } from './unified-config.service';

@Injectable()
export class MigrationService {
  constructor(private readonly prisma: PrismaService) {}

  async migrateEnvironmentToDatabase(): Promise<void> {
    console.log('🔄 Starting configuration migration...');

    const defaultConfigs = [
      // General Settings
      { key: 'NODE_ENV', value: 'development', type: ConfigType.STRING, category: ConfigCategory.GENERAL, description: 'Application environment', isEncrypted: false, isReadOnly: false },
      { key: 'PORT', value: '3018', type: ConfigType.NUMBER, category: ConfigCategory.GENERAL, description: 'Port number for the application server', isEncrypted: false, isReadOnly: false },
      { key: 'CORS_ORIGIN', value: '*', type: ConfigType.STRING, category: ConfigCategory.GENERAL, description: 'CORS allowed origins (use * for all origins)', isEncrypted: false, isReadOnly: false },
      
      // Database Settings
      { key: 'DATABASE_URL', value: 'postgres://olaf:Niloy%40Niil9@167.71.201.117:5432/Oreo', type: ConfigType.STRING, category: ConfigCategory.DATABASE, description: 'Database connection string', isEncrypted: true, isReadOnly: false },
      
      // Storage Settings
      { key: 'STORAGE_PROVIDER', value: 'local', type: ConfigType.STRING, category: ConfigCategory.STORAGE, description: 'Storage provider (local, aws, gcp, azure)', isEncrypted: false, isReadOnly: false },
      { key: 'UPLOAD_DIR', value: 'uploads', type: ConfigType.STRING, category: ConfigCategory.STORAGE, description: 'Directory for uploaded files', isEncrypted: false, isReadOnly: false },
      { key: 'OPTIMIZED_DIR', value: 'uploads/optimized', type: ConfigType.STRING, category: ConfigCategory.STORAGE, description: 'Directory for optimized files', isEncrypted: false, isReadOnly: false },
      { key: 'THUMBNAILS_DIR', value: 'uploads/thumbnails', type: ConfigType.STRING, category: ConfigCategory.STORAGE, description: 'Directory for thumbnail files', isEncrypted: false, isReadOnly: false },
      { key: 'CONVERTED_DIR', value: 'uploads/converted', type: ConfigType.STRING, category: ConfigCategory.STORAGE, description: 'Directory for converted files', isEncrypted: false, isReadOnly: false },
      { key: 'BATCH_DIR', value: 'uploads/batch-optimized', type: ConfigType.STRING, category: ConfigCategory.STORAGE, description: 'Directory for batch processed files', isEncrypted: false, isReadOnly: false },
      { key: 'LOCAL_STORAGE_PATH', value: '/var/www/uploads', type: ConfigType.STRING, category: ConfigCategory.STORAGE, description: 'Local storage base path', isEncrypted: false, isReadOnly: false },
      
      // Cloud Storage Settings
      { key: 'CLOUD_STORAGE_PROVIDER', value: 'aws', type: ConfigType.STRING, category: ConfigCategory.CLOUD_STORAGE, description: 'Cloud storage provider', isEncrypted: false, isReadOnly: false },
      { key: 'CLOUD_STORAGE_BUCKET', value: 'oreo-media-bucket', type: ConfigType.STRING, category: ConfigCategory.CLOUD_STORAGE, description: 'Cloud storage bucket name', isEncrypted: false, isReadOnly: false },
      { key: 'CLOUD_STORAGE_REGION', value: 'us-east-1', type: ConfigType.STRING, category: ConfigCategory.CLOUD_STORAGE, description: 'Cloud storage region', isEncrypted: false, isReadOnly: false },
      { key: 'AWS_ACCESS_KEY_ID', value: '', type: ConfigType.STRING, category: ConfigCategory.CLOUD_STORAGE, description: 'AWS access key ID', isEncrypted: true, isReadOnly: false },
      { key: 'AWS_SECRET_ACCESS_KEY', value: '', type: ConfigType.STRING, category: ConfigCategory.CLOUD_STORAGE, description: 'AWS secret access key', isEncrypted: true, isReadOnly: false },
      { key: 'CLOUD_STORAGE_BASE_URL', value: '', type: ConfigType.STRING, category: ConfigCategory.CLOUD_STORAGE, description: 'Cloud storage base URL', isEncrypted: false, isReadOnly: false },
      { key: 'CLOUD_STORAGE_CDN_URL', value: '', type: ConfigType.STRING, category: ConfigCategory.CLOUD_STORAGE, description: 'Cloud storage CDN URL', isEncrypted: false, isReadOnly: false },
      { key: 'ENABLE_CDN', value: 'false', type: ConfigType.BOOLEAN, category: ConfigCategory.CLOUD_STORAGE, description: 'Enable CDN for cloud storage', isEncrypted: false, isReadOnly: false },
      { key: 'CDN_URL', value: '', type: ConfigType.STRING, category: ConfigCategory.CLOUD_STORAGE, description: 'CDN URL', isEncrypted: false, isReadOnly: false },
      
      // Upload Settings
      { key: 'MAX_FILE_SIZE', value: '100000000', type: ConfigType.NUMBER, category: ConfigCategory.UPLOAD, description: 'Maximum file size in bytes', isEncrypted: false, isReadOnly: false },
      { key: 'CHUNK_SIZE', value: '5242880', type: ConfigType.NUMBER, category: ConfigCategory.UPLOAD, description: 'Chunk size for file uploads', isEncrypted: false, isReadOnly: false },
      { key: 'TEMP_DIR', value: 'uploads/_tmp', type: ConfigType.STRING, category: ConfigCategory.UPLOAD, description: 'Temporary directory for uploads', isEncrypted: false, isReadOnly: false },
      { key: 'ALLOWED_IMAGE_TYPES', value: 'image/jpeg,image/png,image/gif,image/webp,image/avif', type: ConfigType.ARRAY, category: ConfigCategory.UPLOAD, description: 'Allowed image MIME types', isEncrypted: false, isReadOnly: false },
      { key: 'ALLOWED_VIDEO_TYPES', value: 'video/mp4,video/avi,video/quicktime,video/x-msvideo,video/webm', type: ConfigType.ARRAY, category: ConfigCategory.UPLOAD, description: 'Allowed video MIME types', isEncrypted: false, isReadOnly: false },
      { key: 'ALLOWED_DOCUMENT_TYPES', value: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain', type: ConfigType.ARRAY, category: ConfigCategory.UPLOAD, description: 'Allowed document MIME types', isEncrypted: false, isReadOnly: false },
      
      // Media Processing Settings
      { key: 'ENABLE_IMAGE_OPTIMIZATION', value: 'true', type: ConfigType.BOOLEAN, category: ConfigCategory.MEDIA_PROCESSING, description: 'Enable image optimization', isEncrypted: false, isReadOnly: false },
      { key: 'ENABLE_VIDEO_PROCESSING', value: 'true', type: ConfigType.BOOLEAN, category: ConfigCategory.MEDIA_PROCESSING, description: 'Enable video processing', isEncrypted: false, isReadOnly: false },
      { key: 'ENABLE_DOCUMENT_PROCESSING', value: 'true', type: ConfigType.BOOLEAN, category: ConfigCategory.MEDIA_PROCESSING, description: 'Enable document processing', isEncrypted: false, isReadOnly: false },
      { key: 'MAX_IMAGE_DIMENSION', value: '4096', type: ConfigType.NUMBER, category: ConfigCategory.MEDIA_PROCESSING, description: 'Maximum image dimension in pixels', isEncrypted: false, isReadOnly: false },
      { key: 'MAX_VIDEO_DURATION', value: '3600', type: ConfigType.NUMBER, category: ConfigCategory.MEDIA_PROCESSING, description: 'Maximum video duration in seconds', isEncrypted: false, isReadOnly: false },
      
      // Security Settings
      { key: 'JWT_SECRET', value: 'aWQf9m6NEU8qmJ3vLcZo6ZT5wdNyv86kc4r5PWTnuulm=', type: ConfigType.STRING, category: ConfigCategory.SECURITY, description: 'JWT secret key', isEncrypted: true, isReadOnly: false },
      { key: 'JWT_EXPIRES_IN', value: '24h', type: ConfigType.STRING, category: ConfigCategory.SECURITY, description: 'JWT token expiration time', isEncrypted: false, isReadOnly: false },
      { key: 'BCRYPT_ROUNDS', value: '12', type: ConfigType.NUMBER, category: ConfigCategory.SECURITY, description: 'BCrypt hashing rounds', isEncrypted: false, isReadOnly: false },
      
      // Rate Limiting Settings
      { key: 'RATE_LIMIT_WINDOW', value: '15m', type: ConfigType.STRING, category: ConfigCategory.RATE_LIMITING, description: 'Rate limiting time window', isEncrypted: false, isReadOnly: false },
      { key: 'RATE_LIMIT_MAX_REQUESTS', value: '100', type: ConfigType.NUMBER, category: ConfigCategory.RATE_LIMITING, description: 'Maximum requests per window', isEncrypted: false, isReadOnly: false },
      { key: 'RATE_LIMIT_TTL', value: '60', type: ConfigType.NUMBER, category: ConfigCategory.RATE_LIMITING, description: 'Rate limiting TTL in seconds', isEncrypted: false, isReadOnly: false },
      { key: 'RATE_LIMIT_LIMIT', value: '100', type: ConfigType.NUMBER, category: ConfigCategory.RATE_LIMITING, description: 'Rate limiting limit', isEncrypted: false, isReadOnly: false },
      
      // Logging Settings
      { key: 'LOG_LEVEL', value: 'info', type: ConfigType.STRING, category: ConfigCategory.LOGGING, description: 'Logging level', isEncrypted: false, isReadOnly: false },
      { key: 'LOG_FILE', value: 'logs/oreo.log', type: ConfigType.STRING, category: ConfigCategory.LOGGING, description: 'Log file path', isEncrypted: false, isReadOnly: false },
      
      // Monitoring Settings
      { key: 'ENABLE_HEALTH_CHECKS', value: 'true', type: ConfigType.BOOLEAN, category: ConfigCategory.MONITORING, description: 'Enable health checks', isEncrypted: false, isReadOnly: false },
      { key: 'HEALTH_CHECK_INTERVAL', value: '30000', type: ConfigType.NUMBER, category: ConfigCategory.MONITORING, description: 'Health check interval in milliseconds', isEncrypted: false, isReadOnly: false },
      
      // Nginx Settings
      { key: 'NGINX_ENABLED', value: 'false', type: ConfigType.BOOLEAN, category: ConfigCategory.NGINX, description: 'Enable Nginx configuration', isEncrypted: false, isReadOnly: false },
      { key: 'NGINX_BASE_URL', value: 'http://localhost:3018', type: ConfigType.STRING, category: ConfigCategory.NGINX, description: 'Nginx base URL', isEncrypted: false, isReadOnly: false },
      { key: 'NGINX_CACHE_ENABLED', value: 'true', type: ConfigType.BOOLEAN, category: ConfigCategory.NGINX, description: 'Enable Nginx caching', isEncrypted: false, isReadOnly: false },
      { key: 'NGINX_CACHE_MAX_AGE', value: '31536000', type: ConfigType.NUMBER, category: ConfigCategory.NGINX, description: 'Nginx cache max age in seconds', isEncrypted: false, isReadOnly: false },
    ];

    for (const config of defaultConfigs) {
      try {
        await this.prisma.configuration.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            type: config.type,
            category: config.category,
            description: config.description,
            isEncrypted: config.isEncrypted,
            isReadOnly: config.isReadOnly,
            updatedAt: new Date(),
          },
          create: {
            key: config.key,
            value: config.value,
            type: config.type,
            category: config.category,
            description: config.description,
            isEncrypted: config.isEncrypted,
            isReadOnly: config.isReadOnly,
          },
        });
        console.log(`✅ Migrated config: ${config.key}`);
      } catch (error) {
        console.error(`❌ Failed to migrate config ${config.key}:`, error.message);
      }
    }

    console.log('🎉 Configuration migration completed!');
  }

  async checkMigrationStatus(): Promise<{ migrated: boolean; missingConfigs: string[] }> {
    const requiredKeys = [
      'NODE_ENV', 'PORT', 'CORS_ORIGIN', 'DATABASE_URL', 'STORAGE_PROVIDER',
      'UPLOAD_DIR', 'MAX_FILE_SIZE', 'JWT_SECRET', 'LOG_LEVEL'
    ];

    const existingConfigs = await this.prisma.configuration.findMany({
      where: { key: { in: requiredKeys } },
      select: { key: true },
    });

    const existingKeys = existingConfigs.map(config => config.key);
    const missingConfigs = requiredKeys.filter(key => !existingKeys.includes(key));

    return {
      migrated: missingConfigs.length === 0,
      missingConfigs,
    };
  }
}
