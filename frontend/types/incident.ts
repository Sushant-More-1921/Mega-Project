/**
 * CivicResolve Incident & Complaint Clustering Types
 * Models the relationship:
 * Master Incident (1) ───< Supporting Citizen Complaints (N)
 */

import { ComplaintPriority, ComplaintStatus, RoutingAuditStep, TimelineEvent, ResolutionEvidence } from "./complaint";

export interface CitizenReport {
  id: string;
  trackingNumber: string; // e.g. CMP-1042-01
  citizenName: string;
  citizenMobile: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  imageUrl?: string;
  reportedAt: string; // e.g. "Today, 10:45 AM"
  timestamp: number; // Unix epoch ms
  channel: "MOBILE_APP" | "WEB_PORTAL" | "WHATSAPP" | "TOLL_FREE_1916";
  aiConfidence?: number;
}

export interface MasterIncident {
  id: string;
  incidentNumber: string; // e.g. INC-2026-1042
  title: string;
  description: string;
  category: string;
  subcategory?: string;

  // Jurisdictional Hierarchy
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
  region: string;
  coordinates: { lat: number; lng: number };

  status: ComplaintStatus;
  priority: ComplaintPriority;

  // Officer Allocation
  assignedOfficer?: string;
  assignedOfficerId?: string;

  // Dynamic Clustering Relationship
  complaintCount: number; // e.g. 25
  supportingReports: CitizenReport[]; // The 25 individual citizen reports

  // SLA & Timestamps
  firstReportedAt: string;
  lastReportedAt: string;
  createdAtTimestamp: number;
  lastReportedTimestamp: number;

  slaHours: number; // e.g. 4, 12, 24, 48
  slaDeadline: string; // Formatted date/time
  slaRemainingMinutes: number;
  isSlaBreached: boolean;

  // AI & Auditing
  imageUrl?: string;
  aiConfidence: number;
  aiSuggestedCategory: string;
  aiReasoning: string;

  timeline: TimelineEvent[];
  routingAuditTrail: RoutingAuditStep[];
  resolutionEvidence?: ResolutionEvidence;
}

export interface DashboardStats {
  totalComplaints: number; // Total citizen reports across all incidents
  activeIncidents: number; // Incidents not RESOLVED or CLOSED
  newComplaints: number; // SUBMITTED & unassigned
  assignedCases: number; // Incidents assigned to an officer
  unassignedCases: number; // Incidents not yet assigned
  pendingCases: number; // SUBMITTED + VALIDATING + ASSIGNED
  inProgressCases: number; // IN_PROGRESS
  resolvedCases: number; // RESOLVED + CLOSED
  escalatedCases: number; // ESCALATED
  slaBreachedCases: number; // SLA deadline expired
  highPriorityCases: number; // VERY_HIGH or HIGH
  totalSupportingReports: number; // Duplicate citizen reports clustered (totalComplaints - activeIncidents)
}

export interface IncidentFilterParams {
  divisionId?: string;
  districtId?: string;
  authorityId?: string;
  departmentId?: string;
  officerId?: string;
  priority?: string;
  status?: string;
  dateRange?: string;
  search?: string;
  assignedOfficerName?: string;
}

export interface ClusterEvaluationResult {
  isMatch: boolean;
  incidentId?: string;
  matchScore: number;
  reason: string;
}

export interface MapIncidentItem {
  incidentId: string;
  latitude: number;
  longitude: number;
  complaintCount: number;
  category: string;
  subcategory?: string;
  priority: ComplaintPriority;
  department: string;
  departmentId?: string;
  status: ComplaintStatus;
  division: string;
  divisionId: string;
  district: string;
  districtId: string;
  authority: string;
  authorityId: string;
  slaDeadline: string;
  slaRemainingMinutes: number;
  isSlaBreached: boolean;
  title: string;
  description?: string;
  location: string;
  lastReportedAt: string;
  assignedOfficer?: string;
  assignedOfficerId?: string;
  imageUrl?: string;
}

export interface MapClusterItem {
  clusterId: string;
  title: string;
  center: { lat: number; lng: number };
  incidentCount: number;
  totalComplaints: number;
  dominantCategory: string;
  dominantPriority: ComplaintPriority;
  incidents: string[];
  bounds: { north: number; south: number; east: number; west: number };
}

export interface MapHotspotItem {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
  complaintCount: number;
  incidentCount: number;
  densityLevel: "CRITICAL" | "HIGH" | "MODERATE";
  dominantCategory: string;
  divisionId: string;
  authorityId: string;
  color: string;
  borderColor: string;
}
