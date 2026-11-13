import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { QuotationBuilder } from "@/components/QuotationBuilder";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { components: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quotation) notFound();

  const serialized = JSON.parse(JSON.stringify(quotation));

  return (
    <ErpShell user={user}>
      <Suspense fallback={<div className="p-6 text-[#718075]">Loading builder...</div>}>
        <QuotationBuilder
          quotationId={id}
          initialQuotation={serialized}
          defaultSalesperson={user.name}
        />
      </Suspense>
    </ErpShell>
  );
}

