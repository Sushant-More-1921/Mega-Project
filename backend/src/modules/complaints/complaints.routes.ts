import { Router } from 'express';
import { ComplaintsController } from './complaints.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';

const router = Router();
const controller = new ComplaintsController();

// Public / Unauthenticated Tracking
router.get('/track/:trackingNumber', controller.getComplaintByTracking);

// Protected Citizen Routes
router.post('/', authMiddleware, controller.createComplaint);
router.get('/my', authMiddleware, controller.getMyComplaints);
router.get('/:id', authMiddleware, controller.getComplaintById);

// Protected Admin / Officer Management Routes
router.get(
  '/admin/stats',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'OFFICER']),
  controller.getAdminStats
);
router.get(
  '/',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'OFFICER']),
  controller.getAllComplaints
);
router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'OFFICER']),
  controller.updateStatus
);
router.patch(
  '/:id/assign',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  controller.assignOfficer
);

export default router;
