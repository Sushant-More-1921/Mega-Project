"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  FileText,
  Map,
  BarChart3,
  FileSpreadsheet,
  Users,
  Settings,
  Sliders,
  Bell,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUpRight,
  ArrowRight,
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Plus,
  Flame,
  UserCheck,
  FolderTree,
  Navigation,
  Lock,
  Layers,
  Building2,
  Check,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { PriorityBadge } from "@/components/common/priority-badge";
import { ComplaintsMapView } from "@/components/map/complaints-map-view";
import { ComplaintsAnalyticsView } from "@/components/analytics/complaints-analytics-view";
import { OfficersManagementView } from "@/components/officers/officers-management-view";
import { ComplaintsReportsView } from "@/components/reports/complaints-reports-view";
import { HierarchyManagementView } from "@/components/admin/hierarchy-management-view";
import { AutoRoutingVisualizer } from "@/components/admin/auto-routing-visualizer";
import { AssignedWorkModal } from "@/components/admin/assigned-work-modal";
import { IncidentDetailsModal } from "@/components/admin/incident-details-modal";
import { ClusteringLiveToolbar } from "@/components/admin/clustering-live-toolbar";

import {
  getStoredIncidents,
  queryIncidents,
  computeDashboardStats,
  assignOfficerToIncident,
  updateIncidentStatus,
  incidentToComplaint,
} from "@/lib/db/incidents-db";
import { subscribeToRealTime, emitRealTimeEvent } from "@/lib/realtime/events";
import { getOfficers, MOCK_OFFICERS } from "@/lib/api/officers";
import {
  INITIAL_DIVISIONS,
  INITIAL_AUTHORITIES,
  INITIAL_DEPARTMENTS,
} from "@/lib/api/hierarchy";
import { getSessionUser, clearSession } from "@/lib/auth/session";
import { Complaint, ComplaintPriority, ComplaintStatus } from "@/types/complaint";
import { MasterIncident, DashboardStats } from "@/types/incident";
import { Officer } from "@/types/officer";
import { AuthUser } from "@/types/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Briefcase } from "lucide-react";

type AdminTab =
  | "dashboard"
  | "complaints"
  | "routing"
  | "map"
  | "analytics"
  | "reports"
  | "officers"
  | "hierarchy"
  | "management"
  | "settings";

// Static default admin profile representing verified backend credentials
const DEFAULT_ADMIN: AuthUser = {
  id: "adm_401",
  mobileNumber: "+919822012345",
  role: "ADMIN",
  name: "Rajesh Sharma",
  designation: "Chief Grievance Redressal Administrator",
  department: "Municipal Affairs & Intelligence Directorate",
  badgeId: "ADM-HQ-401",
  isVerified: true,
};

