# Patient API Documentation

All routes are under `/api/patient/*`. Every route requires a valid `apex_access_token` cookie (issued on login/signup).

Base prefix: `/api`

---

## Authentication

All patient routes use the `requireAuth` preHandler. Requests without a valid access-token cookie receive:

```json
{ "success": false, "message": "Unauthorized" }   // 401
```

---

## Portal JWT Routes

The following routes additionally require a valid **CareValidate portal access token** stored server-side for the user. If the portal session is missing or expired, the response is:

```json
{ "success": false, "message": "CareValidate portal session is missing. OTP verification is required." }   // 400
```

The client must direct the user through `POST /api/auth/portal/verify-otp` before retrying.

Portal-JWT-protected routes:
- `GET  /api/patient/profile/user`
- `POST /api/patient/profile/user`
- `GET  /api/patient/my-documents`
- `GET  /api/patient/files/:id/metadata`
- `GET  /api/patient/files/:id/download`
- `POST /api/patient/files/upload`
- `PATCH /api/patient/files/:id/metadata`
- `DELETE /api/patient/files/:id`

---

## Common Error Format

GET-style routes:
```json
{ "success": false, "message": "..." }
```

POST/PATCH/DELETE mutation routes:
```json
{
  "success": false,
  "message": "...",
  "code": "VALIDATION_ERROR | NOT_FOUND | ...",
  "provider": "carevalidate",
  "providerStatus": 400
}
```

---

## My Requests

### 1. GET `/api/patient/my-requests/cases`

Lists all cases belonging to the authenticated user, filtered by their email address on the CareValidate side.

#### Query params

| Param | Type | Notes |
|---|---|---|
| `startTime` | ISO 8601 string | optional; must be paired with `endTime` |
| `endTime` | ISO 8601 string | optional; must be paired with `startTime`; max range 60 days |
| `status` | comma-separated string | optional; valid values: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `APPROVED`, `REJECTED`, `NO_DECISION`, `ABANDONED` |
| `recordsPerPage` | integer 1–100 | optional |
| `after` | string | optional cursor for pagination |
| `includeAttachments` | boolean | optional |
| `includeOrders` | boolean | optional |
| `includeCalendarEvents` | boolean | optional |
| `documentFormat` | `url` \| `base64` | optional |

#### Success — `200`

```json
{
  "success": true,
  "data": [ /* case objects */ ],
  "pageInfo": {
    "cursor": { "start": "...", "end": "..." },
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "count": 2
}
```

---

### 2. POST `/api/patient/my-requests/cases`

Creates a dynamic case on CareValidate. The `email` in the body must match the authenticated user's email.

