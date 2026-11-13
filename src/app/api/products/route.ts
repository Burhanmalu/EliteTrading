import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";
import { getDefaultDrawingConfig } from "@/lib/drawing-types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const products = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        images: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        specifications: true,
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "Failed to load products", products: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.roleName !== "ADMIN" && !hasPermission(session, "settings:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const code = String(body.code || "").trim();
    const name = String(body.name || "").trim();
    const categoryId = String(body.categoryId || "").trim();

    if (!code || !name || !categoryId) {
      return NextResponse.json(
        { error: "Code, Name, and Category are required" },
        { status: 400 }
      );
    }

    const drawingType = body.drawingType || "SLIDING_3_TRACK_WINDOW";
    const defaultWidthMm = Number(body.defaultWidthMm) || 1800;
    const defaultHeightMm = Number(body.defaultHeightMm) || 1500;
    const defaultRatePerSqFt = Number(body.defaultRatePerSqFt) || 550;

    const product = await prisma.product.create({
      data: {
        code,
        name,
        categoryId,
        brandId: body.brandId || null,
        drawingType,
        defaultPanelsJson: body.defaultPanelsJson
          ? String(body.defaultPanelsJson)
          : JSON.stringify(getDefaultDrawingConfig(drawingType, defaultWidthMm)),
        defaultWidthMm,
        defaultHeightMm,
        defaultRatePerSqFt,
        showUpvcFields:
          body.showUpvcFields === undefined || body.showUpvcFields === null
            ? null
            : Boolean(body.showUpvcFields),
        description: body.description || null,
        specifications: {
          create: {
            profileSystem: body.spec?.profileSystem || null,
            glassType: body.spec?.glassType || null,
            profileColour: body.spec?.profileColour || null,
            meshType: body.spec?.meshType || null,
            track: body.spec?.track || null,
            trackRi: body.spec?.trackRi || null,
            slidingSash: body.spec?.slidingSash || null,
            slidingSashRi: body.spec?.slidingSashRi || null,
            flymeshSash: body.spec?.flymeshSash || null,
            mullionRi: body.spec?.mullionRi || null,
            locking: body.spec?.locking || null,
            handleColour: body.spec?.handleColour || null,
            handleType: body.spec?.handleType || null,
            lockableEspag: body.spec?.lockableEspag || null,
            rollerType: body.spec?.rollerType || null,
          },
        },
      },
      include: { category: true, brand: true, images: true, specifications: true },
    });

    await logActivity({
      userId: session.id,
      action: "CREATE",
      entityType: "PRODUCT",
      entityId: product.id,
      summary: `Added product ${product.name} (${product.code})`,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

