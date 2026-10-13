import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';

const router = Router();
const controller = new AdminController();

router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN', 'OFFICER']));

router.get('/officers', controller.getOfficers);
router.get('/departments', controller.getDepartments);

export default router;
