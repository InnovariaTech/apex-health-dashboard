# Frontend Handoff: CareValidate Auth + Admin Patient APIs

This is the single frontend handoff document for ApexMD auth/admin patient integration. Send this file to the frontend engineer.

Last updated: 2026-06-15. This covers password setup/reset, patient login + CareValidate OTP, staff/admin login, admin patient APIs, CareValidate users, and provider admin APIs.

Base URL examples use `/api` paths. Staging base URL is `https://api-staging.innovariatech.space/api`. Auth is cookie-based. The backend sets HttpOnly cookies; frontend must send requests with credentials enabled.

```ts
fetch(url, {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
})
```

## Integrate These First

1. `POST /api/auth/forgot-password` - request Apex password setup/reset OTP.
2. `POST /api/auth/reset-password` - submit OTP + new Apex password.
3. `POST /api/auth/login` - patient Apex login; branch on `requiredOtp`.
4. `POST /api/auth/carevalidate/verify-otp` - verify CareValidate OTP after login when needed.
5. `GET /api/admin/patients` - local Apex patient list.
6. `GET /api/admin/patients/:userId` - local Apex patient detail.
7. `POST /api/admin/patients` - admin create/import patient.

Do not integrate `GET /api/admin/users`; it is a stub and returns 501.

## Data Sources

There are two different user lists:

| API | Source | Purpose |
|---|---|---|
| `GET /api/admin/patients` | ApexMD database | Lists local Apex patient users imported/created in ApexMD. |
| `GET /api/admin/patients/:userId` | ApexMD database | Gets one local Apex patient profile by Apex `auth_user.id`. |
| `GET /api/admin/carevalidate/users` | CareValidate API | Lists/searches raw CareValidate organization users through backend `CV_API_KEY`. |
| `GET /api/admin/providers` | ApexMD database | Lists local Apex provider accounts. |
| `GET /api/admin/users` | Stub | Do not use. Returns `501 Not implemented`. |

`userId` in Apex admin routes means the Apex `auth_user.id`. It is not a CareValidate ID and not a Tasso patient ID.

## Shared Shapes

### Auth User

Returned by auth login/me/verify routes.

```json
{
  "id": "uuid",
  "email": "patient@example.com",
  "role": "patient",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2026-04-08T00:00:00.000Z"
}
```

### Admin Success Envelope

Admin routes use the standard envelope:

```json
{
  "success": true,
  "message": null,
  "data": {}
}
```

Admin error shape:

```json
{
  "success": false,
  "message": "Invalid request",
  "code": "VALIDATION_ERROR",
  "issues": []
}
```

Auth routes do not use the standard envelope; they return the object shown per endpoint.

## Password Setup / Reset Flow

Use this flow when a user forgot their Apex password, or when a CareValidate-only imported user needs to set their first Apex password.

Important changes:

- The old `resetToken` flow is deprecated.
- `POST /api/auth/forgot-password` never returns a token.
- `POST /api/auth/reset-password` requires `email`, `code`, and `newPassword`.
- The OTP is a six-digit Apex-owned code stored in Redis.

### Step 1: Request Reset OTP

```http
POST /api/auth/forgot-password
```

Request:

```json
{
  "email": "patient@example.com"
}
```

Success response:

```json
{
  "success": true
}
```

Frontend behavior:

- Always show a neutral success message like “If this email is registered, a code has been sent.”
- Do not expect `resetToken` in the response.
- If the email exists only in CareValidate, backend imports the patient into ApexMD first, then sends the same OTP.
- If the email exists nowhere, backend still returns success and sends no email.

Validation errors:

```json
{
  "message": "Invalid request",
  "issues": []
}
```

### Step 2: Submit Reset OTP + New Password

```http
POST /api/auth/reset-password
```

Request:

```json
{
  "email": "patient@example.com",
  "code": "123456",
  "newPassword": "AnotherStrongPass123"
}
```

Rules:

| Field | Required | Rules |
|---|---|---|
| `email` | yes | valid email |
| `code` | yes | exactly 6 digits |
| `newPassword` | yes | min 8 chars |

Success response:

```json
{
  "success": true
}
```

On success, backend revokes active sessions for that user. Frontend should send the user to login.

Common errors:

| Status | Shape | Meaning |
|---|---|---|
| `400` | `{ "message": "Invalid request", "issues": [] }` | Invalid body. |
| `401` | `{ "message": "..." }` | Invalid or expired OTP. |

## Patient Login + CareValidate OTP Flow

Patient Apex login is still local username/password. CareValidate OTP is only needed when backend says `requiredOtp: true`.

