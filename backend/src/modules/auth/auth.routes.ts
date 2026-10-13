import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

// Citizen Routes
router.post('/register', authController.register);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Admin 2FA Routes
router.post('/admin/send-otp', authController.sendAdminOtp);
router.post('/admin/verify-otp', authController.verifyAdminOtp);

export default router;
