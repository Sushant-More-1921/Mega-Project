import { NextRequest, NextResponse } from "next/server";
import { updateIncidentStatus } from "@/lib/db/incidents-db";
import { ComplaintStatus } from "@/types/complaint";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { success: false, message: "Missing required status" },
        { status: 400 }
      );
    }

    const updated = updateIncidentStatus(
      id,
      body.status as ComplaintStatus,
      body.evidence,
      body.author || "Admin Command"
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Incident not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      incident: updated,
      message: `Status of Incident ${updated.incidentNumber} updated to ${body.status}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
