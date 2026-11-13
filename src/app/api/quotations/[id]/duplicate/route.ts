import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "quotations:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const source = await prisma.quotation.findUnique({
    where: { id },
    include: { components: { orderBy: { sortOrder: "asc" } } },
  });

  if (!source) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const settings = await prisma.companySetting.findUnique({ where: { id: "default" } });
  const prefix = settings?.quotationPrefix || "ET";
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count();
  const newNumber = `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;

  let creatorId = session.id;
  const existingCreator = await prisma.user.findUnique({ where: { id: creatorId } });
  if (!existingCreator) {
    const fallbackUser = await prisma.user.findFirst({
      where: { OR: [{ email: session.email }, { role: { name: "ADMIN" } }, { isActive: true }] },
    });
    if (fallbackUser) creatorId = fallbackUser.id;
  }

  const duplicated = await prisma.quotation.create({
    data: {
      quotationNumber: newNumber,
      baseQuotationNumber: newNumber,
      revisionNumber: 1,
      customerId: source.customerId,
      projectId: source.projectId,
      createdById: creatorId,
      siteLocation: source.siteLocation,
      quotationDate: new Date(),
      referenceNumber: source.referenceNumber,
      salesperson: session.name,
      remarks: source.remarks,
      status: "Draft",
      gstPercent: source.gstPercent,
      taxTreatment: source.taxTreatment,
      discountType: source.discountType,
      discountValue: source.discountValue,
      transportCharges: source.transportCharges,
      installationCharges: source.installationCharges,
      otherCharges: source.otherCharges,
      totalComponents: source.totalComponents,
      totalSqFt: source.totalSqFt,
      avgRatePerSqFt: source.avgRatePerSqFt,
      subtotal: source.subtotal,
      discountAmount: source.discountAmount,
      taxableAmount: source.taxableAmount,
      gstAmount: source.gstAmount,
      grandTotal: source.grandTotal,
      snapshotCustomerJson: source.snapshotCustomerJson,
      termsText: source.termsText,
      components: {
        create: source.components.map((c) => ({
          sortOrder: c.sortOrder,
          code: c.code,
          name: c.name,
          location: c.location,
          productId: c.productId,
          categoryName: c.categoryName,
          brandName: c.brandName,
          widthMm: c.widthMm,
          heightMm: c.heightMm,
          quantity: c.quantity,
          sqFtPerUnit: c.sqFtPerUnit,
          ratePerSqFt: c.ratePerSqFt,
          unitPrice: c.unitPrice,
          totalValue: c.totalValue,
          isPriceOverridden: c.isPriceOverridden,
          overrideReason: c.overrideReason,
          drawingType: c.drawingType,
          drawingConfigJson: c.drawingConfigJson,
          customImageUrl: c.customImageUrl,
          showUpvcFields: c.showUpvcFields,
          profileSystem: c.profileSystem,
          glassType: c.glassType,
          profileColour: c.profileColour,
          meshType: c.meshType,
          track: c.track,
          trackRi: c.trackRi,
          slidingSash: c.slidingSash,
          slidingSashRi: c.slidingSashRi,
          flymeshSash: c.flymeshSash,
          mullionRi: c.mullionRi,
          locking: c.locking,
          handleColour: c.handleColour,
          handleType: c.handleType,
          lockableEspag: c.lockableEspag,
          rollerType: c.rollerType,
          additionalAccess: c.additionalAccess,
          remarks: c.remarks,
          snapshotProductJson: c.snapshotProductJson,
        })),
      },
    },
  });

  await logActivity({
    userId: session.id,
    action: "CREATE",
    entityType: "QUOTATION",
    entityId: duplicated.id,
    summary: `Duplicated ${source.quotationNumber} into ${duplicated.quotationNumber}`,
  });

  return NextResponse.json({ quotation: duplicated }, { status: 201 });
}

