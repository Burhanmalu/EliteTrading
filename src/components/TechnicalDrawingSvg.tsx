"use client";

import React, { useState } from "react";
import {
  DrawingConfig,
  DrawingPanelConfig,
  computeVentilationFanMetrics,
  getProductFrameDepthMm,
  parseDrawingConfig,
} from "@/lib/drawing-types";

interface TechnicalDrawingSvgProps {
  widthMm: number;
  heightMm: number;
  drawingType: string;
  drawingConfigJson?: string | null;
  defaultPanelsJson?: string | null;
  drawingConfig?: DrawingConfig | null;
  customImageUrl?: string | null;
  location?: string;
  code?: string;
  compact?: boolean;
  className?: string;
}

export function TechnicalDrawingSvg({
  widthMm,
  heightMm,
  drawingType,
  drawingConfigJson,
  defaultPanelsJson,
  drawingConfig,
  customImageUrl,
  location,
  code,
  compact = false,
  className = "",
}: TechnicalDrawingSvgProps) {
  const [activeViewTab, setActiveViewTab] = useState<"ALL" | "FRONT" | "TOP">("ALL");

  const safeW = Math.max(100, Number(widthMm) || 1800);
  const safeH = Math.max(100, Number(heightMm) || 1500);

  const config: DrawingConfig =
    drawingConfig ??
    parseDrawingConfig(drawingConfigJson || defaultPanelsJson, drawingType, safeW);

  const isVentilation =
    drawingType === "VENTILATION_FAN" ||
    drawingType === "VENTILATION" ||
    drawingType === "VENTILATION_WINDOW" ||
    Boolean(config.hasSectionDimensions);

  if (isVentilation && drawingType === "VENTILATION_FAN") {
    return (
      <VentilationFanSvg
        widthMm={safeW}
        heightMm={safeH}
        config={config}
        location={location}
        code={code}
        compact={compact}
        className={className}
      />
    );
  }

  const supportsTopView =
    !compact &&
    (drawingType.includes("TRACK") ||
      drawingType.includes("SLIDING") ||
      drawingType.includes("OPENABLE") ||
      drawingType.includes("CASEMENT") ||
      drawingType.includes("FIXED") ||
      drawingType.includes("FRENCH") ||
      drawingType.includes("PARTITION") ||
      Boolean(config.trackCount && config.trackCount > 1));

  const hasTopView = supportsTopView && activeViewTab !== "FRONT";

  // Canvas size
  const canvasW = compact ? 260 : 420;
  const showTopOnly = activeViewTab === "TOP";
  const canvasH = compact
    ? 200
    : showTopOnly
    ? 180
    : hasTopView
    ? 390
    : 310;

  const padLeft = compact ? 38 : 58;
  const padRight = compact ? 18 : 30;
  const padTop = compact ? 22 : 36;
  const padBottom = compact ? 28 : hasTopView ? 88 : 44;

  const availW = canvasW - padLeft - padRight;
  const availH = canvasH - padTop - padBottom;

  const rawAspect = safeW / safeH;
  const aspect = Math.max(0.32, Math.min(3.4, rawAspect));

  let drawW = availW;
  let drawH = drawW / aspect;
  if (drawH > availH) {
    drawH = availH;
    drawW = drawH * aspect;
  }

  const startX = padLeft + (availW - drawW) / 2;
  const startY = padTop + (availH - drawH) / 2;

  const isFrameless = config.frameStyle === "FRAMELESS";
  const isMetal = config.frameStyle === "METAL";
  const frameThickness = isFrameless ? 2 : compact ? 5 : 8;
  const sashThickness = isFrameless ? 1.5 : compact ? 3.5 : 5;

  const innerX = startX + frameThickness;
  const innerY = startY + frameThickness;
  const innerW = Math.max(20, drawW - frameThickness * 2);
  const innerH = Math.max(20, drawH - frameThickness * 2);

  // Compute panel rects
  const panels = config.panels || [];
  const totalRatio = panels.reduce((acc, p) => acc + (p.widthRatio || 1), 0) || 1;

  let cursorX = innerX;
  const panelRects = panels.map((panel, idx) => {
    const ratio = (panel.widthRatio || 1) / totalRatio;
    const w = idx === panels.length - 1 ? innerX + innerW - cursorX : innerW * ratio;
    const computedMm = panel.widthMm ?? Math.round(safeW * ratio);
    const rect = { panel, x: cursorX, y: innerY, w, h: innerH, mm: computedMm };
    cursorX += w;
    return rect;
  });

  const frameStroke = isMetal ? "#0f172a" : "#1e293b";
  const frameFill = isMetal ? "#334155" : isFrameless ? "#f8fafc" : "#f1f5f9";

  // If custom uploaded image is present, render proportional preview
  if (customImageUrl) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-white border border-[#DDE4DA] rounded-lg p-2.5 ${className}`}
      >
        {(code || location) && !compact && (
          <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1 px-1">
            <span>{code ? `${code}` : ""}</span>
            <span className="uppercase tracking-wide text-[#718075]">{location || ""}</span>
          </div>
        )}
        <div className="relative flex items-center justify-center w-full" style={{ minHeight: compact ? 130 : 220 }}>
          <div className="flex flex-col items-center justify-center mr-2 text-[10px] font-mono font-semibold text-slate-600 select-none">
            <span>↕</span>
            <span className="writing-mode-vertical rotate-180 [writing-mode:vertical-rl]">{safeH} mm</span>
          </div>
          <div
            className="relative border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden rounded"
            style={{ width: Math.round(drawW), height: Math.round(drawH) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={customImageUrl} alt={code || "Technical Drawing"} className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="mt-1.5 text-[11px] font-mono font-semibold text-slate-700 flex items-center gap-2">
          <span>← {safeW} mm →</span>
          {!compact && (
            <span className="text-[10px] font-sans uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-[#DDE4DA]">
              {config.viewSide || "INSIDE"} VIEW
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center bg-white select-none ${className}`}>
      {/* View Toggle Bar (when not compact and top view exists) */}
      {!compact && supportsTopView && (
        <div className="w-full flex items-center justify-between px-2 pb-1.5 text-[11px] border-b border-slate-100 mb-1">
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            {code && <span className="font-mono text-[#174535] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{code}</span>}
            {location && <span className="text-slate-500">• {location}</span>}
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium">
            <button
              type="button"
              onClick={() => setActiveViewTab("ALL")}
              className={`px-2 py-0.5 rounded ${activeViewTab === "ALL" ? "bg-white text-[#174535] font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              All Views
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab("FRONT")}
              className={`px-2 py-0.5 rounded ${activeViewTab === "FRONT" ? "bg-white text-[#174535] font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Elevation
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab("TOP")}
              className={`px-2 py-0.5 rounded ${activeViewTab === "TOP" ? "bg-white text-[#174535] font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Top View
            </button>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        className="w-full h-auto max-w-full select-none"
        role="img"
        aria-label={`Technical CAD drawing ${safeW}x${safeH} mm`}
      >
        <defs>
          <pattern id={`mesh-${compact ? "c" : "f"}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 6 0 L 0 6 M 0 0 L 6 6" stroke="#64748b" strokeWidth="0.6" opacity="0.55" />
          </pattern>
          <marker id="arrow-end" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#1e3a5f" />
          </marker>
          <marker id="arrow-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6 Z" fill="#1e3a5f" />
          </marker>
          <marker id="slide-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#0f172a" />
          </marker>
        </defs>

        {!showTopOnly && (
          <>
            {/* Top Location & Code Title */}
            {!compact && (location || code) && activeViewTab === "FRONT" && (
              <text x={startX + drawW / 2} y={15} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a" letterSpacing="0.5">
                {[code, location].filter(Boolean).join(" • ").toUpperCase()}
              </text>
            )}

            {/* Panel Width Callouts (Top) */}
            {!compact && panelRects.length > 1 && (
              <g>
                {panelRects.map((pr, i) => {
                  const dimY = startY - 10;
                  return (
                    <g key={pr.panel.id || i}>
                      <line x1={pr.x} y1={startY - 2} x2={pr.x} y2={dimY - 3} stroke="#94a3b8" strokeWidth="0.7" />
                      {i === panelRects.length - 1 && (
                        <line x1={pr.x + pr.w} y1={startY - 2} x2={pr.x + pr.w} y2={dimY - 3} stroke="#94a3b8" strokeWidth="0.7" />
                      )}
                      <line x1={pr.x + 2} y1={dimY} x2={pr.x + pr.w - 2} y2={dimY} stroke="#64748b" strokeWidth="0.8" />
                      <text x={pr.x + pr.w / 2} y={dimY - 3} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#475569" fontWeight="600">
                        {pr.mm}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Outer Frame */}
            <rect
              x={startX}
              y={startY}
              width={drawW}
              height={drawH}
              fill={frameFill}
              stroke={frameStroke}
              strokeWidth={isFrameless ? 1.2 : 1.8}
            />

            {/* Mitre corner lines */}
            {!isFrameless && (
              <g stroke="#64748b" strokeWidth="0.6" opacity="0.6">
                <line x1={startX} y1={startY} x2={innerX} y2={innerY} />
                <line x1={startX + drawW} y1={startY} x2={innerX + innerW} y2={innerY} />
                <line x1={startX} y1={startY + drawH} x2={innerX} y2={innerY + innerH} />
                <line x1={startX + drawW} y1={startY + drawH} x2={innerX + innerW} y2={innerY + innerH} />
              </g>
            )}

            {/* L-Type Corner Indicator */}
            {config.isLType && (
              <rect x={startX + drawW * 0.25 - 3} y={startY} width={6} height={drawH} fill="#334155" />
            )}

            {/* Panels */}
            {panelRects.map((pr, idx) => (
              <PanelRenderer
                key={pr.panel.id || idx}
                rect={pr}
                sashThickness={sashThickness}
                isMetal={isMetal}
                isFrameless={isFrameless}
                compact={compact}
                totalPanels={panelRects.length}
                panelIdx={idx}
              />
            ))}

            {/* Total Width Dimension (Bottom) */}
            <g>
              <line x1={startX} y1={startY + drawH + 3} x2={startX} y2={startY + drawH + (compact ? 18 : 24)} stroke="#1e3a5f" strokeWidth="0.8" />
              <line x1={startX + drawW} y1={startY + drawH + 3} x2={startX + drawW} y2={startY + drawH + (compact ? 18 : 24)} stroke="#1e3a5f" strokeWidth="0.8" />
              <line
                x1={startX + 4}
                y1={startY + drawH + (compact ? 13 : 18)}
                x2={startX + drawW - 4}
                y2={startY + drawH + (compact ? 13 : 18)}
                stroke="#1e3a5f"
                strokeWidth="1.1"
                markerStart="url(#arrow-start)"
                markerEnd="url(#arrow-end)"
              />
              <rect
                x={startX + drawW / 2 - (compact ? 24 : 32)}
                y={startY + drawH + (compact ? 6 : 10)}
                width={compact ? 48 : 64}
                height={compact ? 13 : 15}
                fill="#ffffff"
              />
              <text
                x={startX + drawW / 2}
                y={startY + drawH + (compact ? 16 : 21)}
                textAnchor="middle"
                fontSize={compact ? "8.5" : "10"}
                fontWeight="700"
                fontFamily="monospace"
                fill="#0f172a"
              >
                {safeW} mm
              </text>
            </g>

            {/* Total Height Dimension (Left) */}
            <g>
              <line x1={startX - 3} y1={startY} x2={startX - (compact ? 18 : 24)} y2={startY} stroke="#1e3a5f" strokeWidth="0.8" />
              <line x1={startX - 3} y1={startY + drawH} x2={startX - (compact ? 18 : 24)} y2={startY + drawH} stroke="#1e3a5f" strokeWidth="0.8" />
              <line
                x1={startX - (compact ? 13 : 18)}
                y1={startY + 4}
                x2={startX - (compact ? 13 : 18)}
                y2={startY + drawH - 4}
                stroke="#1e3a5f"
                strokeWidth="1.1"
                markerStart="url(#arrow-start)"
                markerEnd="url(#arrow-end)"
              />
              <text
                x={startX - (compact ? 17 : 23)}
                y={startY + drawH / 2}
                textAnchor="middle"
                fontSize={compact ? "8.5" : "10"}
                fontWeight="700"
                fontFamily="monospace"
                fill="#0f172a"
                transform={`rotate(-90 ${startX - (compact ? 17 : 23)} ${startY + drawH / 2})`}
              >
                {safeH} mm
              </text>
            </g>

            {/* View Side Footer */}
            {!compact && (
              <text
                x={startX + drawW / 2}
                y={hasTopView ? startY + drawH + 30 : canvasH - 4}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="700"
                fill="#475569"
                letterSpacing="0.8"
              >
                FRONT ELEVATION ({config.viewSide || "INSIDE"} VIEW)
              </text>
            )}
          </>
        )}

        {/* Upper / Top View */}
        {(hasTopView || showTopOnly) && (() => {
          const trackCount =
            config.trackCount ??
            (drawingType.includes("4_TRACK")
              ? 4
              : drawingType.includes("3_TRACK")
              ? 3
              : drawingType.includes("2_TRACK")
              ? 2
              : 1);
          const frameDepthMm =
            config.frameDepthMm ??
            getProductFrameDepthMm(null, trackCount, config.frameStyle);
          const topBoxY = showTopOnly ? 45 : startY + drawH + 38;
          const topBoxH = trackCount === 4 ? 28 : 22;
          const topTrackSpacing = topBoxH / (trackCount + 1);

          let tCursorX = startX + 3;
          return (
            <g>
              {/* Outer Top Frame */}
              <rect
                x={startX}
                y={topBoxY}
                width={drawW}
                height={topBoxH}
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="1.2"
              />
              <rect x={startX} y={topBoxY} width={3} height={topBoxH} fill="#cbd5e1" stroke="#1e293b" strokeWidth="0.8" />
              <rect x={startX + drawW - 3} y={topBoxY} width={3} height={topBoxH} fill="#cbd5e1" stroke="#1e293b" strokeWidth="0.8" />

              {/* Tracks */}
              {Array.from({ length: trackCount }).map((_, tIdx) => {
                const ty = topBoxY + (tIdx + 1) * topTrackSpacing;
                return (
                  <line
                    key={tIdx}
                    x1={startX + 3}
                    y1={ty}
                    x2={startX + drawW - 3}
                    y2={ty}
                    stroke="#94a3b8"
                    strokeWidth="0.7"
                  />
                );
              })}

              {/* Sashes on Tracks */}
              {panels.map((p, pIdx) => {
                const ratio = (p.widthRatio || 1) / totalRatio;
                const pw = pIdx === panels.length - 1 ? startX + drawW - 3 - tCursorX : (drawW - 6) * ratio;
                const assignedTrack =
                  trackCount === 4
                    ? (pIdx % 4) + 1
                    : trackCount === 3
                    ? (pIdx % 3) + 1
                    : trackCount === 2
                    ? (pIdx % 2) + 1
                    : 1;
                const ty = topBoxY + assignedTrack * topTrackSpacing;
                const isMesh = p.kind === "SLIDE_MESH";
                const curX = tCursorX;
                tCursorX += pw;

                return (
                  <g key={p.id || pIdx}>
                    <rect
                      x={curX}
                      y={ty - 2.5}
                      width={pw}
                      height={5}
                      fill={isMesh ? "#f1f5f9" : "#0f172a"}
                      stroke="#1e293b"
                      strokeWidth="0.7"
                    />
                    {!isMesh && (
                      <line
                        x1={curX + 1}
                        y1={ty}
                        x2={curX + pw - 1}
                        y2={ty}
                        stroke="#38bdf8"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                );
              })}

              {/* Frame Depth Callout */}
              <text
                x={startX + drawW + 4}
                y={topBoxY + topBoxH / 2 + 3}
                fontSize="7.5"
                fontWeight="700"
                fontFamily="monospace"
                fill="#0f172a"
              >
                {frameDepthMm}mm
              </text>

              {/* Top View Title */}
              <text
                x={startX + drawW / 2}
                y={topBoxY + topBoxH + 12}
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                fill="#475569"
                letterSpacing="0.8"
              >
                UPPER / TOP VIEW ({trackCount > 1 ? `${trackCount} TRACK • ` : ""}{frameDepthMm}mm FRAME DEPTH)
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function PanelRenderer({
  rect,
  sashThickness,
  isMetal,
  isFrameless,
  compact,
  totalPanels,
  panelIdx,
}: {
  rect: {
    panel: DrawingPanelConfig;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  sashThickness: number;
  isMetal: boolean;
  isFrameless: boolean;
  compact: boolean;
  totalPanels: number;
  panelIdx: number;
}) {
  const { panel, x, y, w, h } = rect;
  const gx = x + sashThickness;
  const gy = y + sashThickness;
  const gw = Math.max(8, w - sashThickness * 2);
  const gh = Math.max(8, h - sashThickness * 2);
  const cx = gx + gw / 2;
  const cy = gy + gh / 2;

  const isMesh = panel.kind === "SLIDE_MESH";
  const isVent = panel.kind === "VENTILATION";
  const isFrench = panel.kind === "FRENCH_DOOR";
  const isOpenLeft = panel.kind === "OPENABLE_LEFT";
  const isOpenRight = panel.kind === "OPENABLE_RIGHT";
  const isTiltTurn = panel.kind === "TILT_TURN";
  const isTopHung = panel.kind === "TOP_HUNG";
  const isShowerDoor = panel.kind === "SHOWER_DOOR";
  const isCornerPost = panel.kind === "CORNER_POST";

  const glassFill = isMesh ? "#f8fafc" : isFrameless ? "#f0fdf4" : "#e0f2fe";

  if (isCornerPost) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="#334155" stroke="#0f172a" strokeWidth="1.2" />
        <line x1={x} y1={y} x2={x + w} y2={y + h} stroke="#64748b" strokeWidth="0.8" />
        <line x1={x + w} y1={y} x2={x} y2={y + h} stroke="#64748b" strokeWidth="0.8" />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="800"
          fill="#ffffff"
          transform={`rotate(-90 ${cx} ${cy})`}
        >
          90° POST
        </text>
      </g>
    );
  }

  return (
    <g>
      {/* Sash Border */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={isMetal ? "#475569" : isFrameless ? "transparent" : "#ffffff"}
        stroke={isFrameless ? "#64748b" : "#334155"}
        strokeWidth={isFrameless ? 1 : 1.2}
      />

      {/* Glass / Mesh Pane */}
      <rect
        x={gx}
        y={gy}
        width={gw}
        height={gh}
        fill={glassFill}
        stroke="#64748b"
        strokeWidth="0.8"
      />

      {/* Mesh Hatch */}
      {isMesh && (
        <rect
          x={gx}
          y={gy}
          width={gw}
          height={gh}
          fill={`url(#mesh-${compact ? "c" : "f"})`}
        />
      )}

      {/* Glass Reflection Lines */}
      {!isMesh && !isVent && (
        <g stroke="#7dd3fc" strokeWidth="1" opacity="0.65">
          <line x1={cx - gw * 0.18} y1={cy + gh * 0.14} x2={cx + gw * 0.08} y2={cy - gh * 0.16} />
          <line x1={cx - gw * 0.05} y1={cy + gh * 0.18} x2={cx + gw * 0.2} y2={cy - gh * 0.1} />
        </g>
      )}

      {/* Ventilation Louvers */}
      {isVent && (
        <g>
          {Array.from({ length: panel.rows || 5 }).map((_, i) => {
            const ly = gy + ((i + 1) * gh) / ((panel.rows || 5) + 1);
            return (
              <line
                key={i}
                x1={gx + 3}
                y1={ly}
                x2={gx + gw - 3}
                y2={ly - 4}
                stroke="#334155"
                strokeWidth="1.2"
              />
            );
          })}
        </g>
      )}

      {/* French Door Muntin Grid & Handles */}
      {isFrench && (
        <g>
          <g stroke="#1e293b" strokeWidth={compact ? 1.2 : 1.8}>
            {Array.from({ length: (panel.rows || 4) - 1 }).map((_, r) => {
              const ry = gy + ((r + 1) * gh) / (panel.rows || 4);
              return <line key={`r-${r}`} x1={gx} y1={ry} x2={gx + gw} y2={ry} />;
            })}
            {Array.from({ length: (panel.cols || 2) - 1 }).map((_, c) => {
              const colX = gx + ((c + 1) * gw) / (panel.cols || 2);
              return <line key={`c-${c}`} x1={colX} y1={gy} x2={colX} y2={gy + gh} />;
            })}
          </g>
          {/* Dual or Single French Door Handle */}
          {totalPanels === 2 && panelIdx === 0 && (
            <g>
              <rect x={gx + gw - 5} y={cy - 8} width={4} height={16} rx={1} fill="#0f172a" />
              <circle cx={gx + gw - 3} cy={cy + 3} r={1.2} fill="#f59e0b" />
            </g>
          )}
          {totalPanels === 2 && panelIdx === 1 && (
            <g>
              <rect x={gx + 1} y={cy - 8} width={4} height={16} rx={1} fill="#0f172a" />
              <circle cx={gx + 3} cy={cy + 3} r={1.2} fill="#f59e0b" />
            </g>
          )}
          {totalPanels === 1 && (
            <g>
              <rect x={gx + gw - 6} y={cy - 8} width={4} height={16} rx={1} fill="#0f172a" />
              <circle cx={gx + gw - 4} cy={cy + 3} r={1.2} fill="#f59e0b" />
            </g>
          )}
        </g>
      )}

      {/* Casement Openable Swing Triangle */}
      {isOpenLeft && (
        <g>
          <polyline
            points={`${gx},${gy} ${gx + gw},${cy} ${gx},${gy + gh}`}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <rect x={gx + gw - 5} y={cy - 8} width={3} height={16} rx={1} fill="#0f172a" />
        </g>
      )}
      {isOpenRight && (
        <g>
          <polyline
            points={`${gx + gw},${gy} ${gx},${cy} ${gx + gw},${gy + gh}`}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <rect x={gx + 2} y={cy - 8} width={3} height={16} rx={1} fill="#0f172a" />
        </g>
      )}

      {/* Tilt and Turn Window Representation */}
      {isTiltTurn && (
        <g>
          {/* Swing Triangle */}
          <polyline
            points={`${gx},${gy} ${gx + gw},${cy} ${gx},${gy + gh}`}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          {/* Tilt Triangle (apex at top center) */}
          <polyline
            points={`${gx},${gy + gh} ${cx},${gy} ${gx + gw},${gy + gh}`}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.1"
            strokeDasharray="3 3"
          />
          {/* Ergonomic handle */}
          <rect x={gx + gw - 6} y={cy - 9} width={4} height={18} rx={1.5} fill="#0f172a" />
          <circle cx={gx + gw - 4} cy={cy} r={2} fill="#ffffff" />
        </g>
      )}

      {/* Top Hung Awning Window */}
      {isTopHung && (
        <g>
          {/* Top hinges */}
          <rect x={gx + gw * 0.2 - 6} y={gy - 2} width={12} height={3.5} rx={0.5} fill="#1e293b" />
          <rect x={gx + gw * 0.8 - 6} y={gy - 2} width={12} height={3.5} rx={0.5} fill="#1e293b" />
          {/* Downward triangle */}
          <polyline
            points={`${gx},${gy} ${cx},${gy + gh} ${gx + gw},${gy}`}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          {/* Bottom push-out handle */}
          <rect x={cx - 10} y={gy + gh - 5} width={20} height={4} rx={1} fill="#0f172a" />
        </g>
      )}

      {/* Shower Glass Partition Door */}
      {isShowerDoor && (
        <g>
          {/* Glass clamp hinges on right */}
          <rect x={gx + gw - 4} y={gy + gh * 0.25 - 6} width={5} height={14} rx={1} fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
          <rect x={gx + gw - 4} y={gy + gh * 0.75 - 6} width={5} height={14} rx={1} fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
          {/* Stainless tubular D-handle */}
          <line x1={gx + 8} y1={cy - 22} x2={gx + 8} y2={cy + 22} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={gx + 8} cy={cy - 16} r={1.5} fill="#cbd5e1" />
          <circle cx={gx + 8} cy={cy + 16} r={1.5} fill="#cbd5e1" />
        </g>
      )}

      {/* Sliding Direction Arrows */}
      {panel.slideDirection === "RIGHT" && (
        <line
          x1={cx - gw * 0.24}
          y1={cy + gh * 0.2}
          x2={cx + gw * 0.24}
          y2={cy + gh * 0.2}
          stroke="#0f172a"
          strokeWidth="1.4"
          markerEnd="url(#slide-arrow)"
        />
      )}
      {panel.slideDirection === "LEFT" && (
        <line
          x1={cx + gw * 0.24}
          y1={cy + gh * 0.2}
          x2={cx - gw * 0.24}
          y2={cy + gh * 0.2}
          stroke="#0f172a"
          strokeWidth="1.4"
          markerEnd="url(#slide-arrow)"
        />
      )}
      {panel.slideDirection === "BOTH" && (
        <g>
          <line
            x1={cx - gw * 0.05}
            y1={cy + gh * 0.2}
            x2={cx - gw * 0.28}
            y2={cy + gh * 0.2}
            stroke="#0f172a"
            strokeWidth="1.3"
            markerEnd="url(#slide-arrow)"
          />
          <line
            x1={cx + gw * 0.05}
            y1={cy + gh * 0.2}
            x2={cx + gw * 0.28}
            y2={cy + gh * 0.2}
            stroke="#0f172a"
            strokeWidth="1.3"
            markerEnd="url(#slide-arrow)"
          />
        </g>
      )}

      {/* Panel Label Badge */}
      <g>
        <rect
          x={cx - 10}
          y={cy - 9}
          width={20}
          height={16}
          rx={3}
          fill="#ffffff"
          fillOpacity="0.88"
          stroke="#94a3b8"
          strokeWidth="0.7"
        />
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fontSize={compact ? "8" : "9"}
          fontWeight="700"
          fill="#0f172a"
        >
          {panel.label}
        </text>
      </g>
    </g>
  );
}

function VentilationFanSvg({
  widthMm,
  heightMm,
  config,
  location,
  code,
  compact,
  className,
}: {
  widthMm: number;
  heightMm: number;
  config: DrawingConfig;
  location?: string;
  code?: string;
  compact: boolean;
  className: string;
}) {
  const { safeW, safeH, topMm, bottomMm, fanMm, rightTopMm } =
    computeVentilationFanMetrics(widthMm, heightMm, config);

  const canvasW = compact ? 260 : 440;
  const canvasH = compact ? 200 : 330;
  const padLeft = compact ? 36 : 94;
  const padRight = compact ? 16 : 24;
  const padTop = compact ? 16 : 28;
  const padBottom = compact ? 26 : 56;

  const availW = canvasW - padLeft - padRight;
  const availH = canvasH - padTop - padBottom;

  const rawAspect = safeW / safeH;
  const aspect = Math.max(0.32, Math.min(3.2, rawAspect));

  let drawW = availW;
  let drawH = drawW / aspect;
  if (drawH > availH) {
    drawH = availH;
    drawW = drawH * aspect;
  }

  const startX = padLeft + (availW - drawW) / 2;
  const startY = padTop + (availH - drawH) / 2;
  const frameT = compact ? 4 : 6.5;
  const barT = compact ? 3.5 : 5.5;

  const innerX = startX + frameT;
  const innerY = startY + frameT;
  const innerW = Math.max(20, drawW - frameT * 2);
  const innerH = Math.max(20, drawH - frameT * 2);

  const topH = Math.max(18, innerH * (topMm / safeH));
  const transomY = innerY + topH - barT / 2;
  const fanW = Math.max(18, innerW * (fanMm / safeW));
  const mullionX = innerX + fanW - barT / 2;

  const topPaneH = Math.max(12, transomY - innerY);
  const fanPaneW = Math.max(12, mullionX - innerX);
  const rightTopPaneX = mullionX + barT;
  const rightTopPaneW = Math.max(12, innerX + innerW - rightTopPaneX);

  const botPaneY = transomY + barT;
  const botPaneH = Math.max(16, innerY + innerH - botPaneY);

  // Fan geometry
  const fanCx = innerX + fanPaneW / 2;
  const fanCy = innerY + topPaneH / 2;
  const fanR = Math.max(6, Math.min(fanPaneW, topPaneH) * 0.42);

  const renderCrosshair = (cx: number, cy: number, num: string) => (
    <g>
      <line x1={cx - 8} y1={cy + 6} x2={cx + 8} y2={cy + 6} stroke="#64748b" strokeWidth="0.9" />
      <line x1={cx} y1={cy - 2} x2={cx} y2={cy + 14} stroke="#64748b" strokeWidth="0.9" />
      <circle cx={cx} cy={cy - 8} r={compact ? 5.5 : 7} fill="#ffffff" stroke="#334155" strokeWidth="0.8" />
      <text
        x={cx}
        y={cy - 5.5}
        textAnchor="middle"
        fontSize={compact ? "6.5" : "8"}
        fontWeight="700"
        fill="#0f172a"
      >
        {num}
      </text>
    </g>
  );

  return (
    <div className={`flex flex-col items-center justify-center bg-white ${className}`}>
      <svg
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        className="w-full h-auto max-w-full select-none"
        role="img"
        aria-label={`Ventilation Exhaust Fan ${safeW}x${safeH} mm`}
      >
        <defs>
          <marker id="vf-arrow-end" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
          <marker id="vf-arrow-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6 Z" fill="#64748b" />
          </marker>
        </defs>

        {!compact && (location || code) && (
          <text
            x={startX + drawW / 2}
            y={14}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#0f172a"
            letterSpacing="0.5"
          >
            {[code, location].filter(Boolean).join(" • ").toUpperCase()}
          </text>
        )}

        {/* Outer Frame */}
        <rect x={startX} y={startY} width={drawW} height={drawH} fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
        {/* Mitred corner lines */}
        <line x1={startX} y1={startY} x2={innerX} y2={innerY} stroke="#334155" strokeWidth="0.8" />
        <line x1={startX + drawW} y1={startY} x2={innerX + innerW} y2={innerY} stroke="#334155" strokeWidth="0.8" />
        <line x1={startX} y1={startY + drawH} x2={innerX} y2={innerY + innerH} stroke="#334155" strokeWidth="0.8" />
        <line x1={startX + drawW} y1={startY + drawH} x2={innerX + innerW} y2={innerY + innerH} stroke="#334155" strokeWidth="0.8" />

        {/* Top-Left Bay: Exhaust Fan */}
        <rect x={innerX} y={innerY} width={fanPaneW} height={topPaneH} fill="#ffffff" stroke="#334155" strokeWidth="0.9" />
        <circle cx={fanCx} cy={fanCy} r={fanR} fill="#f8fafc" stroke="#2563eb" strokeWidth="1.2" />
        <circle cx={fanCx} cy={fanCy} r={fanR * 0.85} fill="none" stroke="#64748b" strokeWidth="0.7" />
        {[0, 72, 144, 216, 288].map((deg) => (
          <g key={deg} transform={`translate(${fanCx},${fanCy}) rotate(${deg})`}>
            <path
              d={`M 0,0 L ${fanR * 0.25},${-fanR * 0.8} A ${fanR * 0.82} ${fanR * 0.82} 0 0 1 ${fanR * 0.72},${-fanR * 0.35} Z`}
              fill="#cbd5e1"
              stroke="#334155"
              strokeWidth="0.7"
            />
          </g>
        ))}
        <circle cx={fanCx} cy={fanCy} r={Math.max(2.5, fanR * 0.22)} fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
        <line x1={fanCx - 4} y1={fanCy} x2={fanCx + 4} y2={fanCy} stroke="#334155" strokeWidth="0.6" />
        <line x1={fanCx} y1={fanCy - 4} x2={fanCx} y2={fanCy + 4} stroke="#334155" strokeWidth="0.6" />
        {!compact && (
          <g>
            <rect x={innerX + 3} y={innerY + 3} width={22} height={11} fill="#ffffff" stroke="#334155" strokeWidth="0.7" />
            <text x={innerX + 14} y={innerY + 11} textAnchor="middle" fontSize="7" fontWeight="700" fill="#0f172a">
              FAN
            </text>
            <circle cx={fanCx} cy={innerY + 9} r={5.5} fill="#ffffff" stroke="#334155" strokeWidth="0.7" />
            <text x={fanCx} y={innerY + 11.5} textAnchor="middle" fontSize="7" fontWeight="700" fill="#0f172a">
              2
            </text>
          </g>
        )}

        {/* Top-Right Bay: Fixed Glass */}
        <rect x={rightTopPaneX} y={innerY} width={rightTopPaneW} height={topPaneH} fill="#bfe6f7" stroke="#334155" strokeWidth="0.9" />
        {!compact && renderCrosshair(rightTopPaneX + rightTopPaneW / 2, innerY + topPaneH / 2, "3")}

        {/* Bottom Bay: Large Fixed Glass F1 */}
        <rect x={innerX} y={botPaneY} width={innerW} height={botPaneH} fill="#bfe6f7" stroke="#334155" strokeWidth="0.9" />
        {!compact && renderCrosshair(innerX + innerW / 2, botPaneY + botPaneH / 2, "1")}
        {!compact && (
          <g>
            <rect
              x={innerX + innerW - 22}
              y={botPaneY + botPaneH - 16}
              width={18}
              height={12}
              fill="#ffffff"
              stroke="#334155"
              strokeWidth="0.7"
            />
            <text
              x={innerX + innerW - 13}
              y={botPaneY + botPaneH - 7.5}
              textAnchor="middle"
              fontSize="7.5"
              fontWeight="700"
              fill="#0f172a"
            >
              F1
            </text>
          </g>
        )}

        {/* Vertical Mullion M1 & Horizontal Transom T1 */}
        <rect x={mullionX} y={innerY} width={barT} height={topPaneH} fill="#f1f5f9" stroke="#334155" strokeWidth="0.9" />
        <rect x={innerX} y={transomY} width={innerW} height={barT} fill="#f1f5f9" stroke="#334155" strokeWidth="0.9" />
        {!compact && (
          <g>
            <rect x={mullionX - 7} y={innerY + topPaneH / 2 - 6} width={barT + 14} height={12} fill="#ffffff" stroke="#334155" strokeWidth="0.7" />
            <text x={mullionX + barT / 2} y={innerY + topPaneH / 2 + 2.5} textAnchor="middle" fontSize="7" fontWeight="700" fill="#0f172a">
              M1
            </text>
            <rect x={innerX + innerW / 2 - 9} y={transomY - 3.5} width={18} height={barT + 7} fill="#ffffff" stroke="#334155" strokeWidth="0.7" />
            <text x={innerX + innerW / 2} y={transomY + barT / 2 + 2.5} textAnchor="middle" fontSize="7" fontWeight="700" fill="#0f172a">
              T1
            </text>
          </g>
        )}

        {/* Left Sub-Height & Total Height Dimensions */}
        {!compact ? (
          <g>
            {/* Inner sub-heights (topMm: Fan Height, bottomMm: Glass Height) */}
            <line x1={startX - 22} y1={startY + 3} x2={startX - 22} y2={transomY - 2} stroke="#64748b" strokeWidth="1" markerStart="url(#vf-arrow-start)" markerEnd="url(#vf-arrow-end)" />
            <rect x={startX - 48} y={startY + topH / 2 - 9} width={45} height={18} rx={3} fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <text x={startX - 25} y={startY + topH / 2 + 3} textAnchor="middle" fontSize="7.5" fontWeight="700" fontFamily="monospace" fill="#1e40af">
              Fan: {topMm}
            </text>

            <line x1={startX - 22} y1={transomY + barT + 2} x2={startX - 22} y2={startY + drawH - 3} stroke="#64748b" strokeWidth="1" markerStart="url(#vf-arrow-start)" markerEnd="url(#vf-arrow-end)" />
            <rect x={startX - 50} y={botPaneY + botPaneH / 2 - 9} width={47} height={18} rx={3} fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <text x={startX - 26} y={botPaneY + botPaneH / 2 + 3} textAnchor="middle" fontSize="7.5" fontWeight="700" fontFamily="monospace" fill="#0f766e">
              Glass: {bottomMm}
            </text>

            {/* Outer total height (safeH) */}
            <line x1={startX - 62} y1={startY + 3} x2={startX - 62} y2={startY + drawH - 3} stroke="#334155" strokeWidth="1.2" markerStart="url(#vf-arrow-start)" markerEnd="url(#vf-arrow-end)" />
            <rect x={startX - 86} y={startY + drawH / 2 - 10} width={50} height={20} rx={3} fill="#ffffff" stroke="#334155" strokeWidth="0.8" />
            <text x={startX - 61} y={startY + drawH / 2 + 3.5} textAnchor="middle" fontSize="8" fontWeight="800" fontFamily="monospace" fill="#0f172a">
              Tot: {safeH}
            </text>

            {/* Bottom inner sub-widths (fanMm, rightTopMm) */}
            <line x1={startX + 3} y1={startY + drawH + 16} x2={mullionX - 2} y2={startY + drawH + 16} stroke="#64748b" strokeWidth="1" markerStart="url(#vf-arrow-start)" markerEnd="url(#vf-arrow-end)" />
            <rect x={startX + fanW / 2 - 25} y={startY + drawH + 8} width={50} height={16} rx={3} fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <text x={startX + fanW / 2} y={startY + drawH + 19.5} textAnchor="middle" fontSize="7.5" fontWeight="700" fontFamily="monospace" fill="#1e40af">
              Fan: {fanMm}
            </text>

            <line x1={mullionX + barT + 2} y1={startY + drawH + 16} x2={startX + drawW - 3} y2={startY + drawH + 16} stroke="#64748b" strokeWidth="1" markerStart="url(#vf-arrow-start)" markerEnd="url(#vf-arrow-end)" />
            <rect x={rightTopPaneX + rightTopPaneW / 2 - 26} y={startY + drawH + 8} width={52} height={16} rx={3} fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <text x={rightTopPaneX + rightTopPaneW / 2} y={startY + drawH + 19.5} textAnchor="middle" fontSize="7.5" fontWeight="700" fontFamily="monospace" fill="#0f766e">
              Glass: {rightTopMm}
            </text>

            {/* Bottom outer total width (safeW) */}
            <line x1={startX + 3} y1={startY + drawH + 36} x2={startX + drawW - 3} y2={startY + drawH + 36} stroke="#334155" strokeWidth="1.2" markerStart="url(#vf-arrow-start)" markerEnd="url(#vf-arrow-end)" />
            <rect x={startX + drawW / 2 - 32} y={startY + drawH + 27} width={64} height={18} rx={3} fill="#ffffff" stroke="#334155" strokeWidth="0.8" />
            <text x={startX + drawW / 2} y={startY + drawH + 39} textAnchor="middle" fontSize="8.5" fontWeight="800" fontFamily="monospace" fill="#0f172a">
              Total W: {safeW} mm
            </text>
          </g>
        ) : (
          <g>
            <text x={startX + drawW / 2} y={startY + drawH + 15} textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#0f172a">
              {safeW} mm ({fanMm}+{rightTopMm})
            </text>
            <text x={startX - 14} y={startY + drawH / 2} textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#0f172a" transform={`rotate(-90 ${startX - 14} ${startY + drawH / 2})`}>
              {safeH} mm ({topMm}+{bottomMm})
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
