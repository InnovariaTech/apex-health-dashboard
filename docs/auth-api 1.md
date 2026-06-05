# Auth API Documentation

Base API prefix: `/api` — all auth routes are under `/api/auth/*`.

---

## Cookie Configuration

Two HttpOnly cookies are issued on login, signup, and refresh:

| Cookie | Name | Default TTL |
|---|---|---|
| Access token | `apex_access_token` | `AUTH_ACCESS_TTL_SECONDS` (default 900 s) |
| Refresh token | `apex_refresh_token` | `AUTH_REFRESH_TTL_SECONDS` (default 604 800 s / 7 days) |

Cookie flags:

```
httpOnly:  true
secure:    always true when SameSite=None; only in production when SameSite=Lax
sameSite:  controlled by AUTH_COOKIE_SAMESITE env var
           "lax"  → SameSite=Lax, Secure only in production
           any other value (default) → SameSite=None, Secure=true always
path:      /
```

---

## Common Error Formats

Validation (Zod):
```json
{
  "message": "Invalid request",
  "issues": [{ "code": "...", "path": ["field"], "message": "..." }]
}
```

All other failures:
```json
{ "message": "..." }
```

---

## Role Values

`patient` | `admin` | `doctor` | `dietitian`

Defaults to `patient` when omitted at signup.

---

## 1. POST `/api/auth/signup`

Creates a new local auth user and sets auth cookies.

> `POST /api/auth/register` is no longer supported — use this endpoint exclusively.

### Request body

```json
{
  "email": "patient@example.com",
  "password": "StrongPass123",
  "role": "patient"
}
```

| Field | Type | Rules |
|---|---|---|
| `email` | string | required, valid email |
| `password` | string | required, min 8 chars |
| `role` | enum | optional; `patient` \| `admin` \| `doctor` \| `dietitian` |

### Success — `201`

