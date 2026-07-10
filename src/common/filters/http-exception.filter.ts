import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse();
      
      if (typeof resContent === 'object' && resContent !== null) {
        message = (resContent as any).message || (resContent as any).error || message;
        errorCode = (resContent as any).error || 'BAD_REQUEST';
      } else {
        message = resContent as string;
      }
    } else if (exception instanceof Error) {
      // Standard database errors or other internal errors
      message = exception.message;
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception: ${String(exception)}`);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      errorCode,
      message: Array.isArray(message) ? message : [message],
      ...(isProduction ? {} : { stack: exception instanceof Error ? exception.stack : undefined }),
    };

    response.status(status).json(errorResponse);
  }
}
