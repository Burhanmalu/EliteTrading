export type PanelKind =
  | "SLIDE_GLASS"
  | "SLIDE_MESH"
  | "FIXED"
  | "OPENABLE_LEFT"
  | "OPENABLE_RIGHT"
  | "TILT_TURN"
  | "TOP_HUNG"
  | "VENTILATION"
  | "FRENCH_DOOR"
  | "GLASS_PANEL"
  | "SHOWER_DOOR"
  | "CORNER_POST";

export type SlideDirection = "LEFT" | "RIGHT" | "BOTH" | "NONE";

export interface DrawingPanelConfig {
  id: string;
  label: string; // e.g., G, M, F, O, V, TT, TH, SD
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

export function getProductFrameDepthMm(
  trackInfo?: string | null,
  trackCount?: number,
  frameStyle?: string
): number {
  if (trackInfo) {
    const match = trackInfo.match(/(\d+)\s*(?:mm)?/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val >= 40 && val <= 300) return val;
    }
  }
  if (trackCount === 4) return 150;
  if (trackCount === 3) return 112;
  if (trackCount === 2) return 74;
  if (frameStyle === "FRAMELESS") return 45;
  if (frameStyle === "DOMAL") return 65;
  if (frameStyle === "METAL") return 50;
  return 60;
}

