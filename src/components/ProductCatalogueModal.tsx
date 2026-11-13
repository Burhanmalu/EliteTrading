"use client";

import React, { useState } from "react";
import { X, Search, Check } from "lucide-react";
import { TechnicalDrawingSvg } from "./TechnicalDrawingSvg";
import { formatINR } from "@/lib/format";

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
  defaultWidthMm: number;
  defaultHeightMm: number;
  defaultRatePerSqFt: number;
  showUpvcFields?: boolean | null;
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

  if (!open) return null;

  const filtered = products.filter((p) => {
    if (selectedCat !== "ALL" && p.categoryId !== selectedCat) return false;
    if (selectedBrand !== "ALL" && p.brandId !== selectedBrand) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.brand?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DDE4DA] flex items-center justify-between bg-[#294C3B] text-white">
          <div>
            <h2 className="text-lg font-bold">
              Dynamic Product &amp; Technical Drawing Catalogue
            </h2>
            <p className="text-xs text-slate-300">
              Select a door, window, or partition design to load its technical drawing &amp; specifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs & Filters */}
        <div className="p-4 border-b border-[#DDE4DA] bg-slate-50 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCat("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCat === "ALL"
                  ? "bg-[#294C3B] text-white"
                  : "bg-white border border-[#DDE4DA] text-slate-700 hover:bg-slate-100"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCat === cat.id
                    ? "bg-[#294C3B] text-white"
                    : "bg-white border border-[#DDE4DA] text-slate-700 hover:bg-slate-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search design name or code..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg"
              />
            </div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg"
            >
              <option value="ALL">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[#718075]">
              No products match your filter.
            </div>
          ) : (
            filtered.map((prod) => {
              const defaultImg =
                prod.images.find((i) => i.isDefault)?.url ||
                prod.images[0]?.url ||
                null;
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    onSelect(prod);
                    onClose();
                  }}
                  className="text-left bg-white border border-[#DDE4DA] rounded-xl p-3.5 hover:border-[#294C3B] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {prod.code}
                      </span>
                      {prod.brand && (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {prod.brand.name}
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-lg border border-slate-100 p-2 mb-3 flex items-center justify-center">
                      <TechnicalDrawingSvg
                        widthMm={prod.defaultWidthMm}
                        heightMm={prod.defaultHeightMm}
                        drawingType={prod.drawingType}
                        customImageUrl={defaultImg}
                        compact
                      />
                    </div>

                    <div className="font-bold text-sm text-[#25382E] group-hover:text-[#294C3B]">
                      {prod.name}
                    </div>
                    <div className="text-[11px] text-[#718075] mt-0.5">
                      {prod.category.name}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[#718075]">
                      Default: {prod.defaultWidthMm}×{prod.defaultHeightMm} mm
                    </span>
                    <span className="font-bold text-[#294C3B] flex items-center gap-1">
                      {formatINR(prod.defaultRatePerSqFt)}/sq.ft
                      <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-600" />
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

