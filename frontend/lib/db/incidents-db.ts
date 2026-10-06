/**
 * CivicResolve Incident Database & Relational Repository
 *
 * Implements the relational structure:
 * Master Incident (1) ───< Supporting Citizen Complaints (N)
 *
 * All dashboard metrics are dynamically computed from this store.
 * Never hardcodes counts.
 */

import {
  MasterIncident,
  CitizenReport,
  DashboardStats,
  IncidentFilterParams,
  MapIncidentItem,
  MapClusterItem,
  MapHotspotItem,
} from "@/types/incident";
import { Complaint, ComplaintPriority, ComplaintStatus } from "@/types/complaint";
import {
  evaluateReportMatch,
  recalculateIncidentPriority,
  calculateHaversineDistance,
} from "@/lib/clustering/clustering-engine";
import { INITIAL_DIVISIONS, INITIAL_AUTHORITIES, INITIAL_DEPARTMENTS } from "@/lib/api/hierarchy";

const STORAGE_KEY = "civicresolve_incidents_db_v1";

// 25 Citizen supporting reports generator for Kolhapur Ward 12 garbage crisis
function generateKolhapur25Reports(): CitizenReport[] {
  const citizenNames = [
    "Amit Kulkarni", "Sunita Patil", "Ramesh Jadhav", "Priya Deshmukh",
    "Ganesh Shinde", "Anjali More", "Sanjay Chavan", "Kavita Gaikwad",
    "Mahesh Joshi", "Snehal Kamble", "Sachin Bhosale", "Pooja Sawant",
    "Vikas Salunkhe", "Deepali Pawar", "Ajay Thorat", "Meena Kadam",
    "Nitin Mane", "Rekha Sonawane", "Santosh Mohite", "Swati Nalawade",
    "Prashant Jagtap", "Varsha Kale", "Dinesh Ghorpade", "Ashwini Shirodkar",
    "Rahul Deshpande"
  ];

  const channels: CitizenReport["channel"][] = [
    "MOBILE_APP", "MOBILE_APP", "WEB_PORTAL", "WHATSAPP", "MOBILE_APP",
    "TOLL_FREE_1916", "MOBILE_APP", "WHATSAPP", "MOBILE_APP", "WEB_PORTAL",
    "MOBILE_APP", "WHATSAPP", "MOBILE_APP", "MOBILE_APP", "TOLL_FREE_1916",
    "WEB_PORTAL", "MOBILE_APP", "WHATSAPP", "MOBILE_APP", "MOBILE_APP",
    "WEB_PORTAL", "MOBILE_APP", "WHATSAPP", "MOBILE_APP", "MOBILE_APP"
  ];

  const times = [
    "06:30 AM", "06:45 AM", "07:10 AM", "07:25 AM", "07:40 AM",
    "08:00 AM", "08:15 AM", "08:30 AM", "08:42 AM", "09:00 AM",
    "09:15 AM", "09:28 AM", "09:40 AM", "09:55 AM", "10:05 AM",
    "10:18 AM", "10:30 AM", "10:45 AM", "11:00 AM", "11:12 AM",
    "11:25 AM", "11:38 AM", "11:50 AM", "12:05 PM", "12:20 PM"
  ];

  const baseLat = 16.7120;
  const baseLng = 74.2380;

  return citizenNames.map((name, idx) => {
    // Minor micro-variations in coordinates within 100 meters
    const offsetLat = (Math.sin(idx * 1.5) * 0.0004);
    const offsetLng = (Math.cos(idx * 1.5) * 0.0004);

    return {
      id: `cmp-rep-${1000 + idx}`,
      trackingNumber: `CMP-1042-${String(idx + 1).padStart(2, "0")}`,
      citizenName: name,
      citizenMobile: `+91 ${9822000000 + idx * 37}`,
      description: idx === 0
        ? "Overflowing commercial dumpster causing traffic and sanitation hazard for students at High School entrance."
        : `Citizen report #${idx + 1}: Unbearable odor and street blockage due to garbage dump near New High School gate.`,
      location: "Kolhapur North, Ward 12, Near New High School",
      coordinates: { lat: baseLat + offsetLat, lng: baseLng + offsetLng },
      reportedAt: `Today, ${times[idx]}`,
      timestamp: Date.now() - (25 - idx) * 15 * 60 * 1000,
      channel: channels[idx],
      aiConfidence: 94 + (idx % 5),
    };
  });
}