export const DRAWING_TYPE_LABELS: Record<string, string> = {
  // Infinity Metal
  FRENCH_DOOR: "Infinity Metal French Door (Grid)",
  FRENCH_DOUBLE_DOOR: "French Double Door (Grid)",
  FRENCH_SINGLE_DOOR: "French Single Door (Grid)",
  FRENCH_SLIDING_DOOR: "French Sliding Door (Grid)",
  FIXED_FRENCH_WINDOW: "Fixed French Window (Grid)",
  OPENABLE_FRENCH_WINDOW: "Openable French Window (Grid)",
  COMBINATION_DOOR_WINDOW: "Combination Door and Window",
  METAL_WINDOW: "Infinity Metal Window (Grid)",

  // uPVC Designs
  SLIDING_2_TRACK: "2 Track Sliding System",
  SLIDING_2_TRACK_WINDOW: "2 Track Sliding Window",
  SLIDING_2_TRACK_DOOR: "2 Track Sliding Door",
  SLIDING_3_TRACK_WINDOW: "3 Track Sliding Window",
  SLIDING_3_TRACK_DOOR: "3 Track Sliding Door",
  SD_3_TRACK: "SD 3 Track Door/Window",
  SLIDING_3_TRACK_2G1M: "3 Track – 2 Glass 1 Mesh",
  SLIDING_4_TRACK_WINDOW: "4 Track Sliding Window",
  SLIDING_4_TRACK_DOOR: "4 Track Sliding Door",
  FIXED_WINDOW: "Fixed Window",
  OPENABLE_WINDOW: "Openable Window",
  CASEMENT_WINDOW: "Casement Window",
  TILT_TURN_WINDOW: "Tilt and Turn Window",
  TOP_HUNG_WINDOW: "Top Hung Window",
  COMBINATION_WINDOW: "Combination Window",
  L_TYPE_FIXED_3_TRACK: "L-Type Fixed 3 Track",
  OPENABLE_FIXED: "Openable – Fixed Combination",
  VENTILATION: "Ventilation Window (Louvers + Glass)",
  VENTILATION_WINDOW: "Ventilation Window",
  VENTILATION_FAN: "Ventilation with Fan (Fan + Glass Sections)",
  SLIDING_DOOR_MESH: "Sliding Door with Mesh",
  SLIDING_WINDOW_MESH: "Sliding Window with Mesh",
  LIFT_SLIDE_DOOR: "Lift and Slide Door",
  CORNER_SLIDING_WINDOW: "Corner Sliding Window",

  // Aluminium Systems
  ALU_SLIDING_WINDOW: "Aluminium Sliding Window",
  ALU_SLIDING_DOOR: "Aluminium Sliding Door",
  ALU_CASEMENT_WINDOW: "Aluminium Casement Window",
  ALU_FIXED_WINDOW: "Aluminium Fixed Window",
  ALU_OPENABLE_WINDOW: "Aluminium Openable Window",
  ALUMINIUM_PARTITION: "Aluminium Partition",
  ALU_FRENCH_DOOR: "Aluminium French Door",
  ALU_COMBINATION_WINDOW: "Aluminium Combination Window",
  OPENABLE_CASEMENT: "Openable Casement Window",

  // Domal Systems
  DOMAL_SLIDING_WINDOW: "Domal Sliding Window",
  DOMAL_SLIDING_DOOR: "Domal Sliding Door",
  DOMAL_FIXED_WINDOW: "Domal Fixed Window",
  DOMAL_OPENABLE_WINDOW: "Domal Openable Window",
  DOMAL_PARTITION: "Domal Partition",
  DOMAL_COMBINATION_WINDOW: "Domal Combination Window",

  // Glass Partitions
  FIXED_GLASS_PARTITION: "Fixed Glass Partition",
  SLIDING_GLASS_PARTITION: "Sliding Glass Partition",
  FRAMELESS_GLASS: "Frameless Glass Partition",
  FRAMELESS_GLASS_PARTITION: "Frameless Glass Partition",
  ALU_FRAME_GLASS_PARTITION: "Aluminium Frame Glass Partition",
  OFFICE_GLASS_PARTITION: "Office Glass Partition",
  TOUGHENED_GLASS_PARTITION: "Toughened Glass Partition",
  SHOWER_GLASS_PARTITION: "Shower Glass Partition",
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
    // ----------------- INFINITY METAL -----------------
    case "FRENCH_DOOR":
    case "FRENCH_DOUBLE_DOOR":
      return {
        viewSide: "INSIDE",
        frameStyle: "METAL",
        trackCount: 1,
        frameDepthMm: 50,
        panels: [
          mkPanel(1, "FD-L", "FRENCH_DOOR", 0.5, "LEFT", 4, 2),
          mkPanel(2, "FD-R", "FRENCH_DOOR", 0.5, "RIGHT", 4, 2),
        ],
      };
    case "FRENCH_SINGLE_DOOR":
      return {
        viewSide: "INSIDE",
        frameStyle: "METAL",
        trackCount: 1,
        frameDepthMm: 50,
        panels: [mkPanel(1, "FD", "FRENCH_DOOR", 1.0, "LEFT", 4, 2)],
      };
    case "FRENCH_SLIDING_DOOR":
      return {
        viewSide: "INSIDE",
        frameStyle: "METAL",
        trackCount: 2,
        frameDepthMm: 75,
        panels: [
          mkPanel(1, "FSL-1", "FRENCH_DOOR", 0.5, "RIGHT", 4, 2),
          mkPanel(2, "FSL-2", "FRENCH_DOOR", 0.5, "LEFT", 4, 2),
        ],
      };
    case "FIXED_FRENCH_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: "METAL",
        trackCount: 1,
        frameDepthMm: 50,
        panels: [
          mkPanel(1, "FFW-1", "FRENCH_DOOR", 0.5, "NONE", 3, 2),
          mkPanel(2, "FFW-2", "FRENCH_DOOR", 0.5, "NONE", 3, 2),
        ],
      };
    case "OPENABLE_FRENCH_WINDOW":
    case "METAL_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: "METAL",
        trackCount: 1,
        frameDepthMm: 50,
        panels: [
          mkPanel(1, "F", "FRENCH_DOOR", 0.34, "NONE", 3, 1),
          mkPanel(2, "O", "OPENABLE_LEFT", 0.33, "LEFT", 3, 1),
          mkPanel(3, "F", "FRENCH_DOOR", 0.33, "NONE", 3, 1),
        ],
      };
    case "COMBINATION_DOOR_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: "METAL",
        trackCount: 1,
        frameDepthMm: 60,
        panels: [
          mkPanel(1, "W", "OPENABLE_LEFT", 0.35, "NONE", 3, 1),
          mkPanel(2, "D", "FRENCH_DOOR", 0.65, "LEFT", 4, 2),
        ],
      };

    // ----------------- uPVC & SLIDING -----------------
    case "SLIDING_2_TRACK":
    case "SLIDING_2_TRACK_WINDOW":
    case "SLIDING_2_TRACK_DOOR":
    case "ALU_SLIDING_WINDOW":
    case "DOMAL_SLIDING_WINDOW":
      return {
        viewSide: "INSIDE",
        trackCount: 2,
        frameDepthMm: 74,
        frameStyle: drawingType.startsWith("ALU")
          ? "ALUMINIUM"
          : drawingType.startsWith("DOM")
          ? "DOMAL"
          : "UPVC",
        panels: [
          mkPanel(1, "G1", "SLIDE_GLASS", 0.5, "RIGHT"),
          mkPanel(2, "G2", "SLIDE_GLASS", 0.5, "LEFT"),
        ],
      };
    case "SLIDING_3_TRACK_DOOR":
    case "SD_3_TRACK":
    case "SLIDING_3_TRACK_WINDOW":
    case "ALU_SLIDING_DOOR":
    case "DOMAL_SLIDING_DOOR":
      return {
        viewSide: "INSIDE",
        trackCount: 3,
        frameDepthMm: 112,
        frameStyle: drawingType.startsWith("ALU")
          ? "ALUMINIUM"
          : drawingType.startsWith("DOM")
          ? "DOMAL"
          : "UPVC",
        panels: [
          mkPanel(1, "G1", "SLIDE_GLASS", 0.334, "RIGHT"),
          mkPanel(2, "G2", "SLIDE_GLASS", 0.333, "BOTH"),
          mkPanel(3, "G3", "SLIDE_GLASS", 0.333, "LEFT"),
        ],
      };
    case "SLIDING_3_TRACK_2G1M":
    case "SLIDING_DOOR_MESH":
    case "SLIDING_WINDOW_MESH":
      return {
        viewSide: "INSIDE",
        trackCount: 3,
        frameDepthMm: 112,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "G1", "SLIDE_GLASS", 0.334, "RIGHT"),
          mkPanel(2, "G2", "SLIDE_GLASS", 0.333, "LEFT"),
          mkPanel(3, "M", "SLIDE_MESH", 0.333, "LEFT"),
        ],
      };
    case "SLIDING_4_TRACK_WINDOW":
    case "SLIDING_4_TRACK_DOOR":
      return {
        viewSide: "INSIDE",
        trackCount: 4,
        frameDepthMm: 150,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "G1", "SLIDE_GLASS", 0.25, "RIGHT"),
          mkPanel(2, "G2", "SLIDE_GLASS", 0.25, "RIGHT"),
          mkPanel(3, "G3", "SLIDE_GLASS", 0.25, "LEFT"),
          mkPanel(4, "M", "SLIDE_MESH", 0.25, "LEFT"),
        ],
      };
    case "LIFT_SLIDE_DOOR":
      return {
        viewSide: "INSIDE",
        trackCount: 2,
        frameDepthMm: 140,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "FIXED", "FIXED", 0.5, "NONE"),
          mkPanel(2, "LIFT-SLIDE", "SLIDE_GLASS", 0.5, "LEFT"),
        ],
      };
    case "CORNER_SLIDING_WINDOW":
      return {
        viewSide: "INSIDE",
        trackCount: 2,
        frameDepthMm: 80,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "G1", "SLIDE_GLASS", 0.45, "RIGHT"),
          mkPanel(2, "POST", "CORNER_POST", 0.1, "NONE"),
          mkPanel(3, "G2", "SLIDE_GLASS", 0.45, "LEFT"),
        ],
      };

    // ----------------- CASEMENT & OPENABLE -----------------
    case "CASEMENT_WINDOW":
    case "OPENABLE_CASEMENT":
    case "ALU_CASEMENT_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: drawingType.startsWith("ALU") ? "ALUMINIUM" : "UPVC",
        trackCount: 1,
        frameDepthMm: 60,
        panels: [
          mkPanel(1, "O-L", "OPENABLE_LEFT", 0.5, "NONE"),
          mkPanel(2, "O-R", "OPENABLE_RIGHT", 0.5, "NONE"),
        ],
      };
    case "OPENABLE_WINDOW":
    case "ALU_OPENABLE_WINDOW":
    case "DOMAL_OPENABLE_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: drawingType.startsWith("ALU")
          ? "ALUMINIUM"
          : drawingType.startsWith("DOM")
          ? "DOMAL"
          : "UPVC",
        trackCount: 1,
        frameDepthMm: 60,
        panels: [mkPanel(1, "O", "OPENABLE_LEFT", 1.0, "NONE")],
      };
    case "TILT_TURN_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        trackCount: 1,
        frameDepthMm: 68,
        panels: [mkPanel(1, "TT", "TILT_TURN", 1.0, "NONE")],
      };
    case "TOP_HUNG_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        trackCount: 1,
        frameDepthMm: 60,
        panels: [mkPanel(1, "TH", "TOP_HUNG", 1.0, "NONE")],
      };

    // ----------------- FIXED & COMBINATIONS -----------------
    case "FIXED_WINDOW":
    case "ALU_FIXED_WINDOW":
    case "DOMAL_FIXED_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: drawingType.startsWith("ALU")
          ? "ALUMINIUM"
          : drawingType.startsWith("DOM")
          ? "DOMAL"
          : "UPVC",
        trackCount: 1,
        frameDepthMm: 60,
        panels: [mkPanel(1, "F", "FIXED", 1.0, "NONE")],
      };
    case "OPENABLE_FIXED":
      return {
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        trackCount: 1,
        frameDepthMm: 60,
        panels: [
          mkPanel(1, "O", "OPENABLE_LEFT", 0.5, "NONE"),
          mkPanel(2, "F", "FIXED", 0.5, "NONE"),
        ],
      };
    case "COMBINATION_WINDOW":
    case "ALU_COMBINATION_WINDOW":
    case "DOMAL_COMBINATION_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: drawingType.startsWith("ALU")
          ? "ALUMINIUM"
          : drawingType.startsWith("DOM")
          ? "DOMAL"
          : "UPVC",
        trackCount: 1,
        frameDepthMm: 60,
        panels: [
          mkPanel(1, "F", "FIXED", 0.33, "NONE"),
          mkPanel(2, "O", "OPENABLE_LEFT", 0.34, "NONE"),
          mkPanel(3, "F", "FIXED", 0.33, "NONE"),
        ],
      };
    case "L_TYPE_FIXED_3_TRACK":
      return {
        viewSide: "INSIDE",
        trackCount: 3,
        isLType: true,
        frameDepthMm: 112,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "F", "FIXED", 0.25, "NONE"),
          mkPanel(2, "G1", "SLIDE_GLASS", 0.25, "RIGHT"),
          mkPanel(3, "G2", "SLIDE_GLASS", 0.25, "BOTH"),
          mkPanel(4, "M", "SLIDE_MESH", 0.25, "LEFT"),
        ],
      };

    // ----------------- VENTILATION -----------------
    case "VENTILATION":
    case "VENTILATION_WINDOW":
      return {
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        trackCount: 1,
        frameDepthMm: 60,
        panels: [
          mkPanel(1, "LOUVER", "VENTILATION", 0.5, "NONE", 6),
          mkPanel(2, "FIXED", "FIXED", 0.5, "NONE"),
        ],
      };
    case "VENTILATION_FAN":
      return {
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        trackCount: 1,
        frameDepthMm: 60,
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

    // ----------------- ALUMINIUM & DOMAL FRENCH / PARTITIONS -----------------
    case "ALU_FRENCH_DOOR":
      return {
        viewSide: "INSIDE",
        frameStyle: "ALUMINIUM",
        trackCount: 1,
        frameDepthMm: 65,
        panels: [
          mkPanel(1, "AFD-1", "FRENCH_DOOR", 0.5, "LEFT", 3, 2),
          mkPanel(2, "AFD-2", "FRENCH_DOOR", 0.5, "RIGHT", 3, 2),
        ],
      };
    case "ALUMINIUM_PARTITION":
    case "DOMAL_PARTITION":
    case "ALU_FRAME_GLASS_PARTITION":
    case "OFFICE_GLASS_PARTITION":
      return {
        viewSide: "INSIDE",
        frameStyle: drawingType.includes("DOMAL") ? "DOMAL" : "ALUMINIUM",
        trackCount: 1,
        frameDepthMm: 65,
        panels: [
          mkPanel(1, "G1", "GLASS_PANEL", 0.34, "NONE"),
          mkPanel(2, "DOOR", "OPENABLE_LEFT", 0.33, "NONE"),
          mkPanel(3, "G2", "GLASS_PANEL", 0.33, "NONE"),
        ],
      };

    // ----------------- GLASS PARTITIONS -----------------
    case "FIXED_GLASS_PARTITION":
    case "TOUGHENED_GLASS_PARTITION":
      return {
        viewSide: "INSIDE",
        frameStyle: "FRAMELESS",
        trackCount: 1,
        frameDepthMm: 45,
        panels: [
          mkPanel(1, "G1", "GLASS_PANEL", 0.5, "NONE"),
          mkPanel(2, "G2", "GLASS_PANEL", 0.5, "NONE"),
        ],
      };
    case "FRAMELESS_GLASS":
    case "FRAMELESS_GLASS_PARTITION":
      return {
        viewSide: "INSIDE",
        frameStyle: "FRAMELESS",
        trackCount: 1,
        frameDepthMm: 45,
        panels: [
          mkPanel(1, "G1", "GLASS_PANEL", 0.34, "NONE"),
          mkPanel(2, "G2", "GLASS_PANEL", 0.33, "NONE"),
          mkPanel(3, "G3", "GLASS_PANEL", 0.33, "NONE"),
        ],
      };
    case "SLIDING_GLASS_PARTITION":
      return {
        viewSide: "INSIDE",
        frameStyle: "FRAMELESS",
        trackCount: 2,
        frameDepthMm: 60,
        panels: [
          mkPanel(1, "F1", "GLASS_PANEL", 0.33, "NONE"),
          mkPanel(2, "SLIDE", "SLIDE_GLASS", 0.34, "RIGHT"),
          mkPanel(3, "F2", "GLASS_PANEL", 0.33, "NONE"),
        ],
      };
    case "SHOWER_GLASS_PARTITION":
      return {
        viewSide: "INSIDE",
        frameStyle: "FRAMELESS",
        trackCount: 1,
        frameDepthMm: 45,
        panels: [
          mkPanel(1, "FIXED", "GLASS_PANEL", 0.45, "NONE"),
          mkPanel(2, "DOOR", "SHOWER_DOOR", 0.55, "RIGHT"),
        ],
      };

    default:
      return {
        viewSide: "INSIDE",
        trackCount: 3,
        frameDepthMm: 112,
        frameStyle: "UPVC",
        panels: [
          mkPanel(1, "G1", "SLIDE_GLASS", 0.334, "RIGHT"),
          mkPanel(2, "G2", "SLIDE_GLASS", 0.333, "LEFT"),
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
  if (
    drawingType === "VENTILATION" ||
    drawingType === "VENTILATION_WINDOW" ||
    drawingType === "VENTILATION_FAN"
  )
    return true;
  if (name && /ventilation/i.test(name)) return true;
  return false;
}
