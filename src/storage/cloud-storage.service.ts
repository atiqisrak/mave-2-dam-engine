import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';

export interface CloudStorageConfig {
  provider: 'aws' | 'gcp' | 'azure';
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  baseUrl?: string;
  cdnUrl?: string;
}

@Injectable()
export class CloudStorageService {
  private s3Client: S3Client;
  private config: CloudStorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.loadConfig();
    this.initializeClient();
  }

  private loadConfig(): void {
    this.config = {
      provider: this.configService.get<string>('CLOUD_STORAGE_PROVIDER', 'aws') as 'aws' | 'gcp' | 'azure',
      bucket: this.configService.get<string>('CLOUD_STORAGE_BUCKET', 'oreo-media-bucket'),
      region: this.configService.get<string>('CLOUD_STORAGE_REGION', 'us-east-1'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      baseUrl: this.configService.get<string>('CLOUD_STORAGE_BASE_URL'),
      cdnUrl: this.configService.get<string>('CLOUD_STORAGE_CDN_URL'),
    };
  }

  private initializeClient(): void {
    if (this.config.provider === 'aws') {
      this.s3Client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId!,
          secretAccessKey: this.config.secretAccessKey!,
        },
      });
    }
  }

  /**
   * Upload file to cloud storage
   */
  async uploadFile(
    file: Express.Multer.File,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; key: string; etag: string }> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: metadata,
      ACL: 'public-read', // Make files publicly accessible
    });

    try {
      const result = await this.s3Client.send(command);
      
      // Generate public URL
      const url = this.generatePublicUrl(key);
      
      return {
        url,
        key,
        etag: result.ETag || '',
      };
    } catch (error) {
      throw new Error(`Failed to upload file to cloud storage: ${error.message}`);
    }
  }

  /**
   * Delete file from cloud storage
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(`Failed to delete file from cloud storage: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for private file access
   */
  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Generate public URL for file
   */
  generatePublicUrl(key: string): string {
    if (this.config.cdnUrl) {
      return `${this.config.cdnUrl}/${key}`;
    }
    
    if (this.config.baseUrl) {
      return `${this.config.baseUrl}/${key}`;
    }

    // Default S3 URL format
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
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
   * Check if file exists in cloud storage
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata from cloud storage
   */
  async getFileMetadata(key: string): Promise<any> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      
      const result = await this.s3Client.send(command);
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Copy file within cloud storage
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<string> {
    const command = new CopyObjectCommand({
      Bucket: this.config.bucket,
      Key: destinationKey,
      CopySource: `${this.config.bucket}/${sourceKey}`,
      ACL: 'public-read',
    });

    try {
      await this.s3Client.send(command);
      return this.generatePublicUrl(destinationKey);
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): CloudStorageConfig {
    return { ...this.config };
  }
}
