/**
 * Officer Data Types
 * Reference: Section 28 of complaint-system-frontend-README.md
 */

export type OfficerStatus = "AVAILABLE" | "ON_DUTY" | "BUSY" | "OFF_DUTY";

export interface Officer {
  id: string;
  badgeId: string;
  name: string;
  designation: string;
  department: string;
  departmentId: string;
  authorityId: string;
  authorityName: string;
  districtId: string;
  divisionId: string;
  divisionName: string;
  mobileNumber: string;
  email: string;
  status: OfficerStatus;
  assignedComplaintsCount: number;
  resolvedComplaintsCount: number;
  performanceScore: number; // e.g. 94 (percent)
  averageResolutionHours: number;
  assignedZone: string;
}
