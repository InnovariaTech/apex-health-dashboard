# Tasso Care API Documentation

All routes are under `/api/tasso/*`. Every route requires a valid `apex_access_token` cookie with `role = admin` or `role = provider` (issued after completing the staff login OTP flow — see `auth-api.md`).

Base prefix: `/api`

---

## Authentication

All Tasso routes use the `requireAdminOrProvider` preHandler. Unauthenticated or insufficiently-privileged requests receive:

```json
{ "success": false, "message": "Unauthorized" }   // 401 or 403
```

Internally, our server communicates with the Tasso Care REST API using a bearer token obtained via client-credentials OAuth and cached in the database.

---

## Common Response Format

Success:
```json
{ "success": true, "data": { ... } }
```

Tasso integration error (Tasso returned a 4xx/5xx):
```json
{
  "success": false,
  "message": "...",
  "code": "...",
  "provider": "tasso",
  "providerStatus": 422
}
```

Validation error:
```json
{
  "success": false,
  "message": "Invalid request",
  "code": "VALIDATION_ERROR",
  "issues": [{ "code": "...", "path": ["field"], "message": "..." }]
}
```

---

## Pagination

List endpoints support cursor-based pagination via `limit` and `cursor` query params. Responses include a `responseMetadata` object when more pages are available.

```json
{
  "success": true,
  "data": {
    "results": [ ... ],
    "responseMetadata": {
      "nextCursor": "opaque-cursor-string"
    }
  }
}
```

Pass `nextCursor` as the `cursor` param in the next request to fetch the following page. When `responseMetadata` is absent or `nextCursor` is absent, the last page has been reached.

| Param | Type | Default | Max |
|---|---|---|---|
| `limit` | integer | — | 50 |
| `cursor` | string | — | — |

---

## 1. Analytes

Analytes are the biological substances measured in a Tasso test (e.g., glucose, HbA1c). They are configured per project.

### 1.1 GET `/api/tasso/analytes`

Lists all analytes available to the organization.

#### Query params

| Param | Type | Required | Notes |
|---|---|---|---|
| `limit` | integer | no | 1–50 |
| `cursor` | string | no | pagination cursor |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "analyte-id-string",
        "name": "Glucose",
        "loinc": [
          { "name": "Glucose [Mass/volume] in Blood", "resultCode": "2345-7" }
        ]
      }
    ],
    "responseMetadata": { "nextCursor": "..." }
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Tasso analyte ID |
| `name` | string | human-readable analyte name |
| `loinc` | array | optional; LOINC code mappings |
| `loinc[].resultCode` | string | LOINC result code |
| `loinc[].name` | string | optional; LOINC display name |

---

### 1.2 GET `/api/tasso/analytes/:analyteId`

Returns a single analyte.

#### Path params

| Param | Type | Required |
|---|---|---|
| `analyteId` | string | yes |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "id": "analyte-id-string",
    "name": "Glucose",
    "loinc": [ { "name": "...", "resultCode": "2345-7" } ]
  }
}
```

---

## 2. Projects

A project groups a patient population, their analytes, order configurations, and logistical settings. The `distributionModel` field governs which operations are available:

- `directToPatient` — Tasso ships collection kits directly to patients. Specimen links (`POST /tasso/specimen-links`) are **not supported** for this model.
- `atCustomerSite` — Kits are distributed by the customer site. Specimen links are available.

### 2.1 GET `/api/tasso/projects`

Lists all projects belonging to the organization.

#### Query params

| Param | Type | Required | Notes |
|---|---|---|---|
| `limit` | integer | no | 1–50 |
| `cursor` | string | no | pagination cursor |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "name": "Diabetes Research Phase 1",
        "type": "onDemandTesting",
        "purpose": "research",
        "distributionModel": "directToPatient",
        "analyteIds": ["analyte-id-1"],
        "orderConfigurations": [
          {
            "configurationId": "uuid",
            "name": "Standard Panel",
            "isDefault": true,
            "analyteIds": ["analyte-id-1"]
          }
        ],
        "patientPropertyConfig": {
          "firstName": "required",
          "subjectId": "required"
        }
      }
    ]
  }
}
```

