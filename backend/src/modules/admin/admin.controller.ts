import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';

export class AdminController {
  public getOfficers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const officers = await prisma.officer.findMany({
        orderBy: { name: 'asc' },
      });
      res.status(200).json({
        success: true,
        data: officers,
      });
    } catch (error) {
      next(error);
    }
  };

  public getDepartments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' },
      });
      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  };
}
