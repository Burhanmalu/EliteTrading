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
  Users,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  FolderKanban,
  FileText,
  Calendar,
  ArrowUpDown,
  Building2,
  UserCheck,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { Pagination } from "@/components/Pagination";

interface CustomerRow {
  id: string;
  customerCode: string;
  name: string;
  contactPerson: string;
  mobile: string;
  alternateNumber?: string;
  email?: string;
  billingAddress: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  customerType: string;
  remarks?: string;
  createdAt: string;
  _count: { projects: number; quotations: number };
}

const EMPTY_FORM = {
  name: "",
  contactPerson: "",
  mobile: "",
  alternateNumber: "",
  email: "",
  billingAddress: "",
  city: "",
  state: "",
  gstNumber: "",
  customerType: "Residential",
  remarks: "",
};

export function CustomersClient() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("new") === "1" || searchParams.get("action") === "new") {
      setEditingId(null);
      setForm(EMPTY_FORM);
      setModalOpen(true);
    }
  }, [searchParams]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search: search.trim(),
      customerType,
      sortBy,
      sortDir,
      page: String(page),
      pageSize: "10",
    });
    try {
      const res = await fetch(`/api/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  }, [search, customerType, sortBy, sortDir, page]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 180);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (c: CustomerRow) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      contactPerson: c.contactPerson || c.name,
      mobile: c.mobile,
      alternateNumber: c.alternateNumber || "",
      email: c.email || "",
      billingAddress: c.billingAddress,
      city: c.city || "",
      state: c.state || "",
      gstNumber: c.gstNumber || "",
      customerType: c.customerType,
      remarks: c.remarks || "",
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
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
        setError(data.error || "Failed to save customer");
        return;
      }

      setModalOpen(false);
      fetchCustomers();
      if (!editingId && data.customer?.id) {
        window.location.href = `/customers/${data.customer.id}`;
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaving(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleDelete = async (c: CustomerRow) => {
    if (!confirm(`Are you sure you want to delete customer "${c.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete customer");
        return;
      }
      fetchCustomers();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete customer");
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCustomerType("ALL");
    setPage(1);
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type?.toLowerCase()) {
      case "commercial":
        return "bg-emerald-50 text-[#174535] border-emerald-200/80";
      case "builder":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "architect":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "contractor":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">Customers</h1>
          <p className="text-xs sm:text-sm text-[#718075] mt-0.5">
            Manage builders, architects, commercial and residential clients.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#174535] text-white text-xs sm:text-sm font-semibold hover:bg-[#10382D] transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
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
              placeholder="Search by name, customer ID, mobile, city..."
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

          {/* Customer Type Filter */}
          <div className="w-40 shrink-0">
            <select
              value={customerType}
              onChange={(e) => {
                setCustomerType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E5EAE3] rounded-lg bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] transition-all cursor-pointer font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Builder">Builder</option>
              <option value="Architect">Architect</option>
              <option value="Contractor">Contractor</option>
            </select>
          </div>
        </div>

        {/* Counter & Clear */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5EAE3]">
          {(search || customerType !== "ALL") && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#174535] hover:text-[#10382D] font-medium underline underline-offset-2 transition-colors"
            >
              Reset filters
            </button>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F7F8F4] text-[#174535] border border-[#E5EAE3] whitespace-nowrap">
            {total} {total === 1 ? "Customer" : "Customers"}
          </span>
        </div>
      </div>

      {/* 3. Customer Data: Desktop Table / Mobile Cards */}
      <div className="bg-white rounded-xl border border-[#E5EAE3] shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-4 py-16 text-center text-slate-400 text-sm">
            <div className="w-7 h-7 border-2 border-[#174535] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading customer records...
          </div>
        ) : items.length === 0 ? (
          /* 6. Empty State */
          <div className="px-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F8F4] text-[#174535] border border-[#E5EAE3] flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            {search || customerType !== "ALL" ? (
              <>
                <h3 className="text-base font-bold text-[#1F2937]">No matching customers</h3>
                <p className="text-xs sm:text-sm text-[#718075] mt-1 mb-5 max-w-sm mx-auto">
                  No customers matched your current search or filter criteria. Try resetting the filters.
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
                <h3 className="text-base font-bold text-[#1F2937]">No Customers Yet</h3>
                <p className="text-xs sm:text-sm text-[#718075] mt-1 mb-5 max-w-sm mx-auto">
                  Start managing your customers by adding your first customer.
                </p>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Your First Customer
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (hidden on small mobile screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead className="bg-[#F7F8F4] border-b border-[#E5EAE3] text-[11px] font-semibold text-[#718075] uppercase tracking-wider">
                  <tr>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-[#174535] select-none whitespace-nowrap"
                      onClick={() => toggleSort("customerCode")}
                      title="Sort by Customer ID"
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <span>Customer ID</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-[#174535] select-none whitespace-nowrap"
                      onClick={() => toggleSort("name")}
                      title="Sort by Name"
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <span>Customer</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">Contact</th>
                    <th className="px-4 py-3 whitespace-nowrap">Location</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Projects</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Quotations</th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-[#174535] select-none whitespace-nowrap"
                      onClick={() => toggleSort("createdAt")}
                      title="Sort by Date Added"
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <span>Date Added</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAE3]">
                  {items.map((c) => {
                    const fullAddress = [c.billingAddress, c.city, c.state].filter(Boolean).join(", ");
                    const cityCandidate = c.city || (c.billingAddress ? (c.billingAddress.split(",").length > 2 ? c.billingAddress.split(",")[c.billingAddress.split(",").length - 2]?.trim() : c.billingAddress.split(",")[0]?.trim()) : "");
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-[#F7F8F4]/80 transition-colors group"
                      >
                        {/* Customer ID */}
                        <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                          <span className="font-mono text-xs font-semibold text-[#174535] bg-[#174535]/5 px-2 py-0.5 rounded border border-[#174535]/15">
                            {c.customerCode}
                          </span>
                        </td>

                        {/* Customer Name and Type */}
                        <td className="px-4 py-3.5 align-middle min-w-[200px]">
                          <div className="flex flex-col">
                            <Link
                              href={`/customers/${c.id}`}
                              className="font-semibold text-sm text-[#1F2937] hover:text-[#174535] transition-colors leading-tight"
                            >
                              {c.name}
                            </Link>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(
                                  c.customerType
                                )}`}
                              >
                                {c.customerType}
                              </span>
                              {c.contactPerson && c.contactPerson !== c.name && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[120px]" title={`Contact Person: ${c.contactPerson}`}>
                                  ({c.contactPerson})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact: Mobile on first line, email on second */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <div className="flex flex-col space-y-0.5">
                            <span className="text-xs font-medium text-[#1F2937] tracking-tight">
                              {c.mobile || "—"}
                            </span>
                            {c.email ? (
                              <span
                                className="text-[11px] text-[#718075] hover:text-[#174535] truncate max-w-[170px]"
                                title={c.email}
                              >
                                {c.email}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300">No email</span>
                            )}
                          </div>
                        </td>

                        {/* Location: City and address */}
                        <td className="px-4 py-3.5 align-middle max-w-[220px]">
                          <div className="flex flex-col" title={fullAddress}>
                            <span className="text-xs font-semibold text-[#1F2937] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#8BA77A] shrink-0 inline" />
                              {cityCandidate || "—"}
                            </span>
                            <span className="text-[11px] text-[#718075] truncate mt-0.5">
                              {c.billingAddress}
                            </span>
                          </div>
                        </td>

                        {/* Projects Count */}
                        <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {c._count.projects}
                          </span>
                        </td>

                        {/* Quotations Count */}
                        <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {c._count.quotations}
                          </span>
                        </td>

                        {/* Date Added */}
                        <td className="px-4 py-3.5 align-middle text-xs text-[#718075] whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <Link
                              href={`/customers/${c.id}`}
                              className="p-1.5 rounded-md text-[#718075] hover:text-[#174535] hover:bg-emerald-50 transition-colors"
                              title="View Customer Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 rounded-md text-[#718075] hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Edit Customer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              className="p-1.5 rounded-md text-[#718075] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Customer"
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

            {/* Mobile Card Layout (visible on mobile < 768px) */}
            <div className="block md:hidden divide-y divide-[#E5EAE3]">
              {items.map((c) => {
                const fullAddress = [c.billingAddress, c.city, c.state].filter(Boolean).join(", ");
                return (
                  <div key={c.id} className="p-4 space-y-3">
                    {/* Top Row: Code and Customer Type */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#174535] bg-[#174535]/5 px-2 py-0.5 rounded border border-[#174535]/15">
                        {c.customerCode}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(
                          c.customerType
                        )}`}
                      >
                        {c.customerType}
                      </span>
                    </div>

                    {/* Customer Name */}
                    <div>
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-base font-bold text-[#1F2937] hover:text-[#174535] transition-colors"
                      >
                        {c.name}
                      </Link>
                      {c.contactPerson && c.contactPerson !== c.name && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Attn: {c.contactPerson}
                        </div>
                      )}
                    </div>

                    {/* Contact & Location Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-[#F7F8F4] p-2.5 rounded-lg border border-[#E5EAE3]">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#174535] shrink-0" />
                        <span className="font-medium text-[#1F2937]">{c.mobile || "—"}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8BA77A] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{fullAddress}</span>
                      </div>
                    </div>

                    {/* Stats & Actions Row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-xs text-[#718075]">
                        <span className="inline-flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-[#1F2937]">{c._count.projects}</strong> proj
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-[#1F2937]">{c._count.quotations}</strong> quotes
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/customers/${c.id}`}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-[#174535] hover:bg-emerald-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-md border border-[#E5EAE3] text-[#718075] hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={total}
              pageSize={10}
              recordLabel="customers"
              onPageChange={(p) => setPage(p)}
              isLoading={loading}
            />
          </>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5EAE3] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5EAE3] flex items-center justify-between bg-[#F7F8F4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#174535]/10 flex items-center justify-center text-[#174535]">
                  {editingId ? <UserCheck className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">
                    {editingId ? "Edit Customer Details" : "Add New Customer"}
                  </h2>
                  <p className="text-[11px] text-[#718075]">
                    {editingId
                      ? "Update customer contact and business profile."
                      : "Enter customer particulars to create a new client record."}
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
                    Customer / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Skyline Residency or Mr. Sharma"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Customer Type
                  </label>
                  <select
                    value={form.customerType}
                    onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Builder">Builder</option>
                    <option value="Architect">Architect</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Primary Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Contact Person Name
                  </label>
                  <input
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Optional contact person name"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Alternate Contact
                  </label>
                  <input
                    value={form.alternateNumber}
                    onChange={(e) => setForm({ ...form, alternateNumber: e.target.value })}
                    placeholder="Secondary phone / mobile"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="client@domain.com"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    City
                  </label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Mumbai, Pune, Delhi"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    State
                  </label>
                  <input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    GSTIN / Tax Number <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] uppercase text-[#1F2937]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Billing Address <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={form.billingAddress}
                  onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                  placeholder="Complete street address or site premises"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Remarks / Special Notes
                </label>
                <textarea
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Architect reference, site timing, delivery preferences..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5EAE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] text-[#1F2937]"
                />
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
                  {saving ? "Saving..." : editingId ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
