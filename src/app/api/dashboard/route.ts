import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalCustomers,
    totalProjects,
    activeProjects,
    quotations,
    projects,
    recentCustomers,
    recentProjects,
    recentQuotations,
    approvedQuotationsList,
    upcomingInstallations,
    completedInstallationsCount,
    recentLogs,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.project.count(),
    prisma.project.count({
      where: {
        status: {
          notIn: ["Completed", "Cancelled"],
        },
      },
    }),
    prisma.quotation.findMany({
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        grandTotal: true,
        totalSqFt: true,
        quotationDate: true,
        customer: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { quotationDate: "desc" },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.customer.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, customerCode: true, name: true, city: true, mobile: true, createdAt: true },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
        approvedQuotation: { select: { quotationNumber: true, grandTotal: true } },
      },
    }),
    prisma.quotation.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        grandTotal: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.quotation.findMany({
      where: { status: "Approved" },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        quotationNumber: true,
        grandTotal: true,
        updatedAt: true,
        customer: { select: { name: true } },
        convertedProject: { select: { id: true, projectCode: true } },
      },
    }),
    prisma.installationSchedule.findMany({
      where: {
        installationDate: { not: null },
        status: { in: ["Scheduled", "Rescheduled", "Installation In Progress"] },
      },
      take: 6,
      orderBy: { installationDate: "asc" },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            siteAddress: true,
            customer: { select: { name: true, mobile: true } },
          },
        },
      },
    }),
    prisma.installationSchedule.count({
      where: { status: "Completed" },
    }),
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const totalQuotations = quotations.length;
  const awaitingApproval = quotations.filter((q) => q.status === "Sent").length;
  const approvedQuotations = quotations.filter((q) => q.status === "Approved").length;
  const rejectedQuotations = quotations.filter((q) => q.status === "Rejected").length;
  const totalQuotationValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const totalApprovedValue = quotations
    .filter((q) => q.status === "Approved")
    .reduce((sum, q) => sum + (q.grandTotal || 0), 0);

  // Build 6-month series
  const now = new Date();
  const months: Array<{
    key: string;
    label: string;
    quotationValue: number;
    approvedValue: number;
    quotationCount: number;
    projectCount: number;
  }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    months.push({
      key,
      label,
      quotationValue: 0,
      approvedValue: 0,
      quotationCount: 0,
      projectCount: 0,
    });
  }

  for (const q of quotations) {
    const d = new Date(q.quotationDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) {
      bucket.quotationValue += q.grandTotal || 0;
      bucket.quotationCount += 1;
      if (q.status === "Approved") {
        bucket.approvedValue += q.grandTotal || 0;
      }
    }
  }

  for (const p of projects) {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) {
      bucket.projectCount += 1;
    }
  }

  // Quotation status breakdown
  const quotationStatusCounts: Record<string, number> = {
    Draft: 0,
    Sent: 0,
    Approved: 0,
    Rejected: 0,
    Expired: 0,
  };
  for (const q of quotations) {
    quotationStatusCounts[q.status] = (quotationStatusCounts[q.status] || 0) + 1;
  }

  // Project status distribution
  const projectStatusMap: Record<string, number> = {};
  for (const p of projects) {
    projectStatusMap[p.status] = (projectStatusMap[p.status] || 0) + 1;
  }

  return NextResponse.json({
    summary: {
      totalCustomers,
      totalProjects,
      activeProjects,
      totalQuotations,
      pendingQuotations: awaitingApproval,
      awaitingApproval,
      approvedQuotations,
      rejectedQuotations,
      totalQuotationValue,
      totalApprovedValue,
      upcomingInstallationsCount: upcomingInstallations.length,
      completedInstallationsCount,
    },
    charts: {
      monthly: months,
      quotationStatus: Object.entries(quotationStatusCounts).map(
        ([status, count]) => ({ status, count })
      ),
      projectStatus: Object.entries(projectStatusMap).map(([status, count]) => ({
        status,
        count,
      })),
    },
    recentActivities: {
      customers: recentCustomers,
      projects: recentProjects,
      quotations: recentQuotations,
      approvedQuotations: approvedQuotationsList,
      upcomingInstallations,
      logs: recentLogs,
    },
  });
}

function quotationStatusMap(counts: Record<string, number>) {
  return counts;
}