### Step 1: Patient Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "patient@example.com",
  "password": "StrongPass123"
}
```

Success response:

```json
{
  "user": {
    "id": "uuid",
    "email": "patient@example.com",
    "role": "patient",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  },
  "requiredOtp": true
}
```

Cookies are set on success:

- `apex_access_token`
- `apex_refresh_token`

Frontend decision:

| `requiredOtp` | Next step |
|---|---|
| `true` | Prompt for CareValidate OTP and call `POST /api/auth/carevalidate/verify-otp`. |
| `false` | Skip OTP; patient can use CareValidate-protected patient routes immediately. |

### Step 2: Verify Patient CareValidate OTP

```http
POST /api/auth/carevalidate/verify-otp
```

This route replaces the removed `/api/auth/portal/verify-otp` route.

Auth required: user must already have a valid Apex access cookie from login.

Request:

```json
{
  "code": "123456"
}
```

Rules:

| Field | Required | Rules |
|---|---|---|
| `code` | yes | exactly 6 digits |

Success response:

```json
{
  "otpVerified": true
}
```

Backend side effects:

- Verifies OTP with CareValidate.
- Stores CareValidate access/refresh tokens server-side.
- If CareValidate returns a trusted `patientId`, links it under `auth_external_token(provider=carevalidate).externalUserId`.
- Refreshes local `patient_profile` from CareValidate `/api/v1/users/me` in the background.

After this call succeeds, CareValidate-protected patient routes can be used, including:

- `GET /api/patient/profile/user`
- `POST /api/patient/profile/user`
- `GET /api/patient/my-documents`
- `/api/patient/files/*`

### CareValidate Session Expired During Portal Use

CareValidate access tokens are refreshed by the backend when possible. If the stored CareValidate refresh token is expired, missing, or invalid during a portal call, backend intentionally logs the user out of Apex too.

Frontend should treat this response as a full logout and redirect to login:

```json
{
  "success": false,
  "message": "Session expired. Please log in again.",
  "code": "AUTH_SESSION_EXPIRED"
}
```

Status: `401`

Backend side effects:

- Clears stored CareValidate tokens.
- Revokes the current Apex refresh session.
- Clears `apex_access_token` and `apex_refresh_token` cookies.

After the user logs in again, backend will return `requiredOtp: true`, so frontend should show the CareValidate OTP prompt again.

Common errors:

| Status | Shape | Meaning |
|---|---|---|
| `400` | `{ "message": "Invalid request", "issues": [] }` | Code is not exactly 6 digits. |
| `401` | `{ "message": "Unauthorized" }` | Missing/invalid Apex cookie. |
| `502` | `{ "message": "..." }` | CareValidate verification failed upstream. |

## Staff/Admin Login + Optional CareValidate OTP

Staff means Apex `admin` or `provider` role.

### Step 1: Staff Login

```http
POST /api/auth/staff/login
```

Request:

```json
{
  "email": "admin@example.com",
  "password": "StrongPass123"
}
```

Success response:

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  },
  "requiredOtp": true
}
```

Cookies are issued immediately even when `requiredOtp` is `true`.

Frontend decision:

| `requiredOtp` | Next step |
|---|---|
| `true` | Prompt staff for CareValidate OTP and call `POST /api/auth/staff/verify-otp`. |
| `false` | Staff login is complete; no OTP call needed. |

When is staff OTP required?

- Backend validates Apex credentials first.
- Backend calls CareValidate `checkUser(email)`.
- OTP is required only if that staff user exists in the configured CareValidate organization and needs CareValidate portal access.
- Apex-only staff users can log in without CareValidate OTP.

### Step 2: Verify Staff CareValidate OTP

```http
POST /api/auth/staff/verify-otp
```

Request:

```json
{
  "email": "admin@example.com",
  "code": "482913"
}
```

Rules:

| Field | Required | Rules |
|---|---|---|
| `email` | yes | valid email |
| `code` | yes | exactly 6 digits |

Success response:

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

Backend stores CareValidate tokens and issues fresh Apex cookies.

## Admin: List ApexMD Patients

Use this to show local ApexMD patient users.

```http
GET /api/admin/patients
```

Auth:

- `admin` or `provider` role.

Query params:

| Param | Type | Default | Notes |
|---|---|---|---|
| `tassoSynced` | `"true"` \| `"false"` | omitted | `false` means `tassoPatientId` is null. |
| `isActive` | `"true"` \| `"false"` | omitted | Filter by active status. |
| `limit` | integer `1..100` | `20` | Page size. |
| `offset` | integer `>= 0` | `0` | Offset pagination. |

Example:

```http
GET /api/admin/patients?limit=20&offset=0&tassoSynced=false&isActive=true
```

Success response:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "userId": "uuid",
      "email": "patient@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "tassoPatientId": null,
      "isActive": true,
      "createdAt": "2026-04-08T00:00:00.000Z"
    }
  ]
}
```

Notes:

- This endpoint returns rows only; it does not return a total count.
- `userId` is the Apex auth user ID.

## Admin: Get ApexMD Patient Profile

Use this for detail view after selecting a patient from `GET /api/admin/patients`.

```http
GET /api/admin/patients/:userId
```

Auth:

- `admin` or `provider` role.

Path params:

| Param | Type | Notes |
|---|---|---|
| `userId` | UUID | Apex `auth_user.id`. |

Success response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "userId": "uuid",
    "email": "patient@example.com",
    "isActive": true,
    "firstName": "Jane",
    "lastName": "Doe",
    "dob": "1990-06-15T00:00:00.000Z",
    "phoneNumber": "+12065551234",
    "gender": "FEMALE",
    "assignedSex": "female",
    "race": "White",
    "address": "123 Main St",
    "address2": null,
    "city": "Seattle",
    "state": "WA",
    "postalCode": "98101",
    "country": "US",
    "allergies": null,
    "healthConditions": null,
    "currentMedications": null,
    "tassoPatientId": null,
    "createdAt": "2026-04-08T00:00:00.000Z",
    "updatedAt": "2026-04-08T00:00:00.000Z"
  }
}
```

Common errors:

| Status | Meaning |
|---|---|
| `400` | `userId` is not a UUID. |
| `404` | No patient/profile found for this `userId`. |

## Admin: Create or Import Patient

Use this when admin creates a patient from the admin UI.

```http
POST /api/admin/patients
```

Auth:

- `admin` role only.

Request:

```json
{
  "email": "patient@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "dob": "1990-06-15",
  "gender": "FEMALE",
  "phoneNumber": "+12065551234",
  "address": "123 Main St",
  "address2": "Apt 2",
  "city": "Seattle",
  "state": "WA",
  "country": "US",
  "postalCode": "98101",
  "allergies": "Peanuts",
  "currentMedications": "Aspirin",
  "healthConditions": "Diabetes",
  "languagePreferences": ["en"]
}
```

Rules:

| Field | Required | Rules/Notes |
|---|---|---|
| `email` | yes | valid email; normalized by backend. |
| `firstName` | no | Sent to CareValidate when creating a new CV user. |
| `lastName` | no | Sent to CareValidate when creating a new CV user. |
| `dob` | no | string date accepted by CareValidate. |
| `gender` | no | `MALE`, `FEMALE`, or `OTHER`. |
| `phoneNumber` | no | passed through to CareValidate. |
| address fields | no | passed through to CareValidate/local profile sync. |
| `allergies` | no | passed through to CareValidate/local profile sync. |
| `currentMedications` | no | passed through to CareValidate/local profile sync. |
| `healthConditions` | no | passed through to CareValidate/local profile sync. |
| `languagePreferences` | no | string array. |

Behavior:

| Case | Backend behavior |
|---|---|
| Exact email exists in CareValidate | Imports user/profile into ApexMD. Does not create duplicate CareValidate user. Does not link CareValidate external ID yet because `GET /api/v1/users` does not return trusted `patientId`. |
| Email does not exist in CareValidate | Creates user in CareValidate, imports into ApexMD, and links returned CareValidate `user.id`. |

Success response when CareValidate user already existed:

```json
{
  "success": true,
  "message": null,
  "data": {
    "user": {
      "id": "uuid",
      "email": "patient@example.com",
      "role": "patient",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-04-08T00:00:00.000Z"
    },
    "careValidate": {
      "existed": true,
      "linked": false,
      "externalUserId": null
    }
  }
}
```

Success response when backend created a new CareValidate user:

```json
{
  "success": true,
  "message": null,
  "data": {
    "user": {
      "id": "uuid",
      "email": "patient@example.com",
      "role": "patient",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-04-08T00:00:00.000Z"
    },
    "careValidate": {
      "existed": false,
      "linked": true,
      "externalUserId": "carevalidate-user-id"
    }
  }
}
```

Real staging-style example:

```json
{
  "success": true,
  "message": null,
  "data": {
    "user": {
      "id": "b8798f76-ac30-424b-82aa-7f8dd44cf371",
      "email": "blake@apexfit.com",
      "role": "patient",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-06-15T12:29:32.349Z"
    },
    "careValidate": {
      "existed": false,
      "linked": true,
      "externalUserId": "BkNFrAS8ouherJHZTC2lEJimAAR2"
    }
  }
}
```

Common errors:

| Status | Meaning |
|---|---|
| `400` | Invalid request body or email belongs to a non-patient Apex user. |
| `403` | Current user is not admin. |
| `502` | CareValidate integration error. |

## Admin: List CareValidate Organization Users

Use this to show/search raw CareValidate users in the configured CareValidate organization.

```http
GET /api/admin/carevalidate/users
```

Auth:

- `admin` role only.

This endpoint uses server-side `CV_API_KEY`. The admin does not need a CareValidate portal token.

Query params:

| Param | Type | Default | Notes |
|---|---|---|---|
| `email` | valid email | omitted | CareValidate treats this as a prefix filter. Import flows exact-match normalized email before using results. |
| `limit` | integer `1..30` | `20` | Code-enforced max is 30. |
| `after` | string | omitted | Cursor from `data.pageInfo.cursor.end`. |
| `sortBy` | `createdAt` | omitted | Only `createdAt` is accepted. |
| `sortOrder` | `asc` \| `desc` \| `ASC` \| `DESC` | `desc` | Backend normalizes to lowercase. |

Example:

```http
GET /api/admin/carevalidate/users?email=jane@example.com&limit=20&sortBy=createdAt&sortOrder=desc
```

Success response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "users": [
      {
        "email": "jane@example.com",
        "firstName": "Jane",
        "lastName": "Doe",
        "dob": "1995-10-01",
        "phoneNumber": "+11234567890",
        "gender": "FEMALE",
        "address": "123 ABC street",
        "address2": "Apt 2",
        "city": "NYC",
        "state": "NY",
        "country": "US",
        "postalCode": "01010",
        "allergies": "Peanuts",
        "currentMedications": "Aspirin",
        "healthConditions": "Diabetes",
        "languagePreferences": ["en"],
        "communicationPreferences": {
          "smsNotificationsDisabled": true,
          "notificationsDisabled": false
        }
      }
    ],
    "pageInfo": {
      "cursor": {
        "end": "opaque-cursor"
      },
      "hasNextPage": true
    }
  }
}
```

Empty response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "users": [],
    "pageInfo": {
      "cursor": {
        "end": null
      },
      "hasNextPage": false
    }
  }
}
```

Frontend pagination:

1. Call without `after`.
2. If `data.pageInfo.hasNextPage` is `true`, call again with `after=data.pageInfo.cursor.end`.
3. Stop when `hasNextPage` is `false`.

## Admin: Provider Accounts

Provider accounts are local Apex users with role `provider`.

### Create Provider

```http
POST /api/admin/providers
```

Auth: `admin` only.

Request:

```json
{
  "email": "provider@example.com",
  "password": "StrongPass123"
}
```

Success response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "uuid",
    "email": "provider@example.com",
    "role": "provider",
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

### List Providers

```http
GET /api/admin/providers
```

Auth: `admin` only.

Success response:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "uuid",
      "email": "provider@example.com",
      "role": "provider",
      "isActive": true,
      "createdAt": "2026-04-08T00:00:00.000Z"
    }
  ]
}
```

### Activate / Deactivate Provider

```http
PATCH /api/admin/providers/:userId
```

Auth: `admin` only.

Request:

```json
{
  "isActive": false
}
```

Success response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "uuid",
    "email": "provider@example.com",
    "role": "provider",
    "isActive": false,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

## Deprecated / Do Not Use

### Removed Patient OTP Route

Do not call:

```http
POST /api/auth/portal/verify-otp
```

Use instead:

```http
POST /api/auth/carevalidate/verify-otp
```

### Old Password Reset Token Body

Do not send:

```json
{
  "token": "reset-token",
  "newPassword": "StrongPass123"
}
```

Use instead:

```json
{
  "email": "patient@example.com",
  "code": "123456",
  "newPassword": "StrongPass123"
}
```

### Admin Users Stub

Do not integrate:

```http
GET /api/admin/users
```

Current response:

```json
{
  "error": "Not implemented"
}
```

Use the specific APIs instead:

- `GET /api/admin/patients` for Apex patients.
- `GET /api/admin/providers` for Apex providers.
- `GET /api/admin/carevalidate/users` for CareValidate organization users.

## Frontend Integration Checklist

1. Replace all old password reset token UI with email + six-digit OTP + new password.
2. Replace `/api/auth/portal/verify-otp` with `/api/auth/carevalidate/verify-otp`.
3. On patient login, branch on `requiredOtp`.
4. On staff login, branch on `requiredOtp`; skip staff OTP if false.
5. Use `GET /api/admin/patients` for local Apex patient list.
6. Use `GET /api/admin/carevalidate/users` only when viewing/searching CareValidate org users directly.
7. Use `POST /api/admin/patients` for admin create/import patient.
8. Do not call `GET /api/admin/users`.
