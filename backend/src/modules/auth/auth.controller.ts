import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';

const authService = new AuthService();

const sendOtpSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid 10-digit mobile number required'),
});

const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid 10-digit mobile number required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  otpSessionId: z.string().optional(),
});

const registerSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid 10-digit mobile number required'),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export class AuthController {
  public sendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = sendOtpSchema.parse(req.body);
      const result = await authService.sendOtp(data.phoneNumber);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(data.phoneNumber, data.otp, data.otpSessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public sendAdminOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = sendOtpSchema.parse(req.body);
      const result = await authService.sendAdminOtp(data.phoneNumber);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public verifyAdminOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyAdminOtp(data.phoneNumber, data.otp, data.otpSessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      res.status(201).json({
        success: true,
        message: 'Citizen registered successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}
