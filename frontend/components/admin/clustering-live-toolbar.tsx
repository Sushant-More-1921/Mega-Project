"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  PlusCircle,
  UserCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ingestCitizenComplaint,
  assignOfficerToIncident,
  updateIncidentStatus,
  resetDatabaseToSeed,
  getStoredIncidents,
} from "@/lib/db/incidents-db";
import { emitRealTimeEvent } from "@/lib/realtime/events";

interface ClusteringLiveToolbarProps {
  onRefresh: () => void;
}

export function ClusteringLiveToolbar({ onRefresh }: ClusteringLiveToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 6000);
  };

  // 1. Simulate duplicate citizen report matching the Kolhapur garbage problem (Incident 1042)
  const handleSimulateClusterDuplicate = () => {
    const randomCitizen = `Citizen Neighbor ${Math.floor(100 + Math.random() * 900)}`;
    const randomPhone = `+91 98220 ${Math.floor(10000 + Math.random() * 90000)}`;

    const result = ingestCitizenComplaint({
      citizenName: randomCitizen,
      citizenMobile: randomPhone,
      category: "Solid Waste",
      description: "Severe garbage overflow and flies near school gate, urgently clear this dump.",
      location: "Kolhapur North, Ward 12, Near New High School",
      coordinates: { lat: 16.7121, lng: 74.2381 },
      channel: "MOBILE_APP",
    });

    emitRealTimeEvent("COMPLAINT_CLUSTERED", {
      incidentId: result.incident.id,
      incidentNumber: result.incident.incidentNumber,
      complaintCount: result.incident.complaintCount,
    });

    onRefresh();
    showNotice(
      `⚡ CLUSTER MATCH: ${randomCitizen}'s report linked into ${result.incident.incidentNumber}. Complaint count increased to ${result.incident.complaintCount}. Active Incidents count stayed unchanged!`
    );
  };

  // 2. Simulate brand new incident (No match)
  const handleSimulateNewIncident = () => {
    const locNumber = Math.floor(10 + Math.random() * 90);
    const result = ingestCitizenComplaint({
      citizenName: "New Citizen Caller",
      citizenMobile: "+91 99770 12345",
      category: "Electrical & Lighting",
      description: `Sparking transformer and short circuit on Colony Road #${locNumber}.`,
      location: `Kolhapur South, Colony Road #${locNumber}`,
      coordinates: { lat: 16.6800 + Math.random() * 0.02, lng: 74.2200 + Math.random() * 0.02 },
      channel: "TOLL_FREE_1916",
    });

    emitRealTimeEvent("NEW_INCIDENT_CREATED", {
      incidentId: result.incident.id,
      incidentNumber: result.incident.incidentNumber,
    });

    onRefresh();
    showNotice(
      `⚡ NEW INCIDENT CREATED: ${result.incident.incidentNumber} lodged at ${result.incident.location}. Active Incidents +1, Unassigned +1.`
    );
  };

  // 3. Simulate assigning an unassigned case (Assigned +1, Unassigned -1)
  const handleSimulateAssign = () => {
    const all = getStoredIncidents();
    const unassigned = all.find((i) => !i.assignedOfficerId && i.status !== "RESOLVED" && i.status !== "CLOSED");

    if (!unassigned) {
      showNotice("All current active incidents already have assigned officers.");
      return;
    }

    assignOfficerToIncident(unassigned.id, "off-1", "R. K. Patil", "Live Simulation Controller");
    emitRealTimeEvent("OFFICER_ASSIGNED", { incidentId: unassigned.id });
    onRefresh();
    showNotice(
      `⚡ OFFICER ASSIGNED: ${unassigned.incidentNumber} allocated to Officer R. K. Patil. (Assigned Cases +1, Unassigned Cases -1).`
    );
  };

  // 4. Simulate status progress (Pending -1, In Progress +1)
  const handleSimulateProgress = () => {
    const all = getStoredIncidents();
    const pending = all.find((i) => i.status === "ASSIGNED" || i.status === "SUBMITTED");

    if (!pending) {
      showNotice("No pending cases available to move to In Progress.");
      return;
    }

    updateIncidentStatus(pending.id, "IN_PROGRESS", undefined, "Field Unit Update");
    emitRealTimeEvent("STATUS_CHANGED", { incidentId: pending.id, status: "IN_PROGRESS" });
    onRefresh();
    showNotice(
      `⚡ WORK STARTED: ${pending.incidentNumber} changed from Pending to In Progress. (Pending Cases -1, In Progress +1).`
    );
  };

  // 5. Simulate resolution (In Progress -1, Resolved +1)
  const handleSimulateResolve = () => {
    const all = getStoredIncidents();
    const inProg = all.find((i) => i.status === "IN_PROGRESS");

    if (!inProg) {
      showNotice("No case currently in IN_PROGRESS state to resolve.");
      return;
    }

    updateIncidentStatus(
      inProg.id,
      "RESOLVED",
      {
        imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
        remarks: "Emergency repair finalized and verified by inspector.",
        uploadedBy: "Field Inspection Squad",
      },
      "Field Verification"
    );
    emitRealTimeEvent("CASE_RESOLVED", { incidentId: inProg.id });
    onRefresh();
    showNotice(
      `⚡ CASE RESOLVED: ${inProg.incidentNumber} verified and closed! (In Progress -1, Resolved +1, Active Incidents -1).`
    );
  };

  // 6. Reset database to seed data
  const handleReset = () => {
    resetDatabaseToSeed();
    emitRealTimeEvent("DATABASE_RESET");
    onRefresh();
    showNotice("Database reset to baseline state (Kolhapur garbage cluster reset to 25 reports).");
  };

  return (
    <div className="bg-gradient-to-r from-[#0B4EA2] via-[#083B7A] to-[#1E3A8A] rounded-xl text-white shadow-md overflow-hidden">
      {/* Top Banner Row */}
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
            <Zap className="w-4 h-4 text-[#FDE68A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight">
                Live Complaint Clustering & Real-Time Dashboard Engine
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#16A34A] text-white animate-pulse">
                Active Sync
              </span>
            </div>
            <p className="text-[11px] text-white/80">
              Database-driven counts update automatically on every complaint ingestion, clustering match, assignment, and status change.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>{isExpanded ? "Hide Test Controls" : "Test Live Clustering"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Real-time Notification Banner */}
      {notification && (
        <div className="bg-[#FEF3C7] text-[#92400E] px-4 py-2 text-xs font-semibold border-t border-[#FDE68A] flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[#92400E] hover:text-black font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Expanded Interactive Simulation Panel */}
      {isExpanded && (
        <div className="bg-[#052857] p-4 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
          <div className="text-[11px] text-white/70">
            Click any button below to trigger real database mutations and watch the dashboard cards increment/decrement instantly:
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* 1. Cluster Duplicate Report */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateClusterDuplicate}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs h-8"
              leftIcon={<Layers className="w-3.5 h-3.5 text-[#DDD6FE]" />}
            >
              +1 Neighbor Report (Cluster into Kolhapur Garbage)
            </Button>

            {/* 2. Brand New Incident */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateNewIncident}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs h-8"
              leftIcon={<PlusCircle className="w-3.5 h-3.5 text-[#BBF7D0]" />}
            >
              +1 Brand New Problem (Active Incidents +1)
            </Button>

            {/* 3. Assign Case */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateAssign}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs h-8"
              leftIcon={<UserCheck className="w-3.5 h-3.5 text-[#93C5FD]" />}
            >
              Assign Case (Assigned +1, Unassigned -1)
            </Button>

            {/* 4. Progress Case */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateProgress}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs h-8"
              leftIcon={<Clock className="w-3.5 h-3.5 text-[#FDE68A]" />}
            >
              Start Work (Pending -1, In Progress +1)
            </Button>

            {/* 5. Resolve Case */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateResolve}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs h-8"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />}
            >
              Resolve Case (In Progress -1, Resolved +1)
            </Button>

            {/* 6. Reset */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-white/70 hover:text-white hover:bg-white/10 text-xs h-8 ml-auto"
              leftIcon={<RotateCcw className="w-3 h-3" />}
            >
              Reset Baseline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
