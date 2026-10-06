import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Placeholder for OTP endpoints
// router.post('/send-otp', authController.sendOtp);
// router.post('/verify-otp', authController.verifyOtp);

export default router;
