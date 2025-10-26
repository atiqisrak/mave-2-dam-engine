export interface StorageProvider {
  /**
   * Upload file to storage
   */
  uploadFile(
    file: Express.Multer.File,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; key: string; etag?: string }>;

  /**
   * Delete file from storage
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Generate public URL for file
   */
  generatePublicUrl(key: string): string;

  /**
   * Generate presigned URL for private file access
   */
  generatePresignedUrl?(key: string, expiresIn?: number): Promise<string>;

  /**
   * Check if file exists in storage
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Get file metadata from storage
   */
  getFileMetadata(key: string): Promise<any>;

  /**
   * Copy file within storage
   */
  copyFile?(sourceKey: string, destinationKey: string): Promise<string>;

  /**
   * Generate unique key for file
   */
  generateKey(originalName: string, userId?: string, folder?: string): string;

  /**
   * Get storage configuration
   */
  getConfig(): any;
}
