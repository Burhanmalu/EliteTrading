import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const customerType = (searchParams.get("customerType") || "").trim();
  const city = (searchParams.get("city") || "").trim();
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)));

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { customerCode: { contains: search } },
      { contactPerson: { contains: search } },
      { mobile: { contains: search } },
      { email: { contains: search } },
      { city: { contains: search } },
    ];
  }
  if (customerType && customerType !== "ALL") {
    where.customerType = customerType;
  }
  if (city && city !== "ALL") {
    where.city = city;
  }

  const allowedSort: Record<string, string> = {
    name: "name",
    customerCode: "customerCode",
    createdAt: "createdAt",
    city: "city",
  };
  const orderField = allowedSort[sortBy] || "createdAt";

  const [total, items] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: {
        _count: { select: { projects: true, quotations: true } },
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
  if (!hasPermission(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const contactPerson = String(body.contactPerson || "").trim() || name;
    const mobile = String(body.mobile || "").trim();
    const billingAddress = String(body.billingAddress || "").trim();

    if (!name || !mobile || !billingAddress) {
      return NextResponse.json(
        { error: "Name, Mobile, and Address are required" },
        { status: 400 }
      );
    }

    const count = await prisma.customer.count();
    const customerCode = `CUST-${String(count + 1).padStart(4, "0")}`;

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        name,
        contactPerson,
        mobile,
        alternateNumber: body.alternateNumber || null,
        email: body.email || null,
        billingAddress,
        city: body.city || null,
        state: body.state || null,
        gstNumber: body.gstNumber || null,
        customerType: body.customerType || "Residential",
        remarks: body.remarks || null,
      },
    });

    await logActivity({
      userId: session.id,
      action: "CREATE",
      entityType: "CUSTOMER",
      entityId: customer.id,
      summary: `Added customer ${customer.name} (${customer.customerCode})`,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

