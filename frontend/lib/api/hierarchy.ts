import {
  DivisionInfo,
  DistrictInfo,
  LocalAuthorityInfo,
  DepartmentInfo,
  JurisdictionScope,
} from "@/types/hierarchy";

// Configurable Divisions in Maharashtra
export const INITIAL_DIVISIONS: DivisionInfo[] = [
  {
    id: "div-kolhapur",
    code: "KLP-DIV",
    name: "Kolhapur Division",
    state: "Maharashtra",
    headquarters: "Kolhapur",
    districtsCount: 3,
    authoritiesCount: 6,
    status: "ACTIVE",
  },
  {
    id: "div-pune",
    code: "PUN-DIV",
    name: "Pune Division",
    state: "Maharashtra",
    headquarters: "Pune",
    districtsCount: 3,
    authoritiesCount: 8,
    status: "ACTIVE",
  },
  {
    id: "div-mumbai",
    code: "MUM-DIV",
    name: "Mumbai Division",
    state: "Maharashtra",
    headquarters: "Mumbai",
    districtsCount: 3,
    authoritiesCount: 9,
    status: "ACTIVE",
  },
  {
    id: "div-nashik",
    code: "NSK-DIV",
    name: "Nashik Division",
    state: "Maharashtra",
    headquarters: "Nashik",
    districtsCount: 4,
    authoritiesCount: 7,
    status: "ACTIVE",
  },
  {
    id: "div-csambhajinagar",
    code: "CSN-DIV",
    name: "Chhatrapati Sambhajinagar Division",
    state: "Maharashtra",
    headquarters: "Chhatrapati Sambhajinagar",
    districtsCount: 4,
    authoritiesCount: 6,
    status: "ACTIVE",
  },
];

// Configurable Districts
export const INITIAL_DISTRICTS: DistrictInfo[] = [
  // Kolhapur Division
  { id: "dist-kolhapur", code: "DIST-KLP", name: "Kolhapur District", divisionId: "div-kolhapur", authoritiesCount: 2 },
  { id: "dist-sangli", code: "DIST-SGL", name: "Sangli District", divisionId: "div-kolhapur", authoritiesCount: 2 },
  { id: "dist-satara", code: "DIST-STR", name: "Satara District", divisionId: "div-kolhapur", authoritiesCount: 2 },

  // Pune Division
  { id: "dist-pune", code: "DIST-PUN", name: "Pune District", divisionId: "div-pune", authoritiesCount: 3 },
  { id: "dist-solapur", code: "DIST-SOL", name: "Solapur District", divisionId: "div-pune", authoritiesCount: 2 },

  // Mumbai Division
  { id: "dist-mumbai-city", code: "DIST-MMC", name: "Mumbai City District", divisionId: "div-mumbai", authoritiesCount: 1 },
  { id: "dist-mumbai-sub", code: "DIST-MMS", name: "Mumbai Suburban District", divisionId: "div-mumbai", authoritiesCount: 1 },
  { id: "dist-thane", code: "DIST-THN", name: "Thane District", divisionId: "div-mumbai", authoritiesCount: 3 },
];

// Configurable Local Authorities (Municipal Corporations, Councils, ZPs)
export const INITIAL_AUTHORITIES: LocalAuthorityInfo[] = [
  // Kolhapur District
  {
    id: "auth-kmc",
    code: "KMC",
    name: "Kolhapur Municipal Corporation (KMC)",
    type: "MUNICIPAL_CORPORATION",
    districtId: "dist-kolhapur",
    divisionId: "div-kolhapur",
    departmentsCount: 6,
    contactEmail: "commissioner@kmc.gov.in",
    contactPhone: "+91 231 2540291",
  },
  {
    id: "auth-impc",
    code: "IMPC",
    name: "Ichalkaranji Municipal Corporation",
    type: "MUNICIPAL_CORPORATION",
    districtId: "dist-kolhapur",
    divisionId: "div-kolhapur",
    departmentsCount: 5,
    contactEmail: "admin@ichalkaranjimc.gov.in",
  },

  // Pune District
  {
    id: "auth-pmc",
    code: "PMC",
    name: "Pune Municipal Corporation (PMC)",
    type: "MUNICIPAL_CORPORATION",
    districtId: "dist-pune",
    divisionId: "div-pune",
    departmentsCount: 8,
    contactEmail: "commissioner@punecorporation.org",
  },
  {
    id: "auth-pcmc",
    code: "PCMC",
    name: "Pimpri Chinchwad Municipal Corporation",
    type: "MUNICIPAL_CORPORATION",
    districtId: "dist-pune",
    divisionId: "div-pune",
    departmentsCount: 7,
    contactEmail: "info@pcmcindia.gov.in",
  },

  // Mumbai
  {
    id: "auth-bmc",
    code: "BMC",
    name: "Brihanmumbai Municipal Corporation (BMC)",
    type: "MUNICIPAL_CORPORATION",
    districtId: "dist-mumbai-city",
    divisionId: "div-mumbai",
    departmentsCount: 10,
    contactEmail: "mc@mcgm.gov.in",
  },
  {
    id: "auth-tmc",
    code: "TMC",
    name: "Thane Municipal Corporation (TMC)",
    type: "MUNICIPAL_CORPORATION",
    districtId: "dist-thane",
    divisionId: "div-mumbai",
    departmentsCount: 6,
    contactEmail: "commissioner@thanecity.gov.in",
  },
];

