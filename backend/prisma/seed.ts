import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Departments
  const depts = [
    { id: 'dept-waste', name: 'Solid Waste Management', code: 'SWM', description: 'Garbage, dumpsters, street sanitation' },
    { id: 'dept-water', name: 'Hydraulics & Water Supply', code: 'HWS', description: 'Drinking water pipelines, leakage, supply' },
    { id: 'dept-roads', name: 'Road Infrastructure & Maintenance', code: 'RIM', description: 'Potholes, asphalt damage, footpaths' },
    { id: 'dept-drainage', name: 'Drainage & Sewerage Operations', code: 'DSO', description: 'Open manholes, stormwater flooding' },
    { id: 'dept-electrical', name: 'Electrical & Streetlighting', code: 'ESL', description: 'Streetlights, dark spots, electric poles' },
    { id: 'dept-env', name: 'Environmental Safety & Hazardous Waste', code: 'ENV', description: 'Bio-waste, industrial effluent, chemical runoff' },
  ];

  for (const d of depts) {
    await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
  }

  // 2. Admin User
  const adminUser = await prisma.user.upsert({
    where: { phoneNumber: '9822012345' },
    update: {
      role: 'ADMIN',
      name: 'Rajesh Sharma',
      designation: 'Chief Grievance Redressal Administrator',
    },
    create: {
      phoneNumber: '9822012345',
      name: 'Rajesh Sharma',
      role: 'ADMIN',
      designation: 'Chief Grievance Redressal Administrator',
      departmentId: 'dept-waste',
    },
  });

  // Also support with +91 prefix
  await prisma.user.upsert({
    where: { phoneNumber: '+919822012345' },
    update: {
      role: 'ADMIN',
      name: 'Rajesh Sharma',
      designation: 'Chief Grievance Redressal Administrator',
    },
    create: {
      phoneNumber: '+919822012345',
      name: 'Rajesh Sharma',
      role: 'ADMIN',
      designation: 'Chief Grievance Redressal Administrator',
      departmentId: 'dept-waste',
    },
  });

  // 3. Field Officers
  const officersData = [
    { id: 'off-1', name: 'R. K. Patil', phoneNumber: '9822011111', designation: 'Senior Sanitary Inspector', badgeId: 'SAN-KMC-101', departmentId: 'dept-waste', activeCases: 4, resolvedCases: 42 },
    { id: 'off-2', name: 'S. M. Shinde', phoneNumber: '9822022222', designation: 'Assistant Engineer (Hydraulics)', badgeId: 'HYD-KMC-204', departmentId: 'dept-water', activeCases: 3, resolvedCases: 29 },
    { id: 'off-3', name: 'Vikram Deshmukh', phoneNumber: '9822033333', designation: 'Junior Engineer (Roads)', badgeId: 'ENG-PMC-301', departmentId: 'dept-roads', activeCases: 5, resolvedCases: 38 },
    { id: 'off-4', name: 'Aditi Rao', phoneNumber: '9822044444', designation: 'Hydraulic Maintenance Engineer', badgeId: 'HYD-PMC-212', departmentId: 'dept-water', activeCases: 2, resolvedCases: 24 },
  ];

  for (const off of officersData) {
    await prisma.officer.upsert({
      where: { phoneNumber: off.phoneNumber },
      update: {},
      create: off,
    });

    // Also register user profile for officers
    await prisma.user.upsert({
      where: { phoneNumber: off.phoneNumber },
      update: { role: 'OFFICER', name: off.name, designation: off.designation },
      create: {
        id: off.id,
        phoneNumber: off.phoneNumber,
        name: off.name,
        role: 'OFFICER',
        designation: off.designation,
        departmentId: off.departmentId,
      },
    });
  }

  // 4. Sample Citizen User for initial complaints
  const citizen = await prisma.user.upsert({
    where: { phoneNumber: '9876543210' },
    update: { name: 'Amit Kulkarni' },
    create: {
      phoneNumber: '9876543210',
      name: 'Amit Kulkarni',
      role: 'CITIZEN',
    },
  });

  // Also with +91
  await prisma.user.upsert({
    where: { phoneNumber: '+919876543210' },
    update: { name: 'Amit Kulkarni' },
    create: {
      phoneNumber: '+919876543210',
      name: 'Amit Kulkarni',
      role: 'CITIZEN',
    },
  });

  // 5. Seed Real Initial Complaints for citizen and admin
  const complaint1 = await prisma.complaint.upsert({
    where: { trackingNumber: 'CMP-2026-1042' },
    update: {},
    create: {
      trackingNumber: 'CMP-2026-1042',
      title: 'Garbage accumulation near high school entrance',
      description: 'Overflowing commercial dumpster causing traffic and sanitation hazard for students at High School entrance.',
      category: 'Solid Waste Management',
      subcategory: 'Commercial Dumpster',
      divisionId: 'div-kolhapur',
      divisionName: 'Kolhapur Division',
      authorityId: 'auth-kmc',
      authorityName: 'Kolhapur Municipal Corporation (KMC)',
      departmentId: 'dept-waste',
      location: 'Ward 12, Near New High School, Shivaji Road, Kolhapur North',
      latitude: 16.7120,
      longitude: 74.2380,
      imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80',
      status: 'IN_PROGRESS',
      priority: 'VERY_HIGH',
      citizenId: citizen.id,
      assignedOfficerId: 'off-1',
      assignedOfficerName: 'R. K. Patil',
      slaHours: 4,
      slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      timeline: {
        create: [
          { status: 'SUBMITTED', note: 'Complaint lodged by citizen with geo-tagged photo proof.', author: 'Amit Kulkarni', authorRole: 'CITIZEN' },
          { status: 'UNDER_REVIEW', note: 'AI Semantic Engine detected school zone proximity. Priority escalated to VERY HIGH.', author: 'AI Triage Engine', authorRole: 'SYSTEM' },
          { status: 'ASSIGNED', note: 'Dispatched to Senior Sanitary Inspector R. K. Patil (Ward 12).', author: 'Auto-Dispatcher', authorRole: 'SYSTEM' },
          { status: 'IN_PROGRESS', note: 'Field sanitation crew deployed with compactor truck.', author: 'R. K. Patil', authorRole: 'OFFICER' },
        ],
      },
    },
  });

  const complaint2 = await prisma.complaint.upsert({
    where: { trackingNumber: 'CMP-2026-1041' },
    update: {},
    create: {
      trackingNumber: 'CMP-2026-1041',
      title: 'Major water pipeline rupture on Main Market Road',
      description: 'Drinking water pipeline rupture leaking hundreds of gallons per minute and flooding footpath.',
      category: 'Water Supply & Leakage',
      subcategory: 'Main Line Burst',
      divisionId: 'div-kolhapur',
      divisionName: 'Kolhapur Division',
      authorityId: 'auth-kmc',
      authorityName: 'Kolhapur Municipal Corporation (KMC)',
      departmentId: 'dept-water',
      location: 'Main Market Road, Sector 3, Kolhapur',
      latitude: 16.7050,
      longitude: 74.2410,
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=600&q=80',
      status: 'RESOLVED',
      priority: 'HIGH',
      citizenId: citizen.id,
      assignedOfficerId: 'off-2',
      assignedOfficerName: 'S. M. Shinde',
      slaHours: 6,
      resolutionRemarks: 'Defective valve replaced and pipeline welded. Water pressure restored.',
      resolutionImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
      resolvedAt: new Date(),
      timeline: {
        create: [
          { status: 'SUBMITTED', note: 'Complaint registered by citizen with video evidence.', author: 'Amit Kulkarni', authorRole: 'CITIZEN' },
          { status: 'ASSIGNED', note: 'Assigned to Hydraulic Engineer S. M. Shinde.', author: 'Supervisor', authorRole: 'ADMIN' },
          { status: 'IN_PROGRESS', note: 'Excavation team on-site isolating water gate.', author: 'S. M. Shinde', authorRole: 'OFFICER' },
          { status: 'RESOLVED', note: 'Pipeline welded and tested under pressure. Water quality cleared.', author: 'S. M. Shinde', authorRole: 'OFFICER' },
        ],
      },
    },
  });

  console.log('✅ Seed complete: Admin, Officers, Departments, and Complaints loaded.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
