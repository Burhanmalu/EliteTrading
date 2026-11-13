"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Copy,
  FileDown,
  Printer,
  Trash2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  FolderKanban,
  X,
  Building2,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

interface QuotationRow {
  id: string;
  quotationNumber: string;
  revisionNumber: number;
  quotationDate: string;
  totalComponents: number;
  totalSqFt: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  status: string;
  projectId?: string | null;
  customer?: { id: string; name: string; customerCode: string; mobile?: string } | null;
  project?: { id: string; name: string; projectCode: string } | null;
  convertedProject?: { id: string; name: string; projectCode: string } | null;
}

interface PopoverState {
  quote: QuotationRow;
  triggerEl: HTMLElement;
  top: number;
  left: number;
  openUpward: boolean;
}

export function QuotationsListClient() {
  const router = useRouter();
  const [items, setItems] = useState<QuotationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Status Action Popover State (Positioned via React Portal)
  const [popoverState, setPopoverState] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Accept Quotation Modal State
  const [acceptModalQuote, setAcceptModalQuote] = useState<QuotationRow | null>(null);
  const [suggestedProjectName, setSuggestedProjectName] = useState("");
  const [approving, setApproving] = useState(false);
  const [approvalSuccessProject, setApprovalSuccessProject] = useState<{ id: string; projectCode: string; name: string } | null>(null);

  // Reject Quotation Modal State
  const [rejectModalQuote, setRejectModalQuote] = useState<QuotationRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePopoverPosition = useCallback((targetEl: HTMLElement, quote: QuotationRow) => {
    const rect = targetEl.getBoundingClientRect();
    const dropdownHeight = 115;
    const dropdownWidth = 192;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    let top = openUpward ? rect.top - dropdownHeight - 6 : rect.bottom + 6;
    let left = rect.left;

    // Viewport horizontal clamping
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12);
    }
    if (left < 12) left = 12;

    setPopoverState({
      quote,
      triggerEl: targetEl,
      top,
      left,
      openUpward,
    });
  }, []);

  const toggleStatusPopover = (quote: QuotationRow, targetEl: HTMLElement) => {
    if (popoverState?.quote.id === quote.id) {
      setPopoverState(null);
    } else {
      updatePopoverPosition(targetEl, quote);
    }
  };

  // Close or re-align on click outside, escape key, scroll or resize
  useEffect(() => {
    if (!popoverState) return;

    function handleMouseDown(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !popoverState?.triggerEl.contains(e.target as Node)
      ) {
        setPopoverState(null);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPopoverState(null);
      }
    }

    function handleScrollOrResize() {
      if (popoverState?.triggerEl) {
        const rect = popoverState.triggerEl.getBoundingClientRect();
        // If trigger has scrolled completely out of view, close it
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setPopoverState(null);
        } else {
          updatePopoverPosition(popoverState.triggerEl, popoverState.quote);
        }
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [popoverState, updatePopoverPosition]);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search: search.trim(),
      status,
      page: String(page),
      pageSize: "15",
    });
    try {
      const res = await fetch(`/api/quotations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch quotations:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(fetchQuotations, 180);
    return () => clearTimeout(t);
  }, [fetchQuotations]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        router.push(`/quotations/${data.quotation.id}/edit`);
      }
    } catch (err) {
      console.error("Duplicate quotation error:", err);
    }
  };

  const handleDelete = async (q: QuotationRow) => {
    if (!confirm(`Delete quotation ${q.quotationNumber}?`)) return;
    try {
      const res = await fetch(`/api/quotations/${q.id}`, { method: "DELETE" });
      if (res.ok) fetchQuotations();
    } catch (err) {
      console.error("Delete quotation error:", err);
    }
  };

  // Open Accept Modal
  const openAcceptModal = (q: QuotationRow) => {
    setPopoverState(null);
    setAcceptModalQuote(q);
    setSuggestedProjectName(`${q.customer?.name || "Client"} - Fenestration Project`);
    setApprovalSuccessProject(null);
  };

  // Confirm Approval & Auto-create Project
  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalQuote) return;

    setApproving(true);
    try {
      const res = await fetch(`/api/quotations/${acceptModalQuote.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: suggestedProjectName.trim(),
        }),
      });

      const data = await res.json();
      setApproving(false);

      if (!res.ok) {
        alert(data.error || "Failed to approve quotation");
        return;
      }

      setApprovalSuccessProject(data.project);
      fetchQuotations();
    } catch (err) {
      console.error("Approval error:", err);
      setApproving(false);
      alert("An unexpected error occurred during approval");
    }
  };

  // Open Reject Modal
  const openRejectModal = (q: QuotationRow) => {
    setPopoverState(null);
    setRejectModalQuote(q);
    setRejectReason("");
  };

  // Confirm Rejection
  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalQuote) return;

    setRejecting(true);
    try {
      const res = await fetch(`/api/quotations/${rejectModalQuote.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: rejectReason.trim(),
        }),
      });

      const data = await res.json();
      setRejecting(false);

      if (!res.ok) {
        alert(data.error || "Failed to reject quotation");
        return;
      }

      setRejectModalQuote(null);
      fetchQuotations();
    } catch (err) {
      console.error("Rejection error:", err);
      setRejecting(false);
      alert("An unexpected error occurred while rejecting quotation");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPage(1);
  };

  const startIndex = total === 0 ? 0 : (page - 1) * 15 + 1;
  const endIndex = Math.min(page * 15, total);

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">Quotations</h1>
          <p className="text-xs sm:text-sm text-[#718075] mt-0.5">
            Architectural door &amp; window technical quotations with client approval workflow.
          </p>
        </div>
        <Link
          href="/quotations/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#174535] text-white text-xs sm:text-sm font-semibold hover:bg-[#10382D] transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Quotation
        </Link>
      </div>

      {/* 2. Search and Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAE3] p-3 sm:p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by quote #, customer, project..."
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
          <div className="w-44 shrink-0">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E5EAE3] rounded-lg bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] transition-all cursor-pointer font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent (Awaiting Approval)</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
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
            {total} {total === 1 ? "Quotation" : "Quotations"}
          </span>
        </div>
      </div>

      {/* 3. Table / Cards */}
      <div className="bg-white rounded-xl border border-[#E5EAE3] shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-4 py-16 text-center text-slate-400 text-sm">
            <div className="w-7 h-7 border-2 border-[#174535] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading quotations...
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F8F4] text-[#174535] border border-[#E5EAE3] flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            {search || status !== "ALL" ? (
              <>
                <h3 className="text-base font-bold text-[#1F2937]">No matching quotations</h3>
                <p className="text-xs sm:text-sm text-[#718075] mt-1 mb-5 max-w-sm mx-auto">
                  No quotations found matching your current filter criteria.
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
                <h3 className="text-base font-bold text-[#1F2937]">No Quotations Yet</h3>
                <p className="text-xs sm:text-sm text-[#718075] mt-1 mb-5 max-w-sm mx-auto">
                  Create your first architectural door &amp; window quotation to begin.
                </p>
                <Link
                  href="/quotations/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Quotation
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
                    <th className="px-4 py-3 whitespace-nowrap">Quotation #</th>
                    <th className="px-4 py-3 whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3 whitespace-nowrap">Project</th>
                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Items</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Sq.Ft.</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Grand Total</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAE3]">
                  {items.map((q) => {
                    const linkedProjectId = q.convertedProject?.id || q.project?.id || q.projectId;
                    const linkedProjectCode = q.convertedProject?.projectCode || q.project?.projectCode;
                    const isSent = q.status === "Sent";
                    const isApproved = q.status === "Approved";
                    const isPopoverOpen = popoverState?.quote.id === q.id;

                    return (
                      <tr
                        key={q.id}
                        className="hover:bg-[#F7F8F4]/80 transition-colors group"
                      >
                        {/* Quotation Number */}
                        <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/quotations/${q.id}`}
                              className="font-mono text-xs font-bold text-[#174535] bg-[#174535]/5 px-2 py-0.5 rounded border border-[#174535]/15 hover:bg-[#174535]/10 transition-colors"
                            >
                              {q.quotationNumber}
                            </Link>
                            {q.revisionNumber > 1 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                R{q.revisionNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5 align-middle max-w-[180px]">
                          <div className="flex flex-col">
                            {q.customer ? (
                              <Link
                                href={`/customers/${q.customer.id}`}
                                className="font-semibold text-sm text-[#1F2937] hover:text-[#174535] truncate"
                              >
                                {q.customer.name}
                              </Link>
                            ) : (
                              <span className="text-slate-500 font-medium">Direct Customer</span>
                            )}
                            {q.customer?.mobile && (
                              <span className="text-[11px] text-[#718075]">{q.customer.mobile}</span>
                            )}
                          </div>
                        </td>

                        {/* Project */}
                        <td className="px-4 py-3.5 align-middle max-w-[180px]">
                          {linkedProjectId ? (
                            <Link
                              href={`/projects/${linkedProjectId}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#174535] hover:underline"
                            >
                              <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{linkedProjectCode || q.project?.name || "View Project"}</span>
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 align-middle text-xs text-[#718075] whitespace-nowrap">
                          {formatDate(q.quotationDate)}
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {q.totalComponents}
                          </span>
                        </td>

                        {/* Sq.Ft. */}
                        <td className="px-4 py-3.5 align-middle text-right font-mono text-xs text-slate-700 whitespace-nowrap">
                          {formatNumber(q.totalSqFt)}
                        </td>

                        {/* Grand Total */}
                        <td className="px-4 py-3.5 align-middle text-right font-bold text-sm text-[#1F2937] whitespace-nowrap">
                          {formatINR(q.grandTotal)}
                        </td>

                        {/* Status (with Portal Dropdown for Sent status) */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          {isSent ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatusPopover(q, e.currentTarget);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all shadow-2xs group cursor-pointer ${
                                isPopoverOpen
                                  ? "bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400/20"
                                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              }`}
                              title="Click to Accept or Reject this quotation"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              <span>Sent</span>
                              <ChevronDown
                                className={`w-3 h-3 text-blue-500 transition-transform ${
                                  isPopoverOpen ? "rotate-180" : "group-hover:translate-y-0.5"
                                }`}
                              />
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <StatusBadge status={q.status} />
                              {isApproved && linkedProjectId && (
                                <Link
                                  href={`/projects/${linkedProjectId}`}
                                  className="p-1 rounded text-[#174535] hover:bg-emerald-50"
                                  title={`View Linked Project (${linkedProjectCode || "PRJ"})`}
                                >
                                  <FolderKanban className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-end">
                            {/* If Approved, direct project shortcut */}
                            {isApproved && linkedProjectId && (
                              <Link
                                href={`/projects/${linkedProjectId}`}
                                className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors"
                                title="View Associated Project"
                              >
                                <FolderKanban className="w-4 h-4" />
                              </Link>
                            )}
                            <Link
                              href={`/quotations/${q.id}`}
                              className="p-1.5 rounded-md text-[#718075] hover:text-[#174535] hover:bg-emerald-50 transition-colors"
                              title="View Quotation"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/quotations/${q.id}/edit`}
                              className="p-1.5 rounded-md text-[#718075] hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDuplicate(q.id)}
                              className="p-1.5 rounded-md text-[#718075] hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <a
                              href={`/api/quotations/${q.id}/pdf`}
                              className="p-1.5 rounded-md text-[#718075] hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Download PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </a>
                            <Link
                              href={`/quotations/${q.id}?print=1`}
                              className="p-1.5 rounded-md text-[#718075] hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Print"
                            >
                              <Printer className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(q)}
                              className="p-1.5 rounded-md text-[#718075] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
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
              {items.map((q) => {
                const linkedProjectId = q.convertedProject?.id || q.project?.id || q.projectId;
                const linkedProjectCode = q.convertedProject?.projectCode || q.project?.projectCode;
                const isSent = q.status === "Sent";
                const isApproved = q.status === "Approved";
                const isPopoverOpen = popoverState?.quote.id === q.id;

                return (
                  <div key={q.id} className="p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#174535] bg-[#174535]/5 px-2 py-0.5 rounded border border-[#174535]/15">
                          {q.quotationNumber}
                        </span>
                        {q.revisionNumber > 1 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            R{q.revisionNumber}
                          </span>
                        )}
                      </div>

                      {/* Status / Portal Dropdown Button */}
                      {isSent ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatusPopover(q, e.currentTarget);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                            isPopoverOpen
                              ? "bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400/20"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          <span>Sent</span>
                          <ChevronDown
                            className={`w-3 h-3 text-blue-500 transition-transform ${
                              isPopoverOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      ) : (
                        <StatusBadge status={q.status} />
                      )}
                    </div>

                    {/* Customer & Project */}
                    <div>
                      <div className="font-bold text-sm text-[#1F2937]">
                        {q.customer?.name || "Direct Customer"}
                      </div>
                      {linkedProjectId && (
                        <div className="text-xs text-[#174535] flex items-center gap-1 mt-0.5 font-medium">
                          <FolderKanban className="w-3.5 h-3.5" />
                          <span>Project: {linkedProjectCode || "Linked"}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-[#F7F8F4] p-2.5 rounded-lg border border-[#E5EAE3] text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Date</div>
                        <div className="font-medium text-[#1F2937]">{formatDate(q.quotationDate)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Components</div>
                        <div className="font-medium text-[#1F2937]">
                          {q.totalComponents} items ({formatNumber(q.totalSqFt)} sqft)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Grand Total</div>
                        <div className="font-bold text-[#174535]">{formatINR(q.grandTotal)}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      {isApproved && linkedProjectId ? (
                        <Link
                          href={`/projects/${linkedProjectId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#174535] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200"
                        >
                          <FolderKanban className="w-3.5 h-3.5" /> View Project
                        </Link>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-[#174535]"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/quotations/${q.id}/edit`}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-amber-700"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <a
                          href={`/api/quotations/${q.id}/pdf`}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-emerald-700"
                          title="PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(q)}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-rose-600"
                          title="Delete"
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
            <div className="px-4 py-3 bg-[#F7F8F4]/50 border-t border-[#E5EAE3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#718075]">
              <div>
                Showing <span className="font-semibold text-[#1F2937]">{startIndex}</span> to{" "}
                <span className="font-semibold text-[#1F2937]">{endIndex}</span> of{" "}
                <span className="font-semibold text-[#1F2937]">{total}</span> quotations
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] hover:bg-[#F7F8F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-medium text-[#1F2937]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] hover:bg-[#F7F8F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 4. Portal-rendered Status Action Popover (Completely Immune to Table Overflow) */}
      {mounted &&
        popoverState &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${popoverState.top}px`,
              left: `${popoverState.left}px`,
              zIndex: 99999,
            }}
            className="w-48 bg-white rounded-xl shadow-2xl border border-[#E5EAE3] py-1 animate-in fade-in zoom-in-95 duration-100 text-left select-none pointer-events-auto"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#E5EAE3]">
              Approval Action
            </div>
            <button
              type="button"
              onClick={() => {
                const targetQuote = popoverState.quote;
                setPopoverState(null);
                openAcceptModal(targetQuote);
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Accept Quotation</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const targetQuote = popoverState.quote;
                setPopoverState(null);
                openRejectModal(targetQuote);
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
            >
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Reject Quotation</span>
            </button>
          </div>,
          document.body
        )}

      {/* 5. Accept Quotation Confirmation Modal */}
      {acceptModalQuote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAE3] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#F7F8F4] border-b border-[#E5EAE3] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">Accept Quotation</h3>
                  <p className="text-[11px] text-[#718075]">Approve quotation and create project record</p>
                </div>
              </div>
              <button
                onClick={() => setAcceptModalQuote(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {approvalSuccessProject ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#174535] flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-[#1F2937]">Quotation Approved Successfully!</h4>
                <p className="text-xs sm:text-sm text-[#718075]">
                  A new project <strong>{approvalSuccessProject.projectCode}</strong> has been automatically created with all specifications and components.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setAcceptModalQuote(null)}
                    className="px-4 py-2 rounded-lg border border-[#E5EAE3] text-xs font-semibold text-[#1F2937] hover:bg-[#F7F8F4]"
                  >
                    Close
                  </button>
                  <Link
                    href={`/projects/${approvalSuccessProject.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] shadow-sm"
                  >
                    <FolderKanban className="w-4 h-4" /> Open Project
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmApproval} className="p-6 space-y-4">
                {/* Quotation Details Summary */}
                <div className="bg-[#F7F8F4] border border-[#E5EAE3] rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Quotation Number:</span>
                    <span className="font-mono font-bold text-[#174535]">{acceptModalQuote.quotationNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Customer Name:</span>
                    <span className="font-semibold text-[#1F2937]">
                      {acceptModalQuote.customer?.name || "Direct Customer"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E5EAE3]">
                    <span className="text-slate-700 font-semibold">Grand Total:</span>
                    <span className="font-bold text-sm text-[#174535]">{formatINR(acceptModalQuote.grandTotal)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Project Name <span className="font-normal text-slate-400">(confirm or edit)</span>
                  </label>
                  <input
                    required
                    value={suggestedProjectName}
                    onChange={(e) => setSuggestedProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
                  />
                  <p className="text-[11px] text-[#718075] mt-1">
                    This project will automatically receive all components, drawings, and values from this quotation.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Are you sure you want to approve this quotation? The project status will initially be set to{" "}
                    <strong>Approved – Installation Pending</strong>.
                  </span>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5EAE3]">
                  <button
                    type="button"
                    onClick={() => setAcceptModalQuote(null)}
                    className="px-4 py-2 rounded-lg border border-[#E5EAE3] text-xs font-semibold text-[#1F2937] hover:bg-[#F7F8F4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={approving}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] shadow-sm disabled:opacity-60"
                  >
                    {approving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm Approval</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Reject Quotation Modal */}
      {rejectModalQuote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAE3] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-900">Reject Quotation</h3>
                  <p className="text-[11px] text-rose-700">Record reason for quotation rejection</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalQuote(null)}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-100/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmRejection} className="p-6 space-y-4">
              <div className="bg-[#F7F8F4] border border-[#E5EAE3] rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Quotation Number:</span>
                  <span className="font-mono font-bold text-[#1F2937]">{rejectModalQuote.quotationNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-[#1F2937]">
                    {rejectModalQuote.customer?.name || "Direct Customer"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Client requested different profile colour or revised budget constraints..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Notice: Marking this quotation as Rejected will update dashboard metrics and will <strong>not</strong> create a project.
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5EAE3]">
                <button
                  type="button"
                  onClick={() => setRejectModalQuote(null)}
                  className="px-4 py-2 rounded-lg border border-[#E5EAE3] text-xs font-semibold text-[#1F2937] hover:bg-[#F7F8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm disabled:opacity-60"
                >
                  {rejecting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
