"use client";

import React, { useState } from "react";
import { simulateAutoRoute, AutoRoutingResult } from "@/lib/utils/auto-router";
import { Button } from "@/components/ui/button";
import {
  Navigation,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  AlertCircle,
  MapPin,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AutoRoutingVisualizer() {
  const [addressInput, setAddressInput] = useState("Ward 12, Kolhapur North, Near New High School");
  const [categoryInput, setCategoryInput] = useState("Solid Waste");
  const [routingResult, setRoutingResult] = useState<AutoRoutingResult>(() =>
    simulateAutoRoute(
      "Ward 12, Kolhapur North, Near New High School",
      "Solid Waste",
      { lat: 16.7120, lng: 74.2380 }
    )
  );

  const handleTestRoute = (addr: string, cat: string, lat?: number, lng?: number) => {
    setAddressInput(addr);
    setCategoryInput(cat);
    const coords = lat && lng ? { lat, lng } : undefined;
    const result = simulateAutoRoute(addr, cat, coords);
    setRoutingResult(result);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#0B4EA2]" />
            <h3 className="font-extrabold text-base sm:text-lg text-[#0F172A]">
              Automated Complaint Routing Pipeline
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Strict algorithm: <strong>GPS/Address → Division → Authority → Department → Officer</strong>.
          </p>
        </div>

        {/* Security Rule Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>Manual Citizen Officer Selection: STRICTLY FORBIDDEN</span>
        </div>
      </div>

      {/* Preset simulation buttons */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
          Quick Test Case Presets:
        </span>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              handleTestRoute(
                "Ward 12, Kolhapur North, Near New High School",
                "Solid Waste",
                16.7120,
                74.2380
              )
            }
            className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EAF2FF] hover:border-[#0B4EA2] text-[#0F172A] font-medium transition-colors"
          >
            📍 Kolhapur North (Solid Waste)
          </button>
          <button
            type="button"
            onClick={() =>
              handleTestRoute(
                "Market Yard Road, Sector 4, Opposite Bank, Kolhapur",
                "Water Supply",
                16.7025,
                74.2415
              )
            }
            className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EAF2FF] hover:border-[#0B4EA2] text-[#0F172A] font-medium transition-colors"
          >
            📍 Market Yard Kolhapur (Water Supply)
          </button>
          <button
            type="button"
            onClick={() =>
              handleTestRoute(
                "Kothrud, Near MIT College Road, Pune",
                "Solid Waste",
                18.5074,
                73.8077
              )
            }
            className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EAF2FF] hover:border-[#0B4EA2] text-[#0F172A] font-medium transition-colors"
          >
            📍 Pune Kothrud (Bio-Waste)
          </button>
          <button
            type="button"
            onClick={() =>
              handleTestRoute(
                "Shivajinagar, Model Colony Road, Pune",
                "Water Supply",
                18.5314,
                73.8446
              )
            }
            className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EAF2FF] hover:border-[#0B4EA2] text-[#0F172A] font-medium transition-colors"
          >
            📍 Pune Shivajinagar (Water Pipeline)
          </button>
        </div>
      </div>

      {/* Visual Step-by-Step Flow */}
      <div className="bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] p-4 sm:p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0B4EA2] block">
          Current Automated Dispatch Resolution:
        </span>

        {/* Pipeline Step Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
          {/* Step 1: Ingress */}
          <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              1. Input Signal
            </span>
            <strong className="text-xs font-bold text-[#0F172A] block truncate">
              {addressInput.split(",")[0]}
            </strong>
            <span className="text-[11px] text-[#0B4EA2] font-semibold block">
              Cat: {categoryInput}
            </span>
          </div>

          {/* Step 2: Division */}
          <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B21B6] block">
              2. Matched Division
            </span>
            <strong className="text-xs font-bold text-[#0F172A] block truncate">
              {routingResult.division.name}
            </strong>
            <span className="text-[10px] text-[#16A34A] font-semibold block">
              ✓ Geo-Polygon Match
            </span>
          </div>

          {/* Step 3: Local Authority */}
          <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] block">
              3. Local Authority
            </span>
            <strong className="text-xs font-bold text-[#0F172A] block truncate">
              {routingResult.authority.name}
            </strong>
            <span className="text-[10px] text-[#0F766E] font-semibold block">
              Municipal Corporation
            </span>
          </div>

          {/* Step 4: Department */}
          <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45309] block">
              4. Department
            </span>
            <strong className="text-xs font-bold text-[#0F172A] block truncate">
              {routingResult.department.name}
            </strong>
            <span className="text-[10px] text-[#B45309] font-semibold block">
              NLP Category Route
            </span>
          </div>

          {/* Step 5: Officer */}
          <div className="p-3.5 rounded-xl bg-white border-2 border-[#16A34A] shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] block">
              5. Allocated Officer
            </span>
            <strong className="text-xs font-bold text-[#0F172A] block truncate">
              {routingResult.officer.name}
            </strong>
            <span className="text-[10px] text-[#16A34A] font-semibold block">
              Active Queue: {routingResult.officer.workload} cases
            </span>
          </div>
        </div>

        {/* Detailed Audit Trail Table */}
        <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block mb-2">
            Execution Log & Bounding Proof:
          </span>
          <div className="space-y-1.5 text-xs">
            {routingResult.steps.map((s, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0B4EA2]">{s.level}:</span>
                    <strong className="text-[#0F172A]">{s.entityName}</strong>
                  </div>
                  <p className="text-[11px] text-[#475569]">{s.details}</p>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded shrink-0">
                  {s.method}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
