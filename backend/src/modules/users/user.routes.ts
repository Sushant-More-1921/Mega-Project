import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.use(authMiddleware); // Protect all user routes

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);

export default router;
