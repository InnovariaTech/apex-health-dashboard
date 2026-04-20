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
import { useEnvironment } from "@/lib/EnvironmentContext";
import { CreditCard, Package, CheckCircle, ExternalLink, Receipt } from "lucide-react";

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

export default function Billing() {
  const { environment } = useEnvironment();
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
  const planPrice = readString(
    planAmount ? `${planAmount}/mo` : "",
    "$0.00/mo"
  );
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
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment history</p>
      </div>
      {hasError && (
        <p className="text-sm text-destructive mb-4">
          Unable to load full billing details right now. Partial data may be shown.
        </p>
      )}

      {/* Current Plan */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: environment.primaryColor }} />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg text-foreground">{planName}</p>
              <p className="text-sm text-muted-foreground">Renews on {renewsOn}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">{planPrice}</p>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" /> {planStatus}
              </Badge>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <Button variant="outline" className="flex-1 font-bold">
              Change Plan
            </Button>
            <Button variant="outline" className="flex-1 font-bold text-destructive border-destructive/40 hover:bg-destructive/5">
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" style={{ color: environment.primaryColor }} />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">{paymentBrand}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">•••• •••• •••• {paymentLast4}</p>
                <p className="text-xs text-muted-foreground">Expires {paymentExpiry}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="font-bold">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" style={{ color: environment.primaryColor }} />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoiceRows.length === 0 && (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            )}
            {invoiceRows.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-semibold text-sm text-foreground">{inv.id}</p>
                  <p className="text-xs text-muted-foreground">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">{inv.amount}</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">{inv.status}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    disabled={!inv.url}
                    onClick={() => inv.url && window.open(inv.url, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}