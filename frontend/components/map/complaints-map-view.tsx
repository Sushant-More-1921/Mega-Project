"use client";

import React from "react";
import { Complaint } from "@/types/complaint";
import { MasterIncident } from "@/types/incident";
import { GoogleMapsDashboard } from "./google-maps-dashboard";
import { incidentToComplaint } from "@/lib/db/incidents-db";

interface ComplaintsMapViewProps {
  complaints?: Complaint[];
  incidents?: MasterIncident[];
  onSelectComplaint?: (complaint: Complaint) => void;
  onSelectIncident?: (incident: MasterIncident) => void;
  userJurisdiction?: {
    divisionId?: string;
    authorityId?: string;
    departmentId?: string;
  };
}

export function ComplaintsMapView({
  complaints,
  incidents,
  onSelectComplaint,
  onSelectIncident,
  userJurisdiction,
}: ComplaintsMapViewProps) {
  const handleSelectIncident = (inc: MasterIncident) => {
    if (onSelectIncident) {
      onSelectIncident(inc);
    }
    if (onSelectComplaint) {
      onSelectComplaint(incidentToComplaint(inc));
    }
  };

  return (
    <GoogleMapsDashboard
      incidents={incidents}
      onSelectIncident={handleSelectIncident}
      userJurisdiction={userJurisdiction}
    />
  );
}
