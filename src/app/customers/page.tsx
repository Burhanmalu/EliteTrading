import React, { Suspense } from "react";
import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { CustomersClient } from "@/components/CustomersClient";

export default async function CustomersPage() {
  const user = await requireSession();
  return (
    <ErpShell user={user}>
      <Suspense fallback={<div className="p-6 text-[#718075]">Loading...</div>}>
        <CustomersClient />
      </Suspense>
    </ErpShell>
  );
}

