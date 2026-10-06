import { NextRequest, NextResponse } from "next/server";
import { queryIncidents, computeDashboardStats, ingestCitizenComplaint } from "@/lib/db/incidents-db";
import { IncidentFilterParams } from "@/types/incident";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: IncidentFilterParams = {
      divisionId: searchParams.get("divisionId") || undefined,
      districtId: searchParams.get("districtId") || undefined,
      authorityId: searchParams.get("authorityId") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      officerId: searchParams.get("officerId") || undefined,
      priority: searchParams.get("priority") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      assignedOfficerName: searchParams.get("assignedOfficerName") || undefined,
    };

    const incidents = queryIncidents(filters);
    const stats = computeDashboardStats(filters);

    return NextResponse.json({
      success: true,
      incidents,
      stats,
      totalCount: incidents.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to query incidents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.description || !body.category || !body.location) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: description, category, location" },
        { status: 400 }
      );
    }

    const result = ingestCitizenComplaint({
      citizenName: body.citizenName || "Verified Citizen",
      citizenMobile: body.citizenMobile || "+91 98220 00000",
      category: body.category,
      description: body.description,
      location: body.location,
      coordinates: body.coordinates,
      imageUrl: body.imageUrl,
      channel: body.channel || "WEB_PORTAL",
    });

    return NextResponse.json({
      success: true,
      isClustered: result.isClustered,
      incident: result.incident,
      citizenReport: result.citizenReport,
      message: result.isClustered
        ? `Successfully clustered into Master Incident ${result.incident.incidentNumber} (${result.incident.complaintCount} reports linked).`
        : `Created new Master Incident ${result.incident.incidentNumber}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to ingest complaint" },
      { status: 500 }
    );
  }
}
