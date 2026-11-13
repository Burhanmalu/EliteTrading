import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.roleName !== "ADMIN" && !hasPermission(session, "settings:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        categoryId: body.categoryId,
        brandId: body.brandId || null,
        drawingType: body.drawingType,
        defaultPanelsJson: body.defaultPanelsJson ? String(body.defaultPanelsJson) : undefined,
        defaultWidthMm: Number(body.defaultWidthMm) || 1800,
        defaultHeightMm: Number(body.defaultHeightMm) || 1500,
        defaultRatePerSqFt: Number(body.defaultRatePerSqFt) || 550,
        showUpvcFields:
          body.showUpvcFields === undefined || body.showUpvcFields === null
            ? null
            : Boolean(body.showUpvcFields),
        description: body.description || null,
        isActive: body.isActive ?? true,
      },
    });

    if (body.spec) {
      await prisma.productSpecification.upsert({
        where: { productId: id },
        update: {
          profileSystem: body.spec.profileSystem || null,
          glassType: body.spec.glassType || null,
          profileColour: body.spec.profileColour || null,
          meshType: body.spec.meshType || null,
          track: body.spec.track || null,
          trackRi: body.spec.trackRi || null,
          slidingSash: body.spec.slidingSash || null,
          slidingSashRi: body.spec.slidingSashRi || null,
          flymeshSash: body.spec.flymeshSash || null,
          mullionRi: body.spec.mullionRi || null,
          locking: body.spec.locking || null,
          handleColour: body.spec.handleColour || null,
          handleType: body.spec.handleType || null,
          lockableEspag: body.spec.lockableEspag || null,
          rollerType: body.spec.rollerType || null,
        },
        create: {
          productId: id,
          profileSystem: body.spec.profileSystem || null,
          glassType: body.spec.glassType || null,
          profileColour: body.spec.profileColour || null,
          meshType: body.spec.meshType || null,
          track: body.spec.track || null,
          trackRi: body.spec.trackRi || null,
          slidingSash: body.spec.slidingSash || null,
          slidingSashRi: body.spec.slidingSashRi || null,
          flymeshSash: body.spec.flymeshSash || null,
          mullionRi: body.spec.mullionRi || null,
          locking: body.spec.locking || null,
          handleColour: body.spec.handleColour || null,
          handleType: body.spec.handleType || null,
          lockableEspag: body.spec.lockableEspag || null,
          rollerType: body.spec.rollerType || null,
        },
      });
    }

    await logActivity({
      userId: session.id,
      action: "UPDATE",
      entityType: "PRODUCT",
      entityId: product.id,
      summary: `Updated product ${product.name}`,
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.roleName !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

