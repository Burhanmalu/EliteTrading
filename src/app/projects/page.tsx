import React, { Suspense } from "react";
import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { ProjectsClient } from "@/components/ProjectsClient";

export default async function ProjectsPage() {
  const user = await requireSession();
  return (
    <ErpShell user={user}>
      <Suspense fallback={<div className="p-6 text-[#718075]">Loading...</div>}>
        <ProjectsClient />
      </Suspense>
    </ErpShell>
  );
}

