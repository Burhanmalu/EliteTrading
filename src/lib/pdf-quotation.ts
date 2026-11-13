import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import {
  computeVentilationFanMetrics,
  getProductFrameDepthMm,
  parseDrawingConfig,
} from "./drawing-types";
import { formatDate, formatNumber } from "./format";

function pdfMoney(val: number | string | null | undefined): string {
  const num = Number(val ?? 0);
  return `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(num) ? 0 : num)}`;
}

export interface PdfQuotationData {
  quotationNumber: string;
  quotationDate: Date | string;
  validUntil?: Date | string | null;
  referenceNumber?: string | null;
  salesperson?: string | null;
  siteLocation: string;
  remarks?: string | null;
  status: string;
  gstPercent: number;
  taxTreatment: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  transportCharges: number;
  installationCharges: number;
  otherCharges: number;
  totalComponents: number;
  totalSqFt: number;
  avgRatePerSqFt: number;
  subtotal: number;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
  termsText?: string | null;
  customer: {
    name: string;
    contactPerson: string;
    mobile: string;
    email?: string | null;
    billingAddress: string;
    city?: string | null;
    state?: string | null;
    gstNumber?: string | null;
  };
  project?: {
    name: string;
    siteName?: string | null;
    siteAddress?: string | null;
  } | null;
  components: Array<{
    code: string;
    name: string;
    location: string;
    categoryName: string;
    brandName?: string | null;
    widthMm: number;
    heightMm: number;
    quantity: number;
    sqFtPerUnit: number;
    ratePerSqFt: number;
    unitPrice: number;
    totalValue: number;
    drawingType: string;
    drawingConfigJson: string;
    customImageUrl?: string | null;
    showUpvcFields: boolean;
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
    remarks?: string | null;
  }>;
}

export interface PdfCompanyData {
  companyName: string;
  tagline: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  logoUrl?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
}