// Initial Seed Data: Realistic Maharashtra Incidents with Clustered Supporting Reports
const INITIAL_INCIDENTS: MasterIncident[] = [
  // 1. Master Incident 1: 25 Citizen Reports (Kolhapur Garbage Problem)
  {
    id: "inc-1042",
    incidentNumber: "INC-2026-1042",
    title: "Overflowing commercial garbage dump at New High School entrance",
    description: "Multi-citizen reported garbage accumulation spilling onto school entryway and pedestrian walkway. 25 neighborhood reports clustered.",
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
    priority: "VERY_HIGH", // Auto-escalated due to 25 reports
    assignedOfficer: "R. K. Patil",
    assignedOfficerId: "off-1",
    complaintCount: 25,
    supportingReports: generateKolhapur25Reports(),
    firstReportedAt: "Today, 06:30 AM",
    lastReportedAt: "Today, 12:20 PM",
    createdAtTimestamp: Date.now() - 6 * 3600 * 1000,
    lastReportedTimestamp: Date.now() - 30 * 60 * 1000,
    slaHours: 4,
    slaDeadline: "Today, 02:30 PM",
    slaRemainingMinutes: -45, // Breached
    isSlaBreached: true,
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 98,
    aiSuggestedCategory: "Solid Waste / School Proximity",
    aiReasoning: "Clustered 25 concurrent citizen complaints in 400m radius. Priority elevated to VERY_HIGH due to child health hazard.",
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Kolhapur Division",
        timestamp: "Today, 06:30 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched GPS to Kolhapur Division polygon.",
      },
      {
        level: "LOCAL_AUTHORITY",
        entityName: "Kolhapur Municipal Corporation (KMC)",
        timestamp: "Today, 06:30 AM",
        method: "AI_GEO_POLYGON",
        details: "Matched to Ward 12 Municipal Boundary of KMC.",
      },
      {
        level: "DEPARTMENT",
        entityName: "Solid Waste Management",
        timestamp: "Today, 06:31 AM",
        method: "ADDRESS_NLP",
        details: "Classified to Solid Waste Department.",
      },
      {
        level: "OFFICER",
        entityName: "R. K. Patil",
        timestamp: "Today, 07:00 AM",
        method: "WORKLOAD_BALANCER",
        details: "Assigned to Ward 12 Sanitary Inspector R. K. Patil.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 06:30 AM",
        note: "Master Incident created from first citizen report (Amit Kulkarni).",
        author: "Citizen (Amit Kulkarni)",
      },
      {
        status: "ASSIGNED",
        timestamp: "Today, 07:00 AM",
        note: "Assigned to Officer R. K. Patil. Dynamic clustering active.",
        author: "Auto-Dispatch Pipeline",
      },
      {
        status: "ESCALATED",
        timestamp: "Today, 10:30 AM",
        note: "Surge reached 15+ citizen reports. SLA Watchdog auto-escalated priority to VERY_HIGH.",
        author: "Clustering & SLA Engine",
      },
      {
        status: "ESCALATED",
        timestamp: "Today, 12:20 PM",
        note: "Latest report #25 linked from citizen Rahul Deshpande. Active complaintCount = 25.",
        author: "Real-time Clustering Engine",
      },
    ],
  },

  // 2. Master Incident 2: 14 Citizen Reports (Kolhapur Water Pipeline Burst)
  {
    id: "inc-1041",
    incidentNumber: "INC-2026-1041",
    title: "Major water pipeline rupture on Main Market Road",
    description: "Drinking water trunk pipeline leakage flooding market roadway and affecting water supply across sectors.",
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
    location: "Main Market Road, Sector 4, Opposite Laxmi Temple",
    region: "Central Zone",
    coordinates: { lat: 16.7050, lng: 74.2420 },
    status: "IN_PROGRESS",
    priority: "VERY_HIGH",
    assignedOfficer: "Suresh S. Mane",
    assignedOfficerId: "off-2",
    complaintCount: 14,
    supportingReports: [
      {
        id: "cmp-rep-201",
        trackingNumber: "CMP-1041-01",
        citizenName: "Santosh Shinde",
        citizenMobile: "+91 98221 44551",
        description: "Water pipeline cracked near shop #14, water gushing onto sidewalk.",
        location: "Main Market Road, Shop 14",
        coordinates: { lat: 16.7050, lng: 74.2420 },
        reportedAt: "Today, 08:15 AM",
        timestamp: Date.now() - 4 * 3600 * 1000,
        channel: "MOBILE_APP",
      },
      {
        id: "cmp-rep-202",
        trackingNumber: "CMP-1041-02",
        citizenName: "Deepak Sutar",
        citizenMobile: "+91 98221 44552",
        description: "Entire Laxmi temple chowk flooded with potable water.",
        location: "Opposite Laxmi Temple",
        coordinates: { lat: 16.7052, lng: 74.2423 },
        reportedAt: "Today, 08:30 AM",
        timestamp: Date.now() - 3.7 * 3600 * 1000,
        channel: "WHATSAPP",
      },
      ...Array.from({ length: 12 }).map((_, i) => ({
        id: `cmp-rep-${203 + i}`,
        trackingNumber: `CMP-1041-${String(i + 3).padStart(2, "0")}`,
        citizenName: `Citizen Verified ${i + 3}`,
        citizenMobile: `+91 ${9822144553 + i}`,
        description: `Drinking water supply cut off and road submersed near Market Sector 4.`,
        location: `Main Market Road, Block ${String.fromCharCode(65 + i)}`,
        coordinates: { lat: 16.7050 + (i * 0.0001), lng: 74.2420 + (i * 0.0001) },
        reportedAt: `Today, ${9 + Math.floor(i / 4)}:${(i * 12) % 60} AM`,
        timestamp: Date.now() - (3 - i * 0.15) * 3600 * 1000,
        channel: "MOBILE_APP" as const,
      })),
    ],
    firstReportedAt: "Today, 08:15 AM",
    lastReportedAt: "Today, 11:45 AM",
    createdAtTimestamp: Date.now() - 4.5 * 3600 * 1000,
    lastReportedTimestamp: Date.now() - 1.2 * 3600 * 1000,
    slaHours: 6,
    slaDeadline: "Today, 02:15 PM",
    slaRemainingMinutes: 80,
    isSlaBreached: false,
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 97,
    aiSuggestedCategory: "Hydraulics / Water Rupture",
    aiReasoning: "Clustered 14 citizen reports into single emergency repair ticket.",
    routingAuditTrail: [],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 08:15 AM",
        note: "Initial water line burst reported.",
        author: "Citizen (Santosh Shinde)",
      },
      {
        status: "ASSIGNED",
        timestamp: "Today, 08:25 AM",
        note: "Dispatched hydraulic crew under Suresh S. Mane.",
        author: "Disaster Cell",
      },
      {
        status: "IN_PROGRESS",
        timestamp: "Today, 09:10 AM",
        note: "Isolation valves shut; excavation team on-site.",
        author: "Officer (Suresh S. Mane)",
      },
    ],
  },

  // 3. Master Incident 3: 9 Citizen Reports (Pune Roads / Potholes)
  {
    id: "inc-1040",
    incidentNumber: "INC-2026-1040",
    title: "Dangerous pothole cluster and sunken manhole on Paud Road",
    description: "Multiple severe potholes causing vehicular accidents and severe traffic bottleneck during peak hours.",
    category: "Roads & Traffic",
    subcategory: "Pothole Cluster",
    department: "Road Maintenance & Infrastructure",
    departmentId: "dept-pmc-roads",
    authorityId: "auth-pmc",
    authorityName: "Pune Municipal Corporation (PMC)",
    districtId: "dist-pune",
    districtName: "Pune District",
    divisionId: "div-pune",
    divisionName: "Pune Division",
    location: "Kothrud, Paud Road, Near Vanaz Metro Station",
    region: "West Zone",
    coordinates: { lat: 18.5074, lng: 73.8077 },
    status: "ASSIGNED",
    priority: "HIGH",
    assignedOfficer: "V. N. Deshmukh",
    assignedOfficerId: "off-4",
    complaintCount: 9,
    supportingReports: Array.from({ length: 9 }).map((_, i) => ({
      id: `cmp-rep-${301 + i}`,
      trackingNumber: `CMP-1040-${String(i + 1).padStart(2, "0")}`,
      citizenName: `Pune Commuter ${i + 1}`,
      citizenMobile: `+91 ${9822300000 + i}`,
      description: `Large pothole deep enough to damage two-wheelers outside Vanaz station pillar #${120 + i}.`,
      location: `Kothrud, Paud Road, Pillar ${120 + i}`,
      coordinates: { lat: 18.5074 + i * 0.0001, lng: 73.8077 - i * 0.0001 },
      reportedAt: `Yesterday, ${4 + i}:30 PM`,
      timestamp: Date.now() - (18 - i) * 3600 * 1000,
      channel: "MOBILE_APP",
    })),
    firstReportedAt: "Yesterday, 04:30 PM",
    lastReportedAt: "Today, 09:30 AM",
    createdAtTimestamp: Date.now() - 20 * 3600 * 1000,
    lastReportedTimestamp: Date.now() - 3.5 * 3600 * 1000,
    slaHours: 12,
    slaDeadline: "Today, 04:30 AM",
    slaRemainingMinutes: -310,
    isSlaBreached: true,
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    aiConfidence: 95,
    aiSuggestedCategory: "Road Hazard",
    aiReasoning: "Clustered 9 citizen commuter complaints on arterial metro corridor.",
    routingAuditTrail: [],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Yesterday, 04:30 PM",
        note: "Incident logged by commuters.",
        author: "Citizen Portal",
      },
      {
        status: "ASSIGNED",
        timestamp: "Yesterday, 05:15 PM",
        note: "Assigned to Road Maintenance Officer V. N. Deshmukh.",
        author: "PMC Works Dept",
      },
    ],
  },

  // 4. Master Incident 4: 6 Citizen Reports (Pune Drainage Overflow)
  {
    id: "inc-1039",
    incidentNumber: "INC-2026-1039",
    title: "Sewage inspection chamber overflowing on Swargate link road",
    description: "Raw sewage spilling onto pedestrian lane causing hazardous foul stench.",
    category: "Drainage & Sewerage",
    subcategory: "Chamber Overflow",
    department: "Drainage & Sewerage",
    departmentId: "dept-pmc-drainage",
    authorityId: "auth-pmc",
    authorityName: "Pune Municipal Corporation (PMC)",
    districtId: "dist-pune",
    districtName: "Pune District",
    divisionId: "div-pune",
    divisionName: "Pune Division",
    location: "Swargate Chowk, Near Bus Depot Exit",
    region: "South Zone",
    coordinates: { lat: 18.5018, lng: 73.8586 },
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedOfficer: "Anil K. Shinde",
    assignedOfficerId: "off-5",
    complaintCount: 6,
    supportingReports: Array.from({ length: 6 }).map((_, i) => ({
      id: `cmp-rep-${401 + i}`,
      trackingNumber: `CMP-1039-${String(i + 1).padStart(2, "0")}`,
      citizenName: `Swargate Citizen ${i + 1}`,
      citizenMobile: `+91 ${9822400000 + i}`,
      description: `Drainage blockage outside depot exit creating puddle and smell.`,
      location: `Swargate Bus Depot Gate ${i + 1}`,
      coordinates: { lat: 18.5018 + i * 0.0001, lng: 73.8586 },
      reportedAt: `Today, 07:${10 + i * 15} AM`,
      timestamp: Date.now() - (5 - i * 0.5) * 3600 * 1000,
      channel: "WHATSAPP",
    })),
    firstReportedAt: "Today, 07:10 AM",
    lastReportedAt: "Today, 08:25 AM",
    createdAtTimestamp: Date.now() - 5.5 * 3600 * 1000,
    lastReportedTimestamp: Date.now() - 4.5 * 3600 * 1000,
    slaHours: 8,
    slaDeadline: "Today, 03:10 PM",
    slaRemainingMinutes: 140,
    isSlaBreached: false,
    aiConfidence: 93,
    aiSuggestedCategory: "Sanitation & Drainage",
    aiReasoning: "Clustered 6 citizen notifications into single suction machine dispatch.",
    routingAuditTrail: [],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 07:10 AM",
        note: "Chamber overflow reported.",
        author: "Citizen (WhatsApp)",
      },
      {
        status: "IN_PROGRESS",
        timestamp: "Today, 08:30 AM",
        note: "Jetting machine vehicle JET-04 dispatched to site.",
        author: "PMC Drainage Inspector",
      },
    ],
  },

  // 5. Master Incident 5: 18 Citizen Reports (Mumbai Solid Waste)
  {
    id: "inc-1038",
    incidentNumber: "INC-2026-1038",
    title: "Massive illegal construction debris dumping along railway boundary",
    description: "Truckloads of plaster and rubble dumped along Dadar East railway boundary blocking stormwater culvert.",
    category: "Solid Waste",
    subcategory: "Construction Waste",
    department: "Solid Waste Management",
    departmentId: "dept-mcgm-waste",
    authorityId: "auth-mcgm",
    authorityName: "Brihanmumbai Municipal Corporation (BMC/MCGM)",
    districtId: "dist-mumbai",
    districtName: "Mumbai City District",
    divisionId: "div-mumbai",
    divisionName: "Mumbai Division",
    location: "Dadar East, Near Flyover Pier 14, Senapati Bapat Marg",
    region: "Island City Zone",
    coordinates: { lat: 19.0178, lng: 72.8478 },
    status: "ASSIGNED",
    priority: "VERY_HIGH",
    assignedOfficer: "P. R. Shinde",
    assignedOfficerId: "off-6",
    complaintCount: 18,
    supportingReports: Array.from({ length: 18 }).map((_, i) => ({
      id: `cmp-rep-${501 + i}`,
      trackingNumber: `CMP-1038-${String(i + 1).padStart(2, "0")}`,
      citizenName: `Dadar Resident ${i + 1}`,
      citizenMobile: `+91 ${9822500000 + i}`,
      description: `Rubble dump blocking water outlet near Flyover Pier 14.`,
      location: `Dadar East, Pier 14, Bapat Marg`,
      coordinates: { lat: 19.0178 + i * 0.0001, lng: 72.8478 },
      reportedAt: `Yesterday, 08:${15 + (i * 10) % 45} PM`,
      timestamp: Date.now() - (16 - i * 0.5) * 3600 * 1000,
      channel: "MOBILE_APP",
    })),
    firstReportedAt: "Yesterday, 08:15 PM",
    lastReportedAt: "Today, 07:45 AM",
    createdAtTimestamp: Date.now() - 16 * 3600 * 1000,
    lastReportedTimestamp: Date.now() - 5 * 3600 * 1000,
    slaHours: 12,
    slaDeadline: "Today, 08:15 AM",
    slaRemainingMinutes: -240,
    isSlaBreached: true,
    aiConfidence: 96,
    aiSuggestedCategory: "C&D Waste Dumping",
    aiReasoning: "Clustered 18 citizen alerts in Dadar flyover perimeter.",
    routingAuditTrail: [],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Yesterday, 08:15 PM",
        note: "Debris dumping detected.",
        author: "Citizen Intake",
      },
      {
        status: "ASSIGNED",
        timestamp: "Yesterday, 09:00 PM",
        note: "Assigned to BMC Ward G/North Squad.",
        author: "BMC Control Room",
      },
    ],
  },

  // 6. Master Incident 6: 4 Citizen Reports (Nashik Streetlights)
  {
    id: "inc-1037",
    incidentNumber: "INC-2026-1037",
    title: "Blackout of consecutive streetlights on Godavari Ghat walkway",
    description: "Series of 8 LED streetlamps non-functional creating public safety concerns along pilgrim route.",
    category: "Electrical & Lighting",
    subcategory: "Streetlight Cluster",
    department: "Electrical & Street Lighting",
    departmentId: "dept-nmc-electrical",
    authorityId: "auth-nmc",
    authorityName: "Nashik Municipal Corporation (NMC)",
    districtId: "dist-nashik",
    districtName: "Nashik District",
    divisionId: "div-nashik",
    divisionName: "Nashik Division",
    location: "Panchavati, Ramkund Walkway, Pillar 1 to 8",
    region: "Panchavati Zone",
    coordinates: { lat: 20.0063, lng: 73.7903 },
    status: "SUBMITTED",
    priority: "MEDIUM",
    complaintCount: 4,
    supportingReports: Array.from({ length: 4 }).map((_, i) => ({
      id: `cmp-rep-${601 + i}`,
      trackingNumber: `CMP-1037-${String(i + 1).padStart(2, "0")}`,
      citizenName: `Nashik Visitor ${i + 1}`,
      citizenMobile: `+91 ${9822600000 + i}`,
      description: `Darkness on pilgrim path, streetlights off.`,
      location: `Panchavati Ramkund Pillar ${i + 1}`,
      coordinates: { lat: 20.0063 + i * 0.0001, lng: 73.7903 },
      reportedAt: `Today, 05:30 AM`,
      timestamp: Date.now() - 7 * 3600 * 1000,
      channel: "TOLL_FREE_1916",
    })),
    firstReportedAt: "Today, 05:30 AM",
    lastReportedAt: "Today, 06:45 AM",
    createdAtTimestamp: Date.now() - 7 * 3600 * 1000,
    lastReportedTimestamp: Date.now() - 6 * 3600 * 1000,
    slaHours: 24,
    slaDeadline: "Tomorrow, 05:30 AM",
    slaRemainingMinutes: 1020,
    isSlaBreached: false,
    aiConfidence: 91,
    aiSuggestedCategory: "Public Illumination",
    aiReasoning: "Clustered 4 early-morning pilgrim reports.",
    routingAuditTrail: [],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 05:30 AM",
        note: "Toll-free 1916 calls clustered.",
        author: "Citizen Hotline 1916",
      },
    ],
  },

  // 7. Master Incident 7: 1 Citizen Report (New Unassigned Issue in Kolhapur)
  {
    id: "inc-1036",
    incidentNumber: "INC-2026-1036",
    title: "Broken pavement slab with exposed iron rebar near bus stop",
    description: "Pedestrian footpath slab cracked with sharp iron rebars posing tripping danger.",
    category: "Roads & Traffic",
    subcategory: "Footpath Damage",
    department: "Road Maintenance & Infrastructure",
    departmentId: "dept-kmc-roads",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    location: "Rajarampuri 2nd Lane, City Bus Stop",
    region: "East Zone",
    coordinates: { lat: 16.6980, lng: 74.2510 },
    status: "SUBMITTED",
    priority: "MEDIUM",
    complaintCount: 1,
    supportingReports: [
      {
        id: "cmp-rep-701",
        trackingNumber: "CMP-1036-01",
        citizenName: "Tanaji Kadam",
        citizenMobile: "+91 98227 11223",
        description: "Footpath slab broke under passenger foot, iron bars sticking out.",
        location: "Rajarampuri 2nd Lane Bus Stop",
        coordinates: { lat: 16.6980, lng: 74.2510 },
        reportedAt: "Today, 11:10 AM",
        timestamp: Date.now() - 1.5 * 3600 * 1000,
        channel: "MOBILE_APP",
      },
    ],
    firstReportedAt: "Today, 11:10 AM",
    lastReportedAt: "Today, 11:10 AM",
    createdAtTimestamp: Date.now() - 1.5 * 3600 * 1000,
    lastReportedTimestamp: Date.now() - 1.5 * 3600 * 1000,
    slaHours: 24,
    slaDeadline: "Tomorrow, 11:10 AM",
    slaRemainingMinutes: 1350,
    isSlaBreached: false,
    aiConfidence: 92,
    aiSuggestedCategory: "Pedestrian Safety",
    aiReasoning: "Single report logged, auto-queued for inspector allocation.",
    routingAuditTrail: [],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Today, 11:10 AM",
        note: "Grievance received from citizen Tanaji Kadam.",
        author: "Citizen Mobile App",
      },
    ],
  },

  // 8. Master Incident 8: 5 Citizen Reports (Resolved with Verification)
  {
    id: "inc-1035",
    incidentNumber: "INC-2026-1035",
    title: "Fallen tree branch obstructing dual carriageway cleared",
    description: "Storm caused heavy banyan limb to block roadway near Shivaji University Gate.",
    category: "Garden & Trees",
    subcategory: "Tree Fall Emergency",
    department: "Parks & Urban Forestry",
    departmentId: "dept-kmc-gardens",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    location: "Vidyanagar, Outside Shivaji University Main Arch",
    region: "South Zone",
    coordinates: { lat: 16.6770, lng: 74.2540 },
    status: "RESOLVED",
    priority: "HIGH",
    assignedOfficer: "S. A. Deshpande",
    assignedOfficerId: "off-3",
    complaintCount: 5,
    supportingReports: Array.from({ length: 5 }).map((_, i) => ({
      id: `cmp-rep-${801 + i}`,
      trackingNumber: `CMP-1035-${String(i + 1).padStart(2, "0")}`,
      citizenName: `University Commuter ${i + 1}`,
      citizenMobile: `+91 ${9822800000 + i}`,
      description: `Banyan branch fell blocking both road lanes.`,
      location: `University Arch, Gate ${i + 1}`,
      coordinates: { lat: 16.6770 + i * 0.0001, lng: 74.2540 },
      reportedAt: `Yesterday, 02:00 PM`,
      timestamp: Date.now() - 22 * 3600 * 1000,
      channel: "MOBILE_APP",
    })),
    firstReportedAt: "Yesterday, 02:00 PM",
    lastReportedAt: "Yesterday, 03:15 PM",
    createdAtTimestamp: Date.now() - 22 * 3600 * 1000,
    lastReportedTimestamp: Date.now() - 21 * 3600 * 1000,
    slaHours: 6,
    slaDeadline: "Yesterday, 08:00 PM",
    slaRemainingMinutes: 0,
    isSlaBreached: false,
    resolutionEvidence: {
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
      remarks: "Branch sawn with hydraulic cutter, wood transported to nursery and roadway opened.",
      uploadedAt: "Yesterday, 05:40 PM",
      uploadedBy: "S. A. Deshpande",
      inspectionPassed: true,
    },
    aiConfidence: 96,
    aiSuggestedCategory: "Emergency Obstruction",
    aiReasoning: "Clustered 5 commuter reports; successfully resolved within SLA.",
    routingAuditTrail: [],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Yesterday, 02:00 PM",
        note: "Tree obstruction reported.",
        author: "Citizen Portal",
      },
      {
        status: "ASSIGNED",
        timestamp: "Yesterday, 02:15 PM",
        note: "Dispatched Emergency Tree Trimming Squad.",
        author: "KMC Forestry",
      },
      {
        status: "RESOLVED",
        timestamp: "Yesterday, 05:40 PM",
        note: "Roadway cleared and photo evidence verified.",
        author: "Officer (S. A. Deshpande)",
      },
    ],
  },
];

