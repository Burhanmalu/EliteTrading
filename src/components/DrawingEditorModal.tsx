"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  Eye,
  Sliders,
  Layers,
  Ruler,
  Upload,
  ArrowRight,
  Maximize2,
} from "lucide-react";
import { TechnicalDrawingSvg } from "./TechnicalDrawingSvg";
import {
  DRAWING_TYPE_LABELS,
  DrawingConfig,
  DrawingPanelConfig,
  PanelKind,
  SlideDirection,
  getDefaultDrawingConfig,
  getProductFrameDepthMm,
  parseDrawingConfig,
} from "@/lib/drawing-types";

const PANEL_KINDS: Array<{ value: PanelKind; label: string }> = [
  { value: "SLIDE_GLASS", label: "Sliding Glass (G)" },
  { value: "SLIDE_MESH", label: "Sliding Mesh (M)" },
  { value: "FIXED", label: "Fixed Glass (F)" },
  { value: "OPENABLE_LEFT", label: "Openable Left (O-L)" },
  { value: "OPENABLE_RIGHT", label: "Openable Right (O-R)" },
  { value: "TILT_TURN", label: "Tilt and Turn (TT)" },
  { value: "TOP_HUNG", label: "Top Hung Awning (TH)" },
  { value: "VENTILATION", label: "Ventilation Louver (V)" },
  { value: "FRENCH_DOOR", label: "French Door Muntin Grid (FD)" },
  { value: "GLASS_PANEL", label: "Architectural Glass Panel" },
  { value: "SHOWER_DOOR", label: "Shower Hinged Door (SD)" },
  { value: "CORNER_POST", label: "90° Corner Post (POST)" },
];

const SLIDE_DIRECTIONS: Array<{ value: SlideDirection; label: string }> = [
  { value: "NONE", label: "None (Fixed/Swing)" },
  { value: "LEFT", label: "Slide Left (←)" },
  { value: "RIGHT", label: "Slide Right (→)" },
  { value: "BOTH", label: "Slide Both Ways (↔)" },
];

export interface DrawingEditorModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    id?: string;
    code: string;
    name: string;
    categoryId: string;
    brandId?: string | null;
    drawingType: string;
    defaultPanelsJson?: string;
    defaultWidthMm: number;
    defaultHeightMm: number;
    defaultRatePerSqFt: number;
    showUpvcFields?: boolean | null;
    description?: string | null;
    isActive?: boolean;
    images?: Array<{ id: string; url: string; viewType: string; isDefault: boolean }>;
  } | null;
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  onSave: (payload: any) => Promise<void>;
}