#### Request body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "patient@example.com",
  "dob": "1990-01-15",
  "gender": "MALE",
  "phoneNumber": "+15551234567",
  "password": "optional",
  "status": "OPEN",
  "formTitle": "Initial Consultation",
  "formDescription": "optional description",
  "formId": "uuid",
  "shippingAddress": {
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postalCode": "10001"
  },
  "languagePreferences": ["en"],
  "questions": [
    {
      "questionId": "existing-question-uuid",
      "answer": "some answer"
    }
  ],
  "paymentDescription": "optional",
  "paymentAmount": 99.99,
  "stripeSetupId": "optional",
  "stripePaymentId": "optional",
  "nmiPaymentToken": "optional",
  "productBundleId": "uuid"
}
```

| Field | Required | Notes |
|---|---|---|
| `firstName` | yes | |
| `lastName` | yes | |
| `email` | yes | must match auth user email |
| `dob` | no | |
| `gender` | no | `MALE` \| `FEMALE` |
| `phoneNumber` | no | min 3 chars |
| `formTitle` | conditional | required if `formId` absent |
| `formId` | conditional | required if `formTitle` absent |
| `questions` | yes | min 1 item; each needs `questionId` + `answer` OR `question` + `type` + `required` |
| `shippingAddress` | no | all sub-fields required if provided |

#### Question schema

Each question in `questions` must satisfy one of:
- `{ questionId, answer }` — submitting an answer to an existing form question
- `{ question, type, required, answer? }` — defining a new dynamic question (`type` values: `TEXT`, `BOOLEAN`, `DATE`, `DATERANGE`, `SINGLESELECT`, `MULTISELECT`, `FILE`, `WIDGET_USER_ID_DOCUMENT`, `WIDGET_BMI`, `WIDGET_STATE_PICKER`, `WIDGET_VISIT_TYPE`, `STATEMENT`)

#### Success — `200`

```json
{ "success": true, "data": { /* case object */ }, "message": null }
```

---

### 3. GET `/api/patient/my-requests/latest-case-id`

Returns the latest case ID for a given email or phone number.

#### Query params

| Param | Type | Notes |
|---|---|---|
| `email` | string | optional; falls back to auth user email if omitted |
| `phoneNumber` | string | optional |

At least one of `email` or `phoneNumber` must resolve to a non-empty value.

#### Success — `200`

```json
{ "success": true, "data": { "caseId": "uuid-or-null" } }
```

---

### 4. GET `/api/patient/my-requests/cases/:caseId`

Returns full detail for a single case.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `caseId` | string | required |

#### Query params

| Param | Type | Notes |
|---|---|---|
| `includeAttachments` | boolean | optional |
| `includeCalendarEvents` | boolean | optional |
| `includeOrders` | boolean | optional |
| `includeCaseProducts` | boolean | optional |
| `documentFormat` | `url` \| `base64` | optional |

#### Success — `200`

```json
{ "success": true, "data": { /* full case detail object */ } }
```

---

### 5. GET `/api/patient/my-requests/cases/:caseId/treatments`

Returns the treatments (case products / case treatments) associated with a case.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `caseId` | string | required |

#### Success — `200`

```json
{ "success": true, "data": [ /* treatment objects */ ] }
```

---

### 6. GET `/api/patient/my-requests/cases/:caseId/form-responses`

Returns form responses for a case.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `caseId` | string | required |

#### Query params

| Param | Type | Notes |
|---|---|---|
| `recordsPerPage` | integer 1–100 | optional |
| `sortBy` | string | optional; `createdAt` supported |
| `sortOrder` | `ASC` \| `DESC` | optional |

#### Success — `200`

```json
{ "success": true, "data": [ /* form response objects */ ] }
```

---

### 7. POST `/api/patient/my-requests/cases/:caseId/forms`

Adds a dynamic form to an existing case.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `caseId` | string | required |

#### Request body

```json
{
  "formTitle": "Follow-up Form",
  "formDescription": "optional",
  "questions": [
    {
      "questionId": "uuid",
      "question": "How are you feeling?",
      "type": "TEXT",
      "required": true,
      "answer": "Better"
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `formTitle` | yes | min 1 char |
| `formDescription` | no | |
| `questions` | yes | min 1; each requires `questionId`, `question`, `type` |

#### Success — `200`

```json
{ "success": true, "data": { /* result */ }, "message": null }
```

---

## Documents

### 8. GET `/api/patient/my-documents`

**Portal JWT required.**

Lists the authenticated user's files from the CareValidate portal (`/api/v1/users/me/files`).

#### Query params

| Param | Type | Notes |
|---|---|---|
| `caseId` | UUID string | optional; filter files by case |
| `type` | `phi` \| `general` | optional; filter by file type |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "uuid",
        "fileName": "lab-results.pdf",
        "isPHI": true,
        "isRestricted": false,
        "caseId": "uuid",
        "uploadedBy": {
          "id": "uuid",
          "firstName": "Dr",
          "lastName": "Smith"
        },
        "createdAt": "2026-04-01T10:00:00.000Z"
      }
    ]
  }
}
```

`uploadedBy` is `null` when not present in the CareValidate response.

---

### 9. GET `/api/patient/my-documents/public-organization`

Returns public organization documents. Currently stubbed — returns a `NOT_SUPPORTED_IN_CAREVALIDATE_REST_COLLECTION` placeholder.

#### Success — `200`

```json
{ "success": true, "data": [{ "available": false, "reason": "NOT_SUPPORTED_IN_CAREVALIDATE_REST_COLLECTION", "operation": "publicOrganizationDocuments" }] }
```

---

### 10. POST `/api/patient/my-documents/:docId/analyze`

Initiates a document analysis session using the AI chat module. Returns a `sessionId` for the client to open a chat session with.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `docId` | string | required; document ID to analyze |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "triggerMessage": "Please analyze my lab report with ID: abc12345. Use the get_lab_report_details tool to fetch it."
  }
}
```