// In-Memory Storage Cache (Singleton across requests)
let cachedIncidents: MasterIncident[] = [...INITIAL_INCIDENTS];

/**
 * Loads incidents from localStorage in browser or cached memory on server
 */
export function getStoredIncidents(): MasterIncident[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedIncidents = parsed;
          return cachedIncidents;
        }
      }
    } catch (e) {
      console.warn("Failed reading incidents from localStorage", e);
    }
  }
  return cachedIncidents;
}

/**
 * Saves incidents to storage and notifies subscribers
 */
export function saveIncidents(incidents: MasterIncident[]): void {
  cachedIncidents = [...incidents];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
      // Dispatch browser cross-tab and in-tab event
      window.dispatchEvent(new CustomEvent("civicresolve:incident-updated", { detail: { timestamp: Date.now() } }));
    } catch (e) {
      console.warn("Failed saving incidents to localStorage", e);
    }
  }
}

/**
 * Reset database to initial seed data
 */
export function resetDatabaseToSeed(): MasterIncident[] {
  cachedIncidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedIncidents));
      window.dispatchEvent(new CustomEvent("civicresolve:incident-updated", { detail: { timestamp: Date.now() } }));
    } catch {}
  }
  return cachedIncidents;
}

/**
 * Dynamic Database Filter
 * Applies multi-tier filtering (Division, District, Authority, Department, Officer, Priority, Status, Date)
 */
