"use client";

import React, { useState } from "react";
import { Complaint } from "@/types/complaint";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Camera,
  FileCheck,
  AlertCircle,
  X,
  Upload,
  ShieldCheck,
} from "lucide-react";

interface OfficerResolutionModalProps {
  complaint: Complaint;
  officerName: string;
  onClose: () => void;
  onSubmitResolution: (complaintId: string, evidenceUrl: string, remarks: string) => void;
}

export function OfficerResolutionModal({
  complaint,
  officerName,
  onClose,
  onSubmitResolution,
}: OfficerResolutionModalProps) {
  const [remarks, setRemarks] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState(
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitResolution(complaint.id, evidenceUrl, remarks.trim());
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-lg w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#15803D] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              Field Officer Resolution Protocol
            </div>
            <h3 className="font-extrabold text-lg text-[#0F172A] mt-0.5">
              Submit Resolution Proof
            </h3>
            <span className="font-mono text-xs text-[#0B4EA2] font-semibold">
              Case: {complaint.trackingNumber} • {complaint.title}
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#0F172A]">
              Resolution Evidence Photo URL / Camera Proof *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-[#CBD5E1] text-xs font-mono"
              />
              <span className="p-2.5 rounded-lg bg-[#EAF2FF] text-[#0B4EA2] border border-[#BFDBFE]">
                <Camera className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] block mt-1">
              Geo-tagged photo confirming site restoration or repairs completed.
            </span>
          </div>

          {/* Image preview */}
          {evidenceUrl && (
            <div className="rounded-xl overflow-hidden border border-[#CBD5E1] aspect-video relative max-h-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={evidenceUrl}
                alt="Resolution proof"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                Verified Inspector Evidence
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-[#0F172A]">
              Officer Inspection Remarks & Work Completed *
            </label>
            <textarea
              required
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cleared 2.4 tons of commercial garbage, sanitized area with bleaching powder, and notified school authorities."
              className="w-full p-3 rounded-lg border border-[#CBD5E1] text-xs leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#ECFDF3] border border-[#BBF7D0] text-[#15803D] text-[11px]">
            Submitting this resolution will notify the citizen via OTP for final verification and record your digital sign-off in the state audit log.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="sm"
              isLoading={isSubmitting}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Sign Off & Mark Resolved
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