**Project fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | project identifier — pass to all patient/order/result endpoints |
| `name` | string | project display name |
| `type` | enum | `onDemandSampling` \| `onDemandTesting` |
| `purpose` | enum | `research` \| `diagnosticTesting` |
| `distributionModel` | enum | `directToPatient` \| `atCustomerSite` |
| `analyteIds` | string[] | analyte IDs; empty if `orderConfigurations` are present |
| `orderConfigurations` | array | named analyte groupings for ordering |
| `patientPropertyConfig` | object | describes which patient fields are required/optional |

**`patientPropertyConfig` values per field:** `"required"` \| `"optional"` \| `"hidden"`

---

### 2.2 GET `/api/tasso/projects/:projectId`

Returns full detail for a single project.

#### Path params

| Param | Type | Required |
|---|---|---|
| `projectId` | UUID | yes |

#### Success — `200`

```json
{
  "success": true,
  "data": { /* Project object (see 2.1) */ }
}
```

---

## 3. Patients

Patients are associated with a specific project. Patient fields required by the API depend on the project's `patientPropertyConfig` — check the project before creating or updating patients.

> **Note:** Updating a patient's `shippingAddress` has no impact on orders already in fulfillment. Subsequent orders will use the updated address.

### 3.1 POST `/api/tasso/patients`

Creates a new patient in a project.

#### Request body

```json
{
  "projectId": "uuid",
  "subjectId": "A1001",
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "1990-06-15",
  "gender": "cisFemale",
  "assignedSex": "female",
  "race": "White",
  "smsConsent": true,
  "shippingAddress": {
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "Seattle",
    "district1": "WA",
    "postalCode": "98101",
    "country": "US"
  },
  "contactInformation": {
    "email": "jane@example.com",
    "phoneNumber": "+12065551234"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `projectId` | **yes** | UUID of the project this patient belongs to |
| `subjectId` | conditional | required if project config sets it to `"required"` |
| `firstName` | conditional | required if project config sets it to `"required"` |
| `lastName` | no | |
| `dateOfBirth` | no | `YYYY-MM-DD` format |
| `gender` | no | see gender enum below |
| `assignedSex` | no | see assignedSex enum below |
| `race` | no | see race enum below |
| `smsConsent` | no | boolean |
| `shippingAddress` | no | required if `distributionModel = directToPatient`; all sub-fields required when provided |
| `shippingAddress.address1` | yes (if address provided) | |
| `shippingAddress.city` | yes (if address provided) | |
| `shippingAddress.district1` | yes (if address provided) | state or province code |
| `shippingAddress.postalCode` | yes (if address provided) | |
| `shippingAddress.country` | yes (if address provided) | 2-letter ISO country code |
| `contactInformation` | no | |

**Gender enum:** `cisMale` \| `cisFemale` \| `transgenderMale` \| `transgenderFemale` \| `nonBinary` \| `none` \| `unspecified` \| `other` \| `unknown` \| `declinedToAnswer`

**AssignedSex enum:** `male` \| `female` \| `unspecified` \| `none` \| `other` \| `unknown` \| `declinedToAnswer`

**Race enum:** `American Indian or Alaska Native` \| `Asian` \| `Black or African American` \| `Native Hawaiian or Other Pacific Islander` \| `Hispanic or Latino` \| `White` \| `Other` \| `Declined To Answer`

#### Success — `201`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "subjectId": "A1001",
    "firstName": "Jane",
    "lastName": "Doe",
    "dateOfBirth": "1990-06-15",
    "gender": "cisFemale",
    "assignedSex": "female",
    "race": "White",
    "smsConsent": true,
    "shippingAddress": {
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "city": "Seattle",
      "district1": "WA",
      "postalCode": "98101",
      "country": "US"
    },
    "contactInformation": {
      "email": "jane@example.com",
      "phoneNumber": "+12065551234"
    }
  }
}
```

> Tasso validates and may **normalize** the shipping address. The address in the response body reflects the canonical form as confirmed by the carrier. If address verification fails entirely, Tasso returns `400`.

---

### 3.2 GET `/api/tasso/patients`

Lists patients, optionally scoped to a project.

#### Query params

