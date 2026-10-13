/**
 * Centralized Route Map for Complaint Intelligence Platform
 * Single source of truth for all public, citizen, officer, and administrative URLs.
 */

export const ROUTES = {
  // Public
  HOME: "/",
  ABOUT: "/#about",
  HOW_IT_WORKS: "/#how-it-works",
  STATS: "/#stats",

  // Authentication
  AUTH: {
    CITIZEN_LOGIN: "/auth/citizenlogin",
    ADMIN_LOGIN: "/auth/adminlogin",
    LOGIN: "/auth/citizenlogin",
    REGISTER: "/register",
  },

  // Citizen Portal
  CITIZEN: {
    DASHBOARD: "/citizen/dashboard",
    NEW_COMPLAINT: "/citizen/complaints/new",
    COMPLAINTS: "/citizen/dashboard",
  },

  // Complaint Operations
  COMPLAINTS: {
    NEW: "/citizen/complaints/new",
    TRACK: "/complaints/track",
    LIST: "/citizen/dashboard",
  },

  // Admin Portal & Tabs
  ADMIN: {
    ROOT: "/admin",
    LOGIN: "/auth/adminlogin",
    DASHBOARD: "/admin/dashboard",
    TAB_DASHBOARD: "/admin/dashboard?tab=dashboard",
    TAB_COMPLAINTS: "/admin/dashboard?tab=complaints",
    TAB_ROUTING: "/admin/dashboard?tab=routing",
    TAB_MAP: "/admin/dashboard?tab=map",
    TAB_ANALYTICS: "/admin/dashboard?tab=analytics",
    TAB_REPORTS: "/admin/dashboard?tab=reports",
    TAB_OFFICERS: "/admin/dashboard?tab=officers",
    TAB_HIERARCHY: "/admin/dashboard?tab=hierarchy",
    TAB_MANAGEMENT: "/admin/dashboard?tab=management",
  },
} as const;

export default ROUTES;
