import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { DashboardClient } from "@/components/DashboardClient";

export default async function HomePage() {
  const user = await requireSession();
  return (
    <ErpShell user={user}>
      <DashboardClient />
    </ErpShell>
  );
}
