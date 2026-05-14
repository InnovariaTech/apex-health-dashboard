// @ts-nocheck
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCaseDetails } from "@/hooks/care-validate/useCases";
import { useDocuments } from "@/hooks/care-validate/useDocuments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import type { CaseDetailsItem } from "@/types/care-validate/case_types";
import CaseDynamicFormCard from "@/views/patient/components/case/CaseDynamicFormCard";
import CaseDocumentsPanel from "@/views/patient/components/case/CaseDocumentsPanel";
import CaseTimeline from "@/views/patient/components/case/CaseTimeline";
import CaseAppointmentsPanel from "@/views/patient/components/case/CaseAppointmentsPanel";
import CaseChatPanel from "@/views/patient/components/case/CaseChatPanel";
import { normalizeCaseForms } from "@/views/patient/utils/caseFormUtils";

function formatCaseLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
    .join(" ");
}

function getStatusBadgeVariant(status: string) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "CLOSED" || normalized === "COMPLETED") return "secondary";
  if (normalized === "URGENT") return "danger";
  if (normalized === "IN_PROGRESS" || normalized === "OPEN" || normalized === "ACTIVE")
    return "info";
  return "default";
}

function getPromoCode(caseDetails: CaseDetailsItem): string {
  const raw = caseDetails.raw ?? {};

  const candidates = [
    raw.promoCode,
    raw.promo_code,
    raw.discountCode,
    raw.discount_code,
    raw.couponCode,
    raw.coupon_code,
  ];

  const promo = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0
  );

  return promo ? String(promo) : "";
}

export default function MyCaseDetails() {
  const { caseId = "" } = useParams<{ caseId: string }>();
  const detailsParams = useMemo(
    () => ({
      includeAttachments: true,
      documentFormat: "url",
      includeCalendarEvents: true,
      includeOrders: true,
      includeCaseProducts: true,
      includePayments: true,
    }),
    []
  );

  const { data: caseDetails, isLoading, isError } = useCaseDetails(
    caseId,
    detailsParams,
    { enablePolling: true }
  );
  const {
    data: userDocuments = [],
    isLoading: isUserDocumentsLoading,
  } = useDocuments();
  const forms = useMemo(
    () => (caseDetails ? normalizeCaseForms(caseDetails) : []),
    [caseDetails]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground min-h-screen">
      <Link
        to={createPageUrl("MyCases")}
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to My Cases
      </Link>

      {/* Page head */}
      <div className="mb-6 pb-5 border-b border-border">
        <p className="apex-eyebrow">Care portal</p>
        <h1 className="apex-page-title mt-1">
          Case <em>details</em>
        </h1>
        <p className="text-[13px] text-ink-2 mt-2">
          Review your case information and timeline.
        </p>
      </div>

      {isError || !caseDetails ? (
        <div
          className="apex-card p-4 text-sm"
          style={{ borderColor: "var(--att)", background: "var(--att-soft)" }}
        >
          <span style={{ color: "var(--att)" }}>
            Unable to load this case right now. Please try again.
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          <CaseTimeline caseDetails={caseDetails} />

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="w-full max-w-2xl flex">
              <TabsTrigger value="overview" className="flex-1">
                Overview
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex-1">
                Appointments
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                Chat
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl">
                      {caseDetails.title || caseDetails.raw?.title || "Untitled Case"}
                    </CardTitle>
                    <Badge
                      variant={getStatusBadgeVariant(
                        caseDetails.status || caseDetails.raw?.status || "open"
                      )}
                      className="whitespace-nowrap shrink-0"
                    >
                      {formatCaseLabel(
                        String(caseDetails.status || caseDetails.raw?.status || "open")
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-border text-[13px]">
                    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                      <dt className="text-muted-foreground">Case ID</dt>
                      <dd className="font-mono text-foreground">
                        {caseDetails.shortId || caseDetails.id || caseId}
                      </dd>
                    </div>
                    {caseDetails.raw?.productBundle?.name && (
                      <div className="flex items-center justify-between gap-3 py-2.5">
                        <dt className="text-muted-foreground">Product Bundle</dt>
                        <dd className="text-foreground text-right">
                          {String(caseDetails.raw.productBundle.name)}
                        </dd>
                      </div>
                    )}
                    {getPromoCode(caseDetails) && (
                      <div className="flex items-center justify-between gap-3 py-2.5">
                        <dt className="text-muted-foreground">Promo Code</dt>
                        <dd className="font-mono text-foreground">
                          {getPromoCode(caseDetails)}
                        </dd>
                      </div>
                    )}
                    {caseDetails.submitterEmail && (
                      <div className="flex items-center justify-between gap-3 py-2.5 last:pb-0">
                        <dt className="text-muted-foreground">Submitter Email</dt>
                        <dd className="text-foreground text-right">
                          {caseDetails.submitterEmail}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {forms.map((form) => (
                <CaseDynamicFormCard key={form.id} form={form} />
              ))}
            </TabsContent>

            <TabsContent value="appointments">
              <CaseAppointmentsPanel caseDetails={caseDetails} />
            </TabsContent>

            <TabsContent value="chat">
              <CaseChatPanel caseDetails={caseDetails} caseId={caseId} />
            </TabsContent>

            <TabsContent value="documents">
              <CaseDocumentsPanel
                caseDetails={caseDetails}
                userDocuments={userDocuments}
                isUserDocumentsLoading={isUserDocumentsLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