export function queryIncidents(filters?: IncidentFilterParams): MasterIncident[] {
  const all = getStoredIncidents();
  if (!filters) return all;

  return all.filter((inc) => {
    // 1. Division
    if (filters.divisionId && filters.divisionId !== "ALL" && inc.divisionId !== filters.divisionId) {
      return false;
    }
    // 2. District
    if (filters.districtId && filters.districtId !== "ALL" && inc.districtId !== filters.districtId) {
      return false;
    }
    // 3. Local Authority
    if (filters.authorityId && filters.authorityId !== "ALL" && inc.authorityId !== filters.authorityId) {
      return false;
    }
    // 4. Department
    if (filters.departmentId && filters.departmentId !== "ALL" && inc.departmentId !== filters.departmentId) {
      return false;
    }
    // 5. Assigned Officer
    if (filters.officerId && filters.officerId !== "ALL" && inc.assignedOfficerId !== filters.officerId) {
      return false;
    }
    if (filters.assignedOfficerName && inc.assignedOfficer !== filters.assignedOfficerName) {
      return false;
    }
    // 6. Priority
    if (filters.priority && filters.priority !== "ALL" && inc.priority !== filters.priority) {
      return false;
    }
    // 7. Status
    if (filters.status && filters.status !== "ALL" && inc.status !== filters.status) {
      return false;
    }
    // 8. Search query (Incident ID, title, description, location, citizen phone, authority, department)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        inc.incidentNumber.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.location.toLowerCase().includes(q) ||
        inc.authorityName.toLowerCase().includes(q) ||
        inc.department.toLowerCase().includes(q) ||
        inc.supportingReports.some((r) =>
          r.citizenName.toLowerCase().includes(q) ||
          r.citizenMobile.includes(q) ||
          r.trackingNumber.toLowerCase().includes(q)
        );
      if (!matchSearch) return false;
    }

    return true;
  });
}

