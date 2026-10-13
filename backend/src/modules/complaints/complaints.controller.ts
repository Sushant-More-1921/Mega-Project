import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ComplaintsService } from './complaints.service';
import { z } from 'zod';

const complaintsService = new ComplaintsService();

const createComplaintSchema = z.object({
  title: z.string().optional(),
  description: z.string().min(10, 'Complaint description must be at least 10 characters'),
  category: z.string().min(1, 'Complaint category is required'),
  subcategory: z.string().optional(),
  divisionId: z.string().optional(),
  divisionName: z.string().optional(),
  authorityId: z.string().optional(),
  authorityName: z.string().optional(),
  departmentId: z.string().optional(),
  location: z.string().min(3, 'Location is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrl: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'SUBMITTED',
    'UNDER_REVIEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'REJECTED',
  ]),
  rejectionReason: z.string().optional(),
  resolutionRemarks: z.string().optional(),
  resolutionImageUrl: z.string().optional(),
});

const assignOfficerSchema = z.object({
  officerId: z.string().min(1, 'Officer ID required'),
  officerName: z.string().min(1, 'Officer name required'),
});

export class ComplaintsController {
  public createComplaint = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const data = createComplaintSchema.parse(req.body);
      const result = await complaintsService.createComplaint(req.user.id, data);

      res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMyComplaints = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const list = await complaintsService.getCitizenComplaints(req.user.id);

      res.status(200).json({
        success: true,
        data: list,
      });
    } catch (error) {
      next(error);
    }
  };

  public getComplaintByTracking = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const trackingNumber = String(req.params.trackingNumber);
      const result = await complaintsService.getComplaintByTrackingNumber(trackingNumber);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getComplaintById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const complaintId = String(req.params.id);
      const result = await complaintsService.getComplaintById(
        complaintId,
        req.user.id,
        req.user.role
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllComplaints = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, priority, category, divisionId, authorityId, departmentId, search } = req.query;

      const list = await complaintsService.getAllComplaints({
        status: status as string,
        priority: priority as string,
        category: category as string,
        divisionId: divisionId as string,
        authorityId: authorityId as string,
        departmentId: departmentId as string,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        count: list.length,
        data: list,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const complaintId = String(req.params.id);
      const data = updateStatusSchema.parse(req.body);
      const result = await complaintsService.updateComplaintStatus(
        complaintId,
        data.status,
        {
          authorName: (req as any).user.name || 'Admin Officer',
          authorRole: req.user.role,
          rejectionReason: data.rejectionReason,
          resolutionRemarks: data.resolutionRemarks,
          resolutionImageUrl: data.resolutionImageUrl,
        }
      );

      res.status(200).json({
        success: true,
        message: `Complaint status updated to ${data.status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public assignOfficer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const complaintId = String(req.params.id);
      const data = assignOfficerSchema.parse(req.body);
      const result = await complaintsService.assignOfficer(
        complaintId,
        data.officerId,
        data.officerName,
        (req as any).user.name || 'Administrative Command'
      );

      res.status(200).json({
        success: true,
        message: `Assigned to Officer ${data.officerName}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await complaintsService.getAdminStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
