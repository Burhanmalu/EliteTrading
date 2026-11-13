import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { ArrowLeft } from "lucide-react";
import { ProjectDetailClient } from "@/components/ProjectDetailClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      approvedQuotation: {
        include: {
          components: { orderBy: { sortOrder: "asc" } },
        },
      },
      installationSchedule: true,
      quotations: {
        orderBy: [{ baseQuotationNumber: "desc" }, { revisionNumber: "desc" }],
      },
    },
  });

  if (!project) notFound();

  return (
    <ErpShell user={user}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-2 rounded-lg border border-[#DDE4DA] bg-white hover:bg-slate-50 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs text-[#718075]">Back to Projects</span>
        </div>

        <ProjectDetailClient project={project as any} />
      </div>
    </ErpShell>
  );
}

