import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(private readonly logger: Logger) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for specific use cases
  logHttpRequest(method: string, url: string, statusCode: number, responseTime: number, context?: string) {
    this.logger.info('HTTP Request', {
      context: context || 'HTTP',
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: string) {
    this.logger.debug('Database Query', {
      context: context || 'Database',
      query,
      duration: `${duration}ms`,
    });
  }

  logFileOperation(operation: string, filePath: string, fileSize?: number, context?: string) {
    this.logger.info('File Operation', {
      context: context || 'FileSystem',
      operation,
      filePath,
      ...(fileSize && { fileSize: `${fileSize} bytes` }),
    });
  }

  logMediaProcessing(mediaId: string, stage: string, duration?: number, context?: string) {
    this.logger.info('Media Processing', {
      context: context || 'Media',
      mediaId,
      stage,
      ...(duration && { duration: `${duration}ms` }),
    });
  }

  logSecurityEvent(event: string, userId?: string, ip?: string, context?: string) {
    this.logger.warn('Security Event', {
      context: context || 'Security',
      event,
      ...(userId && { userId }),
      ...(ip && { ip }),
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string, context?: string) {
    this.logger.info('Performance Metric', {
      context: context || 'Performance',
      metric,
      value: `${value}${unit}`,
    });
  }
}
