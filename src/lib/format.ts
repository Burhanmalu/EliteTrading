export const SQFT_DIVISOR = 92903.04;

export function calculateSqFt(widthMm: number, heightMm: number): number {
  if (!widthMm || !heightMm || widthMm <= 0 || heightMm <= 0) return 0;
  return Number(((widthMm * heightMm) / SQFT_DIVISOR).toFixed(2));
}

export function formatINR(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  if (Number.isNaN(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(val: number | string | null | undefined, decimals = 2): string {
  const num = Number(val ?? 0);
  if (Number.isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export interface QuotationTotalsInput {
  components: Array<{
    sqFtPerUnit: number;
    quantity: number;
    totalValue: number;
  }>;
  discountType: string;
  discountValue: number;
  transportCharges: number;
  installationCharges: number;
  otherCharges: number;
  gstPercent: number;
  taxTreatment: string; // EXCLUSIVE | INCLUSIVE | NO_GST
}

export interface QuotationTotalsResult {
  totalComponents: number;
  totalSqFt: number;
  avgRatePerSqFt: number;
  subtotal: number;
  discountAmount: number;
  additionalCharges: number;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
}

export function calculateQuotationTotals(input: QuotationTotalsInput): QuotationTotalsResult {
  let totalComponents = 0;
  let totalSqFt = 0;
  let subtotal = 0;

  for (const c of input.components) {
    const qty = Math.max(0, Number(c.quantity) || 0);
    const sqft = Math.max(0, Number(c.sqFtPerUnit) || 0);
    const val = Math.max(0, Number(c.totalValue) || 0);
    totalComponents += qty;
    totalSqFt += sqft * qty;
    subtotal += val;
  }

  totalSqFt = Number(totalSqFt.toFixed(2));
  subtotal = Number(subtotal.toFixed(2));

  const avgRatePerSqFt = totalSqFt > 0 ? Number((subtotal / totalSqFt).toFixed(2)) : 0;

  let discountAmount = 0;
  if (input.discountType === "PERCENT") {
    discountAmount = (subtotal * Math.max(0, Number(input.discountValue) || 0)) / 100;
  } else {
    discountAmount = Math.max(0, Number(input.discountValue) || 0);
  }
  discountAmount = Number(Math.min(discountAmount, subtotal).toFixed(2));

  const additionalCharges = Number(
    (
      Math.max(0, Number(input.transportCharges) || 0) +
      Math.max(0, Number(input.installationCharges) || 0) +
      Math.max(0, Number(input.otherCharges) || 0)
    ).toFixed(2)
  );

  const afterDiscountAndCharges = Number(Math.max(0, subtotal - discountAmount + additionalCharges).toFixed(2));
  const gstRate = Math.max(0, Number(input.gstPercent) || 0);

  let taxableAmount = afterDiscountAndCharges;
  let gstAmount = 0;
  let grandTotal = afterDiscountAndCharges;

  if (input.taxTreatment === "NO_GST" || gstRate === 0) {
    gstAmount = 0;
    grandTotal = afterDiscountAndCharges;
  } else if (input.taxTreatment === "INCLUSIVE") {
    taxableAmount = Number((afterDiscountAndCharges / (1 + gstRate / 100)).toFixed(2));
    gstAmount = Number((afterDiscountAndCharges - taxableAmount).toFixed(2));
    grandTotal = afterDiscountAndCharges;
  } else {
    // EXCLUSIVE
    taxableAmount = afterDiscountAndCharges;
    gstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
    grandTotal = Number((taxableAmount + gstAmount).toFixed(2));
  }

  return {
    totalComponents,
    totalSqFt,
    avgRatePerSqFt,
    subtotal,
    discountAmount,
    additionalCharges,
    taxableAmount,
    gstAmount,
    grandTotal,
  };
}