export async function generateQuotationPdfBuffer(
  quotation: PdfQuotationData,
  company: PdfCompanyData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 32,
      bufferPages: true,
      info: {
        Title: `Quotation ${quotation.quotationNumber} - ${company.companyName}`,
        Author: company.companyName,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 32;
    const CONTENT_W = PAGE_W - MARGIN * 2; // 531.28

    const NAVY = "#173D30"; // Deep Forest Green
    const SLATE_DARK = "#25382E"; // Primary Text
    const SLATE_MID = "#718075"; // Secondary Text
    const SLATE_LIGHT = "#F3F0E3"; // Warm Ivory
    const BORDER = "#DDE4DA"; // Sage Border
    const ACCENT = "#294C3B"; // Primary Forest Green

    const drawHeader = () => {
      // Top Navy Banner
      doc.rect(MARGIN, 24, CONTENT_W, 64).fill(NAVY);

      // Logo or Vector Emblem
      let logoDrawn = false;
      if (company.logoUrl && !company.logoUrl.endsWith(".svg")) {
        const localPath = path.join(process.cwd(), "public", company.logoUrl.replace(/^\//, ""));
        if (fs.existsSync(localPath)) {
          try {
            doc.image(localPath, MARGIN + 10, 32, { fit: [48, 48] });
            logoDrawn = true;
          } catch {
            logoDrawn = false;
          }
        }
      }

      if (!logoDrawn) {
        doc.rect(MARGIN + 12, 34, 42, 42).lineWidth(1.5).stroke("#93c5fd");
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(16)
          .text("ET", MARGIN + 12, 47, { width: 42, align: "center" });
      }

      // Company Details
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(company.companyName.toUpperCase(), MARGIN + 64, 33);
      doc
        .fillColor("#cbd5e1")
        .font("Helvetica")
        .fontSize(8)
        .text(company.tagline, MARGIN + 64, 52);
      doc
        .fontSize(7.5)
        .text(
          `${company.phone}  |  ${company.email}  |  ${company.website}`,
          MARGIN + 64,
          64
        );
      doc.text(`GSTIN: ${company.gstNumber}`, MARGIN + 64, 75);

      // Right Quotation Badge
      doc
        .fillColor("#93c5fd")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("TECHNICAL QUOTATION", MARGIN + 340, 33, {
          width: 180,
          align: "right",
        });
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(quotation.quotationNumber, MARGIN + 340, 45, {
          width: 180,
          align: "right",
        });
      doc
        .fillColor("#e2e8f0")
        .font("Helvetica")
        .fontSize(8)
        .text(`Date: ${formatDate(quotation.quotationDate)}`, MARGIN + 340, 63, {
          width: 180,
          align: "right",
        });
      doc.text(`Status: ${quotation.status}`, MARGIN + 340, 74, {
        width: 180,
        align: "right",
      });

      // Customer & Project Info Strip
      const infoY = 94;
      doc
        .rect(MARGIN, infoY, CONTENT_W, 54)
        .fill("#f8fafc")
        .strokeColor(BORDER)
        .lineWidth(0.75)
        .stroke();

      // Left: Customer
      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("CUSTOMER DETAILS", MARGIN + 8, infoY + 6);
      doc
        .fillColor(SLATE_DARK)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(quotation.customer.name, MARGIN + 8, infoY + 17, { width: 250 });
      doc
        .fillColor(SLATE_MID)
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          `Attn: ${quotation.customer.contactPerson}  |  Mob: ${quotation.customer.mobile}`,
          MARGIN + 8,
          infoY + 29,
          { width: 250 }
        );
      doc.text(
        `${quotation.customer.billingAddress}${quotation.customer.city ? ", " + quotation.customer.city : ""}`,
        MARGIN + 8,
        infoY + 40,
        { width: 250 }
      );

      // Divider
      doc
        .moveTo(MARGIN + 265, infoY + 6)
        .lineTo(MARGIN + 265, infoY + 48)
        .strokeColor(BORDER)
        .stroke();

      // Right: Project
      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("PROJECT & SITE", MARGIN + 274, infoY + 6);
      doc
        .fillColor(SLATE_DARK)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(quotation.project?.name || "Architectural Glass & Door System", MARGIN + 274, infoY + 17, { width: 248 });
      doc
        .fillColor(SLATE_MID)
        .font("Helvetica")
        .fontSize(7.5)
        .text(`Site: ${quotation.siteLocation}`, MARGIN + 274, infoY + 29, {
          width: 248,
        });
      doc.text(
        `Salesperson: ${quotation.salesperson || "-"}  |  Ref: ${quotation.referenceNumber || "-"}`,
        MARGIN + 274,
        infoY + 40,
        { width: 248 }
      );

      return infoY + 62;
    };

    const drawVectorComponentDiagram = (
      comp: PdfQuotationData["components"][0],
      boxX: number,
      boxY: number,
      boxW: number,
      boxH: number
    ) => {
      // If custom raster image exists, embed it proportionally
      if (comp.customImageUrl && !comp.customImageUrl.endsWith(".svg")) {
        const localPath = path.join(
          process.cwd(),
          "public",
          comp.customImageUrl.replace(/^\//, "")
        );
        if (fs.existsSync(localPath)) {
          try {
            doc.image(localPath, boxX + 20, boxY + 18, {
              fit: [boxW - 30, boxH - 40],
              align: "center",
              valign: "center",
            });
            doc
              .fillColor(SLATE_DARK)
              .font("Helvetica-Bold")
              .fontSize(7.5)
              .text(`${comp.widthMm} mm (W) x ${comp.heightMm} mm (H)`, boxX, boxY + boxH - 14, {
                width: boxW,
                align: "center",
              });
            return;
          } catch {
            // fallback to vector drawing
          }
        }
      }

      const cfg = parseDrawingConfig(comp.drawingConfigJson, comp.drawingType, comp.widthMm);
      if (
        comp.drawingType === "VENTILATION_FAN" ||
        comp.drawingType === "VENTILATION" ||
        /ventilation/i.test(comp.name) ||
        cfg.hasSectionDimensions
      ) {
        const { safeW, safeH, topMm, bottomMm, fanMm, rightTopMm } =
          computeVentilationFanMetrics(comp.widthMm, comp.heightMm, cfg);

        const padL = 42;
        const padR = 12;
        const padT = 14;
        const padB = 36;
        const availW = boxW - padL - padR;
        const availH = boxH - padT - padB;
        const rawAspect = safeW / safeH;
        const aspect = Math.max(0.32, Math.min(3.2, rawAspect));

        let drawW = availW;
        let drawH = drawW / aspect;
        if (drawH > availH) {
          drawH = availH;
          drawW = drawH * aspect;
        }

        const startX = boxX + padL + (availW - drawW) / 2;
        const startY = boxY + padT + (availH - drawH) / 2;
        const frameT = 4.5;
        const barT = 4;

        const innerX = startX + frameT;
        const innerY = startY + frameT;
        const innerW = Math.max(14, drawW - frameT * 2);
        const innerH = Math.max(14, drawH - frameT * 2);

        const topH = Math.max(14, innerH * (topMm / safeH));
        const transomY = innerY + topH - barT / 2;
        const fanW = Math.max(14, innerW * (fanMm / safeW));
        const mullionX = innerX + fanW - barT / 2;

        const topPaneH = Math.max(10, transomY - innerY);
        const fanPaneW = Math.max(10, mullionX - innerX);
        const rightTopPaneX = mullionX + barT;
        const rightTopPaneW = Math.max(10, innerX + innerW - rightTopPaneX);
        const botPaneY = transomY + barT;
        const botPaneH = Math.max(12, innerY + innerH - botPaneY);

        // Outer Frame + Mitre corners
        doc.rect(startX, startY, drawW, drawH).fillAndStroke("#f1f5f9", "#1e293b");
        doc.strokeColor("#334155").lineWidth(0.5);
        doc.moveTo(startX, startY).lineTo(innerX, innerY).stroke();
        doc.moveTo(startX + drawW, startY).lineTo(innerX + innerW, innerY).stroke();
        doc.moveTo(startX, startY + drawH).lineTo(innerX, innerY + innerH).stroke();
        doc.moveTo(startX + drawW, startY + drawH).lineTo(innerX + innerW, innerY + innerH).stroke();

        // Top-Left: Exhaust Fan
        doc.rect(innerX, innerY, fanPaneW, topPaneH).fillAndStroke("#ffffff", "#334155");
        const fanCx = innerX + fanPaneW / 2;
        const fanCy = innerY + topPaneH / 2;
        const fanR = Math.max(5, Math.min(fanPaneW, topPaneH) * 0.42);
        doc.circle(fanCx, fanCy, fanR).fillAndStroke("#f8fafc", "#2563eb");
        doc.circle(fanCx, fanCy, fanR * 0.84).strokeColor("#64748b").lineWidth(0.5).stroke();

        for (let i = 0; i < 5; i++) {
          const a1 = ((i * 72 - 90) * Math.PI) / 180;
          const a2 = ((i * 72 - 52) * Math.PI) / 180;
          doc
            .moveTo(fanCx, fanCy)
            .lineTo(fanCx + Math.cos(a1) * fanR * 0.78, fanCy + Math.sin(a1) * fanR * 0.78)
            .lineTo(fanCx + Math.cos(a2) * fanR * 0.78, fanCy + Math.sin(a2) * fanR * 0.78)
            .closePath()
            .fillAndStroke("#cbd5e1", "#334155");
        }
        doc.circle(fanCx, fanCy, Math.max(2, fanR * 0.22)).fillAndStroke("#94a3b8", "#334155");

        // FAN badge & circled 2
        doc.rect(innerX + 2, innerY + 2, 16, 8).fillAndStroke("#ffffff", "#334155");
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(5.5).text("FAN", innerX + 2, innerY + 4, { width: 16, align: "center" });
        doc.circle(fanCx, innerY + 6.5, 4).fillAndStroke("#ffffff", "#334155");
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(5.2).text("2", fanCx - 3, innerY + 4.3, { width: 6, align: "center" });

        // Top-Right: Fixed Glass + (3)
        doc.rect(rightTopPaneX, innerY, rightTopPaneW, topPaneH).fillAndStroke("#bfe6f7", "#334155");
        const rtCx = rightTopPaneX + rightTopPaneW / 2;
        const rtCy = innerY + topPaneH / 2;
        doc.strokeColor("#64748b").lineWidth(0.6).moveTo(rtCx - 5, rtCy + 4).lineTo(rtCx + 5, rtCy + 4).stroke();
        doc.moveTo(rtCx, rtCy - 1).lineTo(rtCx, rtCy + 9).stroke();
        doc.circle(rtCx, rtCy - 5, 4).fillAndStroke("#ffffff", "#334155");
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(5.2).text("3", rtCx - 3, rtCy - 7.2, { width: 6, align: "center" });

        // Bottom: Fixed Glass F1 + (1)
        doc.rect(innerX, botPaneY, innerW, botPaneH).fillAndStroke("#bfe6f7", "#334155");
        const bCx = innerX + innerW / 2;
        const bCy = botPaneY + botPaneH / 2;
        doc.strokeColor("#64748b").lineWidth(0.7).moveTo(bCx - 6, bCy + 4).lineTo(bCx + 6, bCy + 4).stroke();
        doc.moveTo(bCx, bCy - 2).lineTo(bCx, bCy + 10).stroke();
        doc.circle(bCx, bCy - 6, 4.5).fillAndStroke("#ffffff", "#334155");
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(5.5).text("1", bCx - 3, bCy - 8.5, { width: 6, align: "center" });
        doc.rect(innerX + innerW - 16, botPaneY + botPaneH - 12, 13, 9).fillAndStroke("#ffffff", "#334155");
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(5.8).text("F1", innerX + innerW - 16, botPaneY + botPaneH - 9.5, { width: 13, align: "center" });

        // Mullion M1 & Transom T1
        doc.rect(mullionX, innerY, barT, topPaneH).fillAndStroke("#f1f5f9", "#334155");
        doc.rect(innerX, transomY, innerW, barT).fillAndStroke("#f1f5f9", "#334155");
        doc.rect(mullionX - 4, innerY + topPaneH / 2 - 4.5, barT + 8, 9).fillAndStroke("#ffffff", "#334155");
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(5.2).text("M1", mullionX - 4, innerY + topPaneH / 2 - 2.2, { width: barT + 8, align: "center" });
        doc.rect(innerX + innerW / 2 - 6, transomY - 2.5, 12, barT + 5).fillAndStroke("#ffffff", "#334155");
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(5.2).text("T1", innerX + innerW / 2 - 6, transomY - 0.5, { width: 12, align: "center" });

        // Left Sub-Height & Total Height Dimensions
        doc.strokeColor("#64748b").lineWidth(0.7);
        // Inner vertical line with tick marks
        doc.moveTo(startX - 12, startY).lineTo(startX - 12, transomY).stroke();
        doc.moveTo(startX - 15, startY).lineTo(startX - 9, startY).stroke();
        doc.moveTo(startX - 15, transomY).lineTo(startX - 9, transomY).stroke();

        doc.moveTo(startX - 12, transomY + barT).lineTo(startX - 12, startY + drawH).stroke();
        doc.moveTo(startX - 15, transomY + barT).lineTo(startX - 9, transomY + barT).stroke();
        doc.moveTo(startX - 15, startY + drawH).lineTo(startX - 9, startY + drawH).stroke();

        doc.save();
        doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(5.5);
        doc.rotate(-90, { origin: [startX - 15, startY + topH / 2] });
        doc.text(`Fan ${topMm}`, startX - 30, startY + topH / 2 - 3, { width: 30, align: "center" });
        doc.restore();

        doc.save();
        doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(5.5);
        doc.rotate(-90, { origin: [startX - 15, botPaneY + botPaneH / 2] });
        doc.text(`Glass ${bottomMm}`, startX - 32, botPaneY + botPaneH / 2 - 3, { width: 34, align: "center" });
        doc.restore();

        // Outer vertical line for Total Height
        doc.strokeColor("#1e293b").lineWidth(0.8);
        doc.moveTo(startX - 30, startY).lineTo(startX - 30, startY + drawH).stroke();
        doc.moveTo(startX - 33, startY).lineTo(startX - 27, startY).stroke();
        doc.moveTo(startX - 33, startY + drawH).lineTo(startX - 27, startY + drawH).stroke();
        doc.save();
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(6.5);
        doc.rotate(-90, { origin: [startX - 33, startY + drawH / 2] });
        doc.text(`Total ${safeH} mm`, startX - 52, startY + drawH / 2 - 3, { width: 44, align: "center" });
        doc.restore();

        // Bottom Sub-Width & Total Width Dimensions
        const dimY1 = startY + drawH + 8;
        const dimY2 = startY + drawH + 21;
        doc.strokeColor("#64748b").lineWidth(0.7);
        doc.moveTo(startX, dimY1).lineTo(mullionX, dimY1).stroke();
        doc.moveTo(startX, dimY1 - 2.5).lineTo(startX, dimY1 + 2.5).stroke();
        doc.moveTo(mullionX, dimY1 - 2.5).lineTo(mullionX, dimY1 + 2.5).stroke();

        doc.moveTo(mullionX + barT, dimY1).lineTo(startX + drawW, dimY1).stroke();
        doc.moveTo(mullionX + barT, dimY1 - 2.5).lineTo(mullionX + barT, dimY1 + 2.5).stroke();
        doc.moveTo(startX + drawW, dimY1 - 2.5).lineTo(startX + drawW, dimY1 + 2.5).stroke();

        doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(5.5);
        doc.text(`Fan ${fanMm}`, startX, dimY1 - 6, { width: Math.max(20, fanW), align: "center" });
        doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(5.5);
        doc.text(`Glass ${rightTopMm}`, rightTopPaneX, dimY1 - 6, { width: Math.max(20, rightTopPaneW), align: "center" });

        doc.strokeColor("#1e293b").lineWidth(0.8).moveTo(startX, dimY2).lineTo(startX + drawW, dimY2).stroke();
        doc.moveTo(startX, dimY2 - 3).lineTo(startX, dimY2 + 3).stroke();
        doc.moveTo(startX + drawW, dimY2 - 3).lineTo(startX + drawW, dimY2 + 3).stroke();
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(6.8);
        doc.text(`Total ${safeW} mm`, startX, dimY2 + 2, { width: drawW, align: "center" });

        doc.fillColor("#718075").font("Helvetica-Bold").fontSize(5.5).text(
          `${cfg.viewSide || "INSIDE"} VIEW • Fan: ${fanMm}×${topMm} mm | Glass: ${rightTopMm}×${bottomMm} mm`,
          boxX,
          boxY + boxH - 8,
          { width: boxW, align: "center" }
        );
        return;
      }

      const padL = 28;
      const padR = 12;
      const padT = 16;
      const padB = 14;

      // Allocate space between Front/Inside View and Upper/Top View
      const hasTopView =
        comp.drawingType.includes("TRACK") ||
        comp.drawingType.includes("SLIDING") ||
        comp.drawingType.includes("OPENABLE") ||
        comp.drawingType.includes("FIXED") ||
        Boolean(comp.track);

      const topViewBoxH = hasTopView ? Math.min(68, Math.max(52, boxH * 0.26)) : 0;
      const frontAvailH = boxH - padT - padB - (hasTopView ? topViewBoxH + 16 : 0);
      const availW = boxW - padL - padR;

      const rawAspect = Math.max(100, comp.widthMm) / Math.max(100, comp.heightMm);
      const aspect = Math.max(0.35, Math.min(3.2, rawAspect));

      let drawW = availW;
      let drawH = drawW / aspect;
      if (drawH > frontAvailH) {
        drawH = frontAvailH;
        drawW = drawH * aspect;
      }

      const startX = boxX + padL + (availW - drawW) / 2;
      const startY = boxY + padT + (frontAvailH - drawH) / 2;
      const frameT = cfg.frameStyle === "FRAMELESS" ? 2 : 5;

      // Outer Frame
      doc
        .rect(startX, startY, drawW, drawH)
        .fillAndStroke(
          cfg.frameStyle === "METAL" ? "#334155" : "#f1f5f9",
          "#1e293b"
        );

      const innerX = startX + frameT;
      const innerY = startY + frameT;
      const innerW = Math.max(14, drawW - frameT * 2);
      const innerH = Math.max(14, drawH - frameT * 2);

      const panels = cfg.panels || [];
      const totalRatio = panels.reduce((s, p) => s + (p.widthRatio || 1), 0) || 1;
      let cursorX = innerX;

      panels.forEach((panel, idx) => {
        const ratio = (panel.widthRatio || 1) / totalRatio;
        const pw = idx === panels.length - 1 ? innerX + innerW - cursorX : innerW * ratio;
        const sashT = 2.5;

        // Sash
        doc.rect(cursorX, innerY, pw, innerH).fillAndStroke("#ffffff", "#334155");

        const gx = cursorX + sashT;
        const gy = innerY + sashT;
        const gw = Math.max(6, pw - sashT * 2);
        const gh = Math.max(6, innerH - sashT * 2);
        const cx = gx + gw / 2;
        const cy = gy + gh / 2;

        // Glass / Mesh fill
        doc
          .rect(gx, gy, gw, gh)
          .fillAndStroke(panel.kind === "SLIDE_MESH" ? "#f8fafc" : "#e0f2fe", "#64748b");

        // Mesh cross lines
        if (panel.kind === "SLIDE_MESH") {
          doc.save();
          doc.strokeColor("#94a3b8").lineWidth(0.35);
          for (let mx = gx; mx < gx + gw; mx += 5) {
            doc.moveTo(mx, gy).lineTo(mx, gy + gh).stroke();
          }
          for (let my = gy; my < gy + gh; my += 5) {
            doc.moveTo(gx, my).lineTo(gx + gw, my).stroke();
          }
          doc.restore();
        }

        // Ventilation louvers
        if (panel.kind === "VENTILATION") {
          const rows = panel.rows || 5;
          doc.strokeColor("#334155").lineWidth(0.7);
          for (let r = 1; r <= rows; r++) {
            const ly = gy + (r * gh) / (rows + 1);
            doc.moveTo(gx + 2, ly).lineTo(gx + gw - 2, ly - 2).stroke();
          }
        }

        // French Door Grid
        if (panel.kind === "FRENCH_DOOR") {
          const rows = panel.rows || 4;
          const cols = panel.cols || 2;
          doc.strokeColor("#1e293b").lineWidth(0.9);
          for (let r = 1; r < rows; r++) {
            const ry = gy + (r * gh) / rows;
            doc.moveTo(gx, ry).lineTo(gx + gw, ry).stroke();
          }
          for (let c = 1; c < cols; c++) {
            const colX = gx + (c * gw) / cols;
            doc.moveTo(colX, gy).lineTo(colX, gy + gh).stroke();
          }
        }

        // Openable swing lines
        if (panel.kind === "OPENABLE_LEFT") {
          doc
            .save()
            .dash(3, { space: 2 })
            .strokeColor("#334155")
            .lineWidth(0.7)
            .moveTo(gx, gy)
            .lineTo(gx + gw, cy)
            .lineTo(gx, gy + gh)
            .stroke()
            .undash()
            .restore();
          doc.rect(gx + gw - 4, cy - 6, 2.5, 12).fillAndStroke("#0f172a", "#0f172a");
        } else if (panel.kind === "OPENABLE_RIGHT") {
          doc
            .save()
            .dash(3, { space: 2 })
            .strokeColor("#334155")
            .lineWidth(0.7)
            .moveTo(gx + gw, gy)
            .lineTo(gx, cy)
            .lineTo(gx + gw, gy + gh)
            .stroke()
            .undash()
            .restore();
          doc.rect(gx + 1.5, cy - 6, 2.5, 12).fillAndStroke("#0f172a", "#0f172a");
        } else if (panel.kind === "TILT_TURN") {
          doc
            .save()
            .dash(3, { space: 2 })
            .strokeColor("#334155")
            .lineWidth(0.7)
            .moveTo(gx, gy)
            .lineTo(gx + gw, cy)
            .lineTo(gx, gy + gh)
            .stroke()
            .strokeColor("#0284c7")
            .moveTo(gx, gy + gh)
            .lineTo(cx, gy)
            .lineTo(gx + gw, gy + gh)
            .stroke()
            .undash()
            .restore();
          doc.rect(gx + gw - 4, cy - 6, 2.5, 12).fillAndStroke("#0f172a", "#0f172a");
        } else if (panel.kind === "TOP_HUNG") {
          doc.rect(gx + gw * 0.2 - 3, gy - 1.5, 6, 2.5).fill("#1e293b");
          doc.rect(gx + gw * 0.8 - 3, gy - 1.5, 6, 2.5).fill("#1e293b");
          doc
            .save()
            .dash(3, { space: 2 })
            .strokeColor("#334155")
            .lineWidth(0.7)
            .moveTo(gx, gy)
            .lineTo(cx, gy + gh)
            .lineTo(gx + gw, gy)
            .stroke()
            .undash()
            .restore();
          doc.rect(cx - 6, gy + gh - 3, 12, 2.5).fill("#0f172a");
        } else if (panel.kind === "SHOWER_DOOR") {
          doc.rect(gx + gw - 3, gy + gh * 0.25 - 4, 3, 8).fill("#475569");
          doc.rect(gx + gw - 3, gy + gh * 0.75 - 4, 3, 8).fill("#475569");
          doc.strokeColor("#1e293b").lineWidth(1.8).moveTo(gx + 5, cy - 14).lineTo(gx + 5, cy + 14).stroke();
        } else if (panel.kind === "CORNER_POST") {
          doc.rect(cursorX, innerY, pw, innerH).fillAndStroke("#334155", "#0f172a");
          doc.strokeColor("#64748b").lineWidth(0.5).moveTo(cursorX, innerY).lineTo(cursorX + pw, innerY + innerH).stroke();
          doc.moveTo(cursorX + pw, innerY).lineTo(cursorX, innerY + innerH).stroke();
        }

        // Sliding direction arrow
        if (panel.slideDirection === "RIGHT" || panel.slideDirection === "BOTH") {
          const ay = cy + gh * 0.22;
          doc
            .strokeColor("#0f172a")
            .lineWidth(0.9)
            .moveTo(cx - gw * 0.2, ay)
            .lineTo(cx + gw * 0.22, ay)
            .stroke();
          doc
            .moveTo(cx + gw * 0.15, ay - 2.5)
            .lineTo(cx + gw * 0.22, ay)
            .lineTo(cx + gw * 0.15, ay + 2.5)
            .stroke();
        }
        if (panel.slideDirection === "LEFT" || panel.slideDirection === "BOTH") {
          const ay = cy + gh * 0.22;
          doc
            .strokeColor("#0f172a")
            .lineWidth(0.9)
            .moveTo(cx + gw * 0.2, ay)
            .lineTo(cx - gw * 0.22, ay)
            .stroke();
          doc
            .moveTo(cx - gw * 0.15, ay - 2.5)
            .lineTo(cx - gw * 0.22, ay)
            .lineTo(cx - gw * 0.15, ay + 2.5)
            .stroke();
        }

        // Panel Label
        doc
          .fillColor("#0f172a")
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text(panel.label, cx - 8, cy - 4, { width: 16, align: "center" });

        cursorX += pw;
      });

      // Bottom Width Dimension Line for Front View
      const dimY = startY + drawH + 7;
      doc.strokeColor(NAVY).lineWidth(0.6);
      doc.moveTo(startX, startY + drawH + 1).lineTo(startX, dimY + 2).stroke();
      doc.moveTo(startX + drawW, startY + drawH + 1).lineTo(startX + drawW, dimY + 2).stroke();
      doc.moveTo(startX, dimY).lineTo(startX + drawW, dimY).stroke();

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(6.8)
        .text(`${comp.widthMm} mm`, startX, dimY + 1.5, {
          width: drawW,
          align: "center",
        });

      // Left Height Dimension Line for Front View
      const dimX = startX - 8;
      doc.strokeColor(NAVY).lineWidth(0.6);
      doc.moveTo(startX - 2, startY).lineTo(dimX - 2, startY).stroke();
      doc.moveTo(startX - 2, startY + drawH).lineTo(dimX - 2, startY + drawH).stroke();
      doc.moveTo(dimX, startY).lineTo(dimX, startY + drawH).stroke();

      doc.save();
      doc.translate(dimX - 6, startY + drawH / 2);
      doc.rotate(-90);
      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(6.8)
        .text(`${comp.heightMm} mm`, -25, 0, { width: 50, align: "center" });
      doc.restore();

      // Front View Label
      doc
        .fillColor(SLATE_MID)
        .font("Helvetica-Bold")
        .fontSize(6)
        .text(`${cfg.viewSide || "INSIDE"} VIEW`, boxX, dimY + 10, {
          width: boxW,
          align: "center",
        });

      // B. UPPER / TOP VIEW (Frame depth & Track / Sash Arrangement)
      if (hasTopView) {
        const topY = dimY + 22;
        const trackCount =
          cfg.trackCount ??
          (comp.drawingType.includes("4_TRACK")
            ? 4
            : comp.drawingType.includes("3_TRACK") || (comp.track && comp.track.includes("3 Track"))
            ? 3
            : comp.drawingType.includes("2_TRACK") || (comp.track && comp.track.includes("2 Track"))
            ? 2
            : 1);

        const frameDepthMm = cfg.frameDepthMm ?? getProductFrameDepthMm(comp.track, trackCount, cfg.frameStyle);
        const topH = Math.min(26, Math.max(16, topViewBoxH * 0.45));
        const topStartX = startX;
        const topW = drawW;

        // Outer Top-View Frame
        doc
          .rect(topStartX, topY, topW, topH)
          .fillAndStroke("#ffffff", "#1e293b");

        // End Caps
        doc.rect(topStartX, topY, 3, topH).fillAndStroke("#cbd5e1", "#1e293b");
        doc.rect(topStartX + topW - 3, topY, 3, topH).fillAndStroke("#cbd5e1", "#1e293b");

        // Tracks
        const trackSpacing = topH / (trackCount + 1);
        for (let t = 1; t <= trackCount; t++) {
          const ty = topY + t * trackSpacing;
          doc
            .strokeColor("#94a3b8")
            .lineWidth(0.5)
            .moveTo(topStartX + 3, ty)
            .lineTo(topStartX + topW - 3, ty)
            .stroke();
        }

        // Sliding Sash Segments on Tracks
        let tCursorX = topStartX + 4;
        panels.forEach((p, pIdx) => {
          const ratio = (p.widthRatio || 1) / totalRatio;
          const pw = pIdx === panels.length - 1 ? topStartX + topW - 4 - tCursorX : (topW - 8) * ratio;
          const assignedTrack =
            trackCount === 4
              ? (pIdx % 4) + 1
              : trackCount === 3
              ? (pIdx % 3) + 1
              : trackCount === 2
              ? (pIdx % 2) + 1
              : 1;
          const ty = topY + assignedTrack * trackSpacing;
          const isMesh = p.kind === "SLIDE_MESH";

          doc
            .rect(tCursorX, ty - 2, pw, 4)
            .fillAndStroke(isMesh ? "#f1f5f9" : "#0f172a", "#1e293b");

          if (!isMesh) {
            // Glass centerline
            doc
              .strokeColor("#38bdf8")
              .lineWidth(0.7)
              .moveTo(tCursorX + 1, ty)
              .lineTo(tCursorX + pw - 1, ty)
              .stroke();
          }

          tCursorX += pw;
        });

        // Frame Depth Dimension on right
        doc.strokeColor("#64748b").lineWidth(0.5);
        doc.moveTo(topStartX + topW + 2, topY).lineTo(topStartX + topW + 6, topY).stroke();
        doc.moveTo(topStartX + topW + 2, topY + topH).lineTo(topStartX + topW + 6, topY + topH).stroke();
        doc.moveTo(topStartX + topW + 5, topY).lineTo(topStartX + topW + 5, topY + topH).stroke();
        doc
          .fillColor("#0f172a")
          .font("Helvetica-Bold")
          .fontSize(5.5)
          .text(`${frameDepthMm}mm`, topStartX + topW + 7, topY + topH / 2 - 3, {
            width: 32,
          });

        // Top View Label
        doc
          .fillColor(SLATE_MID)
          .font("Helvetica-Bold")
          .fontSize(6)
          .text(
            trackCount > 1
              ? `TOP VIEW (${trackCount} TRACK - ${frameDepthMm}mm FRAME DEPTH)`
              : `TOP VIEW (FRAME DEPTH ${frameDepthMm}mm)`,
            boxX,
            topY + topH + 4,
            { width: boxW, align: "center" }
          );
      }
    };

    const drawComponentCard = (
      comp: PdfQuotationData["components"][0],
      index: number,
      startY: number
    ): number => {
      const splitMultiEntries = (label: string, raw?: string | null): Array<[string, string]> => {
        if (!raw || !raw.trim()) return [];
        const parts = raw
          .split(/\r?\n|\|\||;/)
          .map((s) => s.trim())
          .filter(Boolean);
        return parts.map((p) => [label, p]);
      };

      const compCfg = parseDrawingConfig(
        comp.drawingConfigJson,
        comp.drawingType,
        comp.widthMm
      );

      // Part 1A: Product Details
      const detailRows: Array<[string, string]> = [
        ["Code", comp.code || "-"],
        ["Size", `W = ${comp.widthMm.toFixed(2)}; H = ${comp.heightMm.toFixed(2)}`],
        ["Name", comp.name || "-"],
        ["Profile System", comp.profileSystem || "-"],
        ["Location", comp.location || "-"],
        ["Glass", comp.glassType || "-"],
      ];

      if (
        comp.drawingType === "VENTILATION_FAN" ||
        comp.drawingType === "VENTILATION" ||
        /ventilation/i.test(comp.name) ||
        compCfg.hasSectionDimensions
      ) {
        const vMetrics = computeVentilationFanMetrics(comp.widthMm, comp.heightMm, compCfg);
        detailRows.splice(2, 0, [
          "Sections",
          `Fan: ${vMetrics.fanMm}W × ${vMetrics.topMm}H | Glass: ${vMetrics.rightTopMm}W × ${vMetrics.bottomMm}H mm`,
        ]);
      }

      // Part 1B: Computed Values (3 columns: Field | Value | Unit)
      const computedRows: Array<{ label: string; value: string; unit: string; highlight?: boolean }> = [
        { label: "Sq.Ft. per window", value: formatNumber(comp.sqFtPerUnit), unit: "Sq.Ft." },
        { label: "Value per Sq.Ft.", value: formatNumber(comp.ratePerSqFt), unit: "Rs." },
        { label: "Unit Price", value: formatNumber(comp.unitPrice), unit: "Rs.", highlight: true },
        { label: "Quantity", value: `${comp.quantity}`, unit: "Pcs" },
        { label: "Value", value: formatNumber(comp.totalValue), unit: "Rs.", highlight: true },
      ];

      // Part 2: Profile
      const profileRows: Array<[string, string]> = [];
      if (comp.profileColour?.trim()) profileRows.push(["Profile Color", comp.profileColour.trim()]);
      if (comp.meshType?.trim()) profileRows.push(["MeshType", comp.meshType.trim()]);
      if (comp.track?.trim()) profileRows.push(["Track", comp.track.trim()]);
      if (comp.trackRi?.trim()) profileRows.push(["Track RI", comp.trackRi.trim()]);
      if (comp.slidingSash?.trim()) profileRows.push(["Sliding Sash", comp.slidingSash.trim()]);
      if (comp.slidingSashRi?.trim()) profileRows.push(["Sliding Sash RI", comp.slidingSashRi.trim()]);
      if (comp.flymeshSash?.trim()) profileRows.push(["Flymesh Sash", comp.flymeshSash.trim()]);
      if (comp.mullionRi?.trim()) profileRows.push(["Mullion RI", comp.mullionRi.trim()]);

      // Part 3: Accessories (supports multiple entries per field)
      const accessoryRows: Array<[string, string]> = [
        ...splitMultiEntries("Locking", comp.locking),
        ...splitMultiEntries("Handle color", comp.handleColour),
        ...splitMultiEntries("Handle Type", comp.handleType),
        ...splitMultiEntries("Lockable Espag", comp.lockableEspag),
        ...splitMultiEntries("Roller", comp.rollerType),
        ...splitMultiEntries("Additional Accessories", comp.additionalAccess),
        ...splitMultiEntries("Remarks", comp.remarks),
      ];

      const headerH = 24;
      const sectionBarH = 15;
      const leftW = Math.round(CONTENT_W * 0.40); // 40% left drawing section
      const rightX = MARGIN + leftW + 5;
      const rightW = CONTENT_W - leftW - 10; // 60% right spec column
      const labelColW = 98;
      const valColW = rightW - labelColW - 12;

      const measure2Col = (rows: Array<[string, string]>) =>
        rows.map(([label, value]) => {
          doc.font("Helvetica").fontSize(7.5);
          const textH = doc.heightOfString(value, { width: valColW });
          const rowH = Math.max(13.5, Math.ceil(textH) + 5);
          return { label, value, rowH };
        });

      const measuredDetails = measure2Col(detailRows);
      const measuredProfile = measure2Col(profileRows);
      const measuredAccessories = measure2Col(accessoryRows);

      const compHeaderRowH = 14;
      const compRowH = 14;
      const computedTableH = compHeaderRowH + computedRows.length * compRowH;

      const detailsH = sectionBarH + measuredDetails.reduce((s, r) => s + r.rowH, 0);
      const computedH = sectionBarH + computedTableH;
      const profileH =
        measuredProfile.length > 0
          ? 5 + sectionBarH + measuredProfile.reduce((s, r) => s + r.rowH, 0)
          : 0;
      const accessoriesH =
        measuredAccessories.length > 0
          ? 5 + sectionBarH + measuredAccessories.reduce((s, r) => s + r.rowH, 0)
          : 0;

      const totalRightH = detailsH + 4 + computedH + profileH + accessoriesH;
      const cardH = Math.max(260, headerH + totalRightH + 12);

      // Page break check — never split drawing from spec tables across pages
      let y = startY;
      if (y + cardH > PAGE_H - 42) {
        doc.addPage();
        y = drawHeader();
      }

      // Outer Card Border
      doc
        .rect(MARGIN, y, CONTENT_W, cardH)
        .fill("#ffffff")
        .strokeColor(BORDER)
        .lineWidth(0.85)
        .stroke();

      // Card Header Bar (Warm Ivory background + Dark Forest-Green text)
      doc.rect(MARGIN, y, CONTENT_W, headerH).fill(SLATE_LIGHT);
      doc
        .moveTo(MARGIN, y + headerH)
        .lineTo(MARGIN + CONTENT_W, y + headerH)
        .strokeColor(BORDER)
        .lineWidth(0.75)
        .stroke();

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .text(
          `#${index + 1}  ${comp.code} — ${comp.name}`,
          MARGIN + 10,
          y + 7,
          { width: 310, ellipsis: true }
        );

      doc
        .fillColor(ACCENT)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
          comp.location ? `LOCATION: ${comp.location.toUpperCase()}` : comp.categoryName.toUpperCase(),
          MARGIN + 320,
          y + 8,
          { width: CONTENT_W - 330, align: "right" }
        );

      // Vertical Divider between 40% Left Drawing and 60% Right Spec Column
      const bodyY = y + headerH;
      const bodyH = cardH - headerH;
      doc
        .moveTo(MARGIN + leftW, bodyY)
        .lineTo(MARGIN + leftW, y + cardH)
        .strokeColor(BORDER)
        .lineWidth(0.75)
        .stroke();

      // Left 40% Section: Centered Proportional Technical Drawing
      drawVectorComponentDiagram(comp, MARGIN + 6, bodyY + 6, leftW - 12, bodyH - 12);

      // Helper to render a Forest-Green Section Header Bar
      const drawSectionBar = (title: string, sy: number) => {
        doc.rect(rightX, sy, rightW, sectionBarH).fill(ACCENT);
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text(title, rightX + 6, sy + 4, { width: rightW - 12 });
      };

      // Helper to render a 2-column wrapped specification table
      const draw2ColTable = (
        measured: Array<{ label: string; value: string; rowH: number }>,
        startRowY: number
      ): number => {
        const tableH = measured.reduce((s, r) => s + r.rowH, 0);
        let ty = startRowY;
        measured.forEach(({ label, value, rowH }, rIdx) => {
          doc.rect(rightX, ty, rightW, rowH).fill(rIdx % 2 === 1 ? "#f7f9f6" : "#ffffff");
          doc
            .fillColor(SLATE_MID)
            .font("Helvetica-Bold")
            .fontSize(7.2)
            .text(label, rightX + 5, ty + 3, { width: labelColW });
          doc
            .fillColor(SLATE_DARK)
            .font("Helvetica")
            .fontSize(7.5)
            .text(value, rightX + labelColW + 8, ty + 3, { width: valColW });

          doc
            .moveTo(rightX, ty + rowH)
            .lineTo(rightX + rightW, ty + rowH)
            .strokeColor(BORDER)
            .lineWidth(0.45)
            .stroke();
          ty += rowH;
        });

        // Outer border and vertical column divider
        doc
          .rect(rightX, startRowY, rightW, tableH)
          .strokeColor(BORDER)
          .lineWidth(0.55)
          .stroke();
        doc
          .moveTo(rightX + labelColW + 4, startRowY)
          .lineTo(rightX + labelColW + 4, startRowY + tableH)
          .strokeColor(BORDER)
          .lineWidth(0.45)
          .stroke();

        return ty;
      };

      // Right 60% Section: Three-Part Specification Layout
      let ry = bodyY + 6;

      // PART 1A: PRODUCT DETAILS
      drawSectionBar("PRODUCT DETAILS", ry);
      ry += sectionBarH;
      ry = draw2ColTable(measuredDetails, ry);

      // PART 1B: COMPUTED VALUES (3-column table)
      ry += 4;
      drawSectionBar("COMPUTED VALUES", ry);
      ry += sectionBarH;

      const compTableStartY = ry;
      const unitColW = 44;
      const valNumColW = 78;
      const fieldColW = rightW - unitColW - valNumColW;

      // Sub-header row
      doc.rect(rightX, ry, rightW, compHeaderRowH).fill(SLATE_LIGHT);
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(7.2);
      doc.text("Field", rightX + 5, ry + 3.5, { width: fieldColW - 8 });
      doc.text("Value", rightX + fieldColW, ry + 3.5, { width: valNumColW - 6, align: "right" });
      doc.text("Unit", rightX + fieldColW + valNumColW + 4, ry + 3.5, { width: unitColW - 8 });
      doc
        .moveTo(rightX, ry + compHeaderRowH)
        .lineTo(rightX + rightW, ry + compHeaderRowH)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();
      ry += compHeaderRowH;

      computedRows.forEach(({ label, value, unit, highlight }, rIdx) => {
        const bg = highlight ? "#eaf1ec" : rIdx % 2 === 1 ? "#f7f9f6" : "#ffffff";
        doc.rect(rightX, ry, rightW, compRowH).fill(bg);

        doc
          .fillColor(highlight ? NAVY : SLATE_MID)
          .font(highlight ? "Helvetica-Bold" : "Helvetica-Bold")
          .fontSize(7.3)
          .text(label, rightX + 5, ry + 3.5, { width: fieldColW - 8 });

        doc
          .fillColor(highlight ? NAVY : SLATE_DARK)
          .font(highlight ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.6)
          .text(value, rightX + fieldColW, ry + 3.5, {
            width: valNumColW - 6,
            align: "right",
          });

        doc
          .fillColor(highlight ? NAVY : SLATE_MID)
          .font(highlight ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.2)
          .text(unit, rightX + fieldColW + valNumColW + 4, ry + 3.5, {
            width: unitColW - 8,
          });

        doc
          .moveTo(rightX, ry + compRowH)
          .lineTo(rightX + rightW, ry + compRowH)
          .strokeColor(BORDER)
          .lineWidth(0.45)
          .stroke();
        ry += compRowH;
      });

      doc
        .rect(rightX, compTableStartY, rightW, computedTableH)
        .strokeColor(BORDER)
        .lineWidth(0.55)
        .stroke();
      doc
        .moveTo(rightX + fieldColW, compTableStartY)
        .lineTo(rightX + fieldColW, compTableStartY + computedTableH)
        .strokeColor(BORDER)
        .lineWidth(0.45)
        .stroke();
      doc
        .moveTo(rightX + fieldColW + valNumColW, compTableStartY)
        .lineTo(rightX + fieldColW + valNumColW, compTableStartY + computedTableH)
        .strokeColor(BORDER)
        .lineWidth(0.45)
        .stroke();

      // PART 2: PROFILE (hidden if empty)
      if (measuredProfile.length > 0) {
        ry += 5;
        drawSectionBar("PROFILE", ry);
        ry += sectionBarH;
        ry = draw2ColTable(measuredProfile, ry);
      }

      // PART 3: ACCESSORIES (hidden if empty)
      if (measuredAccessories.length > 0) {
        ry += 5;
        drawSectionBar("ACCESSORIES", ry);
        ry += sectionBarH;
        ry = draw2ColTable(measuredAccessories, ry);
      }

      return y + cardH + 10;
    };

    const drawLogoImage = (x: number, y: number, size: number): boolean => {
      if (company.logoUrl && !company.logoUrl.endsWith(".svg")) {
        const localPath = path.join(
          process.cwd(),
          "public",
          company.logoUrl.replace(/^\//, "")
        );
        if (fs.existsSync(localPath)) {
          try {
            doc.image(localPath, x, y, { fit: [size, size] });
            return true;
          } catch {
            return false;
          }
        }
      }
      return false;
    };

    const drawIntroductionPage = () => {
      // Subtle Warm Ivory top header band
      doc.rect(0, 0, PAGE_W, 130).fill("#F3F0E3");
      doc
        .moveTo(MARGIN, 130)
        .lineTo(PAGE_W - MARGIN, 130)
        .strokeColor(ACCENT)
        .lineWidth(2)
        .stroke();

      // Logo
      const drawn = drawLogoImage(MARGIN, 34, 62);
      if (!drawn) {
        doc.rect(MARGIN, 34, 58, 58).fill(NAVY);
        doc
          .fillColor("#F3F0E3")
          .font("Helvetica-Bold")
          .fontSize(20)
          .text("ET", MARGIN, 53, { width: 58, align: "center" });
      }

      // Company Name & Contact Info
      const textX = MARGIN + 76;
      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("ELITE TRADING", textX, 34);

      doc
        .fillColor(SLATE_DARK)
        .font("Helvetica")
        .fontSize(8.5)
        .text("Website: elitetradingfd.com", textX, 62)
        .text("Email: elitetrading.contactus@gmail.com   |   Phone: +91 9755036143", textX, 75)
        .text(
          "Address: Shop 8, Jasmine Park, opposite RDB Building, Bijalpur, Indore, Madhya Pradesh 452012, India",
          textX,
          88,
          { width: CONTENT_W - 76 }
        );

      // Quotation Information Box
      let y = 154;
      doc
        .rect(MARGIN, y, CONTENT_W, 88)
        .fill("#FFFFFF")
        .strokeColor(BORDER)
        .lineWidth(1)
        .stroke();

      doc.rect(MARGIN, y, 4, 88).fill(ACCENT);

      doc
        .fillColor(ACCENT)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text("PROPOSAL & QUOTATION REFERENCE", MARGIN + 14, y + 10);

      doc
        .fillColor(SLATE_MID)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text("Quotation Number:", MARGIN + 14, y + 28)
        .text("Date:", MARGIN + 300, y + 28)
        .text("Customer Name:", MARGIN + 14, y + 45)
        .text("Project Name:", MARGIN + 14, y + 62)
        .text("Site Address:", MARGIN + 300, y + 45);

      doc
        .fillColor(SLATE_DARK)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(quotation.quotationNumber, MARGIN + 105, y + 28, { width: 180 })
        .text(formatDate(quotation.quotationDate), MARGIN + 335, y + 28, { width: 180 })
        .text(quotation.customer.name, MARGIN + 105, y + 45, { width: 185, ellipsis: true })
        .text(quotation.project?.name || "Architectural Glass & Door System", MARGIN + 105, y + 62, { width: 185, ellipsis: true });

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .text(quotation.siteLocation || quotation.project?.siteAddress || "-", MARGIN + 365, y + 45, {
          width: 155,
          height: 36,
        });

      // Subtle Forest-Green Divider
      y += 110;
      doc
        .moveTo(MARGIN, y)
        .lineTo(MARGIN + 90, y)
        .strokeColor(ACCENT)
        .lineWidth(2.5)
        .stroke();
      doc
        .moveTo(MARGIN + 90, y)
        .lineTo(PAGE_W - MARGIN, y)
        .strokeColor(BORDER)
        .lineWidth(0.75)
        .stroke();

      y += 28;

      // Exact Introduction Letter Content (Left-aligned)
      doc
        .fillColor(ACCENT)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Dear Customer,", MARGIN, y);
      y += 26;

      const paragraphs = [
        "We are delighted that you are considering our range of Windows and Doors for your premises.",
        "It has gained rapid acceptance across all cities of India for the overwhelming advantages of better protection from noise, heat, rain, dust and pollution.",
        "In drawing this proposal, it has been our endeavor to suggest designs which would enhance your comfort and aesthetics from inside and improve the facade of the building.",
        "It has a well-established service network to deliver seamless service at your doorstep. Our offer comprises of the following in enclosure for your kind perusal:",
      ];

      doc.fillColor(SLATE_DARK).font("Helvetica").fontSize(10.5);
      for (const p of paragraphs) {
        doc.text(p, MARGIN, y, {
          width: CONTENT_W,
          align: "left",
          lineGap: 5,
        });
        y = doc.y + 14;
      }

      // Enclosures a & b
      doc
        .fillColor(SLATE_DARK)
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text("a.  Window design, specification and value", MARGIN + 22, y, {
          width: CONTENT_W - 22,
        });
      y = doc.y + 8;
      doc.text("b.  Terms and Conditions", MARGIN + 22, y, {
        width: CONTENT_W - 22,
      });
      y = doc.y + 22;

      doc
        .fillColor(SLATE_DARK)
        .font("Helvetica")
        .fontSize(10.5)
        .text("We now look forward to be of service to you.", MARGIN, y, {
          width: CONTENT_W,
        });

      y = doc.y + 44;

      // Highlighted Authorized Signatory
      doc
        .moveTo(MARGIN, y)
        .lineTo(MARGIN + 150, y)
        .strokeColor(ACCENT)
        .lineWidth(1)
        .stroke();
      doc
        .fillColor(ACCENT)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Authorized Signatory", MARGIN, y + 8);
      doc
        .fillColor(SLATE_MID)
        .font("Helvetica")
        .fontSize(9)
        .text("For ELITE TRADING", MARGIN, y + 24);
    };

    // PAGE 1: Introduction Letter
    drawIntroductionPage();

    // PAGE 2+: Technical Quotation Details
    doc.addPage();
    let curY = drawHeader();

    quotation.components.forEach((comp, idx) => {
      curY = drawComponentCard(comp, idx, curY);
    });

    // Final Summary Section (check space)
    const summaryNeededH = 310;
    if (curY + summaryNeededH > PAGE_H - 42) {
      doc.addPage();
      curY = drawHeader();
    }

    // Quote Total Summary Box
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("QUOTE TOTAL SUMMARY", MARGIN, curY);
    curY += 16;

    const sumRows: Array<[string, string, boolean?]> = [
      ["No. of Components", `${quotation.totalComponents} Pcs`],
      ["Total Area (Sq.Ft.)", `${formatNumber(quotation.totalSqFt)} Sq.Ft.`],
      ["Average Value per Sq.Ft.", pdfMoney(quotation.avgRatePerSqFt)],
      ["Total Project Cost", pdfMoney(quotation.subtotal)],
    ];

    if (quotation.discountAmount > 0) {
      sumRows.push([
        `Discount (${quotation.discountType === "PERCENT" ? quotation.discountValue + "%" : "Fixed"})`,
        `- ${pdfMoney(quotation.discountAmount)}`,
      ]);
    }
    if (quotation.transportCharges > 0) {
      sumRows.push(["Transportation Charges", pdfMoney(quotation.transportCharges)]);
    }
    if (quotation.installationCharges > 0) {
      sumRows.push(["Installation Charges", pdfMoney(quotation.installationCharges)]);
    }
    if (quotation.otherCharges > 0) {
      sumRows.push(["Other Charges", pdfMoney(quotation.otherCharges)]);
    }

    sumRows.push([
      `GST (${quotation.gstPercent}% – ${quotation.taxTreatment})`,
      pdfMoney(quotation.gstAmount),
    ]);
    sumRows.push(["GRAND TOTAL", pdfMoney(quotation.grandTotal), true]);

    const sRowH = 18;
    const sumBoxW = 300;
    const sumBoxX = MARGIN + CONTENT_W - sumBoxW;

    // Left of summary: Bank & Remarks
    doc
      .rect(MARGIN, curY, CONTENT_W - sumBoxW - 14, sumRows.length * sRowH)
      .fill("#f8fafc")
      .strokeColor(BORDER)
      .lineWidth(0.75)
      .stroke();

    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("BANK & PAYMENT DETAILS", MARGIN + 8, curY + 8);
    doc
      .fillColor(SLATE_MID)
      .font("Helvetica")
      .fontSize(7.5)
      .text(`Bank: ${company.bankName || "HDFC Bank"}`, MARGIN + 8, curY + 22)
      .text(`A/C No: ${company.bankAccountNumber || "-"}`, MARGIN + 8, curY + 34)
      .text(`IFSC: ${company.bankIfsc || "-"}`, MARGIN + 8, curY + 46);

    if (quotation.remarks) {
      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("REMARKS", MARGIN + 8, curY + 64);
      doc
        .fillColor(SLATE_MID)
        .font("Helvetica")
        .fontSize(7.5)
        .text(quotation.remarks, MARGIN + 8, curY + 76, {
          width: CONTENT_W - sumBoxW - 30,
        });
    }

    // Right: Totals Table
    let sy = curY;
    sumRows.forEach(([label, val, isGrand]) => {
      if (isGrand) {
        doc.rect(sumBoxX, sy, sumBoxW, sRowH).fill(NAVY);
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .text(label, sumBoxX + 10, sy + 5, { width: 150 });
        doc.text(val, sumBoxX + 160, sy + 5, { width: 130, align: "right" });
      } else {
        doc
          .rect(sumBoxX, sy, sumBoxW, sRowH)
          .fill("#ffffff")
          .strokeColor(BORDER)
          .lineWidth(0.5)
          .stroke();
        doc
          .fillColor(SLATE_MID)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text(label, sumBoxX + 10, sy + 5, { width: 150 });
        doc
          .fillColor(SLATE_DARK)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(val, sumBoxX + 160, sy + 5, { width: 130, align: "right" });
      }
      sy += sRowH;
    });

    curY = sy + 24;

    // Signatures on Summary Page
    const sigY = Math.max(curY + 12, PAGE_H - 95);
    doc
      .moveTo(MARGIN, sigY)
      .lineTo(MARGIN + 180, sigY)
      .strokeColor(SLATE_MID)
      .lineWidth(0.75)
      .stroke();
    doc
      .fillColor(SLATE_DARK)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("Customer Acceptance & Signature", MARGIN, sigY + 5);

    doc
      .moveTo(MARGIN + CONTENT_W - 180, sigY)
      .lineTo(MARGIN + CONTENT_W, sigY)
      .strokeColor(SLATE_MID)
      .lineWidth(0.75)
      .stroke();
    doc
      .fillColor(SLATE_DARK)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(`For ${company.companyName} (Authorized Signatory)`, MARGIN + CONTENT_W - 180, sigY + 5, {
        width: 180,
        align: "right",
      });

    // FINAL PAGE(S): GENERAL TERMS AND CONDITIONS
    const drawTermsHeader = (isContinuation = false): number => {
      if (!isContinuation) {
        doc.rect(0, 0, PAGE_W, 56).fill("#F3F0E3");
        doc
          .moveTo(MARGIN, 56)
          .lineTo(PAGE_W - MARGIN, 56)
          .strokeColor(ACCENT)
          .lineWidth(1.5)
          .stroke();

        const drawn = drawLogoImage(MARGIN, 12, 32);
        if (!drawn) {
          doc.rect(MARGIN, 12, 32, 32).fill(NAVY);
          doc
            .fillColor("#F3F0E3")
            .font("Helvetica-Bold")
            .fontSize(11)
            .text("ET", MARGIN, 23, { width: 32, align: "center" });
        }

        doc
          .fillColor(NAVY)
          .font("Helvetica-Bold")
          .fontSize(13)
          .text("GENERAL TERMS AND CONDITIONS", MARGIN + 42, 16);
        doc
          .fillColor(SLATE_MID)
          .font("Helvetica")
          .fontSize(7.5)
          .text(
            `Quotation: ${quotation.quotationNumber}  |  ELITE TRADING (${company.website})`,
            MARGIN + 42,
            34
          );

        return 72;
      } else {
        // Continuation page: Minimal subtle runner rule keeping main heading on the first page
        doc.rect(0, 0, PAGE_W, 24).fill("#F3F0E3");
        doc
          .moveTo(MARGIN, 24)
          .lineTo(PAGE_W - MARGIN, 24)
          .strokeColor(BORDER)
          .lineWidth(0.75)
          .stroke();
        doc
          .fillColor(SLATE_MID)
          .font("Helvetica")
          .fontSize(7.5)
          .text(
            `Quotation: ${quotation.quotationNumber}  |  General Terms and Conditions (contd.)`,
            MARGIN,
            8
          );

        return 38;
      }
    };

    interface TermSubItem {
      label: string;
      text: string;
    }

    interface TermClause {
      num: string;
      boldHeading?: string;
      text?: string;
      subItems?: TermSubItem[];
      noteText?: string;
    }

    const TERMS_CLAUSES: TermClause[] = [
      {
        num: "1.",
        text: "GST and other Levies is excluding in above rates it will charge as applicable. Any further changes thereof shall be borne by client.",
      },
      {
        num: "2.",
        text: "Any Demarcations, scratches and damages on windows & doors during masonry or any other works shall be replaced only on request and the costs incurred to be borne by the client.",
      },
      {
        num: "3.",
        boldHeading: "Warranties:",
        subItems: [
          {
            label: "i.",
            text: "White Profile Make of PROMINANCE Brand comes with a 20 years warranty, same will be provided by Original Manufacturer to End Client.",
          },
          {
            label: "ii.",
            text: "Color Laminate Profile Make of PROMINANCE Brand comes with a 20 years warranty, same will be provided by Original Manufacturer to End Client.",
          },
          {
            label: "iii.",
            text: "5 Years Hardware Performance Warranty for any kind of Manufacturing Defect Reported.",
          },
          {
            label: "iv.",
            text: "1 Year After Sales Warranty whereas No labour charges for any kind of repairing.",
          },
        ],
        noteText:
          "There is no warranty for any kind of breakage happened accidentally in window, and repairing for the same will be charge extra as per actual.",
      },
      {
        num: "4.",
        text: "There is no warranty offered on any glass breakage, Mosquito Mesh and on regular wear and tear.",
      },
      {
        num: "5.",
        text: "The quotation is valid for 15 days from the date of offer. If any changes in raw material price we will provide a supplementary quotation before finalizing the order, we request you please confirm once before finalizing any order.",
      },
      {
        num: "6.",
        text: "Window size will be 2-3mm smaller than the actual size on all 4 sides for proper installation, tolerance level upto (+) 0mm & (-) 5mm.",
      },
      {
        num: "7.",
        text: "Clear Openings of walls should be in line level and in plumb, if rectification required is to be done by client so that minimum gaps can be maintained. Pre & Post inspection of site will be jointly carried out by our and client supervisor.",
      },
      {
        num: "8.",
        text: "Quoted price and rate of an individual window will be recalculated if there is more than 50MM varies on in height or in width of a window at the time of final measurement compared to design dimension.",
      },
      {
        num: "9.",
        text: "Complete fabricated windows and doors dispatched with adequate packing from our works.",
      },
      {
        num: "10.",
        text: "Safe and lockable storage area is to be provided by the client on site at the time of delivery upto installation. Security and safety of stored material is in client's responsibility.",
      },
      {
        num: "11.",
        text: "Installation will only begin once site is cleared by our personnel. This is to ensure that windows provided will face less harsh condition at site once installed and chances of damage to windows should be minimal.",
      },
      {
        num: "12.",
        text: "Protection tape should be removed immediately while installation however tape can be kept for a maximum of 15 days after installation on the request of client. The same is to be removed by client's representative. We will not be responsible for transfer of any adhesive/glue marks on the profile and will not be liable to clean the same.",
      },
      {
        num: "13.",
        text: "Our scope is restricted to supply of windows and its installation only, no civil work, carpentry or MS Fabrication work will be done by us. If installation location is other than Indore city, freight will be charged extra as actual, and installation team lodging is in client scope or it will be charged extra as actual.",
      },
      {
        num: "14.",
        text: "We are not responsible for delay in installation cause by nature's act / any other working agency on site / from client side or any other condition such as strikes/breakdown/no entry areas / Lockdown / Force Majeure etc.",
      },
      {
        num: "15.",
        text: "Electricity and scaffolding are to be provided by client on site wherever required, or it will be charged extra cost.",
      },
      {
        num: "16.",
        text: "On completion of work from our side customer is requested to check the installed windows / doors carefully and sign on completion certificate, if any manufacturing defect reported is to communicate within 2 days of inspection.",
      },
      {
        num: "17.",
        text: "If any changes in details and drawings of window material is to be communicate before production schedule and cost of changes will be borne by client else it will not entertain without financial consideration.",
      },
      {
        num: "18.",
        text: "Transportation of Goods will be charged extra as per actual.",
      },
      {
        num: "19.",
        boldHeading: "Payment terms:",
        subItems: [
          {
            label: "i.",
            text: "50% advance payment along with confirmed order.",
          },
          {
            label: "ii.",
            text: "45% is to pay before dispatch, against inspection at our workshop with prior intimation.",
          },
          {
            label: "iii.",
            text: "Remaining after work completion.",
          },
        ],
      },
      {
        num: "20.",
        text: "Errors and Omissions expected (E & O E).",
      },
    ];

    const computeClauseHeight = (clause: TermClause): number => {
      doc.font("Helvetica").fontSize(8.5);
      let h = 0;
      if (clause.text) {
        h = doc.heightOfString(clause.text, {
          width: CONTENT_W - 22,
          lineGap: 2.2,
        });
      } else if (clause.boldHeading) {
        h += 13;
        if (clause.subItems) {
          for (const sub of clause.subItems) {
            h += doc.heightOfString(sub.text, {
              width: CONTENT_W - 54,
              lineGap: 2,
            }) + 3;
          }
        }
        if (clause.noteText) {
          h += 2;
          h += doc.heightOfString(`Note: ${clause.noteText}`, {
            width: CONTENT_W - 36,
            lineGap: 2,
          }) + 2;
        }
      }
      return h + 6;
    };

    doc.addPage();
    let ty = drawTermsHeader(false);
    const MAX_TERMS_Y = PAGE_H - 42;

    const ensureTermsSpace = (needed: number) => {
      if (ty + needed > MAX_TERMS_Y) {
        doc.addPage();
        ty = drawTermsHeader(true);
      }
    };

    for (const item of TERMS_CLAUSES) {
      const clauseH = computeClauseHeight(item);
      ensureTermsSpace(clauseH);

      if (item.subItems) {
        // Draw Number & Bold Label
        doc
          .fillColor(ACCENT)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(item.num, MARGIN, ty, { width: 22 });
        doc
          .fillColor(NAVY)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(item.boldHeading || "", MARGIN + 22, ty);
        ty = doc.y + 3;

        // Draw Sub-items (i, ii, iii, iv) with clean indentation
        for (const sub of item.subItems) {
          doc
            .fillColor(ACCENT)
            .font("Helvetica-Bold")
            .fontSize(8.5)
            .text(sub.label, MARGIN + 36, ty, { width: 18 });
          doc
            .fillColor(SLATE_DARK)
            .font("Helvetica")
            .fontSize(8.5)
            .text(sub.text, MARGIN + 54, ty, {
              width: CONTENT_W - 54,
              lineGap: 2,
            });
          ty = doc.y + 3;
        }

        // Draw Note if present
        if (item.noteText) {
          ty += 2;
          doc
            .fillColor(NAVY)
            .font("Helvetica-Bold")
            .fontSize(8.5)
            .text("Note: ", MARGIN + 36, ty, { continued: true });
          doc
            .fillColor(SLATE_DARK)
            .font("Helvetica")
            .fontSize(8.5)
            .text(item.noteText, {
              width: CONTENT_W - 36,
              lineGap: 2,
            });
          ty = doc.y + 3;
        }

        ty += 4;
      } else {
        // Regular numbered clause
        doc
          .fillColor(ACCENT)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(item.num, MARGIN, ty, { width: 22 });

        doc
          .fillColor(SLATE_DARK)
          .font("Helvetica")
          .fontSize(8.5)
          .text(item.text || "", MARGIN + 22, ty, {
            width: CONTENT_W - 22,
            lineGap: 2.2,
          });

        ty = doc.y + 5;
      }
    }

    // Page Numbers Footer on all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fillColor(SLATE_MID)
        .font("Helvetica")
        .fontSize(7)
        .text(
          `${company.companyName}  |  ${company.address}  |  ${company.website}`,
          MARGIN,
          PAGE_H - 24,
          { width: CONTENT_W - 80 }
        );
      doc.text(
        `Page ${i + 1} of ${range.count}`,
        MARGIN + CONTENT_W - 80,
        PAGE_H - 24,
        { width: 80, align: "right" }
      );
    }

    doc.end();
  });
}

