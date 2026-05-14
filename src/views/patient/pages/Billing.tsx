// @ts-nocheck
import React from "react";
import {
  useBilling,
  useBillingPaymentMethods,
  useBillingPayments,
} from "@/hooks/care-validate/useBilling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Package,
  CheckCircle,
  ExternalLink,
  Receipt,
  ShieldCheck,
} from "lucide-react";

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.results)) return value.results;
  return [];
}

function readString(...values) {
  const first = values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
  return first ? String(first) : "";
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return `$${value.toFixed(2)}`;
  const num = Number(value);
  if (!Number.isNaN(num)) return `$${num.toFixed(2)}`;
  return String(value);
}

const STATUS_BADGE = {
  paid: "success",
  succeeded: "success",
  active: "success",
  pending: "warning",
  processing: "warning",
  failed: "danger",
  canceled: "danger",
  cancelled: "danger",
  refunded: "info",
};

function statusVariant(status) {
  return STATUS_BADGE[String(status || "").toLowerCase()] || "secondary";
}

export default function Billing() {
  const { data: billingCases = [], isLoading: isCasesLoading, isError: isCasesError } = useBilling();
  const {
    data: paymentMethodsData,
    isLoading: isPaymentMethodsLoading,
    isError: isPaymentMethodsError,
  } = useBillingPaymentMethods();
  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
  } = useBillingPayments();

  const isLoading = isCasesLoading || isPaymentMethodsLoading || isPaymentsLoading;
  const hasError = isCasesError || isPaymentMethodsError || isPaymentsError;

  const primaryCase = billingCases[0];
  const subscriptions = toArray(primaryCase?.subscriptions || primaryCase?.raw?.subscriptions);
  const activeSubscription =
    subscriptions.find((item) =>
      String(item?.status || "").toLowerCase().includes("active")
    ) || subscriptions[0];

  const planName = readString(
    activeSubscription?.name,
    activeSubscription?.planName,
    activeSubscription?.productName,
    activeSubscription?.title,
    primaryCase?.title,
    "No active plan"
  );
  const planStatus = readString(
    activeSubscription?.status,
    primaryCase?.status,
    "active"
  );
  const planAmount = formatCurrency(
    activeSubscription?.amount ??
      activeSubscription?.price ??
      activeSubscription?.monthlyPrice ??
      activeSubscription?.billingAmount
  );
  const planPrice = readString(planAmount || "$0.00");
  const renewsOn = readString(
    activeSubscription?.renewsOn,
    activeSubscription?.renewalDate,
    activeSubscription?.nextBillingDate,
    activeSubscription?.currentPeriodEnd,
    "—"
  );

  const paymentMethods = toArray(
    paymentMethodsData?.paymentMethods || paymentMethodsData?.methods || paymentMethodsData
  );
  const primaryMethod =
    paymentMethods.find((method) => method?.isDefault || method?.default) ||
    paymentMethods[0];
  const paymentBrand = readString(primaryMethod?.brand, primaryMethod?.cardType, "CARD").toUpperCase();
  const paymentLast4 = readString(
    primaryMethod?.last4,
    primaryMethod?.cardLast4,
    "••••"
  );
  const paymentExpiry = readString(
    primaryMethod?.expiry,
    primaryMethod?.expDate,
    primaryMethod?.expiresAt,
    primaryMethod?.expMonth && primaryMethod?.expYear
      ? `${String(primaryMethod.expMonth).padStart(2, "0")}/${String(primaryMethod.expYear).slice(-2)}`
      : "",
    "—"
  );

  const payments = toArray(paymentsData?.payments || paymentsData) || [];
  const fallbackPayments = toArray(primaryCase?.payments || primaryCase?.raw?.payments);
  const invoiceRows = (payments.length > 0 ? payments : fallbackPayments).map((payment, idx) => ({
    id: readString(payment?.invoiceId, payment?.id, payment?.reference, `INV-${idx + 1}`),
    date: readString(payment?.date, payment?.createdAt, payment?.paidAt, "—"),
    amount: readString(
      formatCurrency(payment?.amount ?? payment?.total ?? payment?.value),
      "—"
    ),
    status: readString(payment?.status, "paid"),
    url: readString(payment?.invoiceUrl, payment?.receiptUrl, payment?.url),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground">
      {/* Page head */}
      <div className="mb-6 pb-5 border-b border-border flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="apex-eyebrow flex items-center gap-1.5 mb-2">
            <CreditCard className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />
            Billing &amp; payments
          </div>
          <h1 className="apex-page-title">
            Billing <em>overview</em>
          </h1>
          <p className="text-[13px] text-ink-2 mt-2">
            Manage your subscription, payment method and invoice history.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-[0.08em] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--apex-accent)" }} />
          Secure payments
        </span>
      </div>

      {hasError && (
        <div
          className="mb-6 apex-card p-4 text-sm"
          style={{ borderColor: "var(--att)", background: "var(--att-soft)" }}
        >
          <span style={{ color: "var(--att)" }}>
            Unable to load full billing details right now. Partial data may be shown.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-3.5">
        {/* Current Plan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="apex-eyebrow mb-1.5">Plan</p>
                <p className="font-serif text-xl font-medium text-foreground">{planName}</p>
                <p className="text-[13px] text-ink-2 mt-1">
                  Renews on <span className="font-mono">{renewsOn}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-[32px] font-medium leading-none tracking-[-0.035em] text-foreground">
                  {planPrice}
                  <span className="font-sans text-sm text-muted-foreground ml-1 font-normal">
                    /mo
                  </span>
                </div>
                <Badge variant={statusVariant(planStatus)} className="mt-2.5">
                  <CheckCircle className="w-3 h-3 mr-1" /> {planStatus}
                </Badge>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1">
                Change Plan
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-primary border-primary/40 hover:bg-primary/5"
              >
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[10px] border border-border bg-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="apex-eyebrow">{paymentBrand}</span>
                <span className="font-mono text-[11px] text-ink-3">
                  Exp {paymentExpiry}
                </span>
              </div>
              <p className="font-mono text-[15px] tracking-[0.08em] text-foreground">
                •••• •••• •••• {paymentLast4}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceRows.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em] py-2 pr-4">
                      Invoice
                    </th>
                    <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em] py-2 pr-4">
                      Date
                    </th>
                    <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em] py-2 pr-4">
                      Amount
                    </th>
                    <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em] py-2 pr-4">
                      Status
                    </th>
                    <th className="text-right text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em] py-2">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceRows.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/60"
                    >
                      <td className="py-3 pr-4 font-mono text-[12px] font-medium text-foreground">
                        {inv.id}
                      </td>
                      <td className="py-3 pr-4 font-mono text-[12px] text-muted-foreground">
                        {inv.date}
                      </td>
                      <td className="py-3 pr-4 font-mono text-[13px] font-medium text-foreground">
                        {inv.amount}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 ml-auto"
                          disabled={!inv.url}
                          onClick={() => inv.url && window.open(inv.url, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
