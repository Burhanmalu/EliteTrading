import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { ReportsClient } from "@/components/ReportsClient";

export default async function ReportsPage() {
  const user = await requireSession();
  return (
    <ErpShell user={user}>
      <ReportsClient />
    </ErpShell>
  );
}

