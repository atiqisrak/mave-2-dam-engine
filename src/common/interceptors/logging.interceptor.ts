import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent');
    const startTime = Date.now();

    // Log request start
    this.logger.log(
      `Incoming ${method} request to ${url}`,
      'HTTP',
    );

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const statusCode = response.statusCode;

        // Log successful response
        this.logger.log(
          `${method} ${url} - ${statusCode} - ${responseTime}ms`,
          'HTTP',
        );

        // Log additional request details for debugging
        this.logger.debug(
          `Request details: ${method} ${url} from ${ip} (${userAgent})`,
          'HTTP',
        );
      }),
      catchError((error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.logger.error(
          `${method} ${url} - ${statusCode} - ${responseTime}ms - Error: ${error.message}`,
          error.stack,
          'HTTP',
        );

        throw error;
      }),
    );
  }
}
