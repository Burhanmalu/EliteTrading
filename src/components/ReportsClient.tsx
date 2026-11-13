"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileDown, FileSpreadsheet, Filter } from "lucide-react";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

type ReportTab =
  | "customer"
  | "project"
  | "monthly"
  | "approval"
  | "product"
  | "brand"
  | "sqft"
  | "gst"
  | "value";

const REPORT_TABS: Array<{ id: ReportTab; label: string }> = [
  { id: "customer", label: "1. Customer-wise" },
  { id: "project", label: "2. Project-wise" },
  { id: "monthly", label: "3. Monthly" },
  { id: "approval", label: "4. Approved vs Rejected" },
  { id: "product", label: "5. Product-wise" },
  { id: "brand", label: "6. Brand-wise" },
  { id: "sqft", label: "7. Total Sq.Ft." },
  { id: "gst", label: "8. GST Report" },
  { id: "value", label: "9. Quotation Value" },
];

export function ReportsClient() {
  const [activeTab, setActiveTab] = useState<ReportTab>("customer");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerId, setCustomerId] = useState("ALL");
  const [projectId, setProjectId] = useState("ALL");
  const [categoryName, setCategoryName] = useState("ALL");
  const [brandName, setBrandName] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

  const [reportData, setReportData] = useState<Record<string, Array<Record<string, unknown>>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?pageSize=100").then((r) => r.json()),
      fetch("/api/projects?pageSize=100").then((r) => r.json()),
      fetch("/api/catalogue").then((r) => r.json()),
    ]).then(([c, p, cat]) => {
      setCustomers(c.items || []);
      setProjects(p.items || []);
      setCategories(cat.categories || []);
      setBrands(cat.brands || []);
    });
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (customerId !== "ALL") params.set("customerId", customerId);
    if (projectId !== "ALL") params.set("projectId", projectId);
    if (categoryName !== "ALL") params.set("categoryName", categoryName);
    if (brandName !== "ALL") params.set("brandName", brandName);
    if (status !== "ALL") params.set("status", status);

    const res = await fetch(`/api/reports?${params}`);
    if (res.ok) {
      const data = await res.json();
      setReportData(data);
    }
    setLoading(false);
  }, [startDate, endDate, customerId, projectId, categoryName, brandName, status]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getActiveRows = (): {
    title: string;
    columns: string[];
    rows: Array<Record<string, unknown>>;
  } => {
    switch (activeTab) {
      case "customer":
        return {
          title: "Customer-wise Quotation Report",
          columns: ["customerName", "code", "quotations", "totalSqFt", "totalValue", "approvedValue"],
          rows: reportData.customerWise || [],
        };
      case "project":
        return {
          title: "Project-wise Quotation Report",
          columns: ["projectName", "code", "customerName", "quotations", "totalSqFt", "totalValue"],
          rows: reportData.projectWise || [],
        };
      case "monthly":
        return {
          title: "Monthly Quotation Report",
          columns: ["month", "count", "totalSqFt", "subtotal", "gst", "grandTotal"],
          rows: reportData.monthly || [],
        };
      case "approval":
        return {
          title: "Approved vs Rejected Quotations Report",
          columns: ["status", "count", "totalSqFt", "totalValue"],
          rows: reportData.approvalSummary || [],
        };
      case "product":
        return {
          title: "Product-wise Quotation Report",
          columns: ["productName", "category", "brand", "units", "totalSqFt", "totalValue"],
          rows: reportData.productWise || [],
        };
      case "brand":
        return {
          title: "Brand-wise Quotation Report",
          columns: ["brandName", "units", "totalSqFt", "totalValue"],
          rows: reportData.brandWise || [],
        };
      case "sqft":
        return {
          title: "Total Sq.Ft. Report",
          columns: ["quotationNumber", "customerName", "projectName", "totalComponents", "totalSqFt", "avgRate"],
          rows: reportData.quotationRows || [],
        };
      case "gst":
        return {
          title: "GST Tax Report",
          columns: ["quotationNumber", "customerName", "subtotal", "gstPercent", "gstAmount", "grandTotal"],
          rows: reportData.quotationRows || [],
        };
      case "value":
      default:
        return {
          title: "Total Quotation Value Report",
          columns: ["quotationNumber", "date", "customerName", "status", "totalSqFt", "grandTotal"],
          rows: reportData.quotationRows || [],
        };
    }
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    const { title, columns, rows } = getActiveRows();
    const res = await fetch("/api/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, title, columns, rows }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { title, columns, rows } = getActiveRows();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#25382E]">Business Reports</h1>
          <p className="text-sm text-[#718075]">
            Analytics, tax summaries &amp; exports in PDF, Excel, and CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileDown className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => handleExport("xlsx")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-semibold hover:bg-[#173D30]"
          >
            <FileDown className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-[#DDE4DA] p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#718075] uppercase">
          <Filter className="w-3.5 h-3.5" /> Report Filters
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] text-[#718075] mb-0.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-[#DDE4DA]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#718075] mb-0.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-[#DDE4DA]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#718075] mb-0.5">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-[#DDE4DA] bg-white"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#718075] mb-0.5">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-[#DDE4DA] bg-white"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#718075] mb-0.5">Category</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-[#DDE4DA] bg-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#718075] mb-0.5">Brand</label>
            <select
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-[#DDE4DA] bg-white"
            >
              <option value="ALL">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#718075] mb-0.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-[#DDE4DA] bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* 9 Report Tabs */}
      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === t.id
                ? "bg-[#294C3B] text-white"
                : "bg-white border border-[#DDE4DA] text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-[#DDE4DA] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#DDE4DA] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#25382E]">{title}</h2>
          <span className="text-xs text-[#718075]">{rows.length} rows</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-[#DDE4DA] text-xs font-semibold text-slate-600 uppercase">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3">
                    {col.replace(/([A-Z])/g, " $1").trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                    Generating report...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                    No data for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {columns.map((col) => {
                      const val = row[col];
                      let display: React.ReactNode = String(val ?? "-");
                      if (col === "status") {
                        display = <StatusBadge status={String(val)} />;
                      } else if (col === "date") {
                        display = formatDate(String(val));
                      } else if (
                        ["totalValue", "approvedValue", "subtotal", "gst", "gstAmount", "grandTotal", "avgRate"].includes(
                          col
                        )
                      ) {
                        display = (
                          <span className="font-semibold text-[#25382E]">
                            {formatINR(Number(val))}
                          </span>
                        );
                      } else if (col === "totalSqFt") {
                        display = (
                          <span className="font-mono text-xs">
                            {formatNumber(Number(val))} Sq.Ft.
                          </span>
                        );
                      }
                      return (
                        <td key={col} className="px-4 py-3 text-xs text-slate-700">
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

