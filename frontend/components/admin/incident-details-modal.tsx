"use client";

import React, { useState } from "react";
import { MasterIncident, CitizenReport } from "@/types/incident";
import { Officer } from "@/types/officer";
import { StatusBadge } from "@/components/common/status-badge";
import { PriorityBadge } from "@/components/common/priority-badge";
import { Button } from "@/components/ui/button";
import {
  X,
  MapPin,
  Calendar,
  Phone,
  User,
  Shield,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Camera,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IncidentDetailsModalProps {
  incident: MasterIncident | null;
  officers: Officer[];
  onClose: () => void;
  onReassignOfficer: (incidentId: string, officerId: string, officerName: string) => void;
  onUpdateStatus: (incidentId: string, newStatus: any, evidenceRemarks?: string) => void;
}

export function IncidentDetailsModal({
  incident,
  officers,
  onClose,
  onReassignOfficer,
  onUpdateStatus,
}: IncidentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "supporting_reports" | "timeline" | "audit">("overview");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!incident) return null;

  const handleReassign = () => {
    const officer = officers.find((o) => o.id === selectedOfficerId);
    if (!officer) return;
    setIsUpdating(true);
    setTimeout(() => {
      onReassignOfficer(incident.id, officer.id, officer.name);
      setIsUpdating(false);
      setSelectedOfficerId("");
    }, 300);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionRemarks.trim()) return;
    setIsUpdating(true);
    setTimeout(() => {
      onUpdateStatus(incident.id, "RESOLVED", resolutionRemarks);
      setIsUpdating(false);
      setShowResolveForm(false);
      setResolutionRemarks("");
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B4EA2] text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-extrabold text-base text-[#0B4EA2]">
                  {incident.incidentNumber}
                </span>
                <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#5B21B6] border border-[#DDD6FE] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  {incident.complaintCount} Citizen {incident.complaintCount === 1 ? "Report" : "Reports Clustered"}
                </span>
                <PriorityBadge priority={incident.priority} size="sm" />
                <StatusBadge status={incident.status} size="sm" />
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {incident.authorityName} • {incident.divisionName} • {incident.department}
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

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#E2E8F0] px-6 bg-white gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "py-3 border-b-2 transition-colors",
              activeTab === "overview"
                ? "border-[#0B4EA2] text-[#0B4EA2]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            Incident Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("supporting_reports")}
            className={cn(
              "py-3 border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "supporting_reports"
                ? "border-[#0B4EA2] text-[#0B4EA2]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            <span>Clustered Supporting Reports</span>
            <span className="bg-[#EAF2FF] text-[#0B4EA2] px-1.5 py-0.2 rounded-full font-bold text-[10px]">
              {incident.supportingReports.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={cn(
              "py-3 border-b-2 transition-colors",
              activeTab === "timeline"
                ? "border-[#0B4EA2] text-[#0B4EA2]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            Timeline ({incident.timeline.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={cn(
              "py-3 border-b-2 transition-colors",
              activeTab === "audit"
                ? "border-[#0B4EA2] text-[#0B4EA2]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            Routing Audit Trail
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Problem Title & Description */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
                <h3 className="font-bold text-base text-[#0F172A]">{incident.title}</h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  {incident.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#64748B] pt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0B4EA2]" />
                  <span>{incident.location}</span>
                </div>
              </div>

              {/* Clustering Intelligence Banner */}
              <div className="p-4 rounded-xl bg-[#F3E8FF] border border-[#DDD6FE] text-[#5B21B6] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-[#5B21B6]" />
                    <span>Dynamic Clustering & Duplicate Consolidation</span>
                  </div>
                  <span className="text-[11px] font-bold bg-[#5B21B6] text-white px-2 py-0.5 rounded-full">
                    AI Auto-Linked
                  </span>
                </div>
                <p className="text-xs text-[#5B21B6]/90 leading-relaxed">
                  {incident.aiReasoning ||
                    `This issue consolidates ${incident.complaintCount} independent citizen submissions within a 450m radius. Instead of overloading the field officer with separate work tickets, all citizen reports are managed under this one master incident.`}
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                  <span className="text-[#64748B] block text-[11px]">Category:</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{incident.category}</span>
                </div>

                <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                  <span className="text-[#64748B] block text-[11px]">SLA Ceiling:</span>
                  <span
                    className={cn(
                      "font-bold mt-0.5 block",
                      incident.isSlaBreached ? "text-[#DC2626]" : "text-[#15803D]"
                    )}
                  >
                    {incident.isSlaBreached ? "SLA Breached" : incident.slaDeadline}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                  <span className="text-[#64748B] block text-[11px]">First Reported:</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">{incident.firstReportedAt}</span>
                </div>

                <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                  <span className="text-[#64748B] block text-[11px]">Latest Surge:</span>
                  <span className="font-semibold text-[#0B4EA2] mt-0.5 block">{incident.lastReportedAt}</span>
                </div>
              </div>

              {/* Quick Status Action Panel */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    Workflow & Dispatch Controls
                  </span>
                  <span className="text-xs text-[#64748B]">
                    Current Status: <strong>{incident.status}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {incident.status !== "IN_PROGRESS" && incident.status !== "RESOLVED" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onUpdateStatus(incident.id, "IN_PROGRESS")}
                      className="text-xs"
                    >
                      Mark In Progress (Pending -1, In Progress +1)
                    </Button>
                  )}

                  {incident.status !== "RESOLVED" && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setShowResolveForm(!showResolveForm)}
                      className="text-xs"
                    >
                      {showResolveForm ? "Cancel Resolution" : "Mark Resolved (In Progress -1, Resolved +1)"}
                    </Button>
                  )}

                  {incident.status !== "ESCALATED" && incident.status !== "RESOLVED" && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onUpdateStatus(incident.id, "ESCALATED")}
                      className="text-xs"
                    >
                      Escalate (Escalated +1)
                    </Button>
                  )}
                </div>

                {/* Inline Resolve Evidence Form */}
                {showResolveForm && (
                  <form onSubmit={handleResolveSubmit} className="pt-3 border-t border-[#E2E8F0] space-y-2">
                    <label className="text-xs font-semibold text-[#0F172A] block">
                      Field Resolution Remarks & Inspection Proof <span className="text-[#DC2626]">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={resolutionRemarks}
                      onChange={(e) => setResolutionRemarks(e.target.value)}
                      placeholder="Enter verification notes (e.g. Garbage cleared, sidewalk disinfected, road opened)..."
                      className="w-full p-2.5 rounded-lg border border-[#CBD5E1] text-xs text-[#0F172A] focus:outline-none focus:border-[#0B4EA2]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResolveForm(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="success"
                        size="sm"
                        isLoading={isUpdating}
                        className="text-xs"
                      >
                        Submit Verified Resolution
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Officer Allocation Panel */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#0B4EA2]" />
                    <span className="font-bold text-xs text-[#0F172A]">
                      Assigned Officer:{" "}
                      <span className="text-[#0B4EA2]">
                        {incident.assignedOfficer || "Unassigned"}
                      </span>
                    </span>
                  </div>
                  {incident.assignedOfficer ? (
                    <span className="text-[11px] font-semibold text-[#15803D] bg-[#ECFDF3] px-2 py-0.5 rounded border border-[#BBF7D0]">
                      Dispatched
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                      Unassigned (-1)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0F172A]"
                  >
                    <option value="">Select officer to assign/reassign...</option>
                    {officers.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.name} ({off.department} • {off.badgeId})
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selectedOfficerId}
                    isLoading={isUpdating}
                    onClick={handleReassign}
                    className="text-xs h-9 shrink-0"
                  >
                    Assign Officer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLUSTERED SUPPORTING REPORTS (All 25 citizen reports) */}
          {activeTab === "supporting_reports" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <h4 className="font-bold text-sm text-[#0F172A]">
                    Citizen Grievances Clustered ({incident.supportingReports.length} Reports)
                  </h4>
                  <p className="text-xs text-[#64748B]">
                    Every individual citizen report is preserved for citizen tracking, SMS updates, and auditability.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EAF2FF] text-[#0B4EA2] border border-[#BFDBFE]">
                  Master ID: {incident.incidentNumber}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {incident.supportingReports.map((report, idx) => (
                  <div
                    key={report.id || idx}
                    className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0B4EA2]">
                          {report.trackingNumber}
                        </span>
                        <span className="font-semibold text-[#0F172A]">
                          {report.citizenName}
                        </span>
                        <span className="text-[11px] text-[#64748B] font-mono">
                          {report.citizenMobile}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E2E8F0] text-[#475569]">
                        {report.channel || "MOBILE_APP"}
                      </span>
                    </div>

                    <p className="text-[#334155]">{report.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#F1F5F9]">
                      <span className="truncate">📍 {report.location}</span>
                      <span className="shrink-0">{report.reportedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#0F172A] border-b border-[#E2E8F0] pb-2">
                Action & Redressal History
              </h4>
              <div className="space-y-3">
                {incident.timeline.map((event, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="w-2 rounded-full bg-[#0B4EA2] shrink-0 mt-1" />
                    <div className="flex-1 p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                      <div className="flex items-center justify-between font-semibold text-[#0F172A]">
                        <span>{event.status}</span>
                        <span className="text-[#64748B] text-[11px] font-normal">{event.timestamp}</span>
                      </div>
                      <p className="text-[#475569] mt-0.5">{event.note}</p>
                      <span className="text-[10px] text-[#0B4EA2] font-semibold mt-1 block">
                        By {event.author}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ROUTING AUDIT TRAIL */}
          {activeTab === "audit" && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#0F172A] border-b border-[#E2E8F0] pb-2">
                Automated Jurisdiction & Dispatch Trail
              </h4>
              <div className="space-y-2">
                {incident.routingAuditTrail.map((step, i) => (
                  <div key={i} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B4EA2]">{step.level}: {step.entityName}</span>
                      <span className="text-[10px] font-mono text-[#64748B]">{step.method}</span>
                    </div>
                    <p className="text-[#475569]">{step.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs">
          <span className="text-[#64748B]">CivicResolve Master Incident Console • Live Database Synced</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
