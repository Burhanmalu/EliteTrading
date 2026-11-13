export type PanelKind =
  | "SLIDE_GLASS"
  | "SLIDE_MESH"
  | "FIXED"
  | "OPENABLE_LEFT"
  | "OPENABLE_RIGHT"
  | "VENTILATION"
  | "FRENCH_DOOR"
  | "GLASS_PANEL";

export type SlideDirection = "LEFT" | "RIGHT" | "BOTH" | "NONE";

export interface DrawingPanelConfig {
  id: string;
  label: string; // e.g., G, M, F, O, V
  kind: PanelKind;
  widthRatio: number; // relative or mm
  widthMm?: number;
  slideDirection?: SlideDirection;
  rows?: number; // for French doors or louvers
  cols?: number;
}

export interface DrawingConfig {
  panels: DrawingPanelConfig[];
  viewSide: "INSIDE" | "OUTSIDE";
  trackCount?: number;
  frameDepthMm?: number;
  isLType?: boolean;
  frameStyle?: "UPVC" | "METAL" | "ALUMINIUM" | "DOMAL" | "FRAMELESS";
  topHeightMm?: number;
  bottomHeightMm?: number;
  fanWidthMm?: number;
  glassWidthMm?: number;
  linkWidths?: boolean;
  hasSectionDimensions?: boolean;
  showTopView?: boolean;
}

export function getProductFrameDepthMm(trackInfo?: string | null, trackCount?: number): number {
  if (trackInfo) {
    const match = trackInfo.match(/(\d+)\s*(?:mm)?/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val >= 40 && val <= 250) return val;
    }
  }
  if (trackCount === 3) return 112;
  if (trackCount === 2) return 74;
  return 60;
}

export const DRAWING_TYPE_LABELS: Record<string, string> = {
  FRENCH_DOOR: "Infinity Metal French Door (Grid)",
  METAL_WINDOW: "Infinity Metal Window (Grid)",
  SLIDING_3_TRACK_DOOR: "3 Track Sliding Door",
  VENTILATION: "Ventilation (Fan + Glass Sections)",
  VENTILATION_FAN: "Ventilation (Fan + Glass Sections)",
  SLIDING_3_TRACK_2G1M: "3 Track – 2 Glass 1 Mesh",
  SD_3_TRACK: "SD 3 Track Door/Window",
  SLIDING_3_TRACK_WINDOW: "3 Track Sliding Window",
  L_TYPE_FIXED_3_TRACK: "L-Type Fixed + 3 Track",
  OPENABLE_FIXED: "Openable + Fixed Combination",
  FIXED_WINDOW: "Fixed Glass Window",
  SLIDING_2_TRACK: "2 Track Sliding System",
  OPENABLE_CASEMENT: "Openable Casement Window",
  ALUMINIUM_PARTITION: "Aluminium Frame Partition",
  FRAMELESS_GLASS: "Frameless Glass Partition",
  SLIDING_GLASS_PARTITION: "Sliding Glass Partition",
};

