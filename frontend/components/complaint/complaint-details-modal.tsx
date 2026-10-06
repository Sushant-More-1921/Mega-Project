"use client";

import React, { useState } from "react";
import { Complaint, ComplaintStatus } from "@/types/complaint";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  officers: Officer[];
  onClose: () => void;
  onReassignOfficer: (complaintId: string, officerId: string, officerName: string) => void;
  onUpdateStatus?: (complaintId: string, newStatus: ComplaintStatus) => void;
}

export function ComplaintDetailsModal({
  complaint,
  officers,
  onClose,
  onReassignOfficer,
  onUpdateStatus,
}: ComplaintDetailsModalProps) {
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  if (!complaint) return null;

  const handleReassign = () => {
    const officer = officers.find((o) => o.id === selectedOfficerId);
    if (!officer) return;
    setIsUpdating(true);
    setTimeout(() => {
      onReassignOfficer(complaint.id, officer.id, officer.name);
      setIsUpdating(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#E2E8F0] flex items-start justify-between gap-4 bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[#0B4EA2] bg-[#EAF2FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                {complaint.trackingNumber}
              </span>
              <PriorityBadge priority={complaint.priority} size="sm" />
              <StatusBadge status={complaint.status} size="sm" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
              {complaint.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1">
              <span>📍 {complaint.location}</span>
              <span>•</span>
              <span>🕒 Logged: {complaint.createdAt}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Image Proof & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Image photo slot */}
            <div className="sm:col-span-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Citizen Photo Proof
              </span>
              <div
                className="relative rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#F1F5F9] aspect-4/3 group cursor-pointer"
                onClick={() => setImageExpanded(!imageExpanded)}
              >
                {complaint.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={complaint.imageUrl}
                    alt={complaint.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-[#64748B]">
                    No Photo Attached
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  Geo-Tagged
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="sm:col-span-2 space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Incident Narrative
              </span>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] leading-relaxed">
                {complaint.description}
              </div>

              {/* Citizen Details bar */}
              <div className="p-2.5 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs text-[#475569] bg-white">
                <div>
                  <span className="text-[#64748B]">Complainant:</span>{" "}
                  <strong>{complaint.citizenName || "Verified Citizen"}</strong>
                </div>
                <div className="font-mono text-[#0B4EA2] font-semibold">
                  📞 {complaint.citizenMobile}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: AI Result Card Standard (README Section 16) */}
          <div className="rounded-xl border border-[#DDD6FE] bg-[#F3E8FF] p-4 text-[#5B21B6] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#5B21B6]" />
                <span>✨ AI Intelligence Engine Analysis</span>
              </div>
              <span className="text-xs bg-white text-[#5B21B6] font-bold px-2 py-0.5 rounded-full border border-[#DDD6FE]">
                Confidence: {complaint.aiConfidence || 94}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white/70 p-2.5 rounded-lg border border-[#DDD6FE]/60">
              <div>
                <span className="text-[#64748B] block text-[10px]">Category:</span>
                <span className="font-bold text-[#0F172A]">{complaint.category}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Subcategory:</span>
                <span className="font-bold text-[#0F172A]">
                  {complaint.subcategory || "Civic Hazard"}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Zone Classification:</span>
                <span className="font-bold text-[#0F172A]">{complaint.region}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Urgency Flag:</span>
                <span className="font-bold text-[#DC2626]">{complaint.priority}</span>
              </div>
            </div>

            {complaint.aiReasoning && (
              <div className="text-xs text-[#5B21B6]/90 leading-relaxed pt-1">
                <strong className="block text-[#5B21B6] font-semibold">AI Reasoning:</strong>
                {complaint.aiReasoning}
              </div>
            )}
          </div>

          {/* Section 3: Officer Assignment & Reassignment */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0B4EA2]" />
                <h4 className="font-bold text-sm text-[#0F172A]">
                  Officer In-Charge Allocation
                </h4>
              </div>
              <span className="text-xs font-semibold text-[#0B4EA2]">
                Current: {complaint.assignedOfficer || "Unassigned"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-[#CBD5E1] text-xs sm:text-sm text-[#0F172A] bg-white focus:outline-none focus:border-[#0B4EA2]"
              >
                <option value="">Select officer from department roster to reassign...</option>
                {officers.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.name} ({off.department}) • Status: {off.status} ({off.assignedComplaintsCount} cases)
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                size="md"
                onClick={handleReassign}
                disabled={!selectedOfficerId || isUpdating}
                isLoading={isUpdating}
                className="text-xs h-10 shrink-0"
              >
                Reassign Officer
              </Button>
            </div>
          </div>

          {/* Section 4: Resolution Lifecycle Timeline */}
          <div>
            <h4 className="font-bold text-sm text-[#0F172A] mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0B4EA2]" />
              <span>Grievance Resolution Lifecycle Audit</span>
            </h4>

            <div className="space-y-3 border-l-2 border-[#CBD5E1] ml-2 pl-4 py-1">
              {complaint.timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#0B4EA2] ring-4 ring-white" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-[#0F172A] flex items-center gap-2">
                      <StatusBadge status={event.status} size="sm" />
                      <span>{event.author}</span>
                    </span>
                    <span className="font-mono text-[#64748B] text-[11px]">
                      {event.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                    {event.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">
            District Portal: <strong>Kolhapur Municipal Corporation</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close Details
            </Button>
            {complaint.status !== "RESOLVED" && onUpdateStatus && (
              <Button
                variant="success"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onUpdateStatus(complaint.id, "RESOLVED");
                  onClose();
                }}
              >
                Mark as Resolved
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
