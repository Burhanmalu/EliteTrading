import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";
import { calculateSqFt, calculateQuotationTotals } from "@/lib/format";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const customerId = (searchParams.get("customerId") || "").trim();
  const projectId = (searchParams.get("projectId") || "").trim();
  const sortBy = searchParams.get("sortBy") || "quotationDate";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)));

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { quotationNumber: { contains: search } },
      { referenceNumber: { contains: search } },
      { salesperson: { contains: search } },
      { customer: { name: { contains: search } } },
      { project: { name: { contains: search } } },
    ];
  }
  if (status && status !== "ALL") where.status = status;
  if (customerId && customerId !== "ALL") where.customerId = customerId;
  if (projectId && projectId !== "ALL") where.projectId = projectId;

  const allowedSort: Record<string, string> = {
    quotationNumber: "quotationNumber",
    quotationDate: "quotationDate",
    grandTotal: "grandTotal",
    status: "status",
    createdAt: "createdAt",
  };
  const orderField = allowedSort[sortBy] || "quotationDate";

  const [total, items] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true, mobile: true } },
        project: { select: { id: true, name: true, projectCode: true, siteName: true } },
        convertedProject: { select: { id: true, name: true, projectCode: true } },
      },
      orderBy: { [orderField]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

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
  if (!hasPermission(session, "quotations:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const customerId = String(body.customerId || "").trim();
    const projectId = body.projectId ? String(body.projectId).trim() : null;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer is required" },
        { status: 400 }
      );
    }

    const [customer, project, settings] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      projectId ? prisma.project.findUnique({ where: { id: projectId } }) : null,
      prisma.companySetting.findUnique({ where: { id: "default" } }),
    ]);

    if (!customer) {
      return NextResponse.json(
        { error: "Selected Customer not found" },
        { status: 404 }
      );
    }

    const prefix = settings?.quotationPrefix || "ET";
    const year = new Date().getFullYear();
    const count = await prisma.quotation.count();
    const seq = String(count + 1).padStart(4, "0");
    const quotationNumber =
      body.quotationNumber?.trim() || `${prefix}-${year}-${seq}`;

    const rawComponents = Array.isArray(body.components) ? body.components : [];
    const compData = rawComponents.map((c: Record<string, unknown>, idx: number) => {
      const widthMm = Math.max(100, Number(c.widthMm) || 1800);
      const heightMm = Math.max(100, Number(c.heightMm) || 1500);
      const quantity = Math.max(1, Number(c.quantity) || 1);
      const sqFtPerUnit = calculateSqFt(widthMm, heightMm);
      const ratePerSqFt = Math.max(0, Number(c.ratePerSqFt) || 0);
      const isPriceOverridden = Boolean(c.isPriceOverridden);
      const unitPrice = isPriceOverridden && Number(c.unitPrice) > 0
        ? Number(Number(c.unitPrice).toFixed(2))
        : Number((sqFtPerUnit * ratePerSqFt).toFixed(2));
      const totalValue = Number((unitPrice * quantity).toFixed(2));

      return {
        sortOrder: idx,
        code: String(c.code || `W${idx + 1}`),
        name: String(c.name || "Window / Door"),
        location: String(c.location || ""),
        productId: c.productId ? String(c.productId) : null,
        categoryName: String(c.categoryName || ""),
        brandName: c.brandName ? String(c.brandName) : null,
        widthMm,
        heightMm,
        quantity,
        sqFtPerUnit,
        ratePerSqFt,
        unitPrice,
        totalValue,
        isPriceOverridden,
        overrideReason: c.overrideReason ? String(c.overrideReason) : null,
        drawingType: String(c.drawingType || "SLIDING_3_TRACK_WINDOW"),
        drawingConfigJson:
          typeof c.drawingConfigJson === "string"
            ? c.drawingConfigJson
            : JSON.stringify(c.drawingConfig || {}),
        customImageUrl: c.customImageUrl ? String(c.customImageUrl) : null,
        showUpvcFields: Boolean(c.showUpvcFields),
        profileSystem: c.profileSystem ? String(c.profileSystem) : null,
        glassType: c.glassType ? String(c.glassType) : null,
        profileColour: c.profileColour ? String(c.profileColour) : null,
        meshType: c.meshType ? String(c.meshType) : null,
        track: c.track ? String(c.track) : null,
        trackRi: c.trackRi ? String(c.trackRi) : null,
        slidingSash: c.slidingSash ? String(c.slidingSash) : null,
        slidingSashRi: c.slidingSashRi ? String(c.slidingSashRi) : null,
        flymeshSash: c.flymeshSash ? String(c.flymeshSash) : null,
        mullionRi: c.mullionRi ? String(c.mullionRi) : null,
        locking: c.locking ? String(c.locking) : null,
        handleColour: c.handleColour ? String(c.handleColour) : null,
        handleType: c.handleType ? String(c.handleType) : null,
        lockableEspag: c.lockableEspag ? String(c.lockableEspag) : null,
        rollerType: c.rollerType ? String(c.rollerType) : null,
        additionalAccess: c.additionalAccess ? String(c.additionalAccess) : null,
        remarks: c.remarks ? String(c.remarks) : null,
        snapshotProductJson: JSON.stringify({
          code: c.code,
          name: c.name,
          categoryName: c.categoryName,
          brandName: c.brandName,
        }),
      };
    });

    const totals = calculateQuotationTotals({
      components: compData,
      discountType: body.discountType || "PERCENT",
      discountValue: Number(body.discountValue) || 0,
      transportCharges: Number(body.transportCharges) || 0,
      installationCharges: Number(body.installationCharges) || 0,
      otherCharges: Number(body.otherCharges) || 0,
      gstPercent:
        body.gstPercent !== undefined
          ? Number(body.gstPercent)
          : settings?.defaultGstPercent ?? 18,
      taxTreatment: body.taxTreatment || "EXCLUSIVE",
    });

    let creatorId = session.id;
    const existingCreator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!existingCreator) {
      const fallbackUser = await prisma.user.findFirst({
        where: { OR: [{ email: session.email }, { role: { name: "ADMIN" } }, { isActive: true }] },
      });
      if (fallbackUser) {
        creatorId = fallbackUser.id;
      }
    }

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        baseQuotationNumber: quotationNumber,
        revisionNumber: 1,
        customerId: customer.id,
        projectId: project ? project.id : null,
        createdById: creatorId,
        siteName: body.siteName || (project ? project.siteName : ""),
        siteLocation: body.siteLocation || (project ? project.siteAddress : customer.billingAddress),
        siteContactPerson: body.siteContactPerson || customer.contactPerson || customer.name,
        siteContactNumber: body.siteContactNumber || customer.mobile,
        quotationDate: body.quotationDate ? new Date(body.quotationDate) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        referenceNumber: body.referenceNumber || null,
        salesperson: body.salesperson || session.name,
        remarks: body.remarks || null,
        status: body.status || "Draft",
        gstPercent:
          body.gstPercent !== undefined
            ? Number(body.gstPercent)
            : settings?.defaultGstPercent ?? 18,
        taxTreatment: body.taxTreatment || "EXCLUSIVE",
        discountType: body.discountType || "PERCENT",
        discountValue: Number(body.discountValue) || 0,
        transportCharges: Number(body.transportCharges) || 0,
        installationCharges: Number(body.installationCharges) || 0,
        otherCharges: Number(body.otherCharges) || 0,
        totalComponents: totals.totalComponents,
        totalSqFt: totals.totalSqFt,
        avgRatePerSqFt: totals.avgRatePerSqFt,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,
        snapshotCustomerJson: JSON.stringify({
          name: customer.name,
          contactPerson: customer.contactPerson,
          mobile: customer.mobile,
          email: customer.email,
          billingAddress: customer.billingAddress,
          city: customer.city,
          state: customer.state,
          gstNumber: customer.gstNumber,
          projectName: project?.name || body.siteName || `${customer.name} Project`,
          siteName: project?.siteName || body.siteName || "Site",
        }),
        termsText: body.termsText || null,
        components: {
          create: compData,
        },
      },
      include: {
        customer: true,
        project: true,
        components: { orderBy: { sortOrder: "asc" } },
      },
    });

    await logActivity({
      userId: session.id,
      action: "CREATE",
      entityType: "QUOTATION",
      entityId: quotation.id,
      summary: `Created quotation ${quotation.quotationNumber} for ${customer.name}`,
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    console.error("Create quotation error:", error);
    return NextResponse.json(
      { error: "Failed to create quotation" },
      { status: 500 }
    );
  }
}

