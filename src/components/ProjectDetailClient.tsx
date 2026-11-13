"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  UserCheck,
  Users,
  MapPin,
  Phone,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Truck,
  RotateCw,
} from "lucide-react";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { TechnicalDrawingSvg } from "./TechnicalDrawingSvg";

interface ProjectDetailProps {
  project: {
    id: string;
    projectCode: string;
    name: string;
    siteName: string;
    siteAddress: string;
    contactPerson?: string | null;
    contactNumber?: string | null;
    category: string;
    description?: string | null;
    status: string;
    createdAt: string | Date;
    customer: {
      id: string;
      customerCode: string;
      name: string;
      mobile: string;
      email?: string | null;
      billingAddress: string;
    };
    approvedQuotation?: {
      id: string;
      quotationNumber: string;
      revisionNumber: number;
      grandTotal: number;
      totalSqFt: number;
      quotationDate: string | Date;
      components: Array<{
        id: string;
        code: string;
        name: string;
        location?: string;
        widthMm: number;
        heightMm: number;
        quantity: number;
        sqFtPerUnit: number;
        ratePerSqFt: number;
        unitPrice: number;
        totalValue: number;
        drawingType: string;
        drawingConfigJson?: string;
        customImageUrl?: string | null;
        profileSystem?: string | null;
        glassType?: string | null;
      }>;
    } | null;
    installationSchedule?: {
      id: string;
      installationDate?: string | Date | null;
      expectedCompletionDate?: string | Date | null;
      installationTime?: string | null;
      supervisor?: string | null;
      teamMembers?: string | null;
      siteContactPerson?: string | null;
      siteContactNumber?: string | null;
      installationAddress?: string | null;
      internalRemarks?: string | null;
      customerInstructions?: string | null;
      status: string;
      rescheduledCount: number;
    } | null;
  };
}

