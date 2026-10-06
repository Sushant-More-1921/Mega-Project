import React from "react";
import { AdminLoginCard } from "@/components/auth/admin-login-card";
import { ShieldCheck, Lock, Building2 } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-[#EAF2FF] selection:text-[#0B4EA2]">
      {/* Top Admin Security Bar */}
      <header className="w-full bg-white border-b border-[#CBD5E1] py-3.5 px-4 sm:px-8 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#083B7A] flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-[#0F172A] leading-tight">
                  Complaint Intelligence Platform
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-[#EAF2FF] text-[#0B4EA2] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  Admin Gateway
                </span>
              </div>
              <span className="block text-[11px] font-medium text-[#64748B]">
                Directorate of Public Grievance Redressal & Field Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[#0B4EA2] bg-[#EAF2FF] border border-[#BFDBFE] px-3 py-1 rounded-full text-[11px]">
              <Lock className="w-3.5 h-3.5" /> Officer Security Level 2
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header Badge */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#083B7A] flex items-center justify-center text-white shadow-sm ring-4 ring-[#EAF2FF]">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#0B4EA2] bg-[#EAF2FF] px-2.5 py-0.5 rounded-full mb-1.5">
                ADMINISTRATION & SUPERVISION
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                Admin Portal Login
              </h1>
              <p className="text-xs sm:text-sm text-[#475569] mt-1 max-w-xs mx-auto">
                Secure mobile OTP authentication for Department Admins, Supervisors, and Officers.
              </p>
            </div>
          </div>

          <AdminLoginCard />
        </div>
      </div>

      {/* Institutional Security Footer */}
      <footer className="w-full bg-white border-t border-[#CBD5E1] py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Complaint Intelligence Platform. Authorized Department Personnel Only.</p>
          <div className="flex items-center gap-4">
            <Link href="/auth/citizenlogin" className="hover:text-[#0B4EA2] font-medium transition-colors">
              Citizen Portal
            </Link>
            <span className="hover:text-[#0B4EA2] transition-colors cursor-pointer">
              IT Support Desk
            </span>
            <span className="hover:text-[#0B4EA2] transition-colors cursor-pointer">
              System Health
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
