import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import complaintsRoutes from '../modules/complaints/complaints.routes';
import adminRoutes from '../modules/admin/admin.routes';
import aiRoutes from '../modules/ai/ai.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/complaints', complaintsRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);

export default router;
