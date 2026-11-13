import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [categories, brands, products, masterOptions] = await Promise.all([
    prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        brand: true,
        images: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        specifications: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.masterOption.findMany({
      where: { isActive: true },
      orderBy: [{ optionType: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return NextResponse.json({
    categories,
    brands,
    products,
    masterOptions,
  });
}

