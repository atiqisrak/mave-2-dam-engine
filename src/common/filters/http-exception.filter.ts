import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log the exception
    this.logger.error(
      `HTTP Exception: ${status} - ${request.method} ${request.url}`,
      {
        status,
        method: request.method,
        url: request.url,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        exception: exceptionResponse,
        stack: exception.stack,
      },
    );

    // Determine error message
    let message: string;
    let errors: any = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || 'An error occurred';
      errors = responseObj.errors || null;
    } else {
      message = 'An error occurred';
    }

    // Create error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    };

    // Add additional context for specific status codes
    if (status === HttpStatus.BAD_REQUEST) {
      errorResponse['hint'] = 'Please check your request parameters and try again';
    } else if (status === HttpStatus.UNAUTHORIZED) {
      errorResponse['hint'] = 'Please provide valid authentication credentials';
    } else if (status === HttpStatus.FORBIDDEN) {
      errorResponse['hint'] = 'You do not have permission to access this resource';
    } else if (status === HttpStatus.NOT_FOUND) {
      errorResponse['hint'] = 'The requested resource was not found';
    } else if (status === HttpStatus.CONFLICT) {
      errorResponse['hint'] = 'The request conflicts with the current state of the resource';
    } else if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse['hint'] = 'An internal server error occurred. Please try again later';
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        errorResponse.message = 'Internal server error';
        errorResponse.errors = null;
      }
    }

    response.status(status).json(errorResponse);
  }
}
