"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Shield,
  UserCheck,
  MapPin,
  Camera,
  Mic,
  Send,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionUser, clearSession } from "@/lib/auth/session";
import { AuthUser } from "@/types/auth";
import Link from "next/link";

export default function NewComplaintPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/auth/citizenlogin");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3 px-4 sm:px-8 sticky top-0 z-30 shadow-xs">
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
                Citizen Grievance Submission Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-[#EAF2FF] border border-[#BFDBFE] px-3 py-1.5 rounded-lg text-xs font-medium text-[#0B4EA2]">
                <UserCheck className="w-4 h-4 text-[#0B4EA2]" />
                <span className="font-semibold">{user.mobileNumber}</span>
                <span className="hidden sm:inline text-[#16A34A] bg-[#ECFDF3] px-1.5 py-0.5 rounded text-[10px] font-bold">
                  VERIFIED
                </span>
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-3xl w-full mx-auto py-8 px-4 sm:px-6 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-4">
          <Link
            href="/auth/citizenlogin"
            className="hover:text-[#0B4EA2] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
          <span>/</span>
          <span className="text-[#0F172A] font-semibold">New Complaint</span>
        </div>

        {/* Success Banner upon OTP Login */}
        <div className="mb-6 bg-[#ECFDF3] border border-[#BBF7D0] text-[#15803D] p-4 rounded-xl flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0">
            ✓
          </div>
          <div>
            <h4 className="font-bold text-sm">Authentication Successful!</h4>
            <p className="text-xs text-[#15803D] mt-0.5">
              You are logged in via OTP verification. You can now lodge your official civic grievance below.
            </p>
          </div>
        </div>

        {/* Complaint Submission Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          <div className="border-b border-[#E2E8F0] pb-5 mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B4EA2] bg-[#EAF2FF] px-2.5 py-1 rounded-md mb-2">
              <FileText className="w-3.5 h-3.5" /> LODGE CITIZEN GRIEVANCE
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              Submit a New Civic Complaint
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Provide incident details. Our AI engine will automatically classify, assess priority, and route to the concerned municipal department.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmitting(true);
              setTimeout(() => {
                setIsSubmitting(false);
                setSubmitted(true);
              }, 1000);
            }}
            className="space-y-6"
          >
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                Grievance Category <span className="text-[#DC2626]">*</span>
              </label>
              <select
                required
                className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#EAF2FF]"
              >
                <option value="">Select category...</option>
                <option value="waste">Solid Waste / Garbage Disposal</option>
                <option value="roads">Potholes & Road Maintenance</option>
                <option value="water">Water Supply & Leakage</option>
                <option value="drainage">Sewage & Drainage Overflow</option>
                <option value="streetlights">Streetlight Malfunction</option>
                <option value="other">Other Civic Issue</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                Complaint Description <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe the issue in detail (location, severity, duration)..."
                className="w-full p-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#EAF2FF] resize-none"
              ></textarea>
              <p className="text-xs text-[#64748B] mt-1">
                Be specific with landmarks or nearby public structures to speed up resolution.
              </p>
            </div>

            {/* AI Assistant Preview Box */}
            <div className="p-4 rounded-xl bg-[#F3E8FF] border border-[#DDD6FE] text-[#5B21B6] space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="w-4 h-4 text-[#5B21B6]" />
                <span>AI Automated Intake Assistant</span>
              </div>
              <p className="text-xs text-[#5B21B6]/90 leading-relaxed">
                Our NLP models will analyze your text upon submission to automatically identify severity, detect duplicate issues in your neighborhood, and ping the field officer directly.
              </p>
            </div>

            {/* Location & Multimedia Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#0B4EA2]" />
                <div className="text-left text-xs">
                  <span className="font-semibold text-[#0F172A] block">Auto GPS Location</span>
                  <span className="text-[#64748B]">Detecting coordinates...</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3">
                <Camera className="w-5 h-5 text-[#0B4EA2]" />
                <div className="text-left text-xs">
                  <span className="font-semibold text-[#0F172A] block">Attach Geo-tagged Photo</span>
                  <span className="text-[#64748B]">Optional image proof</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <Link href="/auth/citizenlogin">
                <Button variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Submit Grievance
              </Button>
            </div>
          </form>

          {submitted && (
            <div className="mt-6 p-4 rounded-lg bg-[#ECFDF3] border border-[#BBF7D0] text-[#15803D] text-sm text-center font-medium">
              Grievance CMP-{Math.floor(1000 + Math.random() * 9000)} registered successfully! Officer will be assigned.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-[#E2E8F0] py-4 px-4 text-center text-xs text-[#64748B]">
        Complaint Intelligence Platform • Government of India Public Services
      </footer>
    </div>
  );
}
