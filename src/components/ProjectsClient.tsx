"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MapPin,
  Calendar,
  Building2,
  Phone,
  FileText,
} from "lucide-react";
import { formatDate, formatINR } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { Pagination } from "@/components/Pagination";

const PROJECT_STATUSES = [
  "Approved – Installation Pending",
  "Installation Scheduled",
  "Installation In Progress",
  "Partially Installed",
  "Installation Completed",
  "On Hold",
  "Cancelled",
];

const PROJECT_CATEGORIES = [
  "Infinity Metal French Doors & Windows",
  "UPVC Windows and Doors",
  "Aluminium Systems",
  "Domal Systems",
  "Glass Partitions",
  "Mixed / Turnkey Fenestration",
];

interface ProjectRow {
  id: string;
  projectCode: string;
  name: string;
  customerId: string;
  customer: { id: string; name: string; customerCode: string; mobile?: string; email?: string };
  siteName: string;
  siteAddress: string;
  contactPerson?: string;
  contactNumber?: string;
  category: string;
  description?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  status: string;
  totalQuotations: number;
  projectValue: number;
  createdAt: string;
  approvedQuotation?: {
    id: string;
    quotationNumber: string;
    grandTotal: number;
    revisionNumber: number;
    status: string;
  } | null;
  installationSchedule?: {
    id: string;
    status: string;
    installationDate?: string | null;
    supervisor?: string | null;
  } | null;
}

interface CustomerOption {
  id: string;
  name: string;
  customerCode: string;
}

const EMPTY_FORM = {
  name: "",
  customerId: "",
  siteName: "",
  siteAddress: "",
  contactPerson: "",
  contactNumber: "",
  category: "UPVC Windows and Doors",
  description: "",
  startDate: "",
  expectedCompletionDate: "",
  status: "Approved – Installation Pending",
};

