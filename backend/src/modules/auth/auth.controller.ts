import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';

const authService = new AuthService();

const registerSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be valid'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be valid'),
});

export class AuthController {
  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data.phoneNumber);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
