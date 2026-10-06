import { Complaint, ComplaintPriority, ComplaintStatus, RoutingAuditStep } from "@/types/complaint";

export const MOCK_COMPLAINTS: Complaint[] = [
  // Kolhapur Division Complaints (KMC)
  {
    id: "cmp-1",
    trackingNumber: "CMP-1042",
    title: "Garbage accumulation near high school entrance",
    description: "Overflowing commercial dumpster causing traffic and sanitation hazard for students.",
    category: "Solid Waste",
    subcategory: "Commercial Dumpster",
    department: "Solid Waste Management",
    departmentId: "dept-kmc-waste",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    location: "Kolhapur North, Ward 12, Near New High School",
    region: "North Zone",
    coordinates: { lat: 16.7120, lng: 74.2380 },
    status: "ESCALATED",
    priority: "VERY_HIGH",
    assignedOfficer: "R. K. Patil",
    assignedOfficerId: "off-1",
    citizenMobile: "+91 98765 43210",
    citizenName: "Amit Kulkarni",
    date: "2026-10-06",
    createdAt: "Today, 10:45 AM",
    updatedAt: "Today, 11:15 AM",
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 96,
    aiSuggestedCategory: "Solid Waste / School Proximity",
    aiReasoning: "Identified proximity to school zone; escalated to Very High due to acute student hygiene hazard.",
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Kolhapur Division",
        timestamp: "Today, 10:45 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched GPS (16.7120, 74.2380) to Kolhapur Division polygon.",
      },
      {
        level: "LOCAL_AUTHORITY",
        entityName: "Kolhapur Municipal Corporation (KMC)",
        timestamp: "Today, 10:45 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched to Ward 12 Municipal Boundary of KMC.",
      },
      {
        level: "DEPARTMENT",
        entityName: "Solid Waste Management",
        timestamp: "Today, 10:46 AM",
        method: "ADDRESS_NLP",
        details: "NLP classified grievance text to Solid Waste Management.",
      },
      {
        level: "OFFICER",
        entityName: "R. K. Patil (Senior Sanitary Inspector)",
        timestamp: "Today, 10:50 AM",
        method: "WORKLOAD_BALANCER",
        details: "Assigned automatically to lowest active workload inspector in Ward 12.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 10:45 AM",
        note: "Grievance submitted with geo-tagged photo.",
        author: "Citizen (Amit Kulkarni)",
      },
      {
        status: "VALIDATING",
        timestamp: "Today, 10:46 AM",
        note: "AI NLP detected school perimeter zone; urgency escalated.",
        author: "AI Intelligence Engine",
      },
      {
        status: "ASSIGNED",
        timestamp: "Today, 10:50 AM",
        note: "Assigned to Ward 12 Senior Sanitary Inspector R. K. Patil.",
        author: "Auto-Dispatch Pipeline",
      },
      {
        status: "ESCALATED",
        timestamp: "Today, 11:15 AM",
        note: "Citizen flagged non-movement; escalated to Supervisor.",
        author: "System SLA Watchdog",
      },
    ],
  },
  {
    id: "cmp-2",
    trackingNumber: "CMP-1041",
    title: "Major water pipeline rupture on Main Market Road",
    description: "Drinking water pipeline leakage resulting in low pressure across 3 commercial sectors and flooding sidewalks.",
    category: "Water Supply",
    subcategory: "Main Line Burst",
    department: "Hydraulics & Water Supply",
    departmentId: "dept-kmc-water",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    location: "Market Yard Road, Sector 4, Opposite Bank",
    region: "Central Zone",
    coordinates: { lat: 16.7025, lng: 74.2415 },
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedOfficer: "Sunil Deshmukh",
    assignedOfficerId: "off-2",
    citizenMobile: "+91 98223 11445",
    citizenName: "Sanjay Mane",
    date: "2026-10-06",
    createdAt: "Today, 09:15 AM",
    updatedAt: "Today, 10:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 94,
    aiReasoning: "High volume drinking water discharge detected; water wastage risk elevated.",
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Kolhapur Division",
        timestamp: "Today, 09:15 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched GPS to Kolhapur Division.",
      },
      {
        level: "LOCAL_AUTHORITY",
        entityName: "Kolhapur Municipal Corporation (KMC)",
        timestamp: "Today, 09:15 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched to Central Zone KMC Ward 4.",
      },
      {
        level: "DEPARTMENT",
        entityName: "Hydraulics & Water Supply",
        timestamp: "Today, 09:16 AM",
        method: "ADDRESS_NLP",
        details: "Matched to Water Distribution Network.",
      },
      {
        level: "OFFICER",
        entityName: "Sunil Deshmukh",
        timestamp: "Today, 09:20 AM",
        method: "WORKLOAD_BALANCER",
        details: "Assigned to on-duty Hydraulic emergency unit.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 09:15 AM",
        note: "Citizen reported sudden pressurized road leakage.",
        author: "Citizen (Sanjay Mane)",
      },
      {
        status: "ASSIGNED",
        timestamp: "Today, 09:20 AM",
        note: "Hydraulic emergency response team dispatched.",
        author: "Auto-Dispatch Pipeline",
      },
      {
        status: "IN_PROGRESS",
        timestamp: "Today, 10:00 AM",
        note: "Excavation and valve isolation underway by Sunil Deshmukh.",
        author: "Officer (Sunil Deshmukh)",
      },
    ],
  },
  {
    id: "cmp-3",
    trackingNumber: "CMP-1040",
    title: "Deep road pothole near bus terminal junction",
    description: "Monsoon rains created a 2-foot trench causing vehicle tire blowouts and severe traffic congestion.",
    category: "Road Infrastructure",
    subcategory: "Pothole Hazard",
    department: "Roads & Traffic Infrastructure (PWD)",
    departmentId: "dept-kmc-pwd",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    location: "Central Bus Stand, Platform Bay 3 Junction",
    region: "Central Zone",
    coordinates: { lat: 16.7065, lng: 74.2450 },
    status: "ASSIGNED",
    priority: "HIGH",
    assignedOfficer: "Anand Shinde",
    assignedOfficerId: "off-3",
    citizenMobile: "+91 97654 32100",
    citizenName: "Rohan Chavan",
    date: "2026-10-06",
    createdAt: "Today, 08:30 AM",
    updatedAt: "Today, 09:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 89,
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Kolhapur Division",
        timestamp: "Today, 08:30 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched GPS coordinates.",
      },
      {
        level: "LOCAL_AUTHORITY",
        entityName: "Kolhapur Municipal Corporation (KMC)",
        timestamp: "Today, 08:30 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched Central Ward bus terminal sector.",
      },
      {
        level: "DEPARTMENT",
        entityName: "Roads & Traffic Infrastructure (PWD)",
        timestamp: "Today, 08:31 AM",
        method: "ADDRESS_NLP",
        details: "Assigned to PWD division.",
      },
      {
        level: "OFFICER",
        entityName: "Anand Shinde",
        timestamp: "Today, 09:00 AM",
        method: "WORKLOAD_BALANCER",
        details: "Allocated to Anand Shinde.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 08:30 AM",
        note: "Reported with photos of damaged rims.",
        author: "Citizen (Rohan Chavan)",
      },
      {
        status: "ASSIGNED",
        timestamp: "Today, 09:00 AM",
        note: "Assigned to PWD patch contractor supervisor Anand Shinde.",
        author: "Auto-Dispatch Pipeline",
      },
    ],
  },
  {
    id: "cmp-4",
    trackingNumber: "CMP-1039",
    title: "Streetlight series offline along residential ring road",
    description: "12 consecutive sodium streetlights failing to turn on since yesterday night, creating dark safety hazard.",
    category: "Power & Lighting",
    subcategory: "Streetlight Outage",
    department: "Electrical & Street Lighting",
    departmentId: "dept-kmc-electric",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    location: "Shivaji Park Ring Road, Outer Curve",
    region: "East Zone",
    coordinates: { lat: 16.6980, lng: 74.2510 },
    status: "VALIDATING",
    priority: "MEDIUM",
    assignedOfficer: "Vikram Gaikwad",
    assignedOfficerId: "off-5",
    citizenMobile: "+91 99881 22334",
    citizenName: "Priyanka Naik",
    date: "2026-10-05",
    createdAt: "Yesterday, 07:30 PM",
    updatedAt: "Today, 08:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 91,
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Kolhapur Division",
        timestamp: "Yesterday, 07:30 PM",
        method: "AI_GEO_POLYGON",
        details: "Matched GPS.",
      },
      {
        level: "LOCAL_AUTHORITY",
        entityName: "Kolhapur Municipal Corporation (KMC)",
        timestamp: "Yesterday, 07:30 PM",
        method: "AI_GEO_POLYGON",
        details: "Matched Shivaji Park East Ward.",
      },
      {
        level: "DEPARTMENT",
        entityName: "Electrical & Street Lighting",
        timestamp: "Yesterday, 07:31 PM",
        method: "ADDRESS_NLP",
        details: "Auto-routed to Electrical Dept.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Yesterday, 07:30 PM",
        note: "Citizen reported dark sector.",
        author: "Citizen (Priyanka Naik)",
      },
      {
        status: "VALIDATING",
        timestamp: "Today, 08:00 AM",
        note: "Verifying junction transformer circuit logs.",
        author: "AI Electrical Diagnostic",
      },
    ],
  },
  {
    id: "cmp-5",
    trackingNumber: "CMP-1038",
    title: "Underground stormwater drain blockage overflow",
    description: "Sewage overflow reaching pedestrian sidewalk during moderate rainfall with foul odor.",
    category: "Drainage",
    subcategory: "Sewer Overflow",
    department: "Sanitation & Stormwater Drainage",
    departmentId: "dept-kmc-drainage",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    location: "Shahupuri 3rd Lane, Near Vegetable Market",
    region: "South Zone",
    coordinates: { lat: 16.7010, lng: 74.2390 },
    status: "CITIZEN_VERIFICATION",
    priority: "MEDIUM",
    assignedOfficer: "Pooja Jadhav",
    assignedOfficerId: "off-4",
    citizenMobile: "+91 98112 33445",
    citizenName: "Mahesh Joshi",
    date: "2026-10-05",
    createdAt: "Yesterday, 02:15 PM",
    updatedAt: "Today, 09:30 AM",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 93,
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Kolhapur Division",
        timestamp: "Yesterday, 02:15 PM",
        method: "AI_GEO_POLYGON",
        details: "Matched GPS.",
      },
      {
        level: "LOCAL_AUTHORITY",
        entityName: "Kolhapur Municipal Corporation (KMC)",
        timestamp: "Yesterday, 02:15 PM",
        method: "AI_GEO_POLYGON",
        details: "Matched Shahupuri Ward.",
      },
      {
        level: "DEPARTMENT",
        entityName: "Sanitation & Stormwater Drainage",
        timestamp: "Yesterday, 02:16 PM",
        method: "ADDRESS_NLP",
        details: "Matched to Drainage division.",
      },
      {
        level: "OFFICER",
        entityName: "Pooja Jadhav",
        timestamp: "Yesterday, 02:20 PM",
        method: "WORKLOAD_BALANCER",
        details: "Dispatched to Pooja Jadhav.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Yesterday, 02:15 PM",
        note: "Grievance received.",
        author: "Citizen (Mahesh Joshi)",
      },
      {
        status: "IN_PROGRESS",
        timestamp: "Yesterday, 04:00 PM",
        note: "Suction jetting vehicle deployed.",
        author: "Officer (Pooja Jadhav)",
      },
      {
        status: "CITIZEN_VERIFICATION",
        timestamp: "Today, 09:30 AM",
        note: "Drain line cleared; OTP sent to citizen for resolution confirmation.",
        author: "Field Team",
      },
    ],
  },

  // Pune Division Complaints (PMC)
  {
    id: "cmp-10",
    trackingNumber: "CMP-2001",
    title: "Bio-medical waste mixed with municipal bins in Kothrud",
    description: "Private clinic disposing hazardous syringes and waste in open public corner bin.",
    category: "Solid Waste",
    subcategory: "Bio Hazard",
    department: "Solid Waste & Bio-Sanitation",
    departmentId: "dept-pmc-waste",
    authorityId: "auth-pmc",
    authorityName: "Pune Municipal Corporation (PMC)",
    districtId: "dist-pune",
    districtName: "Pune District",
    divisionId: "div-pune",
    divisionName: "Pune Division",
    location: "Kothrud, Near MIT College Road, Pune",
    region: "Kothrud Ward",
    coordinates: { lat: 18.5074, lng: 73.8077 },
    status: "IN_PROGRESS",
    priority: "VERY_HIGH",
    assignedOfficer: "Kunal Tambe",
    assignedOfficerId: "off-7",
    citizenMobile: "+91 98220 77112",
    citizenName: "Dr. Nilesh Gore",
    date: "2026-10-06",
    createdAt: "Today, 08:00 AM",
    updatedAt: "Today, 09:15 AM",
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 98,
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Pune Division",
        timestamp: "Today, 08:00 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched GPS (18.5074, 73.8077) to Pune Division boundaries.",
      },
      {
        level: "LOCAL_AUTHORITY",
        entityName: "Pune Municipal Corporation (PMC)",
        timestamp: "Today, 08:00 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched to PMC Kothrud-Bavdhan Ward Office.",
      },
      {
        level: "DEPARTMENT",
        entityName: "Solid Waste & Bio-Sanitation",
        timestamp: "Today, 08:01 AM",
        method: "ADDRESS_NLP",
        details: "AI identified Bio-Medical Waste hazardous violation.",
      },
      {
        level: "OFFICER",
        entityName: "Kunal Tambe",
        timestamp: "Today, 08:10 AM",
        method: "WORKLOAD_BALANCER",
        details: "Auto-dispatched to Zonal Bio-Sanitation Officer.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 08:00 AM",
        note: "Submitted with photographic evidence.",
        author: "Citizen (Dr. Nilesh Gore)",
      },
      {
        status: "IN_PROGRESS",
        timestamp: "Today, 09:15 AM",
        note: "Notice issued to clinic and bio-waste vehicle deployed.",
        author: "Officer (Kunal Tambe)",
      },
    ],
  },
  {
    id: "cmp-11",
    trackingNumber: "CMP-2002",
    title: "Drinking water main supply contamination in Shivajinagar",
    description: "Muddy and foul smelling tap water reported across 5 residential societies.",
    category: "Water Supply",
    subcategory: "Contamination",
    department: "Water Infrastructure & Pipelines",
    departmentId: "dept-pmc-water",
    authorityId: "auth-pmc",
    authorityName: "Pune Municipal Corporation (PMC)",
    districtId: "dist-pune",
    districtName: "Pune District",
    divisionId: "div-pune",
    divisionName: "Pune Division",
    location: "Shivajinagar, Model Colony Road, Pune",
    region: "Shivajinagar Ward",
    coordinates: { lat: 18.5314, lng: 73.8446 },
    status: "ASSIGNED",
    priority: "VERY_HIGH",
    assignedOfficer: "Aditi Rao",
    assignedOfficerId: "off-8",
    citizenMobile: "+91 98225 33441",
    citizenName: "Sneha Mehta",
    date: "2026-10-06",
    createdAt: "Today, 07:15 AM",
    updatedAt: "Today, 08:30 AM",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 95,
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Pune Division",
        timestamp: "Today, 07:15 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched GPS to Pune Division.",
      },
      {
        level: "LOCAL_AUTHORITY",
        entityName: "Pune Municipal Corporation (PMC)",
        timestamp: "Today, 07:15 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched to Shivajinagar Ward Office.",
      },
      {
        level: "DEPARTMENT",
        entityName: "Water Infrastructure & Pipelines",
        timestamp: "Today, 07:16 AM",
        method: "ADDRESS_NLP",
        details: "High priority contamination flag.",
      },
      {
        level: "OFFICER",
        entityName: "Aditi Rao",
        timestamp: "Today, 08:30 AM",
        method: "WORKLOAD_BALANCER",
        details: "Dispatched to Hydraulic Maintenance Engineer.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 07:15 AM",
        note: "Submitted with water sample video.",
        author: "Citizen (Sneha Mehta)",
      },
      {
        status: "ASSIGNED",
        timestamp: "Today, 08:30 AM",
        note: "Sampling team deployed for residual chlorine test.",
        author: "Auto-Dispatch Pipeline",
      },
    ],
  },
];

