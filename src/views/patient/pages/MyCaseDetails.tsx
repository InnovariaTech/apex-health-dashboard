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

  const { data: caseDetails, isLoading, isError } = useCaseDetails(caseId, detailsParams);
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link
        to={createPageUrl("MyCases")}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Cases
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Case Details</h1>
        <p className="text-muted-foreground mt-2">Review your case information and timeline.</p>
      </div>

      {isError || !caseDetails ? (
        <Card className="border-2 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-foreground">
              Unable to load this case right now. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <CaseTimeline caseDetails={caseDetails} />

          <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted p-1">
            <TabsTrigger value="overview" className="font-bold data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="appointments" className="font-bold data-[state=active]:bg-background">
              Appointments
            </TabsTrigger>
            <TabsTrigger value="chat" className="font-bold data-[state=active]:bg-background">
              Chat
            </TabsTrigger>
            <TabsTrigger value="documents" className="font-bold data-[state=active]:bg-background">
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="border-2 border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xl font-bold text-foreground">
                    {caseDetails.title || caseDetails.raw?.title || "Untitled Case"}
                  </CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {formatCaseLabel(String(caseDetails.status || caseDetails.raw?.status || "open"))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Case ID:{" "}
                  <span className="text-foreground font-medium">
                    {caseDetails.shortId || caseDetails.id || caseId}
                  </span>
                </p>
                {caseDetails.raw?.productBundle?.name && (
                  <p className="text-muted-foreground">
                    Product Bundle:{" "}
                    <span className="text-foreground font-medium">
                      {String(caseDetails.raw.productBundle.name)}
                    </span>
                  </p>
                )}
                {getPromoCode(caseDetails) && (
                  <p className="text-muted-foreground">
                    Promo Code Details:{" "}
                    <span className="text-foreground font-medium">{getPromoCode(caseDetails)}</span>
                  </p>
                )}
                {caseDetails.submitterEmail && (
                  <p className="text-muted-foreground">
                    Submitter Email:{" "}
                    <span className="text-foreground font-medium">{caseDetails.submitterEmail}</span>
                  </p>
                )}
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
            <CaseChatPanel caseDetails={caseDetails} />
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
