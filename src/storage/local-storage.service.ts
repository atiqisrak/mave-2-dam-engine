import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageConfigService } from '../config/config.service';
import { StorageProvider } from './storage.interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import { createHash } from 'crypto';

export interface LocalStorageConfig {
  uploadDir: string;
  optimizedDir: string;
  thumbnailsDir: string;
  convertedDir: string;
  batchDir: string;
  nginxConfig: {
    enabled: boolean;
    baseUrl: string;
    cacheEnabled: boolean;
    cacheMaxAge: number;
  };
}

@Injectable()
export class LocalStorageService implements StorageProvider {
  private config: LocalStorageConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly storageConfigService: StorageConfigService,
  ) {
    this.config = this.storageConfigService.getConfig();
  }

  /**
   * Upload file to local storage
   */
  async uploadFile(
    file: Express.Multer.File,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; key: string; etag?: string }> {
    try {
      // Ensure directory exists
      const fullPath = path.join(this.config.uploadDir, key);
      const dir = path.dirname(fullPath);
      await fs.ensureDir(dir);

      // Write file
      await fs.writeFile(fullPath, file.buffer);

      // Generate etag (file hash)
      const etag = createHash('md5').update(file.buffer).digest('hex');

      // Generate public URL
      const url = this.generatePublicUrl(key);

      return {
        url,
        key,
        etag,
      };
    } catch (error) {
      throw new Error(`Failed to upload file to local storage: ${error.message}`);
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const fullPath = path.join(this.config.uploadDir, key);
      await fs.remove(fullPath);
    } catch (error) {
      throw new Error(`Failed to delete file from local storage: ${error.message}`);
    }
  }

  /**
   * Generate public URL for file
   */
  generatePublicUrl(key: string): string {
    const { nginxConfig } = this.config;
    
    if (nginxConfig.enabled) {
      return `${nginxConfig.baseUrl}/uploads/${key}`;
    }
    
    // Fallback to direct file serving
    return `/uploads/${key}`;
  }

  /**
   * Check if file exists in local storage
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.config.uploadDir, key);
      return await fs.pathExists(fullPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata from local storage
   */
  async getFileMetadata(key: string): Promise<any> {
    try {
      const fullPath = path.join(this.config.uploadDir, key);
      const stats = await fs.stat(fullPath);
      
      return {
        contentType: this.getContentTypeFromExtension(path.extname(key)),
        contentLength: stats.size,
        lastModified: stats.mtime,
        etag: `"${stats.mtime.getTime()}"`,
        metadata: {},
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Generate unique key for file
   */
  generateKey(originalName: string, userId?: string, folder?: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomId}${ext}`;
    
    if (folder) {
      return `${folder}/${filename}`;
    }
    
    if (userId) {
      return `users/${userId}/${filename}`;
    }
    
    return `uploads/${filename}`;
  }

  /**
   * Copy file within local storage
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<string> {
    try {
      const sourcePath = path.join(this.config.uploadDir, sourceKey);
      const destPath = path.join(this.config.uploadDir, destinationKey);
      
      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destPath));
      
      // Copy file
      await fs.copy(sourcePath, destPath);
      
      return this.generatePublicUrl(destinationKey);
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Get storage configuration
   */
  getConfig(): LocalStorageConfig {
    return { ...this.config };
  }

  /**
   * Get content type from file extension
   */
  private getContentTypeFromExtension(ext: string): string {
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-msvideo',
      '.webm': 'video/webm',
      '.mp3': 'audio/mp3',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/m4a',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };

    return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Ensure all required directories exist
   */
  async ensureDirectories(): Promise<void> {
    await this.storageConfigService.ensureDirectories();
  }

  /**
   * Generate nginx configuration
   */
  async generateNginxConfig(): Promise<string> {
    return this.storageConfigService.generateNginxConfig();
  }
}