export function ProjectsClient() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customers?pageSize=100")
      .then((r) => r.json())
      .then((d) => setCustomers(d.items || []));
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingId(null);
      setForm({
        ...EMPTY_FORM,
        customerId: searchParams.get("customerId") || "",
      });
      setModalOpen(true);
    }
  }, [searchParams]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search: search.trim(),
      status,
      page: String(page),
      pageSize: "10",
    });
    try {
      const res = await fetch(`/api/projects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(fetchProjects, 180);
    return () => clearTimeout(t);
  }, [fetchProjects]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (p: ProjectRow) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      customerId: p.customerId,
      siteName: p.siteName,
      siteAddress: p.siteAddress,
      contactPerson: p.contactPerson || "",
      contactNumber: p.contactNumber || "",
      category: p.category,
      description: p.description || "",
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      expectedCompletionDate: p.expectedCompletionDate
        ? p.expectedCompletionDate.slice(0, 10)
        : "",
      status: p.status,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editingId ? `/api/projects/${editingId}` : "/api/projects";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setError(data.error || "Failed to save project");
        return;
      }

      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error("Save project error:", err);
      setSaving(false);
      setError("An unexpected error occurred");
    }
  };

  const handleDelete = async (p: ProjectRow) => {
    if (!confirm(`Are you sure you want to delete project "${p.name}" (${p.projectCode})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete project");
        return;
      }
      fetchProjects();
    } catch (err) {
      console.error("Delete project error:", err);
      alert("Failed to delete project");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">Projects</h1>
          <p className="text-xs sm:text-sm text-[#718075] mt-0.5">
            Manage approved quotation projects, installation schedules and project progress.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/quotations?status=Approved"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#174535] text-white text-xs sm:text-sm font-semibold hover:bg-[#10382D] transition-colors shadow-sm shrink-0"
          >
            <CheckCircle className="w-4 h-4" /> Convert Approved Quotation
          </Link>
        </div>
      </div>

      {/* 2. Search and Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAE3] p-3 sm:p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Project ID, Project Name, Customer Name or Site..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#F7F8F4]/50 border border-[#E5EAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] transition-all placeholder:text-slate-400 text-[#1F2937]"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-200/50"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="w-60 shrink-0">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E5EAE3] rounded-lg bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] transition-all cursor-pointer font-medium"
            >
              <option value="ALL">All Statuses</option>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter and Filter Reset */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5EAE3]">
          {(search || status !== "ALL") && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#174535] hover:text-[#10382D] font-medium underline underline-offset-2 transition-colors"
            >
              Reset filters
            </button>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F7F8F4] text-[#174535] border border-[#E5EAE3] whitespace-nowrap">
            {total} {total === 1 ? "Project" : "Projects"}
          </span>
        </div>
      </div>

      {/* 3. Projects Table / Cards */}
      <div className="bg-white rounded-xl border border-[#E5EAE3] shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-4 py-16 text-center text-slate-400 text-sm">
            <div className="w-7 h-7 border-2 border-[#174535] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading project records...
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F8F4] text-[#174535] border border-[#E5EAE3] flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <FolderKanban className="w-7 h-7" />
            </div>
            {search || status !== "ALL" ? (
              <>
                <h3 className="text-base font-bold text-[#1F2937]">No matching projects</h3>
                <p className="text-xs sm:text-sm text-[#718075] mt-1 mb-5 max-w-sm mx-auto">
                  No projects found matching your current filter criteria.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F7F8F4] text-[#174535] border border-[#E5EAE3] text-xs font-semibold hover:bg-[#E5EAE3]/50 transition-colors"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-[#1F2937]">No Projects Yet</h3>
                <p className="text-xs sm:text-sm text-[#718075] mt-1 mb-5 max-w-sm mx-auto">
                  Projects will automatically appear here once quotations are approved.
                </p>
                <Link
                  href="/quotations?status=Approved"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] shadow-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> View Approved Quotations
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead className="bg-[#F7F8F4] border-b border-[#E5EAE3] text-[11px] font-semibold text-[#718075] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Project ID</th>
                    <th className="px-4 py-3 whitespace-nowrap">Project</th>
                    <th className="px-4 py-3 whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3 whitespace-nowrap">Site Location</th>
                    <th className="px-4 py-3 whitespace-nowrap">Category</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Quotes</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Project Value</th>
                    <th className="px-4 py-3 whitespace-nowrap">Installation</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAE3]">
                  {items.map((p) => {
                    const hasInstallation = Boolean(p.installationSchedule?.installationDate);

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-[#F7F8F4]/80 transition-colors group"
                      >
                        {/* 1. Project ID: Single line, font-mono */}
                        <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                          <span className="font-mono text-xs font-bold text-[#174535] bg-[#174535]/5 px-2.5 py-1 rounded border border-[#174535]/15 inline-block">
                            {p.projectCode}
                          </span>
                        </td>

                        {/* 2. Project Name + Badge + Quote Reference */}
                        <td className="px-4 py-3.5 align-middle min-w-[220px]">
                          <div className="flex flex-col">
                            <Link
                              href={`/projects/${p.id}`}
                              className="font-bold text-sm text-[#1F2937] hover:text-[#174535] transition-colors leading-snug"
                            >
                              {p.name}
                            </Link>
                            {p.approvedQuotation ? (
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#174535] border border-emerald-200/80">
                                  <CheckCircle className="w-2.5 h-2.5 text-[#174535]" /> Created from Approved Quotation
                                </span>
                                <Link
                                  href={`/quotations/${p.approvedQuotation.id}`}
                                  className="font-mono text-[11px] font-medium text-[#718075] hover:text-[#174535] hover:underline"
                                  title="View Approved Quotation"
                                >
                                  ({p.approvedQuotation.quotationNumber})
                                </Link>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        {/* 3. Customer: Name and mobile */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <div className="flex flex-col">
                            <Link
                              href={`/customers/${p.customer.id}`}
                              className="font-semibold text-sm text-[#1F2937] hover:text-[#174535] hover:underline"
                            >
                              {p.customer.name}
                            </Link>
                            {p.customer.mobile ? (
                              <span className="text-[11px] text-[#718075] mt-0.5">
                                {p.customer.mobile}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* 4. Site Location: Truncated with ellipsis and full tooltip */}
                        <td
                          className="px-4 py-3.5 align-middle max-w-[170px]"
                          title={p.siteAddress || p.siteName}
                        >
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-[#8BA77A] shrink-0" />
                            <span className="truncate">{p.siteAddress || p.siteName}</span>
                          </div>
                        </td>

                        {/* 5. Category: Compact badge */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {p.category}
                          </span>
                        </td>

                        {/* 6. Quotes Count */}
                        <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {p.totalQuotations}
                          </span>
                        </td>

                        {/* 7. Project Value: Bold INR right-aligned */}
                        <td className="px-4 py-3.5 align-middle text-right font-bold text-sm text-[#1F2937] whitespace-nowrap">
                          {formatINR(p.projectValue)}
                        </td>

                        {/* 8. Installation Date or Not Scheduled */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap text-xs">
                          {hasInstallation ? (
                            <span className="font-medium text-[#1F2937] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#174535] shrink-0" />
                              {formatDate(p.installationSchedule!.installationDate!)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not Scheduled</span>
                          )}
                        </td>

                        {/* 9. Status Badge */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <StatusBadge status={p.status} />
                        </td>

                        {/* 10. Actions: Single horizontal row with tooltips */}
                        <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <Link
                              href={`/projects/${p.id}`}
                              className="p-1.5 rounded-md text-[#718075] hover:text-[#174535] hover:bg-emerald-50 transition-colors"
                              title="View Project"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-md text-[#718075] hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Edit Project"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 rounded-md text-[#718075] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="block lg:hidden divide-y divide-[#E5EAE3]">
              {items.map((p) => {
                const hasInstallation = Boolean(p.installationSchedule?.installationDate);

                return (
                  <div key={p.id} className="p-4 space-y-3">
                    {/* Header: Project ID + Status */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#174535] bg-[#174535]/5 px-2.5 py-0.5 rounded border border-[#174535]/15">
                        {p.projectCode}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>

                    {/* Project Name + Quotation Source */}
                    <div>
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-base font-bold text-[#1F2937] hover:text-[#174535] transition-colors"
                      >
                        {p.name}
                      </Link>
                      {p.approvedQuotation && (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#174535] border border-emerald-200">
                            <CheckCircle className="w-2.5 h-2.5 text-[#174535]" /> Created from Approved Quotation
                          </span>
                          <span className="font-mono text-[11px] text-[#718075]">
                            ({p.approvedQuotation.quotationNumber})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Customer & Location Details */}
                    <div className="space-y-1.5 text-xs bg-[#F7F8F4] p-3 rounded-lg border border-[#E5EAE3]">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/customers/${p.customer.id}`}
                          className="font-bold text-[#1F2937] hover:underline"
                        >
                          {p.customer.name}
                        </Link>
                        {p.customer.mobile && (
                          <span className="text-[#718075] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {p.customer.mobile}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-600 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8BA77A] shrink-0 mt-0.5" />
                        <span className="truncate">{p.siteAddress || p.siteName}</span>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-[#F7F8F4] p-2.5 rounded-lg border border-[#E5EAE3] text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Quotes</div>
                        <div className="font-semibold text-[#1F2937]">{p.totalQuotations} linked</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Installation</div>
                        <div className="font-medium text-[#1F2937] truncate">
                          {hasInstallation
                            ? formatDate(p.installationSchedule!.installationDate!)
                            : "Not Scheduled"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Project Value</div>
                        <div className="font-bold text-[#174535]">{formatINR(p.projectValue)}</div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {p.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/projects/${p.id}`}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-[#174535] hover:bg-emerald-50 transition-colors"
                          title="View Project"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Edit Project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={total}
              pageSize={10}
              recordLabel="projects"
              onPageChange={(p) => setPage(p)}
              isLoading={loading}
            />
          </>
        )}
      </div>

      {/* Edit / Add Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5EAE3] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5EAE3] flex items-center justify-between bg-[#F7F8F4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#174535]/10 flex items-center justify-center text-[#174535]">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">
                    {editingId ? "Edit Project Details" : "Add New Project"}
                  </h2>
                  <p className="text-[11px] text-[#718075]">
                    {editingId
                      ? "Update project attributes, site location, and status."
                      : "Create a standalone project profile."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Customer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Site Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.siteName}
                    onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Project Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  >
                    {PROJECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Site Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.siteAddress}
                    onChange={(e) => setForm({ ...form, siteAddress: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Site Contact Person
                  </label>
                  <input
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Site Contact Number
                  </label>
                  <input
                    value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Project Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Description &amp; Scope
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5EAE3]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5EAE3] text-xs sm:text-sm font-medium text-[#1F2937] hover:bg-[#F7F8F4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#174535] text-white text-xs sm:text-sm font-semibold hover:bg-[#10382D] transition-colors disabled:opacity-60 shadow-sm"
                >
                  {saving ? "Saving..." : editingId ? "Update Project" : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
