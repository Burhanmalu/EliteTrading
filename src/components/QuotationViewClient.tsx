"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  FileDown,
  Printer,
  Copy,
  GitBranch,
  CheckCircle,
  FolderPlus,
  Send,
  XCircle,
  FileText,
  Upload,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { TechnicalDrawingSvg } from "./TechnicalDrawingSvg";
import {
  computeVentilationFanMetrics,
  parseDrawingConfig,
  isVentilationProduct,
} from "@/lib/drawing-types";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function normalizeWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(1);
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

interface QuotationViewProps {
  quotation: {
    id: string;
    quotationNumber: string;
    baseQuotationNumber: string;
    revisionNumber: number;
    siteName?: string | null;
    siteLocation: string;
    quotationDate: string;
    referenceNumber?: string | null;
    salesperson?: string | null;
    remarks?: string | null;
    status: string;
    gstPercent: number;
    taxTreatment: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    transportCharges: number;
    installationCharges: number;
    otherCharges: number;
    totalComponents: number;
    totalSqFt: number;
    avgRatePerSqFt: number;
    subtotal: number;
    gstAmount: number;
    grandTotal: number;
    termsText?: string | null;
    customer: {
      id: string;
      name: string;
      contactPerson: string;
      mobile: string;
      alternateNumber?: string | null;
      email?: string | null;
      billingAddress: string;
      city?: string | null;
      gstNumber?: string | null;
    };
    project?: {
      id: string;
      name: string;
      siteName: string;
    } | null;
    convertedProject?: {
      id: string;
      projectCode: string;
      name: string;
    } | null;
    approvalDate?: string | null;
    approvalRemarks?: string | null;
    approvalDocumentUrl?: string | null;
    approvedByCustomer?: string | null;
    components: Array<{
      id: string;
      code: string;
      name: string;
      location: string;
      categoryName: string;
      brandName?: string | null;
      widthMm: number;
      heightMm: number;
      quantity: number;
      sqFtPerUnit: number;
      ratePerSqFt: number;
      unitPrice: number;
      totalValue: number;
      drawingType: string;
      drawingConfigJson: string;
      customImageUrl?: string | null;
      showUpvcFields: boolean;
      profileSystem?: string | null;
      glassType?: string | null;
      profileColour?: string | null;
      meshType?: string | null;
      track?: string | null;
      trackRi?: string | null;
      slidingSash?: string | null;
      slidingSashRi?: string | null;
      flymeshSash?: string | null;
      mullionRi?: string | null;
      locking?: string | null;
      handleColour?: string | null;
      handleType?: string | null;
      lockableEspag?: string | null;
      rollerType?: string | null;
      additionalAccess?: string | null;
      remarks?: string | null;
    }>;
  };
  company: {
    companyName: string;
    tagline: string;
    website: string;
    email: string;
    phone: string;
    address: string;
    gstNumber: string;
    logoUrl?: string | null;
  };
  revisions: Array<{
    id: string;
    quotationNumber: string;
    revisionNumber: number;
    status: string;
    grandTotal: number;
  }>;
}

