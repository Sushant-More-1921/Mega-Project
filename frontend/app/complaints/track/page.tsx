"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Share2,
  Check,
  Sparkles,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { PriorityBadge } from "@/components/common/priority-badge";
import {
  askComplaintAssistantApi,
  trackComplaintApi,
  BackendComplaintStatus,
  TrackedComplaint,
} from "@/lib/api/complaint-client";
import { MasterIncident, CitizenReport } from "@/types/incident";
import { Complaint, ComplaintStatus } from "@/types/complaint";
import ROUTES from "@/config/routes";

const TRACKED_STATUS_MAP: Record<BackendComplaintStatus, ComplaintStatus> = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "VALIDATING",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  REJECTED: "REJECTED",
};

function TrackComplaintContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(initialId);
  const [activeQuery, setActiveQuery] = useState(initialId);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    incident: MasterIncident;
    report?: CitizenReport;
    complaint: Complaint;
  } | null>(null);

  const [hasSearched, setHasSearched] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [isAskingAssistant, setIsAskingAssistant] = useState(false);

  const mapTrackedComplaint = (c: TrackedComplaint) => {
    const status = TRACKED_STATUS_MAP[c.status];
    const coordinates =
      c.latitude != null && c.longitude != null
        ? { lat: c.latitude, lng: c.longitude }
        : { lat: 0, lng: 0 };
    const createdAt = new Date(c.createdAt).toLocaleString();
    const slaDeadline = c.slaDeadline
      ? new Date(c.slaDeadline).toLocaleString()
      : "Not available";
    const timeline = (c.timeline || []).map((item) => ({
      status: TRACKED_STATUS_MAP[item.status],
      timestamp: new Date(item.createdAt).toLocaleString(),
      note: item.note,
      author: item.author,
    }));
    const complaint = {
      id: c.id,
      trackingNumber: c.trackingNumber,
      title: c.title,
      description: c.description,
      category: c.category,
      subcategory: c.subcategory || undefined,
      divisionId: c.divisionId || "div-kolhapur",
      divisionName: c.divisionName || "Kolhapur Division",
      districtId: c.districtId || "dist-kolhapur",
      districtName: c.districtName || "Kolhapur District",
      authorityId: c.authorityId || "auth-kmc",
      authorityName: c.authorityName || "Kolhapur Municipal Corporation (KMC)",
      departmentId: c.departmentId || "",
      department: c.department?.name || "Awaiting department allocation",
      location: c.location,
      region: c.region || "Not specified",
      coordinates,
      status,
      priority: c.priority,
      assignedOfficer: c.assignedOfficerName || undefined,
      assignedOfficerId: c.assignedOfficerId || undefined,
      citizenMobile: c.citizen?.phoneNumber || "",
      citizenName: c.citizen?.name || "Citizen",
      date: c.createdAt.slice(0, 10),
      createdAt,
      updatedAt: new Date(c.updatedAt).toLocaleString(),
      imageUrl: c.imageUrl || undefined,
      aiConfidence: c.aiConfidence == null ? undefined : Math.round(c.aiConfidence * 100),
      aiSuggestedCategory: c.aiSuggestedCategory || undefined,
      aiReasoning: c.aiReasoning || undefined,
      timeline,
      routingAuditTrail: [],
    } satisfies Complaint;
    const parsedDeadline = c.slaDeadline ? new Date(c.slaDeadline).getTime() : Date.now();
    const remainingMinutes = Math.round((parsedDeadline - Date.now()) / 60000);
    const incident: MasterIncident = {
      id: c.id,
      incidentNumber: c.trackingNumber,
      title: c.title,
      description: c.description,
      category: c.category,
      subcategory: c.subcategory || undefined,
      divisionId: complaint.divisionId,
      divisionName: complaint.divisionName,
      districtId: complaint.districtId,
      districtName: complaint.districtName,
      authorityId: complaint.authorityId,
      authorityName: complaint.authorityName,
      departmentId: complaint.departmentId,
      department: complaint.department,
      location: c.location,
      region: complaint.region,
      coordinates,
      status,
      priority: c.priority,
      assignedOfficer: c.assignedOfficerName || undefined,
      assignedOfficerId: c.assignedOfficerId || undefined,
      complaintCount: 1,
      supportingReports: [],
      firstReportedAt: createdAt,
      lastReportedAt: complaint.updatedAt,
      createdAtTimestamp: new Date(c.createdAt).getTime(),
      lastReportedTimestamp: new Date(c.updatedAt).getTime(),
      slaHours: c.slaHours || 24,
      slaDeadline,
      slaRemainingMinutes: remainingMinutes,
      isSlaBreached: remainingMinutes < 0,
      imageUrl: c.imageUrl || undefined,
      aiConfidence: complaint.aiConfidence ?? 0,
      aiSuggestedCategory: c.aiSuggestedCategory || c.category,
      aiReasoning: c.aiReasoning || "AI triage assessment",
      timeline,
      routingAuditTrail: [],
      resolutionEvidence: c.resolutionRemarks
        ? {
            remarks: c.resolutionRemarks,
            imageUrl: c.resolutionImageUrl || "",
            uploadedAt: complaint.updatedAt,
            uploadedBy: c.assignedOfficerName || "Field Officer",
            inspectionPassed: true,
          }
        : undefined,
    };
    const report: CitizenReport = {
      id: c.id,
      trackingNumber: c.trackingNumber,
      citizenName: complaint.citizenName || "Citizen",
      citizenMobile: complaint.citizenMobile,
      description: c.description,
      location: c.location,
      coordinates,
      imageUrl: c.imageUrl || undefined,
      reportedAt: createdAt,
      timestamp: new Date(c.createdAt).getTime(),
      channel: "WEB_PORTAL",
      aiConfidence: complaint.aiConfidence,
    };
    return { incident, complaint, report };
  };

  useEffect(() => {
    if (!activeQuery.trim()) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      setIsLoading(true);
      setSearchError(null);

      // 1. Try real backend API
      trackComplaintApi(activeQuery.trim())
        .then((c) => {
          if (!isMounted) return;
          setResult(mapTrackedComplaint(c));
          setAssistantAnswer(null);
          setAssistantError(null);
          setHasSearched(true);
          setIsLoading(false);
        })
        .catch((error: Error & { statusCode?: number }) => {
          if (!isMounted) return;
          if (error.statusCode === 404) {
            setResult(null);
            setSearchError(`Complaint Number "${activeQuery.trim()}" not found.`);
          } else {
            setResult(null);
            setSearchError(error.message || "Could not load complaint status.");
          }
          setHasSearched(true);
          setIsLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setActiveQuery(searchId.trim());
      setAssistantOpen(false);
      setAssistantAnswer(null);
      setAssistantError(null);
    }
  };

  const handleAskAssistant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!result || !assistantQuestion.trim()) return;
    setIsAskingAssistant(true);
    setAssistantError(null);
    setAssistantAnswer(null);
    try {
      const response = await askComplaintAssistantApi({
        tracking_number: result.complaint.trackingNumber,
        question: assistantQuestion.trim(),
        language: "en",
      });
      setAssistantAnswer(response.answer);
    } catch (error) {
      setAssistantError(
        error instanceof Error ? error.message : "The assistant could not answer right now."
      );
    } finally {
      setIsAskingAssistant(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-[#EAF2FF] selection:text-[#0B4EA2]">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3.5 px-4 sm:px-8 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href={ROUTES.HOME} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B4EA2] flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-bold text-[#0F172A] leading-tight">
                CivicResolve
              </span>
              <span className="block text-[11px] text-[#64748B]">
                Track Grievance Status
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={ROUTES.CITIZEN.NEW_COMPLAINT}>
              <Button size="sm" variant="primary" className="text-xs font-semibold">
                Register Complaint
              </Button>
            </Link>
            <Link href={ROUTES.CITIZEN.DASHBOARD}>
              <Button size="sm" variant="outline" className="text-xs border-[#CBD5E1]">
                My Complaints
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Track Workspace */}
      <main className="max-w-4xl w-full mx-auto py-8 px-4 sm:px-6 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-6">
          <Link href={ROUTES.HOME} className="hover:text-[#0B4EA2] flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span>/</span>
          <span className="text-[#0F172A] font-semibold">Track Complaint Status</span>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6 mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-1">
            Track Complaint Status
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mb-5">
            Enter your official Complaint Number (e.g., CMP-2026-1042 or CMP-1042) to inspect real-time status, assigned officer, and updates.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Complaint Number (e.g., CMP-2026-1042)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] font-mono font-medium placeholder:font-sans placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#EAF2FF]"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="h-11" isLoading={isLoading}>
              Check Status
            </Button>
          </form>

          {searchError && (
            <div className="mt-3 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium">
              {searchError}
            </div>
          )}

          {/* Quick Demo Pre-fills */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#F1F5F9] text-xs">
            <span className="text-[#64748B] font-medium">Sample Complaint Numbers:</span>
            {["CMP-2026-1042", "CMP-2026-1041"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchId(id);
                  setActiveQuery(id);
                }}
                className="px-2.5 py-1 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B4EA2] font-mono text-[11px] font-bold transition-colors"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Display */}
        {result ? (
          <div className="space-y-6">
            {/* Top Summary Card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className="font-mono text-sm sm:text-base font-extrabold text-[#0B4EA2] bg-[#EAF2FF] border border-[#BFDBFE] px-2.5 py-0.5 rounded-md">
                      {result.report?.trackingNumber || result.incident.incidentNumber}
                    </span>
                    <StatusBadge status={result.incident.status} size="md" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                    {result.incident.title}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#0B4EA2]" />
                    <span>{result.incident.location}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="text-xs"
                    leftIcon={copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Share2 className="w-3.5 h-3.5" />}
                  >
                    {copied ? "Link Copied" : "Share Status"}
                  </Button>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-[#FAFAFA] border-b border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] block font-medium">Jurisdiction Authority</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block truncate">
                    {result.incident.authorityName}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block font-medium">Department</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block truncate">
                    {result.incident.department}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block font-medium">Assigned Officer</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block truncate">
                    {result.incident.assignedOfficer ? `👤 ${result.incident.assignedOfficer}` : "Awaiting Ward Allocation"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block font-medium">SLA Resolution Target</span>
                  <span className="font-semibold text-[#0B4EA2] mt-0.5 block">
                    {result.incident.slaDeadline}
                  </span>
                </div>
              </div>

              {/* Description & AI Assessment */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    Grievance Description
                  </h3>
                  <p className="text-sm text-[#1E293B] leading-relaxed">
                    {result.report?.description || result.incident.description}
                  </p>
                </div>

                {result.incident.imageUrl && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                      Citizen Uploaded Evidence
                    </h3>
                    <div className="w-full max-w-sm rounded-lg overflow-hidden border border-[#E2E8F0]">
                      <img
                        src={result.incident.imageUrl}
                        alt="Incident"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Multiple Citizen Reports Linked Badge */}
                {result.incident.complaintCount > 1 && (
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0B4EA2] text-white flex items-center justify-center font-bold text-[11px]">
                        {result.incident.complaintCount}
                      </span>
                      <span>
                        <strong>Ward Area Cluster:</strong> {result.incident.complaintCount} citizens have reported this incident. Consolidating into a unified resolution ticket.
                      </span>
                    </div>
                  </div>
                )}

                {/* Resolution Evidence Box if RESOLVED */}
                {result.incident.resolutionEvidence && (
                  <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#BBF7D0] space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#15803D]">
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                      <span>Resolution Sign-Off by Field Officer</span>
                    </div>
                    <p className="text-xs text-[#15803D]">
                      Remarks: &quot;{result.incident.resolutionEvidence.remarks}&quot;
                    </p>
                    {result.incident.resolutionEvidence.imageUrl && (
                      <div className="w-full max-w-sm rounded-lg overflow-hidden border border-[#BBF7D0]">
                        <img
                          src={result.incident.resolutionEvidence.imageUrl}
                          alt="Resolution evidence"
                          className="w-full h-44 object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6">
              <button
                type="button"
                onClick={() => setAssistantOpen((open) => !open)}
                aria-expanded={assistantOpen}
                className="flex items-center gap-2 text-sm font-bold text-[#0B4EA2]"
              >
                <Sparkles className="w-4 h-4" />
                Ask AI about this complaint
              </button>
              {assistantOpen && (
                <div className="mt-4 space-y-3">
                  <form onSubmit={handleAskAssistant} className="flex gap-2">
                    <input
                      value={assistantQuestion}
                      onChange={(event) => setAssistantQuestion(event.target.value)}
                      maxLength={2000}
                      required
                      placeholder="Ask about the current status or next steps"
                      className="min-w-0 flex-1 h-10 px-3 rounded-lg border border-[#CBD5E1] text-sm focus:outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#EAF2FF]"
                    />
                    <Button type="submit" size="sm" isLoading={isAskingAssistant} aria-label="Ask AI">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  {assistantAnswer && (
                    <p className="p-3 rounded-lg bg-[#F3E8FF] text-sm text-[#5B21B6]" aria-live="polite">
                      {assistantAnswer}
                    </p>
                  )}
                  {assistantError && (
                    <p className="p-3 rounded-lg bg-[#FEF2F2] text-sm text-[#B91C1C]" role="alert">
                      {assistantError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Audit Timeline Card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] mb-5 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0B4EA2]" />
                <span>Transparent End-to-End Audit Timeline</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                {result.incident.timeline.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#0B4EA2] flex items-center justify-center text-[10px] font-bold text-[#0B4EA2]">
                      ✓
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-lg flex-1 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-[#0F172A]">{item.status}</span>
                        <span className="text-[#64748B] text-[11px] font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-[#475569]">{item.note}</p>
                      {item.author && (
                        <span className="text-[10px] text-[#64748B] mt-1 block">
                          Logged by: <strong>{item.author}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Grievance Not Found</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              No complaint matched tracking code &quot;<strong>{activeQuery}</strong>&quot;. Please ensure you have typed the exact ID format (e.g., CMP-1042) or search from your citizen dashboard.
            </p>
            <div className="pt-2">
              <Link href={ROUTES.CITIZEN.DASHBOARD}>
                <Button size="sm" variant="outline">
                  View All My Complaints
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-[#E2E8F0] py-4 px-4 text-center text-xs text-[#64748B]">
        CivicResolve • Directorate of Municipal & Environmental Services
      </footer>
    </div>
  );
}

export default function TrackComplaintPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[#64748B]">Loading Grievance Tracking...</div>}>
      <TrackComplaintContent />
    </Suspense>
  );
}
