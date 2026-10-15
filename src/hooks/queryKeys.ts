export const queryKeys = {
  auth: {
    user: () => ["auth", "user"] as const,
  },
  shop: {
    catalog: () => ["shop", "catalog"] as const,
  },
  beluga: {
    intakeRequirements: () => ["beluga", "intake-requirements"] as const,
    pharmacies: (params: {
      name?: string;
      city?: string;
      state?: string;
      zip?: string;
    }) => ["beluga", "pharmacies", params] as const,
    visits: (statuses?: string[]) =>
      ["beluga", "visits", statuses?.length ? [...statuses].sort() : "all"] as const,
    visit: (masterId: string) => ["beluga", "visit", masterId] as const,
    chat: (masterId: string) => ["beluga", "chat", masterId] as const,
  },
  healthie: {
    /** The patient's message threads with the care team, and the unread count. */
    threads: () => ["healthie", "threads"] as const,
    /** One thread's messages, newest first. */
    messages: (threadId: string) => ["healthie", "messages", threadId] as const,
    /** Bookable visit types (Healthie, live). */
    visitTypes: () => ["healthie", "visit-types"] as const,
    /** Open days in a month for a visit type. */
    visitDays: (typeKey: string, month: string, timezone: string) =>
      ["healthie", "visit-days", typeKey, month, timezone] as const,
    /** Open times on a day for a visit type. */
    visitSlots: (typeKey: string, date: string, timezone: string) =>
      ["healthie", "visit-slots", typeKey, date, timezone] as const,
    /** The patient's visits; every filter shares the `visits` prefix for invalidation. */
    visits: (filter: string) => ["healthie", "visits", filter] as const,
  },
  intake: {
    /** Current step for a submission token (the running "fold"). */
    step: (token: string) => ["intake", "step", token] as const,
    /** The form's manifest for a token: title and the theme the walk wears. */
    manifest: (token: string) => ["intake", "manifest", token] as const,
    /** The public details page's title and theme. */
    publicForm: (formKey: string) => ["intake", "public-form", formKey] as const,
    /** Paid, unfinished intakes for the signed-in patient. Fetched once: each read mints new links. */
    pending: () => ["intake", "pending"] as const,
    /** All the patient's forms and their status (submitted included). */
    mine: () => ["intake", "mine"] as const,
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
      documentFormat = "url",
      status?: string,
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
          // `status` becomes part of the cache key so eligibility-filtered
          // and unfiltered callers don't collide (My Cases vs Chat / Docs).
          status: status ?? "all",
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
    treatmentProducts: (isVisible?: boolean) =>
      [
        "care-validate",
        "treatment-products",
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
    /** Real CareValidate profile (`GET /api/patient/profile/user`, doc #23). */
    profile: () => ["care-validate", "profile"] as const,
    /** `GET /api/patient/profile/check-user` (doc #25) — user lookup. */
    profileUserStatus: (email?: string, phoneNumber?: string) =>
      [
        "care-validate",
        "profile-user-status",
        { email: email ?? "all", phoneNumber: phoneNumber ?? "all" },
      ] as const,
    /**
     * @deprecated Old key that conflated profile + check-user. Kept so
     * existing invalidation calls still hit the check-user slot.
     */
    profileUser: (email?: string) =>
      [
        "care-validate",
        "profile-user-status",
        { email: email ?? "all", phoneNumber: "all" },
      ] as const,
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
    biomarkersSummary: () => ["patients", "biomarkers-summary"] as const,
  },
  tasso: {
    /** Cheap probe used by the link-status detector. */
    linkStatus: () => ["tasso", "link-status"] as const,
    orderEvents: (
      filters: {
        limit?: number;
        cursor?: string;
        orderIds?: string;
        status?: string;
        createdSince?: string;
      } = {},
    ) => ["tasso", "order-events", filters] as const,
    testResults: (
      filters: { limit?: number; cursor?: string; orderIds?: string } = {},
    ) => ["tasso", "test-results", filters] as const,
    testResult: (testResultId: string) =>
      ["tasso", "test-result", testResultId] as const,
  },
  patientDocuments: {
    list: (cvUpload?: boolean) =>
      [
        "patient-documents",
        "list",
        { cvUpload: typeof cvUpload === "boolean" ? cvUpload : "all" },
      ] as const,
  },
  trainerize: {
    link: () => ["trainerize", "link"] as const,
    profile: () => ["trainerize", "profile"] as const,
    settings: () => ["trainerize", "settings"] as const,
    calendar: (startDate: string, endDate: string, unitWeight: string, unitDistance: string) =>
      ["trainerize", "calendar", { startDate, endDate, unitWeight, unitDistance }] as const,
    trainingPlans: () => ["trainerize", "training-plans"] as const,
    programs: () => ["trainerize", "programs"] as const,
    workoutDefs: (planId: number, searchTerm = "", start = 0, count = 10) =>
      ["trainerize", "workout-defs", { planId, searchTerm, start, count }] as const,
    threads: (view: string, start: number, count: number) =>
      ["trainerize", "threads", { view, start, count }] as const,
    threadMessages: (threadId: number, start: number, count: number) =>
      ["trainerize", "thread-messages", { threadId, start, count }] as const,
    message: (messageId: number) =>
      ["trainerize", "message", messageId] as const,
    habits: (status: string, start: number, count: number) =>
      ["trainerize", "habits", { status, start, count }] as const,
    dailyItem: (dailyItemId: number) =>
      ["trainerize", "daily-item", dailyItemId] as const,
    bodyStats: (date: string, unitWeight: string, unitBodystats: string) =>
      ["trainerize", "bodystats", { date, unitWeight, unitBodystats }] as const,
    cardio: (dailyCardioId: number, unitDistance?: string) =>
      ["trainerize", "cardio", { dailyCardioId, unitDistance: unitDistance ?? null }] as const,
    dailyWorkouts: (dailyWorkoutIds: number[]) =>
      ["trainerize", "daily-workouts", { ids: [...dailyWorkoutIds].sort((a, b) => a - b) }] as const,
    orgGroupId: () => ["trainerize", "org", "group-id"] as const,
    usersLookup: (email?: string, text?: string, start = 0, count = 10) =>
      ["trainerize", "users-lookup", { email: email ?? null, text: text ?? null, start, count }] as const,
    goals: (achieved?: boolean, start = 0, count = 25) =>
      [
        "trainerize",
        "goals",
        { achieved: typeof achieved === "boolean" ? achieved : "all", start, count },
      ] as const,
    goal: (goalId: number) => ["trainerize", "goal", goalId] as const,
    accomplishmentStats: (category?: string, start = 0, count = 25) =>
      [
        "trainerize",
        "accomplishment-stats",
        { category: category ?? "all", start, count },
      ] as const,
    photos: (startDate: string, endDate: string) =>
      ["trainerize", "photos", { startDate, endDate }] as const,
    photoDetail: (photoId: number, thumbnail: boolean) =>
      ["trainerize", "photo-detail", { photoId, thumbnail }] as const,
    appointments: (startDate?: string, endDate?: string) =>
      [
        "trainerize",
        "appointments",
        { startDate: startDate ?? "all", endDate: endDate ?? "all" },
      ] as const,
    appointmentTypes: () => ["trainerize", "appointment-types"] as const,
    appointmentType: (appointmentTypeId: number) =>
      ["trainerize", "appointment-type", appointmentTypeId] as const,
    locations: () => ["trainerize", "locations"] as const,
    timeslots: (
      locationId: number,
      appointmentTypeId: number,
      startTime: string,
      endTime: string,
    ) =>
      [
        "trainerize",
        "timeslots",
        { locationId, appointmentTypeId, startTime, endTime },
      ] as const,
    nutritionLogs: (startDate: string, endDate: string) =>
      ["trainerize", "nutrition-logs", { startDate, endDate }] as const,
    nutritionDay: (date?: string, nutritionId?: number) =>
      [
        "trainerize",
        "nutrition-day",
        { date: date ?? null, nutritionId: nutritionId ?? null },
      ] as const,
    customFoods: (
      searchTerm: string,
      sort: string,
      start: number,
      count: number,
    ) =>
      [
        "trainerize",
        "custom-foods",
        { searchTerm, sort, start, count },
      ] as const,
    mealPlan: (mealPlanId?: number) =>
      ["trainerize", "meal-plan", { mealPlanId: mealPlanId ?? null }] as const,
    healthData: (type: string, startDate?: string, endDate?: string) =>
      [
        "trainerize",
        "health-data",
        {
          type,
          startDate: startDate ?? "all",
          endDate: endDate ?? "all",
        },
      ] as const,
    healthDataSleep: (startTime?: string, endTime?: string) =>
      [
        "trainerize",
        "health-data-sleep",
        {
          startTime: startTime ?? "all",
          endTime: endTime ?? "all",
        },
      ] as const,
  },
};
