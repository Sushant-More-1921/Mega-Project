"use client";

import React, { useState } from "react";
import { Complaint } from "@/types/complaint";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react";

interface ComplaintsReportsViewProps {
  complaints: Complaint[];
}

export function ComplaintsReportsView({ complaints }: ComplaintsReportsViewProps) {
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isExporting, setIsExporting] = useState(false);

  const filtered = complaints.filter((c) => {
    const matchReg = selectedRegion === "ALL" || c.region === selectedRegion;
    const matchCat = selectedCategory === "ALL" || c.category === selectedCategory;
    return matchReg && matchCat;
  });

  const resolvedCount = filtered.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const escalatedCount = filtered.filter((c) => c.status === "ESCALATED").length;
  const inProgressCount = filtered.filter((c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length;

  // Real CSV export generator
  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = [
        "Tracking ID",
        "Title",
        "Category",
        "Department",
        "Region",
        "Location",
        "Priority",
        "Status",
        "Assigned Officer",
        "Citizen Phone",
        "Date",
      ];

      const rows = filtered.map((c) => [
        `"${c.trackingNumber}"`,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.category}"`,
        `"${c.departmentName || c.department || ""}"`,
        `"${c.region}"`,
        `"${c.location.replace(/"/g, '""')}"`,
        `"${c.priority}"`,
        `"${c.status}"`,
        `"${c.assignedOfficer || "Unassigned"}"`,
        `"${c.citizenMobile}"`,
        `"${c.date}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `CIP_Grievance_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A]">
              Government Grievance Audit & MIS Reporting
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Export standardized operational datasets for departmental reviews and administrative audits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Briefing
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              isLoading={isExporting}
              className="text-xs"
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            >
              Download CSV Data
            </Button>
          </div>
        </div>

        {/* Filter selection controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Time Period Filter
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-xs font-medium text-[#0F172A] bg-white focus:outline-none focus:border-[#0B4EA2]"
            >
              <option value="TODAY">Today (06 Oct 2026)</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">Current Month (October 2026)</option>
              <option value="ALL_TIME">Fiscal Year to Date</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              District Region Filter
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-xs font-medium text-[#0F172A] bg-white focus:outline-none focus:border-[#0B4EA2]"
            >
              <option value="ALL">All District Zones</option>
              <option value="North Zone">North Zone (Ward 12)</option>
              <option value="Central Zone">Central Zone (Market Yard)</option>
              <option value="South Zone">South Zone (Shahupuri)</option>
              <option value="East Zone">East Zone (Shivaji Park)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Civic Category Filter
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-xs font-medium text-[#0F172A] bg-white focus:outline-none focus:border-[#0B4EA2]"
            >
              <option value="ALL">All Categories</option>
              <option value="Solid Waste">Solid Waste</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Road Infrastructure">Road Infrastructure</option>
              <option value="Drainage">Drainage</option>
              <option value="Power & Lighting">Power & Lighting</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs text-[#64748B] font-medium block">Selected Dataset</span>
          <span className="text-2xl font-extrabold text-[#0F172A] mt-1 block">
            {filtered.length} Records
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#BBF7D0] bg-[#ECFDF3]/30 shadow-xs">
          <span className="text-xs text-[#15803D] font-medium block">Resolved Compliance</span>
          <span className="text-2xl font-extrabold text-[#15803D] mt-1 block">
            {resolvedCount} Cases
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#FDE68A] bg-[#FFF7E6]/30 shadow-xs">
          <span className="text-xs text-[#B45309] font-medium block">Under Processing</span>
          <span className="text-2xl font-extrabold text-[#B45309] mt-1 block">
            {inProgressCount} Cases
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2]/30 shadow-xs">
          <span className="text-xs text-[#DC2626] font-medium block">Escalated SLA</span>
          <span className="text-2xl font-extrabold text-[#DC2626] mt-1 block">
            {escalatedCount} Cases
          </span>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
            Report Export Data Preview ({filtered.length} entries)
          </h4>
          <span className="text-xs text-[#64748B]">
            Complies with National Grievance Portal Data Standards
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-4">Tracking ID</th>
                <th className="py-2.5 px-4">Grievance Title</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Zone / Location</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Officer In-Charge</th>
                <th className="py-2.5 px-4">Logged Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-2.5 px-4 font-mono font-bold text-[#0B4EA2]">
                    {item.trackingNumber}
                  </td>
                  <td className="py-2.5 px-4 max-w-xs truncate font-medium text-[#0F172A]">
                    {item.title}
                  </td>
                  <td className="py-2.5 px-4 text-[#475569]">{item.category}</td>
                  <td className="py-2.5 px-4 text-[#475569]">
                    {item.region} • {item.location}
                  </td>
                  <td className="py-2.5 px-4 font-bold">{item.priority}</td>
                  <td className="py-2.5 px-4 font-semibold">{item.status}</td>
                  <td className="py-2.5 px-4 text-[#475569]">
                    {item.assignedOfficer || "Unassigned"}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#64748B]">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
