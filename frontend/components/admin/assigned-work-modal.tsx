"use client";

import React from "react";
import { MasterIncident } from "@/types/incident";
import { StatusBadge } from "@/components/common/status-badge";
import { PriorityBadge } from "@/components/common/priority-badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Briefcase,
  Layers,
  MapPin,
  Clock,
  UserCheck,
  Building2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignedWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: MasterIncident[];
  officerName?: string;
  onSelectIncident: (incident: MasterIncident) => void;
}

export function AssignedWorkModal({
  isOpen,
  onClose,
  incidents,
  officerName,
  onSelectIncident,
}: AssignedWorkModalProps) {
  if (!isOpen) return null;

  // Filter incidents assigned to this officer, or all assigned cases if admin view
  const assignedIncidents = incidents.filter((inc) => {
    if (!inc.assignedOfficerId && !inc.assignedOfficer) return false;
    // Don't show closed/resolved cases in active assigned work
    if (inc.status === "RESOLVED" || inc.status === "CLOSED") return false;
    if (officerName && officerName !== "Rajesh Sharma" && officerName !== "Administrator") {
      return inc.assignedOfficer === officerName;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B4EA2] text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[#0F172A]">
                  Active Assigned Work & Field Dispatches
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAF2FF] text-[#0B4EA2] border border-[#BFDBFE]">
                  {assignedIncidents.length} Active Cases
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {officerName
                  ? `Filtered roster for assigned personnel: ${officerName}`
                  : "All active grievances currently dispatched to department officers."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {assignedIncidents.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF3] text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0F172A] text-sm sm:text-base">No Pending Assigned Work</h4>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                All assigned civic incidents have been resolved or are currently queued for inspection.
              </p>
            </div>
          ) : (
            assignedIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => {
                  onSelectIncident(incident);
                  onClose();
                }}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B4EA2] hover:shadow-md transition-all cursor-pointer space-y-3 group"
              >
                {/* Top Row: Incident ID, Title, Status, Priority */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-sm text-[#0B4EA2]">
                      {incident.incidentNumber}
                    </span>

                    {/* Complaint Count Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#5B21B6] border border-[#DDD6FE]">
                      <Layers className="w-3 h-3" />
                      {incident.complaintCount} Citizen {incident.complaintCount === 1 ? "Report" : "Reports Clustered"}
                    </span>

                    <PriorityBadge priority={incident.priority} size="sm" />
                    <StatusBadge status={incident.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "font-semibold px-2 py-0.5 rounded text-[11px] flex items-center gap-1",
                        incident.isSlaBreached
                          ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                          : "bg-[#ECFDF3] text-[#15803D] border border-[#BBF7D0]"
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {incident.isSlaBreached ? "SLA Breached" : `SLA: ${incident.slaDeadline}`}
                    </span>
                  </div>
                </div>

                {/* Problem Title & Description */}
                <div>
                  <h4 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0B4EA2] transition-colors">
                    {incident.title}
                  </h4>
                  <p className="text-xs text-[#64748B] line-clamp-2 mt-1">
                    {incident.description}
                  </p>
                </div>

                {/* Grid Metadata: Location, Department, Assigned Officer, Last Reported Time */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-[#475569]">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#0B4EA2] shrink-0" />
                    <span className="truncate">{incident.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <span className="truncate">{incident.department}</span>
                  </div>

                  <div className="flex items-center gap-1.5 truncate">
                    <UserCheck className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                    <span className="font-semibold text-[#0F172A] truncate">
                      Officer: {incident.assignedOfficer || "Unassigned"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-1.5 text-[#64748B]">
                    <span className="text-[11px]">Last reported: {incident.lastReportedAt}</span>
                    <ChevronRight className="w-4 h-4 text-[#0B4EA2] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B]">
          <span>Click any case to inspect clustered citizen reports, timeline, and update status.</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close View
          </Button>
        </div>
      </div>
    </div>
  );
}
