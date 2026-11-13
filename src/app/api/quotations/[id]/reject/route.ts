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
    const reason = String(body.reason || "").trim();

    const quote = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (quote.status === "Approved") {
      return NextResponse.json(
        { error: "Approved quotation cannot be rejected." },
        { status: 400 }
      );
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        status: "Rejected",
        approvalRemarks: reason ? `Rejected: ${reason}` : "Rejected by client/manager",
      },
    });

    await logActivity({
      userId: session.id,
      action: "REJECT",
      entityType: "QUOTATION",
      entityId: quote.id,
      summary: `Rejected quotation ${quote.quotationNumber}${reason ? ` (Reason: ${reason})` : ""}`,
    });

    return NextResponse.json({ success: true, quotation: updated });
  } catch (error) {
    console.error("Reject quotation error:", error);
    return NextResponse.json({ error: "Failed to reject quotation" }, { status: 500 });
  }
}

