"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  MapPin,
  UserCheck,
  LogOut,
  ChevronRight,
  ExternalLink,
  Building2,
  Share2,
  Check,
  Star,
  User,
  Edit3,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { PriorityBadge } from "@/components/common/priority-badge";
import { subscribeToRealTime } from "@/lib/realtime/events";
import { getSessionUser, getSessionToken, clearSession } from "@/lib/auth/session";
import {
  getMyComplaintsApi,
  TrackedComplaint,
} from "@/lib/api/complaint-client";
import { Complaint, ComplaintStatus, CitizenFeedback } from "@/types/complaint";
import { AuthUser } from "@/types/auth";
import ROUTES from "@/config/routes";

interface CitizenProfileData {
  fullName: string;
  email: string;
  ward: string;
  address: string;
  aadhaarMasked: string;
  smsAlerts: boolean;
}

function toComplaint(
  item: TrackedComplaint,
  mobileNumber: string
): Complaint {
  return {
    id: item.id,
    trackingNumber: item.trackingNumber,
    title: item.title,
    description: item.description,
    category: item.category,
    subcategory: item.subcategory || undefined,
    divisionId: item.divisionId || "",
    divisionName: item.divisionName || "",
    districtId: item.districtId || "",
    districtName: item.districtName || "",
    authorityId: item.authorityId || "",
    authorityName: item.authorityName || "",
    departmentId: item.departmentId || "",
    departmentName: item.department?.name || "",
    department: item.department?.name || "Not assigned",
    location: item.location,
    region: item.districtName || "",
    coordinates: {
      lat: item.latitude ?? 0,
      lng: item.longitude ?? 0,
    },
    status: item.status,
    priority: item.priority,
    assignedOfficer: item.assignedOfficerName || undefined,
    assignedOfficerId: item.assignedOfficerId || undefined,
    citizenMobile: mobileNumber,
    citizenName: item.citizen?.name || undefined,
    date: item.createdAt.slice(0, 10),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    imageUrl: item.imageUrl || undefined,
    aiConfidence:
      item.aiConfidence == null ? undefined : Math.round(item.aiConfidence * 100),
    aiSuggestedCategory: item.aiSuggestedCategory || undefined,
    aiReasoning: item.aiReasoning || undefined,
    timeline: (item.timeline || []).map((entry) => ({
      status: entry.status,
      timestamp: entry.createdAt,
      note: entry.note,
      author: entry.author,
    })),
    routingAuditTrail: [],
  };
}

