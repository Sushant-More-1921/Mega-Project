/**
 * CivicResolve Mega Project — Administrative Hierarchy & RBAC Data Types
 * Hierarchy: State Admin → Division Admin → District/Local Authority Admin → Department → Officer
 */

export type AdminRole =
  | "STATE_ADMIN"
  | "DIVISION_ADMIN"
  | "AUTHORITY_ADMIN"
  | "DEPARTMENT_ADMIN"
  | "DEPARTMENT_OFFICER";

export interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  authorityId: string;
  headOfficerName?: string;
  categories: string[];
  activeOfficersCount: number;
}

export interface LocalAuthorityInfo {
  id: string;
  code: string;
  name: string;
  type: "MUNICIPAL_CORPORATION" | "MUNICIPAL_COUNCIL" | "ZILLA_PARISHAD";
  districtId: string;
  divisionId: string;
  departmentsCount: number;
  contactEmail?: string;
  contactPhone?: string;
}

export interface DistrictInfo {
  id: string;
  code: string;
  name: string;
  divisionId: string;
  authoritiesCount: number;
}

export interface DivisionInfo {
  id: string;
  code: string;
  name: string;
  state: string; // e.g. "Maharashtra"
  headquarters: string;
  districtsCount: number;
  authoritiesCount: number;
  status: "ACTIVE" | "MAINTENANCE";
}

export interface JurisdictionScope {
  role: AdminRole;
  roleTitle: string;
  userDisplayName: string;
  divisionId?: string;
  divisionName?: string;
  districtId?: string;
  districtName?: string;
  authorityId?: string;
  authorityName?: string;
  departmentId?: string;
  departmentName?: string;
  officerId?: string;
  badgeId: string;
}
