"use client";

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { BarChart3, TrendingUp, PieChart as PieIcon, MapPin, Calendar } from "lucide-react";

// Realistic data adhering to project color system
const CATEGORY_DATA = [
  { name: "Solid Waste", count: 480, resolved: 440 },
  { name: "Water Supply", count: 320, resolved: 295 },
  { name: "Road / PWD", count: 260, resolved: 220 },
  { name: "Drainage", count: 180, resolved: 165 },
  { name: "Lighting", count: 124, resolved: 118 },
];

const PRIORITY_DATA = [
  { name: "VERY_HIGH", value: 145, color: "#DC2626" }, // Red
  { name: "HIGH", value: 310, color: "#F59E0B" },      // Orange
  { name: "MEDIUM", value: 580, color: "#0B4EA2" },    // Blue
  { name: "LOW", value: 249, color: "#16A34A" },       // Green
];

const STATUS_DATA = [
  { status: "SUBMITTED", count: 85, color: "#0B4EA2" },
  { status: "VALIDATING", count: 42, color: "#5B21B6" },
  { status: "ASSIGNED", count: 110, color: "#0B4EA2" },
  { status: "IN_PROGRESS", count: 215, color: "#F59E0B" },
  { status: "RESOLVED", count: 680, color: "#16A34A" },
  { status: "ESCALATED", count: 24, color: "#DC2626" },
];

const TREND_DATA = [
  { date: "Sep 30", intake: 38, resolved: 32 },
  { date: "Oct 01", intake: 45, resolved: 40 },
  { date: "Oct 02", intake: 32, resolved: 35 },
  { date: "Oct 03", intake: 54, resolved: 48 },
  { date: "Oct 04", intake: 48, resolved: 46 },
  { date: "Oct 05", intake: 52, resolved: 50 },
  { date: "Oct 06 (Today)", intake: 42, resolved: 39 },
];

const REGIONAL_DATA = [
  { region: "North Zone (Ward 12)", count: 420, avgHours: 3.8 },
  { region: "Central Zone (Market)", count: 350, avgHours: 4.2 },
  { region: "South Zone (Shahupuri)", count: 290, avgHours: 3.1 },
  { region: "East Zone (Shivaji Pk)", count: 224, avgHours: 4.9 },
];

export function ComplaintsAnalyticsView() {
  return (
    <div className="space-y-6">
      {/* Analytics Overview Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0B4EA2]" />
            <h3 className="font-extrabold text-base sm:text-lg text-[#0F172A]">
              Civic Intelligence & Redressal Analytics
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Key operational metrics, resolution velocity, and geographical distribution.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-[#ECFDF3] border border-[#BBF7D0] text-[#15803D] px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>91.4% Resolution Rate</span>
          </div>
        </div>
      </div>

      {/* Row 1: Intake Trends & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
                7-Day Complaint Ingestion vs Resolution Velocity
              </h4>
              <p className="text-xs text-[#64748B]">
                Daily intake volume vs successfully verified resolutions.
              </p>
            </div>
            <span className="text-xs font-semibold bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-md">
              Past 7 Days
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B4EA2" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0B4EA2" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="intake"
                  name="Complaints Ingested"
                  stroke="#0B4EA2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIntake)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Grievances Resolved"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution Donut (1 Col) */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
              Urgency Priority Breakdown
            </h4>
            <p className="text-xs text-[#64748B]">
              Total volume classified by severity level.
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PRIORITY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {PRIORITY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E2E8F0]">
            {PRIORITY_DATA.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[#475569] font-medium">{p.name}:</span>
                <strong className="text-[#0F172A]">{p.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Categories Bar Chart & Regional Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
                Complaints by Civic Category
              </h4>
              <p className="text-xs text-[#64748B]">
                Total intake vs resolved across municipal sectors.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="count" name="Total Ingested" fill="#0B4EA2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
                Regional Distribution by District Zone
              </h4>
              <p className="text-xs text-[#64748B]">
                Complaint volume & average resolution turnaround (hrs).
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={REGIONAL_DATA}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis
                  dataKey="region"
                  type="category"
                  tick={{ fontSize: 10, fill: "#475569" }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Grievances" fill="#5B21B6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