export default function CitizenDashboardPage() {
  const router = useRouter();

  // Session & Authentication
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [, setToken] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Active Main Navigation Tab
  const [mainTab, setMainTab] = useState<"COMPLAINTS" | "PROFILE" | "FEEDBACK">("COMPLAINTS");

  // Complaints Data
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintLoadError, setComplaintLoadError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Filters & Search
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "RESOLVED" | "ESCALATED" | "NEEDS_FEEDBACK">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Profile State
  const [profile, setProfile] = useState<CitizenProfileData>({
    fullName: "Sunil R. Jadhav",
    email: "sunil.jadhav@citizen.gov.in",
    ward: "Ward 12, Kolhapur North (KMC)",
    address: "142/B, Shivaji Road, Near New High School, Kolhapur",
    aadhaarMasked: "XXXX-XXXX-4819",
    smsAlerts: true,
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState<CitizenProfileData>(profile);

  // Feedback Modal State
  const [feedbackComplaint, setFeedbackComplaint] = useState<Complaint | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackSatisfaction, setFeedbackSatisfaction] = useState<
    "VERY_SATISFIED" | "SATISFIED" | "NEUTRAL" | "DISSATISFIED"
  >("VERY_SATISFIED");
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [responseSpeedRating, setResponseSpeedRating] = useState<number>(5);
  const [feedbackComments, setFeedbackComments] = useState<string>("");
  const [isReopenRequested, setIsReopenRequested] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const loadData = useCallback(async (mobileNumber: string, userId: string) => {
    try {
      const backendData = await getMyComplaintsApi();
      let feedbackByTracking: Record<string, CitizenFeedback> = {};
      try {
        const savedFeedback = localStorage.getItem(`civic_feedback_${userId}`);
        if (savedFeedback) {
          const parsed: unknown = JSON.parse(savedFeedback);
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            feedbackByTracking = parsed as Record<string, CitizenFeedback>;
          }
        }
      } catch (error) {
        console.error("Saved citizen feedback could not be loaded.", error);
      }
      setComplaints(
        backendData.map((item) => ({
          ...toComplaint(item, mobileNumber),
          ...(feedbackByTracking[item.trackingNumber]
            ? { feedback: feedbackByTracking[item.trackingNumber] }
            : {}),
        }))
      );
      setComplaintLoadError(null);
    } catch (error) {
      setComplaintLoadError(
        error instanceof Error
          ? error.message
          : "Could not load your complaints. Please try again."
      );
    }
  }, []);

  useEffect(() => {
    const sessionToken = getSessionToken();
    const sessionUser = getSessionUser();
    if (!sessionToken || !sessionUser) {
      router.replace(`${ROUTES.AUTH.CITIZEN_LOGIN}?redirect=/citizen/dashboard`);
      return;
    }

    let isSubscribed = true;
    const timer = setTimeout(() => {
      if (!isSubscribed) return;
      setToken(sessionToken);
      setCurrentUser(sessionUser);

      // Load persistent citizen profile from localStorage
      if (typeof window !== "undefined") {
        const savedProfile = localStorage.getItem(`civic_profile_${sessionUser.mobileNumber}`);
        if (savedProfile) {
          try {
            setProfile(JSON.parse(savedProfile));
          } catch {
            // keep default
          }
        } else if (sessionUser.name) {
          setProfile((prev) => ({ ...prev, fullName: sessionUser.name || prev.fullName }));
        }
      }

      loadData(sessionUser.mobileNumber, sessionUser.id);
      setIsAuthChecking(false);
    }, 0);

    // Live Real-Time Subscription
    const unsubscribe = subscribeToRealTime(() => {
      const activeToken = getSessionToken();
      const activeUser = getSessionUser();
      if (activeToken && activeUser && isSubscribed) {
        loadData(activeUser.mobileNumber, activeUser.id);
      }
    });

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [loadData, router]);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    router.push(ROUTES.HOME);
  };

  const handleCopyTracking = (trackingId: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(trackingId);
      setCopiedId(trackingId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(tempProfile);
    if (typeof window !== "undefined" && currentUser) {
      localStorage.setItem(`civic_profile_${currentUser.mobileNumber}`, JSON.stringify(tempProfile));
    }
    setIsProfileModalOpen(false);
    setFeedbackNotice("Citizen profile details updated successfully.");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Submit Feedback Handler
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComplaint) return;

    const feedbackPayload: CitizenFeedback = {
      complaintId: feedbackComplaint.id,
      trackingNumber: feedbackComplaint.trackingNumber,
      citizenMobile: currentUser?.mobileNumber || feedbackComplaint.citizenMobile,
      rating: feedbackRating,
      satisfactionLevel: feedbackSatisfaction,
      resolutionQualityRating: qualityRating,
      responseTimeRating: responseSpeedRating,
      comments: feedbackComments.trim() || "Resolution inspected by citizen.",
      submittedAt: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      reopenRequested: isReopenRequested,
    };

    if (currentUser && typeof window !== "undefined") {
      const storageKey = `civic_feedback_${currentUser.id}`;
      const savedFeedback = JSON.parse(localStorage.getItem(storageKey) || "{}") as Record<
        string,
        CitizenFeedback
      >;
      savedFeedback[feedbackComplaint.trackingNumber] = feedbackPayload;
      localStorage.setItem(storageKey, JSON.stringify(savedFeedback));
      setComplaints((current) =>
        current.map((complaint) =>
          complaint.trackingNumber === feedbackComplaint.trackingNumber
            ? { ...complaint, feedback: feedbackPayload }
            : complaint
        )
      );
    }

    setFeedbackComplaint(null);
    setFeedbackComments("");
    setFeedbackNotice(
      isReopenRequested
        ? `Feedback logged: Complaint #${feedbackComplaint.trackingNumber} has been reopened for supervisory review.`
        : `Thank you! Feedback for #${feedbackComplaint.trackingNumber} submitted successfully.`
    );
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const openFeedbackModal = (c: Complaint) => {
    setFeedbackComplaint(c);
    if (c.feedback) {
      setFeedbackRating(c.feedback.rating);
      setFeedbackSatisfaction(c.feedback.satisfactionLevel);
      setQualityRating(c.feedback.resolutionQualityRating || 5);
      setResponseSpeedRating(c.feedback.responseTimeRating || 5);
      setFeedbackComments(c.feedback.comments || "");
      setIsReopenRequested(false);
    } else {
      setFeedbackRating(5);
      setFeedbackSatisfaction("VERY_SATISFIED");
      setQualityRating(5);
      setResponseSpeedRating(5);
      setFeedbackComments("");
      setIsReopenRequested(false);
    }
  };

  // Dynamic KPI Stats
  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
    const inProgress = complaints.filter(
      (c) =>
        c.status === "ASSIGNED" ||
        c.status === "IN_PROGRESS" ||
        c.status === "VALIDATING" ||
        c.status === "SUBMITTED" ||
        c.status === "REOPENED"
    ).length;
    const escalated = complaints.filter((c) => c.status === "ESCALATED" || c.priority === "VERY_HIGH").length;
    const feedbackCount = complaints.filter((c) => Boolean(c.feedback)).length;
    const needsFeedbackCount = complaints.filter(
      (c) => (c.status === "RESOLVED" || c.status === "CLOSED") && !c.feedback
    ).length;

    return { total, inProgress, resolved, escalated, feedbackCount, needsFeedbackCount };
  }, [complaints]);

  // Filtered complaints based on filter tab and search query
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (filterTab === "ACTIVE") {
        if (c.status === "RESOLVED" || c.status === "CLOSED") return false;
      } else if (filterTab === "RESOLVED") {
        if (c.status !== "RESOLVED" && c.status !== "CLOSED") return false;
      } else if (filterTab === "ESCALATED") {
        if (c.status !== "ESCALATED" && c.priority !== "VERY_HIGH") return false;
      } else if (filterTab === "NEEDS_FEEDBACK") {
        if (c.status !== "RESOLVED" && c.status !== "CLOSED") return false;
        if (c.feedback) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTracking = c.trackingNumber.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesCategory = c.category.toLowerCase().includes(q);
        const matchesLocation = c.location.toLowerCase().includes(q);
        return matchesTracking || matchesTitle || matchesCategory || matchesLocation;
      }

      return true;
    });
  }, [complaints, filterTab, searchQuery]);

  // Visual Civic 4-Step Progression Helper
  const getStepProgress = (status: ComplaintStatus) => {
    switch (status) {
      case "SUBMITTED":
      case "UNDER_REVIEW":
      case "VALIDATING":
        return 1;
      case "ASSIGNED":
        return 2;
      case "IN_PROGRESS":
      case "REOPENED":
      case "ESCALATED":
        return 3;
      case "RESOLVED":
      case "CITIZEN_VERIFICATION":
      case "CLOSED":
        return 4;
      default:
        return 1;
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <div className="w-8 h-8 border-2 border-[#0B4EA2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <h2 className="text-sm font-bold text-[#0F172A]">Loading Citizen Dashboard...</h2>
          <p className="text-xs text-[#64748B] mt-1">Verifying your secure mobile session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-[#EAF2FF] selection:text-[#0B4EA2]">
      {/* ==================== 1. TOP CIVIC HEADER ==================== */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3 px-4 sm:px-8 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href={ROUTES.HOME} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B4EA2] flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-bold text-[#0F172A] leading-tight">
                CivicResolve
              </span>
              <span className="block text-[11px] text-[#64748B]">
                Government Civic Services • Citizen Console
              </span>
            </div>
          </Link>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0F172A]">
                <UserCheck className="w-3.5 h-3.5 text-[#0B4EA2]" />
                <span>{currentUser.mobileNumber}</span>
                <span className="hidden sm:inline text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.2 rounded text-[10px] font-bold">
                  VERIFIED
                </span>
              </div>
            )}

            <Link href={ROUTES.CITIZEN.NEW_COMPLAINT}>
              <Button variant="primary" size="sm" className="text-xs font-semibold" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Register Complaint
              </Button>
            </Link>

            {currentUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-[#64748B]"
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ==================== 2. MAIN DASHBOARD CONTENT ==================== */}
      <main className="max-w-6xl w-full mx-auto py-6 sm:py-8 px-4 sm:px-6 flex-1 space-y-6">
        {/* Feedback Alert Notice */}
        {feedbackNotice && (
          <div className="p-3.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#15803D] font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackNotice(null)}
              className="text-[#15803D] hover:text-[#166534] font-bold"
            >
              ✕
            </button>
          </div>
        )}
        {complaintLoadError && (
          <div role="alert" className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] font-medium">
            {complaintLoadError}
          </div>
        )}

        {/* ==================== CITIZEN INFORMATION CARD ==================== */}
        <section className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xs overflow-hidden">
          <div className="p-5 sm:p-6 bg-gradient-to-r from-[#F8FAFC] to-white border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-[#EAF2FF] border border-[#BFDBFE] text-[#0B4EA2] flex items-center justify-center font-bold text-lg shrink-0">
                <User className="w-7 h-7 text-[#0B4EA2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                    {profile.fullName}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded border border-[#BBF7D0] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Aadhaar Verified
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#0B4EA2]" />
                    <span>{currentUser?.mobileNumber}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#0B4EA2]" />
                    <span>{profile.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0B4EA2]" />
                    <span>{profile.ward}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempProfile(profile);
                  setIsProfileModalOpen(true);
                }}
                className="text-xs border-[#CBD5E1]"
                leftIcon={<Edit3 className="w-3.5 h-3.5 text-[#0B4EA2]" />}
              >
                Edit Citizen Profile
              </Button>
              <Link href={ROUTES.CITIZEN.NEW_COMPLAINT}>
                <Button variant="primary" size="sm" className="text-xs font-bold" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Lodge Grievance
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0] bg-white text-center">
            <div className="p-4">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Total Lodged
              </span>
              <span className="text-2xl font-bold text-[#0F172A] font-mono mt-1 block">
                {stats.total}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 block">Recorded Grievances</span>
            </div>

            <div className="p-4">
              <span className="text-xs font-semibold text-[#B45309] uppercase tracking-wider block">
                Under Process
              </span>
              <span className="text-2xl font-bold text-[#D97706] font-mono mt-1 block">
                {stats.inProgress}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 block">Field Work In Progress</span>
            </div>

            <div className="p-4">
              <span className="text-xs font-semibold text-[#15803D] uppercase tracking-wider block">
                Remediated & Verified
              </span>
              <span className="text-2xl font-bold text-[#16A34A] font-mono mt-1 block">
                {stats.resolved}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 block">Official Photo Proof</span>
            </div>

            <div className="p-4">
              <span className="text-xs font-semibold text-[#0B4EA2] uppercase tracking-wider block">
                Feedback Provided
              </span>
              <span className="text-2xl font-bold text-[#0B4EA2] font-mono mt-1 block">
                {stats.feedbackCount}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 block">
                {stats.needsFeedbackCount > 0
                  ? `${stats.needsFeedbackCount} Awaiting Rating`
                  : "All Ratings Up to Date"}
              </span>
            </div>
          </div>
        </section>

        {/* ==================== DASHBOARD VIEW NAVIGATION TABS ==================== */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMainTab("COMPLAINTS")}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              mainTab === "COMPLAINTS"
                ? "bg-[#0B4EA2] text-white shadow-2xs"
                : "bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#F8FAFC]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Complaints & Status ({complaints.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("FEEDBACK")}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              mainTab === "FEEDBACK"
                ? "bg-[#0B4EA2] text-white shadow-2xs"
                : "bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#F8FAFC]"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>My Feedback & Ratings ({stats.feedbackCount})</span>
            {stats.needsFeedbackCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainTab("PROFILE")}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              mainTab === "PROFILE"
                ? "bg-[#0B4EA2] text-white shadow-2xs"
                : "bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#F8FAFC]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Citizen Profile & Jurisdiction</span>
          </button>
        </div>

        {/* ==================== VIEW 1: COMPLAINTS & STATUS ==================== */}
        {mainTab === "COMPLAINTS" && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-[#CBD5E1] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab("ALL")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                    filterTab === "ALL"
                      ? "bg-[#0B4EA2] text-white"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  All ({complaints.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("ACTIVE")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                    filterTab === "ACTIVE"
                      ? "bg-[#0B4EA2] text-white"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  Under Process ({stats.inProgress})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("RESOLVED")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                    filterTab === "RESOLVED"
                      ? "bg-[#0B4EA2] text-white"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  Resolved ({stats.resolved})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("ESCALATED")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                    filterTab === "ESCALATED"
                      ? "bg-[#0B4EA2] text-white"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  Escalated ({stats.escalated})
                </button>
                {stats.needsFeedbackCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterTab("NEEDS_FEEDBACK")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                      filterTab === "NEEDS_FEEDBACK"
                        ? "bg-[#D97706] text-white"
                        : "bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]"
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    <span>Rate Resolution ({stats.needsFeedbackCount})</span>
                  </button>
                )}
              </div>

              {/* Search box */}
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ID, category, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#CBD5E1] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0B4EA2]"
                />
              </div>
            </div>

            {/* Complaints Cards List */}
            {filteredComplaints.length > 0 ? (
              <div className="space-y-4">
                {filteredComplaints.map((item) => {
                  const currentStep = getStepProgress(item.status);
                  const isResolved = item.status === "RESOLVED" || item.status === "CLOSED";

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xs hover:border-[#94A3B8] transition-all p-5 space-y-4"
                    >
                      {/* Card Header: Tracking Number, Badges & Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#F1F5F9] pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#0B4EA2] bg-[#EAF2FF] border border-[#BFDBFE] px-2.5 py-1 rounded-md">
                            {item.trackingNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(item.trackingNumber)}
                            className="text-[#64748B] hover:text-[#0B4EA2] transition-colors"
                            title="Copy Tracking ID"
                          >
                            {copiedId === item.trackingNumber ? (
                              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                            {item.category}
                          </span>
                          <StatusBadge status={item.status} size="sm" />
                        </div>

                        <span className="text-xs text-[#64748B]">
                          Reported: <strong>{item.createdAt}</strong>
                        </span>
                      </div>

                      {/* 4-STEP CIVIC STATUS STEPPER */}
                      <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
                          Status Progression Tracker:
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {/* Step 1: Lodged */}
                          <div className="space-y-1">
                            <div
                              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                                currentStep >= 1
                                  ? "bg-[#0B4EA2] text-white"
                                  : "bg-[#E2E8F0] text-[#64748B]"
                              }`}
                            >
                              ✓
                            </div>
                            <span className="block text-[11px] font-bold text-[#0F172A]">
                              1. Lodged
                            </span>
                            <span className="hidden sm:block text-[10px] text-[#64748B]">
                              Receipt Issued
                            </span>
                          </div>

                          {/* Step 2: Assigned */}
                          <div className="space-y-1">
                            <div
                              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                                currentStep >= 2
                                  ? "bg-[#0B4EA2] text-white"
                                  : "bg-[#E2E8F0] text-[#64748B]"
                              }`}
                            >
                              {currentStep >= 2 ? "✓" : "2"}
                            </div>
                            <span
                              className={`block text-[11px] font-bold ${
                                currentStep >= 2 ? "text-[#0F172A]" : "text-[#94A3B8]"
                              }`}
                            >
                              2. Assigned
                            </span>
                            <span className="hidden sm:block text-[10px] text-[#64748B]">
                              Ward Officer
                            </span>
                          </div>

                          {/* Step 3: Field Work */}
                          <div className="space-y-1">
                            <div
                              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                                currentStep >= 3
                                  ? isResolved
                                    ? "bg-[#0B4EA2] text-white"
                                    : "bg-[#D97706] text-white"
                                  : "bg-[#E2E8F0] text-[#64748B]"
                              }`}
                            >
                              {currentStep > 3 ? "✓" : "3"}
                            </div>
                            <span
                              className={`block text-[11px] font-bold ${
                                currentStep >= 3 ? "text-[#0F172A]" : "text-[#94A3B8]"
                              }`}
                            >
                              3. In Action
                            </span>
                            <span className="hidden sm:block text-[10px] text-[#64748B]">
                              Field Inspection
                            </span>
                          </div>

                          {/* Step 4: Resolved */}
                          <div className="space-y-1">
                            <div
                              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                                currentStep === 4
                                  ? "bg-[#16A34A] text-white"
                                  : "bg-[#E2E8F0] text-[#64748B]"
                              }`}
                            >
                              {currentStep === 4 ? "✓" : "4"}
                            </div>
                            <span
                              className={`block text-[11px] font-bold ${
                                currentStep === 4 ? "text-[#16A34A]" : "text-[#94A3B8]"
                              }`}
                            >
                              4. Resolved
                            </span>
                            <span className="hidden sm:block text-[10px] text-[#64748B]">
                              Verified Remediation
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3 space-y-2">
                          <h2 className="font-bold text-sm sm:text-base text-[#0F172A] leading-snug">
                            {item.title}
                          </h2>
                          <p className="text-xs text-[#475569] leading-relaxed">
                            {item.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#0B4EA2]" />
                              <span>{item.location}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-[#0B4EA2]" />
                              <span>{item.authorityName || "Municipal Authority"}</span>
                            </span>
                            <span>•</span>
                            <span className="font-medium text-[#0F172A]">
                              {item.assignedOfficer
                                ? `Officer: 👤 ${item.assignedOfficer}`
                                : "Awaiting Ward Allocation"}
                            </span>
                          </div>
                        </div>

                        {/* Thumbnail / Quick action */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#F1F5F9]">
                          {item.imageUrl && (
                            <div className="w-20 h-16 rounded-lg overflow-hidden border border-[#CBD5E1] shrink-0">
                              <img src={item.imageUrl} alt="Incident" className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5 w-full md:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedComplaint(item)}
                              className="text-xs font-semibold border-[#CBD5E1] w-full"
                              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                            >
                              Timeline Audit
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Resolution Evidence Box (if resolved) */}
                      {item.resolutionEvidence && (
                        <div className="p-3.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-[#15803D]">
                              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                              <span>Remediation Sign-off by {item.resolutionEvidence.uploadedBy}</span>
                            </div>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#BBF7D0] text-[#15803D] font-bold">
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-[#15803D]/90">
                            &quot;{item.resolutionEvidence.remarks}&quot;
                          </p>
                          {item.resolutionEvidence.imageUrl && (
                            <div className="w-32 h-20 rounded-md overflow-hidden border border-[#BBF7D0]">
                              <img
                                src={item.resolutionEvidence.imageUrl}
                                alt="Resolution photo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* FEEDBACK STATUS / ACTION ROW */}
                      <div className="pt-3 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        {item.feedback ? (
                          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-lg text-[#0F172A]">
                            <div className="flex items-center text-[#D97706]">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < item.feedback!.rating ? "fill-[#D97706]" : "text-[#CBD5E1]"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-bold">{item.feedback.rating}.0/5</span>
                            <span className="text-[#64748B]">
                              ({item.feedback.satisfactionLevel.replace("_", " ")})
                            </span>
                            {item.feedback.comments && (
                              <span className="text-[#475569] italic truncate max-w-xs">
                                — &quot;{item.feedback.comments}&quot;
                              </span>
                            )}
                          </div>
                        ) : isResolved ? (
                          <div className="flex items-center gap-2 text-[#92400E] bg-[#FEF3C7] px-3 py-1.5 rounded-lg border border-[#FDE68A]">
                            <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
                            <span className="font-semibold">
                              Resolution awaiting your rating and feedback.
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#64748B]">
                            Feedback opens upon completion of field resolution.
                          </span>
                        )}

                        <div className="flex items-center gap-2 shrink-0">
                          {isResolved && (
                            <Button
                              variant={item.feedback ? "outline" : "primary"}
                              size="sm"
                              onClick={() => openFeedbackModal(item)}
                              className="text-xs font-semibold"
                              leftIcon={<Star className="w-3.5 h-3.5" />}
                            >
                              {item.feedback ? "Update Feedback" : "Submit Feedback & Rating"}
                            </Button>
                          )}
                          <Link href={`${ROUTES.COMPLAINTS.TRACK}?id=${item.trackingNumber}`}>
                            <Button variant="ghost" size="sm" className="text-xs text-[#0B4EA2]">
                              Track Page →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#CBD5E1] p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EAF2FF] text-[#0B4EA2] flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">No Complaints Matching Filter</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  {searchQuery
                    ? `No complaint records matched "${searchQuery}".`
                    : "No grievances found under this filter."}
                </p>
                <div className="pt-2">
                  <Link href={ROUTES.CITIZEN.NEW_COMPLAINT}>
                    <Button variant="primary" size="sm" className="text-xs font-bold" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                      Lodge New Complaint
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW 2: MY FEEDBACK & RATINGS ==================== */}
        {mainTab === "FEEDBACK" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-[#CBD5E1] shadow-2xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Citizen Satisfaction & Reviews</h2>
                <p className="text-xs text-[#64748B]">
                  Your direct ratings ensure public accountability and field staff evaluation under the Public Services Guarantee Act.
                </p>
              </div>

              {/* Feedback Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1]">
                  <span className="text-xs text-[#64748B] block">Total Ratings Submitted</span>
                  <span className="text-2xl font-bold text-[#0F172A] mt-1 block">
                    {stats.feedbackCount} / {stats.resolved} Resolved
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1]">
                  <span className="text-xs text-[#64748B] block">Average Satisfaction Rating</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-[#D97706]">
                      {stats.feedbackCount > 0
                        ? (
                            complaints
                              .filter((c) => Boolean(c.feedback))
                              .reduce((acc, c) => acc + (c.feedback?.rating || 5), 0) /
                            stats.feedbackCount
                          ).toFixed(1)
                        : "5.0"}
                    </span>
                    <span className="text-xs text-[#64748B]">/ 5.0 Stars</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1]">
                  <span className="text-xs text-[#64748B] block">Pending Feedback Requests</span>
                  <span className="text-2xl font-bold text-[#D97706] mt-1 block">
                    {stats.needsFeedbackCount}
                  </span>
                </div>
              </div>
            </div>

            {/* List of Feedback Records */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0F172A]">Detailed Grievance Feedback Log</h3>
              {complaints.filter((c) => Boolean(c.feedback)).length > 0 ? (
                complaints
                  .filter((c) => Boolean(c.feedback))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-5 rounded-xl border border-[#CBD5E1] shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0B4EA2] bg-[#EAF2FF] px-2 py-0.5 rounded">
                            {item.trackingNumber}
                          </span>
                          <span className="font-bold text-xs text-[#0F172A]">{item.title}</span>
                        </div>
                        <span className="text-xs text-[#64748B]">
                          Feedback Date: {item.feedback?.submittedAt}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-[#D97706]">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < item.feedback!.rating ? "fill-[#D97706]" : "text-[#CBD5E1]"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-[#0F172A]">
                              {item.feedback?.satisfactionLevel.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] italic">
                            &quot;{item.feedback?.comments}&quot;
                          </p>
                          <div className="flex items-center gap-4 text-[11px] text-[#64748B] pt-1">
                            <span>Remediation Quality: <strong>{item.feedback?.resolutionQualityRating}/5</strong></span>
                            <span>Response Speed: <strong>{item.feedback?.responseTimeRating}/5</strong></span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openFeedbackModal(item)}
                          className="text-xs border-[#CBD5E1] shrink-0"
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          Modify Rating
                        </Button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="bg-white p-8 rounded-xl border border-[#CBD5E1] text-center space-y-2">
                  <Star className="w-8 h-8 text-[#CBD5E1] mx-auto" />
                  <h4 className="text-sm font-bold text-[#0F172A]">No Ratings Given Yet</h4>
                  <p className="text-xs text-[#64748B]">
                    Once your filed complaints are remediated by ward officers, you can rate service quality here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== VIEW 3: CITIZEN PROFILE & JURISDICTION ==================== */}
        {mainTab === "PROFILE" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl border border-[#CBD5E1] shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Citizen Account Details</h2>
                  <p className="text-xs text-[#64748B]">
                    Municipal service registry details linked to your phone authentication.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTempProfile(profile);
                    setIsProfileModalOpen(true);
                  }}
                  className="text-xs border-[#CBD5E1]"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit Information
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block font-medium">Full Name</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{profile.fullName}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block font-medium">Verified Phone</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{currentUser?.mobileNumber}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block font-medium">Email Address</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{profile.email}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block font-medium">Resident Ward Jurisdiction</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{profile.ward}</span>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block font-medium">Residential Street Address</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{profile.address}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B] flex items-center justify-between">
                <span>Account Status: <strong>Aadhaar OTP Verified</strong></span>
                <span>Active Since: <strong>October 2026</strong></span>
              </div>
            </div>

            {/* Municipal Helpline & Rights */}
            <div className="bg-white p-6 rounded-xl border border-[#CBD5E1] shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0B4EA2]" />
                <span>Municipal Ward Contacts</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#0F172A] block">Kolhapur Municipal Corporation (KMC)</span>
                  <span className="text-[#64748B] block">Toll-Free Control Room: 1916</span>
                  <span className="text-[#64748B] block">Ward 12 Office: North Zone HQ</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#0F172A] block">Statutory Rights</span>
                  <p className="text-[11px] text-[#64748B]">
                    Grievances unresolved within the statutory SLA timeframe are automatically escalated to the Municipal Commissioner.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== 3. EDIT CITIZEN PROFILE MODAL ==================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Edit Citizen Information</h3>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={tempProfile.fullName}
                  onChange={(e) => setTempProfile({ ...tempProfile, fullName: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={tempProfile.email}
                  onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Resident Ward / Jurisdiction</label>
                <input
                  type="text"
                  required
                  value={tempProfile.ward}
                  onChange={(e) => setTempProfile({ ...tempProfile, ward: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  required
                  value={tempProfile.address}
                  onChange={(e) => setTempProfile({ ...tempProfile, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0F172A] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 4. CITIZEN FEEDBACK & RATING MODAL ==================== */}
      {feedbackComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#0B4EA2] bg-[#EAF2FF] px-2 py-0.5 rounded">
                    {feedbackComplaint.trackingNumber}
                  </span>
                  <span className="text-xs text-[#64748B]">Citizen Review</span>
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Rate Resolution Quality
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackComplaint(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              {/* Star Rating */}
              <div className="space-y-1.5 text-center p-4 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1]">
                <span className="text-xs font-bold text-[#0F172A] block">
                  Overall Field Team Satisfaction
                </span>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= feedbackRating
                            ? "fill-[#D97706] text-[#D97706]"
                            : "text-[#CBD5E1]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#D97706]">
                  {feedbackRating === 5
                    ? "⭐⭐⭐⭐⭐ Outstanding / Fully Remediated"
                    : feedbackRating === 4
                    ? "⭐⭐⭐⭐ Very Good / Satisfied"
                    : feedbackRating === 3
                    ? "⭐⭐⭐ Acceptable / Average"
                    : feedbackRating === 2
                    ? "⭐⭐ Needs Improvement"
                    : "⭐ Poor / Unsatisfied"}
                </span>
              </div>

              {/* Satisfaction Level Buttons */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#0F172A] block">
                  Satisfaction Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "VERY_SATISFIED", label: "Very Satisfied" },
                    { id: "SATISFIED", label: "Satisfied" },
                    { id: "NEUTRAL", label: "Neutral" },
                    { id: "DISSATISFIED", label: "Dissatisfied" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFeedbackSatisfaction(item.id as "VERY_SATISFIED")}
                      className={`p-2 rounded-lg font-semibold border text-center transition-colors ${
                        feedbackSatisfaction === item.id
                          ? "bg-[#0B4EA2] text-white border-[#0B4EA2]"
                          : "bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-ratings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">
                    Quality of Cleanliness / Repair ({qualityRating}/5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={qualityRating}
                    onChange={(e) => setQualityRating(Number(e.target.value))}
                    className="w-full accent-[#0B4EA2]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">
                    Timeliness & Speed ({responseSpeedRating}/5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={responseSpeedRating}
                    onChange={(e) => setResponseSpeedRating(Number(e.target.value))}
                    className="w-full accent-[#0B4EA2]"
                  />
                </div>
              </div>

              {/* Comments / Remarks */}
              <div className="space-y-1">
                <label className="font-semibold text-[#0F172A] block">
                  Citizen Comments & Inspection Remarks
                </label>
                <textarea
                  rows={3}
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="Share details regarding whether the issue was completely cleared or if any residues remain..."
                  className="w-full p-2.5 rounded-lg border border-[#CBD5E1] text-xs text-[#0F172A] resize-none"
                />
              </div>

              {/* Reopen Grievance Option if Dissatisfied */}
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#DC2626] block">Unsatisfied with resolution?</span>
                  <span className="text-[11px] text-[#991B1B]">
                    Request reopening for supervisory inspection.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isReopenRequested}
                  onChange={(e) => setIsReopenRequested(e.target.checked)}
                  className="w-4 h-4 text-[#DC2626] rounded border-[#CBD5E1]"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedbackComplaint(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold">
                  {isReopenRequested ? "Submit & Reopen Complaint" : "Submit Citizen Rating"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 5. AUDIT TIMELINE MODAL ==================== */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#0B4EA2] bg-[#EAF2FF] border border-[#BFDBFE] px-2.5 py-0.5 rounded">
                    {selectedComplaint.trackingNumber}
                  </span>
                  <StatusBadge status={selectedComplaint.status} size="sm" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  {selectedComplaint.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Statutory Redressal Audit Trail
              </h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                {selectedComplaint.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#0B4EA2] flex items-center justify-center text-[10px] font-bold text-[#0B4EA2]">
                      ✓
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex-1 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-[#0F172A]">{step.status}</span>
                        <span className="text-[#64748B] font-mono text-[10px]">{step.timestamp}</span>
                      </div>
                      <p className="text-[#475569]">{step.note}</p>
                      {step.author && (
                        <span className="text-[10px] text-[#64748B] mt-1 block">
                          By: <strong>{step.author}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link href={`${ROUTES.COMPLAINTS.TRACK}?id=${selectedComplaint.trackingNumber}`}>
                <Button variant="outline" size="sm" className="text-xs" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Track on Public Map
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={() => setSelectedComplaint(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. INSTITUTIONAL FOOTER ==================== */}
      <footer className="w-full bg-white border-t border-[#E2E8F0] py-4 px-4 text-center text-xs text-[#64748B]">
        CivicResolve • Directorate of Municipal & Environmental Services
      </footer>
    </div>
  );
}
