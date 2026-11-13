import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";
import { calculateSqFt, calculateQuotationTotals } from "@/lib/format";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      project: true,
      components: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const revisions = await prisma.quotation.findMany({
    where: { baseQuotationNumber: quotation.baseQuotationNumber },
    select: {
      id: true,
      quotationNumber: true,
      revisionNumber: true,
      status: true,
      grandTotal: true,
      createdAt: true,
    },
    orderBy: { revisionNumber: "desc" },
  });

  return NextResponse.json({ quotation, revisions });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "quotations:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.quotation.findUnique({
      where: { id },
      include: { components: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Status or Approval update shortcut
    if (body.statusOnly) {
      const updateData: Record<string, unknown> = { status: body.status };
      if (body.status === "Approved") {
        updateData.approvalDate = body.approvalDate ? new Date(body.approvalDate) : new Date();
        if (body.approvalRemarks !== undefined) updateData.approvalRemarks = body.approvalRemarks;
        if (body.approvalDocumentUrl !== undefined) updateData.approvalDocumentUrl = body.approvalDocumentUrl;
        if (body.approvedByCustomer !== undefined) updateData.approvedByCustomer = body.approvedByCustomer;
      }
      const updated = await prisma.quotation.update({
        where: { id },
        data: updateData,
      });
      await logActivity({
        userId: session.id,
        action: body.status === "Approved" ? "APPROVE" : "STATUS_CHANGE",
        entityType: "QUOTATION",
        entityId: id,
        summary: `Changed quotation ${existing.quotationNumber} status to ${body.status}${
          body.approvalRemarks ? ` (${body.approvalRemarks})` : ""
        }`,
      });
      return NextResponse.json({ quotation: updated });
    }

    const rawComponents = Array.isArray(body.components) ? body.components : [];
    const compData = rawComponents.map((c: Record<string, unknown>, idx: number) => {
      const widthMm = Math.max(100, Number(c.widthMm) || 1800);
      const heightMm = Math.max(100, Number(c.heightMm) || 1500);
      const quantity = Math.max(1, Number(c.quantity) || 1);
      const sqFtPerUnit = calculateSqFt(widthMm, heightMm);
      const ratePerSqFt = Math.max(0, Number(c.ratePerSqFt) || 0);
      const isPriceOverridden = Boolean(c.isPriceOverridden);
      const unitPrice =
        isPriceOverridden && Number(c.unitPrice) > 0
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
      discountType: body.discountType || existing.discountType,
      discountValue:
        body.discountValue !== undefined
          ? Number(body.discountValue)
          : existing.discountValue,
      transportCharges:
        body.transportCharges !== undefined
          ? Number(body.transportCharges)
          : existing.transportCharges,
      installationCharges:
        body.installationCharges !== undefined
          ? Number(body.installationCharges)
          : existing.installationCharges,
      otherCharges:
        body.otherCharges !== undefined
          ? Number(body.otherCharges)
          : existing.otherCharges,
      gstPercent:
        body.gstPercent !== undefined ? Number(body.gstPercent) : existing.gstPercent,
      taxTreatment: body.taxTreatment || existing.taxTreatment,
    });

    // Replace components cleanly inside transaction
    const quotation = await prisma.$transaction(async (tx) => {
      await tx.quotationComponent.deleteMany({ where: { quotationId: id } });
      return tx.quotation.update({
        where: { id },
        data: {
          customerId: body.customerId || existing.customerId,
          projectId: body.projectId || existing.projectId,
          siteLocation: body.siteLocation ?? existing.siteLocation,
          quotationDate: body.quotationDate
            ? new Date(body.quotationDate)
            : existing.quotationDate,
          validUntil: body.validUntil ? new Date(body.validUntil) : existing.validUntil,
          referenceNumber: body.referenceNumber ?? existing.referenceNumber,
          salesperson: body.salesperson ?? existing.salesperson,
          remarks: body.remarks ?? existing.remarks,
          status: body.status ?? existing.status,
          gstPercent:
            body.gstPercent !== undefined ? Number(body.gstPercent) : existing.gstPercent,
          taxTreatment: body.taxTreatment || existing.taxTreatment,
          discountType: body.discountType || existing.discountType,
          discountValue:
            body.discountValue !== undefined
              ? Number(body.discountValue)
              : existing.discountValue,
          transportCharges:
            body.transportCharges !== undefined
              ? Number(body.transportCharges)
              : existing.transportCharges,
          installationCharges:
            body.installationCharges !== undefined
              ? Number(body.installationCharges)
              : existing.installationCharges,
          otherCharges:
            body.otherCharges !== undefined
              ? Number(body.otherCharges)
              : existing.otherCharges,
          totalComponents: totals.totalComponents,
          totalSqFt: totals.totalSqFt,
          avgRatePerSqFt: totals.avgRatePerSqFt,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxableAmount: totals.taxableAmount,
          gstAmount: totals.gstAmount,
          grandTotal: totals.grandTotal,
          termsText: body.termsText ?? existing.termsText,
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
    });

    await logActivity({
      userId: session.id,
      action: "UPDATE",
      entityType: "QUOTATION",
      entityId: quotation.id,
      summary: `Updated quotation ${quotation.quotationNumber}`,
    });

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Update quotation error:", error);
    return NextResponse.json(
      { error: "Failed to update quotation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "quotations:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  await prisma.quotation.delete({ where: { id } });
  await logActivity({
    userId: session.id,
    action: "DELETE",
    entityType: "QUOTATION",
    entityId: id,
    summary: `Deleted quotation ${existing.quotationNumber}`,
  });

  return NextResponse.json({ ok: true });
}

