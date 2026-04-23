export const queryKeys = {
  auth: {
    user: () => ["auth", "user"] as const,
  },
  careValidate: {
    cases: (
      includePayments = false,
      startTime?: string,
      endTime?: string,
      recordsPerPage = 100,
      includeAttachments = true,
      includeOrders = true,
      includeCalendarEvents = false,
      documentFormat = "url"
    ) =>
      [
        "care-validate",
        "cases",
        {
          includePayments,
          startTime: startTime ?? "all",
          endTime: endTime ?? "all",
          recordsPerPage,
          includeAttachments,
          includeOrders,
          includeCalendarEvents,
          documentFormat,
        },
      ] as const,
    treatmentBundles: (isVisible?: boolean) =>
      [
        "care-validate",
        "treatment-bundles",
        {
          isVisible: isVisible ?? "all",
        },
      ] as const,
    treatmentBundleById: (
      bundleUUID: string,
      includeIntakeForm?: boolean,
      includeFollowupForm?: boolean
    ) =>
      [
        "care-validate",
        "treatment-bundle-by-id",
        bundleUUID,
        {
          includeIntakeForm:
            typeof includeIntakeForm === "boolean" ? includeIntakeForm : "all",
          includeFollowupForm:
            typeof includeFollowupForm === "boolean" ? includeFollowupForm : "all",
        },
      ] as const,
    documents: () => ["care-validate", "documents"] as const,
    billingCases: () => ["care-validate", "billing-cases"] as const,
    billingPaymentMethods: () => ["care-validate", "billing-payment-methods"] as const,
    billingPayments: () => ["care-validate", "billing-payments"] as const,
    profileUserStatus: (email?: string) =>
      ["care-validate", "profile-user-status", { email: email ?? "all" }] as const,
    // Backward-compatible alias (old naming)
    profileUser: (email?: string) =>
      ["care-validate", "profile-user-status", { email: email ?? "all" }] as const,
    profilePartnerIntegration: (linkName?: string) =>
      [
        "care-validate",
        "profile-partner-integration",
        { linkName: linkName ?? "all" },
      ] as const,
    profileGlobalSettings: () => ["care-validate", "profile-global-settings"] as const,
    profilePromoCode: (code?: string, productBundleId?: string) =>
      [
        "care-validate",
        "profile-promo-code",
        {
          code: code ?? "all",
          productBundleId: productBundleId ?? "all",
        },
      ] as const,
    caseComments: (recordsPerPage = 20) =>
      ["care-validate", "case-comments", { recordsPerPage }] as const,
    caseCommentsById: (caseId: string, recordsPerPage = 20, sortOrder = "DESC") =>
      ["care-validate", "case-comments-by-id", caseId, { recordsPerPage, sortOrder }] as const,
    caseDetails: (
      caseId: string,
      includeAttachments = true,
      documentFormat = "base64",
      includeCalendarEvents = false,
      includeOrders = false,
      includeCaseProducts = false,
      includePayments = false
    ) =>
      [
        "care-validate",
        "case-details",
        caseId,
        {
          includeAttachments,
          documentFormat,
          includeCalendarEvents,
          includeOrders,
          includeCaseProducts,
          includePayments,
        },
      ] as const,
    latestCaseId: () => ["care-validate", "latest-case-id"] as const,
  },
  patients: {
    me: ["patients", "me"] as const,
    home: (email?: string | null) => ["patients", "home", email ?? "anonymous"] as const,
  },
};