export function DrawingEditorModal({
  open,
  onClose,
  product,
  categories,
  brands,
  onSave,
}: DrawingEditorModalProps) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    categoryId: "",
    brandId: "",
    drawingType: "SLIDING_3_TRACK_WINDOW",
    defaultWidthMm: 1800,
    defaultHeightMm: 1500,
    defaultRatePerSqFt: 550,
    description: "",
    isActive: true,
  });

  const [drawingConfig, setDrawingConfig] = useState<DrawingConfig>({
    viewSide: "INSIDE",
    trackCount: 3,
    frameDepthMm: 112,
    frameStyle: "UPVC",
    panels: [],
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"PANELS" | "SPECS" | "VENTILATION">("PANELS");

  useEffect(() => {
    if (product) {
      setForm({
        code: product.code || "",
        name: product.name || "",
        categoryId: product.categoryId || categories[0]?.id || "",
        brandId: product.brandId || "",
        drawingType: product.drawingType || "SLIDING_3_TRACK_WINDOW",
        defaultWidthMm: product.defaultWidthMm || 1800,
        defaultHeightMm: product.defaultHeightMm || 1500,
        defaultRatePerSqFt: product.defaultRatePerSqFt || 550,
        description: product.description || "",
        isActive: product.isActive ?? true,
      });

      const cfg = parseDrawingConfig(
        product.defaultPanelsJson,
        product.drawingType || "SLIDING_3_TRACK_WINDOW",
        product.defaultWidthMm || 1800
      );
      setDrawingConfig(cfg);
    } else {
      const defaultType = "SLIDING_3_TRACK_WINDOW";
      setForm({
        code: "",
        name: "",
        categoryId: categories[0]?.id || "",
        brandId: "",
        drawingType: defaultType,
        defaultWidthMm: 1800,
        defaultHeightMm: 1500,
        defaultRatePerSqFt: 550,
        description: "",
        isActive: true,
      });
      setDrawingConfig(getDefaultDrawingConfig(defaultType, 1800));
    }
  }, [product, categories, open]);

  if (!open) return null;

  const handleDrawingTypeChange = (newType: string) => {
    const defaultCfg = getDefaultDrawingConfig(newType, form.defaultWidthMm);
    setForm((f) => ({ ...f, drawingType: newType }));
    setDrawingConfig(defaultCfg);
  };

  const updatePanel = (idx: number, patch: Partial<DrawingPanelConfig>) => {
    setDrawingConfig((prev) => {
      const nextPanels = [...prev.panels];
      nextPanels[idx] = { ...nextPanels[idx], ...patch };
      return { ...prev, panels: nextPanels };
    });
  };

  const addPanel = () => {
    setDrawingConfig((prev) => {
      const count = prev.panels.length + 1;
      const newP: DrawingPanelConfig = {
        id: `p-${Date.now()}`,
        label: `P${count}`,
        kind: "SLIDE_GLASS",
        widthRatio: 1,
        slideDirection: "NONE",
      };
      return { ...prev, panels: [...prev.panels, newP] };
    });
  };

  const removePanel = (idx: number) => {
    setDrawingConfig((prev) => {
      if (prev.panels.length <= 1) return prev;
      return {
        ...prev,
        panels: prev.panels.filter((_, i) => i !== idx),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: product?.id,
        ...form,
        defaultPanelsJson: JSON.stringify(drawingConfig),
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save product drawing template.");
    } finally {
      setSaving(false);
    }
  };

  const isVentilationType =
    form.drawingType.includes("VENTILATION") || Boolean(drawingConfig.hasSectionDimensions);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAE3] w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAE3] flex items-center justify-between bg-[#174535] text-white">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-base font-bold">
                {product?.id ? "Product CAD Drawing & Template Editor" : "Create New Product Design Template"}
              </h2>
              <p className="text-xs text-emerald-100">
                Configure architectural SVG vectors, panel arrangements, dimensions and CAD views
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

        {/* Content Body: Left Controls, Right Live SVG CAD Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5EAE3]">
          {/* Left Column: Form & Configuration (7 cols) */}
          <form onSubmit={handleSubmit} id="drawing-editor-form" className="lg:col-span-7 p-5 space-y-4 overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Product Code</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. UPVC-4T-01"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-[#E5EAE3] rounded-lg text-[#1F2937]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Product Design Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 4 Track Sliding Window with Mesh"
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-[#E5EAE3] rounded-lg text-[#1F2937]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5EAE3] rounded-lg text-[#1F2937]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Brand / System</label>
                <select
                  value={form.brandId}
                  onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5EAE3] rounded-lg text-[#1F2937]"
                >
                  <option value="">No Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rate / Sq.Ft. (INR)</label>
                <input
                  type="number"
                  value={form.defaultRatePerSqFt}
                  onChange={(e) => setForm({ ...form, defaultRatePerSqFt: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-[#E5EAE3] rounded-lg text-[#174535]"
                />
              </div>
            </div>

            {/* Drawing Model & Template Selector */}
            <div className="bg-[#F7F8F4] border border-[#E5EAE3] rounded-xl p-3.5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#174535] mb-1">
                  CAD Template Architecture
                </label>
                <select
                  value={form.drawingType}
                  onChange={(e) => handleDrawingTypeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-[#E5EAE3] rounded-lg text-[#1F2937]"
                >
                  {Object.entries(DRAWING_TYPE_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimensions & CAD Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Width (mm)</label>
                  <input
                    type="number"
                    value={form.defaultWidthMm}
                    onChange={(e) =>
                      setForm({ ...form, defaultWidthMm: Number(e.target.value) || 100 })
                    }
                    className="w-full px-2.5 py-1.5 font-mono text-xs rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Height (mm)</label>
                  <input
                    type="number"
                    value={form.defaultHeightMm}
                    onChange={(e) =>
                      setForm({ ...form, defaultHeightMm: Number(e.target.value) || 100 })
                    }
                    className="w-full px-2.5 py-1.5 font-mono text-xs rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Tracks</label>
                  <select
                    value={drawingConfig.trackCount || 1}
                    onChange={(e) =>
                      setDrawingConfig({
                        ...drawingConfig,
                        trackCount: Number(e.target.value),
                        frameDepthMm: getProductFrameDepthMm(null, Number(e.target.value), drawingConfig.frameStyle),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  >
                    <option value={1}>1 Track (Single)</option>
                    <option value={2}>2 Track</option>
                    <option value={3}>3 Track</option>
                    <option value={4}>4 Track</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Frame Depth</label>
                  <input
                    type="number"
                    value={drawingConfig.frameDepthMm || 60}
                    onChange={(e) =>
                      setDrawingConfig({ ...drawingConfig, frameDepthMm: Number(e.target.value) || 60 })
                    }
                    className="w-full px-2.5 py-1.5 font-mono text-xs rounded border border-slate-300"
                  />
                </div>
              </div>

              {/* View Side & Style */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Elevation View Orientation</label>
                  <select
                    value={drawingConfig.viewSide || "INSIDE"}
                    onChange={(e) =>
                      setDrawingConfig({ ...drawingConfig, viewSide: e.target.value as "INSIDE" | "OUTSIDE" })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  >
                    <option value="INSIDE">Inside View</option>
                    <option value="OUTSIDE">Outside View</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Frame Visual Style</label>
                  <select
                    value={drawingConfig.frameStyle || "UPVC"}
                    onChange={(e) =>
                      setDrawingConfig({ ...drawingConfig, frameStyle: e.target.value as any })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  >
                    <option value="UPVC">uPVC Chambered Profile</option>
                    <option value="ALUMINIUM">Aluminium Slim Frame</option>
                    <option value="DOMAL">Domal European Profile</option>
                    <option value="METAL">Infinity Metal Steel</option>
                    <option value="FRAMELESS">Frameless Safety Glass</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sub-Editor Navigation: Panels vs Ventilation Settings */}
            <div className="border-b border-slate-200 flex items-center justify-between pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("PANELS")}
                  className={`pb-2 px-1 text-xs font-bold border-b-2 transition-colors ${
                    activeTab === "PANELS"
                      ? "border-[#174535] text-[#174535]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Panel Layout ({drawingConfig.panels.length})
                </button>
                {isVentilationType && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("VENTILATION")}
                    className={`pb-2 px-1 text-xs font-bold border-b-2 transition-colors ${
                      activeTab === "VENTILATION"
                        ? "border-[#174535] text-[#174535]"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Ventilation Section Dimensions
                  </button>
                )}
              </div>
              {activeTab === "PANELS" && (
                <button
                  type="button"
                  onClick={addPanel}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#174535] text-white hover:bg-[#10382D]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Panel
                </button>
              )}
            </div>

            {/* Panels Configuration Table */}
            {activeTab === "PANELS" && (
              <div className="space-y-2">
                {drawingConfig.panels.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 bg-white border border-[#E5EAE3] rounded-lg shadow-xs grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-400">Label</label>
                      <input
                        value={p.label}
                        onChange={(e) => updatePanel(idx, { label: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold font-mono text-center"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[9px] font-bold text-slate-400">Type</label>
                      <select
                        value={p.kind}
                        onChange={(e) => updatePanel(idx, { kind: e.target.value as PanelKind })}
                        className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                      >
                        {PANEL_KINDS.map((k) => (
                          <option key={k.value} value={k.value}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-400">Ratio</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        value={p.widthRatio || 1}
                        onChange={(e) => updatePanel(idx, { widthRatio: parseFloat(e.target.value) || 1 })}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-mono text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[9px] font-bold text-slate-400">Opening / Slide</label>
                      <select
                        value={p.slideDirection || "NONE"}
                        onChange={(e) => updatePanel(idx, { slideDirection: e.target.value as SlideDirection })}
                        className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                      >
                        {SLIDE_DIRECTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removePanel(idx)}
                        disabled={drawingConfig.panels.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                        title="Delete panel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* French Door muntin rows/cols configuration */}
                    {p.kind === "FRENCH_DOOR" && (
                      <div className="col-span-12 pt-1 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-600">
                        <span>Grid Divisions:</span>
                        <label className="inline-flex items-center gap-1">
                          Rows:
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={p.rows || 4}
                            onChange={(e) => updatePanel(idx, { rows: Number(e.target.value) || 4 })}
                            className="w-12 px-1.5 py-0.5 rounded border border-slate-300 text-center font-mono"
                          />
                        </label>
                        <label className="inline-flex items-center gap-1">
                          Cols:
                          <input
                            type="number"
                            min="1"
                            max="6"
                            value={p.cols || 2}
                            onChange={(e) => updatePanel(idx, { cols: Number(e.target.value) || 2 })}
                            className="w-12 px-1.5 py-0.5 rounded border border-slate-300 text-center font-mono"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ventilation Section Dimensions */}
            {activeTab === "VENTILATION" && isVentilationType && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                <div className="font-bold text-[#174535]">Dedicated Fan &amp; Glass Section Heights</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">Fan Section Height (mm)</label>
                    <input
                      type="number"
                      value={drawingConfig.topHeightMm || 450}
                      onChange={(e) => setDrawingConfig({ ...drawingConfig, topHeightMm: Number(e.target.value) || 450 })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">Glass Section Height (mm)</label>
                    <input
                      type="number"
                      value={drawingConfig.bottomHeightMm || 1700}
                      onChange={(e) => setDrawingConfig({ ...drawingConfig, bottomHeightMm: Number(e.target.value) || 1700 })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">Fan Section Width (mm)</label>
                    <input
                      type="number"
                      value={drawingConfig.fanWidthMm || 400}
                      onChange={(e) => setDrawingConfig({ ...drawingConfig, fanWidthMm: Number(e.target.value) || 400 })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">Top Glass Width (mm)</label>
                    <input
                      type="number"
                      value={drawingConfig.glassWidthMm || 400}
                      onChange={(e) => setDrawingConfig({ ...drawingConfig, glassWidthMm: Number(e.target.value) || 400 })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  Note: Total Height = Fan Section Height ({drawingConfig.topHeightMm || 450} mm) + Glass Section Height ({drawingConfig.bottomHeightMm || 1700} mm) = {(drawingConfig.topHeightMm || 450) + (drawingConfig.bottomHeightMm || 1700)} mm.
                </div>
              </div>
            )}
          </form>

          {/* Right Column: Dynamic Live Technical Drawing CAD Preview (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[#F7F8F4] flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-wide uppercase text-[#174535] flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Live Dynamic Drawing
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {form.defaultWidthMm} × {form.defaultHeightMm} mm
                </span>
              </div>

              {/* Live Canvas */}
              <div className="bg-white border border-[#E5EAE3] rounded-xl p-3 shadow-sm flex items-center justify-center">
                <TechnicalDrawingSvg
                  widthMm={form.defaultWidthMm}
                  heightMm={form.defaultHeightMm}
                  drawingType={form.drawingType}
                  drawingConfig={drawingConfig}
                  code={form.code || "PREVIEW"}
                  location="Admin CAD Preview"
                />
              </div>

              {/* Specifications summary */}
              <div className="mt-4 p-3 bg-white border border-[#E5EAE3] rounded-xl text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Panels:</span>
                  <span className="font-semibold text-slate-800">{drawingConfig.panels.length} sashes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tracks / Frame Depth:</span>
                  <span className="font-semibold text-slate-800">
                    {drawingConfig.trackCount || 1} Track • {drawingConfig.frameDepthMm || 60} mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Orientation:</span>
                  <span className="font-semibold text-slate-800">{drawingConfig.viewSide || "INSIDE"} View</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-emerald-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    Active in Catalogue
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E5EAE3] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E5EAE3] bg-white text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="drawing-editor-form"
                disabled={saving}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-[#174535] text-white hover:bg-[#10382D] transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? "Saving..." : <><Check className="w-4 h-4" /> Save Drawing Template</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

