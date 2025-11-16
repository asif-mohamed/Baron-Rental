import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Request error', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
  });
  
  const statusCode = err.statusCode || err.status || 500;
  
  const response: ErrorResponse = {
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
  };
  
  // Include details in development
  if (process.env.NODE_ENV !== 'production') {
    response.details = err.details;
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    error: 'NotFound',
    message: `Route not found: ${req.method} ${req.url}`,
  });
};