/**
 * Calculates dynamic statistics over the queried incident records.
 * NEVER hardcodes counts.
 */
export function computeDashboardStats(filters?: IncidentFilterParams): DashboardStats {
  const incidents = queryIncidents(filters);

  // Total citizen reports across all master incidents
  const totalComplaints = incidents.reduce((sum, inc) => sum + (inc.complaintCount || inc.supportingReports.length), 0);

  // Active Incidents: All master incidents that are not yet RESOLVED or CLOSED
  const activeIncidents = incidents.filter((inc) => inc.status !== "RESOLVED" && inc.status !== "CLOSED").length;

  // New Complaints: Incidents in SUBMITTED status and not assigned
  const newComplaints = incidents.filter((inc) => inc.status === "SUBMITTED" && !inc.assignedOfficerId).length;

  // Assigned Cases: Incidents with an assigned officer that are active
  const assignedCases = incidents.filter(
    (inc) => Boolean(inc.assignedOfficerId) && inc.status !== "RESOLVED" && inc.status !== "CLOSED"
  ).length;

  // Unassigned Cases: Active incidents without an assigned officer
  const unassignedCases = incidents.filter(
    (inc) => !inc.assignedOfficerId && inc.status !== "RESOLVED" && inc.status !== "CLOSED"
  ).length;

  // Pending Cases: Incidents awaiting work (SUBMITTED, VALIDATING, ASSIGNED)
  const pendingCases = incidents.filter(
    (inc) => inc.status === "SUBMITTED" || inc.status === "VALIDATING" || inc.status === "ASSIGNED"
  ).length;

  // In Progress Cases
  const inProgressCases = incidents.filter((inc) => inc.status === "IN_PROGRESS").length;

  // Resolved Cases
  const resolvedCases = incidents.filter((inc) => inc.status === "RESOLVED" || inc.status === "CLOSED").length;

  // Escalated Cases
  const escalatedCases = incidents.filter((inc) => inc.status === "ESCALATED").length;

  // SLA Breached Cases
  const slaBreachedCases = incidents.filter((inc) => inc.isSlaBreached && inc.status !== "RESOLVED" && inc.status !== "CLOSED").length;

  // High Priority Cases
  const highPriorityCases = incidents.filter((inc) => inc.priority === "VERY_HIGH" || inc.priority === "HIGH").length;

  // Total Supporting Reports (Total citizen complaints linked into incidents)
  // e.g. If an incident has 25 reports, 24 of them are supporting clustered reports.
  const totalSupportingReports = incidents.reduce((sum, inc) => sum + Math.max(0, inc.complaintCount - 1), 0);

  return {
    totalComplaints,
    activeIncidents,
    newComplaints,
    assignedCases,
    unassignedCases,
    pendingCases,
    inProgressCases,
    resolvedCases,
    escalatedCases,
    slaBreachedCases,
    highPriorityCases,
    totalSupportingReports,
  };
}

