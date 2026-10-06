/**
 * Centralized Complaint Types
 * Source of truth for complaint statuses, priorities, and hierarchical jurisdiction tags.
 * Reference: Sections 13, 14, 28 of complaint-system-frontend-README.md
 */

export type ComplaintPriority = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";

export type ComplaintStatus =
  | "SUBMITTED"
  | "VALIDATING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CITIZEN_VERIFICATION"
  | "CLOSED"
  | "REOPENED"
  | "ESCALATED";

export interface TimelineEvent {
  status: ComplaintStatus;
  timestamp: string;
  note: string;
  author: string;
}

export interface RoutingAuditStep {
  level: "STATE" | "DIVISION" | "DISTRICT" | "LOCAL_AUTHORITY" | "DEPARTMENT" | "OFFICER";
  entityName: string;
  timestamp: string;
  method: "AI_GEO_POLYGON" | "ADDRESS_NLP" | "ADMIN_OVERRIDE" | "WORKLOAD_BALANCER";
  details: string;
}

export interface ResolutionEvidence {
  imageUrl: string;
  remarks: string;
  uploadedAt: string;
  uploadedBy: string;
  inspectionPassed: boolean;
}

export interface Complaint {
  id: string;
  trackingNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;

  // Hierarchical Jurisdiction Tags
  divisionId: string;
  divisionName: string;
  districtId: string;
  districtName: string;
  authorityId: string;
  authorityName: string;
  departmentId: string;
  departmentName?: string;
  department: string;

  location: string;
  region: string; // e.g. "North Zone", "South Zone"
  coordinates: { lat: number; lng: number };
  status: ComplaintStatus;
  priority: ComplaintPriority;

  assignedOfficer?: string;
  assignedOfficerId?: string;

  citizenMobile: string;
  citizenName?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;

  imageUrl?: string;
  aiConfidence?: number;
  aiSuggestedCategory?: string;
  aiReasoning?: string;

  timeline: TimelineEvent[];
  routingAuditTrail: RoutingAuditStep[];
  resolutionEvidence?: ResolutionEvidence;
}
