"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Save,
  Send,
  Layers,
  Sliders,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  calculateSqFt,
  calculateQuotationTotals,
  formatINR,
  formatNumber,
} from "@/lib/format";
import {
  DrawingConfig,
  DrawingPanelConfig,
  PanelKind,
  SlideDirection,
  getDefaultDrawingConfig,
  parseDrawingConfig,
  computeVentilationFanMetrics,
  isVentilationProduct,
} from "@/lib/drawing-types";
import { TechnicalDrawingSvg } from "./TechnicalDrawingSvg";
import {
  ProductCatalogueModal,
  CatalogueCategory,
  CatalogueBrand,
  CatalogueProduct,
} from "./ProductCatalogueModal";

interface CustomerItem {
  id: string;
  customerCode: string;
  name: string;
  contactPerson: string;
  mobile: string;
  email?: string;
  billingAddress: string;
  city?: string;
  gstNumber?: string;
}

interface ProjectItem {
  id: string;
  projectCode: string;
  name: string;
  customerId: string;
  siteName: string;
  siteAddress: string;
}

interface MasterOptionItem {
  id: string;
  optionType: string;
  name: string;
}

export interface ComponentDraft {
  localId: string;
  code: string;
  name: string;
  location: string;
  productId?: string | null;
  categoryName: string;
  brandName?: string | null;
  widthMm: number;
  heightMm: number;
  quantity: number;
  sqFtPerUnit: number;
  ratePerSqFt: number;
  unitPrice: number;
  totalValue: number;
  isPriceOverridden: boolean;
  overrideReason?: string;
  drawingType: string;
  drawingConfig: DrawingConfig;
  customImageUrl?: string | null;
  showUpvcFields: boolean;
  profileSystem: string;
  glassType: string;
  profileColour: string;
  meshType: string;
  track: string;
  trackRi: string;
  slidingSash: string;
  slidingSashRi: string;
  flymeshSash: string;
  mullionRi: string;
  locking: string;
  handleColour: string;
  handleType: string;
  lockableEspag: string;
  rollerType: string;
  additionalAccess: string;
  remarks: string;
  rawWidth?: string;
  rawHeight?: string;
  rawQuantity?: string;
  rawOverallWidth?: string;
  rawOverallHeight?: string;
  rawFanWidth?: string;
  rawFanHeight?: string;
  rawGlassWidth?: string;
  rawGlassHeight?: string;
}

interface QuotationBuilderProps {
  quotationId?: string;
  initialQuotation?: Record<string, unknown> | null;
  defaultSalesperson: string;
}