---

## Files (Portal JWT Required)

All `/api/patient/files/*` routes require a valid CareValidate portal access token stored for the user. They proxy directly to the CareValidate portal `/api/v1/users/me/files/*` endpoints.

### 11. GET `/api/patient/files/:id/metadata`

Returns metadata for a single file.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `id` | UUID | required |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileName": "lab-results.pdf",
    "isPHI": true,
    "isRestricted": false,
    "caseId": "uuid",
    "uploadedBy": { "id": "uuid", "firstName": "Dr", "lastName": "Smith" },
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

---

### 12. GET `/api/patient/files/:id/download`

Returns a pre-signed download URL for a file. The URL expires after `expiresIn` seconds.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `id` | UUID | required |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://...",
    "fileName": "lab-results.pdf",
    "expiresIn": 900
  }
}
```

---

### 13. POST `/api/patient/files/upload`

Uploads a file to the CareValidate portal. The file content must be base64-encoded.

#### Request body

```json
{
  "name": "lab-results.pdf",
  "data": "<base64-encoded file content>",
  "caseId": "uuid",
  "mimeType": "application/pdf"
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | 1–255 chars |
| `data` | yes | base64-encoded file content |
| `caseId` | yes | UUID; CareValidate portal enforces an active-case constraint (returns 400 if case is closed) |
| `mimeType` | yes | one of the allowed MIME types below |

**Allowed MIME types:**

```
application/pdf
application/msword
text/csv
text/plain
image/jpeg
image/png
image/svg+xml
image/tiff
image/webp
```

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileName": "lab-results.pdf",
    "isPHI": false,
    "isRestricted": false,
    "caseId": "uuid",
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

> **Note:** The upload response does **not** include `uploadedBy` — this is by design from CareValidate (the field is only populated on list/metadata fetch after the file is indexed).

---

### 14. PATCH `/api/patient/files/:id/metadata`

Renames a file (updates `fileName`).

#### Path params

| Param | Type | Notes |
|---|---|---|
| `id` | UUID | required |

#### Request body

```json
{ "fileName": "renamed-file.pdf" }
```

| Field | Required | Notes |
|---|---|---|
| `fileName` | yes | 1–255 chars |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileName": "renamed-file.pdf",
    "isPHI": false,
    "isRestricted": false,
    "caseId": "uuid",
    "uploadedBy": null,
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

---

### 15. DELETE `/api/patient/files/:id`

Permanently deletes a file.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `id` | UUID | required |

#### Success — `200`

```json
{ "success": true, "message": "File deleted successfully" }
```

---

## Communications

### 16. GET `/api/patient/communications/comments`

Lists all comments across all cases for the authenticated user (fetched from the user's latest case).

#### Query params

| Param | Type | Notes |
|---|---|---|
| `recordsPerPage` | integer 1–100 | optional |

#### Success — `200`

```json
{ "success": true, "data": [ /* comment objects */ ] }
```

---

### 17. GET `/api/patient/communications/cases/:caseId/comments`

Lists comments for a specific case.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `caseId` | string | required |

#### Query params

| Param | Type | Notes |
|---|---|---|
| `recordsPerPage` | integer 1–100 | optional |
| `sortOrder` | `ASC` \| `DESC` | optional |

#### Success — `200`

```json
{ "success": true, "data": [ /* comment objects */ ] }
```

---

### 18. POST `/api/patient/communications/cases/:caseId/comments`

Adds a communication comment to a case. The `author.email` must match the authenticated user's email.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `caseId` | string | required |

#### Request body

```json
{
  "action": "ADD_COMMUNICATION",
  "communication": {
    "text": "I have a question about my treatment plan.",
    "isRestricted": false,
    "webhookNotify": true,
    "author": {
      "email": "patient@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "attachments": [
      {
        "fileName": "image.png",
        "content": "<base64>",
        "isRestricted": false,
        "isPHI": false
      }
    ]
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `action` | yes | must be `"ADD_COMMUNICATION"` |
| `communication.text` | yes | min 1 char |
| `communication.isRestricted` | yes | boolean |
| `communication.author.email` | yes | must match auth user email |
| `communication.author.firstName` | no | |
| `communication.author.lastName` | no | |
| `communication.webhookNotify` | no | |
| `communication.attachments` | no | array of `{ fileName, content (base64), isRestricted?, isPHI? }` |

#### Success — `200`

```json
{ "success": true, "data": { /* result */ }, "message": null }
```

---

## Browse Treatments

### 19. GET `/api/patient/browse-treatments/products`

Lists available products.

#### Query params

| Param | Type | Notes |
|---|---|---|
| `isVisible` | boolean | optional |

#### Success — `200`

```json
{ "success": true, "data": [ /* product summary objects */ ] }
```

---

### 20. GET `/api/patient/browse-treatments/products/:productUUID`

Returns detail for a single product.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `productUUID` | UUID | required |

#### Query params

| Param | Type | Notes |
|---|---|---|
| `includeFollowupForm` | boolean | optional |
| `includeOptionalFollowupForm` | boolean | optional |

#### Success — `200`

```json
{ "success": true, "data": { /* product detail with optional forms */ } }
```

---

### 21. GET `/api/patient/browse-treatments/bundles`

Lists available product bundles.

#### Query params

| Param | Type | Notes |
|---|---|---|
| `isVisible` | boolean | optional |

#### Success — `200`

```json
{ "success": true, "data": [ /* bundle summary objects */ ] }
```

---

### 22. GET `/api/patient/browse-treatments/bundles/:bundleUUID`

Returns detail for a single bundle.

#### Path params

| Param | Type | Notes |
|---|---|---|
| `bundleUUID` | UUID | required |

#### Query params

| Param | Type | Notes |
|---|---|---|
| `includeIntakeForm` | boolean | optional |
| `includeFollowupForm` | boolean | optional |

#### Success — `200`

```json
{ "success": true, "data": { /* bundle detail with optional forms */ } }
```

---

## Profile

### 23. GET `/api/patient/profile/user`

**Portal JWT required.**

Returns the authenticated user's profile from the CareValidate portal (`GET /api/v1/users/me`). Data includes all identity and health fields stored in the portal.

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "email": "patient@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+15551234567",
      "dob": "1990-01-15",
      "gender": "MALE",
      "address": "123 Main St",
      "address2": null,
      "city": "New York",
      "state": "NY",
      "country": "US",
      "postalCode": "10001",
      "allergies": null,
      "healthConditions": null,
      "currentMedications": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 24. POST `/api/patient/profile/user`

**Portal JWT required.**

Updates the authenticated user's profile via the CareValidate portal (`PATCH /api/v1/users/me`). All fields are optional. `email` is silently dropped (the portal endpoint is self-only and does not accept email changes through this route).

Accepts both flat format and legacy action-wrapper format for backward compatibility.

#### Request body (flat format — preferred)

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+15551234567",
  "dob": "1990-01-15",
  "gender": "MALE",
  "address": "123 Main St",
  "address2": null,
  "city": "New York",
  "state": "NY",
  "country": "US",
  "postalCode": "10001",
  "allergies": null,
  "healthConditions": "Type 2 diabetes",
  "currentMedications": null
}
```

#### Request body (legacy action-wrapper format — also accepted)

```json
{
  "action": "UPDATE_PROFILE",
  "data": { /* same fields as flat format */ }
}
```

| Field | Type | Notes |
|---|---|---|
| `firstName` | string | optional, min 1 char |
| `lastName` | string | optional, min 1 char |
| `phoneNumber` | string | optional, min 3 chars |
| `dob` | string | optional, `YYYY-MM-DD` format |
| `gender` | enum | optional; `MALE` \| `FEMALE` \| `OTHER` |
| `address` | string \| null | optional; send `null` to clear |
| `address2` | string \| null | optional; send `null` to clear |
| `city` | string \| null | optional; send `null` to clear |
| `state` | string | optional, min 1 char |
| `country` | string | optional, 2-letter ISO code (e.g. `"US"`) |
| `postalCode` | string \| null | optional; send `null` to clear |
| `allergies` | string \| null | optional; send `null` to clear |
| `healthConditions` | string \| null | optional; send `null` to clear |
| `currentMedications` | string \| null | optional; send `null` to clear |

Nullable fields (`address`, `address2`, `city`, `postalCode`, `allergies`, `healthConditions`, `currentMedications`) accept `null` to clear the value on the portal.

#### Success — `200`

```json
{
  "success": true,
  "data": { "profile": { /* updated PortalProfile object */ } }
}
```

---

### 25. GET `/api/patient/profile/check-user`

Looks up a user on CareValidate by email or phone number using the `GET /api/v1/check-user` endpoint. Does **not** require a portal JWT — uses the `cv-api-key` header only.

#### Query params

| Param | Type | Notes |
|---|---|---|
| `email` | string | optional; defaults to auth user email if omitted |
| `phoneNumber` | string | optional |

At least one of `email` or `phoneNumber` must resolve to a value.

#### Success — `200`

```json
{
  "success": true,
  "data": { /* CareValidate user lookup result */ }
}
```

---

### 26. POST `/api/patient/profile/user/email`

Updates the user's email on CareValidate **and** syncs it to the local `auth_user` record. Issues fresh auth cookies with the updated email claim in the JWT.

The `currentEmail` in the body must match the authenticated user's current email.

#### Request body

```json
{
  "action": "UPDATE_EMAIL",
  "data": {
    "currentEmail": "patient@example.com",
    "newEmail": "newemail@example.com"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `action` | yes | must be `"UPDATE_EMAIL"` |
| `data.currentEmail` | yes | must match auth user email |
| `data.newEmail` | yes | valid email |

#### Success — `200`

Fresh auth cookies are issued. Body:
```json
{ "success": true, "data": { /* result */ }, "message": null }
```

---

### 27. POST `/api/patient/profile/user/payment-info`

Updates payment information for the user on CareValidate. Exactly one of `stripeSetupId` or `nmiPaymentToken` must be provided.

The `email` in the body must match the authenticated user's email.

#### Request body

```json
{
  "action": "UPDATE_PAYMENT_INFO",
  "data": {
    "email": "patient@example.com",
    "stripeSetupId": "seti_xxx",
    "shippingAddress": {
      "addressLine1": "123 Main St",
      "addressLine2": "",
      "city": "New York",
      "state": "NY",
      "country": "US",
      "postalCode": "10001"
    }
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `action` | yes | must be `"UPDATE_PAYMENT_INFO"` |
| `data.email` | yes | must match auth user email |
| `data.stripeSetupId` | conditional | provide exactly one of `stripeSetupId` or `nmiPaymentToken` |
| `data.nmiPaymentToken` | conditional | provide exactly one of `stripeSetupId` or `nmiPaymentToken` |
| `data.shippingAddress` | yes | all sub-fields required |

#### Success — `200`

```json
{ "success": true, "data": { /* result */ }, "message": null }
```

---

### 28. GET `/api/patient/profile/partner-integration`

Returns public partner integration info. Stubbed on CareValidate — returns `NOT_SUPPORTED_IN_CAREVALIDATE_REST_COLLECTION`.

#### Query params

| Param | Type | Notes |
|---|---|---|
| `linkName` | string | optional |

---

### 29. GET `/api/patient/profile/global-settings`

Returns global settings. Stubbed on CareValidate — returns `NOT_SUPPORTED_IN_CAREVALIDATE_REST_COLLECTION`.

---

### 30. GET `/api/patient/profile/promo-code`

Looks up a promo code.

#### Query params

| Param | Type | Notes |
|---|---|---|
| `code` | string | required, min 1 char |
| `productBundleId` | string | optional |

#### Success — `200`

```json
{ "success": true, "data": { /* promo code details or { success: false, code: "PROMO_CODE_NOT_FOUND" } */ } }
```

---

## Billing

### 31. GET `/api/patient/billing/cases`

Lists billing cases for the authenticated user (same case list filtered by user email, returns all cases without restrictions).

#### Query params

Same pagination/filter params as `GET /api/patient/my-requests/cases`.

#### Success — `200`

```json
{ "success": true, "data": [ /* case objects */ ] }
```

---

### 32. GET `/api/patient/billing/payment-methods`

Returns stored payment methods. Stubbed on CareValidate — returns `NOT_SUPPORTED_IN_CAREVALIDATE_REST_COLLECTION`.

No query params.

---

### 33. GET `/api/patient/billing/payments`

Returns payments extracted from the user's cases.

#### Query params

Same pagination/filter params as `GET /api/patient/my-requests/cases`.

#### Success — `200`

```json
{ "success": true, "data": [ /* payment objects */ ] }
```

---

## Payments

### 34. POST `/api/patient/payments/setup`

Creates a Stripe payment setup intent.

#### Request body

```json
{
  "metadata": {
    "email": "patient@example.com",
    "phone": "+15551234567"
  }
}
```

All fields optional.

#### Success — `200`

```json
{ "success": true, "data": { /* Stripe setup result */ }, "message": null }
```

---

### 35. POST `/api/patient/payments/intent`

Creates a Stripe payment intent.

#### Request body

```json
{
  "amount": 99.99,
  "paymentMethodTypes": ["card"],
  "metadata": {
    "email": "patient@example.com",
    "phone": "+15551234567"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `amount` | yes | positive number |
| `paymentMethodTypes` | no | array of strings |
| `metadata` | no | |

#### Success — `200`

```json
{ "success": true, "data": { /* Stripe intent result */ }, "message": null }
```

---

## Biomarkers

### 36. GET `/api/patient/biomarkers/summary`

Returns biomarker lab results grouped by category for the authenticated user.

No query params.

#### Success — `200`

```json
{
  "success": true,
  "data": {
    /* CategorizedBiomarkerSummary — biomarkers grouped by category with values, units, reference ranges */
  }
}
```

---

## AI Summary

### 37. GET `/api/patient/summary`

Returns the most recent AI-generated health summary for the authenticated user.

#### Success — `200`

```json
{
  "success": true,
  "data": {
    /* latest PatientSummary object */
  }
}
```

---

### 38. GET `/api/patient/summaries`

Returns a paginated list of AI-generated health summaries.

#### Query params

| Param | Type | Notes |
|---|---|---|
| `take` | integer | optional; default 10 |
| `skip` | integer | optional; default 0 |

#### Success — `200`

```json
{
  "success": true,
  "data": [ /* PatientSummary objects */ ]
}
```

---

### 39. POST `/api/patient/summary`

Triggers a new AI-generated overall health summary for the authenticated user.

No request body.

#### Success — `200`

```json
{
  "success": true,
  "data": { /* newly generated PatientSummary */ }
}
```
