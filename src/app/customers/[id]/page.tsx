import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-auth";
import { ErpShell } from "@/components/ErpShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { ArrowLeft, Phone, Mail, MapPin, Plus, Building2 } from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        include: {
          quotations: { select: { id: true, grandTotal: true, status: true } },
        },
      },
      quotations: {
        orderBy: { quotationDate: "desc" },
        include: { project: { select: { id: true, name: true } } },
      },
    },
  });

  if (!customer) notFound();

  const totalQuoted = customer.quotations.reduce((s, q) => s + q.grandTotal, 0);

  return (
    <ErpShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/customers"
              className="p-2 rounded-lg border border-[#DDE4DA] bg-white hover:bg-slate-50 text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-[#25382E]">{customer.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-[#294C3B] border border-[#DDE4DA]">
                  {customer.customerCode}
                </span>
              </div>
              <p className="text-sm text-[#718075]">
                {customer.customerType} • Added {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/quotations/new?customerId=${customer.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#294C3B] text-white text-sm font-semibold hover:bg-[#173D30] shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Create Quotation
            </Link>
          </div>
        </div>

        {/* Profile Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase">
                  Contact Person
                </div>
                <div className="font-semibold text-slate-800">{customer.contactPerson}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase">
                  Phone / Mobile
                </div>
                <div className="font-semibold text-slate-800">
                  {customer.mobile}
                  {customer.alternateNumber ? ` / ${customer.alternateNumber}` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase">
                  Email &amp; GSTIN
                </div>
                <div className="text-slate-800">{customer.email || "-"}</div>
                <div className="text-xs font-mono text-[#718075] mt-0.5">
                  GST: {customer.gstNumber || "Unregistered"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase">
                  Address
                </div>
                <div className="text-slate-700">
                  {customer.billingAddress}
                  {customer.city ? `, ${customer.city}` : ""}
                  {customer.state ? `, ${customer.state}` : ""}
                </div>
              </div>
            </div>
            {customer.remarks && (
              <div className="sm:col-span-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Remarks: </span>
                {customer.remarks}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#DDE4DA] p-5 shadow-sm flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-400 uppercase">
              Account Summary
            </div>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div>
                <div className="text-2xl font-bold text-[#25382E]">
                  {customer.projects.length}
                </div>
                <div className="text-xs text-[#718075]">Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#25382E]">
                  {customer.quotations.length}
                </div>
                <div className="text-xs text-[#718075]">Quotations</div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs text-[#718075]">Total Quoted Value</div>
              <div className="text-xl font-bold text-[#294C3B] mt-0.5">
                {formatINR(totalQuoted)}
              </div>
            </div>
          </div>
        </div>

        {/* Associated Projects */}
        <div className="bg-white rounded-xl border border-[#DDE4DA] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DDE4DA] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#25382E]">
              Associated Projects ({customer.projects.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-[#DDE4DA] text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3">Project ID</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Site Location</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Quotations</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No projects yet for this customer.
                    </td>
                  </tr>
                ) : (
                  customer.projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#294C3B]">
                        {p.projectCode}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/projects/${p.id}`} className="hover:text-blue-600">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{p.siteName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{p.category}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {p.quotations.length}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Associated Quotations */}
        <div className="bg-white rounded-xl border border-[#DDE4DA] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DDE4DA]">
            <h2 className="text-sm font-bold text-[#25382E]">
              Associated Quotations ({customer.quotations.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-[#DDE4DA] text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3">Quotation #</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Sq.Ft.</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.quotations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No quotations yet for this customer.
                    </td>
                  </tr>
                ) : (
                  customer.quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-[#294C3B]">
                        <Link href={`/quotations/${q.id}`} className="hover:underline">
                          {q.quotationNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{q.project?.name || "Pending Approval"}</td>
                      <td className="px-4 py-3 text-xs text-[#718075]">
                        {formatDate(q.quotationDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {formatNumber(q.totalSqFt)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatINR(q.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={q.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErpShell>
  );
}