export function getDefaultDrawingConfig(
  drawingType: string,
  totalWidthMm = 1800
): DrawingConfig {
  const mkPanel = (
    idx: number,
    label: string,
    kind: PanelKind,
    ratio: number,
    slideDirection: SlideDirection = "NONE",
    rows = 1,
    cols = 1
  ): DrawingPanelConfig => ({
    id: `p-${idx}`,
    label,
    kind,
    widthRatio: ratio,
    widthMm: Math.round(totalWidthMm * ratio),
    slideDirection,
    rows,
    cols,
  });

  switch (drawingType) {
    case "FRENCH_DOOR":
      return {
        viewSide: "INSIDE",
        frameStyle: "METAL",
        panels: [
          mkPanel(1, "FD", "FRENCH_DOOR", 0.5, "LEFT", 4, 2),
          mkPanel(2, "FD", "FRENCH_DOOR", 0.5, "RIGHT", 4, 2),
        ],
      };
    case "METAL_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: "METAL",
        panels: [
          mkPanel(1, "F", "FRENCH_DOOR", 0.34, "NONE", 3, 1),
          mkPanel(2, "O", "OPENABLE_LEFT", 0.33, "LEFT", 3, 1),
          mkPanel(3, "F", "FRENCH_DOOR", 0.33, "NONE", 3, 1),
        ],
      };
    case "SLIDING_3_TRACK_DOOR":
    case "SD_3_TRACK":
    case "SLIDING_3_TRACK_WINDOW":
      return {
        viewSide: "INSIDE",
        trackCount: 3,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "G", "SLIDE_GLASS", 0.334, "RIGHT"),
          mkPanel(2, "G", "SLIDE_GLASS", 0.333, "BOTH"),
          mkPanel(3, "G", "SLIDE_GLASS", 0.333, "LEFT"),
        ],
      };
    case "SLIDING_3_TRACK_2G1M":
      return {
        viewSide: "INSIDE",
        trackCount: 3,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "G", "SLIDE_GLASS", 0.334, "RIGHT"),
          mkPanel(2, "G", "SLIDE_GLASS", 0.333, "LEFT"),
          mkPanel(3, "M", "SLIDE_MESH", 0.333, "LEFT"),
        ],
      };
    case "VENTILATION":
    case "VENTILATION_FAN":
      return {
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        topHeightMm: 450,
        bottomHeightMm: 1700,
        fanWidthMm: 400,
        glassWidthMm: 400,
        linkWidths: true,
        hasSectionDimensions: true,
        panels: [
          mkPanel(1, "FAN", "VENTILATION", 0.5, "NONE"),
          mkPanel(2, "F", "FIXED", 0.5, "NONE"),
        ],
      };
    case "L_TYPE_FIXED_3_TRACK":
      return {
        viewSide: "INSIDE",
        trackCount: 3,
        isLType: true,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "F", "FIXED", 0.25, "NONE"),
          mkPanel(2, "G", "SLIDE_GLASS", 0.25, "RIGHT"),
          mkPanel(3, "G", "SLIDE_GLASS", 0.25, "BOTH"),
          mkPanel(4, "M", "SLIDE_MESH", 0.25, "LEFT"),
        ],
      };
    case "OPENABLE_FIXED":
      return {
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "O", "OPENABLE_LEFT", 0.5, "NONE"),
          mkPanel(2, "F", "FIXED", 0.5, "NONE"),
        ],
      };
    case "OPENABLE_CASEMENT":
      return {
        viewSide: "INSIDE",
        frameStyle: "ALUMINIUM",
        panels: [
          mkPanel(1, "O", "OPENABLE_LEFT", 0.5, "NONE"),
          mkPanel(2, "O", "OPENABLE_RIGHT", 0.5, "NONE"),
        ],
      };
    case "FIXED_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        panels: [mkPanel(1, "F", "FIXED", 1, "NONE")],
      };
    case "SLIDING_2_TRACK":
      return {
        viewSide: "INSIDE",
        trackCount: 2,
        frameStyle: "ALUMINIUM",
        panels: [
          mkPanel(1, "G", "SLIDE_GLASS", 0.5, "RIGHT"),
          mkPanel(2, "G", "SLIDE_GLASS", 0.5, "LEFT"),
        ],
      };
    case "ALUMINIUM_PARTITION":
      return {
        viewSide: "INSIDE",
        frameStyle: "ALUMINIUM",
        panels: [
          mkPanel(1, "G", "GLASS_PANEL", 0.34, "NONE"),
          mkPanel(2, "D", "OPENABLE_LEFT", 0.33, "NONE"),
          mkPanel(3, "G", "GLASS_PANEL", 0.33, "NONE"),
        ],
      };
    case "FRAMELESS_GLASS":
      return {
        viewSide: "INSIDE",
        frameStyle: "FRAMELESS",
        panels: [
          mkPanel(1, "G", "GLASS_PANEL", 0.34, "NONE"),
          mkPanel(2, "G", "GLASS_PANEL", 0.33, "NONE"),
          mkPanel(3, "G", "GLASS_PANEL", 0.33, "NONE"),
        ],
      };
    case "SLIDING_GLASS_PARTITION":
      return {
        viewSide: "INSIDE",
        frameStyle: "FRAMELESS",
        panels: [
          mkPanel(1, "F", "GLASS_PANEL", 0.33, "NONE"),
          mkPanel(2, "G", "SLIDE_GLASS", 0.34, "RIGHT"),
          mkPanel(3, "F", "GLASS_PANEL", 0.33, "NONE"),
        ],
      };
    default:
      return {
        viewSide: "INSIDE",
        trackCount: 3,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "G", "SLIDE_GLASS", 0.334, "RIGHT"),
          mkPanel(2, "G", "SLIDE_GLASS", 0.333, "LEFT"),
          mkPanel(3, "M", "SLIDE_MESH", 0.333, "LEFT"),
        ],
      };
  }
}

export function parseDrawingConfig(
  jsonStr: string | null | undefined,
  drawingType: string,
  widthMm: number
): DrawingConfig {
  if (jsonStr && jsonStr !== "{}") {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.panels) && parsed.panels.length > 0) {
        return parsed as DrawingConfig;
      }
    } catch {
      // fallback to default
    }
  }
  return getDefaultDrawingConfig(drawingType, widthMm);
}

export function computeVentilationFanMetrics(
  widthMm: number,
  heightMm: number,
  config?: DrawingConfig | null
) {
  const safeW = Math.max(200, Number(widthMm) || 800);
  const safeH = Math.max(300, Number(heightMm) || 2150);

  // Fan Height (Top section)
  const topMm =
    config?.topHeightMm && config.topHeightMm >= 50
      ? Math.round(config.topHeightMm)
      : Math.min(650, Math.max(200, Math.round(safeH * 0.25)));

  // Glass Height (Bottom section)
  const bottomMm =
    config?.bottomHeightMm && config.bottomHeightMm >= 50
      ? Math.round(config.bottomHeightMm)
      : Math.max(150, safeH - topMm);

  // Fan Width (Top left section)
  const fanMm =
    config?.fanWidthMm && config.fanWidthMm >= 50
      ? Math.round(config.fanWidthMm)
      : Math.min(topMm, Math.round(safeW * 0.5));

  // Glass Width (Top right section)
  const rightTopMm =
    config?.glassWidthMm && config.glassWidthMm >= 50
      ? Math.round(config.glassWidthMm)
      : Math.max(100, safeW - fanMm);

  return {
    safeW,
    safeH,
    topMm,
    bottomMm,
    fanMm,
    rightTopMm,
    linkWidths: config?.linkWidths ?? true,
  };
}

export function isVentilationProduct(
  drawingType?: string | null,
  name?: string | null,
  config?: DrawingConfig | null
): boolean {
  if (config?.hasSectionDimensions) return true;
  if (drawingType === "VENTILATION" || drawingType === "VENTILATION_FAN") return true;
  if (name && /ventilation/i.test(name)) return true;
  return false;
}

