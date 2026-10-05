import {
  cashfreeConfigured,
  createOrGetCashfreeRefund,
} from "@/lib/payments/cashfree";
import {
  finalizeReturnRefund,
  getReturnOperation,
} from "@/lib/admin/return-operations";
import { notify } from "@/lib/admin/notifications";
import { sendOrderEmailSafe } from "@/lib/notifications/customer-email";

export type RefundSyncResult = {
  state:
    | "NOT_REQUIRED"
    | "MANUAL_REQUIRED"
    | "NOT_CONFIGURED"
    | "PAYMENT_NOT_REFUNDABLE"
    | "SUCCESS"
    | "PENDING"
    | "ONHOLD"
    | "FAILED"
    | "CANCELLED"
    | "ERROR";
  provider?: "cashfree";
  refundId?: string | null;
  cfRefundId?: string | null;
  refundArn?: string | null;
  message?: string | null;
  finalized?: boolean;
};

const refundablePaymentStates = new Set([
  "PAID",
  "PARTIALLY_REFUNDED",
]);

export async function syncApprovedRefund(
  returnId: string,
  note?: string,
): Promise<RefundSyncResult> {
  const row = await getReturnOperation(returnId);
  if (!row) throw new Error("Return not found.");

  if (row.returnStatus !== "APPROVED") {
    throw new Error("Return must be approved before a refund can be processed.");
  }

  const refundMinor = row.refundMinor ?? 0;

  if (refundMinor <= 0) {
    return {
      state: "NOT_REQUIRED",
      message: "No refund amount is recorded for this return.",
    };
  }

  if (row.refundProcessedAt) {
    return {
      state: "SUCCESS",
      provider: row.paymentMethod === "cashfree" ? "cashfree" : undefined,
      message: "Refund was already finalized locally.",
      finalized: true,
    };
  }

  if (row.paymentMethod !== "cashfree") {
    return {
      state: "MANUAL_REQUIRED",
      message:
        "This order was not paid through Cashfree. Handle the refund manually if money was collected.",
    };
  }

  if (!refundablePaymentStates.has(row.paymentStatus)) {
    return {
      state: "PAYMENT_NOT_REFUNDABLE",
      provider: "cashfree",
      message: `Payment status ${row.paymentStatus} is not eligible for an automatic Cashfree refund.`,
    };
  }

  if (!cashfreeConfigured()) {
    return {
      state: "NOT_CONFIGURED",
      provider: "cashfree",
      message: "Cashfree credentials are not configured yet.",
    };
  }

  const refund = await createOrGetCashfreeRefund({
    orderNumber: row.orderNumber,
    returnId: row.id,
    amountMinor: refundMinor,
    note,
  });

  const providerAmountMinor = Math.round(refund.refund_amount * 100);
  if (providerAmountMinor !== refundMinor) {
    throw new Error("Cashfree refund amount does not match the approved refund.");
  }

  if (
    refund.refund_currency &&
    refund.refund_currency.toUpperCase() !== "INR"
  ) {
    throw new Error("Cashfree refund currency does not match the order currency.");
  }

  const providerState = refund.refund_status.toUpperCase();

  if (providerState === "SUCCESS") {
    const finalized = await finalizeReturnRefund({
      returnId: row.id,
      orderId: row.orderId,
      refundMinor,
      totalMinor: row.totalMinor,
    });

    if (!finalized.alreadyProcessed) {
      await Promise.allSettled([
        sendOrderEmailSafe(row.orderId, "REFUND_CONFIRMED"),
        notify({
          type: "REFUND_SUCCESS",
          title: "Refund confirmed",
          message: `${row.orderNumber} refund was confirmed by Cashfree`,
          entityType: "ORDER",
          entityId: row.orderId,
          severity: "SUCCESS",
        }),
      ]);
    }

    return {
      state: "SUCCESS",
      provider: "cashfree",
      refundId: refund.refund_id,
      cfRefundId: refund.cf_refund_id
        ? String(refund.cf_refund_id)
        : null,
      refundArn: refund.refund_arn ?? null,
      message: refund.status_description ?? "Refund confirmed by Cashfree.",
      finalized: true,
    };
  }

  if (
    providerState === "PENDING" ||
    providerState === "ONHOLD" ||
    providerState === "FAILED" ||
    providerState === "CANCELLED"
  ) {
    return {
      state: providerState,
      provider: "cashfree",
      refundId: refund.refund_id,
      cfRefundId: refund.cf_refund_id
        ? String(refund.cf_refund_id)
        : null,
      refundArn: refund.refund_arn ?? null,
      message: refund.status_description ?? null,
      finalized: false,
    };
  }

  return {
    state: "ERROR",
    provider: "cashfree",
    refundId: refund.refund_id,
    message: `Unknown Cashfree refund status: ${refund.refund_status}`,
    finalized: false,
  };
}
