"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  User,
  FileText,
  MapPin,
  MessageSquare,
  Bell,
  HelpCircle,
  LogOut,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

type ComplaintStatus =
  | "Pending"
  | "In Progress"
  | "Resolved"
  | "Rejected";

interface Complaint {
  id: string;
  category: string;
  location: string;
  date: string;
  status: ComplaintStatus;
}

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  active?: boolean;
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const complaints: Complaint[] = [
    {
      id: "CMP1024",
      category: "Road Damage",
      location: "Mulshi, Pune",
      date: "05 Oct 2026",
      status: "In Progress",
    },
    {
      id: "CMP1020",
      category: "Garbage Collection",
      location: "Pune",
      date: "02 Oct 2026",
      status: "Resolved",
    },
    {
      id: "CMP1015",
      category: "Street Light",
      location: "Village X",
      date: "28 Sep 2026",
      status: "Pending",
    },
    {
      id: "CMP1009",
      category: "Water Supply",
      location: "Village Y",
      date: "22 Sep 2026",
      status: "Resolved",
    },
  ];

  const getStatusStyle = (status: ComplaintStatus): string => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-700";

      case "In Progress":
        return "bg-blue-100 text-blue-700";

      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle size={16} />;

      case "In Progress":
        return <Clock size={16} />;

      case "Pending":
        return <AlertCircle size={16} />;

      case "Rejected":
        return <XCircle size={16} />;

      default:
        return null;
    }
  };

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      active: true,
    },
    {
      name: "My Profile",
      icon: <User size={20} />,
    },
    {
      name: "Register Complaint",
      icon: <FileText size={20} />,
    },
    {
      name: "My Complaints",
      icon: <FileText size={20} />,
    },
    {
      name: "Track Complaint",
      icon: <MapPin size={20} />,
    },
    {
      name: "Feedback",
      icon: <MessageSquare size={20} />,
    },
    {
      name: "Notifications",
      icon: <Bell size={20} />,
    },
    {
      name: "Help & Support",
      icon: <HelpCircle size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <div className="lg:hidden bg-white border-b px-5 py-4 flex items-center justify-between sticky top-0 z-40">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
            C
          </div>

          <div>
            <h1 className="font-bold text-gray-800">
              CivicConnect
            </h1>

            <p className="text-xs text-gray-500">
              Complaint Management
            </p>
          </div>

        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>

      </div>


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-white border-r z-50
          transform transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* Logo */}

        <div className="h-20 px-6 flex items-center justify-between border-b">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
              C
            </div>

            <div>
              <h1 className="font-bold text-gray-800">
                CivicConnect
              </h1>

              <p className="text-xs text-gray-500">
                Citizen Portal
              </p>
            </div>

          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X size={22} />
          </button>

        </div>


        {/* Navigation */}

        <nav className="p-4 space-y-1">

          {menuItems.map((item: MenuItem, index: number) => (

            <button
              key={index}
              className={`
                w-full flex items-center gap-3
                px-4 py-3 rounded-xl
                text-sm font-medium transition
                ${
                  item.active
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }
              `}
            >

              {item.icon}

              <span>{item.name}</span>

              {item.name === "Notifications" && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  3
                </span>
              )}

            </button>

          ))}

        </nav>


        {/* Logout */}

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">

          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium">

            <LogOut size={20} />

            Logout

          </button>

        </div>

      </aside>


      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="lg:ml-64">

        {/* =================================================
            DESKTOP HEADER
        ================================================= */}

        <header className="hidden lg:flex h-20 bg-white border-b px-8 items-center justify-between">

          <div>

            <h2 className="text-xl font-bold text-gray-800">
              Citizen Dashboard
            </h2>

            <p className="text-sm text-gray-500">
              Manage and track your civic complaints
            </p>

          </div>


          {/* Header Right */}

          <div className="flex items-center gap-5">

            {/* Notification */}

            <button className="relative p-2 rounded-full hover:bg-gray-100">

              <Bell size={22} />

              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>

            </button>


            {/* User */}

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                MP
              </div>

              <div>

                <p className="font-semibold text-sm">
                  Madhura Patil
                </p>

                <p className="text-xs text-gray-500">
                  Citizen
                </p>

              </div>

            </div>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <section className="p-5 md:p-8">


          {/* =================================================
              WELCOME
          ================================================= */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

            <div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Welcome back! 👋
              </h1>

              <p className="text-gray-500 mt-1">
                Here is an overview of your civic complaints.
              </p>

            </div>


            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm">

              <Plus size={20} />

              Register New Complaint

            </button>

          </div>


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">


            {/* Pending */}

            <div className="bg-white rounded-2xl p-5 border shadow-sm">

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-sm text-gray-500">
                    Pending
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    03
                  </h3>

                </div>

                <div className="w-11 h-11 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">

                  <AlertCircle />

                </div>

              </div>

            </div>


            {/* In Progress */}

            <div className="bg-white rounded-2xl p-5 border shadow-sm">

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-sm text-gray-500">
                    In Progress
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    02
                  </h3>

                </div>

                <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">

                  <Clock />

                </div>

              </div>

            </div>


            {/* Resolved */}

            <div className="bg-white rounded-2xl p-5 border shadow-sm">

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-sm text-gray-500">
                    Resolved
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    08
                  </h3>

                </div>

                <div className="w-11 h-11 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">

                  <CheckCircle />

                </div>

              </div>

            </div>


            {/* Total */}

            <div className="bg-white rounded-2xl p-5 border shadow-sm">

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-sm text-gray-500">
                    Total Complaints
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    13
                  </h3>

                </div>

                <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">

                  <FileText />

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              COMPLAINTS + USER DETAILS
          ================================================= */}

          <div className="grid lg:grid-cols-3 gap-6">


            {/* Previous Complaints */}

            <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm">

              <div className="p-5 border-b flex items-center justify-between">

                <div>

                  <h2 className="font-bold text-lg">
                    Previous Complaints
                  </h2>

                  <p className="text-sm text-gray-500">
                    Your recently submitted complaints
                  </p>

                </div>

                <button className="text-blue-600 text-sm font-semibold">
                  View All
                </button>

              </div>


              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase">
                        Complaint
                      </th>

                      <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase">
                        Location
                      </th>

                      <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase">
                        Date
                      </th>

                      <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase">
                        Status
                      </th>

                      <th></th>

                    </tr>

                  </thead>


                  <tbody>

                    {complaints.map((complaint: Complaint) => (

                      <tr
                        key={complaint.id}
                        className="border-t hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">

                          <p className="font-semibold text-sm">
                            {complaint.category}
                          </p>

                          <p className="text-xs text-gray-500">
                            {complaint.id}
                          </p>

                        </td>


                        <td className="px-5 py-4">

                          <div className="flex items-center gap-1 text-sm text-gray-600">

                            <MapPin size={15} />

                            {complaint.location}

                          </div>

                        </td>


                        <td className="px-5 py-4 text-sm text-gray-600">
                          {complaint.date}
                        </td>


                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex items-center gap-1
                              px-3 py-1.5 rounded-full
                              text-xs font-semibold
                              ${getStatusStyle(complaint.status)}
                            `}
                          >

                            {getStatusIcon(complaint.status)}

                            {complaint.status}

                          </span>

                        </td>


                        <td className="px-5 py-4">

                          <button className="text-blue-600 hover:text-blue-800">

                            <ChevronRight size={20} />

                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>


            {/* =================================================
                USER DETAILS
            ================================================= */}

            <div className="bg-white rounded-2xl border shadow-sm">

              <div className="p-5 border-b">

                <h2 className="font-bold text-lg">
                  User Details
                </h2>

                <p className="text-sm text-gray-500">
                  Your registered information
                </p>

              </div>


              <div className="p-5">

                {/* Profile */}

                <div className="flex items-center gap-4 mb-6">

                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                    MP
                  </div>

                  <div>

                    <h3 className="font-bold">
                      Madhura Patil
                    </h3>

                    <p className="text-sm text-gray-500">
                      Citizen ID: CMC-10245
                    </p>

                  </div>

                </div>


                {/* Details */}

                <div className="space-y-4">

                  <div>

                    <p className="text-xs text-gray-500">
                      Mobile Number
                    </p>

                    <p className="font-medium text-sm mt-1">
                      +91 XXXXX XXXXX
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500">
                      Email
                    </p>

                    <p className="font-medium text-sm mt-1">
                      citizen@example.com
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500">
                      Location
                    </p>

                    <p className="font-medium text-sm mt-1">
                      Pune, Maharashtra
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500">
                      Member Since
                    </p>

                    <p className="font-medium text-sm mt-1">
                      August 2026
                    </p>

                  </div>

                </div>


                <button className="w-full mt-6 border border-blue-600 text-blue-600 hover:bg-blue-50 py-2.5 rounded-xl font-semibold">
                  Edit Profile
                </button>

              </div>

            </div>

          </div>


          {/* =================================================
              TRACK COMPLAINT + FEEDBACK
          ================================================= */}

          <div className="grid lg:grid-cols-3 gap-6 mt-6">


            {/* Complaint Tracking */}

            <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6">

              <div className="flex justify-between items-center mb-6">

                <div>

                  <h2 className="font-bold text-lg">
                    Track Latest Complaint
                  </h2>

                  <p className="text-sm text-gray-500">
                    CMP1024 • Road Damage
                  </p>

                </div>

                <button className="text-blue-600 font-semibold text-sm">
                  View Details
                </button>

              </div>


              <div className="relative">

                {/* Progress Line */}

                <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 hidden md:block" />


                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">


                  {/* Registered */}

                  <div className="text-center">

                    <div className="w-10 h-10 mx-auto rounded-full bg-green-500 text-white flex items-center justify-center relative z-10">

                      <CheckCircle size={20} />

                    </div>

                    <p className="font-semibold text-sm mt-3">
                      Registered
                    </p>

                    <p className="text-xs text-gray-500">
                      05 Oct
                    </p>

                  </div>


                  {/* Verified */}

                  <div className="text-center">

                    <div className="w-10 h-10 mx-auto rounded-full bg-green-500 text-white flex items-center justify-center relative z-10">

                      <CheckCircle size={20} />

                    </div>

                    <p className="font-semibold text-sm mt-3">
                      Verified
                    </p>

                    <p className="text-xs text-gray-500">
                      05 Oct
                    </p>

                  </div>


                  {/* In Progress */}

                  <div className="text-center">

                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center relative z-10">

                      <Clock size={20} />

                    </div>

                    <p className="font-semibold text-sm mt-3">
                      In Progress
                    </p>

                    <p className="text-xs text-gray-500">
                      06 Oct
                    </p>

                  </div>


                  {/* Resolved */}

                  <div className="text-center">

                    <div className="w-10 h-10 mx-auto rounded-full bg-gray-200 text-gray-400 flex items-center justify-center relative z-10">

                      <CheckCircle size={20} />

                    </div>

                    <p className="font-semibold text-sm mt-3 text-gray-400">
                      Resolved
                    </p>

                    <p className="text-xs text-gray-400">
                      Pending
                    </p>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                FEEDBACK
            ================================================= */}

            <div className="bg-white rounded-2xl border shadow-sm p-6">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">

                  <MessageSquare />

                </div>

                <div>

                  <h2 className="font-bold">
                    Feedback
                  </h2>

                  <p className="text-xs text-gray-500">
                    Help us improve
                  </p>

                </div>

              </div>


              <p className="text-sm text-gray-600 mb-4">

                Have you recently received a resolution?
                Share your experience with us.

              </p>


              {/* Rating */}

              <div className="flex gap-1 mb-4">

                {[1, 2, 3, 4, 5].map((star: number) => (

                  <button
                    key={star}
                    className="text-2xl text-yellow-400 hover:scale-110 transition"
                  >
                    ★
                  </button>

                ))}

              </div>


              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold">

                Give Feedback

              </button>

            </div>

          </div>


          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div className="mt-6 bg-white rounded-2xl border shadow-sm">

            <div className="p-5 border-b flex justify-between items-center">

              <div>

                <h2 className="font-bold text-lg">
                  Recent Notifications
                </h2>

                <p className="text-sm text-gray-500">
                  Latest updates about your complaints
                </p>

              </div>

              <button className="text-blue-600 text-sm font-semibold">
                View All
              </button>

            </div>


            <div className="divide-y">


              {/* Notification 1 */}

              <div className="p-5 flex gap-4">

                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">

                  <Bell size={18} />

                </div>

                <div>

                  <p className="font-semibold text-sm">
                    Complaint CMP1024 updated
                  </p>

                  <p className="text-sm text-gray-500 mt-1">

                    Your complaint has been assigned to the
                    Public Works Department.

                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    2 hours ago
                  </p>

                </div>

              </div>


              {/* Notification 2 */}

              <div className="p-5 flex gap-4">

                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">

                  <CheckCircle size={18} />

                </div>

                <div>

                  <p className="font-semibold text-sm">
                    Complaint CMP1020 resolved
                  </p>

                  <p className="text-sm text-gray-500 mt-1">

                    Your garbage collection complaint has
                    been successfully resolved.

                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    Yesterday
                  </p>

                </div>

              </div>

            </div>

          </div>


        </section>

      </main>

    </div>
  );
}