export async function getComplaints(filters?: {
  divisionId?: string;
  districtId?: string;
  authorityId?: string;
  departmentId?: string;
  officerId?: string;
  priority?: string;
  status?: string;
  category?: string;
  region?: string;
  search?: string;
}): Promise<Complaint[]> {
  let list = [...MOCK_COMPLAINTS];

  if (!filters) return list;

  if (filters.divisionId && filters.divisionId !== "ALL") {
    list = list.filter((c) => c.divisionId === filters.divisionId);
  }
  if (filters.districtId && filters.districtId !== "ALL") {
    list = list.filter((c) => c.districtId === filters.districtId);
  }
  if (filters.authorityId && filters.authorityId !== "ALL") {
    list = list.filter((c) => c.authorityId === filters.authorityId);
  }
  if (filters.departmentId && filters.departmentId !== "ALL") {
    list = list.filter((c) => c.departmentId === filters.departmentId);
  }
  if (filters.officerId && filters.officerId !== "ALL") {
    list = list.filter((c) => c.assignedOfficerId === filters.officerId);
  }
  if (filters.priority && filters.priority !== "ALL") {
    list = list.filter((c) => c.priority === filters.priority);
  }
  if (filters.status && filters.status !== "ALL") {
    list = list.filter((c) => c.status === filters.status);
  }
  if (filters.category && filters.category !== "ALL") {
    list = list.filter((c) => c.category === filters.category);
  }
  if (filters.region && filters.region !== "ALL") {
    list = list.filter((c) => c.region === filters.region);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.trackingNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.citizenMobile.includes(q) ||
        c.divisionName.toLowerCase().includes(q) ||
        c.authorityName.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function reassignComplaintOfficer(
  complaintId: string,
  officerId: string,
  officerName: string
): Promise<boolean> {
  const item = MOCK_COMPLAINTS.find((c) => c.id === complaintId);
  if (item) {
    item.assignedOfficer = officerName;
    item.assignedOfficerId = officerId;
    item.status = "ASSIGNED";
    item.timeline.push({
      status: "ASSIGNED",
      timestamp: "Just now",
      note: `Reassigned to Officer ${officerName} by Administrative Supervisor.`,
      author: "Admin Supervisor",
    });
    item.routingAuditTrail.push({
      level: "OFFICER",
      entityName: officerName,
      timestamp: "Just now",
      method: "ADMIN_OVERRIDE",
      details: `Reassigned by Administrative Supervisor from prior allocation.`,
    });
    return true;
  }
  return false;
}

export async function submitOfficerResolution(
  complaintId: string,
  imageUrl: string,
  remarks: string,
  officerName: string
): Promise<boolean> {
  const item = MOCK_COMPLAINTS.find((c) => c.id === complaintId);
  if (item) {
    item.status = "RESOLVED";
    item.resolutionEvidence = {
      imageUrl,
      remarks,
      uploadedAt: "Just now",
      uploadedBy: officerName,
      inspectionPassed: true,
    };
    item.timeline.push({
      status: "RESOLVED",
      timestamp: "Just now",
      note: `Field work completed by Officer ${officerName}. Resolution photo & sign-off submitted. Remarks: "${remarks}"`,
      author: `Officer (${officerName})`,
    });
    return true;
  }
  return false;
}
