import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";

export async function POST(
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
    const body = await req.json().catch(() => ({}));

    // Find the quotation with customer and components
    const quote = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        components: { orderBy: { sortOrder: "asc" } },
        convertedProject: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (quote.status !== "Approved") {
      return NextResponse.json(
        { error: "Only an Approved quotation can be converted into a project." },
        { status: 400 }
      );
    }

    // Check if already converted
    if (quote.convertedProject && !body.forceDuplicate) {
      return NextResponse.json(
        {
          error: `Project already created for this quotation (${quote.convertedProject.projectCode}).`,
          projectId: quote.convertedProject.id,
        },
        { status: 409 }
      );
    }

    // Generate unique Project Code PRJ-0001
    const count = await prisma.project.count();
    const projectCode = `PRJ-${String(count + 1).padStart(4, "0")}`;

    // Derive category from components or default
    const catNames = Array.from(new Set(quote.components.map((c) => c.categoryName).filter(Boolean)));
    const category = catNames.length === 1 ? catNames[0] : catNames.length > 1 ? "Mixed" : "UPVC Windows";

    const projectName =
      body.projectName?.trim() ||
      quote.siteName ||
      `${quote.customer.name} - ${category} Installation`;

    const siteName = quote.siteName || projectName;
    const siteAddress = quote.siteLocation || quote.customer.billingAddress;

    // Create the Project linked to this quotation
    const project = await prisma.project.create({
      data: {
        projectCode,
        name: projectName,
        customerId: quote.customerId,
        convertedFromQuoteId: quote.id,
        siteName,
        siteAddress,
        contactPerson: quote.siteContactPerson || quote.customer.contactPerson || quote.customer.name,
        contactNumber: quote.siteContactNumber || quote.customer.mobile,
        category,
        status: "Project Created",
        description: `Created from Approved Quotation ${quote.quotationNumber} (Rev ${quote.revisionNumber}). Grand Total: INR ${quote.grandTotal.toFixed(2)}`,
        installationSchedule: {
          create: {
            status: "Not Scheduled",
            siteContactPerson: quote.siteContactPerson || quote.customer.contactPerson || quote.customer.name,
            siteContactNumber: quote.siteContactNumber || quote.customer.mobile,
            installationAddress: siteAddress,
          },
        },
      },
      include: {
        customer: true,
        installationSchedule: true,
      },
    });

    // Also update quotation.projectId to this project if null
    await prisma.quotation.update({
      where: { id: quote.id },
      data: { projectId: project.id },
    });

    await logActivity({
      userId: session.id,
      action: "CONVERT_TO_PROJECT",
      entityType: "PROJECT",
      entityId: project.id,
      summary: `Converted Approved Quotation ${quote.quotationNumber} into Project ${project.projectCode}`,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Convert quotation to project error:", error);
    return NextResponse.json({ error: "Failed to convert quotation to project" }, { status: 500 });
  }
}