/**
 * Assigns an officer to a Master Incident.
 * Automatically updates:
 * Assigned Cases +1, Unassigned Cases -1.
 */
export function assignOfficerToIncident(
  incidentId: string,
  officerId: string,
  officerName: string,
  author = "Admin Command"
): MasterIncident | null {
  const all = getStoredIncidents();
  const target = all.find((i) => i.id === incidentId);

  if (!target) return null;

  target.assignedOfficerId = officerId;
  target.assignedOfficer = officerName;

  if (target.status === "SUBMITTED" || target.status === "VALIDATING") {
    target.status = "ASSIGNED";
  }

  target.timeline.push({
    status: "ASSIGNED",
    timestamp: "Just now",
    note: `Assigned to Officer ${officerName} (${officerId}).`,
    author,
  });

  target.routingAuditTrail.push({
    level: "OFFICER",
    entityName: officerName,
    timestamp: "Just now",
    method: "ADMIN_OVERRIDE",
    details: `Allocated to ${officerName} by ${author}.`,
  });

  saveIncidents(all);
  return target;
}

/**
 * Updates the status of an incident (e.g. Pending -> In Progress, In Progress -> Resolved, Escalated).
 * Automatically updates dashboard counts dynamically.
 */
export function updateIncidentStatus(
  incidentId: string,
  newStatus: ComplaintStatus,
  evidence?: { imageUrl: string; remarks: string; uploadedBy: string },
  author = "Admin Command"
): MasterIncident | null {
  const all = getStoredIncidents();
  const target = all.find((i) => i.id === incidentId);

  if (!target) return null;

  const oldStatus = target.status;
  target.status = newStatus;

  if (evidence) {
    target.resolutionEvidence = {
      imageUrl: evidence.imageUrl,
      remarks: evidence.remarks,
      uploadedAt: "Just now",
      uploadedBy: evidence.uploadedBy,
      inspectionPassed: true,
    };
  }

  target.timeline.push({
    status: newStatus,
    timestamp: "Just now",
    note: `Status updated from ${oldStatus} to ${newStatus}.${evidence ? ` Remarks: "${evidence.remarks}"` : ""}`,
    author,
  });

  saveIncidents(all);
  return target;
}

/**
 * Core Clustering Ingestion:
 * Ingests a new citizen complaint report.
 * Evaluates against active open incidents using proximity, semantic similarity, and time window.
 *
 * If Match:
 * - Links to existing master incident.
 * - Increments complaintCount (+1).
 * - Appends to supportingReports.
 * - Recalculates priority.
 * - Supporting Reports +1, Total Complaints +1.
 * - Active Incidents count remains unchanged.
 *
 * If No Match:
 * - Creates brand new Master Incident.
 * - complaintCount = 1.
 * - Active Incidents +1.
 */
