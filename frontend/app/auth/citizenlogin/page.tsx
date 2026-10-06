import React from "react";
import { BrandHeader } from "@/components/common/brand-header";
import { LoginCard } from "@/components/auth/login-card";
import { Shield, PhoneCall, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CitizenLoginPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-[#EAF2FF] selection:text-[#0B4EA2]">
      {/* Top Portal Navigation Bar */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3.5 px-4 sm:px-8 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B4EA2] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-bold text-[#0F172A] leading-tight">
                Complaint Intelligence Platform
              </span>
              <span className="block text-[11px] font-medium text-[#64748B]">
                Public Grievance Redressal System • Citizen Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-[#475569]">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[#16A34A] bg-[#ECFDF3] border border-[#BBF7D0] px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> 24x7 Active
            </span>
            <Link
              href="/auth/adminlogin"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B4EA2] hover:text-[#083B7A] bg-[#EAF2FF] hover:bg-[#dbeafe] border border-[#BFDBFE] px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>Admin / Officer Portal</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Workspace */}
      <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <BrandHeader />
          <LoginCard />
        </div>
      </div>

      {/* Institutional Footer */}
      <footer className="w-full bg-white border-t border-[#E2E8F0] py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Complaint Intelligence Platform. Designed for Citizen Services.</p>
          <div className="flex items-center gap-4">
            <Link href="/auth/adminlogin" className="hover:text-[#0B4EA2] transition-colors">
              Admin Portal
            </Link>
            <span className="hover:text-[#0B4EA2] transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-[#0B4EA2] transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-[#0B4EA2] transition-colors cursor-pointer">
              Citizen Charter
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
