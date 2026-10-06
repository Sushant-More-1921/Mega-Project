"use client";

import React, { useState } from "react";
import { Officer, OfficerStatus } from "@/types/officer";
import { Complaint } from "@/types/complaint";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficersManagementViewProps {
  officers: Officer[];
  complaints: Complaint[];
  onReassignComplaint: (complaintId: string, officerId: string, officerName: string) => void;
}

export function OfficersManagementView({
  officers,
  complaints,
  onReassignComplaint,
}: OfficersManagementViewProps) {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [assignModalOfficer, setAssignModalOfficer] = useState<Officer | null>(null);

  const filteredOfficers = officers.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.badgeId.toLowerCase().includes(search.toLowerCase()) ||
      o.department.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === "ALL" || o.department === selectedDept;
    const matchesStatus = selectedStatus === "ALL" || o.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const statusBadge = (status: OfficerStatus) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF3] text-[#15803D] border border-[#BBF7D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Available
          </span>
        );
      case "ON_DUTY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FF] text-[#0B4EA2] border border-[#BFDBFE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B4EA2]" /> On Duty
          </span>
        );
      case "BUSY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF7E6] text-[#B45309] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Heavy Workload
          </span>
        );
      case "OFF_DUTY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" /> Off Duty
          </span>
        );
    }
  };

  const pendingComplaints = complaints.filter(
    (c) => c.status === "SUBMITTED" || c.status === "VALIDATING" || c.assignedOfficer === "Unassigned"
  );

  return (
    <div className="space-y-6">
      {/* Overview stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs text-[#64748B] font-medium block">Total Field Officers</span>
          <span className="text-2xl font-extrabold text-[#0F172A] mt-1 block">
            {officers.length} Active
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs text-[#64748B] font-medium block">Available for Dispatch</span>
          <span className="text-2xl font-extrabold text-[#15803D] mt-1 block">
            {officers.filter((o) => o.status === "AVAILABLE" || o.status === "ON_DUTY").length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs text-[#64748B] font-medium block">Average SLA Efficiency</span>
          <span className="text-2xl font-extrabold text-[#0B4EA2] mt-1 block">94.2%</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs text-[#64748B] font-medium block">Avg Resolution Speed</span>
          <span className="text-2xl font-extrabold text-[#5B21B6] mt-1 block">4.1 Hours</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search officer by name, badge ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#CBD5E1] text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0B4EA2]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#CBD5E1] text-xs sm:text-sm text-[#0F172A] bg-white focus:outline-none focus:border-[#0B4EA2]"
          >
            <option value="ALL">All Departments</option>
            <option value="Waste Management">Waste Management</option>
            <option value="Hydraulics & Water">Hydraulics & Water</option>
            <option value="Public Works (PWD)">Public Works (PWD)</option>
            <option value="Sanitation & Sewerage">Sanitation & Sewerage</option>
            <option value="Power & Street Lighting">Power & Street Lighting</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#CBD5E1] text-xs sm:text-sm text-[#0F172A] bg-white focus:outline-none focus:border-[#0B4EA2]"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ON_DUTY">ON DUTY</option>
            <option value="BUSY">BUSY</option>
            <option value="OFF_DUTY">OFF DUTY</option>
          </select>
        </div>
      </div>

      {/* Officers Roster Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#0F172A]">
              Department Officers Roster & Workload ({filteredOfficers.length})
            </h3>
            <p className="text-xs text-[#64748B]">
              Real-time workload distribution, contact details, and complaint assignment.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Officer / Badge ID</th>
                <th className="py-3 px-4">Department & Zone</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4">Active Workload</th>
                <th className="py-3 px-4">Resolved All-Time</th>
                <th className="py-3 px-4">Performance Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredOfficers.map((o) => (
                <tr key={o.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="block font-bold text-[#0F172A]">{o.name}</span>
                    <span className="block font-mono text-[11px] text-[#0B4EA2] font-semibold">
                      {o.badgeId} • {o.designation}
                    </span>
                    <span className="block text-xs text-[#64748B] mt-0.5">
                      📞 {o.mobileNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="block font-medium text-[#0F172A]">{o.department}</span>
                    <span className="block text-xs text-[#64748B]">📍 {o.assignedZone}</span>
                  </td>

                  <td className="py-3.5 px-4">{statusBadge(o.status)}</td>

                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs",
                        o.assignedComplaintsCount >= 5
                          ? "bg-[#FEF2F2] text-[#DC2626] font-bold"
                          : "bg-[#EAF2FF] text-[#0B4EA2]"
                      )}
                    >
                      {o.assignedComplaintsCount} Complaints
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[#15803D] font-bold">
                    {o.resolvedComplaintsCount} Cases
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#16A34A] h-full rounded-full"
                          style={{ width: `${o.performanceScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-[#0F172A]">
                        {o.performanceScore}%
                      </span>
                    </div>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">
                      Avg: {o.averageResolutionHours} hrs/case
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setAssignModalOfficer(o)}
                      className="text-xs h-8"
                      disabled={o.status === "OFF_DUTY"}
                    >
                      Assign Case
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Assign Modal */}
      {assignModalOfficer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">
                  Assign Complaint to {assignModalOfficer.name}
                </h3>
                <span className="text-xs text-[#64748B]">
                  {assignModalOfficer.badgeId} • {assignModalOfficer.department}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOfficer(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Select from pending or unassigned civic grievances to allocate:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {complaints.slice(0, 5).map((comp) => (
                <div
                  key={comp.id}
                  className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0B4EA2] transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#0B4EA2]">
                      {comp.trackingNumber}
                    </span>
                    <span className="font-semibold text-[#0F172A] block truncate max-w-xs">
                      {comp.title}
                    </span>
                    <span className="text-[#64748B]">📍 {comp.location}</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={() => {
                      onReassignComplaint(comp.id, assignModalOfficer.id, assignModalOfficer.name);
                      setAssignModalOfficer(null);
                    }}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignModalOfficer(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
