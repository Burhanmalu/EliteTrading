import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const customerId = searchParams.get("customerId");
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const categoryName = searchParams.get("categoryName");
  const brandName = searchParams.get("brandName");

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    where.quotationDate = dateFilter;
  }
  if (customerId && customerId !== "ALL") where.customerId = customerId;
  if (projectId && projectId !== "ALL") where.projectId = projectId;
  if (status && status !== "ALL") where.status = status;

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, customerCode: true, city: true } },
      project: { select: { id: true, name: true, projectCode: true } },
      components: true,
    },
    orderBy: { quotationDate: "desc" },
  });

  // Filter components by category/brand if specified
  const filteredQuotations = quotations.filter((q) => {
    if (!categoryName || categoryName === "ALL") {
      if (!brandName || brandName === "ALL") return true;
    }
    return q.components.some((c) => {
      const catOk = !categoryName || categoryName === "ALL" || c.categoryName === categoryName;
      const brandOk = !brandName || brandName === "ALL" || c.brandName === brandName;
      return catOk && brandOk;
    });
  });

  // 1. Customer-wise
  const customerMap = new Map<
    string,
    { customerName: string; code: string; quotations: number; totalSqFt: number; totalValue: number; approvedValue: number }
  >();
  for (const q of filteredQuotations) {
    const cur = customerMap.get(q.customerId) || {
      customerName: q.customer.name,
      code: q.customer.customerCode,
      quotations: 0,
      totalSqFt: 0,
      totalValue: 0,
      approvedValue: 0,
    };
    cur.quotations += 1;
    cur.totalSqFt += q.totalSqFt;
    cur.totalValue += q.grandTotal;
    if (q.status === "Approved") cur.approvedValue += q.grandTotal;
    customerMap.set(q.customerId, cur);
  }

  // 2. Project-wise
  const projectMap = new Map<
    string,
    { projectName: string; code: string; customerName: string; quotations: number; totalSqFt: number; totalValue: number }
  >();
  for (const q of filteredQuotations) {
    const pKey = q.projectId || "pending-project";
    const cur = projectMap.get(pKey) || {
      projectName: q.project?.name || "Pending Project Creation",
      code: q.project?.projectCode || "-",
      customerName: q.customer.name,
      quotations: 0,
      totalSqFt: 0,
      totalValue: 0,
    };
    cur.quotations += 1;
    cur.totalSqFt += q.totalSqFt;
    cur.totalValue += q.grandTotal;
    projectMap.set(pKey, cur);
  }

  // 3. Monthly report
  const monthlyMap = new Map<
    string,
    { month: string; count: number; totalSqFt: number; subtotal: number; gst: number; grandTotal: number }
  >();
  for (const q of filteredQuotations) {
    const d = new Date(q.quotationDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    const cur = monthlyMap.get(key) || {
      month: label,
      count: 0,
      totalSqFt: 0,
      subtotal: 0,
      gst: 0,
      grandTotal: 0,
    };
    cur.count += 1;
    cur.totalSqFt += q.totalSqFt;
    cur.subtotal += q.subtotal;
    cur.gst += q.gstAmount;
    cur.grandTotal += q.grandTotal;
    monthlyMap.set(key, cur);
  }

  // 4. Approved vs Rejected
  const statusMap = new Map<string, { status: string; count: number; totalValue: number; totalSqFt: number }>();
  for (const q of filteredQuotations) {
    const cur = statusMap.get(q.status) || {
      status: q.status,
      count: 0,
      totalValue: 0,
      totalSqFt: 0,
    };
    cur.count += 1;
    cur.totalValue += q.grandTotal;
    cur.totalSqFt += q.totalSqFt;
    statusMap.set(q.status, cur);
  }

  // 5. Product-wise & 6. Brand-wise
  const productMap = new Map<
    string,
    { productName: string; category: string; brand: string; units: number; totalSqFt: number; totalValue: number }
  >();
  const brandMap = new Map<
    string,
    { brandName: string; units: number; totalSqFt: number; totalValue: number }
  >();

  for (const q of filteredQuotations) {
    for (const c of q.components) {
      if (categoryName && categoryName !== "ALL" && c.categoryName !== categoryName) continue;
      if (brandName && brandName !== "ALL" && c.brandName !== brandName) continue;

      const pKey = `${c.name}__${c.categoryName}`;
      const pCur = productMap.get(pKey) || {
        productName: c.name,
        category: c.categoryName,
        brand: c.brandName || "Standard",
        units: 0,
        totalSqFt: 0,
        totalValue: 0,
      };
      pCur.units += c.quantity;
      pCur.totalSqFt += c.sqFtPerUnit * c.quantity;
      pCur.totalValue += c.totalValue;
      productMap.set(pKey, pCur);

      const bName = c.brandName || "Unbranded / Custom";
      const bCur = brandMap.get(bName) || {
        brandName: bName,
        units: 0,
        totalSqFt: 0,
        totalValue: 0,
      };
      bCur.units += c.quantity;
      bCur.totalSqFt += c.sqFtPerUnit * c.quantity;
      bCur.totalValue += c.totalValue;
      brandMap.set(bName, bCur);
    }
  }

  // 7, 8, 9: SqFt, GST, Total Value rows
  const quotationRows = filteredQuotations.map((q) => ({
    quotationNumber: q.quotationNumber,
    date: q.quotationDate,
    customerName: q.customer.name,
    projectName: q.project?.name || "Pending Project Creation",
    status: q.status,
    totalComponents: q.totalComponents,
    totalSqFt: Number(q.totalSqFt.toFixed(2)),
    avgRate: Number(q.avgRatePerSqFt.toFixed(2)),
    subtotal: Number(q.subtotal.toFixed(2)),
    gstPercent: q.gstPercent,
    gstAmount: Number(q.gstAmount.toFixed(2)),
    grandTotal: Number(q.grandTotal.toFixed(2)),
  }));

  return NextResponse.json({
    customerWise: Array.from(customerMap.values()),
    projectWise: Array.from(projectMap.values()),
    monthly: Array.from(monthlyMap.values()),
    approvalSummary: Array.from(statusMap.values()),
    productWise: Array.from(productMap.values()),
    brandWise: Array.from(brandMap.values()),
    quotationRows,
  });
}

