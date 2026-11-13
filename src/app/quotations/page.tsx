import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { QuotationsListClient } from "@/components/QuotationsListClient";

export default async function QuotationsPage() {
  const user = await requireSession();
  return (
    <ErpShell user={user}>
      <QuotationsListClient />
    </ErpShell>
  );
}

