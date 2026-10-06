import { NextRequest, NextResponse } from "next/server";
import { getMapClusters } from "@/lib/db/incidents-db";
import { IncidentFilterParams } from "@/types/incident";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/map/clusters
 * Returns geographic clusters of incidents based on proximity and administrative bounds.
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

    const clusters = getMapClusters(filters);

    return NextResponse.json({
      success: true,
      count: clusters.length,
      data: clusters,
    });
  } catch (error) {
    console.error("Error fetching map clusters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch map clusters" },
      { status: 500 }
    );
  }
}
