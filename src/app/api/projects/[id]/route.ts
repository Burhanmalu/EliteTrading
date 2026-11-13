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
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      quotations: {
        orderBy: [{ baseQuotationNumber: "desc" }, { revisionNumber: "desc" }],
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "projects:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        customerId: body.customerId,
        siteName: body.siteName,
        siteAddress: body.siteAddress,
        contactPerson: body.contactPerson || null,
        contactNumber: body.contactNumber || null,
        category: body.category,
        description: body.description || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        expectedCompletionDate: body.expectedCompletionDate
          ? new Date(body.expectedCompletionDate)
          : null,
        status: body.status,
      },
    });

    await logActivity({
      userId: session.id,
      action: "UPDATE",
      entityType: "PROJECT",
      entityId: project.id,
      summary: `Updated project ${project.name} (${project.status})`,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "projects:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    await logActivity({
      userId: session.id,
      action: "DELETE",
      entityType: "PROJECT",
      entityId: id,
      summary: `Deleted project ${existing.name}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Cannot delete project with existing quotations" },
      { status: 400 }
    );
  }
}

