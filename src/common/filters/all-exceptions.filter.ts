import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code and message
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    // Handle different types of exceptions
    if (exception instanceof Error) {
      message = exception.message;
      
      // Check for specific error types
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Validation failed';
        errors = exception.message;
      } else if (exception.name === 'PrismaClientKnownRequestError') {
        const prismaError = exception as any;
        if (prismaError.code === 'P2002') {
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
        } else if (prismaError.code === 'P2025') {
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
        } else if (prismaError.code === 'P2003') {
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid foreign key reference';
        }
      } else if (exception.name === 'PrismaClientValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid data provided';
        errors = exception.message;
      }
    }

    // Log the exception
    this.logger.error(
      `Unhandled Exception: ${status} - ${request.method} ${request.url}`,
      {
        status,
        method: request.method,
        url: request.url,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        exception: {
          name: exception instanceof Error ? exception.name : 'Unknown',
          message: exception instanceof Error ? exception.message : String(exception),
          stack: exception instanceof Error ? exception.stack : undefined,
        },
      },
    );

    // Create error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    };

    // Add hint for internal server errors
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse['hint'] = 'An unexpected error occurred. Please try again later';
      
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        errorResponse.message = 'Internal server error';
        errorResponse.errors = null;
      }
    }

    response.status(status).json(errorResponse);
  }
}