export function QuotationBuilder({
  quotationId,
  initialQuotation,
  defaultSalesperson,
}: QuotationBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [brands, setBrands] = useState<CatalogueBrand[]>([]);
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [masterOptions, setMasterOptions] = useState<MasterOptionItem[]>([]);

  // Form header state
  const [customerId, setCustomerId] = useState<string>(
    (initialQuotation?.customerId as string) || searchParams.get("customerId") || ""
  );
  const [projectId, setProjectId] = useState<string>(
    (initialQuotation?.projectId as string) || searchParams.get("projectId") || ""
  );
  const [siteName, setSiteName] = useState<string>(
    (initialQuotation?.siteName as string) || ""
  );
  const [siteLocation, setSiteLocation] = useState<string>(
    (initialQuotation?.siteLocation as string) || ""
  );
  const [siteContactPerson, setSiteContactPerson] = useState<string>(
    (initialQuotation?.siteContactPerson as string) || ""
  );
  const [siteContactNumber, setSiteContactNumber] = useState<string>(
    (initialQuotation?.siteContactNumber as string) || ""
  );
  const [quotationDate, setQuotationDate] = useState<string>(
    initialQuotation?.quotationDate
      ? String(initialQuotation.quotationDate).slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [quotationNumber, setQuotationNumber] = useState<string>(
    (initialQuotation?.quotationNumber as string) || ""
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(
    (initialQuotation?.referenceNumber as string) || ""
  );
  const [salesperson, setSalesperson] = useState<string>(
    (initialQuotation?.salesperson as string) || defaultSalesperson
  );
  const [status, setStatus] = useState<string>(
    (initialQuotation?.status as string) || "Draft"
  );
  const [remarks, setRemarks] = useState<string>(
    (initialQuotation?.remarks as string) || ""
  );

  // Summary / Tax / Charges state
  const [gstPercent, setGstPercent] = useState<number>(
    initialQuotation?.gstPercent !== undefined ? Number(initialQuotation.gstPercent) : 18
  );
  const [taxTreatment, setTaxTreatment] = useState<string>(
    (initialQuotation?.taxTreatment as string) || "EXCLUSIVE"
  );
  const [discountType, setDiscountType] = useState<string>(
    (initialQuotation?.discountType as string) || "PERCENT"
  );
  const [discountValue, setDiscountValue] = useState<number>(
    Number(initialQuotation?.discountValue || 0)
  );
  const [transportCharges, setTransportCharges] = useState<number>(
    Number(initialQuotation?.transportCharges || 0)
  );
  const [installationCharges, setInstallationCharges] = useState<number>(
    Number(initialQuotation?.installationCharges || 0)
  );
  const [otherCharges, setOtherCharges] = useState<number>(
    Number(initialQuotation?.otherCharges || 0)
  );
  const [termsText, setTermsText] = useState<string>(
    (initialQuotation?.termsText as string) ||
      "General Terms and Conditions as per official Elite Trading 20-point policy apply (refer to the General Terms and Conditions section in the quotation document)."
  );

  // Components
  const [components, setComponents] = useState<ComponentDraft[]>(() => {
    if (Array.isArray(initialQuotation?.components)) {
      return (initialQuotation.components as Array<Record<string, unknown>>).map((c, idx) => ({
        localId: String(c.id || `comp-${idx}-${Date.now()}`),
        code: String(c.code || `W${idx + 1}`),
        name: String(c.name || ""),
        location: String(c.location || ""),
        productId: (c.productId as string) || null,
        categoryName: String(c.categoryName || ""),
        brandName: (c.brandName as string) || null,
        widthMm: Number(c.widthMm) || 1800,
        heightMm: Number(c.heightMm) || 1500,
        quantity: Number(c.quantity) || 1,
        sqFtPerUnit: Number(c.sqFtPerUnit) || 0,
        ratePerSqFt: Number(c.ratePerSqFt) || 550,
        unitPrice: Number(c.unitPrice) || 0,
        totalValue: Number(c.totalValue) || 0,
        isPriceOverridden: Boolean(c.isPriceOverridden),
        overrideReason: String(c.overrideReason || ""),
        drawingType: String(c.drawingType || "SLIDING_3_TRACK_WINDOW"),
        drawingConfig: parseDrawingConfig(
          String(c.drawingConfigJson || "{}"),
          String(c.drawingType || "SLIDING_3_TRACK_WINDOW"),
          Number(c.widthMm) || 1800
        ),
        customImageUrl: (c.customImageUrl as string) || null,
        showUpvcFields: Boolean(c.showUpvcFields),
        profileSystem: String(c.profileSystem || ""),
        glassType: String(c.glassType || ""),
        profileColour: String(c.profileColour || ""),
        meshType: String(c.meshType || ""),
        track: String(c.track || ""),
        trackRi: String(c.trackRi || ""),
        slidingSash: String(c.slidingSash || ""),
        slidingSashRi: String(c.slidingSashRi || ""),
        flymeshSash: String(c.flymeshSash || ""),
        mullionRi: String(c.mullionRi || ""),
        locking: String(c.locking || ""),
        handleColour: String(c.handleColour || ""),
        handleType: String(c.handleType || ""),
        lockableEspag: String(c.lockableEspag || ""),
        rollerType: String(c.rollerType || ""),
        additionalAccess: String(c.additionalAccess || ""),
        remarks: String(c.remarks || ""),
      }));
    }
    return [];
  });

  // Catalogue Modal State
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [expandedPanelEditor, setExpandedPanelEditor] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?pageSize=100").then((r) => r.json()),
      fetch("/api/projects?pageSize=100").then((r) => r.json()),
      fetch("/api/catalogue").then((r) => r.json()),
    ]).then(([custData, projData, catData]) => {
      setCustomers(custData.items || []);
      setProjects(projData.items || []);
      setCategories(catData.categories || []);
      setBrands(catData.brands || []);
      setProducts(catData.products || []);
      setMasterOptions(catData.masterOptions || []);
    });
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerProjects = projects.filter(
    (p) => !customerId || p.customerId === customerId
  );

  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const cust = customers.find((c) => c.id === newCustId);
    if (cust) {
      if (!siteLocation) setSiteLocation(cust.billingAddress || "");
      if (!siteContactPerson) setSiteContactPerson(cust.contactPerson || cust.name || "");
      if (!siteContactNumber) setSiteContactNumber(cust.mobile || "");
      if (!siteName) setSiteName(`${cust.name} Residence / Site`);
    }
  };

  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    const proj = projects.find((p) => p.id === newProjId);
    if (proj) {
      setSiteLocation(proj.siteAddress);
      if (!customerId) setCustomerId(proj.customerId);
    }
  };

  const recalcComponent = (comp: ComponentDraft): ComponentDraft => {
    const sqFtPerUnit = calculateSqFt(comp.widthMm, comp.heightMm);
    const unitPrice = comp.isPriceOverridden
      ? Number(comp.unitPrice || 0)
      : Number((sqFtPerUnit * (comp.ratePerSqFt || 0)).toFixed(2));
    const totalValue = Number((unitPrice * Math.max(1, comp.quantity || 1)).toFixed(2));
    return {
      ...comp,
      sqFtPerUnit,
      unitPrice,
      totalValue,
    };
  };

  const updateComponent = (index: number, patch: Partial<ComponentDraft>) => {
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== index) return c;
        const merged = { ...c, ...patch };
        // If width changed and user hasn't customized panel ratios unevenly, update panel mm proportionally
        if (patch.widthMm !== undefined && merged.drawingConfig?.panels) {
          const totalR =
            merged.drawingConfig.panels.reduce((s, p) => s + (p.widthRatio || 1), 0) || 1;
          merged.drawingConfig = {
            ...merged.drawingConfig,
            panels: merged.drawingConfig.panels.map((p) => ({
              ...p,
              widthMm: Math.round((merged.widthMm * (p.widthRatio || 1)) / totalR),
            })),
          };
        }
        return recalcComponent(merged);
      })
    );
  };

  // Helper for Width and Height typing (allows decimals, positive only, no spinners)
  const handleDimensionChange = (
    index: number,
    field: "widthMm" | "heightMm",
    rawField: "rawWidth" | "rawHeight",
    inputValue: string
  ) => {
    // Keep only numbers and at most one decimal dot
    let cleaned = inputValue.replace(/[^0-9.]/g, "");
    const dotParts = cleaned.split(".");
    if (dotParts.length > 2) {
      cleaned = dotParts[0] + "." + dotParts.slice(1).join("");
    }

    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== index) return c;

        const parsed = parseFloat(cleaned);
        const validNum = !isNaN(parsed) && parsed > 0;

        const merged: ComponentDraft = {
          ...c,
          [rawField]: cleaned,
          ...(validNum ? { [field]: parsed } : {}),
        };

        if (validNum && field === "widthMm" && merged.drawingConfig?.panels) {
          const totalR =
            merged.drawingConfig.panels.reduce((s, p) => s + (p.widthRatio || 1), 0) || 1;
          merged.drawingConfig = {
            ...merged.drawingConfig,
            panels: merged.drawingConfig.panels.map((p) => ({
              ...p,
              widthMm: Math.round((merged.widthMm * (p.widthRatio || 1)) / totalR),
            })),
          };
        }

        return validNum ? recalcComponent(merged) : merged;
      })
    );
  };

  const handleDimensionBlur = (
    index: number,
    field: "widthMm" | "heightMm",
    rawField: "rawWidth" | "rawHeight"
  ) => {
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== index) return c;
        const currentRaw = c[rawField];
        let finalVal = c[field];

        if (currentRaw !== undefined) {
          const parsed = parseFloat(currentRaw);
          if (isNaN(parsed) || parsed <= 0) {
            finalVal = 100;
          } else {
            finalVal = parsed;
          }
        }

        const merged: ComponentDraft = {
          ...c,
          [field]: finalVal,
          [rawField]: undefined,
        };

        if (field === "widthMm" && merged.drawingConfig?.panels) {
          const totalR =
            merged.drawingConfig.panels.reduce((s, p) => s + (p.widthRatio || 1), 0) || 1;
          merged.drawingConfig = {
            ...merged.drawingConfig,
            panels: merged.drawingConfig.panels.map((p) => ({
              ...p,
              widthMm: Math.round((merged.widthMm * (p.widthRatio || 1)) / totalR),
            })),
          };
        }

        return recalcComponent(merged);
      })
    );
  };

  // Helper for Quantity typing (integers only, positive, no spinners)
  const handleQuantityChange = (index: number, inputValue: string) => {
    // Keep only whole digits
    const cleaned = inputValue.replace(/[^0-9]/g, "");

    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== index) return c;

        const parsed = parseInt(cleaned, 10);
        const validNum = !isNaN(parsed) && parsed > 0;

        const merged: ComponentDraft = {
          ...c,
          rawQuantity: cleaned,
          ...(validNum ? { quantity: parsed } : {}),
        };

        return validNum ? recalcComponent(merged) : merged;
      })
    );
  };

  const handleQuantityBlur = (index: number) => {
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== index) return c;
        let finalQty = c.quantity;

        if (c.rawQuantity !== undefined) {
          const parsed = parseInt(c.rawQuantity, 10);
          if (isNaN(parsed) || parsed <= 0) {
            finalQty = 1;
          } else {
            finalQty = parsed;
          }
        }

        const merged: ComponentDraft = {
          ...c,
          quantity: finalQty,
          rawQuantity: undefined,
        };

        return recalcComponent(merged);
      })
    );
  };

  const handleUpdateVentilationSections = (
    index: number,
    patch: {
      fanHeight?: number;
      glassHeight?: number;
      fanWidth?: number;
      glassWidth?: number;
      linkWidths?: boolean;
      overallWidth?: number;
      overallHeight?: number;
      rawOverallWidth?: string;
      rawOverallHeight?: string;
      rawFanWidth?: string;
      rawFanHeight?: string;
      rawGlassWidth?: string;
      rawGlassHeight?: string;
    }
  ) => {
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== index) return c;

        const currentCfg = c.drawingConfig || ({} as DrawingConfig);
        const { topMm, bottomMm, fanMm, rightTopMm } =
          computeVentilationFanMetrics(c.widthMm, c.heightMm, currentCfg);

        const linkWidths =
          patch.linkWidths !== undefined
            ? patch.linkWidths
            : currentCfg.linkWidths ?? true;

        let newFanHeight =
          patch.fanHeight !== undefined ? Math.max(50, patch.fanHeight) : topMm;
        let newGlassHeight =
          patch.glassHeight !== undefined
            ? Math.max(50, patch.glassHeight)
            : bottomMm;

        let newFanWidth =
          patch.fanWidth !== undefined ? Math.max(50, patch.fanWidth) : fanMm;
        let newGlassWidth =
          patch.glassWidth !== undefined
            ? Math.max(50, patch.glassWidth)
            : rightTopMm;

        let newOverallHeight = c.heightMm;
        let newOverallWidth = c.widthMm;

        if (patch.overallHeight !== undefined) {
          newOverallHeight = Math.max(100, patch.overallHeight);
          newGlassHeight = Math.max(50, newOverallHeight - newFanHeight);
        } else if (patch.fanHeight !== undefined || patch.glassHeight !== undefined) {
          newOverallHeight = newFanHeight + newGlassHeight;
        }

        if (patch.overallWidth !== undefined) {
          newOverallWidth = Math.max(100, patch.overallWidth);
          if (linkWidths) {
            const ratio = newFanWidth / (newFanWidth + newGlassWidth || 1);
            newFanWidth = Math.round(newOverallWidth * ratio);
            newGlassWidth = newOverallWidth - newFanWidth;
          }
        } else if (
          linkWidths &&
          (patch.fanWidth !== undefined || patch.glassWidth !== undefined)
        ) {
          newOverallWidth = newFanWidth + newGlassWidth;
        }

        const updatedConfig: DrawingConfig = {
          ...currentCfg,
          hasSectionDimensions: true,
          linkWidths,
          topHeightMm: newFanHeight,
          bottomHeightMm: newGlassHeight,
          fanWidthMm: newFanWidth,
          glassWidthMm: newGlassWidth,
          panels: [
            {
              id: "p-1",
              label: "FAN",
              kind: "VENTILATION",
              widthRatio: newFanWidth / (newOverallWidth || 1),
              widthMm: newFanWidth,
              slideDirection: "NONE",
            },
            {
              id: "p-2",
              label: "F",
              kind: "FIXED",
              widthRatio: newGlassWidth / (newOverallWidth || 1),
              widthMm: newGlassWidth,
              slideDirection: "NONE",
            },
          ],
        };

        const merged: ComponentDraft = {
          ...c,
          widthMm: newOverallWidth,
          heightMm: newOverallHeight,
          drawingConfig: updatedConfig,
          ...(patch.rawOverallWidth !== undefined ? { rawOverallWidth: patch.rawOverallWidth } : {}),
          ...(patch.rawOverallHeight !== undefined ? { rawOverallHeight: patch.rawOverallHeight } : {}),
          ...(patch.rawFanWidth !== undefined ? { rawFanWidth: patch.rawFanWidth } : {}),
          ...(patch.rawFanHeight !== undefined ? { rawFanHeight: patch.rawFanHeight } : {}),
          ...(patch.rawGlassWidth !== undefined ? { rawGlassWidth: patch.rawGlassWidth } : {}),
          ...(patch.rawGlassHeight !== undefined ? { rawGlassHeight: patch.rawGlassHeight } : {}),
        };

        return recalcComponent(merged);
      })
    );
  };

  const handleVentilationDimensionChange = (
    index: number,
    field: "overallWidth" | "overallHeight" | "fanWidth" | "fanHeight" | "glassWidth" | "glassHeight",
    rawField: "rawOverallWidth" | "rawOverallHeight" | "rawFanWidth" | "rawFanHeight" | "rawGlassWidth" | "rawGlassHeight",
    inputValue: string
  ) => {
    let cleaned = inputValue.replace(/[^0-9.]/g, "");
    const dotParts = cleaned.split(".");
    if (dotParts.length > 2) {
      cleaned = dotParts[0] + "." + dotParts.slice(1).join("");
    }

    const parsed = parseFloat(cleaned);
    const validNum = !isNaN(parsed) && parsed > 0;

    if (validNum) {
      handleUpdateVentilationSections(index, {
        [field]: parsed,
        [rawField]: cleaned,
      });
    } else {
      setComponents((prev) =>
        prev.map((c, i) => (i === index ? { ...c, [rawField]: cleaned } : c))
      );
    }
  };

  const handleVentilationDimensionBlur = (
    index: number,
    field: "overallWidth" | "overallHeight" | "fanWidth" | "fanHeight" | "glassWidth" | "glassHeight",
    rawField: "rawOverallWidth" | "rawOverallHeight" | "rawFanWidth" | "rawFanHeight" | "rawGlassWidth" | "rawGlassHeight"
  ) => {
    setComponents((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        return {
          ...c,
          [rawField]: undefined,
        };
      })
    );
  };

  const handleSelectProduct = (prod: CatalogueProduct) => {
    const spec = prod.specifications[0] || {};
    const defaultImg =
      prod.images.find((i) => i.isDefault)?.url || prod.images[0]?.url || null;
    const showUpvc =
      prod.showUpvcFields !== null && prod.showUpvcFields !== undefined
        ? prod.showUpvcFields
        : prod.category.showUpvcFields;

    const baseWidth =
      replacingIndex !== null && components[replacingIndex]
        ? components[replacingIndex].widthMm
        : prod.defaultWidthMm;
    const baseHeight =
      replacingIndex !== null && components[replacingIndex]
        ? components[replacingIndex].heightMm
        : prod.defaultHeightMm;

    const sqFt = calculateSqFt(baseWidth, baseHeight);
    const rate = prod.defaultRatePerSqFt;
    const unitPrice = Number((sqFt * rate).toFixed(2));

    const newComp: ComponentDraft = {
      localId:
        replacingIndex !== null && components[replacingIndex]
          ? components[replacingIndex].localId
          : `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code:
        replacingIndex !== null && components[replacingIndex]
          ? components[replacingIndex].code
          : `W${components.length + 1}`,
      name: prod.name,
      location:
        replacingIndex !== null && components[replacingIndex]
          ? components[replacingIndex].location
          : "GF FRONT ROOM",
      productId: prod.id,
      categoryName: prod.category.name,
      brandName: prod.brand?.name || null,
      widthMm: baseWidth,
      heightMm: baseHeight,
      quantity:
        replacingIndex !== null && components[replacingIndex]
          ? components[replacingIndex].quantity
          : 1,
      sqFtPerUnit: sqFt,
      ratePerSqFt: rate,
      unitPrice,
      totalValue:
        unitPrice *
        (replacingIndex !== null && components[replacingIndex]
          ? components[replacingIndex].quantity
          : 1),
      isPriceOverridden: false,
      drawingType: prod.drawingType,
      drawingConfig: getDefaultDrawingConfig(prod.drawingType, baseWidth),
      customImageUrl: defaultImg,
      showUpvcFields: showUpvc,
      profileSystem: spec.profileSystem || "",
      glassType: spec.glassType || "",
      profileColour: spec.profileColour || "",
      meshType: spec.meshType || "",
      track: spec.track || "",
      trackRi: spec.trackRi || "",
      slidingSash: spec.slidingSash || "",
      slidingSashRi: spec.slidingSashRi || "",
      flymeshSash: spec.flymeshSash || "",
      mullionRi: spec.mullionRi || "",
      locking: spec.locking || "",
      handleColour: spec.handleColour || "",
      handleType: spec.handleType || "",
      lockableEspag: spec.lockableEspag || "",
      rollerType: spec.rollerType || "",
      additionalAccess: spec.additionalAccess || "",
      remarks: "",
    };

    if (replacingIndex !== null) {
      setComponents((prev) =>
        prev.map((c, i) => (i === replacingIndex ? newComp : c))
      );
      setReplacingIndex(null);
    } else {
      setComponents((prev) => [...prev, newComp]);
    }
  };

  const moveComponent = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= components.length) return;
    setComponents((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const duplicateComponent = (index: number) => {
    const src = components[index];
    const copy: ComponentDraft = {
      ...src,
      localId: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: `${src.code}-COPY`,
    };
    setComponents((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const removeComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComponentImageUpload = async (
    index: number,
    file: File | undefined
  ) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      updateComponent(index, { customImageUrl: data.url });
    }
  };

  const updatePanel = (
    compIndex: number,
    panelIdx: number,
    patch: Partial<DrawingPanelConfig>
  ) => {
    const comp = components[compIndex];
    const panels = comp.drawingConfig.panels.map((p, i) =>
      i === panelIdx ? { ...p, ...patch } : p
    );
    // If widthMm edited on panel, sync widthRatio & total widthMm
    let nextWidthMm = comp.widthMm;
    if (patch.widthMm !== undefined) {
      const sumMm = panels.reduce((s, p) => s + (Number(p.widthMm) || 0), 0);
      if (sumMm > 100) {
        nextWidthMm = sumMm;
        panels.forEach((p) => {
          p.widthRatio = (Number(p.widthMm) || 100) / sumMm;
        });
      }
    }
    updateComponent(compIndex, {
      widthMm: nextWidthMm,
      drawingConfig: { ...comp.drawingConfig, panels },
    });
  };

  const totals = calculateQuotationTotals({
    components,
    discountType,
    discountValue,
    transportCharges,
    installationCharges,
    otherCharges,
    gstPercent,
    taxTreatment,
  });

  const handleSave = async (overrideStatus?: string) => {
    setError("");
    setSuccessMsg("");
    if (!customerId) {
      setError("Please select a Customer.");
      return;
    }
    if (components.length === 0) {
      setError("Please add at least one door/window component to the quotation.");
      return;
    }

    setSaving(true);
    const saveStatus = overrideStatus || status || "Draft";
    const payload = {
      customerId,
      projectId: projectId || undefined,
      siteName,
      siteLocation: siteLocation || selectedCustomer?.billingAddress,
      siteContactPerson,
      siteContactNumber,
      quotationDate,
      quotationNumber: quotationNumber || undefined,
      referenceNumber,
      salesperson,
      status: saveStatus,
      remarks,
      gstPercent,
      taxTreatment,
      discountType,
      discountValue,
      transportCharges,
      installationCharges,
      otherCharges,
      termsText,
      components: components.map((c) => {
        const {
          rawWidth,
          rawHeight,
          rawQuantity,
          rawOverallWidth,
          rawOverallHeight,
          rawFanWidth,
          rawFanHeight,
          rawGlassWidth,
          rawGlassHeight,
          ...cleanComp
        } = c;
        return {
          ...cleanComp,
          drawingConfigJson: JSON.stringify(c.drawingConfig),
        };
      }),
    };

    const url = quotationId ? `/api/quotations/${quotationId}` : "/api/quotations";
    const method = quotationId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to save quotation");
      return;
    }

    setSuccessMsg("Quotation saved successfully!");
    router.push(`/quotations/${data.quotation.id}`);
    router.refresh();
  };

  const optionsByType = (type: string) =>
    masterOptions.filter((o) => o.optionType === type);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#DDE4DA] shadow-sm sticky top-16 z-20">
        <div>
          <h1 className="text-xl font-bold text-[#25382E]">
            {quotationId ? `Edit Quotation ${quotationNumber}` : "Create Technical Quotation"}
          </h1>
          <p className="text-xs text-[#718075]">
            {totals.totalComponents} Pcs • {formatNumber(totals.totalSqFt)} Sq.Ft. • Grand Total:{" "}
            <span className="font-bold text-[#294C3B]">{formatINR(totals.grandTotal)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setReplacingIndex(null);
              setCatalogueOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#294C3B] text-[#294C3B] text-xs font-bold hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" /> Add Component
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("Draft")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> Save as Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("Sent")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-bold hover:bg-[#173D30] disabled:opacity-60 shadow-sm"
          >
            <Send className="w-4 h-4" /> Send for Approval
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Section 4.2: Basic Information */}
      <div className="bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#294C3B] uppercase tracking-wider border-b border-slate-100 pb-2">
          1. Customer, Project &amp; Quotation Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Name *
            </label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customerCode})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Site / Project Name *
            </label>
            <input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Villa Renovation / Site Name"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Site Address *
            </label>
            <input
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              placeholder="Site address / location"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Site Contact Person
            </label>
            <input
              value={siteContactPerson}
              onChange={(e) => setSiteContactPerson(e.target.value)}
              placeholder="Contact on site"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Site Contact Number
            </label>
            <input
              value={siteContactNumber}
              onChange={(e) => setSiteContactNumber(e.target.value)}
              placeholder="Phone number"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quotation Date
            </label>
            <input
              type="date"
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quotation Number
            </label>
            <input
              value={quotationNumber}
              onChange={(e) => setQuotationNumber(e.target.value)}
              placeholder="Auto-generated"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks
            </label>
            <input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Quotation notes (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        {selectedCustomer && (
          <div className="bg-slate-50 border border-[#DDE4DA] rounded-lg px-4 py-2.5 text-xs text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
            <span>
              <strong>Attn:</strong> {selectedCustomer.contactPerson}
            </span>
            <span>
              <strong>Mobile:</strong> {selectedCustomer.mobile}
            </span>
            <span>
              <strong>Address:</strong> {selectedCustomer.billingAddress}
              {selectedCustomer.city ? `, ${selectedCustomer.city}` : ""}
            </span>
            {selectedCustomer.gstNumber && (
              <span>
                <strong>GSTIN:</strong> {selectedCustomer.gstNumber}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Section 4.6 & 4.8: Technical Components */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#294C3B] uppercase tracking-wider">
            2. Door, Window &amp; Partition Components ({components.length})
          </h2>
          <button
            type="button"
            onClick={() => {
              setReplacingIndex(null);
              setCatalogueOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-semibold hover:bg-[#173D30]"
          >
            <Plus className="w-4 h-4" /> Add Component from Catalogue
          </button>
        </div>

        {components.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">
              No components added yet
            </h3>
            <p className="text-xs text-[#718075] mt-1 mb-4">
              Select a door, window, or glass partition from the visual product catalogue to begin.
            </p>
            <button
              type="button"
              onClick={() => {
                setReplacingIndex(null);
                setCatalogueOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#294C3B] text-white text-sm font-semibold hover:bg-[#173D30]"
            >
              <Plus className="w-4 h-4" /> + Add Component
            </button>
          </div>
        ) : (
          components.map((comp, idx) => {
            const panelOpen = Boolean(expandedPanelEditor[comp.localId]);
            return (
              <div
                key={comp.localId}
                className="bg-white rounded-xl border border-[#DDE4DA] shadow-sm overflow-hidden"
              >
                {/* Component Header Bar */}
                <div className="bg-slate-100 border-b border-[#DDE4DA] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#294C3B] text-white font-mono text-xs font-bold">
                      #{idx + 1} • {comp.code}
                    </span>
                    <span className="font-bold text-sm text-[#25382E]">
                      {comp.name}
                    </span>
                    <span className="text-xs text-[#718075] hidden sm:inline">
                      ({comp.categoryName}
                      {comp.brandName ? ` • ${comp.brandName}` : ""})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReplacingIndex(idx);
                        setCatalogueOpen(true);
                      }}
                      className="px-2.5 py-1 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Change Design
                    </button>
                    <button
                      type="button"
                      onClick={() => moveComponent(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded border border-[#DDE4DA] bg-white text-slate-600 disabled:opacity-40"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveComponent(idx, 1)}
                      disabled={idx === components.length - 1}
                      className="p-1.5 rounded border border-[#DDE4DA] bg-white text-slate-600 disabled:opacity-40"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateComponent(idx)}
                      className="p-1.5 rounded border border-[#DDE4DA] bg-white text-slate-600 hover:text-blue-600"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeComponent(idx)}
                      className="p-1.5 rounded border border-[#DDE4DA] bg-white text-slate-600 hover:text-rose-600"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Technical Card Body: Left Drawing + Right Spec Table */}
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* LEFT SECTION: PRODUCT DRAWING & DIMENSIONS */}
                  <div className="lg:col-span-5 p-4 border-b lg:border-b-0 lg:border-r border-[#DDE4DA] bg-slate-50/50 flex flex-col justify-between gap-4">
                    <div className="bg-white rounded-xl border border-[#DDE4DA] p-2">
                      <TechnicalDrawingSvg
                        widthMm={comp.widthMm}
                        heightMm={comp.heightMm}
                        drawingType={comp.drawingType}
                        drawingConfig={comp.drawingConfig}
                        customImageUrl={comp.customImageUrl}
                        location={comp.location}
                        code={comp.code}
                      />
                    </div>

                    {/* Dimension Controls: Section-wise for Ventilation, Standard for others */}
                    {isVentilationProduct(comp.drawingType, comp.name, comp.drawingConfig) ? (
                      (() => {
                        const vMetrics = computeVentilationFanMetrics(
                          comp.widthMm,
                          comp.heightMm,
                          comp.drawingConfig
                        );
                        return (
                          <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200/90 rounded-xl p-3 space-y-2.5">
                            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#294C3B] text-[#F3F0E3] text-[10px] font-bold">
                                  §
                                </span>
                                <div>
                                  <div className="text-xs font-bold text-[#294C3B] uppercase tracking-wide">
                                    Section-wise Dimensions
                                  </div>
                                  <div className="text-[10px] text-[#718075]">
                                    Fan &amp; Glass independent sections
                                  </div>
                                </div>
                              </div>
                              <label className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[11px] font-semibold text-[#294C3B] cursor-pointer hover:bg-emerald-50/50">
                                <input
                                  type="checkbox"
                                  checked={comp.drawingConfig.linkWidths ?? true}
                                  onChange={(e) =>
                                    handleUpdateVentilationSections(idx, {
                                      linkWidths: e.target.checked,
                                    })
                                  }
                                  className="rounded text-[#294C3B] focus:ring-[#294C3B]"
                                />
                                <span>Link Widths</span>
                              </label>
                            </div>

                            {/* Overall Dimensions */}
                            <div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                <span>Overall Dimensions</span>
                                <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                  Calculated Total
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                                    Overall Width (mm)
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    value={
                                      comp.rawOverallWidth !== undefined
                                        ? comp.rawOverallWidth
                                        : String(comp.widthMm)
                                    }
                                    onChange={(e) =>
                                      handleVentilationDimensionChange(
                                        idx,
                                        "overallWidth",
                                        "rawOverallWidth",
                                        e.target.value
                                      )
                                    }
                                    onBlur={() =>
                                      handleVentilationDimensionBlur(
                                        idx,
                                        "overallWidth",
                                        "rawOverallWidth"
                                      )
                                    }
                                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                                    Overall Height (mm)
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    value={
                                      comp.rawOverallHeight !== undefined
                                        ? comp.rawOverallHeight
                                        : String(comp.heightMm)
                                    }
                                    onChange={(e) =>
                                      handleVentilationDimensionChange(
                                        idx,
                                        "overallHeight",
                                        "rawOverallHeight",
                                        e.target.value
                                      )
                                    }
                                    onBlur={() =>
                                      handleVentilationDimensionBlur(
                                        idx,
                                        "overallHeight",
                                        "rawOverallHeight"
                                      )
                                    }
                                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                                    Quantity
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={
                                      comp.rawQuantity !== undefined
                                        ? comp.rawQuantity
                                        : String(comp.quantity)
                                    }
                                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                    onBlur={() => handleQuantityBlur(idx)}
                                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono font-semibold text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                                    View Side
                                  </label>
                                  <select
                                    value={comp.drawingConfig.viewSide || "INSIDE"}
                                    onChange={(e) =>
                                      updateComponent(idx, {
                                        drawingConfig: {
                                          ...comp.drawingConfig,
                                          viewSide: e.target.value as "INSIDE" | "OUTSIDE",
                                        },
                                      })
                                    }
                                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-semibold bg-white"
                                  >
                                    <option value="INSIDE">Inside View</option>
                                    <option value="OUTSIDE">Outside View</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Section Breakdown Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                              {/* Fan Section Box */}
                              <div className="bg-white/95 border border-blue-200 rounded-lg p-2 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                                    Fan Section (Top)
                                  </span>
                                  <span className="text-[9px] font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                    Exhaust Fan Bay
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-xs">
                                  <div>
                                    <label className="block text-[10px] text-slate-600 mb-0.5 font-medium">
                                      Fan Width (mm)
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      autoComplete="off"
                                      value={
                                        comp.rawFanWidth !== undefined
                                          ? comp.rawFanWidth
                                          : String(vMetrics.fanMm)
                                      }
                                      onChange={(e) =>
                                        handleVentilationDimensionChange(
                                          idx,
                                          "fanWidth",
                                          "rawFanWidth",
                                          e.target.value
                                        )
                                      }
                                      onBlur={() =>
                                        handleVentilationDimensionBlur(
                                          idx,
                                          "fanWidth",
                                          "rawFanWidth"
                                        )
                                      }
                                      className="w-full px-2 py-1 border border-blue-300 rounded font-mono font-bold text-xs bg-blue-50/50 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 mb-0.5 font-medium">
                                      Fan Height (mm)
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      autoComplete="off"
                                      value={
                                        comp.rawFanHeight !== undefined
                                          ? comp.rawFanHeight
                                          : String(vMetrics.topMm)
                                      }
                                      onChange={(e) =>
                                        handleVentilationDimensionChange(
                                          idx,
                                          "fanHeight",
                                          "rawFanHeight",
                                          e.target.value
                                        )
                                      }
                                      onBlur={() =>
                                        handleVentilationDimensionBlur(
                                          idx,
                                          "fanHeight",
                                          "rawFanHeight"
                                        )
                                      }
                                      className="w-full px-2 py-1 border border-blue-300 rounded font-mono font-bold text-xs bg-blue-50/50 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Glass Section Box */}
                              <div className="bg-white/95 border border-teal-200 rounded-lg p-2 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-teal-900">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
                                    Glass Section (Bottom)
                                  </span>
                                  <span className="text-[9px] font-mono text-teal-600 bg-teal-50 px-1 py-0.5 rounded">
                                    Fixed Glass Bay
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-xs">
                                  <div>
                                    <label className="block text-[10px] text-slate-600 mb-0.5 font-medium">
                                      Glass Width (mm)
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      autoComplete="off"
                                      value={
                                        comp.rawGlassWidth !== undefined
                                          ? comp.rawGlassWidth
                                          : String(vMetrics.rightTopMm)
                                      }
                                      onChange={(e) =>
                                        handleVentilationDimensionChange(
                                          idx,
                                          "glassWidth",
                                          "rawGlassWidth",
                                          e.target.value
                                        )
                                      }
                                      onBlur={() =>
                                        handleVentilationDimensionBlur(
                                          idx,
                                          "glassWidth",
                                          "rawGlassWidth"
                                        )
                                      }
                                      className="w-full px-2 py-1 border border-teal-300 rounded font-mono font-bold text-xs bg-teal-50/50 text-teal-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 mb-0.5 font-medium">
                                      Glass Height (mm)
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      autoComplete="off"
                                      value={
                                        comp.rawGlassHeight !== undefined
                                          ? comp.rawGlassHeight
                                          : String(vMetrics.bottomMm)
                                      }
                                      onChange={(e) =>
                                        handleVentilationDimensionChange(
                                          idx,
                                          "glassHeight",
                                          "rawGlassHeight",
                                          e.target.value
                                        )
                                      }
                                      onBlur={() =>
                                        handleVentilationDimensionBlur(
                                          idx,
                                          "glassHeight",
                                          "rawGlassHeight"
                                        )
                                      }
                                      className="w-full px-2 py-1 border border-teal-300 rounded font-mono font-bold text-xs bg-teal-50/50 text-teal-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Live Equation Bar */}
                            <div className="px-2 py-1 rounded-md bg-emerald-100/60 border border-emerald-200 text-[10px] text-[#294C3B] flex flex-wrap items-center justify-between gap-1 font-medium">
                              <span>
                                <strong>Height:</strong> {vMetrics.topMm} mm (Fan) + {vMetrics.bottomMm} mm (Glass) = <strong className="font-mono">{comp.heightMm} mm</strong>
                              </span>
                              <span>
                                <strong>Width:</strong> {vMetrics.fanMm} mm (Fan) + {vMetrics.rightTopMm} mm (Glass) = <strong className="font-mono">{comp.widthMm} mm</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      /* Dimension Controls */
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Width (mm)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={
                              comp.rawWidth !== undefined
                                ? comp.rawWidth
                                : String(comp.widthMm)
                            }
                            onChange={(e) =>
                              handleDimensionChange(
                                idx,
                                "widthMm",
                                "rawWidth",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleDimensionBlur(idx, "widthMm", "rawWidth")
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-mono font-semibold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#294C3B] focus:border-[#294C3B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Height (mm)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={
                              comp.rawHeight !== undefined
                                ? comp.rawHeight
                                : String(comp.heightMm)
                            }
                            onChange={(e) =>
                              handleDimensionChange(
                                idx,
                                "heightMm",
                                "rawHeight",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleDimensionBlur(idx, "heightMm", "rawHeight")
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-mono font-semibold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#294C3B] focus:border-[#294C3B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Quantity
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={
                              comp.rawQuantity !== undefined
                                ? comp.rawQuantity
                                : String(comp.quantity)
                            }
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            onBlur={() => handleQuantityBlur(idx)}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-mono font-semibold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#294C3B] focus:border-[#294C3B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            View Side
                          </label>
                          <select
                            value={comp.drawingConfig.viewSide || "INSIDE"}
                            onChange={(e) =>
                              updateComponent(idx, {
                                drawingConfig: {
                                  ...comp.drawingConfig,
                                  viewSide: e.target.value as "INSIDE" | "OUTSIDE",
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-semibold bg-white"
                          >
                            <option value="INSIDE">Inside View</option>
                            <option value="OUTSIDE">Outside View</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Panel & Image Customization Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DDE4DA]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPanelEditor((prev) => ({
                            ...prev,
                            [comp.localId]: !prev[comp.localId],
                          }))
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#294C3B] hover:underline"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        {panelOpen ? "Hide Panel Editor" : "Customize Panels & Divisions"}
                      </button>

                      <div className="flex items-center gap-2">
                        {comp.customImageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              updateComponent(idx, { customImageUrl: null })
                            }
                            className="text-[11px] text-rose-600 hover:underline"
                          >
                            Use Dynamic SVG
                          </button>
                        )}
                        <label className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#294C3B] cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Upload Drawing
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg,.webp"
                            className="hidden"
                            onChange={(e) =>
                              handleComponentImageUpload(idx, e.target.files?.[0])
                            }
                          />
                        </label>
                      </div>
                    </div>

                    {panelOpen && (
                      <div className="bg-white border border-[#DDE4DA] rounded-lg p-3 space-y-2">
                        <div className="text-[11px] font-bold text-slate-700 uppercase">
                          Individual Panel Widths &amp; Directions
                        </div>
                        {comp.drawingConfig.panels.map((panel, pIdx) => (
                          <div
                            key={panel.id || pIdx}
                            className="grid grid-cols-4 gap-2 items-center text-xs"
                          >
                            <input
                              value={panel.label}
                              onChange={(e) =>
                                updatePanel(idx, pIdx, { label: e.target.value })
                              }
                              className="px-2 py-1 border border-[#DDE4DA] rounded font-bold text-center"
                              placeholder="Label"
                            />
                            <select
                              value={panel.kind}
                              onChange={(e) =>
                                updatePanel(idx, pIdx, {
                                  kind: e.target.value as PanelKind,
                                })
                              }
                              className="px-1.5 py-1 border border-[#DDE4DA] rounded bg-white"
                            >
                              <option value="SLIDE_GLASS">Slide Glass</option>
                              <option value="SLIDE_MESH">Slide Mesh</option>
                              <option value="FIXED">Fixed</option>
                              <option value="OPENABLE_LEFT">Open Left</option>
                              <option value="OPENABLE_RIGHT">Open Right</option>
                              <option value="VENTILATION">Ventilation</option>
                              <option value="FRENCH_DOOR">French Grid</option>
                              <option value="GLASS_PANEL">Glass Panel</option>
                            </select>
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={panel.widthMm || Math.round(comp.widthMm * panel.widthRatio)}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                                const parsed = parseFloat(cleaned);
                                if (!isNaN(parsed) && parsed > 0) {
                                  updatePanel(idx, pIdx, {
                                    widthMm: parsed,
                                  });
                                }
                              }}
                              className="px-2 py-1 border border-[#DDE4DA] rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#294C3B]"
                              title="Panel Width (mm)"
                            />
                            <select
                              value={panel.slideDirection || "NONE"}
                              onChange={(e) =>
                                updatePanel(idx, pIdx, {
                                  slideDirection: e.target.value as SlideDirection,
                                })
                              }
                              className="px-1.5 py-1 border border-[#DDE4DA] rounded bg-white"
                            >
                              <option value="NONE">No Arrow</option>
                              <option value="LEFT">← Left</option>
                              <option value="RIGHT">→ Right</option>
                              <option value="BOTH">↔ Both</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT SECTION: PRODUCT DETAILS & PRICING */}
                  <div className="lg:col-span-7 p-4 space-y-4">
                    {/* Basic Info */}
                    <div>
                      <div className="text-[11px] font-bold text-[#294C3B] uppercase tracking-wider mb-2">
                        Basic Information
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Code
                          </label>
                          <input
                            value={comp.code}
                            onChange={(e) =>
                              updateComponent(idx, { code: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono font-bold"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Product Name
                          </label>
                          <input
                            value={comp.name}
                            onChange={(e) =>
                              updateComponent(idx, { name: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Location
                          </label>
                          <input
                            value={comp.location}
                            onChange={(e) =>
                              updateComponent(idx, { location: e.target.value })
                            }
                            placeholder="GF FRONT ROOM"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs uppercase"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Profile System
                          </label>
                          <input
                            list={`profile-sys-${idx}`}
                            value={comp.profileSystem}
                            onChange={(e) =>
                              updateComponent(idx, { profileSystem: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                          />
                          <datalist id={`profile-sys-${idx}`}>
                            {optionsByType("PROFILE_SYSTEM").map((o) => (
                              <option key={o.id} value={o.name} />
                            ))}
                          </datalist>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Glass
                          </label>
                          <input
                            list={`glass-type-${idx}`}
                            value={comp.glassType}
                            onChange={(e) =>
                              updateComponent(idx, { glassType: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                          />
                          <datalist id={`glass-type-${idx}`}>
                            {optionsByType("GLASS_TYPE").map((o) => (
                              <option key={o.id} value={o.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                    </div>

                    {/* Computed Values */}
                    <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#294C3B] uppercase tracking-wider">
                          Computed Values &amp; Pricing
                        </span>
                        <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={comp.isPriceOverridden}
                            onChange={(e) =>
                              updateComponent(idx, {
                                isPriceOverridden: e.target.checked,
                              })
                            }
                          />
                          Manual Unit Price Override
                        </label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                        <div>
                          <div className="text-[11px] text-[#718075]">Sq.Ft. / Unit</div>
                          <div className="font-mono font-bold text-[#25382E] mt-1">
                            {formatNumber(comp.sqFtPerUnit)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Rate / Sq.Ft. (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={comp.ratePerSqFt}
                            onChange={(e) =>
                              updateComponent(idx, {
                                ratePerSqFt: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-mono font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Unit Price (₹)
                          </label>
                          <input
                            type="number"
                            readOnly={!comp.isPriceOverridden}
                            value={comp.unitPrice}
                            onChange={(e) =>
                              updateComponent(idx, {
                                unitPrice: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className={`w-full px-2 py-1 rounded border font-mono font-semibold ${
                              comp.isPriceOverridden
                                ? "border-amber-400 bg-white"
                                : "border-transparent bg-transparent text-[#25382E]"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="text-[11px] text-[#718075]">Total Sq.Ft.</div>
                          <div className="font-mono font-bold text-slate-700 mt-1">
                            {formatNumber(comp.sqFtPerUnit * comp.quantity)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#718075]">Total Value</div>
                          <div className="font-bold text-[#294C3B] text-sm mt-0.5">
                            {formatINR(comp.totalValue)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Details (UPVC or Configurable) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#294C3B] uppercase tracking-wider">
                          Profile Details
                        </span>
                        <label className="inline-flex items-center gap-1.5 text-[11px] text-[#718075] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={comp.showUpvcFields}
                            onChange={(e) =>
                              updateComponent(idx, { showUpvcFields: e.target.checked })
                            }
                          />
                          Show Full uPVC Profile Specs
                        </label>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Profile Colour
                          </label>
                          <input
                            list={`prof-col-${idx}`}
                            value={comp.profileColour}
                            onChange={(e) =>
                              updateComponent(idx, { profileColour: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-300"
                          />
                          <datalist id={`prof-col-${idx}`}>
                            {optionsByType("PROFILE_COLOUR").map((o) => (
                              <option key={o.id} value={o.name} />
                            ))}
                          </datalist>
                        </div>

                        {comp.showUpvcFields && (
                          <>
                            <div>
                              <label className="block text-[11px] text-[#718075] mb-0.5">
                                Mesh Type
                              </label>
                              <input
                                value={comp.meshType}
                                onChange={(e) =>
                                  updateComponent(idx, { meshType: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#718075] mb-0.5">
                                Track
                              </label>
                              <input
                                value={comp.track}
                                onChange={(e) =>
                                  updateComponent(idx, { track: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#718075] mb-0.5">
                                Track RI
                              </label>
                              <input
                                value={comp.trackRi}
                                onChange={(e) =>
                                  updateComponent(idx, { trackRi: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#718075] mb-0.5">
                                Sliding Sash
                              </label>
                              <input
                                value={comp.slidingSash}
                                onChange={(e) =>
                                  updateComponent(idx, { slidingSash: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#718075] mb-0.5">
                                Sliding Sash RI
                              </label>
                              <input
                                value={comp.slidingSashRi}
                                onChange={(e) =>
                                  updateComponent(idx, { slidingSashRi: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#718075] mb-0.5">
                                Flymesh Sash
                              </label>
                              <input
                                value={comp.flymeshSash}
                                onChange={(e) =>
                                  updateComponent(idx, { flymeshSash: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#718075] mb-0.5">
                                Mullion RI
                              </label>
                              <input
                                value={comp.mullionRi}
                                onChange={(e) =>
                                  updateComponent(idx, { mullionRi: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Accessories & Remarks */}
                    <div>
                      <div className="text-[11px] font-bold text-[#294C3B] uppercase tracking-wider mb-2">
                        Accessories &amp; Remarks
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Locking
                          </label>
                          <input
                            value={comp.locking}
                            onChange={(e) =>
                              updateComponent(idx, { locking: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Handle Colour
                          </label>
                          <input
                            value={comp.handleColour}
                            onChange={(e) =>
                              updateComponent(idx, { handleColour: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Handle Type
                          </label>
                          <input
                            value={comp.handleType}
                            onChange={(e) =>
                              updateComponent(idx, { handleType: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Lockable Espag
                          </label>
                          <input
                            value={comp.lockableEspag}
                            onChange={(e) =>
                              updateComponent(idx, { lockableEspag: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Roller Type
                          </label>
                          <input
                            value={comp.rollerType}
                            onChange={(e) =>
                              updateComponent(idx, { rollerType: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#718075] mb-0.5">
                            Additional Accessories
                          </label>
                          <input
                            value={comp.additionalAccess}
                            onChange={(e) =>
                              updateComponent(idx, {
                                additionalAccess: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-300"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <input
                            value={comp.remarks}
                            onChange={(e) =>
                              updateComponent(idx, { remarks: e.target.value })
                            }
                            placeholder="Component remarks (optional)..."
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Section 4.9: Final Quotation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#294C3B] uppercase tracking-wider">
            3. Discounts, Charges, GST &amp; Terms
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount Value
              </label>
              <input
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Percentage (%)
              </label>
              <input
                type="number"
                min={0}
                max={28}
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tax Treatment
              </label>
              <select
                value={taxTreatment}
                onChange={(e) => setTaxTreatment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="EXCLUSIVE">GST Extra (Exclusive)</option>
                <option value="INCLUSIVE">GST Inclusive</option>
                <option value="NO_GST">No GST / Exempt</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transportation Charges (₹)
              </label>
              <input
                type="number"
                min={0}
                value={transportCharges}
                onChange={(e) => setTransportCharges(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Installation Charges (₹)
              </label>
              <input
                type="number"
                min={0}
                value={installationCharges}
                onChange={(e) =>
                  setInstallationCharges(Number(e.target.value) || 0)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Other Charges (₹)
              </label>
              <input
                type="number"
                min={0}
                value={otherCharges}
                onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terms &amp; Conditions
            </label>
            <textarea
              rows={4}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* Quote Total Box */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#DDE4DA] shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-[#294C3B] text-white px-5 py-3.5 font-bold text-sm uppercase tracking-wider">
              Quote Total Summary
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="px-5 py-2.5 flex justify-between">
                <span className="text-slate-600">No. of Components</span>
                <span className="font-bold">{totals.totalComponents} Pcs</span>
              </div>
              <div className="px-5 py-2.5 flex justify-between">
                <span className="text-slate-600">Total Sq.Ft.</span>
                <span className="font-mono font-bold">
                  {formatNumber(totals.totalSqFt)} Sq.Ft.
                </span>
              </div>
              <div className="px-5 py-2.5 flex justify-between">
                <span className="text-slate-600">Average Value per Sq.Ft.</span>
                <span className="font-semibold">{formatINR(totals.avgRatePerSqFt)}</span>
              </div>
              <div className="px-5 py-2.5 flex justify-between">
                <span className="text-slate-600">Total Project Cost</span>
                <span className="font-bold">{formatINR(totals.subtotal)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="px-5 py-2.5 flex justify-between text-rose-600">
                  <span>Discount</span>
                  <span>- {formatINR(totals.discountAmount)}</span>
                </div>
              )}
              {totals.additionalCharges > 0 && (
                <div className="px-5 py-2.5 flex justify-between">
                  <span className="text-slate-600">Additional Charges</span>
                  <span>+ {formatINR(totals.additionalCharges)}</span>
                </div>
              )}
              <div className="px-5 py-2.5 flex justify-between">
                <span className="text-slate-600">
                  GST ({gstPercent}% – {taxTreatment})
                </span>
                <span className="font-semibold">{formatINR(totals.gstAmount)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider">
              Grand Total
            </span>
            <span className="text-2xl font-extrabold text-amber-400">
              {formatINR(totals.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Product Catalogue Modal */}
      <ProductCatalogueModal
        open={catalogueOpen}
        onClose={() => {
          setCatalogueOpen(false);
          setReplacingIndex(null);
        }}
        categories={categories}
        brands={brands}
        products={products}
        onSelect={handleSelectProduct}
      />
    </div>
  );
}

