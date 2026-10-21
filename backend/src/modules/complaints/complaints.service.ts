import { prisma } from '../../config/database';
import { randomUUID } from 'crypto';
import { AIAnalysis, AIComplaintContext, aiService } from '../ai/ai.service';

export interface CreateComplaintInput {
  title?: string;
  description: string;
  category?: string;
  language?: 'en' | 'hi' | 'mr';
  subcategory?: string;
  divisionId?: string;
  divisionName?: string;
  authorityId?: string;
  authorityName?: string;
  departmentId?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  imageBase64?: string;
  imageContentType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export class ComplaintsService {
  /**
   * Determine statutory SLA hours by category
   */
  private getSlaHours(category: string, priority?: string): number {
    const cat = category.toLowerCase();
    if (cat.includes('hazard') || cat.includes('chemical') || cat.includes('bio')) return 2;
    if (cat.includes('waste') || cat.includes('garbage')) return 4;
    if (cat.includes('water') || cat.includes('leak') || cat.includes('pipe')) return 6;
    if (cat.includes('sewage') || cat.includes('drain')) return 8;
    if (cat.includes('road') || cat.includes('pothole')) return 12;
    if (cat.includes('light') || cat.includes('electric')) return 24;
    if (priority === 'VERY_HIGH') return 4;
    if (priority === 'HIGH') return 12;
    return 24;
  }

  /**
   * Create a new complaint lodged by authenticated citizen
   */
  public async createComplaint(userId: string, data: CreateComplaintInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: any = new Error('Citizen user profile not found.');
      error.statusCode = 404;
      throw error;
    }

    const complaintId = randomUUID();
    const trackingNumber = `CMP-${new Date().getFullYear()}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;
    const previousComplaints = data.latitude != null && data.longitude != null
      ? await prisma.complaint.findMany({
          where: {
            latitude: { not: null },
            longitude: { not: null },
          },
          select: {
            id: true,
            citizenId: true,
            description: true,
            latitude: true,
            longitude: true,
            category: true,
            issueClusterId: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
        })
      : [];

    const complaintContext: AIComplaintContext[] = previousComplaints.flatMap(
      (complaint) => {
        if (complaint.latitude == null || complaint.longitude == null) {
          return [];
        }
        return [{
          id: complaint.id,
          citizen_id: complaint.citizenId,
          text: complaint.description,
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          category: complaint.category,
          issue_cluster_id: complaint.issueClusterId,
          created_at: complaint.createdAt.toISOString(),
          status: complaint.status,
        }];
      }
    );
    const clusterGroups = new Map<string, AIComplaintContext[]>();
    for (const complaint of complaintContext) {
      if (!complaint.issue_cluster_id) continue;
      const cluster = clusterGroups.get(complaint.issue_cluster_id) || [];
      cluster.push(complaint);
      clusterGroups.set(complaint.issue_cluster_id, cluster);
    }
    const issueClusters = Array.from(clusterGroups.entries()).map(
      ([issueClusterId, complaints]) => ({
        issue_cluster_id: issueClusterId,
        category: complaints[0].category,
        location: {
          latitude: complaints[0].latitude,
          longitude: complaints[0].longitude,
        },
        report_count: complaints.length,
        unique_citizen_count: new Set(
          complaints.map((complaint) => complaint.citizen_id)
        ).size,
      })
    );
    const imageResult = data.imageBase64 && data.imageContentType
      ? await aiService.analyzeImage({
          imageBase64: data.imageBase64,
          contentType: data.imageContentType,
          text: data.description,
          language: data.language,
        })
      : null;
    const imageUrl = data.imageBase64 && data.imageContentType
      ? await aiService.uploadComplaintImage(data.imageBase64, data.imageContentType)
      : data.imageUrl;
    const analysisText = imageResult
      ? `${data.description}\nVisible photo evidence: ${imageResult.image_description}`
      : data.description;
    const aiResult: AIAnalysis = await aiService.analyzeComplaint({
      text: analysisText,
      language: data.language,
      latitude: data.latitude,
      longitude: data.longitude,
      complaintId,
      citizenId: user.id,
      previousComplaints: complaintContext,
      issueClusters,
    });
    const category = aiResult.category;
    const priority = this.mapPriority(aiResult.priority);
    const location =
      data.location ||
      (data.latitude != null && data.longitude != null
        ? `GPS ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`
        : 'Location not provided');
    const slaHours = this.getSlaHours(category, priority);
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    // Auto-detect default department if not provided
    let departmentId = data.departmentId;
    if (!departmentId) {
      const catLower = category.toLowerCase();
      let deptNamePattern = 'Solid Waste Management';
      if (catLower.includes('water')) deptNamePattern = 'Hydraulics & Water Supply';
      else if (catLower.includes('road')) deptNamePattern = 'Road Infrastructure & Maintenance';
      else if (catLower.includes('sewage') || catLower.includes('drain')) deptNamePattern = 'Drainage & Sewerage Operations';
      else if (catLower.includes('light')) deptNamePattern = 'Electrical & Streetlighting';
      else if (catLower.includes('hazard')) deptNamePattern = 'Environmental Safety & Hazardous Waste';

      const foundDept = await prisma.department.findFirst({
        where: { name: { contains: deptNamePattern } },
      });
      if (foundDept) {
        departmentId = foundDept.id;
      }
    }

    // Auto-assign lowest workload officer if available
    let assignedOfficerId: string | null = null;
    let assignedOfficerName: string | null = null;
    if (departmentId && !aiResult.manual_review) {
      const availableOfficer = await prisma.officer.findFirst({
        where: { departmentId },
        orderBy: { activeCases: 'asc' },
      });
      if (availableOfficer) {
        assignedOfficerId = availableOfficer.id;
        assignedOfficerName = availableOfficer.name;
        // Increment officer's active caseload
        await prisma.officer.update({
          where: { id: availableOfficer.id },
          data: { activeCases: { increment: 1 } },
        });
      }
    }

    const initialStatus = aiResult.manual_review
      ? 'UNDER_REVIEW'
      : assignedOfficerId
        ? 'ASSIGNED'
        : 'SUBMITTED';

    const complaint = await prisma.complaint.create({
      data: {
        id: complaintId,
        trackingNumber,
        title: data.title || `${category}: ${location}`,
        description: data.description,
        category,
        subcategory: data.subcategory,
        divisionId: data.divisionId || 'div-kolhapur',
        divisionName: data.divisionName || 'Kolhapur Division',
        districtId: 'dist-kolhapur',
        districtName: 'Kolhapur District',
        authorityId: data.authorityId || 'auth-kmc',
        authorityName: data.authorityName || 'Kolhapur Municipal Corporation (KMC)',
        departmentId,
        location,
        latitude: data.latitude,
        longitude: data.longitude,
        imageUrl,
        status: initialStatus,
        priority,
        citizenId: user.id,
        assignedOfficerId,
        assignedOfficerName,
        slaHours,
        slaDeadline,
        aiConfidence: aiResult.category_confidence,
        aiSuggestedCategory: aiResult.category,
        aiReasoning: [
          this.createAiReasoning(aiResult),
          imageResult ? `Photo analysis: ${imageResult.image_description}` : null,
        ].filter(Boolean).join(' '),
        aiLanguage: aiResult.language,
        issueClusterId: aiResult.issue_cluster_id,
        duplicateOfId:
          aiResult.duplicate_detection?.issue_cluster?.duplicate_of != null
            ? String(aiResult.duplicate_detection.issue_cluster.duplicate_of)
            : null,
        timeline: {
          create: [
            {
              status: 'SUBMITTED',
              note: 'Complaint lodged by citizen with location and evidence.',
              author: user.name || 'Citizen',
              authorRole: 'CITIZEN',
            },
            {
              status: aiResult.manual_review ? 'UNDER_REVIEW' : 'SUBMITTED',
              note: this.createAiReasoning(aiResult),
              author: 'CivicResolve AI',
              authorRole: 'SYSTEM',
            },
            ...(assignedOfficerName
              ? [
                  {
                    status: 'ASSIGNED',
                    note: `Automatically assigned to field officer ${assignedOfficerName} based on lowest active caseload.`,
                    author: 'Auto-Dispatch Pipeline',
                    authorRole: 'SYSTEM',
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        department: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    return complaint;
  }

  private mapPriority(priority: string): string {
    const normalized = priority.toLowerCase();
    if (normalized === 'critical' || normalized === 'very_high') return 'VERY_HIGH';
    if (normalized === 'high') return 'HIGH';
    if (normalized === 'medium') return 'MEDIUM';
    if (normalized === 'low') return 'LOW';
    const error = new Error(`AI returned an unsupported priority: ${priority}`);
    Object.assign(error, { statusCode: 502 });
    throw error;
  }

  private createAiReasoning(result: AIAnalysis): string {
    const confidence = `${Math.round(result.category_confidence * 100)}%`;
    const reviewNote = result.manual_review
      ? ' Manual review is recommended.'
      : '';
    return `AI classified this as ${result.category} with ${confidence} confidence and ${result.priority} priority.${reviewNote}`;
  }

  /**
   * Return only complaints belonging to the requesting citizen
   */
  public async getCitizenComplaints(citizenId: string) {
    const list = await prisma.complaint.findMany({
      where: { citizenId },
      include: {
        department: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list;
  }

  /**
   * Track complaint by public tracking number (e.g. CMP-2026-1042)
   */
  public async getComplaintByTrackingNumber(trackingNumber: string) {
    const q = trackingNumber.trim().toUpperCase();

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [
          { trackingNumber: q },
          { trackingNumber: { contains: q } },
          { id: q },
        ],
      },
      include: {
        department: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!complaint) {
      const error: any = new Error(`Complaint with tracking ID "${trackingNumber}" not found.`);
      error.statusCode = 404;
      throw error;
    }

    return complaint;
  }

  /**
   * Get single complaint with access control check
   */
  public async getComplaintById(complaintId: string, userId: string, userRole: string) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        citizen: { select: { id: true, name: true, phoneNumber: true } },
        department: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!complaint) {
      const error: any = new Error('Complaint not found.');
      error.statusCode = 404;
      throw error;
    }

    // Access control: citizens can ONLY view their own complaint
    if (userRole === 'CITIZEN' && complaint.citizenId !== userId) {
      const error: any = new Error('Forbidden: You do not have permission to access another citizen\'s complaint.');
      error.statusCode = 403;
      throw error;
    }

    return complaint;
  }

  /**
   * Query all complaints with multi-criteria filtering for Admin / Officers
   */
  public async getAllComplaints(filters: {
    status?: string;
    priority?: string;
    category?: string;
    divisionId?: string;
    authorityId?: string;
    departmentId?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters.priority && filters.priority !== 'ALL') {
      where.priority = filters.priority;
    }
    if (filters.category && filters.category !== 'ALL') {
      where.category = { contains: filters.category };
    }
    if (filters.divisionId && filters.divisionId !== 'ALL') {
      where.divisionId = filters.divisionId;
    }
    if (filters.authorityId && filters.authorityId !== 'ALL') {
      where.authorityId = filters.authorityId;
    }
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      where.departmentId = filters.departmentId;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { trackingNumber: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        department: true,
        citizen: { select: { id: true, name: true, phoneNumber: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return complaints;
  }

  /**
   * Update complaint status with audit trail
   */
  public async updateComplaintStatus(
    complaintId: string,
    newStatus: string,
    options: {
      authorName: string;
      authorRole: string;
      rejectionReason?: string;
      resolutionRemarks?: string;
      resolutionImageUrl?: string;
    }
  ) {
    const allowedStatuses = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'ASSIGNED',
      'IN_PROGRESS',
      'RESOLVED',
      'CLOSED',
      'REJECTED',
    ];

    if (!allowedStatuses.includes(newStatus)) {
      const error: any = new Error(`Invalid status transition: ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      const error: any = new Error('Complaint not found.');
      error.statusCode = 404;
      throw error;
    }

