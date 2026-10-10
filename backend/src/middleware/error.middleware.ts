import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof z.ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validation Error',
      error: {
        code: 'VALIDATION_ERROR',
        details: err.issues,
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};