```json
{
  "user": {
    "id": "uuid",
    "email": "patient@example.com",
    "role": "patient",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

Auth cookies are set on the response.

### Errors

| Status | Cause |
|---|---|
| `400` | Invalid payload (Zod) |
| `401` | User already exists |
| `500` | Unexpected server error |

---

## 2. POST `/api/auth/login`

Authenticates an existing user and sets auth cookies.

### Request body

```json
{
  "email": "patient@example.com",
  "password": "StrongPass123"
}
```

| Field | Type | Rules |
|---|---|---|
| `email` | string | required, valid email |
| `password` | string | required, min 1 char |

### Success — `200`

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

Auth cookies are set on the response.

#### `requiredOtp` flag — CareValidate Portal OTP

| Value | Meaning |
|---|---|
| `true` | An OTP was just dispatched to the user's email. Client must call `POST /api/auth/portal/verify-otp` before using portal-protected routes. |
| `false` | User already had a valid portal refresh token; it was silently refreshed. Portal-protected routes are ready to use immediately. |

### Errors

| Status | Cause |
|---|---|
| `400` | Invalid payload |
| `401` | Invalid credentials / inactive user |
| `500` | Unexpected server error |

---

## 3. POST `/api/auth/refresh`

Rotates the refresh session and issues fresh access + refresh cookies.

No request body.

### Auth required

Refresh token cookie (`apex_refresh_token`).

### Success — `200`

```json
{
  "user": {
    "id": "uuid",
    "email": "patient@example.com",
    "role": "patient",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

The old refresh session is revoked and a new one is created (`replacedBySession` pointer is set in the database). Fresh cookies are issued.

### Errors

| Status | Cause |
|---|---|
| `401` | Missing, invalid, or expired refresh token; revoked session |
| `500` | Unexpected server error |

---

## 4. POST `/api/auth/logout`

Revokes the current session (if the refresh cookie is valid) and clears both auth cookies.

No request body.

### Success — `200`

```json
{ "success": true }
```

A missing or invalid refresh cookie does **not** fail this endpoint — both cookies are always cleared.

---

## 5. GET `/api/auth/me`

Returns the currently authenticated user.

### Auth required

Access token cookie (`apex_access_token`).

### Success — `200`

```json
{
  "user": {
    "id": "uuid",
    "email": "patient@example.com",
    "role": "patient",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

### Errors

| Status | Cause |
|---|---|
| `401` | Missing or invalid access token; inactive user |
| `500` | Unexpected server error |

---

## 6. POST `/api/auth/forgot-password`

Generates a hashed password-reset token in the database and queues a reset email.

### Request body

```json
{ "email": "patient@example.com" }
```

### Success — `200`

```json
{ "success": true }
```

Response is always `{ "success": true }` — even when the email does not exist in the system (prevents email enumeration).

### Errors

| Status | Cause |
|---|---|
| `400` | Invalid payload |
| `500` | Unexpected server error |

---

## 7. POST `/api/auth/reset-password`

Resets the password using a reset token, marks the token as used, and revokes all active sessions for that user.

### Request body

```json
{
  "token": "reset_token_from_email_link",
  "newPassword": "AnotherStrongPass123"
}
```

| Field | Type | Rules |
|---|---|---|
| `token` | string | required |
| `newPassword` | string | required, min 8 chars |

### Success — `200`

```json
{ "success": true }
```

### Errors

| Status | Cause |
|---|---|
| `400` | Invalid payload |
| `401` | Invalid or expired reset token |
| `500` | Unexpected server error |

---

## 8. POST `/api/auth/portal/verify-otp`

Exchanges a 6-digit OTP (dispatched by CareValidate during login) for a CareValidate portal access + refresh token pair. Tokens are stored server-side in `auth_external_token` — they are never sent to the client.

After a successful call, portal-JWT-protected routes (`GET/POST /api/patient/profile/user`, `GET /api/patient/my-documents`, and all `/api/patient/files/*` endpoints) will work transparently; the access token is refreshed on-demand using the stored refresh token.

### Auth required

Access token cookie (`apex_access_token`) — user must be logged in first.

### Request body

```json
{ "code": "123456" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required, exactly 6 digits (`^\d{6}$`) |

### Success — `200`

```json
{ "otpVerified": true }
```

### Errors

| Status | Cause |
|---|---|
| `400` | Code is not 6 digits (Zod); CareValidate returned `VALIDATION_ERROR` |
| `401` | Not authenticated (missing access cookie) |
| `401` | Portal auth not configured server-side (missing `CareValidatePortalAuthService`) |
| `502` | CareValidate integration error |
| `500` | Unexpected server error |

### Full OTP Flow

```
1. Client → POST /api/auth/login
   ← { user: {...}, requiredOtp: true }   (OTP dispatched to user email)

2. User receives 6-digit OTP in email.

3. Client → POST /api/auth/portal/verify-otp  { code: "123456" }
   ← { otpVerified: true }

4. All portal-protected routes now work.
   Token is refreshed silently on-demand if near expiry (< 120 s buffer).
```

**If `requiredOtp: false` at login:** the user's existing portal refresh token was valid and was refreshed automatically. Skip step 2 & 3.

**Token expiry:** If the stored refresh token has expired, `ensureValidAccessToken` throws `ValidationError` → the client receives a `400` with a message prompting OTP re-auth. The user must log in again to trigger a fresh OTP.

---

## 9. GET `/api/admin/users` *(stub)*

Admin-only placeholder route.

### Auth required

Valid access token cookie with role `admin`.

### Response — `501`

```json
{ "error": "Not implemented" }
```

### Auth errors

| Status | Cause |
|---|---|
| `401` | Missing or invalid access token |
| `403` | Authenticated but role is not `admin` |

---

## Environment Variables

### Auth module

| Variable | Purpose | Default |
|---|---|---|
| `JWT_SECRET` | JWT signing secret | — |
| `COOKIE_SECRET` | Cookie plugin secret | — |
| `AUTH_ACCESS_TTL_SECONDS` | Access token TTL (seconds) | `900` |
| `AUTH_REFRESH_TTL_SECONDS` | Refresh token TTL (seconds) | `604800` |
| `AUTH_COOKIE_SAMESITE` | Cookie SameSite flag (`lax` or anything else → `none`) | `none` |
| `NODE_ENV` | When `lax` mode: controls `Secure` flag | — |
| `FRONTEND_BASE_URL` | Base URL for password reset link in email | `http://localhost:3000` |

### CareValidate portal auth

| Variable | Purpose |
|---|---|
| `CV_BASE_URL` | CareValidate API base URL |
| `CV_API_KEY` | CareValidate API key (sent as `cv-api-key` header) |

### Worker (email delivery)

| Variable | Purpose |
|---|---|
| `REDIS_URL` | BullMQ queue connection |
| `GMAIL_USER` | Gmail sender account |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `MAIL_FROM` | Optional sender override |

---

## Database Tables

| Table | Purpose |
|---|---|
| `auth_user` | User accounts |
| `auth_session` | Refresh sessions (one per login; rotated on refresh) |
| `auth_password_reset` | Hashed password-reset tokens |
| `auth_external_token` | CareValidate portal access + refresh tokens (per user, per provider) |
| `auth_audit_log` | Audit log (schema present, not yet written by current routes) |
