"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  Activity,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Plus,
  ArrowUpRight,
  Truck,
  CheckCircle,
  Calendar,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  BarChart2,
  FileCheck2,
  UserCheck,
  Building2,
  Send,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

interface DashboardData {
  summary: {
    totalCustomers: number;
    totalProjects: number;
    activeProjects: number;
    totalQuotations: number;
    pendingQuotations: number;
    awaitingApproval?: number;
    approvedQuotations: number;
    rejectedQuotations: number;
    totalQuotationValue: number;
    totalApprovedValue?: number;
    upcomingInstallationsCount?: number;
    completedInstallationsCount?: number;
  };
  charts: {
    monthly: Array<{
      key: string;
      label: string;
      quotationValue: number;
      approvedValue: number;
      quotationCount: number;
      projectCount: number;
    }>;
    quotationStatus: Array<{ status: string; count: number }>;
    projectStatus: Array<{ status: string; count: number }>;
  };
  recentActivities: {
    customers: Array<{
      id: string;
      customerCode: string;
      name: string;
      city?: string;
      mobile?: string;
      createdAt: string;
    }>;
    projects: Array<{
      id: string;
      projectCode: string;
      name: string;
      status: string;
      createdAt: string;
      customer: { name: string };
      approvedQuotation?: { quotationNumber: string; grandTotal: number } | null;
    }>;
    quotations: Array<{
      id: string;
      quotationNumber: string;
      status: string;
      grandTotal: number;
      createdAt: string;
      customer: { name: string };
    }>;
    approvedQuotations: Array<{
      id: string;
      quotationNumber: string;
      grandTotal: number;
      updatedAt: string;
      customer: { name: string };
      convertedProject?: { id: string; projectCode: string } | null;
    }>;
    upcomingInstallations?: Array<{
      id: string;
      installationDate?: string | null;
      status: string;
      supervisor?: string | null;
      project: {
        id: string;
        projectCode: string;
        name: string;
        siteAddress: string;
        customer: { name: string; mobile: string };
      };
    }>;
    logs?: Array<{
      id: string;
      action: string;
      summary: string;
      entityType?: string;
      createdAt: string;
      user?: { name: string } | null;
    }>;
  };
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse max-w-[1600px] mx-auto">
        {/* Skeleton Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 py-1">
          <div className="space-y-2">
            <div className="h-7 bg-slate-200 rounded-md w-56" />
            <div className="h-4 bg-slate-100 rounded-md w-80" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-slate-200 rounded-lg w-28" />
            <div className="h-9 bg-slate-200 rounded-lg w-32" />
          </div>
        </div>

        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-[#E5EAE3]" />
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-72 bg-white rounded-xl border border-[#E5EAE3]" />
          <div className="h-72 bg-white rounded-xl border border-[#E5EAE3]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E5EAE3] max-w-xl mx-auto my-12">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Failed to load dashboard data</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Please check your connection or contact your administrator.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-3.5 py-1.5 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D]"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const { summary, charts, recentActivities } = data;

  // 8 Primary Executive Metrics
  const kpiMetrics = [
    {
      id: "customers",
      label: "Total Customers",
      value: summary.totalCustomers,
      formattedValue: String(summary.totalCustomers),
      icon: Users,
      href: "/customers",
      note: summary.totalCustomers > 0 ? "Registered accounts" : "No accounts yet",
    },
    {
      id: "quotations",
      label: "Total Quotations",
      value: summary.totalQuotations,
      formattedValue: String(summary.totalQuotations),
      icon: FileSpreadsheet,
      href: "/quotations",
      note: summary.totalQuotations > 0 ? "Lifetime offers created" : "No quotations yet",
    },
    {
      id: "awaiting",
      label: "Awaiting Approval",
      value: summary.awaitingApproval ?? summary.pendingQuotations,
      formattedValue: String(summary.awaitingApproval ?? summary.pendingQuotations),
      icon: Clock,
      href: "/quotations?status=Sent",
      note:
        (summary.awaitingApproval ?? summary.pendingQuotations) > 0
          ? "Pending client sign-off"
          : "Zero pending",
    },
    {
      id: "approved",
      label: "Approved Quotations",
      value: summary.approvedQuotations,
      formattedValue: String(summary.approvedQuotations),
      icon: CheckCircle2,
      href: "/quotations?status=Approved",
      note:
        summary.approvedQuotations > 0
          ? "Ready for conversion"
          : "No approved quotes",
    },
    {
      id: "active_projects",
      label: "Active Projects",
      value: summary.activeProjects,
      formattedValue: String(summary.activeProjects),
      icon: FolderKanban,
      href: "/projects",
      note: summary.activeProjects > 0 ? "In fabrication / site" : "No active sites",
    },
    {
      id: "upcoming_installs",
      label: "Upcoming Installations",
      value: summary.upcomingInstallationsCount ?? 0,
      formattedValue: String(summary.upcomingInstallationsCount ?? 0),
      icon: Truck,
      href: "/projects",
      note:
        (summary.upcomingInstallationsCount ?? 0) > 0
          ? "Scheduled deployments"
          : "None scheduled",
    },
    {
      id: "completed_installs",
      label: "Completed Installations",
      value: summary.completedInstallationsCount ?? 0,
      formattedValue: String(summary.completedInstallationsCount ?? 0),
      icon: CheckCircle,
      href: "/projects",
      note:
        (summary.completedInstallationsCount ?? 0) > 0
          ? "Fully installed & verified"
          : "Zero completed",
    },
    {
      id: "business_value",
      label: "Total Approved Business Value",
      value: summary.totalApprovedValue ?? 0,
      formattedValue: formatINR(summary.totalApprovedValue ?? 0),
      icon: IndianRupee,
      href: "/quotations?status=Approved",
      isCurrency: true,
      note:
        (summary.totalApprovedValue ?? 0) > 0
          ? "Gross approved value"
          : "₹0.00 approved value",
    },
  ];

  // Max value for monthly chart scaling
  const maxMonthlyValue = Math.max(
    1,
    ...charts.monthly.map((m) => Math.max(m.quotationValue || 0, m.approvedValue || 0))
  );

  const hasMonthlyFinancialData = charts.monthly.some(
    (m) => (m.quotationValue || 0) > 0 || (m.approvedValue || 0) > 0
  );

  const totalMonthlyQuoted = charts.monthly.reduce((s, m) => s + (m.quotationValue || 0), 0);
  const totalMonthlyApproved = charts.monthly.reduce((s, m) => s + (m.approvedValue || 0), 0);

  // Status breakdown mapping
  const statusConfig: Record<
    string,
    { label: string; dotColor: string; barColor: string }
  > = {
    Draft: { label: "Draft", dotColor: "bg-slate-400", barColor: "bg-slate-400" },
    Sent: {
      label: "Sent / Awaiting Approval",
      dotColor: "bg-amber-500",
      barColor: "bg-amber-500",
    },
    Approved: {
      label: "Approved",
      dotColor: "bg-[#174535]",
      barColor: "bg-[#174535]",
    },
    Rejected: {
      label: "Rejected",
      dotColor: "bg-rose-500",
      barColor: "bg-rose-500",
    },
    Expired: {
      label: "Expired",
      dotColor: "bg-slate-300",
      barColor: "bg-slate-300",
    },
  };

  const statusRows = [
    { status: "Draft" },
    { status: "Sent" },
    { status: "Approved" },
    { status: "Rejected" },
    { status: "Expired" },
  ].map(({ status }) => {
    const found = charts.quotationStatus.find((qs) => qs.status === status);
    const count = found ? found.count : 0;
    const total = summary.totalQuotations || 1;
    const pct = summary.totalQuotations > 0 ? Math.round((count / total) * 100) : 0;
    return {
      status,
      count,
      pct,
      config: statusConfig[status] || {
        label: status,
        dotColor: "bg-slate-400",
        barColor: "bg-slate-400",
      },
    };
  });

  const approvalRate =
    summary.totalQuotations > 0
      ? Math.round((summary.approvedQuotations / summary.totalQuotations) * 100)
      : 0;

  // Compile unified recent activity timeline from logs and events
  const activityLogs = recentActivities.logs && recentActivities.logs.length > 0
    ? recentActivities.logs
    : [];

  const upcomingInstalls = recentActivities.upcomingInstallations || [];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-8">
      {/* 1. Header & Executive Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-xl border border-[#E5EAE3] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1F2937] tracking-tight">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#174535] border border-emerald-200/80">
              Live DB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of customers, quotations, projects and installations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/customers?new=1"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" /> Add Customer
          </Link>
          <Link
            href="/quotations?status=Approved"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-500" /> Convert to Project
          </Link>
          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Create Quotation
          </Link>
        </div>
      </div>

      {/* 2. Compact 8 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={m.href}
              className="group bg-white rounded-xl border border-[#E5EAE3] p-4 shadow-2xs hover:shadow-xs hover:border-[#174535]/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {m.label}
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#F7F8F4] border border-[#E5EAE3] flex items-center justify-center text-[#174535] group-hover:bg-[#174535] group-hover:text-white transition-colors shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2.5">
                <div
                  className={`font-bold text-[#1F2937] font-mono tracking-tight ${
                    m.isCurrency ? "text-xl" : "text-2xl"
                  }`}
                >
                  {m.formattedValue}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {m.note}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Quick Actions Ribbon */}
      <div className="bg-white rounded-xl border border-[#E5EAE3] p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Quick Actions
          </span>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 text-xs">
            <Link
              href="/customers?new=1"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#174535] hover:bg-[#F7F8F4] border border-transparent hover:border-[#E5EAE3] transition font-medium"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" /> Add Customer
            </Link>
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#174535] hover:bg-[#F7F8F4] border border-transparent hover:border-[#E5EAE3] transition font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" /> Create Quotation
            </Link>
            <Link
              href="/quotations?status=Sent"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#174535] hover:bg-[#F7F8F4] border border-transparent hover:border-[#E5EAE3] transition font-medium"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" /> View Pending Approvals
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#174535] hover:bg-[#F7F8F4] border border-transparent hover:border-[#E5EAE3] transition font-medium"
            >
              <FolderKanban className="w-3.5 h-3.5 text-slate-400" /> View Active Projects
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#174535] hover:bg-[#F7F8F4] border border-transparent hover:border-[#E5EAE3] transition font-medium"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Schedule Installation
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Financial Charts & Status Breakdown (2-Column Grid: 2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* A. Monthly Quotation Value & Approved Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5EAE3] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-[#1F2937]">
                  Monthly Quotation Value &amp; Approved Revenue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Last 6 months comparative revenue &amp; quotation performance
                </p>
              </div>

              {/* Legend & Stats */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#174535]" />
                  <span className="text-slate-600 font-medium">Total Quoted</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({formatINR(totalMonthlyQuoted)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#8BA77A]" />
                  <span className="text-slate-600 font-medium">Approved</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({formatINR(totalMonthlyApproved)})
                  </span>
                </div>
              </div>
            </div>

            {/* Chart Canvas Area */}
            {!hasMonthlyFinancialData ? (
              <div className="h-60 flex flex-col items-center justify-center text-center py-8">
                <div className="w-10 h-10 rounded-full bg-[#F7F8F4] border border-[#E5EAE3] text-slate-400 flex items-center justify-center mb-2">
                  <BarChart2 className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-600">No financial data available yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                  Monthly quotation values and approved revenue bars will appear automatically once quotations are created in the database.
                </p>
              </div>
            ) : (
              <div className="pt-6 pb-2">
                {/* SVG Grouped Bar Chart */}
                <div className="relative h-56 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-slate-100">
                  {/* Subtle Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                  </div>

                  {charts.monthly.map((m) => {
                    const qH = Math.max(
                      m.quotationValue > 0 ? 4 : 0,
                      Math.round(((m.quotationValue || 0) / maxMonthlyValue) * 160)
                    );
                    const aH = Math.max(
                      m.approvedValue > 0 ? 4 : 0,
                      Math.round(((m.approvedValue || 0) / maxMonthlyValue) * 160)
                    );
                    const isHovered = hoveredMonth === m.key;

                    return (
                      <div
                        key={m.key}
                        className="relative flex-1 flex flex-col items-center justify-end h-full group z-10"
                        onMouseEnter={() => setHoveredMonth(m.key)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                            <div>Quoted: {formatINR(m.quotationValue)}</div>
                            <div className="text-emerald-300">Approved: {formatINR(m.approvedValue)}</div>
                          </div>
                        )}

                        {/* Dual Bars Container */}
                        <div className="w-full flex items-end justify-center gap-1.5 h-44">
                          {/* Quoted Bar */}
                          <div
                            className="w-4 sm:w-6 bg-[#174535] rounded-t transition-all duration-300 hover:brightness-110"
                            style={{ height: `${qH}px` }}
                            title={`Quoted: ${formatINR(m.quotationValue)}`}
                          />
                          {/* Approved Bar */}
                          <div
                            className="w-4 sm:w-6 bg-[#8BA77A] rounded-t transition-all duration-300 hover:brightness-110"
                            style={{ height: `${aH}px` }}
                            title={`Approved: ${formatINR(m.approvedValue)}`}
                          />
                        </div>

                        {/* Month Label */}
                        <span className="text-[11px] font-medium text-slate-500 mt-2 truncate">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50">
            <span>Dynamic scaling based on database records</span>
            <span className="font-mono">Max: {formatINR(maxMonthlyValue)}</span>
          </div>
        </div>

        {/* B. Quotation Status Breakdown */}
        <div className="bg-white rounded-xl border border-[#E5EAE3] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#1F2937]">
                  Quotation Status Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lifecycle distribution across offers
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {summary.totalQuotations} Total
              </span>
            </div>

            {summary.totalQuotations === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#F7F8F4] border border-[#E5EAE3] text-slate-400 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-600">No quotation records yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Status distribution percentages will populate dynamically as quotations are created.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {statusRows.map((row) => (
                  <div key={row.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${row.config.dotColor}`} />
                        <span className="font-medium text-slate-700">{row.config.label}</span>
                      </div>
                      <div className="font-mono text-slate-800">
                        <span className="font-bold">{row.count}</span>
                        <span className="text-slate-400 ml-1">({row.pct}%)</span>
                      </div>
                    </div>
                    {/* Progress Track */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.config.barColor} transition-all duration-500`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Metric: Approval Rate */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Conversion / Approval Rate</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold font-mono text-[#174535]">
                {approvalRate}%
              </span>
              <span className="text-[11px] text-slate-400">
                ({summary.approvedQuotations}/{summary.totalQuotations || 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Business Activity Section (2-Column Grid: 1/2 + 1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column A: Recent Business Activities */}
        <div className="bg-white rounded-xl border border-[#E5EAE3] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#174535]" /> Recent Business Activities
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit trail of customer, quotation, project &amp; system actions
                </p>
              </div>
            </div>

            {activityLogs.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-9 h-9 rounded-full bg-[#F7F8F4] border border-[#E5EAE3] text-slate-400 flex items-center justify-center mb-2">
                  <Activity className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-600">No activity logs recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Operational actions will log here automatically in real time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {activityLogs.slice(0, 6).map((log) => {
                  return (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-[#F7F8F4] border border-[#E5EAE3] text-[#174535] flex items-center justify-center shrink-0 mt-0.5">
                          <Activity className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {log.summary}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {log.user?.name ? `By ${log.user.name}` : "System action"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-1">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Automated audit trail logging</span>
            <span className="font-mono">{activityLogs.length} events logged</span>
          </div>
        </div>

        {/* Column B: Upcoming Installations */}
        <div className="bg-white rounded-xl border border-[#E5EAE3] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#174535]" /> Upcoming Installations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled site deployments &amp; supervisor assignments
                </p>
              </div>
              <Link
                href="/projects"
                className="text-xs font-semibold text-[#174535] hover:underline flex items-center gap-0.5"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingInstalls.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-9 h-9 rounded-full bg-[#F7F8F4] border border-[#E5EAE3] text-slate-400 flex items-center justify-center mb-2">
                  <Truck className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-600">No installations scheduled yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Active project installation schedules and dates will appear here once scheduled.
                </p>
                <Link
                  href="/projects"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#174535] hover:underline"
                >
                  Manage Projects &rarr;
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {upcomingInstalls.slice(0, 5).map((inst) => (
                  <Link
                    key={inst.id}
                    href={`/projects/${inst.project.id}`}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {inst.project.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {inst.project.customer?.name || "Client"} •{" "}
                        {inst.project.siteAddress || "Site Location"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Date: {inst.installationDate ? formatDate(inst.installationDate) : "TBD"}
                        {inst.supervisor ? ` • Supervisor: ${inst.supervisor}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={inst.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Project site installation management</span>
            <Link href="/projects" className="text-[#174535] font-semibold hover:underline">
              {upcomingInstalls.length} scheduled sites
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
