import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessedMediaService } from './processed-media.service';

@Injectable()
export class ProcessedMediaCleanupService {
  private readonly logger = new Logger(ProcessedMediaCleanupService.name);

  constructor(private readonly processedMediaService: ProcessedMediaService) {}

  /**
   * Run cleanup job daily at 2 AM
   * Cron format: second minute hour day month dayOfWeek
   */
  @Cron('0 2 * * *', {
    name: 'cleanup-expired-processed-media',
    timeZone: 'UTC',
  })
  async handleExpiredCleanup() {
    this.logger.log('Starting scheduled cleanup of expired processed media...');

    try {
      const result = await this.processedMediaService.cleanupExpired();
      
      this.logger.log(
        `Cleanup completed successfully: ${result.deleted} files deleted, ${result.errors.length} errors`
      );

      if (result.errors.length > 0) {
        this.logger.warn(`Cleanup errors: ${JSON.stringify(result.errors)}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Cleanup job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualCleanup() {
    this.logger.log('Manual cleanup triggered');
    return this.handleExpiredCleanup();
  }
}

