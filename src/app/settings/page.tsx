import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { SettingsClient } from "@/components/SettingsClient";

export default async function SettingsPage() {
  const user = await requireSession();
  return (
    <ErpShell user={user}>
      <SettingsClient isAdmin={user.roleName === "ADMIN"} />
    </ErpShell>
  );
}

