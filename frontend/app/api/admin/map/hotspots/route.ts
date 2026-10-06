import { NextRequest, NextResponse } from "next/server";
import { getMapHotspots } from "@/lib/db/incidents-db";
import { IncidentFilterParams } from "@/types/incident";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/map/hotspots
 * Returns dynamic density hotspots computed from database incidents and citizen reports.
 * Hotspots are computed based on real complaint density, NOT hardcoded coordinates.
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
    };

    const hotspots = getMapHotspots(filters);

    return NextResponse.json({
      success: true,
      count: hotspots.length,
      data: hotspots,
    });
  } catch (error) {
    console.error("Error fetching map hotspots:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch map hotspots" },
      { status: 500 }
    );
  }
}
