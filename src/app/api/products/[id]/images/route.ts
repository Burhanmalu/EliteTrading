import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  const url = String(body.url || "").trim();
  if (!url) {
    return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
  }

  const isDefault = Boolean(body.isDefault);
  if (isDefault) {
    await prisma.productImage.updateMany({
      where: { productId: id },
      data: { isDefault: false },
    });
  }

  const image = await prisma.productImage.create({
    data: {
      productId: id,
      url,
      title: body.title || "Technical Drawing",
      viewType: body.viewType || "Technical Drawing",
      isDefault,
    },
  });

  return NextResponse.json({ image }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  const imageId = String(body.imageId || "");

  if (body.setDefault && imageId) {
    await prisma.productImage.updateMany({
      where: { productId: id },
      data: { isDefault: false },
    });
    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: { isDefault: true },
    });
    return NextResponse.json({ image });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) {
    return NextResponse.json({ error: "imageId required" }, { status: 400 });
  }

  await prisma.productImage.delete({ where: { id: imageId } });
  return NextResponse.json({ ok: true });
}