export function ingestCitizenComplaint(input: {
  citizenName: string;
  citizenMobile: string;
  category: string;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  imageUrl?: string;
  channel?: CitizenReport["channel"];
}): { incident: MasterIncident; isClustered: boolean; citizenReport: CitizenReport } {
  const all = getStoredIncidents();
  const coords = input.coordinates || { lat: 16.7120, lng: 74.2380 }; // Default to central coordinates if missing
  const now = Date.now();

  const newReport: CitizenReport = {
    id: `cmp-rep-${Date.now().toString(36)}`,
    trackingNumber: `CMP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
    citizenName: input.citizenName || "Verified Citizen",
    citizenMobile: input.citizenMobile,
    description: input.description,
    location: input.location,
    coordinates: coords,
    imageUrl: input.imageUrl,
    reportedAt: "Just now",
    timestamp: now,
    channel: input.channel || "MOBILE_APP",
    aiConfidence: 96,
  };

  // Run Clustering Evaluation across open incidents
  let matchedIncident: MasterIncident | null = null;
  let highestMatchScore = 0;

  for (const inc of all) {
    const evaluation = evaluateReportMatch(
      {
        category: input.category,
        description: input.description,
        location: input.location,
        coordinates: coords,
        timestamp: now,
      },
      inc
    );

    if (evaluation.isMatch && evaluation.matchScore > highestMatchScore) {
      highestMatchScore = evaluation.matchScore;
      matchedIncident = inc;
    }
  }

  // 1. MATCH FOUND: Clustered into existing Master Incident
  if (matchedIncident) {
    matchedIncident.complaintCount += 1;
    matchedIncident.lastReportedAt = "Just now";
    matchedIncident.lastReportedTimestamp = now;
    matchedIncident.supportingReports.push(newReport);

    // Recalculate priority based on citizen volume
    const newPriority = recalculateIncidentPriority(matchedIncident.complaintCount, matchedIncident.priority);
    if (newPriority !== matchedIncident.priority) {
      matchedIncident.priority = newPriority;
      matchedIncident.timeline.push({
        status: matchedIncident.status,
        timestamp: "Just now",
        note: `Priority elevated to ${newPriority} due to ${matchedIncident.complaintCount} concurrent citizen complaints in immediate vicinity.`,
        author: "AI Clustering Engine",
      });
    }

    matchedIncident.timeline.push({
      status: matchedIncident.status,
      timestamp: "Just now",
      note: `New supporting complaint ${newReport.trackingNumber} linked from citizen ${newReport.citizenName}. Total reports: ${matchedIncident.complaintCount}.`,
      author: "Auto-Clustering Engine",
    });

    saveIncidents(all);
    return {
      incident: matchedIncident,
      isClustered: true,
      citizenReport: newReport,
    };
  }

  // 2. NO MATCH: Create new Master Incident
  const newIncidentNumber = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const newIncident: MasterIncident = {
    id: `inc-${Date.now().toString(36)}`,
    incidentNumber: newIncidentNumber,
    title: input.description.slice(0, 60) + (input.description.length > 60 ? "..." : ""),
    description: input.description,
    category: input.category,
    department: "Municipal Affairs & Public Works",
    departmentId: "dept-kmc-general",
    departmentName: "Municipal Public Works",
    authorityId: "auth-kmc",
    authorityName: "Kolhapur Municipal Corporation (KMC)",
    districtId: "dist-kolhapur",
    districtName: "Kolhapur District",
    divisionId: "div-kolhapur",
    divisionName: "Kolhapur Division",
    location: input.location,
    region: "Central Zone",
    coordinates: coords,
    status: "SUBMITTED",
    priority: "MEDIUM",
    complaintCount: 1,
    supportingReports: [newReport],
    firstReportedAt: "Just now",
    lastReportedAt: "Just now",
    createdAtTimestamp: now,
    lastReportedTimestamp: now,
    slaHours: 24,
    slaDeadline: "Tomorrow, same time",
    slaRemainingMinutes: 1440,
    isSlaBreached: false,
    imageUrl: input.imageUrl,
    aiConfidence: 95,
    aiSuggestedCategory: input.category,
    aiReasoning: "New unclustered civic issue detected. Dispatched to intake queue.",
    routingAuditTrail: [
      {
        level: "DIVISION",
        entityName: "Kolhapur Division",
        timestamp: "Just now",
        method: "AI_GEO_POLYGON",
        details: "Assigned by geolocation clustering.",
      },
    ],
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: "Just now",
        note: `Master Incident ${newIncidentNumber} created from citizen report (${input.citizenName || "Citizen"}).`,
        author: `Citizen (${input.citizenName || "Citizen"})`,
      },
    ],
  };

  all.unshift(newIncident);
  saveIncidents(all);

  return {
    incident: newIncident,
    isClustered: false,
    citizenReport: newReport,
  };
}

/**
 * Adapter converting MasterIncident to Complaint for compatibility with existing chart & map components
 */
export function incidentToComplaint(inc: MasterIncident): Complaint {
  return {
    id: inc.id,
    trackingNumber: inc.incidentNumber,
    title: inc.title,
    description: inc.description,
    category: inc.category,
    subcategory: inc.subcategory,
    department: inc.department,
    departmentId: inc.departmentId,
    departmentName: inc.departmentName,
    authorityId: inc.authorityId,
    authorityName: inc.authorityName,
    districtId: inc.districtId,
    districtName: inc.districtName,
    divisionId: inc.divisionId,
    divisionName: inc.divisionName,
    location: inc.location,
    region: inc.region,
    coordinates: inc.coordinates,
    status: inc.status,
    priority: inc.priority,
    assignedOfficer: inc.assignedOfficer,
    assignedOfficerId: inc.assignedOfficerId,
    citizenMobile: inc.supportingReports[0]?.citizenMobile || "+91 98220 00000",
    citizenName: inc.supportingReports[0]?.citizenName,
    date: "2026-10-06",
    createdAt: inc.firstReportedAt,
    updatedAt: inc.lastReportedAt,
    imageUrl: inc.imageUrl,
    aiConfidence: inc.aiConfidence,
    aiSuggestedCategory: inc.aiSuggestedCategory,
    aiReasoning: inc.aiReasoning,
    timeline: inc.timeline,
    routingAuditTrail: inc.routingAuditTrail,
    resolutionEvidence: inc.resolutionEvidence,
  };
}

/**
 * Returns map-formatted incident items for Google Maps markers.
 * Exactly 1 marker per Master Incident with complaintCount (e.g. 25 reports = 1 marker).
 */
export function getMapIncidents(filters?: IncidentFilterParams): MapIncidentItem[] {
  const incidents = queryIncidents(filters);
  return incidents.map((inc) => ({
    incidentId: inc.id,
    latitude: inc.coordinates.lat,
    longitude: inc.coordinates.lng,
    complaintCount: inc.complaintCount,
    category: inc.category,
    subcategory: inc.subcategory,
    priority: inc.priority,
    department: inc.department,
    departmentId: inc.departmentId,
    status: inc.status,
    division: inc.divisionName,
    divisionId: inc.divisionId,
    district: inc.districtName,
    districtId: inc.districtId,
    authority: inc.authorityName,
    authorityId: inc.authorityId,
    slaDeadline: inc.slaDeadline,
    slaRemainingMinutes: inc.slaRemainingMinutes,
    isSlaBreached: inc.isSlaBreached,
    title: inc.title,
    description: inc.description,
    location: inc.location,
    lastReportedAt: inc.lastReportedAt,
    assignedOfficer: inc.assignedOfficer,
    assignedOfficerId: inc.assignedOfficerId,
    imageUrl: inc.imageUrl,
  }));
}

/**
 * Groups nearby master incidents into geographic clusters for map overview.
 */
export function getMapClusters(filters?: IncidentFilterParams): MapClusterItem[] {
  const incidents = queryIncidents(filters);
  const clusters: MapClusterItem[] = [];
  const visited = new Set<string>();

  for (const inc of incidents) {
    if (visited.has(inc.id)) continue;

    const clusterIncidents = [inc];
    visited.add(inc.id);

    // Find all incidents within 1500 meters
    for (const other of incidents) {
      if (visited.has(other.id)) continue;
      const dist = calculateHaversineDistance(
        inc.coordinates.lat,
        inc.coordinates.lng,
        other.coordinates.lat,
        other.coordinates.lng
      );
      if (dist <= 1500) {
        clusterIncidents.push(other);
        visited.add(other.id);
      }
    }

    const totalComplaints = clusterIncidents.reduce((sum, item) => sum + item.complaintCount, 0);
    const avgLat = clusterIncidents.reduce((sum, item) => sum + item.coordinates.lat, 0) / clusterIncidents.length;
    const avgLng = clusterIncidents.reduce((sum, item) => sum + item.coordinates.lng, 0) / clusterIncidents.length;

    let maxLat = -90, minLat = 90, maxLng = -180, minLng = 180;
    for (const item of clusterIncidents) {
      if (item.coordinates.lat > maxLat) maxLat = item.coordinates.lat;
      if (item.coordinates.lat < minLat) minLat = item.coordinates.lat;
      if (item.coordinates.lng > maxLng) maxLng = item.coordinates.lng;
      if (item.coordinates.lng < minLng) minLng = item.coordinates.lng;
    }

    // Determine highest priority in cluster
    const hasVeryHigh = clusterIncidents.some((i) => i.priority === "VERY_HIGH");
    const hasHigh = clusterIncidents.some((i) => i.priority === "HIGH");
    const hasMedium = clusterIncidents.some((i) => i.priority === "MEDIUM");
    const dominantPriority: ComplaintPriority = hasVeryHigh ? "VERY_HIGH" : hasHigh ? "HIGH" : hasMedium ? "MEDIUM" : "LOW";

    clusters.push({
      clusterId: `cluster-${inc.region.toLowerCase().replace(/\s+/g, "-")}-${clusters.length + 1}`,
      title: `${inc.region} Cluster (${clusterIncidents.length} Incidents, ${totalComplaints} Reports)`,
      center: { lat: avgLat, lng: avgLng },
      incidentCount: clusterIncidents.length,
      totalComplaints,
      dominantCategory: inc.category,
      dominantPriority,
      incidents: clusterIncidents.map((i) => i.id),
      bounds: {
        north: maxLat + 0.002,
        south: minLat - 0.002,
        east: maxLng + 0.002,
        west: minLng - 0.002,
      },
    });
  }

  return clusters;
}

/**
 * Computes geographic density hotspots from real database incidents and citizen reports.
 * Hotspots are dynamically generated based on volume of complaints in geographic proximity.
 */
export function getMapHotspots(filters?: IncidentFilterParams): MapHotspotItem[] {
  const incidents = queryIncidents(filters);
  const hotspots: MapHotspotItem[] = [];

  for (const inc of incidents) {
    // Only generate hotspots around notable complaint volumes (>= 3 complaints)
    if (inc.complaintCount >= 3) {
      let densityLevel: "CRITICAL" | "HIGH" | "MODERATE" = "MODERATE";
      let color = "rgba(15, 118, 110, 0.22)";
      let borderColor = "#0F766E";
      let radiusMeters = 180;

      if (inc.complaintCount >= 15) {
        densityLevel = "CRITICAL";
        color = "rgba(220, 38, 38, 0.24)";
        borderColor = "#DC2626";
        radiusMeters = 350;
      } else if (inc.complaintCount >= 6) {
        densityLevel = "HIGH";
        color = "rgba(245, 158, 11, 0.24)";
        borderColor = "#F59E0B";
        radiusMeters = 250;
      }

      hotspots.push({
        id: `hotspot-${inc.id}`,
        name: `${inc.location.split(",")[0] || inc.location} ${inc.category} Density Zone`,
        center: { lat: inc.coordinates.lat, lng: inc.coordinates.lng },
        radiusMeters,
        complaintCount: inc.complaintCount,
        incidentCount: 1,
        densityLevel,
        dominantCategory: inc.category,
        divisionId: inc.divisionId,
        authorityId: inc.authorityId,
        color,
        borderColor,
      });
    }
  }

  return hotspots;
}
