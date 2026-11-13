"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Layers,
  Image as ImageIcon,
  Sliders,
  FileText,
  Users,
  Plus,
  Trash2,
  Upload,
  Star,
  CheckCircle2,
  Search,
  Edit2,
} from "lucide-react";
import { DRAWING_TYPE_LABELS } from "@/lib/drawing-types";
import { TechnicalDrawingSvg } from "./TechnicalDrawingSvg";
import { DrawingEditorModal } from "./DrawingEditorModal";
import { formatINR } from "@/lib/format";

type SettingsTab = "company" | "catalogue" | "products" | "options" | "terms" | "users";

export function SettingsClient({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<SettingsTab>("company");
  const [company, setCompany] = useState<Record<string, unknown>>({});
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([]);
  const [brands, setBrands] = useState<Array<Record<string, unknown>>>([]);
  const [products, setProducts] = useState<Array<Record<string, unknown>>>([]);
  const [masterOptions, setMasterOptions] = useState<Array<Record<string, unknown>>>([]);
  const [terms, setTerms] = useState<Array<Record<string, unknown>>>([]);
  const [roles, setRoles] = useState<Array<Record<string, unknown>>>([]);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [msg, setMsg] = useState("");

  // Quick add states
  const [newCatName, setNewCatName] = useState("");
  const [newCatUpvc, setNewCatUpvc] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newOptType, setNewOptType] = useState("PROFILE_SYSTEM");
  const [newOptName, setNewOptName] = useState("");
  const [newTermTitle, setNewTermTitle] = useState("");
  const [newTermContent, setNewTermContent] = useState("");

  // New Product form
  const [newProd, setNewProd] = useState({
    code: "",
    name: "",
    categoryId: "",
    brandId: "",
    drawingType: "SLIDING_3_TRACK_WINDOW",
    defaultWidthMm: 1800,
    defaultHeightMm: 1500,
    defaultRatePerSqFt: 550,
  });

  // New User form
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: "",
    password: "",
  });

  // Drawing Editor modal & filters
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editorProduct, setEditorProduct] = useState<any>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("ALL");
  const [productBrandFilter, setProductBrandFilter] = useState("ALL");

  const handleSaveProductTemplate = async (payload: any) => {
    try {
      if (payload.id) {
        const res = await fetch(`/api/products/${payload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update product");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create product");
        }
      }
      notify("Product template saved successfully!");
      setEditorModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || "Failed to save product template");
    }
  };

  const loadAll = useCallback(async () => {
    try {
      const [setRes, prodRes] = await Promise.all([
        fetch("/api/settings")
          .then(async (r) => {
            if (!r.ok) return {};
            const text = await r.text();
            return text ? JSON.parse(text) : {};
          })
          .catch(() => ({})),
        fetch("/api/products")
          .then(async (r) => {
            if (!r.ok) return {};
            const text = await r.text();
            return text ? JSON.parse(text) : {};
          })
          .catch(() => ({})),
      ]);
      setCompany(setRes?.company || {});
      setCategories(setRes?.categories || []);
      setBrands(setRes?.brands || []);
      setMasterOptions(setRes?.masterOptions || []);
      setTerms(setRes?.terms || []);
      setRoles(setRes?.roles || []);
      setUsers(setRes?.users || []);
      setProducts(prodRes?.products || []);

      if (setRes?.categories?.[0]?.id) {
        setNewProd((p) => ({ ...p, categoryId: p.categoryId || setRes.categories[0].id }));
      }
      if (setRes?.roles?.[0]?.id) {
        setNewUser((u) => ({ ...u, roleId: u.roleId || setRes.roles[0].id }));
      }
    } catch (err) {
      console.error("Failed to load settings data:", err);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const notify = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const postSetting = async (action: string, payload: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        await loadAll();
        notify("Saved successfully");
      } else {
        let err = "Action failed";
        try {
          const text = await res.text();
          if (text) {
            const d = JSON.parse(text);
            err = d.error || err;
          }
        } catch {}
        alert(err);
      }
    } catch (err) {
      console.error("postSetting error:", err);
      alert("Failed to save setting. Please check your connection.");
    }
  };

  const handleUploadProductImage = async (
    productId: string,
    file: File | undefined,
    viewType: "Front View" | "Top View" | "Technical Drawing" = "Technical Drawing",
    isDefault = true
  ) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const upRes = await fetch("/api/upload", { method: "POST", body: fd });
    if (!upRes.ok) {
      alert("Upload failed");
      return;
    }
    const { url } = await upRes.json();
    await fetch(`/api/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        title: `${viewType} - ${file.name}`,
        viewType,
        isDefault,
      }),
    });
    await loadAll();
    notify(`${viewType} uploaded`);
  };

  const setDefaultImage = async (productId: string, imageId: string) => {
    await fetch(`/api/products/${productId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, setDefault: true }),
    });
    await loadAll();
  };

  const deleteImage = async (productId: string, imageId: string) => {
    await fetch(`/api/products/${productId}/images?imageId=${imageId}`, {
      method: "DELETE",
    });
    await loadAll();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProd),
    });
    if (res.ok) {
      setNewProd({
        ...newProd,
        code: "",
        name: "",
      });
      await loadAll();
      notify("Product added to catalogue");
    } else {
      const d = await res.json();
      alert(d.error || "Failed to add product");
    }
  };

  const TABS: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> = [
    { id: "company", label: "Company & GST", icon: Building2 },
    { id: "catalogue", label: "Categories & Brands", icon: Layers },
    { id: "products", label: "Products & Drawings", icon: ImageIcon },
    { id: "options", label: "Profile & Accessories", icon: Sliders },
    { id: "terms", label: "Terms & Conditions", icon: FileText },
    ...(isAdmin ? [{ id: "users" as const, label: "Users & Roles", icon: Users }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#25382E]">
            Settings &amp; Master Data
          </h1>
          <p className="text-sm text-[#718075]">
            Configure company profile, product catalogue, technical drawings &amp; pricing
          </p>
        </div>
        {msg && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" /> {msg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#DDE4DA] pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.id
                  ? "bg-[#294C3B] text-white"
                  : "bg-white border border-[#DDE4DA] text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Company & GST */}
      {tab === "company" && (
        <div className="bg-white rounded-xl border border-[#DDE4DA] p-6 shadow-sm space-y-4 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                value={String(company.companyName || "")}
                onChange={(e) =>
                  setCompany({ ...company, companyName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website
              </label>
              <input
                value={String(company.website || "")}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                value={String(company.email || "")}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone
              </label>
              <input
                value={String(company.phone || "")}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address
              </label>
              <input
                value={String(company.address || "")}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Number
              </label>
              <input
                value={String(company.gstNumber || "")}
                onChange={(e) => setCompany({ ...company, gstNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default GST (%)
              </label>
              <input
                type="number"
                value={Number(company.defaultGstPercent ?? 18)}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    defaultGstPercent: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quotation Prefix
              </label>
              <input
                value={String(company.quotationPrefix || "ET")}
                onChange={(e) =>
                  setCompany({ ...company, quotationPrefix: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Name
              </label>
              <input
                value={String(company.bankName || "")}
                onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Account No.
              </label>
              <input
                value={String(company.bankAccountNumber || "")}
                onChange={(e) =>
                  setCompany({ ...company, bankAccountNumber: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank IFSC
              </label>
              <input
                value={String(company.bankIfsc || "")}
                onChange={(e) => setCompany({ ...company, bankIfsc: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-[#DDE4DA] flex justify-end">
              <button
                onClick={() => postSetting("UPDATE_COMPANY", { data: company })}
                className="px-5 py-2 rounded-lg bg-[#294C3B] text-white text-sm font-semibold hover:bg-[#173D30]"
              >
                Save Company Settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Categories & Brands */}
      {tab === "catalogue" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#25382E]">Product Categories</h2>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 px-2">
                  <input
                    type="checkbox"
                    checked={newCatUpvc}
                    onChange={(e) => setNewCatUpvc(e.target.checked)}
                  />
                  uPVC Fields
                </label>
                <button
                  onClick={() => {
                    if (!newCatName.trim()) return;
                    postSetting("CREATE_CATEGORY", {
                      data: { name: newCatName, showUpvcFields: newCatUpvc },
                    });
                    setNewCatName("");
                  }}
                  className="px-3 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="divide-y divide-slate-100 text-sm">
              {categories.map((c) => (
                <div key={String(c.id)} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{String(c.name)}</div>
                    <div className="text-[11px] text-slate-400">
                      uPVC Specs: {c.showUpvcFields ? "Enabled" : "Hidden"}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => postSetting("DELETE_CATEGORY", { id: c.id })}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#25382E]">Brands</h2>
            {isAdmin && (
              <div className="flex gap-2">
                <input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="New brand name..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <button
                  onClick={() => {
                    if (!newBrandName.trim()) return;
                    postSetting("CREATE_BRAND", { data: { name: newBrandName } });
                    setNewBrandName("");
                  }}
                  className="px-3 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="divide-y divide-slate-100 text-sm">
              {brands.map((b) => (
                <div key={String(b.id)} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{String(b.name)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => postSetting("DELETE_BRAND", { id: b.id })}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Products & Technical Drawings */}
      {tab === "products" && (() => {
        const filteredProducts = products.filter((p) => {
          const q = productSearch.toLowerCase().trim();
          const matchesSearch =
            !q ||
            String(p.name || "").toLowerCase().includes(q) ||
            String(p.code || "").toLowerCase().includes(q) ||
            String(p.drawingType || "").toLowerCase().includes(q);
          const matchesCat = productCatFilter === "ALL" || p.categoryId === productCatFilter;
          const matchesBrand =
            productBrandFilter === "ALL" ||
            (productBrandFilter === "NONE" ? !p.brandId : p.brandId === productBrandFilter);
          return matchesSearch && matchesCat && matchesBrand;
        });

        return (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-[#DDE4DA] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-1 flex-wrap items-center gap-2.5">
                <div className="relative min-w-[220px] max-w-sm flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product name, code, design..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#DDE4DA] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174535]"
                  />
                </div>

                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-[#DDE4DA] bg-white text-slate-700"
                >
                  <option value="ALL">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {String(c.name)}
                    </option>
                  ))}
                </select>

                <select
                  value={productBrandFilter}
                  onChange={(e) => setProductBrandFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-[#DDE4DA] bg-white text-slate-700"
                >
                  <option value="ALL">All Brands ({brands.length})</option>
                  <option value="NONE">No Brand / Generic</option>
                  {brands.map((b) => (
                    <option key={String(b.id)} value={String(b.id)}>
                      {String(b.name)}
                    </option>
                  ))}
                </select>

                <span className="text-xs font-semibold text-slate-500 ml-1">
                  Showing {filteredProducts.length} of {products.length} products
                </span>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditorProduct(null);
                    setEditorModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] transition shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> + New Product Template
                </button>
              )}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const imgs =
                  (p.images as Array<{
                    id: string;
                    url: string;
                    isDefault: boolean;
                    viewType?: string | null;
                  }>) || [];
                const defImg = imgs.find((i) => i.isDefault)?.url || imgs[0]?.url || null;
                return (
                  <div
                    key={String(p.id)}
                    className="bg-white rounded-xl border border-[#DDE4DA] p-4 shadow-sm flex flex-col justify-between gap-3 hover:border-[#174535]/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#F7F8F4] text-[#174535] border border-[#E5EAE3]">
                          {String(p.code)}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {formatINR(Number(p.defaultRatePerSqFt))}/sq.ft
                        </span>
                      </div>
                      <div className="font-bold text-sm text-[#1F2937] leading-snug">
                        {String(p.name)}
                      </div>
                      <div className="text-[11px] text-slate-500 mb-2.5">
                        {(p.category as { name: string })?.name}
                        {(p.brand as { name: string } | null)?.name
                          ? ` • ${(p.brand as { name: string }).name}`
                          : ""}
                      </div>

                      <div className="bg-slate-50/70 rounded-lg border border-[#DDE4DA] p-2">
                        <TechnicalDrawingSvg
                          widthMm={Number(p.defaultWidthMm)}
                          heightMm={Number(p.defaultHeightMm)}
                          drawingType={String(p.drawingType)}
                          defaultPanelsJson={p.defaultPanelsJson as string}
                          customImageUrl={defImg}
                          compact
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditorProduct(p);
                            setEditorModalOpen(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#174535]/10 text-[#174535] text-xs font-semibold hover:bg-[#174535] hover:text-white transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Drawing &amp; Panels
                        </button>
                      )}

                      {/* Multi-view Image List & Upload */}
                      {imgs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {imgs.map((img) => (
                            <div
                              key={img.id}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${
                                img.isDefault
                                  ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                                  : "bg-slate-50 border-[#DDE4DA] text-slate-600"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setDefaultImage(String(p.id), img.id)}
                                title="Set as Default"
                              >
                                <Star className="w-3 h-3" />
                              </button>
                              <span className="max-w-[85px] truncate" title={img.viewType || "Image"}>
                                {img.viewType || "Image"}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteImage(String(p.id), img.id)}
                                className="text-rose-500 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1.5">
                        <label className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer text-center">
                          <Upload className="w-3 h-3" /> Front Photo
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg,.webp"
                            className="hidden"
                            onChange={(e) =>
                              handleUploadProductImage(String(p.id), e.target.files?.[0], "Front View", true)
                            }
                          />
                        </label>
                        <label className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer text-center">
                          <Upload className="w-3 h-3" /> Top Photo
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg,.webp"
                            className="hidden"
                            onChange={(e) =>
                              handleUploadProductImage(String(p.id), e.target.files?.[0], "Top View", false)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawing Editor Modal */}
            <DrawingEditorModal
              open={editorModalOpen}
              onClose={() => setEditorModalOpen(false)}
              product={editorProduct}
              categories={categories as any}
              brands={brands as any}
              onSave={handleSaveProductTemplate}
            />
          </div>
        );
      })()}

      {/* Tab 4: Master Options */}
      {tab === "options" && (
        <div className="bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#25382E]">
            Profile Systems, Glass Types, Colours &amp; Accessories
          </h2>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <select
                value={newOptType}
                onChange={(e) => setNewOptType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="PROFILE_SYSTEM">Profile System</option>
                <option value="GLASS_TYPE">Glass Type</option>
                <option value="PROFILE_COLOUR">Profile Colour</option>
                <option value="MESH_TYPE">Mesh Type</option>
                <option value="LOCKING">Locking</option>
                <option value="HANDLE_TYPE">Handle Type</option>
                <option value="ROLLER_TYPE">Roller Type</option>
              </select>
              <input
                value={newOptName}
                onChange={(e) => setNewOptName(e.target.value)}
                placeholder="Option name..."
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
              <button
                onClick={() => {
                  if (!newOptName.trim()) return;
                  postSetting("CREATE_OPTION", {
                    data: { optionType: newOptType, name: newOptName },
                  });
                  setNewOptName("");
                }}
                className="px-4 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-semibold"
              >
                + Add Option
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {masterOptions.map((o) => (
              <div
                key={String(o.id)}
                className="px-3 py-2 rounded-lg border border-[#DDE4DA] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="text-[10px] font-bold text-slate-400">
                    {String(o.optionType)}
                  </div>
                  <div className="font-semibold text-slate-800">{String(o.name)}</div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => postSetting("DELETE_OPTION", { id: o.id })}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Terms & Conditions */}
      {tab === "terms" && (
        <div className="bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm space-y-4 max-w-3xl">
          <h2 className="text-sm font-bold text-[#25382E]">
            Default Quotation Terms &amp; Conditions
          </h2>
          {isAdmin && (
            <div className="space-y-2">
              <input
                value={newTermTitle}
                onChange={(e) => setNewTermTitle(e.target.value)}
                placeholder="Term Title (e.g. Payment Terms)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
              <textarea
                rows={2}
                value={newTermContent}
                onChange={(e) => setNewTermContent(e.target.value)}
                placeholder="Term content..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
              <button
                onClick={() => {
                  if (!newTermTitle.trim() || !newTermContent.trim()) return;
                  postSetting("CREATE_TERM", {
                    data: { title: newTermTitle, content: newTermContent },
                  });
                  setNewTermTitle("");
                  setNewTermContent("");
                }}
                className="px-4 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-semibold"
              >
                + Add Term
              </button>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {terms.map((t) => (
              <div key={String(t.id)} className="py-3 flex justify-between gap-4">
                <div>
                  <div className="font-bold text-xs text-[#25382E]">
                    {String(t.title)}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {String(t.content)}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => postSetting("DELETE_TERM", { id: t.id })}
                    className="p-1 text-slate-400 hover:text-rose-600 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Users & Roles */}
      {tab === "users" && isAdmin && (
        <div className="bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#25382E]">Users &amp; Roles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <input
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-slate-300"
            />
            <input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="px-3 py-2 rounded-lg border border-slate-300"
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="px-3 py-2 rounded-lg border border-slate-300"
            />
            <select
              value={newUser.roleId}
              onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              {roles.map((r) => (
                <option key={String(r.id)} value={String(r.id)}>
                  {String(r.name)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!newUser.name || !newUser.email || !newUser.password) return;
                postSetting("CREATE_USER", { data: newUser });
                setNewUser({ ...newUser, name: "", email: "", password: "" });
              }}
              className="px-4 py-2 rounded-lg bg-[#294C3B] text-white font-semibold"
            >
              + Add User
            </button>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            {users.map((u) => (
              <div key={String(u.id)} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#25382E]">{String(u.name)}</div>
                  <div className="text-xs text-[#718075]">{String(u.email)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-[#294C3B]">
                    {(u.role as { name: string })?.name}
                  </span>
                  {(u.role as { name: string })?.name !== "ADMIN" && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove user ${String(u.name)} and revoke access?`)) {
                          postSetting("DEACTIVATE_USER", { id: u.id });
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Remove User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