export function QuotationViewClient({
  quotation,
  company,
  revisions,
}: QuotationViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(quotation.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalForm, setApprovalForm] = useState({
    projectName: quotation.siteName || `${quotation.customer.name} - Fenestration Project`,
    approvedByCustomer: quotation.customer.contactPerson || quotation.customer.name,
    approvalRemarks: "",
    approvalDocumentUrl: "",
  });
  const [converting, setConverting] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [whatsAppNotice, setWhatsAppNotice] = useState<{
    quoteNumber: string;
    customerName: string;
    phone: string;
  } | null>(null);
  const [whatsAppError, setWhatsAppError] = useState<string | null>(null);

  useEffect(() => {
    if (whatsAppNotice) {
      const t = setTimeout(() => setWhatsAppNotice(null), 12000);
      return () => clearTimeout(t);
    }
  }, [whatsAppNotice]);

  useEffect(() => {
    if (whatsAppError) {
      const t = setTimeout(() => setWhatsAppError(null), 8000);
      return () => clearTimeout(t);
    }
  }, [whatsAppError]);

  useEffect(() => {
    if (searchParams.get("print") === "1") {
      setTimeout(() => window.print(), 400);
    }
  }, [searchParams]);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "Approved") {
      setApprovalModalOpen(true);
      return;
    }
    if (newStatus === "Rejected") {
      setRejectModalOpen(true);
      return;
    }
    setUpdatingStatus(true);
    setStatus(newStatus);
    await fetch(`/api/quotations/${quotation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusOnly: true, status: newStatus }),
    });
    setUpdatingStatus(false);
    router.refresh();
  };

  const handleRecordApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: approvalForm.projectName,
          approvalRemarks: approvalForm.approvalRemarks,
          approvedBy: approvalForm.approvedByCustomer,
        }),
      });
      const data = await res.json();
      setUpdatingStatus(false);
      setApprovalModalOpen(false);
      if (!res.ok) {
        alert(data.error || "Failed to approve quotation");
        return;
      }
      setStatus("Approved");
      if (data.project?.id) {
        router.push(`/projects/${data.project.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Approval error:", err);
      setUpdatingStatus(false);
      alert("Failed to approve quotation");
    }
  };

  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      setUpdatingStatus(false);
      setRejectModalOpen(false);
      if (!res.ok) {
        alert(data.error || "Failed to reject quotation");
        return;
      }
      setStatus("Rejected");
      router.refresh();
    } catch (err) {
      console.error("Rejection error:", err);
      setUpdatingStatus(false);
      alert("Failed to reject quotation");
    }
  };

  const handleConvertToProject = async () => {
    if (!confirm(`Convert Approved Quotation ${quotation.quotationNumber} into an active Project?`)) return;
    setConverting(true);
    const res = await fetch(`/api/quotations/${quotation.id}/convert-project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setConverting(false);
    if (!res.ok) {
      alert(data.error || "Failed to convert quotation to project");
      return;
    }
    router.push(`/projects/${data.project.id}`);
  };

  const handleCreateRevision = async () => {
    const res = await fetch(`/api/quotations/${quotation.id}/revision`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/quotations/${data.quotation.id}/edit`);
    }
  };

  const handleDuplicate = async () => {
    const res = await fetch(`/api/quotations/${quotation.id}/duplicate`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/quotations/${data.quotation.id}/edit`);
    }
  };

  // WhatsApp Send Action (Web Share API with file support & Desktop Fallback)
  const handleWhatsAppSend = async () => {
    if (sharingPdf) return;
    setWhatsAppError(null);

    // 1. Fetch / determine customer phone number
    let rawPhone = quotation.customer?.mobile || quotation.customer?.alternateNumber;

    if (!rawPhone && quotation.customer?.id) {
      try {
        const custRes = await fetch(`/api/customers/${quotation.customer.id}`);
        if (custRes.ok) {
          const custData = await custRes.json();
          rawPhone = custData.customer?.mobile || custData.customer?.alternateNumber;
        }
      } catch (err) {
        console.error("Error fetching customer phone:", err);
      }
    }

    if (!rawPhone) {
      setWhatsAppError(
        `WhatsApp number missing for customer "${quotation.customer?.name || "Customer"}". Please add a mobile number in the Customers module.`
      );
      return;
    }

    // 2. Validate and normalize Indian phone number
    const normalizedPhone = normalizeWhatsAppPhone(rawPhone);
    if (!normalizedPhone) {
      setWhatsAppError(
        `Invalid phone number "${rawPhone}". Please ensure a valid 10-digit Indian mobile number is entered.`
      );
      return;
    }

    // 3. Prepare personalized WhatsApp message
    const customerName = quotation.customer?.name || "Valued Customer";
    const message = [
      `Dear ${customerName},`,
      ``,
      `Thank you for your interest in *Elite Trading*. Please find the details for your quotation below:`,
      ``,
      `📄 *Quotation No:* ${quotation.quotationNumber}`,
      `💰 *Total Amount:* ${formatINR(quotation.grandTotal)}`,
      `📐 *Total Items:* ${quotation.totalComponents} components (${formatNumber(quotation.totalSqFt)} Sq.Ft.)`,
      ``,
      `Your official technical quotation PDF with complete drawings and profile specifications is attached.`,
      ``,
      `🏢 *Elite Trading* – Architectural French Doors & Windows | uPVC | Aluminium | Domal | Glass Partitions`,
      `📞 Phone: +91 9755036143 / +91 98110 44556`,
      `🌐 Website: https://elitetradingfd.com`,
      `📍 Indore, Madhya Pradesh`,
      ``,
      `Please let us know if you need any adjustments or clarifications!`,
    ].join("\n");

    setSharingPdf(true);

    try {
      // 4. Fetch the quotation PDF once as a Blob
      const pdfRes = await fetch(`/api/quotations/${quotation.id}/pdf`);
      if (!pdfRes.ok) {
        throw new Error("Failed to generate quotation PDF");
      }
      const pdfBlob = await pdfRes.blob();
      const safeQuoteNumber = quotation.quotationNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `Quotation_${safeQuoteNumber}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

      // 5. Try Web Share API with file-sharing support (mobile / supported devices)
      let sharedNatively = false;
      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [pdfFile] });

      if (canShareFiles) {
        try {
          await navigator.share({
            title: `Quotation ${quotation.quotationNumber} - Elite Trading`,
            text: message,
            files: [pdfFile],
          });
          sharedNatively = true;
        } catch (shareErr: unknown) {
          if ((shareErr as Error)?.name === "AbortError") {
            // User cancelled sharing in the native picker
            return;
          }
          console.warn("Native file sharing failed, falling back to desktop WhatsApp flow:", shareErr);
          sharedNatively = false;
        }
      }

      // 6. Desktop / unsupported fallback:
      // Download the PDF from the existing blob (no second fetch) & open WhatsApp Web
      if (!sharedNatively) {
        const blobUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");

        setWhatsAppNotice({
          quoteNumber: quotation.quotationNumber,
          customerName,
          phone: normalizedPhone,
        });
      }
    } catch (err: unknown) {
      console.error("WhatsApp quotation sharing error:", err);
      setWhatsAppError("Failed to generate or share quotation PDF. Please try again.");
    } finally {
      setSharingPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#DDE4DA] shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="p-2 rounded-lg border border-[#DDE4DA] hover:bg-slate-50 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#25382E]">
                {quotation.quotationNumber}
              </h1>
              <StatusBadge status={status} />
              {quotation.revisionNumber > 1 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                  Rev {quotation.revisionNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-[#718075]">
              {quotation.customer.name}
              {quotation.project?.name ? ` • ${quotation.project.name}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Workflow Action Buttons */}
          {status === "Draft" && (
            <button
              onClick={() => handleStatusChange("Sent")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Send for Approval
            </button>
          )}

          {status === "Sent" && (
            <>
              <button
                onClick={() => setApprovalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#174535] text-white text-xs font-bold hover:bg-[#10382D] shadow-sm cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Accept Quotation
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject Quotation
              </button>
              <button
                onClick={() => handleStatusChange("Revision Requested")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5" /> Request Revision
              </button>
            </>
          )}

          {status === "Approved" && !quotation.convertedProject && (
            <button
              disabled={converting}
              onClick={handleConvertToProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-bold hover:bg-[#173D30] shadow-md transition ring-2 ring-emerald-600 ring-offset-1"
            >
              <FolderPlus className="w-4 h-4" /> {converting ? "Converting..." : "Convert to Project"}
            </button>
          )}

          {quotation.convertedProject && (
            <Link
              href={`/projects/${quotation.convertedProject.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100"
            >
              <FolderPlus className="w-3.5 h-3.5" /> View Project ({quotation.convertedProject.projectCode})
            </Link>
          )}

          <select
            disabled={updatingStatus}
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
          >
            <option value="Draft">Draft</option>
            <option value="Sent">Sent / Awaiting Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Revision Requested">Revision Requested</option>
            <option value="Expired">Expired</option>
          </select>

          <Link
            href={`/quotations/${quotation.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Link>

          <button
            onClick={handleCreateRevision}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <GitBranch className="w-3.5 h-3.5" /> New Revision
          </button>

          <button
            onClick={handleDuplicate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>

          <a
            href={`/api/quotations/${quotation.id}/pdf`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#294C3B] text-white text-xs font-bold hover:bg-[#173D30]"
          >
            <FileDown className="w-3.5 h-3.5" /> Download PDF
          </a>

          <button
            type="button"
            disabled={sharingPdf}
            onClick={handleWhatsAppSend}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] shadow-sm transition cursor-pointer disabled:opacity-60"
            title="Send via WhatsApp"
          >
            {sharingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <WhatsAppIcon className="w-4 h-4 fill-white" />
            )}
            <span>{sharingPdf ? "Preparing..." : "Send via WhatsApp"}</span>
          </button>
        </div>
      </div>

      {/* Record Approval Modal */}
      {approvalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-[#25382E] text-base">Approve Quotation &amp; Create Project</h3>
              </div>
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRecordApproval} className="space-y-3.5 text-xs">
              <div className="bg-[#F7F8F4] p-3 rounded-lg border border-[#DDE4DA] text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Quotation Number:</span>
                  <span className="font-mono font-bold text-[#174535]">{quotation.quotationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800">{quotation.customer.name}</span>
                </div>
                <div className="flex justify-between border-t border-[#DDE4DA] pt-1">
                  <span className="font-semibold">Grand Total:</span>
                  <span className="font-bold text-[#174535]">{formatINR(quotation.grandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Project Name <span className="font-normal text-slate-400">(confirm or customize)</span>
                </label>
                <input
                  required
                  value={approvalForm.projectName}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, projectName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirmed / Approved By (Customer Representative) *
                </label>
                <input
                  required
                  value={approvalForm.approvedByCustomer}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, approvedByCustomer: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Approval Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={approvalForm.approvalRemarks}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, approvalRemarks: e.target.value })
                  }
                  placeholder="e.g. Approved via Email / WhatsApp with 50% advance agreement"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-800 text-[11px]">
                Upon approval, quotation status will change to Approved and a linked Project with status <strong>Approved – Installation Pending</strong> will be created automatically.
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovalModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 rounded-lg bg-[#294C3B] text-white font-bold hover:bg-[#173D30]"
                >
                  {updatingStatus ? "Approving..." : "Confirm Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Quotation Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 bg-rose-50 -m-6 mb-0 p-6 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-rose-900 text-base">Reject Quotation</h3>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-rose-400 hover:text-rose-600 text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmRejection} className="space-y-3.5 text-xs pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why the customer or company rejected this quotation..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
                >
                  {updatingStatus ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Revisions Bar */}
      {revisions.length > 1 && (
        <div className="no-print flex items-center gap-2 text-xs bg-white px-4 py-2.5 rounded-xl border border-[#DDE4DA]">
          <span className="font-semibold text-[#718075]">Revisions:</span>
          {revisions.map((r) => (
            <Link
              key={r.id}
              href={`/quotations/${r.id}`}
              className={`px-2.5 py-1 rounded-md font-mono font-semibold ${r.id === quotation.id
                  ? "bg-[#294C3B] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              R{r.revisionNumber} ({r.status})
            </Link>
          ))}
        </div>
      )}

      {/* Printable Technical Quotation Document */}
      <div className="bg-white rounded-xl border border-[#DDE4DA] shadow-sm overflow-hidden">
        {/* Document Header */}
        <div className="bg-[#173D30] text-[#F3F0E3] p-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={company.logoUrl || "/logo.png"}
              alt={company.companyName}
              className="w-12 h-12 rounded-xl object-contain border border-[#8BA77A]/50 bg-white/5 shrink-0"
            />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#F3F0E3]">
                {company.companyName}
              </h2>
              <p className="text-xs text-[#B2C6A5]">{company.tagline}</p>
              <p className="text-xs text-[#F3F0E3]/90 mt-1">
                {company.phone} • {company.email} • {company.website}
              </p>
              <p className="text-[11px] text-[#B2C6A5]">
                GSTIN: {company.gstNumber} | {company.address}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <div className="text-[11px] font-bold text-[#B2C6A5] uppercase tracking-widest">
              Technical Quotation
            </div>
            <div className="text-xl font-mono font-bold mt-0.5 text-[#F3F0E3]">
              {quotation.quotationNumber}
            </div>
            <div className="text-xs text-[#B2C6A5] mt-1">
              Date: {formatDate(quotation.quotationDate)}
            </div>
            <div className="text-xs text-[#B2C6A5]">
              Ref: {quotation.referenceNumber || "-"}
            </div>
          </div>
        </div>

        {/* Customer & Project Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#DDE4DA] bg-slate-50 text-xs">
          <div className="p-4 border-b md:border-b-0 md:border-r border-[#DDE4DA]">
            <div className="font-bold text-[#294C3B] uppercase mb-1">
              Customer Details
            </div>
            <div className="font-bold text-sm text-[#25382E]">
              {quotation.customer.name}
            </div>
            <div className="text-slate-600 mt-0.5">
              Attn: {quotation.customer.contactPerson} • {quotation.customer.mobile}
            </div>
            <div className="text-[#718075] mt-0.5">
              {quotation.customer.billingAddress}
              {quotation.customer.city ? `, ${quotation.customer.city}` : ""}
            </div>
          </div>
          <div className="p-4">
            <div className="font-bold text-[#294C3B] uppercase mb-1">
              Project &amp; Site
            </div>
            <div className="font-bold text-sm text-[#25382E]">
              {quotation.project?.name || "Pending Project Creation (After Approval)"}
            </div>
            <div className="text-slate-600 mt-0.5">
              Site: {quotation.siteLocation}
            </div>
            <div className="text-[#718075] mt-0.5">
              Salesperson: {quotation.salesperson || "-"}
            </div>
          </div>
        </div>

        {/* Components Technical Cards */}
        <div className="p-5 space-y-6">
          {quotation.components.map((comp, idx) => {
            const cfg = parseDrawingConfig(
              comp.drawingConfigJson,
              comp.drawingType,
              comp.widthMm
            );
            const isVent = isVentilationProduct(comp.drawingType, comp.name, cfg);
            const vMetrics = isVent
              ? computeVentilationFanMetrics(comp.widthMm, comp.heightMm, cfg)
              : null;

            const specRows: Array<[string, string, boolean?]> = [
              ["Code / Name", `${comp.code} – ${comp.name}`, true],
              ["Size (W × H)", `${comp.widthMm} mm × ${comp.heightMm} mm`],
            ];

            if (vMetrics) {
              specRows.push([
                "Section Dims",
                `Fan: ${vMetrics.fanMm}W × ${vMetrics.topMm}H mm | Glass: ${vMetrics.rightTopMm}W × ${vMetrics.bottomMm}H mm`,
                true,
              ]);
            }

            specRows.push(
              ["Profile System", comp.profileSystem || "-"],
              ["Glass", comp.glassType || "-"],
              ["Sq.Ft. per Window", `${formatNumber(comp.sqFtPerUnit)} Sq.Ft.`],
              ["Value per Sq.Ft.", formatINR(comp.ratePerSqFt)],
              ["Unit Price", formatINR(comp.unitPrice)],
              ["Quantity", `${comp.quantity} Pcs`],
              ["Total Value", formatINR(comp.totalValue), true]
            );

            if (comp.showUpvcFields) {
              if (comp.profileColour) specRows.push(["Profile Colour", comp.profileColour]);
              if (comp.meshType) specRows.push(["Mesh Type", comp.meshType]);
              if (comp.track) specRows.push(["Track", comp.track]);
              if (comp.trackRi) specRows.push(["Track RI", comp.trackRi]);
              if (comp.slidingSash) specRows.push(["Sliding Sash", comp.slidingSash]);
              if (comp.slidingSashRi) specRows.push(["Sliding Sash RI", comp.slidingSashRi]);
              if (comp.flymeshSash) specRows.push(["Flymesh Sash", comp.flymeshSash]);
              if (comp.mullionRi) specRows.push(["Mullion RI", comp.mullionRi]);
            } else {
              if (comp.profileColour) specRows.push(["Finish / Colour", comp.profileColour]);
              if (comp.meshType) specRows.push(["Mesh Type", comp.meshType]);
            }

            if (comp.locking) specRows.push(["Locking", comp.locking]);
            if (comp.handleColour) specRows.push(["Handle Colour", comp.handleColour]);
            if (comp.handleType) specRows.push(["Handle Type", comp.handleType]);
            if (comp.lockableEspag) specRows.push(["Lockable Espag", comp.lockableEspag]);
            if (comp.rollerType) specRows.push(["Roller / Hinges", comp.rollerType]);
            if (comp.additionalAccess) specRows.push(["Additional Accessories", comp.additionalAccess]);
            if (comp.remarks) specRows.push(["Remarks", comp.remarks]);

            return (
              <div
                key={comp.id}
                className="print-break-inside-avoid border border-slate-300 rounded-lg overflow-hidden"
              >
                <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex items-center justify-between">
                  <span className="font-bold text-sm text-[#294C3B]">
                    #{idx + 1} &nbsp; {comp.code} — {comp.name}
                  </span>
                  <span className="text-xs font-bold text-blue-700 uppercase">
                    {comp.location || comp.categoryName}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12">
                  {/* Left Drawing */}
                  <div className="md:col-span-5 p-4 border-b md:border-b-0 md:border-r border-[#DDE4DA] flex items-center justify-center bg-white">
                    <TechnicalDrawingSvg
                      widthMm={comp.widthMm}
                      heightMm={comp.heightMm}
                      drawingType={comp.drawingType}
                      drawingConfigJson={comp.drawingConfigJson}
                      customImageUrl={comp.customImageUrl}
                      location={comp.location}
                      code={comp.code}
                    />
                  </div>

                  {/* Right Spec Table */}
                  <div className="md:col-span-7 divide-y divide-slate-200 text-xs">
                    {specRows.map(([label, val, highlight], rIdx) => (
                      <div
                        key={rIdx}
                        className={`grid grid-cols-12 px-3 py-1.5 ${highlight
                            ? "bg-blue-50/80 font-bold text-[#294C3B]"
                            : rIdx % 2 === 1
                              ? "bg-slate-50/70"
                              : "bg-white"
                          }`}
                      >
                        <div className="col-span-5 text-slate-600 font-semibold">
                          {label}
                        </div>
                        <div className="col-span-7 text-[#25382E]">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quote Total Summary */}
          <div className="print-break-inside-avoid pt-4 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-slate-50 border border-[#DDE4DA] rounded-lg p-4 text-xs space-y-2">
              <div className="font-bold text-[#294C3B] uppercase">
                Terms &amp; Conditions
              </div>
              <div className="whitespace-pre-line text-slate-600 leading-relaxed">
                {quotation.termsText || "Standard EliteTrading terms apply."}
              </div>
            </div>

            <div className="md:col-span-5 border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-[#294C3B] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
                Quote Total
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-slate-600">No. of Components</span>
                  <span className="font-bold">{quotation.totalComponents} Pcs</span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-slate-600">Total Sq.Ft.</span>
                  <span className="font-mono font-bold">
                    {formatNumber(quotation.totalSqFt)} Sq.Ft.
                  </span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-slate-600">Average Value per Sq.Ft.</span>
                  <span className="font-semibold">
                    {formatINR(quotation.avgRatePerSqFt)}
                  </span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-slate-600">Total Project Cost</span>
                  <span className="font-bold">{formatINR(quotation.subtotal)}</span>
                </div>
                {quotation.discountAmount > 0 && (
                  <div className="px-4 py-2 flex justify-between text-rose-600">
                    <span>Discount</span>
                    <span>- {formatINR(quotation.discountAmount)}</span>
                  </div>
                )}
                {quotation.transportCharges > 0 && (
                  <div className="px-4 py-2 flex justify-between">
                    <span>Transportation</span>
                    <span>{formatINR(quotation.transportCharges)}</span>
                  </div>
                )}
                {quotation.installationCharges > 0 && (
                  <div className="px-4 py-2 flex justify-between">
                    <span>Installation</span>
                    <span>{formatINR(quotation.installationCharges)}</span>
                  </div>
                )}
                {quotation.otherCharges > 0 && (
                  <div className="px-4 py-2 flex justify-between">
                    <span>Other Charges</span>
                    <span>{formatINR(quotation.otherCharges)}</span>
                  </div>
                )}
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-slate-600">
                    GST ({quotation.gstPercent}%)
                  </span>
                  <span className="font-semibold">{formatINR(quotation.gstAmount)}</span>
                </div>
                <div className="px-4 py-3 bg-[#294C3B] text-white flex justify-between items-center text-sm font-bold">
                  <span>GRAND TOTAL</span>
                  <span className="text-amber-400">
                    {formatINR(quotation.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Instruction Notice Banner */}
      {whatsAppNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border-2 border-[#25D366] rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-[#1F2937]">Quotation PDF Downloaded</h4>
                <button
                  onClick={() => setWhatsAppNotice(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm leading-none"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                WhatsApp opened for <strong className="text-[#1F2937]">{whatsAppNotice.customerName}</strong> (+{whatsAppNotice.phone}).
              </p>
              <div className="mt-2 text-xs font-semibold text-[#174535] bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <span>📎</span> Please attach the downloaded quotation PDF and press <strong>Send</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Error Toast */}
      {whatsAppError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border-2 border-rose-300 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-rose-700">WhatsApp Error</h4>
                <button
                  onClick={() => setWhatsAppError(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm leading-none"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1">{whatsAppError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

