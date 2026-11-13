import React, { Suspense } from "react";
import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { QuotationBuilder } from "@/components/QuotationBuilder";

export default async function NewQuotationPage() {
  const user = await requireSession();
  return (
    <ErpShell user={user}>
      <Suspense fallback={<div className="p-6 text-[#718075]">Loading builder...</div>}>
        <QuotationBuilder defaultSalesperson={user.name} />
      </Suspense>
    </ErpShell>
  );
}

