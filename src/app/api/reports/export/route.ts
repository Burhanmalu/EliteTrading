import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const format = String(body.format || "csv").toLowerCase(); // csv, xlsx, pdf
    const title = String(body.title || "EliteTrading Report");
    const columns: string[] = Array.isArray(body.columns) ? body.columns : [];
    const rows: Array<Record<string, unknown>> = Array.isArray(body.rows) ? body.rows : [];

    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${title.replace(/\s+/g, "_")}.xlsx"`,
        },
      });
    }

    if (format === "csv") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${title.replace(/\s+/g, "_")}.csv"`,
        },
      });
    }

    // PDF Export
    const pdfBuf = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 32 });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fillColor("#0f2744").font("Helvetica-Bold").fontSize(15).text("ELITETRADING ERP", 32, 28);
      doc.fillColor("#334155").font("Helvetica-Bold").fontSize(11).text(title, 32, 48);
      doc
        .fillColor("#64748b")
        .font("Helvetica")
        .fontSize(8)
        .text(`Generated: ${new Date().toLocaleString("en-IN")}`, 32, 63);

      const keys = columns.length > 0 ? columns : rows[0] ? Object.keys(rows[0]) : [];
      const tableW = 777;
      const colW = keys.length > 0 ? tableW / keys.length : tableW;
      let y = 85;

      // Header row
      doc.rect(32, y, tableW, 20).fill("#0f2744");
      keys.forEach((k, idx) => {
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text(String(k).toUpperCase(), 36 + idx * colW, y + 6, {
            width: colW - 8,
            ellipsis: true,
          });
      });
      y += 20;

      rows.forEach((row, rIdx) => {
        if (y > 540) {
          doc.addPage();
          y = 36;
        }
        if (rIdx % 2 === 1) {
          doc.rect(32, y, tableW, 18).fill("#f8fafc");
        }
        keys.forEach((k, idx) => {
          doc
            .fillColor("#1e293b")
            .font("Helvetica")
            .fontSize(7.5)
            .text(String(row[k] ?? "-"), 36 + idx * colW, y + 5, {
              width: colW - 8,
              ellipsis: true,
            });
        });
        y += 18;
      });

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Report export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

