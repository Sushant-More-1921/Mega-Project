import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().optional(),
});

export class UserController {
  public getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          role: true,
          departmentId: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: { code: 'USER_NOT_FOUND' },
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profile fetched successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const data = updateProfileSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          role: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}
