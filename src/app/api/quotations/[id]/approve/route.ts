import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "quotations:write")) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    // Find the quotation with customer, components, and convertedProject
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

    if (quote.status === "Approved" && quote.convertedProject) {
      return NextResponse.json(
        {
          message: "Quotation is already approved and project already exists.",
          quotation: quote,
          project: quote.convertedProject,
        },
        { status: 200 }
      );
    }

    // Determine category
    const catNames = Array.from(new Set(quote.components.map((c) => c.categoryName).filter(Boolean)));
    const category = catNames.length === 1 ? catNames[0] : catNames.length > 1 ? "Mixed" : "UPVC Windows";

    const projectName =
      body.projectName?.trim() ||
      quote.siteName ||
      `${quote.customer.name} - ${category} Installation`;

    const siteName = quote.siteName || projectName;
    const siteAddress = quote.siteLocation || quote.customer.billingAddress;

    // Use transaction to update quotation and create project atomically
    const result = await prisma.$transaction(async (tx) => {
      let project = quote.convertedProject;

      if (!project) {
        const count = await tx.project.count();
        const projectCode = `PRJ-${String(count + 1).padStart(4, "0")}`;

        project = await tx.project.create({
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
            status: "Approved – Installation Pending",
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
      }

      const updatedQuotation = await tx.quotation.update({
        where: { id: quote.id },
        data: {
          status: "Approved",
          approvalDate: new Date(),
          approvedByCustomer: body.approvedBy?.trim() || session.name || "Admin",
          approvalRemarks: body.approvalRemarks?.trim() || `Approved by ${session.name || "Admin"}. Project created: ${project.projectCode}`,
          projectId: project.id,
        },
        include: {
          customer: true,
          convertedProject: true,
        },
      });

      return { quotation: updatedQuotation, project };
    });

    await logActivity({
      userId: session.id,
      action: "APPROVE",
      entityType: "QUOTATION",
      entityId: quote.id,
      summary: `Approved quotation ${quote.quotationNumber} and automatically created project ${result.project.projectCode}`,
    });

    return NextResponse.json({
      success: true,
      quotation: result.quotation,
      project: result.project,
    });
  } catch (error) {
    console.error("Approve quotation error:", error);
    return NextResponse.json({ error: "Failed to approve quotation and create project" }, { status: 500 });
  }
}

