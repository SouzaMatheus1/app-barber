import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Se o erro não for customizado (AppError), joga como erro interno
  console.error('[Unhandled Error]', err);

  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(500).json({
    status: 'error',
    message: isProduction ? 'Internal server error' : (err.message || 'Internal server error'),
  });
};
