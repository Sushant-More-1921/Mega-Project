import {
  INITIAL_DIVISIONS,
  INITIAL_AUTHORITIES,
  INITIAL_DEPARTMENTS,
} from "@/lib/api/hierarchy";
import { MOCK_OFFICERS } from "@/lib/api/officers";
import { RoutingAuditStep } from "@/types/complaint";

export interface AutoRoutingResult {
  division: { id: string; name: string };
  authority: { id: string; name: string };
  department: { id: string; name: string };
  officer: { id: string; name: string; badgeId: string; workload: number };
  steps: RoutingAuditStep[];
}

/**
 * Automated Complaint Router
 * Enforces rule: GPS/Address → Division → District/Authority → Department → Officer
 * Citizens NEVER pick officers manually.
 */
export function simulateAutoRoute(
  address: string,
  category: string,
  coordinates?: { lat: number; lng: number }
): AutoRoutingResult {
  const text = address.toLowerCase();

  // 1. Resolve Division
  let division = INITIAL_DIVISIONS[0]; // Default: Kolhapur Division
  let divisionMethod: RoutingAuditStep["method"] = "ADDRESS_NLP";

  if (coordinates) {
    if (coordinates.lat >= 18.0 && coordinates.lat <= 19.0) {
      division = INITIAL_DIVISIONS.find((d) => d.id === "div-pune") || division;
      divisionMethod = "AI_GEO_POLYGON";
    } else if (coordinates.lat >= 18.8 && coordinates.lng <= 73.2) {
      division = INITIAL_DIVISIONS.find((d) => d.id === "div-mumbai") || division;
      divisionMethod = "AI_GEO_POLYGON";
    }
  } else if (text.includes("pune") || text.includes("kothrud") || text.includes("shivajinagar")) {
    division = INITIAL_DIVISIONS.find((d) => d.id === "div-pune") || division;
  } else if (text.includes("mumbai") || text.includes("thane") || text.includes("bmc")) {
    division = INITIAL_DIVISIONS.find((d) => d.id === "div-mumbai") || division;
  }

  // 2. Resolve Local Authority
  const matchingAuthorities = INITIAL_AUTHORITIES.filter((a) => a.divisionId === division.id);
  const authority = matchingAuthorities[0] || INITIAL_AUTHORITIES[0];

  // 3. Resolve Department based on civic category
  const matchingDepartments = INITIAL_DEPARTMENTS.filter(
    (d) => d.authorityId === authority.id
  );

  let department = matchingDepartments[0] || INITIAL_DEPARTMENTS[0];
  for (const dept of matchingDepartments) {
    if (
      dept.categories.some((cat) =>
        category.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(category.toLowerCase())
      )
    ) {
      department = dept;
      break;
    }
  }

  // 4. Resolve Field Officer by workload balancing
  const deptOfficers = MOCK_OFFICERS.filter((o) => o.departmentId === department.id);
  const candidateOfficers = deptOfficers.length > 0 ? deptOfficers : MOCK_OFFICERS;

  // Pick on-duty officer with lowest active assigned count
  const sortedOfficers = [...candidateOfficers].sort(
    (a, b) => a.assignedComplaintsCount - b.assignedComplaintsCount
  );
  const selectedOfficer = sortedOfficers[0];

  const now = "Just now";

  const steps: RoutingAuditStep[] = [
    {
      level: "STATE",
      entityName: "Maharashtra State Administration",
      timestamp: now,
      method: "AI_GEO_POLYGON",
      details: "State gateway ingress validated.",
    },
    {
      level: "DIVISION",
      entityName: division.name,
      timestamp: now,
      method: divisionMethod,
      details: coordinates
        ? `Geo-Polygon matched coordinates (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}) to ${division.name}.`
        : `Address NLP matched keyword to ${division.name}.`,
    },
    {
      level: "LOCAL_AUTHORITY",
      entityName: authority.name,
      timestamp: now,
      method: "AI_GEO_POLYGON",
      details: `Matched municipal boundary to ${authority.name}.`,
    },
    {
      level: "DEPARTMENT",
      entityName: department.name,
      timestamp: now,
      method: "ADDRESS_NLP",
      details: `Civic category '${category}' mapped to ${department.name}.`,
    },
    {
      level: "OFFICER",
      entityName: `${selectedOfficer.name} (${selectedOfficer.badgeId})`,
      timestamp: now,
      method: "WORKLOAD_BALANCER",
      details: `Allocated to on-duty inspector with lowest active queue (${selectedOfficer.assignedComplaintsCount} active cases).`,
    },
  ];

  return {
    division: { id: division.id, name: division.name },
    authority: { id: authority.id, name: authority.name },
    department: { id: department.id, name: department.name },
    officer: {
      id: selectedOfficer.id,
      name: selectedOfficer.name,
      badgeId: selectedOfficer.badgeId,
      workload: selectedOfficer.assignedComplaintsCount,
    },
    steps,
  };
}
