import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, logActivity } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [company, categories, brands, masterOptions, terms, roles, users] =
      await Promise.all([
        prisma.companySetting.findUnique({ where: { id: "default" } }),
        prisma.productCategory.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.brand.findMany({ orderBy: { name: "asc" } }),
        prisma.masterOption.findMany({ orderBy: [{ optionType: "asc" }, { sortOrder: "asc" }] }),
        prisma.quotationTerm.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.role.findMany({ orderBy: { name: "asc" } }),
        session.roleName === "ADMIN"
          ? prisma.user.findMany({
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                roleId: true,
                role: { select: { name: true } },
              },
              orderBy: { createdAt: "asc" },
            })
          : Promise.resolve([]),
      ]);

    return NextResponse.json({
      company: company || {},
      categories: categories || [],
      brands: brands || [],
      masterOptions: masterOptions || [],
      terms: terms || [],
      roles: roles || [],
      users: users || [],
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to load settings",
        company: {},
        categories: [],
        brands: [],
        masterOptions: [],
        terms: [],
        roles: [],
        users: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.roleName !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "UPDATE_COMPANY") {
      const company = await prisma.companySetting.upsert({
        where: { id: "default" },
        update: {
          companyName: body.data.companyName,
          tagline: body.data.tagline,
          website: body.data.website,
          email: body.data.email,
          phone: body.data.phone,
          address: body.data.address,
          gstNumber: body.data.gstNumber,
          panNumber: body.data.panNumber,
          logoUrl: body.data.logoUrl || null,
          defaultGstPercent: Number(body.data.defaultGstPercent) || 18,
          quotationPrefix: body.data.quotationPrefix || "ET",
          quotationNumberFormat: body.data.quotationNumberFormat || "{PREFIX}-{YEAR}-{SEQ}",
          bankName: body.data.bankName || null,
          bankAccountNumber: body.data.bankAccountNumber || null,
          bankIfsc: body.data.bankIfsc || null,
        },
        create: {
          id: "default",
          ...body.data,
        },
      });
      await logActivity({
        userId: session.id,
        action: "UPDATE",
        entityType: "SETTINGS",
        summary: "Updated company settings",
      });
      return NextResponse.json({ company });
    }

    if (action === "CREATE_CATEGORY") {
      const name = String(body.data.name || "").trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const category = await prisma.productCategory.create({
        data: {
          name,
          slug,
          description: body.data.description || null,
          showUpvcFields: Boolean(body.data.showUpvcFields),
          sortOrder: Number(body.data.sortOrder) || 10,
        },
      });
      return NextResponse.json({ category }, { status: 201 });
    }

    if (action === "DELETE_CATEGORY") {
      await prisma.productCategory.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "CREATE_BRAND") {
      const name = String(body.data.name || "").trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const brand = await prisma.brand.create({
        data: { name, slug, description: body.data.description || null },
      });
      return NextResponse.json({ brand }, { status: 201 });
    }

    if (action === "DELETE_BRAND") {
      await prisma.brand.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "CREATE_OPTION") {
      const option = await prisma.masterOption.create({
        data: {
          optionType: body.data.optionType,
          name: body.data.name,
          categoryScope: body.data.categoryScope || "ALL",
          extraRate: Number(body.data.extraRate) || 0,
        },
      });
      return NextResponse.json({ option }, { status: 201 });
    }

    if (action === "DELETE_OPTION") {
      await prisma.masterOption.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "CREATE_TERM") {
      const term = await prisma.quotationTerm.create({
        data: {
          title: body.data.title,
          content: body.data.content,
          sortOrder: Number(body.data.sortOrder) || 1,
        },
      });
      return NextResponse.json({ term }, { status: 201 });
    }

    if (action === "DELETE_TERM") {
      await prisma.quotationTerm.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "CREATE_USER") {
      const passwordHash = await hashPassword(body.data.password || "Elite@123");
      const user = await prisma.user.create({
        data: {
          name: body.data.name,
          email: String(body.data.email).toLowerCase(),
          phone: body.data.phone || null,
          roleId: body.data.roleId,
          passwordHash,
        },
        select: { id: true, name: true, email: true, roleId: true },
      });
      return NextResponse.json({ user }, { status: 201 });
    }

    if (action === "DEACTIVATE_USER" || action === "DELETE_USER") {
      const targetUserId = body.id;
      if (targetUserId === session.id) {
        return NextResponse.json({ error: "Cannot remove current logged in user" }, { status: 400 });
      }
      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isActive: false,
          passwordHash: "$2a$10$REVOKED.ACCESS.ACCOUNT.DISABLED.NO.LOGIN.ALLOWED",
        },
      });
      await logActivity({
        userId: session.id,
        action: "UPDATE",
        entityType: "USER",
        summary: `Revoked access for user ${updated.email}`,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}