// Configurable Departments under Authorities
export const INITIAL_DEPARTMENTS: DepartmentInfo[] = [
  // Under KMC
  {
    id: "dept-kmc-waste",
    code: "KMC-WM",
    name: "Solid Waste Management",
    authorityId: "auth-kmc",
    headOfficerName: "Dr. Vijay Kulkarni",
    categories: ["Solid Waste", "Commercial Dumpster", "Illegal Dumping"],
    activeOfficersCount: 14,
  },
  {
    id: "dept-kmc-water",
    code: "KMC-WS",
    name: "Hydraulics & Water Supply",
    authorityId: "auth-kmc",
    headOfficerName: "Er. Ramesh Deshmukh",
    categories: ["Water Supply", "Pipeline Leakage", "Water Pressure"],
    activeOfficersCount: 11,
  },
  {
    id: "dept-kmc-pwd",
    code: "KMC-PWD",
    name: "Roads & Traffic Infrastructure (PWD)",
    authorityId: "auth-kmc",
    headOfficerName: "Er. Mahesh Gaikwad",
    categories: ["Road Infrastructure", "Potholes", "Traffic Signaling"],
    activeOfficersCount: 9,
  },
  {
    id: "dept-kmc-drainage",
    code: "KMC-SAN",
    name: "Sanitation & Stormwater Drainage",
    authorityId: "auth-kmc",
    headOfficerName: "Er. Rekha Bhosale",
    categories: ["Drainage", "Sewer Overflow", "Manhole Repair"],
    activeOfficersCount: 8,
  },
  {
    id: "dept-kmc-electric",
    code: "KMC-EL",
    name: "Electrical & Street Lighting",
    authorityId: "auth-kmc",
    headOfficerName: "Er. Nitin Jadhav",
    categories: ["Power & Lighting", "Streetlight Outage", "Pole Fault"],
    activeOfficersCount: 7,
  },

  // Under PMC
  {
    id: "dept-pmc-waste",
    code: "PMC-WM",
    name: "Solid Waste & Bio-Sanitation",
    authorityId: "auth-pmc",
    headOfficerName: "Dr. Kunal Patil",
    categories: ["Solid Waste", "Commercial Dumpster", "Bio Hazard"],
    activeOfficersCount: 22,
  },
  {
    id: "dept-pmc-water",
    code: "PMC-WS",
    name: "Water Infrastructure & Pipelines",
    authorityId: "auth-pmc",
    headOfficerName: "Er. Sachin More",
    categories: ["Water Supply", "Pipeline Leakage"],
    activeOfficersCount: 18,
  },
];

// Presets for RBAC Scope Switching (For Testing & Demonstration)
export const JURISDICTION_PRESETS: JurisdictionScope[] = [
  {
    role: "STATE_ADMIN",
    roleTitle: "State Administrator",
    userDisplayName: "Shri. Deepak Kapoor, IAS (State Secretary)",
    badgeId: "MH-SEC-01",
    // No restriction: sees all divisions, districts, authorities
  },
  {
    role: "DIVISION_ADMIN",
    roleTitle: "Division Commissioner",
    userDisplayName: "Smt. Manisha Verma, IAS (Divisional Commissioner)",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    badgeId: "DIV-COMM-KLP",
  },
  {
    role: "DIVISION_ADMIN",
    roleTitle: "Division Commissioner",
    userDisplayName: "Shri. Saurabh Rao, IAS (Divisional Commissioner)",
    divisionId: "div-pune",
    divisionName: "Pune Division",
    badgeId: "DIV-COMM-PUN",
  },
  {
    role: "AUTHORITY_ADMIN",
    roleTitle: "Municipal Commissioner",
    userDisplayName: "Dr. Kadambari Balkawade, IAS (KMC Commissioner)",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    badgeId: "MC-KMC-01",
  },
  {
    role: "AUTHORITY_ADMIN",
    roleTitle: "Municipal Commissioner",
    userDisplayName: "Shri. Vikram Kumar, IAS (PMC Commissioner)",
    divisionId: "div-pune",
    divisionName: "Pune Division",
    districtId: "dist-pune",
    districtName: "Pune District",
    authorityId: "auth-pmc",
    authorityName: "Pune Municipal Corporation (PMC)",
    badgeId: "MC-PMC-01",
  },
  {
    role: "DEPARTMENT_OFFICER",
    roleTitle: "Field Sanitary Inspector",
    userDisplayName: "R. K. Patil (Senior Sanitary Inspector)",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    departmentId: "dept-kmc-waste",
    departmentName: "Solid Waste Management",
    officerId: "off-1",
    badgeId: "OFF-WM-101",
  },
];
