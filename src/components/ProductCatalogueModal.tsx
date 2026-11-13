"use client";

import React, { useState } from "react";
import { X, Search, Check, Layers, Sliders, Eye, Sparkles } from "lucide-react";
import { TechnicalDrawingSvg } from "./TechnicalDrawingSvg";
import { formatINR } from "@/lib/format";
import { DRAWING_TYPE_LABELS, parseDrawingConfig } from "@/lib/drawing-types";

export interface CatalogueCategory {
  id: string;
  name: string;
  slug: string;
  showUpvcFields: boolean;
}

export interface CatalogueBrand {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogueProduct {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category: CatalogueCategory;
  brandId?: string | null;
  brand?: CatalogueBrand | null;
  drawingType: string;
  defaultPanelsJson?: string;
  defaultWidthMm: number;
  defaultHeightMm: number;
  defaultRatePerSqFt: number;
  showUpvcFields?: boolean | null;
  description?: string | null;
  images: Array<{
    id: string;
    url: string;
    title?: string | null;
    viewType: string;
    isDefault: boolean;
  }>;
  specifications: Array<{
    profileSystem?: string | null;
    glassType?: string | null;
    profileColour?: string | null;
    meshType?: string | null;
    track?: string | null;
    trackRi?: string | null;
    slidingSash?: string | null;
    slidingSashRi?: string | null;
    flymeshSash?: string | null;
    mullionRi?: string | null;
    locking?: string | null;
    handleColour?: string | null;
    handleType?: string | null;
    lockableEspag?: string | null;
    rollerType?: string | null;
    additionalAccess?: string | null;
  }>;
}

export function ProductCatalogueModal({
  open,
  onClose,
  categories,
  brands,
  products,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  categories: CatalogueCategory[];
  brands: CatalogueBrand[];
  products: CatalogueProduct[];
  onSelect: (product: CatalogueProduct) => void;
}) {
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [previewProduct, setPreviewProduct] = useState<CatalogueProduct | null>(null);

  if (!open) return null;

  const filtered = products.filter((p) => {
    if (selectedCat !== "ALL" && p.categoryId !== selectedCat) return false;
    if (selectedBrand !== "ALL" && p.brandId !== selectedBrand) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.brand?.name || "").toLowerCase().includes(q) ||
        (p.category?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAE3] w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAE3] flex items-center justify-between bg-[#174535] text-white">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-base font-bold">
                Dynamic Product &amp; Technical Drawing Catalogue
              </h2>
              <p className="text-xs text-emerald-100">
                Select from {products.length} architectural door, window, and partition systems
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs & Search Filters */}
        <div className="p-4 border-b border-[#E5EAE3] bg-[#F7F8F4] space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCat("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selectedCat === "ALL"
                  ? "bg-[#174535] text-white shadow-xs"
                  : "bg-white border border-[#E5EAE3] text-[#1F2937] hover:bg-slate-100"
                }`}
            >
              All Categories ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selectedCat === cat.id
                      ? "bg-[#174535] text-white shadow-xs"
                      : "bg-white border border-[#E5EAE3] text-[#1F2937] hover:bg-slate-100"
                    }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search design name, code, brand or type..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E5EAE3] rounded-lg text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535]"
              />
            </div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5EAE3] rounded-lg text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174535]/15 focus:border-[#174535] font-medium"
            >
              <option value="ALL">All Brands &amp; Systems</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/40">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#718075]">
              No products match your filter criteria. Try selecting &quot;All Categories&quot; or clearing your search.
            </div>
          ) : (
            filtered.map((prod) => {
              const defaultImg =
                prod.images.find((i) => i.isDefault)?.url || prod.images[0]?.url || null;
              const spec = prod.specifications?.[0];

              return (
                <div
                  key={prod.id}
                  className="bg-white border border-[#E5EAE3] rounded-xl p-3.5 hover:border-[#174535] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#174535]">
                        {prod.code}
                      </span>
                      {prod.brand && (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {prod.brand.name}
                        </span>
                      )}
                    </div>

                    <div className="bg-[#F7F8F4] rounded-lg border border-[#E5EAE3] p-2 mb-3 flex items-center justify-center">
                      <TechnicalDrawingSvg
                        widthMm={prod.defaultWidthMm}
                        heightMm={prod.defaultHeightMm}
                        drawingType={prod.drawingType}
                        drawingConfigJson={prod.defaultPanelsJson}
                        customImageUrl={defaultImg}
                        compact
                      />
                    </div>

                    <div className="font-bold text-sm text-[#1F2937] group-hover:text-[#174535] transition-colors">
                      {prod.name}
                    </div>
                    <div className="text-[11px] text-[#718075] mt-0.5">
                      {prod.category?.name}
                    </div>
                    {prod.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5EAE3] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Default Size</div>
                      <div className="text-xs font-mono font-semibold text-slate-700">
                        {prod.defaultWidthMm} × {prod.defaultHeightMm} mm
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#174535]">
                        {formatINR(prod.defaultRatePerSqFt)}/sq.ft
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(prod);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] transition-colors shadow-xs inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Select
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
