"use client";

import React from "react";

const STATUS_STYLES: Record<string, string> = {
  // Quotation statuses
  Draft: "bg-slate-100 text-slate-700 border-[#DDE4DA]",
  Sent: "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  Expired: "bg-amber-50 text-amber-700 border-amber-200",

  // Project statuses
  New: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Approved – Installation Pending": "bg-amber-50 text-amber-800 border-amber-200",
  "Installation Scheduled": "bg-blue-50 text-blue-700 border-blue-200",
  "Installation In Progress": "bg-cyan-50 text-cyan-800 border-cyan-200",
  "Partially Installed": "bg-purple-50 text-purple-800 border-purple-200",
  "Installation Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "On Hold": "bg-slate-100 text-slate-700 border-slate-300",
  "Project Created": "bg-slate-100 text-slate-800 border-slate-300",
  "Installation Not Scheduled": "bg-amber-50 text-amber-800 border-amber-300",
  "Quotation Pending": "bg-amber-50 text-amber-700 border-amber-200",
  "Quotation Sent": "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-cyan-50 text-cyan-700 border-cyan-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export function StatusBadge({ status }: { status: string }) {
  const style =
    STATUS_STYLES[status] || "bg-slate-100 text-slate-700 border-[#DDE4DA]";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      {status}
    </span>
  );
}