| Param | Type | Required | Notes |
|---|---|---|---|
| `projectId` | UUID | no | filter patients by project |
| `limit` | integer | no | 1–50 |
| `cursor` | string | no | pagination cursor |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "results": [ /* Patient objects */ ],
    "responseMetadata": { "nextCursor": "..." }
  }
}
```

---

### 3.3 GET `/api/tasso/patients/:patientId`

Returns a single patient.

#### Path params

| Param | Type | Required |
|---|---|---|
| `patientId` | UUID | yes |

#### Success — `200`

```json
{ "success": true, "data": { /* Patient object */ } }
```

---

### 3.4 PATCH `/api/tasso/patients/:patientId`

Updates a patient. All fields are optional — send only the fields you want to change.

> `projectId` cannot be changed after creation.

#### Path params

| Param | Type | Required |
|---|---|---|
| `patientId` | UUID | yes |

#### Request body

Same shape as `POST /api/tasso/patients` minus `projectId`. All fields optional.

```json
{
  "firstName": "Janet",
  "shippingAddress": {
    "address1": "456 Oak Ave",
    "city": "Portland",
    "district1": "OR",
    "postalCode": "97201",
    "country": "US"
  }
}
```

#### Success — `200`

```json
{ "success": true, "data": { /* updated Patient object */ } }
```

---

### 3.5 DELETE `/api/tasso/patients/:patientId`

Deletes a patient. Returns the deleted patient record.

#### Path params

| Param | Type | Required |
|---|---|---|
| `patientId` | UUID | yes |

#### Success — `200`

```json
{ "success": true, "data": { /* deleted Patient object */ } }
```

---

### 3.6 POST `/api/tasso/specimen-links`

Links one or more container identifiers (barcode IDs on physical Tasso tubes) to a patient. Used when associating already-collected specimens to a patient record.

> **Only available for `atCustomerSite` projects.** This endpoint returns a `404` integration error from Tasso when called on `directToPatient` projects.

#### Request body

```json
{
  "patientId": "uuid",
  "containerIdentifiers": ["TAS-0001-A", "TAS-0001-B"]
}
```

| Field | Required | Notes |
|---|---|---|
| `patientId` | **yes** | UUID of the patient |
| `containerIdentifiers` | **yes** | array of container/barcode IDs; min 1 |

#### Success — `201`

```json
{
  "success": true,
  "data": {
    "patientId": "uuid",
    "containerIdentifiers": ["TAS-0001-A", "TAS-0001-B"]
  }
}
```

---

## 4. Orders

Orders represent a request to ship a Tasso blood-collection kit to a patient and process the collected sample. Each order progresses through a lifecycle of statuses.

**Order statuses:**

| Status | Meaning |
|---|---|
| `accepted` | Accepted by Tasso; queued for fulfillment. For orders with a `shipByDate`, stays here until ~48 hours before the date. |
| `pendingFulfillment` | Queued for fulfillment |
| `inTransitToPatient` | Kit shipped to patient |
| `atPatient` | Kit delivered to patient |
| `inTransitToLab` | Patient shipped sample to lab |
| `atLab` | Sample arrived at lab |
| `resultsReady` | Lab results available (Tasso Care projects only) |
| `delayed` | Fulfillment delayed |
| `problem` | System problem; Tasso is investigating |
| `cancelled` | Order cancelled |
| `rejected` | Cannot complete — some criteria not met |
| `returned` | Kit returned to sender |
| `failed` | Order failed |

Only orders in `accepted` or `pendingFulfillment` status are cancellable.

### 4.1 POST `/api/tasso/orders`

Places a new order for a patient.

#### Request body

```json
{
  "patientId": "uuid",
  "orderConfiguration": {
    "configurationId": "uuid"
  },
  "provider": {
    "npi": {
      "id": "1234567890",
      "firstName": "John",
      "lastName": "Smith"
    }
  },
  "timing": {
    "shipByDate": "2026-06-01"
  },
  "specimens": [
    { "containerIdentifier": "TAS-0001-A" }
  ],
  "customAttributes": [
    { "name": "study_arm", "value": "control" }
  ],
  "replacement": {
    "replacesOrderId": "uuid-of-original-order",
    "containerReplacements": [
      {
        "replacesContainerIdentifier": "TAS-OLD-001",
        "replacementHarmCaused": false,
        "replacementReason": "Damaged in transit",
        "replacementDescription": "Tube was cracked upon arrival"
      }
    ]
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `patientId` | **yes** | UUID of the patient to order for |
| `orderConfiguration` | no | which analyte configuration to use; Tasso uses project default if omitted |
| `orderConfiguration.configurationId` | yes (if provided) | from `project.orderConfigurations` |
| `provider` | no | ordering provider (required for `diagnosticTesting` purpose projects) |
| `provider.npi.id` | no | NPI number |
| `provider.npi.firstName` | no | provider first name |
| `provider.npi.lastName` | no | provider last name |
| `timing.shipByDate` | no | ISO date; order held in `accepted` until ~48 h before this date |
| `specimens` | no | pre-linked container identifiers for `atCustomerSite` projects |
| `customAttributes` | no | array of `{ name, value }` string pairs; must match project custom attribute definitions |
| `replacement` | no | used when replacing a previous order |
| `replacement.replacesOrderId` | no | ID of the original order being replaced |
| `replacement.containerReplacements` | no | per-container replacement details |

#### Success — `201`

```json
{
  "success": true,
  "data": { /* Order object (see Order shape below) */ }
}
```

**Order shape:**

```json
{
  "orderId": "uuid",
  "patientId": "uuid",
  "status": "accepted",
  "statusLastChangedAt": "2026-05-01T12:00:00.000Z",
  "orderConfiguration": { "configurationId": "uuid" },
  "timing": { "shipByDate": "2026-06-01" },
  "provider": {
    "id": null,
    "npi": "1234567890",
    "firstName": "John",
    "lastName": "Smith"
  },
  "specimens": [
    { "containerIdentifier": "TAS-0001-A" }
  ],
  "bundles": [
    {
      "patientId": "uuid",
      "status": "accepted",
      "statusLastChangedAt": "2026-05-01T12:00:00.000Z",
      "tracking": {
        "toPatient": {
          "trackingNumber": "1Z999AA10123456784",
          "carrier": "UPS",
          "service": "ups2DayAir"
        }
      },
      "specimens": [{ "containerIdentifier": "TAS-0001-A" }]
    }
  ],
  "replacement": {
    "replacesOrderId": null,
    "replacedByOrderId": null,
    "replacementReason": null,
    "replacementHarmCaused": false,
    "replacementDescription": null
  },
  "customAttributes": []
}
```

> Tracking information per bundle is the canonical location. The top-level `tracking` field on the order is **deprecated** by Tasso.

---

### 4.2 GET `/api/tasso/orders`

Lists orders, optionally filtered by project and other criteria.

#### Query params

| Param | Type | Required | Notes |
|---|---|---|---|
| `projectId` | UUID | no | filter by project |
| `includeCancelled` | boolean | no | include cancelled orders (`true` \| `false`) |
| `ordersUpdatedSince` | ISO 8601 datetime | no | return only orders updated after this timestamp |
| `limit` | integer | no | 1–50 |
| `cursor` | string | no | pagination cursor |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "results": [ /* Order objects */ ],
    "responseMetadata": { "nextCursor": "..." }
  }
}
```

---

### 4.3 GET `/api/tasso/orders/events`

Lists order lifecycle events. Useful for polling status changes — more efficient than listing all orders. Filter by project, patient, or specific orders.

> **Route ordering note:** `/api/tasso/orders/events` must be registered before `/api/tasso/orders/:orderId` in the router (which it is) to prevent Fastify from treating `events` as an order ID.

#### Query params

| Param | Type | Required | Notes |
|---|---|---|---|
| `projectIds` | comma-separated UUIDs | no | filter by project(s); e.g. `?projectIds=uuid1,uuid2` |
| `orderIds` | comma-separated UUIDs | no | filter by specific order(s) |
| `patientIds` | comma-separated UUIDs | no | filter by specific patient(s) |
| `status` | string | no | filter by order status (see status enum in Orders section) |
| `createdSince` | ISO 8601 datetime | no | return only events created after this timestamp |
| `limit` | integer | no | 1–50 |
| `cursor` | string | no | pagination cursor |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "orderId": "uuid",
        "projectId": "uuid",
        "patientId": "uuid",
        "eventType": "statusChanged",
        "eventContext": {
          "status": "inTransitToPatient",
          "statusChangedAt": "2026-05-02T09:00:00.000Z"
        }
      }
    ],
    "responseMetadata": { "nextCursor": "..." }
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `orderId` | UUID | order that triggered the event |
| `projectId` | UUID | project the order belongs to |
| `patientId` | UUID | patient the order belongs to |
| `eventType` | string | type of lifecycle event (e.g. `statusChanged`) |
| `eventContext.status` | string | new order status at time of event |
| `eventContext.statusChangedAt` | ISO 8601 | when the status change occurred |

---

### 4.4 GET `/api/tasso/orders/:orderId`

Returns a single order with full detail including bundle tracking.

#### Path params

| Param | Type | Required |
|---|---|---|
| `orderId` | UUID | yes |

#### Success — `200`

```json
{ "success": true, "data": { /* Order object */ } }
```

---

### 4.5 PATCH `/api/tasso/orders/:orderId`

Cancels an order. Only orders in `accepted` or `pendingFulfillment` status can be cancelled. Tasso returns `400` if the order is in any other state — this surfaces as a `400` integration error.

#### Path params

| Param | Type | Required |
|---|---|---|
| `orderId` | UUID | yes |

No request body — the cancellation action is implicit.

#### Success — `200`

```json
{ "success": true, "data": { /* updated Order object with status "cancelled" */ } }
```

#### Errors

| Status | Cause |
|---|---|
| `400` | Order is not in a cancellable state |
| `404` | Order not found |

---

### 4.6 POST `/api/tasso/batch-orders`

Places multiple orders in a single API call. Each order in the array follows the same shape as `POST /api/tasso/orders`.

#### Request body

```json
{
  "orders": [
    { "patientId": "uuid-1", "orderConfiguration": { "configurationId": "uuid" } },
    { "patientId": "uuid-2", "orderConfiguration": { "configurationId": "uuid" } }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `orders` | **yes** | array of order inputs; min 1; each follows the `POST /tasso/orders` body schema |

#### Success — `201`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orders": [ /* array of Order objects */ ]
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | batch order ID — use with `GET /tasso/batch-orders/:batchOrderId` |
| `orders` | Order[] | individual orders with their assigned IDs and initial statuses |

---

### 4.7 GET `/api/tasso/batch-orders/:batchOrderId`

Returns the status of all orders in a batch.

#### Path params

| Param | Type | Required |
|---|---|---|
| `batchOrderId` | UUID | yes |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orders": [ /* array of Order objects */ ]
  }
}
```

---

## 5. Test Results

Test results contain FHIR-formatted lab data. Results are only available for `onDemandTesting` projects with status `resultsReady`.

The `renderedResults` field follows the [FHIR R4 Bundle](https://hl7.org/fhir/R4/bundle.html) format. The `entry` array contains the individual observations (analyte values, reference ranges, units, interpretation flags).

### 5.1 GET `/api/tasso/test-results`

Lists test results, optionally filtered.

#### Query params

| Param | Type | Required | Notes |
|---|---|---|---|
| `projectId` | UUID | no | filter by project |
| `patientId` | UUID | no | filter by patient |
| `orderIds` | comma-separated UUIDs | no | filter by specific orders; e.g. `?orderIds=uuid1,uuid2` |
| `limit` | integer | no | 1–50 |
| `cursor` | string | no | pagination cursor |

#### Success — `200`

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "orderId": "uuid",
        "createdAt": "2026-05-01T14:30:00.000Z",
        "updatedAt": "2026-05-01T15:00:00.000Z",
        "renderedResults": {
          "resourceType": "Bundle",
          "identifier": { ... },
          "meta": { ... },
          "type": "collection",
          "timestamp": "2026-05-01T14:30:00.000Z",
          "entry": [ /* FHIR Observation resources */ ]
        }
      }
    ],
    "responseMetadata": { "nextCursor": "..." }
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | test result ID |
| `patientId` | UUID | patient this result belongs to |
| `orderId` | UUID | order this result belongs to |
| `createdAt` | ISO 8601 | when the result was created |
| `updatedAt` | ISO 8601 \| null | last update timestamp |
| `renderedResults` | object | FHIR R4 Bundle containing observation entries |

---

### 5.2 GET `/api/tasso/test-results/:testResultId`

Returns a single test result with full FHIR payload.

#### Path params

| Param | Type | Required |
|---|---|---|
| `testResultId` | UUID | yes |

#### Success — `200`

```json
{ "success": true, "data": { /* TestResult object */ } }
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `TASSO_BASE_URL` | Tasso Care API base URL |
| `TASSO_USERNAME` | OAuth client username |
| `TASSO_SECRET` | OAuth client secret |
