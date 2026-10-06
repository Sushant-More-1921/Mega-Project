import React from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

export function BrandHeader() {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      {/* Institutional Emblem Badge */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-[#EAF2FF] border border-[#CBD5E1] flex items-center justify-center text-[#0B4EA2] shadow-sm">
          <ShieldCheck className="w-8 h-8 text-[#0B4EA2]" />
        </div>
        {/* Subtle AI sparkle chip */}
        <div className="absolute -bottom-1 -right-1 bg-[#F3E8FF] border border-[#DDD6FE] rounded-full p-1 text-[#5B21B6] shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FF] text-[#0B4EA2] border border-[#BFDBFE] mb-2">
          <span>CITIZEN GRIEVANCE PORTAL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
          Complaint Intelligence Platform
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-1 max-w-sm mx-auto">
          Sign in to file civic complaints, track resolution updates, and access AI assistance.
        </p>
      </div>
    </div>
  );
}
