import { NextRequest, NextResponse } from "next/server";
import { getMapIncidents } from "@/lib/db/incidents-db";
import { IncidentFilterParams } from "@/types/incident";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/map/incidents
 * Returns map-optimized incidents with geographic coordinates and complaintCount.
 * 25 complaints at same location -> 1 master incident marker with complaintCount: 25.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: IncidentFilterParams = {
      divisionId: searchParams.get("divisionId") || undefined,
      districtId: searchParams.get("districtId") || undefined,
      authorityId: searchParams.get("authorityId") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      priority: searchParams.get("priority") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const incidents = getMapIncidents(filters);

    return NextResponse.json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    console.error("Error fetching map incidents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch map incidents" },
      { status: 500 }
    );
  }
}
