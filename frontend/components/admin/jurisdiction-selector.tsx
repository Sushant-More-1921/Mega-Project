"use client";

import React from "react";
import { JurisdictionScope } from "@/types/hierarchy";
import { JURISDICTION_PRESETS } from "@/lib/api/hierarchy";
import { Shield, ChevronDown, Check, Lock, Building2, User, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface JurisdictionSelectorProps {
  currentScope: JurisdictionScope;
  onScopeChange: (scope: JurisdictionScope) => void;
}

export function JurisdictionSelector({
  currentScope,
  onScopeChange,
}: JurisdictionSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const roleColorBadge = (role: JurisdictionScope["role"]) => {
    switch (role) {
      case "STATE_ADMIN":
        return "bg-[#0B4EA2] text-white border-[#083B7A]";
      case "DIVISION_ADMIN":
        return "bg-[#5B21B6] text-white border-[#4C1D95]";
      case "AUTHORITY_ADMIN":
        return "bg-[#0F766E] text-white border-[#115E59]";
      case "DEPARTMENT_OFFICER":
        return "bg-[#F59E0B] text-[#0F172A] border-[#D97706]";
      default:
        return "bg-[#0B4EA2] text-white";
    }
  };

  const getScopeDescription = (scope: JurisdictionScope) => {
    if (scope.role === "STATE_ADMIN") {
      return "Statewide (All Maharashtra Divisions)";
    }
    if (scope.role === "DIVISION_ADMIN") {
      return `${scope.divisionName} Jurisdiction Only`;
    }
    if (scope.role === "AUTHORITY_ADMIN") {
      return `${scope.authorityName} Jurisdiction`;
    }
    if (scope.role === "DEPARTMENT_OFFICER") {
      return `${scope.userDisplayName} (Assigned Cases Only)`;
    }
    return "Custom Jurisdiction";
  };

  return (
    <div className="relative">
      {/* Current Active Jurisdiction Bar */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:border-[#0B4EA2] hover:bg-[#F8FAFC] transition-all text-xs text-left shadow-2xs"
        aria-label="Switch RBAC Jurisdiction"
      >
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border",
              roleColorBadge(currentScope.role)
            )}
          >
            {currentScope.role.replace("_", " ")}
          </span>
          <div className="hidden sm:block">
            <span className="font-bold text-[#0F172A] block leading-tight">
              {currentScope.userDisplayName}
            </span>
            <span className="text-[11px] text-[#64748B] block truncate max-w-[220px]">
              {getScopeDescription(currentScope)}
            </span>
          </div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-[#64748B] ml-1 shrink-0" />
      </button>

      {/* Dropdown Menu for RBAC Presets */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-[#CBD5E1] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="border-b border-[#E2E8F0] pb-2 mb-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#0B4EA2]" />
                Jurisdiction & RBAC Switcher
              </span>
              <span className="text-[10px] bg-[#EAF2FF] text-[#0B4EA2] px-2 py-0.5 rounded font-mono font-semibold">
                Live Demo
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Switch administrative tiers to observe automatic jurisdiction-scoped data isolation.
            </p>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {JURISDICTION_PRESETS.map((preset, idx) => {
              const isSelected =
                preset.role === currentScope.role &&
                preset.divisionId === currentScope.divisionId &&
                preset.authorityId === currentScope.authorityId &&
                preset.officerId === currentScope.officerId;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    onScopeChange(preset);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-start justify-between gap-2",
                    isSelected
                      ? "border-[#0B4EA2] bg-[#EAF2FF]/50 text-[#0F172A]"
                      : "border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase border",
                          roleColorBadge(preset.role)
                        )}
                      >
                        {preset.role.replace("_", " ")}
                      </span>
                      <strong className="text-[#0F172A] text-xs">
                        {preset.roleTitle}
                      </strong>
                    </div>
                    <div className="font-medium text-[#475569] text-[11px]">
                      {preset.userDisplayName}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      Scope: {getScopeDescription(preset)}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#0B4EA2] shrink-0 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
