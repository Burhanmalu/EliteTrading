import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ customers: [], projects: [], quotations: [] });
  }

  const [customers, projects, quotations] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { customerCode: { contains: q } },
          { mobile: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, name: true, customerCode: true, city: true },
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { projectCode: { contains: q } },
          { siteName: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, name: true, projectCode: true, status: true },
    }),
    prisma.quotation.findMany({
      where: {
        OR: [
          { quotationNumber: { contains: q } },
          { customer: { name: { contains: q } } },
        ],
      },
      take: 5,
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        grandTotal: true,
        customer: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({ customers, projects, quotations });
}