export function ProjectDetailClient({ project }: ProjectDetailProps) {
  const [schedule, setSchedule] = useState({
    installationDate: project.installationSchedule?.installationDate
      ? String(project.installationSchedule.installationDate).slice(0, 10)
      : "",
    expectedCompletionDate: project.installationSchedule?.expectedCompletionDate
      ? String(project.installationSchedule.expectedCompletionDate).slice(0, 10)
      : "",
    installationTime: project.installationSchedule?.installationTime || "10:00 AM",
    supervisor: project.installationSchedule?.supervisor || "",
    teamMembers: project.installationSchedule?.teamMembers || "",
    siteContactPerson:
      project.installationSchedule?.siteContactPerson ||
      project.contactPerson ||
      project.customer.name,
    siteContactNumber:
      project.installationSchedule?.siteContactNumber ||
      project.contactNumber ||
      project.customer.mobile,
    installationAddress:
      project.installationSchedule?.installationAddress || project.siteAddress,
    internalRemarks: project.installationSchedule?.internalRemarks || "",
    customerInstructions: project.installationSchedule?.customerInstructions || "",
    status: project.installationSchedule?.status || "Not Scheduled",
  });

  const [projectStatus, setProjectStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");

    const res = await fetch(`/api/projects/${project.id}/installation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...schedule,
        installationDate: schedule.installationDate || null,
        expectedCompletionDate: schedule.expectedCompletionDate || null,
      }),
    });

    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to update installation schedule");
      return;
    }
    setMsg("Installation schedule and project status updated successfully!");
    if (data.projectStatus) setProjectStatus(data.projectStatus);
    if (data.schedule?.status) {
      setSchedule((s) => ({ ...s, status: data.schedule.status }));
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTIONS A, B & C: Project Overview, Customer & Site Information */}
      <div className="bg-white rounded-2xl border border-[#E5EAE3] p-6 shadow-sm space-y-6">
        {/* Section A: Project Overview Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E5EAE3] pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#174535] text-white">
                {project.projectCode}
              </span>
              <h1 className="text-2xl font-bold text-[#1F2937]">{project.name}</h1>
              <StatusBadge status={projectStatus} />
              {project.approvedQuotation && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#174535] border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-[#174535]" /> Created from Approved Quotation
                </span>
              )}
            </div>
            <p className="text-xs text-[#718075] mt-1.5 flex items-center gap-2">
              <span>Category: <strong>{project.category}</strong></span>
              <span>•</span>
              <span>Created {formatDate(project.createdAt)}</span>
            </p>
          </div>

          {project.approvedQuotation && (
            <div className="flex items-center gap-3 bg-[#F7F8F4] border border-[#E5EAE3] rounded-xl px-4 py-2.5">
              <div>
                <div className="text-[11px] font-semibold text-[#718075] uppercase">
                  Approved Quotation
                </div>
                <Link
                  href={`/quotations/${project.approvedQuotation.id}`}
                  className="font-bold text-sm text-[#174535] hover:underline font-mono"
                >
                  {project.approvedQuotation.quotationNumber} (Rev {project.approvedQuotation.revisionNumber})
                </Link>
              </div>
              <div className="text-right border-l border-[#E5EAE3] pl-3">
                <div className="text-[11px] font-semibold text-[#718075] uppercase">
                  Approved Value
                </div>
                <div className="text-base font-bold text-[#1F2937]">
                  {formatINR(project.approvedQuotation.grandTotal)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Info: Customer (Section B) & Site (Section C) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* Section B: Customer Information */}
          <div className="bg-[#F7F8F4] border border-[#E5EAE3] rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#174535] mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Customer Information
            </h3>
            <div className="font-bold text-[#1F2937] text-base">
              <Link href={`/customers/${project.customer.id}`} className="hover:underline">
                {project.customer.name}
              </Link>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.customer.mobile}</span>
              {project.customer.email && (
                <>
                  <span>•</span>
                  <span>{project.customer.email}</span>
                </>
              )}
            </div>
            <div className="text-xs text-[#718075] flex items-start gap-2 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#8BA77A] shrink-0 mt-0.5" />
              <span>{project.customer.billingAddress}</span>
            </div>
          </div>

          {/* Section C: Project & Site Information */}
          <div className="bg-[#F7F8F4] border border-[#E5EAE3] rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#174535] mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Site Information
            </h3>
            <div className="font-bold text-[#1F2937] text-base">{project.siteName}</div>
            <div className="text-xs text-[#718075] flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#8BA77A] shrink-0 mt-0.5" />
              <span>{project.siteAddress}</span>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-2 pt-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Site Contact: <strong>{project.contactPerson || project.customer.name}</strong></span>
              <span>•</span>
              <span>{project.contactNumber || project.customer.mobile}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION E: INSTALLATION SCHEDULE & PROGRESS */}
      <div className="bg-white rounded-2xl border border-[#E5EAE3] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAE3] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#174535]" /> Installation Schedule &amp; Progress
            </h2>
            <p className="text-xs text-[#718075]">
              Assign installation dates, site supervisor, team, and manage installation workflow stages.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Installation Status:</span>
            <StatusBadge status={schedule.status} />
          </div>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {msg}
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Installation Start Date *
              </label>
              <input
                type="date"
                value={schedule.installationDate}
                onChange={(e) => setSchedule({ ...schedule, installationDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Expected Completion Date
              </label>
              <input
                type="date"
                value={schedule.expectedCompletionDate}
                onChange={(e) =>
                  setSchedule({ ...schedule, expectedCompletionDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Installation Time / Shift
              </label>
              <input
                value={schedule.installationTime}
                onChange={(e) => setSchedule({ ...schedule, installationTime: e.target.value })}
                placeholder="e.g. 10:00 AM or Morning"
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Installation Workflow Status
              </label>
              <select
                value={schedule.status}
                onChange={(e) => setSchedule({ ...schedule, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm font-semibold bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              >
                <option value="Not Scheduled">Not Scheduled</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Installation In Progress">Installation In Progress</option>
                <option value="Partially Installed">Partially Installed</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Rescheduled">Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Assigned Supervisor
              </label>
              <input
                value={schedule.supervisor}
                onChange={(e) => setSchedule({ ...schedule, supervisor: e.target.value })}
                placeholder="Supervisor Name"
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Installation Team Members
              </label>
              <input
                value={schedule.teamMembers}
                onChange={(e) => setSchedule({ ...schedule, teamMembers: e.target.value })}
                placeholder="Team / Technicians"
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Site Contact Person
              </label>
              <input
                value={schedule.siteContactPerson}
                onChange={(e) => setSchedule({ ...schedule, siteContactPerson: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Site Contact Number
              </label>
              <input
                value={schedule.siteContactNumber}
                onChange={(e) => setSchedule({ ...schedule, siteContactNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm font-mono text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1F2937] mb-1">
                Installation Location Address
              </label>
              <input
                value={schedule.installationAddress}
                onChange={(e) => setSchedule({ ...schedule, installationAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Internal Remarks
              </label>
              <input
                value={schedule.internalRemarks}
                onChange={(e) => setSchedule({ ...schedule, internalRemarks: e.target.value })}
                placeholder="e.g. Bring scaffolding, special crane needed"
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">
                Customer Instructions
              </label>
              <input
                value={schedule.customerInstructions}
                onChange={(e) => setSchedule({ ...schedule, customerInstructions: e.target.value })}
                placeholder="e.g. Call 1 hour before arrival"
                className="w-full px-3 py-2 rounded-lg border border-[#E5EAE3] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#E5EAE3]">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#174535] text-white text-xs font-bold hover:bg-[#10382D] shadow-sm disabled:opacity-60 transition-colors"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving Schedule..." : "Save Installation Schedule"}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION D: QUOTATION SPECIFICATIONS & TECHNICAL DRAWINGS */}
      {project.approvedQuotation && project.approvedQuotation.components.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5EAE3] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAE3] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#174535]" /> Quotation Information &amp; Technical Drawings ({project.approvedQuotation.components.length})
              </h2>
              <p className="text-xs text-[#718075]">
                Quotation #{project.approvedQuotation.quotationNumber} • Exact dimensions, quantities, specifications and technical drawings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-[#F7F8F4] border border-[#E5EAE3] px-3 py-1 rounded-full text-[#174535]">
                Total: {formatNumber(project.approvedQuotation.totalSqFt)} Sq.Ft.
              </span>
              <span className="font-bold text-xs bg-[#174535] text-white px-3 py-1 rounded-full">
                Value: {formatINR(project.approvedQuotation.grandTotal)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {project.approvedQuotation.components.map((comp, idx) => (
              <div
                key={comp.id || idx}
                className="border border-[#E5EAE3] rounded-xl p-4 bg-[#F7F8F4] space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#E5EAE3] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-[#174535] text-white px-2 py-0.5 rounded">
                      {comp.code}
                    </span>
                    <span className="font-bold text-sm text-[#1F2937]">{comp.name}</span>
                  </div>
                  {comp.location && (
                    <span className="text-[10px] font-semibold text-[#718075] uppercase bg-white border border-[#E5EAE3] px-2 py-0.5 rounded">
                      {comp.location}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6 bg-white border border-[#E5EAE3] rounded-lg p-2.5 flex items-center justify-center min-h-[160px]">
                    <TechnicalDrawingSvg
                      widthMm={comp.widthMm}
                      heightMm={comp.heightMm}
                      drawingType={comp.drawingType}
                      drawingConfigJson={comp.drawingConfigJson}
                      customImageUrl={comp.customImageUrl}
                      location={comp.location}
                      code={comp.code}
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1.5 text-xs text-slate-700">
                    <div className="bg-white p-2 rounded border border-[#E5EAE3] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dimensions:</span>
                        <strong className="font-mono">{comp.widthMm} × {comp.heightMm} mm</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quantity:</span>
                        <strong>{comp.quantity} Unit(s)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Area:</span>
                        <strong className="font-mono">{formatNumber(comp.sqFtPerUnit * comp.quantity)} Sq.Ft.</strong>
                      </div>
                      <div className="flex justify-between border-t border-[#E5EAE3] pt-1">
                        <span className="text-slate-500">Total Value:</span>
                        <strong className="text-[#174535]">{formatINR(comp.totalValue)}</strong>
                      </div>
                    </div>

                    {(comp.profileSystem || comp.glassType) && (
                      <div className="bg-white p-2 rounded border border-[#E5EAE3] text-[11px] space-y-0.5">
                        {comp.profileSystem && (
                          <div className="truncate">
                            <span className="text-slate-500">Profile: </span>
                            <strong>{comp.profileSystem}</strong>
                          </div>
                        )}
                        {comp.glassType && (
                          <div className="truncate">
                            <span className="text-slate-500">Glass: </span>
                            <strong>{comp.glassType}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

