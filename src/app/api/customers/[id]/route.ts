import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        include: {
          quotations: {
            select: { id: true, quotationNumber: true, grandTotal: true, status: true },
          },
        },
      },
      quotations: {
        orderBy: { quotationDate: "desc" },
        include: {
          project: { select: { id: true, name: true, projectCode: true } },
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        contactPerson: String(body.contactPerson || "").trim() || body.name,
        mobile: body.mobile,
        alternateNumber: body.alternateNumber || null,
        email: body.email || null,
        billingAddress: body.billingAddress,
        city: body.city || null,
        state: body.state || null,
        gstNumber: body.gstNumber || null,
        customerType: body.customerType || "Residential",
        remarks: body.remarks || null,
      },
    });

    await logActivity({
      userId: session.id,
      action: "UPDATE",
      entityType: "CUSTOMER",
      entityId: customer.id,
      summary: `Updated customer ${customer.name}`,
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await prisma.customer.delete({ where: { id } });

    await logActivity({
      userId: session.id,
      action: "DELETE",
      entityType: "CUSTOMER",
      entityId: id,
      summary: `Deleted customer ${existing.name}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { error: "Cannot delete customer with existing quotations" },
      { status: 400 }
    );
  }
}

