"use client";

import React, { useState } from "react";
import {
  DivisionInfo,
  DistrictInfo,
  LocalAuthorityInfo,
  DepartmentInfo,
} from "@/types/hierarchy";
import {
  INITIAL_DIVISIONS,
  INITIAL_DISTRICTS,
  INITIAL_AUTHORITIES,
  INITIAL_DEPARTMENTS,
} from "@/lib/api/hierarchy";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FolderTree,
  Plus,
  Shield,
  Layers,
  MapPin,
  Users,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HierarchyManagementView() {
  const [divisions, setDivisions] = useState<DivisionInfo[]>(INITIAL_DIVISIONS);
  const [districts, setDistricts] = useState<DistrictInfo[]>(INITIAL_DISTRICTS);
  const [authorities, setAuthorities] = useState<LocalAuthorityInfo[]>(INITIAL_AUTHORITIES);
  const [departments, setDepartments] = useState<DepartmentInfo[]>(INITIAL_DEPARTMENTS);

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("div-kolhapur");
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string>("auth-kmc");

  // Modal State
  const [isAddDivisionOpen, setIsAddDivisionOpen] = useState(false);
  const [isAddAuthorityOpen, setIsAddAuthorityOpen] = useState(false);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);

  // Form states
  const [newDivName, setNewDivName] = useState("");
  const [newDivHq, setNewDivHq] = useState("");

  const [newAuthName, setNewAuthName] = useState("");
  const [newAuthType, setNewAuthType] = useState<LocalAuthorityInfo["type"]>("MUNICIPAL_CORPORATION");

  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHead, setNewDeptHead] = useState("");

  const handleCreateDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivName.trim()) return;
    const newDiv: DivisionInfo = {
      id: `div-${Date.now()}`,
      code: `${newDivName.slice(0, 3).toUpperCase()}-DIV`,
      name: newDivName.trim(),
      state: "Maharashtra",
      headquarters: newDivHq || newDivName,
      districtsCount: 2,
      authoritiesCount: 3,
      status: "ACTIVE",
    };
    setDivisions([...divisions, newDiv]);
    setNewDivName("");
    setNewDivHq("");
    setIsAddDivisionOpen(false);
  };

  const handleCreateAuthority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthName.trim()) return;
    const newAuth: LocalAuthorityInfo = {
      id: `auth-${Date.now()}`,
      code: newAuthName.slice(0, 4).toUpperCase(),
      name: newAuthName.trim(),
      type: newAuthType,
      districtId: districts[0]?.id || "dist-kolhapur",
      divisionId: selectedDivisionId,
      departmentsCount: 4,
    };
    setAuthorities([...authorities, newAuth]);
    setNewAuthName("");
    setIsAddAuthorityOpen(false);
  };

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const newDept: DepartmentInfo = {
      id: `dept-${Date.now()}`,
      code: newDeptName.slice(0, 3).toUpperCase(),
      name: newDeptName.trim(),
      authorityId: selectedAuthorityId,
      headOfficerName: newDeptHead || "Designated Head",
      categories: [newDeptName],
      activeOfficersCount: 5,
    };
    setDepartments([...departments, newDept]);
    setNewDeptName("");
    setNewDeptHead("");
    setIsAddDeptOpen(false);
  };

  const activeDiv = divisions.find((d) => d.id === selectedDivisionId) || divisions[0];
  const activeDivDistricts = districts.filter((d) => d.divisionId === selectedDivisionId);
  const activeDivAuthorities = authorities.filter((a) => a.divisionId === selectedDivisionId);
  const activeAuthDepts = departments.filter((d) => d.authorityId === selectedAuthorityId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#0B4EA2]" />
            <h3 className="font-extrabold text-base sm:text-lg text-[#0F172A]">
              State Administrative Hierarchy & Jurisdiction Topology
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Scalable model: <strong>State → Division → District/Local Authority → Department → Officer</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDivisionOpen(true)}
            className="text-xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Division
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddAuthorityOpen(true)}
            className="text-xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Local Authority
          </Button>
        </div>
      </div>

      {/* 3-Column Hierarchy Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: DIVISIONS */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-[#0B4EA2] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0B4EA2]" />
              1. Divisions ({divisions.length})
            </span>
            <span className="text-[10px] text-[#64748B]">State Level</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {divisions.map((div) => {
              const isSelected = div.id === selectedDivisionId;
              return (
                <div
                  key={div.id}
                  onClick={() => setSelectedDivisionId(div.id)}
                  className={cn(
                    "p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between",
                    isSelected
                      ? "border-[#0B4EA2] bg-[#EAF2FF] text-[#0B4EA2] font-semibold"
                      : "border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A]"
                  )}
                >
                  <div>
                    <span className="block font-bold">{div.name}</span>
                    <span className="text-[11px] text-[#64748B]">
                      HQ: {div.headquarters} • Code: {div.code}
                    </span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4", isSelected ? "text-[#0B4EA2]" : "text-[#CBD5E1]")} />
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: LOCAL AUTHORITIES IN SELECTED DIVISION */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#0F766E]" />
              2. Local Authorities ({activeDivAuthorities.length})
            </span>
            <span className="text-[10px] text-[#64748B]">in {activeDiv.name}</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activeDivAuthorities.map((auth) => {
              const isSelected = auth.id === selectedAuthorityId;
              return (
                <div
                  key={auth.id}
                  onClick={() => setSelectedAuthorityId(auth.id)}
                  className={cn(
                    "p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between",
                    isSelected
                      ? "border-[#0F766E] bg-[#ECFEFF] text-[#0F766E] font-semibold"
                      : "border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A]"
                  )}
                >
                  <div>
                    <span className="block font-bold">{auth.name}</span>
                    <span className="text-[11px] text-[#64748B]">
                      Type: {auth.type.replace("_", " ")}
                    </span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4", isSelected ? "text-[#0F766E]" : "text-[#CBD5E1]")} />
                </div>
              );
            })}

            {activeDivAuthorities.length === 0 && (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No local authorities mapped yet under this division.
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: DEPARTMENTS UNDER SELECTED LOCAL AUTHORITY */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#B45309]" />
              3. Departments ({activeAuthDepts.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDeptOpen(true)}
              className="text-[11px] h-7 px-2"
            >
              + Add Dept
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activeAuthDepts.map((dept) => (
              <div
                key={dept.id}
                className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] text-xs space-y-1 bg-[#F8FAFC]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">{dept.name}</span>
                  <span className="text-[10px] font-mono text-[#0B4EA2] bg-[#EAF2FF] px-1.5 py-0.5 rounded">
                    {dept.code}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Head: {dept.headOfficerName || "Designated Officer"}
                </div>
                <div className="text-[10px] text-[#16A34A] font-semibold">
                  {dept.activeOfficersCount} On-Duty Field Officers
                </div>
              </div>
            ))}

            {activeAuthDepts.length === 0 && (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No departments configured for this authority yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ADD DIVISION */}
      {isAddDivisionOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h4 className="font-bold text-base text-[#0F172A]">Add New Administrative Division</h4>
              <button type="button" onClick={() => setIsAddDivisionOpen(false)}>
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>
            <form onSubmit={handleCreateDivision} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">
                  Division Name (e.g. Nagpur Division) *
                </label>
                <input
                  type="text"
                  required
                  value={newDivName}
                  onChange={(e) => setNewDivName(e.target.value)}
                  placeholder="e.g. Nagpur Division"
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Headquarters City</label>
                <input
                  type="text"
                  value={newDivHq}
                  onChange={(e) => setNewDivHq(e.target.value)}
                  placeholder="e.g. Nagpur"
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsAddDivisionOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Register Division
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LOCAL AUTHORITY */}
      {isAddAuthorityOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h4 className="font-bold text-base text-[#0F172A]">
                Add Local Authority in {activeDiv.name}
              </h4>
              <button type="button" onClick={() => setIsAddAuthorityOpen(false)}>
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>
            <form onSubmit={handleCreateAuthority} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">
                  Local Authority Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAuthName}
                  onChange={(e) => setNewAuthName(e.target.value)}
                  placeholder="e.g. Solapur Municipal Corporation"
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Authority Type</label>
                <select
                  value={newAuthType}
                  onChange={(e) => setNewAuthType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-sm"
                >
                  <option value="MUNICIPAL_CORPORATION">Municipal Corporation (Maha Nagar Palika)</option>
                  <option value="MUNICIPAL_COUNCIL">Municipal Council (Nagar Palika)</option>
                  <option value="ZILLA_PARISHAD">Zilla Parishad (Rural District)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsAddAuthorityOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Register Authority
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h4 className="font-bold text-base text-[#0F172A]">Register New Department</h4>
              <button type="button" onClick={() => setIsAddDeptOpen(false)}>
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Department Name *</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Encroachment & Town Planning"
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Head of Department</label>
                <input
                  type="text"
                  value={newDeptHead}
                  onChange={(e) => setNewDeptHead(e.target.value)}
                  placeholder="e.g. Er. Sanjay Patil"
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsAddDeptOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Add Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
