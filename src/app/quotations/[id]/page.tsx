import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { QuotationViewClient } from "@/components/QuotationViewClient";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;

  const [quotation, company] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        convertedProject: { select: { id: true, projectCode: true, name: true } },
        components: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.companySetting.findUnique({ where: { id: "default" } }),
  ]);

  if (!quotation) notFound();

  const revisions = await prisma.quotation.findMany({
    where: { baseQuotationNumber: quotation.baseQuotationNumber },
    select: {
      id: true,
      quotationNumber: true,
      revisionNumber: true,
      status: true,
      grandTotal: true,
    },
    orderBy: { revisionNumber: "desc" },
  });

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
  };

  return (
    <ErpShell user={user}>
      <Suspense fallback={<div className="p-6 text-[#718075]">Loading quotation...</div>}>
        <QuotationViewClient
          quotation={JSON.parse(JSON.stringify(quotation))}
          company={JSON.parse(JSON.stringify(companyData))}
          revisions={JSON.parse(JSON.stringify(revisions))}
        />
      </Suspense>
    </ErpShell>
  );
}