export default function AdminDashboardPage() {
  const router = useRouter();

  // Navigation state
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Static Admin session details loaded from backend login credentials
  const [adminUser, setAdminUser] = useState<AuthUser>(DEFAULT_ADMIN);

  useEffect(() => {
    const session = getSessionUser();
    if (session && session.role === "ADMIN") {
      setAdminUser(session);
    }
  }, []);

  // Data state: Master Incidents directly connected to dynamic database repository
  const [incidents, setIncidents] = useState<MasterIncident[]>([]);
  const [officers, setOfficers] = useState<Officer[]>(MOCK_OFFICERS);

  // Selected item modal & Assigned Work modal
  const [selectedIncident, setSelectedIncident] = useState<MasterIncident | null>(null);
  const [isAssignedWorkModalOpen, setIsAssignedWorkModalOpen] = useState(false);

  // Initial database load & live real-time subscription
  useEffect(() => {
    // 1. Initial load from persistent database
    const initialData = getStoredIncidents();
    setIncidents(initialData);

    // 2. Real-time subscription: updates dashboard immediately on any database mutation
    const unsubscribe = subscribeToRealTime(() => {
      const freshData = getStoredIncidents();
      setIncidents([...freshData]);
    });

    return () => unsubscribe();
  }, []);

  // Multi-tier Cascading Hierarchical Filter State
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("ALL");
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string>("ALL");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("ALL");
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "count">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Cascading authorities & departments for admin filter selection
  const availableAuthorities = useMemo(() => {
    if (selectedDivisionId === "ALL") return INITIAL_AUTHORITIES;
    return INITIAL_AUTHORITIES.filter((a) => a.divisionId === selectedDivisionId);
  }, [selectedDivisionId]);

  const availableDepartments = useMemo(() => {
    if (selectedAuthorityId === "ALL") return INITIAL_DEPARTMENTS;
    return INITIAL_DEPARTMENTS.filter((d) => d.authorityId === selectedAuthorityId);
  }, [selectedAuthorityId]);

  const handleDivisionChange = (divId: string) => {
    setSelectedDivisionId(divId);
    setSelectedAuthorityId("ALL");
    setSelectedDepartmentId("ALL");
  };

  const handleAuthorityChange = (authId: string) => {
    setSelectedAuthorityId(authId);
    setSelectedDepartmentId("ALL");
  };

  // Filtered Master Incidents based on Admin selections
  const displayIncidents = useMemo(() => {
    return queryIncidents({
      divisionId: selectedDivisionId,
      authorityId: selectedAuthorityId,
      departmentId: selectedDepartmentId,
      officerId: selectedOfficerId,
      priority: filterPriority,
      status: filterStatus,
      search: searchQuery,
    }).sort((a, b) => {
      if (sortBy === "count") {
        return sortOrder === "desc" ? b.complaintCount - a.complaintCount : a.complaintCount - b.complaintCount;
      }
      if (sortBy === "priority") {
        const pOrder: Record<ComplaintPriority, number> = {
          VERY_HIGH: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        const diff = pOrder[b.priority] - pOrder[a.priority];
        return sortOrder === "desc" ? diff : -diff;
      }
      return sortOrder === "desc"
        ? b.lastReportedTimestamp - a.lastReportedTimestamp
        : a.lastReportedTimestamp - b.lastReportedTimestamp;
    });
  }, [
    incidents,
    searchQuery,
    selectedDivisionId,
    selectedAuthorityId,
    selectedDepartmentId,
    selectedOfficerId,
    filterPriority,
    filterStatus,
    sortBy,
    sortOrder,
  ]);

  // Adapted complaints for Map & Analytics components
  const adaptedComplaints = useMemo(() => {
    return incidents.map(incidentToComplaint);
  }, [incidents]);

  // Critical incidents for Admin notification alerts
  const criticalIncidents = useMemo(() => {
    return incidents.filter(
      (i) => i.priority === "VERY_HIGH" || i.status === "ESCALATED" || i.isSlaBreached
    );
  }, [incidents]);

  // DYNAMIC DASHBOARD STATS: Computed completely from real database state
  const stats: DashboardStats = useMemo(() => {
    return computeDashboardStats({
      divisionId: selectedDivisionId,
      authorityId: selectedAuthorityId,
      departmentId: selectedDepartmentId,
      officerId: selectedOfficerId,
      priority: filterPriority,
      status: filterStatus,
      search: searchQuery,
    });
  }, [
    incidents,
    selectedDivisionId,
    selectedAuthorityId,
    selectedDepartmentId,
    selectedOfficerId,
    filterPriority,
    filterStatus,
    searchQuery,
  ]);

  const handleSignOut = () => {
    clearSession();
    router.push("/auth/adminlogin");
  };

  const handleReassignOfficer = (
    incidentId: string,
    officerId: string,
    officerName: string
  ) => {
    assignOfficerToIncident(incidentId, officerId, officerName, adminUser.name || "Administrator");
    emitRealTimeEvent("OFFICER_ASSIGNED", { incidentId, officerId, officerName });
    const fresh = getStoredIncidents();
    setIncidents([...fresh]);
    if (selectedIncident && selectedIncident.id === incidentId) {
      const updated = fresh.find((i) => i.id === incidentId);
      if (updated) setSelectedIncident(updated);
    }
  };

  const handleUpdateStatus = (
    incidentId: string,
    newStatus: ComplaintStatus,
    evidenceRemarks?: string
  ) => {
    updateIncidentStatus(
      incidentId,
      newStatus,
      evidenceRemarks
        ? {
            imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
            remarks: evidenceRemarks,
            uploadedBy: adminUser.name || "Administrator",
          }
        : undefined,
      adminUser.name || "Administrator"
    );
    emitRealTimeEvent(newStatus === "RESOLVED" ? "CASE_RESOLVED" : "STATUS_CHANGED", {
      incidentId,
      status: newStatus,
    });
    const fresh = getStoredIncidents();
    setIncidents([...fresh]);
    if (selectedIncident && selectedIncident.id === incidentId) {
      const updated = fresh.find((i) => i.id === incidentId);
      if (updated) setSelectedIncident(updated);
    }
  };

  const sidebarLinks: { id: AdminTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: "complaints",
      label: "Complaints & Incidents",
      icon: <FileText className="w-4 h-4" />,
      badge: `${incidents.length}`,
    },
    { id: "routing", label: "Auto Routing Pipeline", icon: <Navigation className="w-4 h-4" /> },
    { id: "map", label: "Map & Hotspots", icon: <Map className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "reports", label: "Reports", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "officers", label: "Officers", icon: <Users className="w-4 h-4" />, badge: `${officers.length}` },
    { id: "hierarchy", label: "Hierarchy Topology", icon: <FolderTree className="w-4 h-4" /> },
    { id: "management", label: "SLA Management", icon: <Sliders className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#EAF2FF] selection:text-[#0B4EA2]">
      {/* TOP HEADER WITH BRANDING & STATIC ADMIN PROFILE */}
      <header className="w-full bg-white border-b border-[#E2E8F0] h-16 px-4 sm:px-6 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0B4EA2] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-bold text-[#0F172A] leading-tight">
                CivicResolve Mega Platform
              </span>
              <span className="hidden sm:block text-[11px] font-semibold text-[#0B4EA2] uppercase tracking-wider">
                CENTRALIZED ADMINISTRATIVE COMMAND • GOVT OF MAHARASHTRA
              </span>
            </div>
          </div>
        </div>

        {/* Right header actions: Static Admin Identity, Alerts, Sign out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Static Admin Profile (Loaded from backend login session) */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="w-8 h-8 rounded-full bg-[#0B4EA2] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {adminUser.name
                ? adminUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "AD"}
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#0F172A] leading-tight">
                  {adminUser.name || "Rajesh Sharma"}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#EAF2FF] text-[#0B4EA2] border border-[#BFDBFE]">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] font-medium block">
                {adminUser.badgeId || "ADM-HQ-401"} • {adminUser.designation || "Administrator"}
              </span>
            </div>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {criticalIncidents.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#DC2626] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-[#CBD5E1] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 mb-3">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#0F172A]">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                    <span>Statewide Critical Incidents ({criticalIncidents.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs text-[#64748B] hover:text-[#0F172A]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {criticalIncidents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#64748B]">
                      No critical incidents requiring immediate intervention.
                    </div>
                  ) : (
                    criticalIncidents.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedIncident(c);
                          setNotificationsOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2]/40 hover:bg-[#FEF2F2] cursor-pointer transition-colors text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#DC2626]">
                            {c.incidentNumber}
                          </span>
                          <PriorityBadge priority={c.priority} size="sm" />
                        </div>
                        <p className="font-semibold text-[#0F172A] truncate">{c.title}</p>
                        <span className="text-[11px] text-[#64748B] block truncate">
                          📍 {c.authorityName} • {c.location} • {c.complaintCount} reports
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="text-xs h-9 hidden sm:inline-flex"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* MAIN LAYOUT: SIDEBAR + CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#E2E8F0] pt-16 md:pt-0 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col justify-between",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="py-5 px-3 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Central Administration
            </div>
            {sidebarLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  setActiveTab(link.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === link.id
                    ? "bg-[#0B4EA2] text-white font-semibold shadow-xs"
                    : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                )}
              >
                <div className="flex items-center gap-3">
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      activeTab === link.id
                        ? "bg-white/20 text-white"
                        : "bg-[#F1F5F9] text-[#475569]"
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[#0F172A] font-semibold">
              <span>Jurisdiction Engine</span>
              <span className="text-[#16A34A] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                Multi-Tenant
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Auto-Routing: GPS $\rightarrow$ Division $\rightarrow$ Auth $\rightarrow$ Officer
            </p>
          </div>
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ==================== TAB 1: DASHBOARD OVERVIEW ==================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    Statewide Command Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Centralized platform monitoring civic grievances, SLA compliance, and dispatch across all Maharashtra jurisdictions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("routing")}
                    className="text-xs"
                    leftIcon={<Navigation className="w-3.5 h-3.5" />}
                  >
                    Auto-Routing Pipeline
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab("complaints")}
                    className="text-xs"
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    View Grievances
                  </Button>
                </div>
              </div>

              {/* INTERACTIVE CLUSTERING TEST TOOLBAR BANNER */}
              <ClusteringLiveToolbar onRefresh={() => setIncidents([...getStoredIncidents()])} />

              {/* STATS CARDS: 11 DYNAMIC DATABASE-DRIVEN METRICS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
                {/* 1. Total Complaints */}
                <div className="bg-white p-4 rounded-xl border border-[#CBD5E1] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
                      Total Complaints
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAF2FF] text-[#0B4EA2] font-bold">
                      Citizen
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1 font-mono">
                    {stats.totalComplaints}
                  </div>
                  <span className="text-[11px] text-[#0B4EA2] font-semibold mt-0.5 block truncate">
                    Across All Incidents
                  </span>
                </div>

                {/* 2. Active Incidents */}
                <div className="bg-white p-4 rounded-xl border border-[#BFDBFE] bg-[#EAF2FF]/20 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#0B4EA2] font-bold uppercase tracking-wider">
                      Active Incidents
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B4EA2] text-white font-bold">
                      Master
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0B4EA2] mt-1 font-mono">
                    {stats.activeIncidents}
                  </div>
                  <span className="text-[11px] text-[#0B4EA2] font-semibold mt-0.5 block truncate">
                    Clustered Dispatch Tickets
                  </span>
                </div>

                {/* 3. New Complaints / Unassigned */}
                <div className="bg-white p-4 rounded-xl border border-[#FDE68A] bg-[#FFF7E6]/25 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#B45309] font-bold uppercase tracking-wider">
                      New / Unassigned
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-bold">
                      Intake
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#B45309] mt-1 font-mono">
                    {stats.unassignedCases}
                  </div>
                  <span className="text-[11px] text-[#B45309] font-semibold mt-0.5 block truncate">
                    Awaiting Allocation
                  </span>
                </div>

                {/* 4. Assigned Work / Cases (CLICKABLE CARD) */}
                <button
                  type="button"
                  onClick={() => setIsAssignedWorkModalOpen(true)}
                  className="bg-white p-4 rounded-xl border-2 border-[#0B4EA2] bg-[#EAF2FF]/30 shadow-xs text-left hover:bg-[#EAF2FF]/60 hover:shadow-md transition-all group cursor-pointer relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#0B4EA2] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-[#0B4EA2]" />
                      Assigned Work
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#0B4EA2] text-white font-bold animate-pulse">
                      Click to View
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0B4EA2] mt-1 font-mono flex items-center justify-between">
                    <span>{stats.assignedCases}</span>
                    <ArrowUpRight className="w-4 h-4 text-[#0B4EA2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <span className="text-[11px] text-[#0B4EA2] font-bold mt-0.5 block truncate underline">
                    {adminUser.name || "Officer"} Queue →
                  </span>
                </button>

                {/* 5. Pending Cases */}
                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
                      Pending Cases
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-bold">
                      Queue
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#475569] mt-1 font-mono">
                    {stats.pendingCases}
                  </div>
                  <span className="text-[11px] text-[#64748B] font-semibold mt-0.5 block truncate">
                    Pre-Investigation
                  </span>
                </div>

                {/* 6. In Progress */}
                <div className="bg-white p-4 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF]/30 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#0284C7] font-bold uppercase tracking-wider">
                      In Progress
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0369A1] font-bold">
                      Active
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0284C7] mt-1 font-mono">
                    {stats.inProgressCases}
                  </div>
                  <span className="text-[11px] text-[#0284C7] font-semibold mt-0.5 block truncate">
                    Field Team Deployed
                  </span>
                </div>

                {/* 7. Resolved */}
                <div className="bg-white p-4 rounded-xl border border-[#BBF7D0] bg-[#ECFDF3]/30 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#15803D] font-bold uppercase tracking-wider">
                      Resolved
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#166534] font-bold">
                      Closed
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#15803D] mt-1 font-mono">
                    {stats.resolvedCases}
                  </div>
                  <span className="text-[11px] text-[#15803D] font-semibold mt-0.5 block truncate">
                    Evidence Verified
                  </span>
                </div>

                {/* 8. Escalated */}
                <div className="bg-white p-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2]/30 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#DC2626] font-bold uppercase tracking-wider">
                      Escalated
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] font-bold">
                      Urgent
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#DC2626] mt-1 font-mono">
                    {stats.escalatedCases}
                  </div>
                  <span className="text-[11px] text-[#DC2626] font-semibold mt-0.5 block truncate">
                    Supervisory Notice
                  </span>
                </div>

                {/* 9. SLA Breached */}
                <div className="bg-white p-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2]/20 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#B91C1C] font-bold uppercase tracking-wider">
                      SLA Breached
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DC2626] text-white font-bold">
                      Breach
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#B91C1C] mt-1 font-mono">
                    {stats.slaBreachedCases}
                  </div>
                  <span className="text-[11px] text-[#B91C1C] font-semibold mt-0.5 block truncate">
                    Exceeded Time Limit
                  </span>
                </div>

                {/* 10. High Priority */}
                <div className="bg-white p-4 rounded-xl border border-[#FED7AA] bg-[#FFF7ED]/30 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#C2410C] font-bold uppercase tracking-wider">
                      High Priority
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFEDD5] text-[#9A3412] font-bold">
                      Critical
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#C2410C] mt-1 font-mono">
                    {stats.highPriorityCases}
                  </div>
                  <span className="text-[11px] text-[#C2410C] font-semibold mt-0.5 block truncate">
                    Safety & Infrastructure
                  </span>
                </div>

                {/* 11. Total Supporting Reports (Clustered Citizen Reports) */}
                <div className="bg-white p-4 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF]/30 shadow-xs sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#6D28D9] font-bold uppercase tracking-wider">
                      Supporting Reports Clustered
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#5B21B6] font-bold">
                      AI Clustered
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#6D28D9] mt-1 font-mono">
                    {stats.totalSupportingReports}
                  </div>
                  <span className="text-[11px] text-[#6D28D9] font-semibold mt-0.5 block truncate">
                    Duplicate Reports Consolidated into Master Cases
                  </span>
                </div>
              </div>

              {/* Map Preview (REAL GOOGLE MAP) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0B4EA2]" />
                    <span>Statewide Interactive Google Map & Hotspots</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("map")}
                    className="text-xs font-bold text-[#0B4EA2] hover:underline flex items-center gap-1"
                  >
                    <span>Full Map View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ComplaintsMapView
                  incidents={incidents}
                  onSelectIncident={(inc) => setSelectedIncident(inc)}
                />
              </div>
            </div>
          )}

          {/* ==================== TAB 2: COMPLAINTS TABLE WITH MULTI-LEVEL FILTERS ==================== */}
          {activeTab === "complaints" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    Grievance Queue & Multi-Tier Records
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Central administrative control displaying {displayIncidents.length} records.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDivisionId("ALL");
                      setSelectedAuthorityId("ALL");
                      setSelectedDepartmentId("ALL");
                      setFilterPriority("ALL");
                      setFilterStatus("ALL");
                      setFilterDate("ALL");
                      setSearchQuery("");
                    }}
                    className="text-xs"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              {/* CASCADING HIERARCHICAL FILTER BAR */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search across ID, title, phone, division, or authority..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#CBD5E1] text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0B4EA2]"
                    />
                  </div>

                  {/* Priority and Date Sort */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortBy === "priority") {
                          setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                        } else {
                          setSortBy("priority");
                          setSortOrder("desc");
                        }
                      }}
                      className={cn(
                        "h-10 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors",
                        sortBy === "priority"
                          ? "bg-[#EAF2FF] text-[#0B4EA2] border-[#BFDBFE]"
                          : "bg-white text-[#475569] border-[#CBD5E1]"
                      )}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Priority ({sortOrder})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (sortBy === "date") {
                          setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                        } else {
                          setSortBy("date");
                          setSortOrder("desc");
                        }
                      }}
                      className={cn(
                        "h-10 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors",
                        sortBy === "date"
                          ? "bg-[#EAF2FF] text-[#0B4EA2] border-[#BFDBFE]"
                          : "bg-white text-[#475569] border-[#CBD5E1]"
                      )}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Date ({sortOrder})</span>
                    </button>
                  </div>
                </div>

                {/* CASCADING DROPDOWNS: Division -> Authority -> Department -> Priority -> Status -> Date */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-[#F1F5F9] text-xs">
                  {/* Division Filter */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                      1. Division:
                    </label>
                    <select
                      value={selectedDivisionId}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
                    >
                      <option value="ALL">All Divisions</option>
                      {INITIAL_DIVISIONS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Local Authority Filter */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                      2. Local Authority:
                    </label>
                    <select
                      value={selectedAuthorityId}
                      onChange={(e) => handleAuthorityChange(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
                    >
                      <option value="ALL">All Authorities</option>
                      {availableAuthorities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                      3. Department:
                    </label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
                    >
                      <option value="ALL">All Departments</option>
                      {availableDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                      4. Priority:
                    </label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="VERY_HIGH">VERY HIGH</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                      5. Status:
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="VALIDATING">VALIDATING</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="ESCALATED">ESCALATED</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                      6. Logged Date:
                    </label>
                    <select
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
                    >
                      <option value="ALL">All Dates</option>
                      <option value="2026-10-06">Today (06 Oct)</option>
                      <option value="2026-10-05">05 Oct 2026</option>
                      <option value="2026-10-04">04 Oct 2026</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Complaints Table */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
                      Master Incident & Clustered Grievance Records ({displayIncidents.length})
                    </h4>
                    <span className="text-xs text-[#64748B]">
                      Consolidated multi-citizen complaints grouped by proximity, category, and time window
                    </span>
                  </div>
                </div>

                {displayIncidents.length === 0 ? (
                  <div className="p-12 text-center text-[#64748B]">
                    <FileText className="w-10 h-10 mx-auto text-[#CBD5E1] mb-2" />
                    <p className="font-semibold text-sm text-[#0F172A]">
                      No incidents matching the selected filters.
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">
                      Try adjusting division, status, or keyword filters.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold uppercase tracking-wider text-xs">
                          <th className="py-3 px-4">Incident ID</th>
                          <th className="py-3 px-4">Grievance Details</th>
                          <th className="py-3 px-4">Cluster Volume</th>
                          <th className="py-3 px-4">Jurisdiction & Authority</th>
                          <th className="py-3 px-4">Priority</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Assigned Officer</th>
                          <th className="py-3 px-4">SLA Deadline</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {displayIncidents.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedIncident(item)}
                            className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-[#0B4EA2]">
                              {item.incidentNumber}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <span className="font-bold text-[#0F172A] block truncate">
                                {item.title}
                              </span>
                              <span className="text-xs text-[#64748B] block truncate mt-0.5">
                                📍 {item.location}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F172A] text-white font-bold text-xs shadow-2xs">
                                <span>{item.complaintCount}</span>
                                <span className="text-[10px] text-[#94A3B8]">
                                  {item.complaintCount > 1 ? "Reports" : "Report"}
                                </span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-[#0F172A] block truncate">
                                {item.authorityName}
                              </span>
                              <span className="text-xs text-[#64748B] block truncate">
                                {item.divisionName} • {item.department}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <PriorityBadge priority={item.priority} size="sm" />
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={item.status} size="sm" />
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                              {item.assignedOfficer ? (
                                <span className="font-semibold text-[#0F172A] flex items-center gap-1">
                                  <span>👤</span> {item.assignedOfficer}
                                </span>
                              ) : (
                                <span className="text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded text-xs font-bold border border-[#FECACA]">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              <span
                                className={cn(
                                  "font-medium block",
                                  item.isSlaBreached ? "text-[#DC2626] font-bold" : "text-[#475569]"
                                )}
                              >
                                {item.slaDeadline}
                              </span>
                              <span className="text-[10px] text-[#64748B] block">
                                Last: {item.lastReportedAt}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIncident(item);
                                }}
                                className="text-[#0B4EA2] hover:text-[#083B7A] font-bold text-xs inline-flex items-center gap-1 hover:underline p-1"
                              >
                                <span>Inspect Clustered ({item.complaintCount})</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: AUTO-ROUTING PIPELINE ==================== */}
          {activeTab === "routing" && (
            <div className="space-y-4">
              <AutoRoutingVisualizer />
            </div>
          )}

          {/* ==================== TAB 4: MAP & HOTSPOTS (GOOGLE MAPS PLATFORM) ==================== */}
          {activeTab === "map" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Statewide Geospatial Google Map & Density Hotspots
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Centralized command map displaying all {incidents.length} Master Incidents and clustered citizen grievances across Maharashtra.
                </p>
              </div>
              <ComplaintsMapView
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            </div>
          )}

          {/* ==================== TAB 5: ANALYTICS ==================== */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              <ComplaintsAnalyticsView />
            </div>
          )}

          {/* ==================== TAB 6: REPORTS ==================== */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <ComplaintsReportsView complaints={adaptedComplaints} />
            </div>
          )}

          {/* ==================== TAB 7: OFFICERS ==================== */}
          {activeTab === "officers" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Statewide Field Officers Directory & Roster
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Central roster of {officers.length} field officers across all divisions and municipal authorities.
                </p>
              </div>
              <OfficersManagementView
                officers={officers}
                complaints={adaptedComplaints}
                onReassignComplaint={handleReassignOfficer}
              />
            </div>
          )}

          {/* ==================== TAB 8: HIERARCHY TOPOLOGY ==================== */}
          {activeTab === "hierarchy" && (
            <div className="space-y-4">
              <HierarchyManagementView />
            </div>
          )}

          {/* ==================== TAB 9: SLA MANAGEMENT ==================== */}
          {activeTab === "management" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Statewide Response SLA & Escalation Governance
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Configure automated response time ceilings and cross-division escalation policies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
                  <h4 className="font-bold text-sm sm:text-base text-[#0F172A] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0B4EA2]" />
                    <span>Response SLA Thresholds by Severity</span>
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2]">
                      <div>
                        <strong className="text-[#DC2626]">VERY HIGH (Critical Public Safety)</strong>
                        <p className="text-[#64748B]">Immediate bio-waste, pipeline rupture</p>
                      </div>
                      <span className="font-bold text-[#DC2626] font-mono">4 Hours SLA</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#FDE68A] bg-[#FFF7E6]">
                      <div>
                        <strong className="text-[#B45309]">HIGH (Urgent Civil Disruption)</strong>
                        <p className="text-[#64748B]">Road potholes, arterial streetlights</p>
                      </div>
                      <span className="font-bold text-[#B45309] font-mono">12 Hours SLA</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#BFDBFE] bg-[#EAF2FF]">
                      <div>
                        <strong className="text-[#0B4EA2]">MEDIUM</strong>
                        <p className="text-[#64748B]">Drain cleaning, secondary dumpsters</p>
                      </div>
                      <span className="font-bold text-[#0B4EA2] font-mono">24 Hours SLA</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#BBF7D0] bg-[#ECFDF3]">
                      <div>
                        <strong className="text-[#15803D]">LOW</strong>
                        <p className="text-[#64748B]">General maintenance queries</p>
                      </div>
                      <span className="font-bold text-[#15803D] font-mono">48 Hours SLA</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
                  <h4 className="font-bold text-sm sm:text-base text-[#0F172A] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5B21B6]" />
                    <span>Hierarchical Escalation Watchdog</span>
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg border border-[#E2E8F0] space-y-1">
                      <strong className="text-[#0F172A] block">Level 1 Escalation: Officer → Authority Head</strong>
                      <span className="text-[#64748B]">
                        If unassigned for &gt; 2 hours or no site visit within SLA ceiling, escalate to Municipal Commissioner.
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-[#E2E8F0] space-y-1">
                      <strong className="text-[#0F172A] block">Level 2 Escalation: Authority → Division Commissioner</strong>
                      <span className="text-[#64748B]">
                        If resolution fails past 2x SLA limit, flagged to Divisional Commissioner console.
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-[#E2E8F0] space-y-1">
                      <strong className="text-[#0F172A] block">Level 3 Escalation: State Secretary Audit</strong>
                      <span className="text-[#64748B]">
                        Recurring hotspot breaches flagged in monthly Cabinet Redressal Index.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 10: SETTINGS ==================== */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Administrative Profile & Credentials
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Verified administrator identity loaded from backend security clearance.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs max-w-2xl space-y-5">
                <div className="flex items-center gap-4 border-b border-[#E2E8F0] pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#083B7A] flex items-center justify-center text-white text-xl font-bold shadow-xs">
                    {adminUser.badgeId ? adminUser.badgeId.slice(0, 3) : "ADM"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg text-[#0F172A]">
                        {adminUser.name || "Rajesh Sharma"}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ECFDF3] text-[#15803D] border border-[#BBF7D0]">
                        Active Admin
                      </span>
                    </div>
                    <p className="text-xs text-[#0B4EA2] font-semibold mt-0.5">
                      {adminUser.designation || "Chief Grievance Redressal Administrator"}
                    </p>
                    <span className="text-xs text-[#64748B]">
                      {adminUser.department || "Municipal Affairs & Intelligence Directorate"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Security Badge ID:</span>
                    <span className="font-mono font-bold text-[#0F172A] text-sm">
                      {adminUser.badgeId || "ADM-HQ-401"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Verified Mobile Number:</span>
                    <span className="font-mono font-bold text-[#0F172A] text-sm">
                      {adminUser.mobileNumber || "+91 98220 12345"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Administrative Role:</span>
                    <span className="font-bold text-[#0B4EA2] text-sm">
                      {adminUser.role || "ADMIN"} (State Command)
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Jurisdiction Scope:</span>
                    <span className="font-bold text-[#15803D] text-sm">
                      All Divisions in Maharashtra
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <Link
                    href="/auth/citizenlogin"
                    className="text-xs font-semibold text-[#0B4EA2] hover:underline"
                  >
                    Open Citizen Grievance Portal →
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-xs"
                    leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ASSIGNED WORK MODAL (CLICKABLE FROM DASHBOARD "ASSIGNED WORK" CARD) */}
      <AssignedWorkModal
        isOpen={isAssignedWorkModalOpen}
        onClose={() => setIsAssignedWorkModalOpen(false)}
        incidents={incidents}
        officerName={adminUser.name}
        onSelectIncident={(inc) => setSelectedIncident(inc)}
      />

      {/* INCIDENT DETAILS & CLUSTERED SUPPORTING REPORTS MODAL */}
      <IncidentDetailsModal
        incident={selectedIncident}
        officers={officers}
        onClose={() => setSelectedIncident(null)}
        onReassignOfficer={handleReassignOfficer}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
