# New APIs — Integration Reference

This document covers APIs added in the Tasso integration milestone:

- **Admin patient listing and profile fetch** — for providers to find patients and prepare Tasso registration
- **Patient-scoped Tasso order events and test results** — for the patient portal to surface kit status and lab results

Base prefix: `/api`

---

## Authentication & Roles

| Route group | Required role | Guard |
|---|---|---|
| `GET /api/admin/patients*` | `admin` or `provider` | `requireAdminOrProvider` |
| `GET /api/patient/tasso/*` | `patient` only | `requireRole('patient')` |

All routes require a valid `apex_access` cookie (issued at login). Missing or expired token returns:

```json
{ "success": false, "message": "Unauthorized" }   // 401
```

Wrong role returns:

```json
{ "success": false, "message": "Forbidden" }   // 403
```

---

## Common Response Envelope

```json
{ "success": true, "message": null, "data": { ... } }
```

Errors:

```json
{ "success": false, "message": "Human-readable reason", "code": "ERROR_CODE" }
```

Tasso integration errors additionally include:

```json
{
  "success": false,
  "message": "...",
  "code": "...",
  "provider": "tasso",
  "providerStatus": 422
}
```

---

---

# Admin APIs

## 1. List Patients

```
GET /api/admin/patients
```

Returns a paginated list of all patients registered on the portal. Designed to let providers find patients who have not yet been synced to Tasso (`tassoSynced=false`) before creating them on Tasso Care.

### Query Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `tassoSynced` | `"true"` \| `"false"` | — | Filter by Tasso linkage. `false` = not yet registered on Tasso; `true` = already linked |
| `isActive` | `"true"` \| `"false"` | — | Filter by account active status |
| `limit` | integer 1–100 | `20` | Max patients to return |
| `offset` | integer ≥ 0 | `0` | Number of patients to skip (for pagination) |

### Example Request

```
GET /api/admin/patients?tassoSynced=false&isActive=true&limit=20&offset=0
```

### Response `200`

`data` is an array of `PatientListItem`:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "userId": "0eca99f7-6388-483d-a9d4-0770472fcadc",
      "email": "patient@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "tassoPatientId": null,
      "isActive": true,
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

### PatientListItem Fields

