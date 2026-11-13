import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, logActivity } from "@/lib/auth";
import { generateQuotationPdfBuffer } from "@/lib/pdf-quotation";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const [quotation, company] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        components: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.companySetting.findUnique({ where: { id: "default" } }),
  ]);

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const companyData = company ?? {
    companyName: "EliteTrading",
    tagline: "Architectural Doors, Windows & Glass Systems | Contact: Ali Asger",
    website: "https://elitetradingfd.com",
    email: "elitetrading.contactus@gmail.com",
    phone: "+91 9755036143",
    address:
      "Shop 8, Jasmine Park, opposite RDB Building, Bijalpur, Indore, Madhya Pradesh 452012, India",
    gstNumber: "23AABCE4521K1Z8",
    logoUrl: "/logo.png",
    bankName: "HDFC Bank",
    bankAccountNumber: "50200048291034",
    bankIfsc: "HDFC0000482",
  };

  const buffer = await generateQuotationPdfBuffer(quotation, companyData);

  await logActivity({
    userId: session.id,
    action: "PDF_EXPORT",
    entityType: "QUOTATION",
    entityId: quotation.id,
    summary: `Exported PDF for ${quotation.quotationNumber}`,
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quotation.quotationNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