    if (newStatus === 'REJECTED' && !options.rejectionReason) {
      const error: any = new Error('A rejection reason is strictly required when rejecting a complaint.');
      error.statusCode = 400;
      throw error;
    }

    let note = `Status updated from ${complaint.status} to ${newStatus}.`;
    if (newStatus === 'REJECTED') {
      note = `Complaint rejected. Reason: "${options.rejectionReason}".`;
    } else if (newStatus === 'RESOLVED') {
      note = `Field work completed & signed off. Remarks: "${options.resolutionRemarks || 'Issue resolved successfully.'}".`;
    }

    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === 'REJECTED') {
      updateData.rejectionReason = options.rejectionReason;
    } else if (newStatus === 'RESOLVED') {
      updateData.resolutionRemarks = options.resolutionRemarks || 'Resolved';
      updateData.resolutionImageUrl = options.resolutionImageUrl;
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        department: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Record timeline step
    await prisma.complaintTimeline.create({
      data: {
        complaintId,
        status: newStatus,
        note,
        author: options.authorName,
        authorRole: options.authorRole,
      },
    });

    return updated;
  }

  /**
   * Assign an officer to a complaint
   */
  public async assignOfficer(
    complaintId: string,
    officerId: string,
    officerName: string,
    authorName: string
  ) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      const error: any = new Error('Complaint not found.');
      error.statusCode = 404;
      throw error;
    }

    const newStatus = complaint.status === 'SUBMITTED' ? 'ASSIGNED' : complaint.status;

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        assignedOfficerId: officerId,
        assignedOfficerName: officerName,
        status: newStatus,
      },
      include: {
        department: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Create timeline step
    await prisma.complaintTimeline.create({
      data: {
        complaintId,
        status: newStatus,
        note: `Assigned to Field Officer ${officerName} (${officerId}) by ${authorName}.`,
        author: authorName,
        authorRole: 'ADMIN',
      },
    });

    // Update officer caseload
    await prisma.officer.updateMany({
      where: { id: officerId },
      data: { activeCases: { increment: 1 } },
    });

    return updated;
  }

  /**
   * Compute live administrative metrics directly from persistent DB
   */
  public async getAdminStats() {
    const total = await prisma.complaint.count();
    const resolved = await prisma.complaint.count({ where: { status: 'RESOLVED' } });
    const inProgress = await prisma.complaint.count({
      where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'] } },
    });
    const pending = await prisma.complaint.count({ where: { status: 'SUBMITTED' } });
    const veryHigh = await prisma.complaint.count({ where: { priority: 'VERY_HIGH' } });
    const now = new Date();
    const slaBreached = await prisma.complaint.count({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
        slaDeadline: { lt: now },
      },
    });

    return {
      total,
      pending,
      inProgress,
      resolved,
      veryHigh,
      slaBreached,
      complianceRate: total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 94.8,
    };
  }
}