| Field | Type | Notes |
|---|---|---|
| `userId` | UUID | Our internal portal user ID — use this when calling `GET /api/admin/patients/:userId` |
| `email` | string | Patient's login email |
| `firstName` | string \| null | From local profile (populated after patient's first login) |
| `lastName` | string \| null | From local profile (populated after patient's first login) |
| `tassoPatientId` | string \| null | Tasso's UUID for this patient. `null` means not yet registered on Tasso |
| `isActive` | boolean | Whether the patient account is active |
| `createdAt` | ISO 8601 | Portal account creation time |

> **Note on null names:** `firstName`/`lastName` are synced from CareValidate on each patient login. Patients who have never logged in will show `null`. The provider workflow is: filter for `tassoSynced=false` → fetch full profile → create on Tasso using the profile data.

---

## 2. Get Patient Profile

```
GET /api/admin/patients/:userId
```

Returns the full local profile for a single patient. Includes all demographic fields needed to register the patient on Tasso Care.

### Path Parameters

| Param | Type | Description |
|---|---|---|
| `userId` | UUID | The patient's portal user ID (from the list endpoint) |

### Example Request

```
GET /api/admin/patients/0eca99f7-6388-483d-a9d4-0770472fcadc
```

### Response `200`

```json
{
  "success": true,
  "message": null,
  "data": {
    "userId": "0eca99f7-6388-483d-a9d4-0770472fcadc",
    "email": "patient@example.com",
    "isActive": true,
    "firstName": "Jane",
    "lastName": "Doe",
    "dob": "1990-05-14T00:00:00.000Z",
    "phoneNumber": "+15551234567",
    "gender": "FEMALE",
    "assignedSex": null,
    "race": null,
    "address": "123 Main St",
    "address2": null,
    "city": "Austin",
    "state": "TX",
    "postalCode": "78701",
    "country": "US",
    "allergies": null,
    "healthConditions": null,
    "currentMedications": null,
    "tassoPatientId": null,
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-05-01T08:30:00.000Z"
  }
}
```

### PatientProfileView Fields

| Field | Type | Notes |
|---|---|---|
| `userId` | UUID | Portal user ID |
| `email` | string | Login email |
| `isActive` | boolean | Account active status |
| `firstName` | string \| null | From CareValidate profile sync |
| `lastName` | string \| null | From CareValidate profile sync |
| `dob` | ISO 8601 \| null | Date of birth |
| `phoneNumber` | string \| null | |
| `gender` | `"MALE"` \| `"FEMALE"` \| `"OTHER"` \| null | CareValidate gender value |
| `assignedSex` | string \| null | Tasso-specific field; populated after Tasso registration |
| `race` | string \| null | Tasso-specific field; populated after Tasso registration |
| `address` | string \| null | Street address line 1 |
| `address2` | string \| null | Street address line 2 |
| `city` | string \| null | |
| `state` | string \| null | |
| `postalCode` | string \| null | |
| `country` | string \| null | |
| `allergies` | string \| null | Free-text allergies |
| `healthConditions` | string \| null | Free-text health conditions |
| `currentMedications` | string \| null | Free-text medications |
| `tassoPatientId` | string \| null | Tasso's UUID for this patient; null until created on Tasso |
| `createdAt` | ISO 8601 | Profile row creation time |
| `updatedAt` | ISO 8601 | Last profile sync time |

### Error Responses

| Status | Code | When |
|---|---|---|
| `404` | `NOT_FOUND` | No patient with this `userId` found, or the user is not a patient |

> **Heads-up:** `404` also occurs if the patient exists in the portal but has never logged in (no profile row yet). This is expected — use the list endpoint first; patients with `firstName: null` have not yet synced their profile.

---

---

# Patient Tasso APIs

These endpoints are available **only to the authenticated patient** (role `patient`). The patient's Tasso ID is resolved server-side from their session — no `patientId` param is accepted.

> **Prerequisite:** The patient must have been registered on Tasso Care by a provider first. If not yet linked, all three endpoints return `400` with the message `"Your account is not yet registered on Tasso Care. Please contact your provider."`

---

## 3. List My Tasso Order Events

```
GET /api/patient/tasso/orders/events
```

Returns a paginated list of order status events for all Tasso kit orders belonging to the authenticated patient.

### Query Parameters

| Param | Type | Description |
|---|---|---|
| `limit` | integer 1–100 | Max events to return (default: Tasso API default) |
| `cursor` | string | Pagination cursor from a previous response's `responseMetadata.nextCursor` |
| `orderIds` | string | Comma-separated list of Tasso order UUIDs to filter by |
| `status` | string | Filter by order status — see status values below |
| `createdSince` | string | ISO 8601 datetime — only return events created after this time |

#### Order Status Values

`accepted` · `pendingFulfillment` · `inTransitToPatient` · `atPatient` · `inTransitToLab` · `atLab` · `resultsReady` · `delayed` · `problem` · `cancelled` · `returned` · `rejected` · `failed`

### Example Request

```
GET /api/patient/tasso/orders/events?status=resultsReady&limit=10
```

### Response `200`

```json
{
  "success": true,
  "message": null,
  "data": {
    "results": [
      {
        "orderId": "order-uuid",
        "projectId": "project-uuid",
        "patientId": "tasso-patient-uuid",
        "eventType": "ORDER_STATUS_CHANGED",
        "eventContext": {
          "status": "resultsReady",
          "statusChangedAt": "2026-05-20T14:30:00.000Z"
        }
      }
    ],
    "responseMetadata": {
      "nextCursor": "cursor-string-or-null"
    }
  }
}
```

### TassoOrderEvent Fields

| Field | Type | Notes |
|---|---|---|
| `orderId` | UUID | Tasso order ID |
| `projectId` | UUID | Tasso project ID |
| `patientId` | UUID | Tasso patient ID (the patient's own Tasso UUID) |
| `eventType` | string | e.g. `"ORDER_STATUS_CHANGED"` |
| `eventContext.status` | string | One of the order status values above |
| `eventContext.statusChangedAt` | ISO 8601 | When the status changed |

### Pagination

Use `responseMetadata.nextCursor` as the `cursor` query param in the next request. When `nextCursor` is absent or `null`, you have reached the last page.

---

## 4. List My Tasso Test Results

```
GET /api/patient/tasso/test-results
```

Returns a paginated list of lab test results for the authenticated patient.

### Query Parameters

| Param | Type | Description |
|---|---|---|
| `limit` | integer 1–100 | Max results to return |
| `cursor` | string | Pagination cursor from `responseMetadata.nextCursor` |
| `orderIds` | string | Comma-separated Tasso order UUIDs to filter by |

### Example Request

```
GET /api/patient/tasso/test-results?limit=5
```

### Response `200`

```json
{
  "success": true,
  "message": null,
  "data": {
    "results": [
      {
        "id": "test-result-uuid",
        "patientId": "tasso-patient-uuid",
        "orderId": "order-uuid",
        "createdAt": "2026-05-21T10:00:00.000Z",
        "updatedAt": "2026-05-21T10:05:00.000Z",
        "renderedResults": {
          "resourceType": "Bundle",
          "type": "collection",
          "timestamp": "2026-05-21T10:00:00.000Z",
          "entry": [ "..." ]
        }
      }
    ],
    "responseMetadata": {
      "nextCursor": null
    }
  }
}
```

### TassoTestResult Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Tasso test result ID — use this for `GET /api/patient/tasso/test-results/:testResultId` |
| `patientId` | UUID | Tasso patient ID |
| `orderId` | UUID | The Tasso order this result belongs to |
| `createdAt` | ISO 8601 | When Tasso generated this result |
| `updatedAt` | ISO 8601 \| null | Last update from Tasso |
| `renderedResults` | FHIR Bundle \| null | Structured lab results in FHIR R4 Bundle format; may be `null` if not yet available |

> **On `renderedResults`:** This is a FHIR R4 `Bundle` resource. The `entry` array contains the individual observation resources. The exact structure depends on the analytes configured for the Tasso project. Treat the full object as opaque unless you are building a FHIR-aware results renderer.

---

## 5. Get My Tasso Test Result

```
GET /api/patient/tasso/test-results/:testResultId
```

Returns a single test result. The server verifies that the result belongs to the authenticated patient before returning it.

### Path Parameters

| Param | Type | Description |
|---|---|---|
| `testResultId` | UUID | Tasso test result ID (from the list endpoint) |

### Example Request

```
GET /api/patient/tasso/test-results/test-result-uuid
```

### Response `200`

Same shape as a single entry from the list response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "test-result-uuid",
    "patientId": "tasso-patient-uuid",
    "orderId": "order-uuid",
    "createdAt": "2026-05-21T10:00:00.000Z",
    "updatedAt": null,
    "renderedResults": { "resourceType": "Bundle", "..." : "..." }
  }
}
```

### Error Responses

| Status | Code | When |
|---|---|---|
| `403` | — | The test result exists on Tasso but belongs to a different patient |
| `502` | Tasso error code | Tasso returned an error fetching the result |

---

---

## Common Error Reference

| Status | Code | Meaning |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Bad query param format, or patient not yet registered on Tasso |
| `401` | — | Missing or expired access token |
| `403` | — | Valid token but wrong role, or ownership violation (test result) |
| `404` | `NOT_FOUND` | Patient user not found (admin profile endpoint) |
| `502` | Tasso error code | Tasso API returned a 5xx or the request failed |

For Tasso 4xx errors (e.g. invalid UUID, resource not found on Tasso side), the status code from Tasso is passed through directly.

## Security Properties

- **Self-only access.** All Tasso patient routes always operate on the JWT subject's linked Tasso patient ID. There is no `:patientId` parameter and no admin-on-behalf path.
- **Token type pinned.** Only tokens with `role = patient` reach the handler.
- **Ownership isolation.** Server-side verification ensures the patient can only access their own Tasso data.
- **Uniform 400 for unregistered patients.** A patient whose account is not yet linked to Tasso Care receives a clear message directing them to contact their provider.

---

## Integrator Guidance

- **Refresh proactively.** The `apex_access_token` cookie may expire. On `401`, trigger the OTP re-auth flow.
- **Polling strategy for order events.** Use the `createdSince` param to fetch only new events since the last poll. For real-time updates, consider long-polling or WebSocket if available.
- **Test result detail.** The `renderedResults` field contains a FHIR R4 `Bundle`. Use a FHIR parser library to extract individual `Observation` resources for display.
- **Filtering by status on order events.** Use the `status` query param to filter to specific lifecycle stages (e.g. `resultsReady` to find newly available test results).
- **Pagination.** Always check for `responseMetadata.nextCursor` before concluding a list is complete.
