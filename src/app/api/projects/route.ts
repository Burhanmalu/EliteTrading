import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const customerId = (searchParams.get("customerId") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { projectCode: { contains: search } },
      { siteName: { contains: search } },
      { siteAddress: { contains: search } },
      { customer: { name: { contains: search } } },
    ];
  }
  if (status && status !== "ALL") where.status = status;
  if (customerId && customerId !== "ALL") where.customerId = customerId;
  if (category && category !== "ALL") where.category = category;

  const allowedSort: Record<string, string> = {
    name: "name",
    projectCode: "projectCode",
    status: "status",
    createdAt: "createdAt",
  };
  const orderField = allowedSort[sortBy] || "createdAt";

  const [total, rawItems] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true, mobile: true, email: true } },
        approvedQuotation: { select: { id: true, quotationNumber: true, grandTotal: true, revisionNumber: true, status: true } },
        installationSchedule: { select: { id: true, status: true, installationDate: true, supervisor: true } },
        quotations: { select: { id: true, grandTotal: true, status: true } },
      },
      orderBy: { [orderField]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items = rawItems.map((p) => {
    const approved = p.quotations.filter((q) => q.status === "Approved");
    const projectValue =
      p.approvedQuotation?.grandTotal ??
      (approved.length > 0
        ? approved.reduce((s, q) => s + q.grandTotal, 0)
        : p.quotations.reduce((s, q) => Math.max(s, q.grandTotal), 0));

    return {
      ...p,
      totalQuotations: p.quotations.length,
      projectValue,
    };
  });

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "projects:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const customerId = String(body.customerId || "").trim();
    const siteName = String(body.siteName || "").trim();
    const siteAddress = String(body.siteAddress || "").trim();
    const quotationId = body.quotationId ? String(body.quotationId).trim() : null;

    // Strict Workflow Rule: Projects must come from an approved quotation
    if (!quotationId && !body.allowManual) {
      return NextResponse.json(
        {
          error:
            "Projects can only be created from an Approved Quotation. Please open an Approved Quotation and click 'Convert to Project'.",
        },
        { status: 400 }
      );
    }

    if (!name || !customerId || !siteName || !siteAddress) {
      return NextResponse.json(
        { error: "Project Name, Customer, Site Name, and Site Address are required" },
        { status: 400 }
      );
    }

    const count = await prisma.project.count();
    const projectCode = `PRJ-${String(count + 1).padStart(4, "0")}`;

    const project = await prisma.project.create({
      data: {
        projectCode,
        name,
        customerId,
        siteName,
        siteAddress,
        contactPerson: body.contactPerson || null,
        contactNumber: body.contactNumber || null,
        category: body.category || "UPVC Windows and Doors",
        description: body.description || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        expectedCompletionDate: body.expectedCompletionDate
          ? new Date(body.expectedCompletionDate)
          : null,
        status: body.status || "New",
      },
    });

    await logActivity({
      userId: session.id,
      action: "CREATE",
      entityType: "PROJECT",
      entityId: project.id,
      summary: `Created project ${project.name} (${project.projectCode})`,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

